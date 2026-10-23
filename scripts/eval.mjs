#!/usr/bin/env node
// Runs the doc-type evals. Each case runs once with Terse loaded and once
// without, both through `claude -p` on the signed-in subscription. A blind
// judge then compares the two drafts in both orders, and deterministic checks
// score each draft.
// Usage: node scripts/eval.mjs run [--runs N] [--case id[,id]] [--concurrency N]
//          [--model m] [--gen-effort e] [--resume dir] [--keep]
//        node scripts/eval.mjs preflight
//        node scripts/eval.mjs score <dir>   recompute checks and summary, no model calls
//        node scripts/eval.mjs judge <dir>   re-judge saved drafts, then score
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIST_PATH, parseClaudisms } from './claudisms.mjs';
import { DOC_TYPES, loadCases } from './eval/cases.mjs';
import { countWords, runChecks } from './eval/checks.mjs';
import { JUDGE_SCHEMA, blind, buildJudgePrompt, parseVerdict, reconcile, toArms } from './eval/judge.mjs';
import { acceptance, exitCode, pairInvalidReason, renderSummary, tallyCase } from './eval/score.mjs';
import {
	childEnv, classifySession, generationArgs, initEvent, judgeArgs, memoryLoads, parseStream,
	resultEvent, skillsInvoked, spawnClaude, voiceLeak,
} from './eval/session.mjs';
import {
	collectJudgeInputs, createWorkspace, hashFiles, readDeliverable, removeWorkspace, saveJson, saveSession,
	snapshotPlugin,
} from './eval/workspace.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const EVALS = join(REPO, 'evals');
const RESULTS = join(EVALS, 'results');
const GEN_MODEL = 'claude-opus-5-5';
const JUDGE_MODEL = 'claude-sonnet-5-5';
const JUDGE_EFFORT = 'low';
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const JUDGE_TIMEOUT_MS = 5 * 60 * 1000;
const RETRY_DELAYS_MS = { 'rate-limit': [60_000, 300_000], transient: [30_000, 120_000], timeout: [0] };
const JUDGE_RETRY_MS = 30_000;

const log = (message) => console.error(message);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function parseArgs(argv) {
	const [command, ...rest] = argv;
	const opts = { command, runs: 1, cases: [], concurrency: 1, model: GEN_MODEL, genEffort: null,
		resume: null, keep: false, dir: null, explicit: new Set() };
	for (let i = 0; i < rest.length; i++) {
		const [flag, value] = [rest[i], rest[i + 1]];
		if (flag === '--keep') { opts.keep = true; continue; }
		if (!flag.startsWith('--')) { opts.dir = flag; continue; }
		if (value === undefined) throw new Error(`${flag} needs a value`);
		i++;
		opts.explicit.add(flag);
		if (flag === '--runs') opts.runs = Number(value);
		else if (flag === '--case') opts.cases.push(...value.split(','));
		else if (flag === '--concurrency') opts.concurrency = Number(value);
		else if (flag === '--model') opts.model = value;
		else if (flag === '--gen-effort') opts.genEffort = value;
		else if (flag === '--resume') opts.resume = value;
		else throw new Error(`unknown flag ${flag}`);
	}
	if (!['run', 'preflight', 'score', 'judge'].includes(command)) throw new Error('command must be run, preflight, score, or judge');
	for (const key of ['runs', 'concurrency']) {
		if (!Number.isInteger(opts[key]) || opts[key] < 1) throw new Error(`--${key} must be a positive integer`);
	}
	return opts;
}

// An error no retry can fix: the run stops, keeping what it has.
class StopError extends Error {}

