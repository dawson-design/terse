import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMITTED_RULES, createGrammarPool, normalizeGrammarConfig } from '../scripts/grammar-check.mjs';
import { createDocumentChecker } from '../scripts/style-check.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const styleScript = join(HERE, '..', 'scripts', 'style-check.mjs');
const proseDir = join(HERE, 'fixtures', 'human-prose');
const modelDir = join(HERE, 'fixtures', 'model-prose');
// Real errors in the unedited model output, each confirmed by reading it.
const MODEL_PROSE_ERRORS = ['haiku-runbook.md: Rollback'];
let grammar;
let documents;

beforeAll(() => {
	grammar = createGrammarPool();
	documents = createDocumentChecker();
});

afterAll(async () => {
	await Promise.all([grammar.dispose(), documents.dispose()]);
});

// One planted error per admitted rule, with the match and the fix it must report.
const POSITIVES = [
	['AdjectiveDoubleDegree', 'The new build is more faster.', 'more faster', 'faster'],
	['AfterAll', 'Afterall, the cache is warm.', 'Afterall', 'After all'],
	['AnA', 'This is a error.', 'a', 'an'],
	['CapitalizePersonalPronouns', 'After the patch i reran the suite.', 'i', 'I'],
	['CommaFixes', 'This is wrong , and stays.', ' ', ''],
	['DiscourseMarkers', 'However the migration is still running.', 'However', 'However,'],
	['Discuss', 'This essay will discuss about the cache.', 'discuss about', 'discuss'],
	['EveryTime', 'The job runs everytime a commit lands.', 'everytime', 'every time'],
	['Everyday', 'I check the dashboard everyday.', 'everyday', 'every day'],
	['Holidays', "We closed the office on mother's day.", "mother's day", "Mother's Day"],
	['IsBeenAuxSequence', 'The data is been copied.', 'is been', 'has been'],
	['ItsPossessive', "The dog ate it's food.", "it's", 'its'],
	['ModalOf', 'We could of shipped.', 'could of', 'could have'],
	['NounVerbConfusion', 'The affects of the change are clear.', 'affects', 'effects'],
	['OpenCompounds', 'Stand infront of the rack.', 'infront', 'in front'],
	['PointsOfView', 'There are many point of views.', 'point of views', 'points of view'],
	['PronounInflectionBe', 'They was on call last weekend.', 'was', 'were'],
	['PronounVerbAgreement', 'She go home.', 'go', 'goes'],
	['RegularIrregulars', 'The workers helped their wifes.', 'wifes', 'wives'],
	['RepeatedWords', 'Run the the job.', 'the the', 'the'],
	['ResponsibilityFor', 'Take responsibility of the outage.', 'Take responsibility of',
		'Take responsibility for'],
	['SimplePastToPastParticiple', 'The job has went through three retries.', 'went', 'gone'],
	['Somehow', 'The flag could some how be ignored.', 'some how', 'somehow'],
	['Someone', 'Ask some one on the team.', 'some one', 'someone'],
	['SupposedTo', 'We are suppose to ship on Friday.', 'suppose to', 'supposed to'],
	['ThenThan', 'The new index is faster then the old one.', 'then', 'than'],
	['ToSomeDegree', 'It helps in some degree.', 'in some degree', 'to some degree'],
	['WayTooAdjective', 'That timeout is way to short.', 'to', 'too'],
	['Widespread', 'The problem became wide spread.', 'wide spread', 'widespread'],
	['WorseOrWorst', 'The latency will become worst.', 'become worst', 'become worse'],
];

