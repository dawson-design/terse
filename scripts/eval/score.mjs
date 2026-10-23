// Tallies, statistics, the acceptance bar, and the Markdown summary. Pure.
import { CRITERIA } from './judge.mjs';

const FAILED = new Set(['auth', 'rate-limit', 'transient', 'timeout']);
// 5 of the 7 cases; a run of fewer cases needs the same share.
const SHARE_TO_WIN = 5 / 7;

/** Why a pair can't count, or null when it can. */
export function pairInvalidReason(pair, docType) {
	const { plugin, bare } = pair;
	if (FAILED.has(plugin.status) || FAILED.has(bare.status)) return `session ${plugin.status}/${bare.status}`;
	if (!plugin.memory.hooksRan || !bare.memory.hooksRan) return 'hooks did not run';
	if (plugin.memory.loads.length || bare.memory.loads.length) return 'a memory file loaded';
	if (!plugin.plugins.includes('terse@inline')) return 'plugin arm did not load terse';
	if (bare.plugins.some((p) => p.startsWith('terse@'))) return 'bare arm loaded terse';
	if (!plugin.skills.includes(`terse:${docType}`)) return `terse:${docType} not available`;
	if (plugin.voiceLeak) return 'plugin arm read the personal voice';
	if (plugin.model !== bare.model) return 'arms used different models';
	return null;
}

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
const fired = (session, docType) => session.skillsInvoked.some((s) => s === docType || s === `terse:${docType}`);

export function tallyCase({ docType, pairs }) {
	const valid = pairs.filter((pair) => !pair.invalid);
	const judged = valid.filter((pair) => pair.judge && !pair.judge.forfeit);
	const passing = (key) => valid.filter((pair) => pair.plugin.checks?.[key]?.pass).length;
	return {
		valid: valid.length,
		pluginWins: valid.filter((pair) => pair.judge?.winner === 'plugin').length,
		ties: valid.filter((pair) => pair.judge?.winner === 'tie').length,
		bareWins: valid.filter((pair) => pair.judge?.winner === 'bare').length,
		consistent: judged.filter((pair) => pair.judge.consistent).length,
		judged: judged.length,
		criteria: Object.fromEntries(CRITERIA.map((name) => [name, {
			plugin: mean(judged.map((pair) => pair.judge.scores.plugin[name])),
			bare: mean(judged.map((pair) => pair.judge.scores.bare[name])),
		}])),
		structurePass: passing('structure'),
		budgetPass: passing('budget'),
		factsPass: passing('facts'),
		claudisms: {
			plugin: valid.reduce((n, pair) => n + (pair.plugin.checks?.claudisms.count ?? 0), 0),
			bare: valid.reduce((n, pair) => n + (pair.bare.checks?.claudisms.count ?? 0), 0),
		},
		words: {
			plugin: mean(valid.map((pair) => pair.plugin.deliverable.words).filter(Number.isFinite)),
			bare: mean(valid.map((pair) => pair.bare.deliverable.words).filter(Number.isFinite)),
		},
		skillFired: valid.filter((pair) => fired(pair.plugin, docType)).length,
	};
}

/** One-sided P(X >= k) for X ~ Binomial(n, 1/2). */
export function signTest(k, n) {
	let p = 0;
	let coefficient = 1;
	for (let i = 0; i <= n; i++) {
		if (i >= k) p += coefficient;
		coefficient = (coefficient * (n - i)) / (i + 1);
	}
	return n === 0 ? 1 : p / 2 ** n;
}