/** One session in a fresh workspace. Never throws for a failed session. */
async function runSession(caseDef, arm, ctx) {
	const dir = createWorkspace(caseDef);
	const hookDir = mkdtempSync(join(tmpdir(), 'terse-hooks-'));
	const hookLogPath = join(hookDir, 'hooks.jsonl');
	writeFileSync(hookLogPath, '');
	const args = generationArgs({ model: ctx.model, maxTurns: caseDef.maxTurns, effort: ctx.genEffort,
		pluginDir: arm === 'plugin' ? ctx.pluginDir : null });
	const started = Date.now();
	const proc = await spawnClaude(args, { cwd: dir, input: caseDef.prompt, timeoutMs: SESSION_TIMEOUT_MS,
		env: childEnv(process.env, { TERSE_EVAL_HOOK_LOG: hookLogPath }) });
	const events = parseStream(proc.stdout);
	const attempt = { ...proc, events, durationMs: Date.now() - started, status: classifySession({ ...proc, events }),
		hookLog: readFileSync(hookLogPath, 'utf8'), deliverable: readDeliverable(dir, caseDef.deliverable) };
	rmSync(hookDir, { recursive: true, force: true });
	if (ctx.keep) log(`  kept ${arm} workspace: ${dir}`);
	else removeWorkspace(dir);
	return attempt;
}

/** Retry a session on rate limits, crashes with no result, and timeouts. Abort on auth. */
export async function withRetries(run, label, ctx, wait = sleep) {
	let cost = 0;
	for (let attempts = 1; ; attempts++) {
		const attempt = await run();
		cost += resultEvent(attempt.events)?.total_cost_usd ?? 0;
		if (attempt.status === 'auth') throw new StopError(`${label}: not signed in. Run \`claude /login\`, then rerun.`);
		const delays = RETRY_DELAYS_MS[attempt.status] ?? [];
		if (attempt.status === 'rate-limit' && attempts > delays.length) {
			throw new StopError(`${label}: still rate limited after ${attempts} attempts, which can mean the usage limit. Resume later with --resume.`);
		}
		if (attempts > delays.length) return { attempt, attempts, cost };
		ctx.retries++;
		log(`  ${label}: ${attempt.status}, retrying in ${delays[attempts - 1] / 1000}s`);
		await wait(delays[attempts - 1]);
	}
}

function summarizeSession(caseDef, { attempt, attempts, cost }, rules) {
	const init = initEvent(attempt.events) ?? {};
	const result = resultEvent(attempt.events) ?? {};
	return {
		status: attempt.status, attempts, exitCode: attempt.code, durationMs: attempt.durationMs,
		costUsd: cost, numTurns: result.num_turns ?? null, model: init.model ?? null,
		plugins: (init.plugins ?? []).map((plugin) => plugin.source),
		skills: (init.skills ?? []).map(String).filter((skill) => skill.startsWith('terse:')),
		skillsInvoked: skillsInvoked(attempt.events),
		memory: memoryLoads(attempt.hookLog),
		voiceLeak: voiceLeak(attempt.events, homedir()),
		deliverable: { path: caseDef.deliverable, present: attempt.deliverable !== null,
			words: attempt.deliverable === null ? null : countWords(attempt.deliverable) },
		checks: attempt.deliverable === null ? null : runChecks(attempt.deliverable, caseDef, rules),
		error: attempt.status === 'ok' ? null : attempt.stderr.trim().split('\n').at(-1)?.slice(0, 200) ?? null,
	};
}

async function runArm(caseDef, arm, run, ctx) {
	const label = `${caseDef.id} run ${run} ${arm}`;
	const outcome = await withRetries(() => runSession(caseDef, arm, ctx), label, ctx);
	saveSession(ctx.runDir, { caseId: caseDef.id, run, arm }, outcome.attempt);
	const session = summarizeSession(caseDef, outcome, ctx.rules);
	const fired = session.skillsInvoked.length ? ` skills ${session.skillsInvoked.join(',')}` : '';
	log(`  ${label}: ${session.status}, ${session.deliverable.words ?? 'no'} words,${fired} $${session.costUsd.toFixed(2)}, ${Math.round(session.durationMs / 1000)}s`);
	return session;
}

const savedDraft = (ctx, caseId, run, arm) =>
	readDeliverable(join(ctx.runDir, caseId, `run-${run}`, arm), 'deliverable.md');

