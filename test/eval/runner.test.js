// The runner's orchestration: arguments, which pairs remain, the worker pool,
// retries, the plugin snapshot, and saved drafts.
import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, pendingPairs, pool, resumeChecks, withRetries } from '../../scripts/eval.mjs';
import { saveSession, snapshotPlugin } from '../../scripts/eval/workspace.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

describe('arguments', () => {
	it('reads flags and records which were given', () => {
		const opts = parseArgs(['run', '--runs', '5', '--case', 'adr,email', '--concurrency', '2']);
		expect(opts).toMatchObject({ command: 'run', runs: 5, cases: ['adr', 'email'], concurrency: 2 });
		expect(opts.explicit.has('--runs')).toBe(true);
	});

	it.each([['--runs', '0'], ['--concurrency', 'abc'], ['--runs', '1.5']])('rejects %s %s', (flag, value) => {
		expect(() => parseArgs(['run', flag, value])).toThrow(/positive integer/);
	});
});

describe('pending pairs', () => {
	const cases = [{ id: 'adr' }, { id: 'email' }];

	it('interleaves runs across cases', () => {
		const order = pendingPairs(cases, { cases: [] }, 2).map(([c, run]) => `${c.id}:${run}`);
		expect(order).toEqual(['adr:1', 'email:1', 'adr:2', 'email:2']);
	});

	it('skips finished pairs but reruns one whose session failed', () => {
		const results = { cases: [
			{ id: 'adr', pairs: [{ run: 1 }, { run: 2, invalid: 'session rate-limit/ok' }] },
			{ id: 'email', pairs: [{ run: 1, invalid: 'judge failed twice: x' }] },
		] };
		expect(pendingPairs(cases, results, 2).map(([c, run]) => `${c.id}:${run}`)).toEqual(['adr:2', 'email:2']);
	});
});

describe('pool', () => {
	it('stops taking new work after a failure and lets running work finish', async () => {
		const started = [];
		const finished = [];
		const work = pool([1, 2, 3, 4], 2, async (n) => {
			started.push(n);
			if (n === 1) throw new Error('auth');
			await new Promise((resolve) => setTimeout(resolve, 10));
			finished.push(n);
		});
		await expect(work).rejects.toThrow('auth');
		expect(started).toEqual([1, 2]);
		expect(finished).toEqual([2]);
	});
});

describe('retries', () => {
	const attempt = (status) => ({ status, events: [] });
	const run = (statuses) => { const queue = [...statuses]; return async () => attempt(queue.shift()); };
	const noWait = async () => {};

	it('retries a rate limit and returns the next good attempt', async () => {
		const ctx = { retries: 0 };
		const outcome = await withRetries(run(['rate-limit', 'ok']), 'x', ctx, noWait);
		expect(outcome).toMatchObject({ attempts: 2, attempt: { status: 'ok' } });
		expect(ctx.retries).toBe(1);
	});

	it('gives up after the last retry of a crash with no output', async () => {
		const outcome = await withRetries(run(['transient', 'transient', 'transient']), 'x', { retries: 0 }, noWait);
		expect(outcome).toMatchObject({ attempts: 3, attempt: { status: 'transient' } });
	});

	it('stops the run when every retry is rate limited', async () => {
		await expect(withRetries(run(['rate-limit', 'rate-limit', 'rate-limit']), 'x', { retries: 0 }, noWait))
			.rejects.toThrow(/still rate limited/);
	});

	it('aborts on auth and never retries a turn or budget limit', async () => {
		await expect(withRetries(run(['auth']), 'x', { retries: 0 }, noWait)).rejects.toThrow(/not signed in/);
		expect((await withRetries(run(['over-budget']), 'x', { retries: 0 }, noWait)).attempts).toBe(1);
	});
});

describe('resume', () => {
	const saved = { genModel: 'claude-opus-5-5', genEffort: null, runsPerCase: 5, expectedCases: ['email'],
		plugin: { hash: 'p1' }, evalsHash: 'e1', cliVersion: '2.1.309' };
	const current = { pluginHash: 'p1', evalsHash: 'e1', cliVersion: '2.1.309' };

	it('takes the cases, runs, model, and effort from the saved run', () => {
		expect(resumeChecks(parseArgs(['run']), saved, current))
			.toMatchObject({ model: 'claude-opus-5-5', genEffort: null, runs: 5, cases: ['email'] });
	});

	it.each([
		[['--model', 'claude-sonnet-5-5'], /--model/], [['--case', 'adr'], /--case/], [['--runs', '1'], /--runs/],
	])('refuses a different %j', (flags, message) => {
		expect(() => resumeChecks(parseArgs(['run', ...flags]), saved, current)).toThrow(message);
	});

	it.each([
		[{ pluginHash: 'p2' }, /plugin changed/], [{ evalsHash: 'e2' }, /eval files changed/],
		[{ cliVersion: '2.1.310' }, /Claude Code version changed/],
	])('refuses to continue when %j', (change, message) => {
		expect(() => resumeChecks(parseArgs(['run']), saved, { ...current, ...change })).toThrow(message);
	});
});

describe('plugin snapshot', () => {
	it('copies what the host loads, leaves out the evals, and hashes the copy', () => {
		const first = snapshotPlugin(ROOT);
		const second = snapshotPlugin(ROOT);
		expect(existsSync(join(first.dir, 'skills', 'adr', 'SKILL.md'))).toBe(true);
		expect(existsSync(join(first.dir, 'scripts', 'claudisms.mjs'))).toBe(true);
		expect(existsSync(join(first.dir, 'references', 'principles.md'))).toBe(true);
		expect(existsSync(join(first.dir, 'evals'))).toBe(false);
		expect(first.hash).toBe(second.hash);
	});

	it('holds every <terse-root> path a skill or reference names', () => {
		const { dir } = snapshotPlugin(ROOT);
		const files = [...readdirSync(join(ROOT, 'skills')).map((s) => join(ROOT, 'skills', s, 'SKILL.md')),
			...readdirSync(join(ROOT, 'references')).map((r) => join(ROOT, 'references', r))];
		for (const file of files) {
			for (const [, path] of readFileSync(file, 'utf8').matchAll(/<terse-root>\/([\w./-]+[\w])/g)) {
				expect(existsSync(join(dir, path)), `${file} names ${path}`).toBe(true);
			}
		}
	});
});

describe('saved sessions', () => {
	it('drop an older draft when the new session wrote none', () => {
		const runDir = mkdtempSync(join(tmpdir(), 'terse-run-'));
		const where = { caseId: 'email', run: 1, arm: 'plugin' };
		saveSession(runDir, where, { deliverable: 'old draft', stdout: '', hookLog: '' });
		const dir = saveSession(runDir, where, { deliverable: null, stdout: '', hookLog: '' });
		expect(existsSync(join(dir, 'deliverable.md'))).toBe(false);
	});
});
