#!/usr/bin/env node
// Accuracy benchmark for Terse's deterministic checks: grammar recall on the
// committed error suites, false alarms on clean human and model prose, and,
// when the public datasets are present, detection on CoNLL-2014 and sentence
// difficulty against CEFR-SP. The external datasets stay out of the repo for
// licensing; the script prints how to fetch them.
// Usage: node scripts/accuracy-benchmark.mjs [--data <dir>] [--json]
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkText, createDocumentChecker } from './style-check.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fixture = (...parts) => join(ROOT, 'test', 'fixtures', ...parts);
const CONLL = 'conll14st-test-data/noalt/official-2014.combined.m2';
// The sentence rule's thresholds were chosen on the train and dev splits;
// the test split is held out. All three feed the grammar false-alarm pass.
const CEFR_SPLITS = ['train', 'dev', 'test'].map((split) => `CEFR-SP_Wikiauto_${split}.txt`);
const CEFR_TEST = CEFR_SPLITS[2];
const CEFR_COMMIT = '2ba4a5005fbff68ab0f863891cf977c50fdcda29';
const FETCH_HELP = [
	'curl -L https://www.comp.nus.edu.sg/~nlp/conll14st/conll14st-test-data.tar.gz | tar xz',
	...CEFR_SPLITS.map((file) => 'curl -LO https://raw.githubusercontent.com/yukiar/CEFR-SP/' +
		`${CEFR_COMMIT}/CEFR-SP/Wiki-Auto/${file}`),
];

const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : 0);
const grammarOf = (flags) => flags.filter((f) => f.category === 'grammar');

/** Catches and false alarms on a suite of [error, corrected] pairs. */
async function scoreSuite(checker, path, suite = JSON.parse(readFileSync(path, 'utf8'))) {
	let pairs = 0, caught = 0, falseAlarms = 0;
	const byCategory = {};
	for (const [category, items] of Object.entries(suite)) {
		let hits = 0;
		for (const [error, corrected] of items) {
			const bad = grammarOf((await checker.checkDocument(error)).flags).map((f) => f.match);
			const good = grammarOf((await checker.checkDocument(corrected)).flags).map((f) => f.match);
			if (bad.some((m) => !good.includes(m))) hits++;
			if (good.length) falseAlarms++;
		}
		pairs += items.length;
		caught += hits;
		byCategory[category] = `${hits}/${items.length}`;
	}
	return { pairs, caught, recall: pct(caught, pairs), falseAlarms, byCategory };
}

/**
 * Catches on a suite whose categories each hold `errors` ([error, corrected]
 * pairs) and `lookalikes` (correct sentences a naive checker might flag).
 */
async function scoreClauseSuite(checker, path) {
	const suite = JSON.parse(readFileSync(path, 'utf8'));
	const byCategory = {};
	for (const [category, { errors, lookalikes }] of Object.entries(suite)) {
		const pairs = Object.fromEntries(errors.map((pair, i) => [i, pair]));
		const scored = await scoreSuite(checker, null, { [category]: Object.values(pairs) });
		let flagged = 0;
		for (const text of lookalikes) {
			if (grammarOf((await checker.checkDocument(text)).flags).length) flagged++;
		}
		byCategory[category] = { caught: `${scored.caught}/${scored.pairs}`,
			correctedFlagged: scored.falseAlarms, lookalikesFlagged: `${flagged}/${lookalikes.length}` };
	}
	return byCategory;
}

/** Grammar findings on every Markdown file in a directory. */
async function cleanFindings(checker, dir) {
	const findings = [];
	for (const name of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
		const { flags } = await checker.checkDocument(readFileSync(join(dir, name), 'utf8'));
		findings.push(...grammarOf(flags).map((f) => `${name}: ${f.match}`));
	}
	return findings;
}

/** Share of sentences the checker flags as hard or very hard. */
function hardSentenceRate(dir) {
	let sentences = 0, hard = 0;
	for (const name of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
		const { stats } = checkText(readFileSync(join(dir, name), 'utf8'));
		sentences += stats.sentences;
		hard += stats.hardSentences;
	}
	return pct(hard, sentences);
}

