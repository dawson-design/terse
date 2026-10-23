#!/usr/bin/env node
// Finds claudisms: the AI-tell phrases listed in references/claudisms.md.
// Usage: node claudisms.mjs [--json] [--no-voice] <file|-> ...
//        node claudisms.mjs --voice [folder]   (prints the approved voice's path, if any)
// The voice comes from each file's own folder (stdin and --voice: the given
// folder, else the current one), so running from another folder can't change it.
// A file of "-" reads stdin. Exit codes: 0 no matches, 1 matches, 2 error.
// The approved voice (project .terse/voice.md, else ~/.terse/voice.md unless
// the project's .terse/config.json sets "personal": false) allows any entry
// its Exceptions section or its "Theirs:" samples use.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIST_PATH = fileURLToPath(new URL('../references/claudisms.md', import.meta.url));

const ENTRY = /^- `([^`]+)`: (.+)$/;
// One to six words inside one clause.
const GAP = '[^\\s.!?;:,—]+(?:\\s+[^\\s.!?;:,—]+){0,5}';
// The start of a line, a list item, a heading, or a sentence.
const SENTENCE_START = String.raw`(?<=^[ \t]*(?:(?:[-*+>]|#{1,6}|\d+[.)])[ \t]+)?|[.!?]["'”’)\]]*\s+)`;
// An opening code fence: three or more backticks or tildes, then an info
// string. Any indentation, so a fence inside a nested list item counts.
const FENCE_OPEN = /^[ \t]*(`{3,}|~{3,})[ \t]*([^`\r\n]*)\r?$/;
// A fence around text to paste (an email, a review comment) holds prose, not code.
const PROSE_INFO = /^(?:markdown|md|text)\b/i;
// Whole words where the match begins or ends on a word character.
const WORD_START = String.raw`(?:(?<!\w)(?=\w)|(?=\W))`;
const WORD_END = String.raw`(?:(?<=\w)(?!\w)|(?<=\W))`;

/** Parse the list into rules. Lines before the first `##` are ignored. */
export function parseClaudisms(markdown) {
	const rules = [];
	const errors = [];
	let family = null;
	markdown.split('\n').forEach((line, i) => {
		const heading = /^## (.+?)\s*$/.exec(line);
		if (heading) { family = heading[1]; return; }
		if (!family || !line.startsWith('- `')) return;
		const entry = ENTRY.exec(line);
		if (!entry) { errors.push(`line ${i + 1}: expected - \`pattern\`: hint`); return; }
		try {
			rules.push({ family, pattern: entry[1], hint: entry[2], re: compilePattern(entry[1]) });
		} catch (err) {
			errors.push(`line ${i + 1}: ${err.message}`);
		}
	});
	return { rules, errors };
}

/** Compile one pattern in the list's notation to a global, case-blind regex. */
export function compilePattern(pattern) {
	const anchored = pattern.startsWith('^');
	const body = compileBody(anchored ? pattern.slice(1) : pattern);
	return new RegExp(`${anchored ? SENTENCE_START : ''}${WORD_START}${body}${WORD_END}`, 'gim');
}

function compileBody(src) {
	let out = '';
	for (let i = 0; i < src.length;) {
		const [piece, next] = compileToken(src, i);
		out += piece;
		i = next;
	}
	return out;
}

function compileToken(src, i) {
	const ch = src[i];
	if (ch === '{') return compileGroup(src, i);
	if (ch === '*') return [GAP, i + 1];
	if (ch === ' ') return compileSpace(src, i);
	if (ch === '-') return ['[-\\s]?', i + 1];
	if (ch === "'" || ch === '’') return ["['’]", i + 1];
	const word = /^[A-Za-z0-9]+/.exec(src.slice(i));
	if (word) return compileWord(src, i, word[0]);
	if (ch === '}' || ch === '|' || ch === '~') throw new Error(`unexpected "${ch}" in ${src}`);
	return [ch.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), i + 1];
}

function compileGroup(src, i) {
	const end = src.indexOf('}', i);
	if (end < 0) throw new Error(`unclosed "{" in ${src}`);
	const inner = src.slice(i + 1, end);
	if (inner.includes('{')) throw new Error(`nested group in ${src}`);
	return [`(?:${inner.split('|').map(compileBody).join('|')})`, end + 1];
}

// A space between words also matches a hyphen; next to punctuation it may be absent.
function compileSpace(src, i) {
	let j = i;
	while (src[j] === ' ') j++;
	const nearPunctuation = isPunctuation(src[i - 1]) || isPunctuation(src[j]);
	return [nearPunctuation ? '\\s*' : '[\\s-]+', j];
}

function isPunctuation(ch) {
	return ch !== undefined && !/[A-Za-z0-9~{}*'’|]/.test(ch);
}

function compileWord(src, i, word) {
	const end = i + word.length;
	if (src[end] !== '~') return [word, end];
	return [`(?:${inflect(word).join('|')})`, end + 1];
}

/** Every inflection of a word, longest first. Over-generating is harmless. */
export function inflect(word) {
	const forms = new Set([word, `${word}s`, `${word}es`, `${word}d`, `${word}ed`, `${word}ing`]);
	if (word.endsWith('e')) forms.add(`${word.slice(0, -1)}ing`);
	if (/[^aeiou]y$/.test(word)) {
		forms.add(`${word.slice(0, -1)}ies`);
		forms.add(`${word.slice(0, -1)}ied`);
	}
	if (/[^aeiou][aeiou][bdgklmnprt]$/.test(word)) {
		forms.add(`${word}${word.at(-1)}ed`);
		forms.add(`${word}${word.at(-1)}ing`);
	}
	return [...forms].sort((a, b) => b.length - a.length);
}

const blank = (text) => text.replace(/[^\n]/g, ' ');

// The line that closes a fence: the same character, at least as long as the opener.
function closingLine(lines, from, fence) {
	const close = new RegExp(`^[ \\t]*${fence[0] === '`' ? '`' : '~'}{${fence.length},}[ \\t]*\\r?$`);
	const at = lines.findIndex((line, i) => i >= from && close.test(line));
	return at < 0 ? lines.length : at;
}

/**
 * Blank every code fence, keeping line breaks and offsets. A markdown or text
 * fence keeps its body, which is checked the same way, so a suggestion block
 * nested in a review comment is still code.
 */
export function blankCode(text) {
	const lines = text.split('\n');
	const out = [];
	for (let i = 0; i < lines.length;) {
		const open = FENCE_OPEN.exec(lines[i]);
		if (!open) { out.push(lines[i++]); continue; }
		const close = closingLine(lines, i + 1, open[1]);
		const body = lines.slice(i + 1, close);
		out.push(blank(lines[i]));
		if (body.length) out.push(...(PROSE_INFO.test(open[2].trim()) ? blankCode(body.join('\n')).split('\n') : body.map(blank)));
		if (close < lines.length) out.push(blank(lines[close]));
		i = close + 1;
	}
	return out.join('\n');
}

/**
 * Blank everything that isn't the author's prose, keeping offsets and line
 * breaks: front matter, code, comments, URLs, blockquotes, and quotations.
 * A markdown or text fence keeps its contents and loses only its fence lines.
 */
export function proseOnly(markdown) {
	return blankCode(markdown.replace(/^---\n[\s\S]*?\n---(?=\n|$)/, blank))
		.replace(/<!--[\s\S]*?-->/g, blank)
		.replace(/`[^`\n]+`/g, blank)
		.replace(/(\]\()([^)\n]*)(\))/g, (m, open, url, close) => open + blank(url) + close)
		.replace(/https?:\/\/\S+/g, blank)
		.replace(/^[ \t]*>.*$/gm, blank)
		.replace(/"(?:[^"\n]|\n(?![ \t]*\n))*"|“[^”]*”/g, blank);
}

/** Matches in prose order, skipping allowed patterns and overlapping matches. */
export function findClaudisms(markdown, rules, allowed = new Set()) {
	const prose = proseOnly(markdown);
	const hits = [];
	for (const rule of rules) {
		if (allowed.has(rule.pattern)) continue;
		for (const m of prose.matchAll(rule.re)) {
			if (!m[0].trim()) continue;
			hits.push({
				index: m.index, end: m.index + m[0].length,
				line: prose.slice(0, m.index).split('\n').length,
				match: markdown.slice(m.index, m.index + m[0].length).replace(/\s+/g, ' ').trim(),
				family: rule.family, pattern: rule.pattern, hint: rule.hint,
			});
		}
	}
	return dropOverlaps(hits);
}

function dropOverlaps(hits) {
	const sorted = [...hits].sort((a, b) => a.index - b.index || b.end - a.end);
	const kept = [];
	for (const hit of sorted) {
		if (kept.length && hit.index < kept.at(-1).end) continue;
		kept.push(hit);
	}
	return kept;
}

/** The author's own sentences in a voice template: "Theirs:" samples and quotes under Exceptions. */
function voiceSamples(voiceMarkdown) {
	const exceptions = /^## Exceptions[ \t]*\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(voiceMarkdown)?.[1] ?? '';
	const theirs = [...voiceMarkdown.matchAll(/Theirs:\s*(?:"([^"]*)"|“([^”]*)”|(.*))/g)].map((m) => m[1] ?? m[2] ?? m[3]);
	const quoted = [...exceptions.matchAll(/"([^"]*)"|“([^”]*)”/g)].map((m) => m[1] ?? m[2]);
	return [...theirs, ...quoted].map((sample) => sample.replace(/\s+/g, ' ').trim());
}

/**
 * The patterns a voice template keeps: matched in one of the author's own
 * sentences. Each sample is matched alone, so a sentence-start entry counts
 * only where the author starts a sentence with it.
 */
export function voiceAllowances(rules, voiceMarkdown) {
	if (!voiceMarkdown) return new Set();
	const samples = voiceSamples(voiceMarkdown);
	return new Set(rules
		.filter((rule) => samples.some((sample) => new RegExp(rule.re.source, 'im').test(sample)))
		.map((rule) => rule.pattern));
}

/**
 * The approved voice for work under startDir: the project's .terse/voice.md,
 * else the personal one unless the project opts out. Null when none applies.
 */
export function resolveVoicePath(startDir, home = homeFolder()) {
	const project = findProjectTerse(startDir, home);
	if (project) {
		const voice = join(project, 'voice.md');
		if (isApproved(voice)) return voice;
		if (readConfig(join(project, 'config.json')).personal === false) return null;
	}
	const personal = home ? join(home, '.terse', 'voice.md') : null;
	return personal && isApproved(personal) ? personal : null;
}

// The nearest .terse folder above startDir. A home folder is not a project.
function findProjectTerse(startDir, home) {
	let dir = resolve(startDir);
	for (;;) {
		if (home && dir === resolve(home)) return null;
		if (existsSync(join(dir, '.terse'))) return join(dir, '.terse');
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

function isApproved(path) {
	if (!existsSync(path)) return false;
	return /^---\r?\n(?:(?!---\r?\n).*\r?\n)*?status:\s*["']?approved\b/.test(readFileSync(path, 'utf8'));
}

function readConfig(path) {
	if (!existsSync(path)) return {};
	try {
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch (err) {
		throw new Error(`${path}: ${err.message}`);
	}
}

// os.homedir() throws in a container with no HOME and no passwd entry.
function homeFolder() {
	try {
		return homedir();
	} catch {
		return null;
	}
}

function formatHit(file, hit) {
	return `${file}:${hit.line}: "${hit.match}" (${hit.family}): ${hit.hint}`;
}

async function readInput(input) {
	if (input !== '-') return readFileSync(input, 'utf8');
	const chunks = [];
	for await (const chunk of process.stdin) chunks.push(chunk);
	return Buffer.concat(chunks).toString('utf8');
}

async function main(argv) {
	if (argv.includes('--voice')) {
		const folder = argv[argv.indexOf('--voice') + 1];
		const voicePath = resolveVoicePath(folder && !folder.startsWith('--') ? folder : process.cwd());
		if (voicePath) console.log(voicePath);
		return 0;
	}
	const inputs = argv.filter((arg) => !arg.startsWith('--'));
	if (!inputs.length) {
		console.error('usage: claudisms.mjs [--json] [--no-voice] <file|-> ... | --voice');
		return 2;
	}
	const { rules, errors } = parseClaudisms(readFileSync(LIST_PATH, 'utf8'));
	if (errors.length) throw new Error(`${LIST_PATH}\n${errors.join('\n')}`);
	const results = [];
	for (const input of inputs) {
		const folder = input === '-' ? process.cwd() : dirname(resolve(input));
		const voicePath = argv.includes('--no-voice') ? null : resolveVoicePath(folder);
		const allowed = voicePath ? voiceAllowances(rules, readFileSync(voicePath, 'utf8')) : new Set();
		const hits = findClaudisms(await readInput(input), rules, allowed);
		results.push({ file: input === '-' ? 'stdin' : input, hits });
	}
	if (argv.includes('--json')) console.log(JSON.stringify(results, null, 2));
	else results.forEach(({ file, hits }) => hits.forEach((hit) => console.log(formatHit(file, hit))));
	return results.some(({ hits }) => hits.length) ? 1 : 0;
}

// Compare real paths: a symlinked checkout or /tmp would otherwise skip main().
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main(process.argv.slice(2)).then(
		(code) => { process.exitCode = code; },
		(err) => { console.error(err.message); process.exitCode = 2; },
	);
}