describe('Harper admission gate', () => {
	it.each(POSITIVES)('detects every planted %s positive', async (rule, text, match, replacement) => {
		const flags = await grammar.check(text);
		expect(flags).toEqual([expect.objectContaining({
			category: 'grammar', engine: 'harper', ruleId: `harper/${rule}`,
			match, suggestions: [replacement], hint: `use "${replacement}"`,
		})]);
		expect(text.slice(...flags[0].span)).toBe(match);
		expect(flags[0].suggestions).not.toContain(match);
	});

	it('leaves valid doubles, irregular tense, names, acronyms, and homophones silent', async () => {
		const text = [
			'What she had had was enough. I know that that is true.',
			'Log in in a new tab. The fan turns on on boot.',
			'What it is is a race. Is this this week\'s build? Press a a second time.',
			'He wept. NASA hired Alice McReady.',
			'Their dog is over there. The effect affects the result.',
		].join('\n');
		expect(await grammar.check(text)).toEqual([]);
	});

	it('reports an insertion as the full replacement for the matched text', async () => {
		const flags = await grammar.check('The tests passed,the build did not.');
		expect(flags).toEqual([expect.objectContaining({
			ruleId: 'harper/CommaFixes', match: ',', suggestions: [', '], hint: 'use ", "',
		})]);
	});

	it('plants a positive for every admitted rule', () => {
		expect(POSITIVES.map(([rule]) => rule)).toEqual([...ADMITTED_RULES].sort());
	});

	// Each sentence is correct text that a rule misread before Terse limited
	// the rule to the context where its fix is certain.
	it.each([
		["It's been broken since Tuesday."],
		["It's been deployed to staging."],
		['The outage did not affect paying customers.'],
		['The flag does not affect running jobs.'],
		['You can see who a failing dependency affects.'],
		['It has health effects comparable to dust.'],
		['The property is famous for its rose garden.'],
		['Four or more number-one hits.'],
		['Those who advocate it are concerned.'],
		['The team gave way to social media.'],
		['They use it ( i.e. the cache ) daily.'],
		['However you configure it, the result is the same.'],
		['Nowadays the team deploys daily.'],
		['Pick some one of these options.'],
		['Both A- and U23 games were held.'],
		['Writes started failing around 3 a.m.'],
		['We engineers need more context before we commit.'],
	])('leaves the correct sentence %s alone', async (text) => {
		expect(await grammar.check(text)).toEqual([]);
	});

	it('has zero unlabeled findings on the manually reviewed human-prose corpus', async () => {
		const findings = [];
		for (const name of readdirSync(proseDir).filter((x) => x.endsWith('.md'))) {
			findings.push(...await grammar.check(readFileSync(join(proseDir, name), 'utf8'),
				{ file: name }));
		}
		expect(findings).toEqual([]);
	});

	it('finds only the labeled real errors in unedited model prose', async () => {
		const findings = [];
		for (const name of readdirSync(modelDir).filter((x) => x.endsWith('.md'))) {
			const { flags } = await documents.checkDocument(
				readFileSync(join(modelDir, name), 'utf8'), { file: name });
			findings.push(...flags.filter((f) => f.category === 'grammar')
				.map((f) => `${f.file}: ${f.match}`));
		}
		expect(findings).toEqual(MODEL_PROSE_ERRORS);
	});

	it('flags no correct sentence of the clause suite', async () => {
		const suite = JSON.parse(readFileSync(join(HERE, 'fixtures', 'grammar',
			'clause-suite.json'), 'utf8'));
		const correct = Object.values(suite).flatMap(({ errors, lookalikes }) =>
			[...errors.map(([, corrected]) => corrected), ...lookalikes]);
		const findings = [];
		for (const text of correct) {
			const { flags } = await documents.checkDocument(text);
			findings.push(...flags.filter((f) => f.category === 'grammar')
				.map((f) => `${text} -> ${f.match}`));
		}
		expect(findings).toEqual([]);
	});

	it.each(['dev-suite.json', 'heldout-suite.json'])(
		'finds no error in any corrected sentence of %s', async (name) => {
			const suite = JSON.parse(readFileSync(join(HERE, 'fixtures', 'grammar', name), 'utf8'));
			const findings = [];
			for (const [, corrected] of Object.values(suite).flat()) {
				const { flags } = await documents.checkDocument(corrected);
				findings.push(...flags.filter((f) => f.category === 'grammar')
					.map((f) => `${corrected} -> ${f.match}`));
			}
			expect(findings).toEqual([]);
		});
});

describe('combined document checker', () => {
	it('keeps exact UTF-16 spans and line numbers after Unicode', async () => {
		const text = '🚀 Launch.\nShe go home.';
		const flag = (await documents.checkDocument(text)).flags
			.find((f) => f.ruleId === 'harper/PronounVerbAgreement');
		expect(flag).toMatchObject({ match: 'go', span: [15, 17], line: 2,
			suggestions: ['goes'] });
		expect(text.slice(...flag.span)).toBe(flag.match);
	});

	it('runs every Markdown and authorial-prose exemption over Harper findings', async () => {
		const text = [
			'`She go home.` Visit https://example.test/She-go-home.',
			'',
			'```text',
			'Run the the job.',
			'```',
			'',
			'"She go home."',
			'',
			'> She go home.',
			'',
			'“She go home.',
			'',
			'Run the the job.”',
			'',
			'<!-- terse-ignore: grammar -->',
			'She go home.',
		].join('\n');
		expect((await documents.checkDocument(text)).flags
			.filter((f) => f.category === 'grammar')).toEqual([]);
	});

	it('applies project ignores to Harper findings', async () => {
		const result = await documents.checkDocument('She go home.',
			{ ignore: ['grammar:go'] });
		expect(result.flags.filter((f) => f.category === 'grammar')).toEqual([]);
	});

	it('deduplicates overlapping native and Harper fixes in favor of native hints', async () => {
		const flags = (await documents.checkDocument(
			'We could of shipped. Run the the job.')).flags
			.filter((f) => f.category === 'grammar');
		expect(flags).toHaveLength(2);
		expect(flags.map((f) => f.engine)).toEqual([undefined, undefined]);
		expect(flags.map((f) => f.hint)).toEqual(['use "could have"', 'use "the"']);
	});

	// The grader's sixteen planted errors. Four stay with the model: "stage
	// run", "system revert", and "rate rise" read as compound nouns without a
	// parse, and "You're on-call engineer" needs one.
	it('catches 12 of the 16 planted fixture errors and the comma splice', async () => {
		const prompt = readFileSync(join(HERE, '..',
			'evals', 'grammar-repair', 'prompt.md'), 'utf8');
		const fixture = prompt.match(/BEGIN\n([\s\S]*?)\nEND/)[1];
		const planted = /pipeline have|stage run\b|it['’]s own|tests passes|artifacts is|Their are|canary fail\b|system revert\b|happens automatic\b|You['’]re on-call engineer|rate rise\b|seperate|to complex|Its now|quater|the affects of|, however/gi;
		const flags = (await documents.checkDocument(fixture)).flags
			.filter((f) => f.category === 'grammar');
		const errors = [...fixture.matchAll(planted)];
		expect(errors).toHaveLength(17);
		const caught = (m) => flags.some((f) =>
			f.span[0] < m.index + m[0].length && m.index < f.span[1]);
		expect(errors.filter((m) => !caught(m)).map((m) => m[0])).toEqual(['stage run',
			'system revert', "You're on-call engineer", 'rate rise']);
	});
});