function parseM2(text) {
	return text.split(/\n\s*\n/).map((block) => block.split('\n').filter(Boolean))
		.filter((lines) => lines[0]?.startsWith('S ')).map((lines) => ({
			tokens: lines[0].slice(2).split(' '),
			edits: lines.slice(1).map((l) => l.slice(2).split('|||'))
				.filter((f) => f[1] !== 'noop')
				.map((f) => ({ span: f[0].split(' ').map(Number), annotator: Number(f[5]) })),
		}));
}

// Rejoin CoNLL's tokens as ordinary prose, keeping each token's offsets.
function detokenize(tokens) {
	let text = '';
	const ranges = tokens.map((t) => {
		if (text && !/^(?:[,.?!;:%)\]}]|'s|n't|'re|'ve|'d|'ll|'m)$/.test(t)) text += ' ';
		const range = [text.length, text.length + t.length];
		text += t;
		return range;
	});
	return { text, ranges };
}

// A gold edit is detected when a finding overlaps its tokens; an insertion
// counts when a finding touches the token on either side. This is more
// lenient than the M2 correction score that GEC systems report.
function detected(edit, hitTokens) {
	const [start, end] = edit.span;
	if (end > start) return hitTokens.some((i) => i >= start && i < end);
	return hitTokens.includes(start - 1) || hitTokens.includes(start);
}

/** Lenient detection recall and precision on CoNLL-2014. */
async function scoreConll(checker, path) {
	const gold = { 0: 0, 1: 0 }, found = { 0: 0, 1: 0 };
	let findings = 0, overlapping = 0;
	for (const { tokens, edits } of parseM2(readFileSync(path, 'utf8'))) {
		const { text, ranges } = detokenize(tokens);
		const hits = grammarOf((await checker.checkDocument(text)).flags).map((f) =>
			ranges.flatMap(([a, b], i) => (f.span[0] < b && a < f.span[1] ? [i] : [])));
		findings += hits.length;
		overlapping += hits.filter((h) => edits.some((e) => detected(e, h))).length;
		for (const edit of edits) {
			gold[edit.annotator]++;
			if (detected(edit, hits.flat())) found[edit.annotator]++;
		}
	}
	return { recallAnnotator0: pct(found[0], gold[0]), recallAnnotator1: pct(found[1], gold[1]),
		precision: pct(overlapping, findings), findings };
}

// Hemingway App's default rule, as its web bundle defines it: a sentence of
// 14 or more words at rounded ARI grade 10 is hard, and grade 14 very hard.
function hemingwayHard(sentence) {
	const clean = `${sentence.replace(/[^a-z0-9. ]/gi, '')}.`;
	const words = clean.split(' ').length;
	const letters = clean.split(' ').join('').length;
	const grade = Math.max(Math.round((4.71 * letters) / words + 0.5 * words - 21.43), 0);
	return words >= 14 && grade >= 10;
}

function precisionRecall(predicted, gold) {
	const tp = predicted.filter((p, i) => p && gold[i]).length;
	const P = tp / (predicted.filter(Boolean).length || 1);
	const R = tp / (gold.filter(Boolean).length || 1);
	const f = (b) => ((1 + b * b) * P * R) / (b * b * P + R || 1);
	return { flagged: predicted.filter(Boolean).length, precision: pct(P, 1),
		recall: pct(R, 1), f1: pct(f(1), 1), f05: pct(f(0.5), 1) };
}

function cefrRows(path) {
	return readFileSync(path, 'utf8').trim().split('\n').map((line) => {
		const [tokens, a, b] = line.split('\t');
		return { text: detokenize(tokens.split(' ')).text, level: (Number(a) + Number(b)) / 2 };
	});
}

/** Grammar findings on CEFR-SP's edited Wikipedia sentences, for review. */
async function cefrGrammarFindings(checker, paths) {
	const findings = [];
	for (const { text } of paths.flatMap(cefrRows)) {
		findings.push(...grammarOf((await checker.checkDocument(text)).flags)
			.map((f) => `${f.match} -> ${f.hint} | ${text}`));
	}
	return findings;
}

/** Terse and Hemingway against CEFR-SP's held-out difficulty labels. */
function scoreCefr(path) {
	const rows = cefrRows(path);
	const terse = rows.map((r) => checkText(r.text).stats.hardSentences > 0);
	const hemingway = rows.map((r) => hemingwayHard(r.text));
	const result = { sentences: rows.length };
	for (const [label, cut] of [['c1OrHarder', 5], ['b2c1OrHarder', 4.5]]) {
		const gold = rows.map((r) => r.level >= cut);
		result[label] = { terse: precisionRecall(terse, gold),
			hemingway: precisionRecall(hemingway, gold) };
	}
	return result;
}