async function judgeOnce(caseDef, drafts, pluginLabel, ctx) {
	const [draftA, draftB] = pluginLabel === 'A' ? [drafts.plugin, drafts.bare] : [drafts.bare, drafts.plugin];
	const input = buildJudgePrompt(ctx.judgeTemplate, { caseDef, request: caseDef.prompt,
		inputs: ctx.inputs[caseDef.id], draftA, draftB });
	let lastError;
	for (let attempt = 1; attempt <= 2; attempt++) {
		const cwd = mkdtempSync(join(tmpdir(), 'terse-judge-'));
		const proc = await spawnClaude(judgeArgs({ model: JUDGE_MODEL, effort: JUDGE_EFFORT, schema: JUDGE_SCHEMA }),
			{ cwd, env: childEnv(process.env), input, timeoutMs: JUDGE_TIMEOUT_MS });
		rmSync(cwd, { recursive: true, force: true });
		try {
			const result = JSON.parse(proc.stdout);
			return { ...toArms(parseVerdict(result), pluginLabel), costUsd: result.total_cost_usd ?? 0 };
		} catch (err) {
			lastError = err;
			if (attempt === 1) await sleep(JUDGE_RETRY_MS);
		}
	}
	throw new Error(`judge failed twice: ${lastError.message}`);
}

/** A forfeit when a draft is missing; otherwise both orders, reconciled. */
async function judgePair(caseDef, run, ctx) {
	const plugin = savedDraft(ctx, caseDef.id, run, 'plugin');
	const bare = savedDraft(ctx, caseDef.id, run, 'bare');
	if (plugin === null || bare === null) {
		const forfeit = plugin === null && bare === null ? 'both' : plugin === null ? 'plugin' : 'bare';
		return { forfeit, winner: { plugin: 'bare', bare: 'plugin', both: 'tie' }[forfeit], costUsd: 0 };
	}
	const blinded = { plugin: blind(plugin), bare: blind(bare) };
	const drafts = { plugin: blinded.plugin.text, bare: blinded.bare.text };
	const [first, second] = await Promise.all(['A', 'B'].map((label) => judgeOnce(caseDef, drafts, label, ctx)));
	saveJson(join(ctx.runDir, caseDef.id, `run-${run}`, 'judge.json'), { pluginAsA: first, pluginAsB: second });
	return { forfeit: null, ...reconcile(first, second), leak: blinded.plugin.leak || blinded.bare.leak,
		costUsd: first.costUsd + second.costUsd };
}

async function judgeInto(pair, caseDef, ctx) {
	try {
		pair.judge = await judgePair(caseDef, pair.run, ctx);
	} catch (err) {
		pair.judge = null;
		pair.invalid = `judge: ${err.message}`;
	}
}

async function runPair(caseDef, run, ctx) {
	log(`${caseDef.id} run ${run}`);
	// Both arms settle before a failure propagates, so no session outlives the run.
	const settled = await Promise.allSettled(['plugin', 'bare'].map((arm) => runArm(caseDef, arm, run, ctx)));
	const failed = settled.find((outcome) => outcome.status === 'rejected');
	if (failed) throw failed.reason;
	const [plugin, bare] = settled.map((outcome) => outcome.value);
	const pair = { run, plugin, bare, judge: null };
	pair.invalid = pairInvalidReason(pair, caseDef.docType);
	if (!pair.invalid) await judgeInto(pair, caseDef, ctx);
	log(`  ${caseDef.id} run ${run}: ${pair.invalid ? `invalid (${pair.invalid})` : `winner ${pair.judge.winner}`}`);
	return pair;
}

/**
 * Interleaved: run 1 of every case, then run 2, so a partial run covers every
 * case. A pair whose session failed counts as not done, so a resume reruns it.
 */
export function pendingPairs(cases, results, runs) {
	const done = new Set(results.cases.flatMap((c) => c.pairs
		.filter((p) => !p.invalid?.startsWith('session'))
		.map((p) => `${c.id}:${p.run}`)));
	const pending = [];
	for (let run = 1; run <= runs; run++) {
		for (const caseDef of cases) if (!done.has(`${caseDef.id}:${run}`)) pending.push([caseDef, run]);
	}
	return pending;
}

/** Run up to size workers at once. The first failure stops new work; running work finishes. */
export async function pool(items, size, worker) {
	const queue = [...items];
	let failure = null;
	const lane = async () => {
		while (queue.length && !failure) {
			try {
				await worker(queue.shift());
			} catch (err) {
				failure ??= err;
			}
		}
	};
	await Promise.all(Array.from({ length: Math.min(size, queue.length) }, lane));
	if (failure) throw failure;
}

