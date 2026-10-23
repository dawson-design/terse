// Deterministic checks on a deliverable: required sections in order, the
// short-form shape, the word budget, required facts, and claudisms. Pure.
import { findClaudisms } from '../claudisms.mjs';
import { proseText, wordCount } from '../outline.mjs';

export { proseText };

// A heading that restates the body, when it closes the document.
const SUMMARY_HEADINGS = /^(summary|conclusion|key takeaways?|tl;?dr|final thoughts|wrapping up)$/;

/** Words of prose: the outline's count, leaving out a subject line. */
export function countWords(markdown) {
	return wordCount(proseText(markdown).replace(/^\s*subject:.*$/im, ''));
}

/** Heading texts in order, lowercased: Markdown headings and bold-only lines. */
export function headingsOf(markdown) {
	const headings = [];
	for (const line of proseText(markdown).split('\n')) {
		const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line) ?? /^\*\*([^*]+?):?\*\*:?\s*$/.exec(line.trim());
		if (m) headings.push(normalize(m[1]));
	}
	return headings;
}

function normalize(text) {
	return text.toLowerCase().replace(/[*_`]/g, '').replace(/^\d+[.)]\s*/, '').replace(/\s+/g, ' ').trim();
}

/** The first n words of the body, after any subject line and leading headings. */
export function leadText(markdown, n) {
	const lines = proseText(markdown).split('\n')
		.filter((line) => !/^subject:/i.test(line.trim()) && !/^#{1,6}\s/.test(line));
	return lines.join(' ').split(/\s+/).filter(Boolean).slice(0, n).join(' ');
}

export function containsAny(text, alternatives) {
	const haystack = text.toLowerCase().replace(/\s+/g, ' ');
	return alternatives.some((alt) => haystack.includes(alt.toLowerCase().replace(/\s+/g, ' ')));
}

export function checkSections(markdown, sections = []) {
	const headings = headingsOf(markdown);
	const positions = sections.map(({ name, aliases = [] }) => {
		const names = [name, ...aliases].map(normalize);
		return { name, at: headings.findIndex((h) => names.some((n) => h === n || h.startsWith(`${n} `) || h.startsWith(`${n}:`))) };
	});
	const missing = positions.filter((p) => p.at < 0).map((p) => p.name);
	const found = positions.filter((p) => p.at >= 0);
	const outOfOrder = found.filter((p, i) => i > 0 && p.at < found[i - 1].at).map((p) => p.name);
	return { pass: !missing.length && !outOfOrder.length, missing, outOfOrder };
}

export function checkBudget(markdown, { maxWords, minWords = 0 }) {
	const words = countWords(markdown);
	return { pass: words <= maxWords && words >= minWords, words, maxWords, minWords };
}

export function checkFacts(markdown, facts = []) {
	const text = proseText(markdown);
	const missing = facts.filter((fact) => !containsAny(text, fact.any)).map((fact) => fact.id);
	return { pass: !missing.length, missing };
}

/** Short-form shape: subject line, no headings, the lead, mention order, no summary heading. */
export function checkShape(markdown, structure = {}) {
	const problems = [];
	const firstLine = proseText(markdown).split('\n').find((line) => line.trim()) ?? '';
	if (structure.subjectLine && !/^subject:/i.test(firstLine.trim())) problems.push('no subject line');
	if (structure.noHeadings && /^#{1,6}\s/m.test(proseText(markdown))) problems.push('has headings');
	if (SUMMARY_HEADINGS.test(headingsOf(markdown).at(-1) ?? '')) problems.push('closing summary heading');
	if (structure.lead) problems.push(...leadProblems(markdown, structure.lead));
	if (structure.mentionOrder) problems.push(...orderProblems(markdown, structure.mentionOrder));
	return { pass: !problems.length, problems };
}

function leadProblems(markdown, { withinWords, mentionsAny }) {
	const lead = leadText(markdown, withinWords);
	return mentionsAny.filter((group) => !containsAny(lead, group))
		.map((group) => `lead lacks ${group[0]}`);
}

function orderProblems(markdown, groups) {
	const text = proseText(markdown).toLowerCase();
	const firsts = groups.map((group) => Math.min(...group
		.map((alt) => text.indexOf(alt.toLowerCase())).filter((i) => i >= 0)))
		.filter(Number.isFinite);
	return firsts.some((at, i) => i > 0 && at < firsts[i - 1])
		? [`mentions out of order: ${groups.map((g) => g[0]).join(' before ')}`] : [];
}

/** Every check on one deliverable. Claudisms count with no voice allowances. */
export function runChecks(markdown, caseDef, rules) {
	const sections = checkSections(markdown, caseDef.structure.sections);
	const shape = checkShape(markdown, caseDef.structure);
	const structure = { pass: sections.pass && shape.pass, ...sections, problems: shape.problems };
	const budget = checkBudget(markdown, caseDef.budget);
	const facts = checkFacts(markdown, caseDef.facts);
	const matches = findClaudisms(markdown, rules).map(({ line, match, pattern }) => ({ line, match, pattern }));
	return { structure, budget, facts, claudisms: { count: matches.length, matches } };
}