/** Wilson 95% interval for k successes in n trials. */
export function wilson(k, n, z = 1.96) {
	if (n === 0) return [0, 1];
	const p = k / n;
	const denominator = 1 + (z * z) / n;
	const center = (p + (z * z) / (2 * n)) / denominator;
	const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
	return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

function rule(name, pass, detail) {
	return { rule: name, pass, detail };
}

function validityRules(results, tallies) {
	const invalid = results.cases.flatMap((c) => c.pairs.filter((p) => p.invalid)
		.map((p) => `${c.id} run ${p.run}: ${p.invalid}`));
	const expected = results.expectedCases ?? results.cases.map((c) => c.id);
	const validPairs = (id) => tallies[results.cases.findIndex((c) => c.id === id)]?.valid ?? 0;
	const short = expected.filter((id) => validPairs(id) < results.runsPerCase);
	return [
		rule('validity: preflight passed', results.preflight?.pass === true, results.preflight?.failures?.join('; ') ?? ''),
		rule(`validity: ${results.runsPerCase} valid pair(s) per case`, !short.length, short.join(', ')),
		rule('validity: every pair isolated and comparable', !invalid.length, invalid.join('; ')),
	];
}

function qualityRules(results, tallies) {
	const ids = results.cases.map((c) => c.id);
	const notFired = ids.filter((id, i) => tallies[i].skillFired < tallies[i].valid);
	const winning = ids.filter((id, i) => tallies[i].pluginWins >= tallies[i].bareWins);
	const needed = Math.ceil(SHARE_TO_WIN * ids.length);
	const zeroWins = ids.filter((id, i) => tallies[i].pluginWins === 0);
	const wins = tallies.reduce((n, t) => n + t.pluginWins, 0);
	const decisive = wins + tallies.reduce((n, t) => n + t.bareWins, 0);
	const p = signTest(wins, decisive);
	const failing = ids.filter((id, i) => ['structurePass', 'budgetPass', 'factsPass']
		.some((key) => tallies[i][key] < tallies[i].valid));
	const tellier = ids.filter((id, i) => tallies[i].claudisms.plugin > tallies[i].claudisms.bare);
	return [
		rule('1. the skill fired on every plugin run', !notFired.length, notFired.join(', ')),
		rule(`2. plugin wins >= bare wins on ${needed} of ${ids.length} cases`, winning.length >= needed, `${winning.length} cases`),
		rule('3. no case with zero plugin wins', !zeroWins.length, zeroWins.join(', ')),
		rule('4. sign test on decisive pairs, p < 0.05', p < 0.05, `plugin ${wins} of ${decisive}, p = ${p.toFixed(3)}`),
		rule('5. structure, budget, and facts pass on every plugin output', !failing.length, failing.join(', ')),
		rule('6. plugin claudisms <= bare in every case', !tellier.length, tellier.join(', ')),
	];
}

/** The bar. A quick run gates validity and rules 1, 5, and 6; the rest are a readout. */
export function acceptance(results, tallies) {
	const quality = qualityRules(results, tallies)
		.map((r) => (results.quick && !/^[156]\./.test(r.rule) ? { ...r, readout: true } : r));
	return [...validityRules(results, tallies), ...quality];
}

/** 0 pass, 1 quality failure, 2 invalid run. Readout rules never fail a run. */
export function exitCode(rules) {
	if (rules.some((r) => r.rule.startsWith('validity') && !r.pass)) return 2;
	return rules.some((r) => !r.pass && !r.readout) ? 1 : 0;
}

const fmt = (n, digits = 1) => (n === null || n === undefined ? 'n/a' : Number(n).toFixed(digits));
const duration = (ms = 0) => (ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${Math.round(ms / 60_000)} min`);

function caseRow(c, t) {
	return `| ${c.id} | ${t.pluginWins} | ${t.ties} | ${t.bareWins} | ${t.consistent}/${t.judged} | ` +
		`${t.structurePass}/${t.valid} | ${t.budgetPass}/${t.valid} | ${t.factsPass}/${t.valid} | ` +
		`${fmt(t.words.plugin, 0)} / ${fmt(t.words.bare, 0)} | ${t.claudisms.plugin} / ${t.claudisms.bare} | ${t.skillFired}/${t.valid} |`;
}

function criteriaTable(tallies) {
	const rows = CRITERIA.map((name) => {
		const plugin = mean(tallies.map((t) => t.criteria[name].plugin).filter((v) => v !== null));
		const bare = mean(tallies.map((t) => t.criteria[name].bare).filter((v) => v !== null));
		const diff = plugin === null || bare === null ? null : plugin - bare;
		return `| ${name} | ${fmt(plugin, 2)} | ${fmt(bare, 2)} | ${diff === null ? 'n/a' : (diff >= 0 ? '+' : '') + diff.toFixed(2)} |`;
	});
	return ['| Criterion (1-5) | Plugin | Bare | Difference |', '|---|---|---|---|', ...rows].join('\n');
}

function reasonsList(results) {
	return results.cases.flatMap((c) => c.pairs.filter((p) => p.judge && !p.invalid).map((p) =>
		`- ${c.id} run ${p.run}: ${p.judge.forfeit ? `${p.judge.forfeit} forfeited (no deliverable)` : `${p.judge.winner}. ${p.judge.reasons.join(' / ')}`}`));
}

export function renderSummary(results, tallies, rules) {
	const wins = tallies.reduce((n, t) => n + t.pluginWins, 0);
	const decisive = wins + tallies.reduce((n, t) => n + t.bareWins, 0);
	const [low, high] = wilson(wins, decisive);
	const verdict = ['PASS', 'FAIL', 'INVALID'][exitCode(rules)];
	return [
		`# Terse eval, ${results.startedAt}, ${results.runsPerCase} run(s) per case`,
		'',
		`Plugin ${results.plugin.commit}${results.plugin.dirty ? ' (uncommitted changes)' : ''} · generation ${results.genModel} · judge ${results.judgeModel} (${results.judgeEffort}) · Claude Code ${results.cliVersion}`,
		'',
		`Verdict: ${verdict}`,
		'',
		'| Case | Plugin wins | Ties | Bare wins | Same verdict both orders | Structure | Budget | Facts | Words plugin / bare | Claudisms plugin / bare | Skill fired |',
		'|---|---|---|---|---|---|---|---|---|---|---|',
		...results.cases.map((c, i) => caseRow(c, tallies[i])),
		'',
		`Decisive pairs: plugin ${wins} of ${decisive} (95% CI ${fmt(low * 100, 0)}-${fmt(high * 100, 0)}%), sign test p = ${signTest(wins, decisive).toFixed(3)}`,
		'',
		criteriaTable(tallies),
		'',
		'## Acceptance',
		'',
		...rules.map((r) => `- ${r.pass ? 'PASS' : r.readout ? 'READOUT' : 'FAIL'} ${r.rule}${r.detail ? `: ${r.detail}` : ''}`),
		'',
		'## Judge reasons',
		'',
		...reasonsList(results),
		'',
		`Cost $${fmt(results.cost?.generationUsd, 2)} generation, $${fmt(results.cost?.judgeUsd, 2)} judge · ${duration(results.durationMs)} · ${results.retries ?? 0} retried session(s)`,
		'',
	].join('\n');
}