describe('spelling configuration', () => {
	it('defaults broad spelling off', async () => {
		const flags = (await documents.checkDocument('The grammer changed.')).flags;
		expect(flags.filter((f) => f.ruleId === 'harper/SpellCheck')).toEqual([]);
	});

	it('uses non-assertive multi-suggestion hints and a project dictionary', async () => {
		const flags = (await documents.checkDocument(
			'Terse and ProseMirror contain grammer.', { grammar: {
				spelling: true, dialect: 'american', words: [' Terse ', 'ProseMirror', 'Terse'],
			} })).flags.filter((f) => f.ruleId === 'harper/SpellCheck');
		expect(flags).toHaveLength(1);
		expect(flags[0].match).toBe('grammer');
		expect(flags[0].suggestions).toContain('grammar');
		expect(flags[0].suggestions.length).toBeGreaterThan(1);
		expect(flags[0].hint).toMatch(/^check spelling; try /);
	});

	it('selects the requested dialect', async () => {
		const american = await documents.checkDocument('The colour is blue.',
			{ grammar: { spelling: true, dialect: 'american' } });
		const british = await documents.checkDocument('The colour is blue.',
			{ grammar: { spelling: true, dialect: 'british' } });
		expect(american.flags.map((f) => f.match)).toContain('colour');
		expect(british.flags.filter((f) => f.ruleId === 'harper/SpellCheck')).toEqual([]);
	});

	it('trims and deduplicates custom dictionary words', () => {
		expect(normalizeGrammarConfig({ words: [' Terse ', '', 'Terse', ' ProseMirror'] }))
			.toEqual({ spelling: false, dialect: 'american', words: ['Terse', 'ProseMirror'] });
	});

	it.each([
		[null, /grammar must be an object/],
		[[], /grammar must be an object/],
		[{ spelling: true }, /dialect is required/],
		[{ spelling: 'yes', dialect: 'american' }, /spelling must be a boolean/],
		[{ spelling: true, dialect: 'martian' }, /dialect must be/],
		[{ dialect: 'toString' }, /dialect must be/],
		[{ words: 'Terse' }, /words must be an array/],
		[{ words: [42] }, /words must be an array/],
	])('rejects malformed grammar config %#', async (config, message) => {
		await expect(documents.checkDocument('Clean prose.', { grammar: config }))
			.rejects.toThrow(message);
	});
});

describe('executable boundaries', () => {
	it('keeps Harper suggestions in CLI JSON and exits 1 for a finding', () => {
		const dir = mkdtempSync(join(tmpdir(), 'terse-grammar-json-'));
		const file = join(dir, 'doc.md');
		writeFileSync(file, 'She go home.\n');
		const result = spawnSync(process.execPath, [styleScript, file, '--json'],
			{ encoding: 'utf8' });
		expect(result.status).toBe(1);
		const [document] = JSON.parse(result.stdout);
		expect(document.stats.grammar).toBe(1);
		expect(document.flags[0]).toMatchObject({
			engine: 'harper', ruleId: 'harper/PronounVerbAgreement', suggestions: ['goes'],
		});
	});

	it('returns CLI exit 2 for invalid grammar config', () => {
		const dir = mkdtempSync(join(tmpdir(), 'terse-grammar-config-'));
		writeFileSync(join(dir, 'doc.md'), 'Clean prose.\n');
		const terseDir = join(dir, '.terse');
		mkdirSync(terseDir);
		writeFileSync(join(terseDir, 'config.json'), JSON.stringify({ grammar: { spelling: true } }));
		const result = spawnSync(process.execPath, [styleScript, join(dir, 'doc.md')],
			{ encoding: 'utf8' });
		expect(result.status).toBe(2);
		expect(result.stderr).toContain('grammar.dialect is required');
	});
});
