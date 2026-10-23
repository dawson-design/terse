// The blind judge's prompt and verdicts, and the scoring that follows.
import { describe, it, expect } from 'vitest';
import { CRITERIA, blind, buildJudgePrompt, parseVerdict, reconcile, toArms } from '../../scripts/eval/judge.mjs';
import { acceptance, exitCode, pairInvalidReason, signTest, tallyCase, wilson } from '../../scripts/eval/score.mjs';

const flat = (n) => Object.fromEntries(CRITERIA.map((name) => [name, n]));
const verdict = (winner, a = 4, b = 3) => ({ scores: { A: flat(a), B: flat(b) }, winner, reason: 'r' });

describe('judge prompt', () => {
	const caseDef = { docLabel: 'email', judge: { reader: 'Maria', questions: ['Is the ask first?'] } };
	const prompt = buildJudgePrompt('{docLabel} for {reader}\n{questions}\n{inputs}\nA: {draftA}\nB: {draftB}\n{request}',
		{ caseDef, request: 'Write it.', inputs: [{ path: 'context.md', text: 'June 18' }], draftA: 'first', draftB: 'second' });

	it('holds the request, the inputs, both drafts, and no arm names', () => {
		expect(prompt).toContain('<file path="context.md">\nJune 18\n</file>');
		expect(prompt).toContain('A: first\nB: second');
		expect(prompt).toContain('- Is the ask first?');
		expect(prompt).not.toMatch(/plugin|bare|terse/i);
	});

	it('masks the plugin name inside a draft', () => {
		expect(blind('Written with Terse.<!-- terse -->')).toEqual({ text: 'Written with [tool].', leak: true });
	});
});

describe('verdicts', () => {
	it('parses structured output, falling back to the result text', () => {
		expect(parseVerdict({ structured_output: verdict('A') }).winner).toBe('A');
		expect(parseVerdict({ result: JSON.stringify(verdict('tie')) }).winner).toBe('tie');
	});

	it('rejects a missing winner or an out-of-range score', () => {
		expect(() => parseVerdict({ structured_output: { ...verdict('A'), winner: 'C' } })).toThrow();
		expect(() => parseVerdict({ structured_output: verdict('A', 6) })).toThrow(/bad score/);
	});

	it('maps labels to arms in either order', () => {
		expect(toArms(verdict('A', 5, 2), 'A')).toMatchObject({ winner: 'plugin', scores: { plugin: flat(5), bare: flat(2) } });
		expect(toArms(verdict('A', 5, 2), 'B')).toMatchObject({ winner: 'bare', scores: { plugin: flat(2), bare: flat(5) } });
	});

	const arms = (winner) => ({ winner, scores: { plugin: flat(4), bare: flat(2) }, reason: winner });
	it.each([
		['plugin', 'plugin', 'plugin', true], ['bare', 'bare', 'bare', true], ['tie', 'tie', 'tie', true],
		['plugin', 'bare', 'tie', false], ['bare', 'plugin', 'tie', false], ['plugin', 'tie', 'tie', false],
		['tie', 'plugin', 'tie', false], ['bare', 'tie', 'tie', false], ['tie', 'bare', 'tie', false],
	])('reconciles %s then %s as %s', (first, second, winner, consistent) => {
		expect(reconcile(arms(first), arms(second))).toMatchObject({ winner, consistent });
	});
});

describe('statistics', () => {
	it('computes the one-sided sign test', () => {
		expect(signTest(10, 10)).toBeCloseTo(1 / 1024);
		expect(signTest(0, 7)).toBe(1);
		expect(signTest(6, 7)).toBeCloseTo(8 / 128);
	});

	it('gives a Wilson interval around the observed rate', () => {
		const [low, high] = wilson(19, 24);
		expect(low).toBeGreaterThan(0.55);
		expect(high).toBeLessThan(0.95);
	});
});