async function grammarReport(checker) {
	const repair = readFileSync(join(ROOT, 'evals', 'grammar-repair', 'prompt.md'), 'utf8')
		.match(/BEGIN\n([\s\S]*?)\nEND/)[1];
	return {
		devSuite: await scoreSuite(checker, fixture('grammar', 'dev-suite.json')),
		heldoutSuite: await scoreSuite(checker, fixture('grammar', 'heldout-suite.json')),
		clauseSuite: await scoreClauseSuite(checker, fixture('grammar', 'clause-suite.json')),
		grammarRepairFindings: grammarOf((await checker.checkDocument(repair)).flags).length,
		modelProseFindings: await cleanFindings(checker, fixture('model-prose')),
		humanProseFindings: await cleanFindings(checker, fixture('human-prose')),
	};
}

async function main() {
	const args = process.argv.slice(2);
	const json = args.includes('--json');
	const dataAt = args.indexOf('--data');
	const data = dataAt >= 0 ? args[dataAt + 1] : join(ROOT, '.bench-data');
	const checker = createDocumentChecker();
	try {
		const report = { grammar: await grammarReport(checker),
			hardSentenceRate: { modelProse: hardSentenceRate(fixture('model-prose')),
				hemingway: hardSentenceRate(join(ROOT, 'samples', 'hemingway')) } };
		if (existsSync(join(data, CONLL))) report.conll2014 = await scoreConll(checker, join(data, CONLL));
		if (existsSync(join(data, CEFR_TEST))) report.cefrSp = scoreCefr(join(data, CEFR_TEST));
		const splits = CEFR_SPLITS.map((file) => join(data, file));
		if (splits.every(existsSync)) {
			report.cefrSpGrammarFindings = await cefrGrammarFindings(checker, splits);
		}
		console.log(json ? JSON.stringify(report, null, 2) : summarize(report));
		if (!report.conll2014 || !report.cefrSpGrammarFindings) {
			console.error(`\nExternal datasets not found in ${data}. From that directory run:\n  ` +
				FETCH_HELP.join('\n  '));
		}
	} finally {
		await checker.dispose();
	}
}

function summarize(report) {
	const { grammar: g } = report;
	const suite = (s) => `${s.caught}/${s.pairs} (${s.recall}%), false alarms ${s.falseAlarms}`;
	const lines = [
		`held-out suite: ${suite(g.heldoutSuite)}`,
		`dev suite: ${suite(g.devSuite)}`,
		...Object.entries(g.clauseSuite).map(([category, s]) => `clause suite ${category}: ` +
			`${s.caught} caught, ${s.correctedFlagged} corrected flagged, ` +
			`${s.lookalikesFlagged} lookalikes flagged`),
		`grammar-repair fixture findings: ${g.grammarRepairFindings}`,
		`grammar findings on clean prose, each a false alarm or a real error to review: ` +
			`model ${g.modelProseFindings.length}, human ${g.humanProseFindings.length}`,
		`hard sentences: model prose ${report.hardSentenceRate.modelProse}%, ` +
			`Hemingway ${report.hardSentenceRate.hemingway}%`,
	];
	if (report.conll2014) {
		const c = report.conll2014;
		lines.push(`CoNLL-2014 detection: recall ${c.recallAnnotator0}% / ${c.recallAnnotator1}% ` +
			`(annotator 0 / 1), precision ${c.precision}% of ${c.findings} findings`);
	}
	if (report.cefrSpGrammarFindings) {
		lines.push(`CEFR-SP Wikipedia grammar findings to review: ` +
			`${report.cefrSpGrammarFindings.length} (--json lists them)`);
	}
	if (report.cefrSp) {
		for (const cut of ['c1OrHarder', 'b2c1OrHarder']) {
			const { terse, hemingway } = report.cefrSp[cut];
			lines.push(`CEFR-SP ${cut}: Terse F0.5 ${terse.f05} (P ${terse.precision}, ` +
				`R ${terse.recall}); Hemingway F0.5 ${hemingway.f05} (P ${hemingway.precision}, ` +
				`R ${hemingway.recall})`);
		}
	}
	return lines.join('\n');
}

main().catch((err) => {
	console.error(`accuracy-benchmark: ${err.message}`);
	process.exitCode = 2;
});
