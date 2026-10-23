#!/usr/bin/env node
// Maps a document's parts: the total prose words, then each heading, to the
// first three levels the document uses, with the prose words in its section
// and any words in code. A skill reads this before deciding whether a
// document should split (references/splitting.md), instead of reading the
// whole file.
// Usage: node outline.mjs <file>
// Prose leaves out front matter, code, blockquotes, and comments, the same
// count the evals use. Only # headings count; underlined ones don't.
// Exit codes: 0 printed, 2 error.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { blankCode } from './claudisms.mjs';

const WORDS_PER_PAGE = 500;
const LEVELS_SHOWN = 3;
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/;
// A fence line as blankCode reads one: no backtick after the opening run.
const FENCE = /^[ \t]*(?:`{3,}|~{3,})[^`]*$/;
// Front matter runs unbroken from an opening --- and holds a key; a --- with
// a blank line after it is a rule.
const FRONT_MATTER = /^---\n((?:.+\n)*?)---(?=\n|$)/;
const COMMENT = /<!--[\s\S]*?-->/g;
const INLINE_CODE = /`[^`\n]*`/g;

const blank = (text) => text.replace(/[^\n]/g, ' ');
const unixLines = (text) => text.replace(/\r\n?/g, '\n');

function blankFrontMatter(text) {
	const m = FRONT_MATTER.exec(text);
	return m && /^[\w-]+:/m.test(m[1]) ? blank(m[0]) + text.slice(m[0].length) : text;
}

// A <!-- inside inline code opens nothing, and a --> in prose closes nothing.
function blankComments(text) {
	const masked = text.replace(INLINE_CODE, blank);
	let out = text;
	for (const m of masked.matchAll(COMMENT)) {
		out = out.slice(0, m.index) + blank(m[0]) + out.slice(m.index + m[0].length);
	}
	return out;
}

/** The text with front matter, code, blockquotes, and comments blanked, line for line. */
export function proseText(markdown) {
	return blankComments(blankCode(blankFrontMatter(unixLines(markdown))))
		.replace(/^[ \t]*>.*$/gm, '');
}

/** Tokens holding a letter or digit. */
export function wordCount(text) {
	return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

// Each line's prose words, and its words in code, leaving out fence lines.
function lineCounts(markdown) {
	const body = blankFrontMatter(markdown);
	const prose = proseText(markdown).split('\n');
	const kept = blankCode(body).split('\n');
	return body.split('\n').map((line, i) => ({
		prose: wordCount(prose[i]),
		code: FENCE.test(line) ? 0 : wordCount(line) - wordCount(kept[i]),
	}));
}

// Headings outside every fence, comment, and front matter.
function findHeadings(markdown) {
	const visible = blankComments(blankCode(blankFrontMatter(markdown), { keepProse: false }));
	return visible.split('\n').flatMap((line, at) => {
		const m = HEADING.exec(line);
		return m ? [{ at, level: m[1].length, title: m[2] }] : [];
	});
}

const sum = (counts) => counts.reduce((total, c) => ({ prose: total.prose + c.prose, code: total.code + c.code }),
	{ prose: 0, code: 0 });

/**
 * The whole document's counts, and each heading with the counts of its
 * section: from the heading to the next one at its level or higher.
 */
export function outline(text) {
	const markdown = unixLines(text);
	const counts = lineCounts(markdown);
	const headings = findHeadings(markdown);
	const sections = headings.map((h, i) => {
		const end = headings.slice(i + 1).find((next) => next.level <= h.level)?.at ?? counts.length;
		return { level: h.level, title: h.title, ...sum(counts.slice(h.at, end)) };
	});
	return { ...sum(counts), preamble: sum(counts.slice(0, headings[0]?.at ?? counts.length)), sections };
}

const number = (n) => n.toLocaleString('en-US');
const counts = ({ prose, code }) => `[${number(prose)}${code ? `, ${number(code)} in code` : ''}]`;

/** The outline as text: a total line, then one indented line per heading shown. */
export function formatOutline({ prose, code, preamble, sections }) {
	const pages = Number((prose / WORDS_PER_PAGE).toFixed(1));
	const out = [`${number(prose)} words of prose (${number(pages)} pages at ${WORDS_PER_PAGE} words a page)`
		+ (code ? `, ${number(code)} in code` : '')];
	if (sections.length && (preamble.prose || preamble.code)) out.push(`(before the first heading)  ${counts(preamble)}`);
	const shown = [...new Set(sections.map((s) => s.level))].sort((a, b) => a - b).slice(0, LEVELS_SHOWN);
	for (const s of sections.filter((s) => shown.includes(s.level))) {
		out.push(`${'  '.repeat(shown.indexOf(s.level))}${'#'.repeat(s.level)} ${s.title}  ${counts(s)}`);
	}
	return out.join('\n');
}

function main(argv) {
	if (argv.length !== 1 || argv[0].startsWith('-')) {
		console.error('usage: outline.mjs <file>');
		return 2;
	}
	console.log(formatOutline(outline(readFileSync(argv[0], 'utf8'))));
	return 0;
}

// Compare real paths: a symlinked checkout or /tmp would otherwise skip main().
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		process.exitCode = main(process.argv.slice(2));
	} catch (err) {
		console.error(err.message);
		process.exitCode = 2;
	}
}