const session = (overrides = {}) => ({
	status: 'ok', model: 'm', plugins: [], skills: [], skillsInvoked: [], voiceLeak: false,
	memory: { hooksRan: true, loads: [] }, deliverable: { words: 100 }, costUsd: 0.5,
	checks: { structure: { pass: true }, budget: { pass: true }, facts: { pass: true }, claudisms: { count: 0 } },
	...overrides,
});
const pluginSession = (overrides = {}) => session({ plugins: ['terse@inline'], skills: ['terse:email'],
	skillsInvoked: ['terse:email'], ...overrides });
const pair = (winner, run = 1, plugin = pluginSession()) => ({ run, plugin, bare: session(), judge: { winner, consistent: true,
	scores: { plugin: flat(4), bare: flat(3) }, reasons: [] } });

describe('pair validity', () => {
	it('accepts an isolated, comparable pair', () => {
		expect(pairInvalidReason(pair('plugin'), 'email')).toBeNull();
	});

	it.each([
		[{ plugin: pluginSession({ status: 'transient' }) }, /session/],
		[{ plugin: pluginSession({ memory: { hooksRan: true, loads: [{ path: 'CLAUDE.md' }] } }) }, /memory/],
		[{ bare: session({ memory: { hooksRan: false, loads: [] } }) }, /hooks/],
		[{ bare: session({ plugins: ['terse@synced'] }) }, /bare arm loaded/],
		[{ plugin: pluginSession({ voiceLeak: true }) }, /personal voice/],
		[{ bare: session({ model: 'other' }) }, /different models/],
	])('rejects a pair when %j', (overrides, reason) => {
		expect(pairInvalidReason({ ...pair('plugin'), ...overrides }, 'email')).toMatch(reason);
	});
});

describe('acceptance', () => {
	const results = (pairsPerCase, quick = false) => ({
		quick, runsPerCase: pairsPerCase[0].length, preflight: { pass: true },
		cases: pairsPerCase.map((pairs, i) => ({ id: `c${i}`, docType: 'email', pairs })),
	});
	const judge = (r) => { const t = r.cases.map(tallyCase); return { tallies: t, rules: acceptance(r, t) }; };

	it('passes when the plugin wins most decisive pairs in every case', () => {
		const r = results(Array.from({ length: 7 }, () => [pair('plugin', 1), pair('plugin', 2), pair('tie', 3)]));
		const { rules } = judge(r);
		expect(exitCode(rules)).toBe(0);
	});

	it('fails rule 3 when a case has no plugin win, and rule 6 when the plugin has more claudisms', () => {
		const tells = pluginSession({ checks: { ...session().checks, claudisms: { count: 2 } } });
		const r = results([...Array.from({ length: 6 }, () => [pair('plugin', 1), pair('plugin', 2)]),
			[pair('bare', 1, tells), pair('tie', 2)]]);
		const { rules } = judge(r);
		expect(rules.find((x) => x.rule.startsWith('3.'))).toMatchObject({ pass: false, detail: 'c6' });
		expect(rules.find((x) => x.rule.startsWith('6.'))).toMatchObject({ pass: false, detail: 'c6' });
		expect(exitCode(rules)).toBe(1);
	});

	it('treats pairwise rules as a readout on a quick run', () => {
		const r = results(Array.from({ length: 7 }, () => [pair('bare', 1)]), true);
		const { rules } = judge(r);
		expect(rules.find((x) => x.rule.startsWith('2.')).readout).toBe(true);
		expect(exitCode(rules)).toBe(0);
	});

	it('is invalid when an expected case has no pairs', () => {
		const r = { ...results(Array.from({ length: 2 }, () => [pair('plugin', 1)])), expectedCases: ['c0', 'c1', 'c2'] };
		const { rules } = judge(r);
		expect(rules.find((x) => x.rule.includes('per case'))).toMatchObject({ pass: false, detail: 'c2' });
		expect(exitCode(rules)).toBe(2);
	});

	it('is invalid when a pair is invalid', () => {
		const r = results(Array.from({ length: 7 }, () => [{ ...pair('plugin'), invalid: 'a memory file loaded' }]));
		expect(exitCode(judge(r).rules)).toBe(2);
	});
});