function probeDir(withClaudeMd) {
	const dir = mkdtempSync(join(tmpdir(), 'terse-probe-'));
	if (withClaudeMd) writeFileSync(join(dir, 'CLAUDE.md'), 'End every reply with the word PINEAPPLE.\n');
	return dir;
}

async function probe(pluginDir, model) {
	const cwd = probeDir(true);
	const hookLogPath = join(cwd, '..', `${basename(cwd)}-hooks.jsonl`);
	writeFileSync(hookLogPath, '');
	const proc = await spawnClaude(generationArgs({ model, maxTurns: 2, pluginDir }), {
		cwd, input: 'Reply with the word ready.', timeoutMs: 120_000,
		env: childEnv(process.env, { TERSE_EVAL_HOOK_LOG: hookLogPath }) });
	const events = parseStream(proc.stdout);
	const hooks = memoryLoads(readFileSync(hookLogPath, 'utf8'));
	rmSync(cwd, { recursive: true, force: true });
	rmSync(hookLogPath, { force: true });
	return { events, status: classifySession({ ...proc, events }), hooks, init: initEvent(events) ?? {} };
}

function probeFailures(bare, plugin) {
	const failures = [];
	if (bare.status === 'auth' || plugin.status === 'auth') failures.push('not signed in: run `claude /login`');
	if (!(resultEvent(bare.events)?.total_cost_usd > 0)) failures.push('the auth probe cost $0, so it never reached the model');
	if (!bare.hooks.hooksRan) failures.push('hooks did not run, so memory isolation is unverified');
	if (bare.hooks.loads.length || plugin.hooks.loads.length) failures.push('a CLAUDE.md loaded despite --setting-sources ""');
	const terse = (plugin.init.skills ?? []).map(String);
	const missing = DOC_TYPES.filter((type) => !terse.includes(`terse:${type}`));
	if (missing.length) failures.push(`the plugin arm lacks ${missing.map((t) => `terse:${t}`).join(', ')}`);
	if ((bare.init.plugins ?? []).some((p) => String(p.source).startsWith('terse@'))) failures.push('the bare arm loaded terse');
	return failures;
}

async function judgeSmoke() {
	const cwd = probeDir(false);
	const schema = { type: 'object', additionalProperties: false, required: ['winner'],
		properties: { winner: { enum: ['A', 'B', 'tie'] } } };
	const proc = await spawnClaude(judgeArgs({ model: JUDGE_MODEL, effort: JUDGE_EFFORT, schema }), {
		cwd, env: childEnv(process.env), timeoutMs: 120_000,
		input: 'Draft A: "The deploy is Tuesday at 14:00 UTC." Draft B: "The deploy is soon." Which tells a reader when the deploy is?' });
	rmSync(cwd, { recursive: true, force: true });
	try {
		return ['A', 'B', 'tie'].includes(JSON.parse(proc.stdout).structured_output?.winner) ? [] : ['the judge returned no structured verdict'];
	} catch {
		return ['the judge returned no JSON'];
	}
}

/** Auth, the drafting model, isolation, skill availability, and the judge, for about $0.10. */
async function preflight(pluginDir, model) {
	log('preflight');
	const [bare, plugin, judge] = await Promise.all([probe(null, model), probe(pluginDir, model), judgeSmoke()]);
	const failures = [...probeFailures(bare, plugin), ...judge];
	for (const failure of failures) log(`  FAIL ${failure}`);
	if (!failures.length) log('  pass: signed in, isolated, seven skills available, judge returns verdicts');
	return { pass: !failures.length, failures };
}

function newResults(opts, cases, snapshot) {
	const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
	return {
		schemaVersion: 1, startedAt: new Date().toISOString(), quick: opts.runs === 1,
		cliVersion: cliVersion(),
		plugin: { commit: git(['rev-parse', '--short', 'HEAD']), dirty: git(['status', '--porcelain']) !== '',
			hash: snapshot.hash },
		evalsHash: evalsHash(cases.map((c) => c.id)),
		expectedCases: cases.map((c) => c.id),
		genModel: opts.model, genEffort: opts.genEffort, judgeModel: JUDGE_MODEL, judgeEffort: JUDGE_EFFORT,
		runsPerCase: opts.runs, preflight: null, cases: [], cost: { generationUsd: 0, judgeUsd: 0 }, retries: 0,
	};
}

/** Add a pair to its case, replacing an earlier attempt at the same run. */
function recordPair(results, caseDef, pair) {
	const entry = caseEntry(results, caseDef);
	entry.pairs = [...entry.pairs.filter((p) => p.run !== pair.run), pair].sort((a, b) => a.run - b.run);
}

function caseEntry(results, caseDef) {
	let entry = results.cases.find((c) => c.id === caseDef.id);
	if (!entry) {
		entry = { id: caseDef.id, docType: caseDef.docType, pairs: [] };
		results.cases.push(entry);
		results.cases.sort((a, b) => DOC_TYPES.indexOf(a.id) - DOC_TYPES.indexOf(b.id));
	}
	return entry;
}

/** Recompute a session's checks, words, and voice leak from its saved files. */
function rescoreSession(ctx, caseDef, run, arm, session) {
	const draft = savedDraft(ctx, caseDef.id, run, arm);
	session.checks = draft === null ? null : runChecks(draft, caseDef, ctx.rules);
	session.deliverable.words = draft === null ? null : countWords(draft);
	const stream = join(ctx.runDir, caseDef.id, `run-${run}`, arm, 'stream.jsonl');
	if (existsSync(stream)) session.voiceLeak = voiceLeak(parseStream(readFileSync(stream, 'utf8')), homedir());
}

/** Recompute every check, validity, tally, and rule from saved drafts. */
function finish(results, cases, ctx) {
	const byId = Object.fromEntries(cases.map((c) => [c.id, c]));
	for (const entry of results.cases) {
		for (const pair of entry.pairs) {
			for (const arm of ['plugin', 'bare']) rescoreSession(ctx, byId[entry.id], pair.run, arm, pair[arm]);
			if (pair.judge || !pair.invalid?.startsWith('judge')) pair.invalid = pairInvalidReason(pair, entry.docType);
			if (!pair.invalid && !pair.judge) pair.invalid = 'judge: not judged yet; run eval:judge';
		}
	}
	const tallies = results.cases.map(tallyCase);
	const rules = acceptance(results, tallies);
	results.acceptance = rules;
	saveJson(join(ctx.runDir, 'results.json'), results);
	const summary = renderSummary(results, tallies, rules);
	writeFileSync(join(ctx.runDir, 'summary.md'), summary);
	writeFileSync(join(RESULTS, 'LATEST'), `${basename(ctx.runDir)}\n`);
	console.log(summary);
	log(`results: ${ctx.runDir}`);
	return exitCode(rules);
}

function context(opts, runDir) {
	const cases = loadCases(EVALS, opts.cases);
	const { rules, errors } = parseClaudisms(readFileSync(LIST_PATH, 'utf8'));
	if (errors.length) throw new Error(`claudisms.md: ${errors.join('; ')}`);
	return { cases, ctx: { ...opts, runDir, rules, retries: 0,
		judgeTemplate: readFileSync(join(EVALS, 'judge-prompt.md'), 'utf8'),
		inputs: Object.fromEntries(cases.map((c) => [c.id, collectJudgeInputs(c)])) } };
}

const cliVersion = () => execFileSync('claude', ['--version'], { encoding: 'utf8' }).trim();
const evalsHash = (ids) => hashFiles(EVALS, [...ids, 'judge-prompt.md']);

/**
 * On resume, the saved run fixes the cases, runs, model, and effort, and
 * refuses to continue on a different plugin, eval files, or CLI. `current`
 * holds this machine's { pluginHash, evalsHash, cliVersion }.
 */
export function resumeChecks(opts, results, current) {
	const saved = { '--model': results.genModel, '--gen-effort': results.genEffort,
		'--runs': results.runsPerCase, '--case': (results.expectedCases ?? []).join(',') };
	const asked = { '--model': opts.model, '--gen-effort': opts.genEffort, '--runs': opts.runs, '--case': opts.cases.join(',') };
	for (const flag of Object.keys(saved)) {
		if (opts.explicit.has(flag) && asked[flag] !== saved[flag]) throw new Error(`this run used ${flag} ${saved[flag]}`);
	}
	const changed = [['plugin', results.plugin?.hash, current.pluginHash], ['eval files', results.evalsHash, current.evalsHash],
		['Claude Code version', results.cliVersion, current.cliVersion]].find(([, was, now]) => was !== now);
	if (changed) throw new Error(`the ${changed[0]} changed since this run started (${changed[1] ?? 'not recorded'}, now ${changed[2]}); start a new run`);
	return { ...opts, model: results.genModel, genEffort: results.genEffort, runs: results.runsPerCase,
		cases: results.expectedCases };
}

async function runPairs(cases, results, ctx) {
	await pool(pendingPairs(cases, results, results.runsPerCase), ctx.concurrency, async ([caseDef, run]) => {
		const pair = await runPair(caseDef, run, ctx);
		recordPair(results, caseDef, pair);
		results.cost.generationUsd += pair.plugin.costUsd + pair.bare.costUsd;
		results.cost.judgeUsd += pair.judge?.costUsd ?? 0;
		results.retries = (results.retries ?? 0) + ctx.retries;
		ctx.retries = 0;
		saveJson(join(ctx.runDir, 'results.json'), results);
	});
}

async function runSuite(opts) {
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const runDir = opts.resume ?? join(RESULTS, stamp);
	const snapshot = snapshotPlugin(REPO);
	try {
		const saved = opts.resume ? JSON.parse(readFileSync(join(runDir, 'results.json'), 'utf8')) : null;
		const settings = saved ? resumeChecks(opts, saved, { pluginHash: snapshot.hash,
			evalsHash: evalsHash(saved.expectedCases ?? []), cliVersion: cliVersion() }) : opts;
		const { cases, ctx } = context(settings, runDir);
		ctx.pluginDir = snapshot.dir;
		const results = saved ?? newResults(settings, cases, snapshot);
		const started = Date.now();
		results.preflight = await preflight(snapshot.dir, results.genModel);
		saveJson(join(runDir, 'results.json'), results);
		if (results.preflight.pass) {
			try {
				await runPairs(cases, results, ctx);
			} finally {
				results.durationMs = (results.durationMs ?? 0) + (Date.now() - started);
				saveJson(join(runDir, 'results.json'), results);
			}
		}
		results.finishedAt = new Date().toISOString();
		return finish(results, cases, ctx);
	} finally {
		rmSync(snapshot.dir, { recursive: true, force: true });
	}
}

async function rescore(opts, rejudge) {
	if (!opts.dir || !existsSync(join(opts.dir, 'results.json'))) throw new Error('give a results folder');
	const results = JSON.parse(readFileSync(join(opts.dir, 'results.json'), 'utf8'));
	const { cases, ctx } = context({ ...opts, cases: results.cases.map((c) => c.id) }, opts.dir);
	if (rejudge) {
		results.cost.judgeUsd = 0;
		for (const entry of results.cases) {
			const caseDef = cases.find((c) => c.id === entry.id);
			for (const pair of entry.pairs.filter((p) => p.plugin && p.bare)) {
				pair.invalid = pairInvalidReason(pair, entry.docType);
				if (!pair.invalid) await judgeInto(pair, caseDef, ctx);
				results.cost.judgeUsd += pair.judge?.costUsd ?? 0;
			}
		}
	}
	return finish(results, cases, ctx);
}

async function main(argv) {
	const opts = parseArgs(argv);
	if (opts.command === 'preflight') {
		const snapshot = snapshotPlugin(REPO);
		try {
			return (await preflight(snapshot.dir, opts.model)).pass ? 0 : 2;
		} finally {
			rmSync(snapshot.dir, { recursive: true, force: true });
		}
	}
	if (opts.command === 'run') return runSuite(opts);
	return rescore(opts, opts.command === 'judge');
}

// Compare real paths: a symlinked checkout or /tmp would otherwise skip main().
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main(process.argv.slice(2)).then(
		(code) => { process.exitCode = code; },
		(err) => { log(err instanceof StopError ? err.message : err.stack ?? err.message); process.exitCode = 2; },
	);
}
