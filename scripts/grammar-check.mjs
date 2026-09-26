// Adapter around the pinned Harper runtime. Harper owns tokenization and its
// grammar rules; Terse owns rule admission, output shape, and false-positive
// policy. No upstream rule is enabled merely because Harper enables it.
import { webcrypto } from 'node:crypto';
import { LocalLinter, Dialect, SuggestionKind } from '../vendor/harper-2.7.0/index.js';
import { binary } from '../vendor/harper-2.7.0/binary.js';

// Harper's WASM glue reads Web Crypto from the global. Node 18 exposes the
// implementation from node:crypto but does not define the global in script
// files unless an experimental flag is set.
if (!globalThis.crypto) {
	Object.defineProperty(globalThis, 'crypto', { value: webcrypto,
		configurable: true });
}

// Each rule earned admission on the same evidence: at least one real catch
// in the error suites or CoNLL-2014, and no finding on clean human prose,
// unedited model prose, the corrected suite sentences, or the CEFR-SP
// Wikipedia sentences once the context rules below apply.
// scripts/accuracy-benchmark.mjs reproduces the measurement.
const ADMITTED_RULES = [
	'AdjectiveDoubleDegree',
	'AfterAll',
	'AnA',
	'CapitalizePersonalPronouns',
	'CommaFixes',
	'DiscourseMarkers',
	'Discuss',
	'EveryTime',
	'Everyday',
	'Holidays',
	'IsBeenAuxSequence',
	'ItsPossessive',
	'ModalOf',
	'NounVerbConfusion',
	'OpenCompounds',
	'PointsOfView',
	'PronounInflectionBe',
	'PronounVerbAgreement',
	'RegularIrregulars',
	'RepeatedWords',
	'ResponsibilityFor',
	'SimplePastToPastParticiple',
	'Somehow',
	'Someone',
	'SupposedTo',
	'ThenThan',
	'ToSomeDegree',
	'WayTooAdjective',
	'Widespread',
	'WorseOrWorst',
];

const DIALECTS = {
	american: Dialect.American,
	british: Dialect.British,
	australian: Dialect.Australian,
	canadian: Dialect.Canadian,
	indian: Dialect.Indian,
};

// These adjacent forms are grammatical at common clause and phrasal-verb
// boundaries. Harper's repeated-word rule does not use enough context to tell
// them from accidental duplication, so precision wins and Terse leaves them.
const VALID_REPEATED_WORDS = new Set([
	'a a', 'had had', 'in in', 'is is', 'on on', 'that that', 'this this',
]);

const HAVE_OR_BE_BEFORE = new RegExp('(?:\\b(?:am|is|are|was|were|be|been|being|get|' +
	'gets|got|have|has|had|having)|[\'’](?:ve|d|s))\\s+(?:\\w+ly\\s+|not\\s+|never\\s+|' +
	'already\\s+|just\\s+)?$', 'i');
const NOUN_SLOT_BEFORE = new RegExp('\\b(?:the|a|an|no|its|their|his|her|our|your|my|' +
	'side|adverse|positive|negative|net|desired|intended|unintended|lasting)\\s+$', 'i');
const LINKING_VERB_BEFORE_WAY = new RegExp('\\b(?:am|is|are|was|were|be|been|being|' +
	'seems?|seemed|looks?|looked|feels?|felt|gets?|got|becomes?|became|remains?|' +
	'remained|stays?|stayed|sounds?|sounded|runs?|ran)\\s+way\\s+$', 'i');
const COMMA_MARKERS = /^(?:however|moreover|furthermore|nevertheless|nonetheless|additionally)$/i;

// Some admitted rules misfire on correct text outside a narrow context, so a
// finding survives only where its context proves the fix. Each predicate
// gets the text just before the match, the match, and the text after it.
const ADMITTED_IN_CONTEXT = {
	RepeatedWords: ({ match }) =>
		!VALID_REPEATED_WORDS.has(match.toLowerCase().replace(/\s+/g, ' ')),
	// A letter grade or team is not an article ("A- and U23 games").
	AnA: ({ after }) => !after.startsWith('-'),
	// "It's been" is always "it has been": no noun follows a possessive as "been".
	ItsPossessive: ({ after }) => !/^\s+been\b/i.test(after),
	// Only the noun slot ("the affects of", "no affect on", "side affects").
	// The verb stays after a subject or an auxiliary ("did not affect paying
	// customers", "who a failing dependency affects").
	NounVerbConfusion: ({ before, match, after }) => /^affects?$/i.test(match) &&
		(NOUN_SLOT_BEFORE.test(before) || /^\s+(?:of|on|upon)\b/i.test(after)),
	// A participle is required after have or be ("has went", "was broke");
	// elsewhere the past form stands ("its rose garden").
	SimplePastToPastParticiple: ({ before }) => HAVE_OR_BE_BEFORE.test(before),
	// "more faster", not "four or more number-one hits".
	AdjectiveDoubleDegree: ({ match, after }) => !after.startsWith('-') &&
		/\s(?:\w+(?:er|est)|better|best|worse|worst)$/i.test(match),
	// "they was"; "it" and "you" can be objects ("those who advocate it are").
	PronounInflectionBe: ({ before }) => /\b(?:I|he|she|we|they)\s+$/i.test(before),
	// "We engineers need more context": an agent noun after "we", "us", or
	// "you" stands in apposition; it is not a verb.
	PronounVerbAgreement: ({ before, match }) => !(/\b(?:we|us|you)\s+$/i.test(before) &&
		/(?:ers|ors|ists|ians|ants|ents|ees)$/i.test(match)),
	// "is way to short"; "give way to" and "a long way to go" stay.
	WayTooAdjective: ({ before }) => LINKING_VERB_BEFORE_WAY.test(before),
	// A lone "i", not "i.e." or "i/o".
	CapitalizePersonalPronouns: ({ after }) => !/^[./-]/.test(after),
	// Markers that always take a comma. "However you configure it, ..." means
	// "in whatever way", so an opening "However" counts only when no comma
	// follows it before the sentence ends.
	DiscourseMarkers: ({ match, after }) => COMMA_MARKERS.test(match) &&
		(!/^however$/i.test(match) || /^[^,;.!?\n]*[.!?]/.test(after)),
	// "some one of these options" is the numeral.
	Someone: ({ after }) => !/^\s+of\b/i.test(after),
};

export function normalizeGrammarConfig(grammar) {
	if (grammar === undefined) return { spelling: false, dialect: 'american', words: [] };
	if (!grammar || typeof grammar !== 'object' || Array.isArray(grammar)) {
		throw new Error('.terse/config.json: grammar must be an object');
	}
	const spelling = grammar.spelling ?? false;
	if (typeof spelling !== 'boolean') {
		throw new Error('.terse/config.json: grammar.spelling must be a boolean');
	}
	if (grammar.dialect !== undefined && !Object.hasOwn(DIALECTS, grammar.dialect)) {
		throw new Error('.terse/config.json: grammar.dialect must be american, british, ' +
			'australian, canadian, or indian');
	}
	if (spelling && grammar.dialect === undefined) {
		throw new Error('.terse/config.json: grammar.dialect is required when grammar.spelling is true');
	}
	if (grammar.words !== undefined && !Array.isArray(grammar.words)) {
		throw new Error('.terse/config.json: grammar.words must be an array of strings');
	}
	const words = [];
	for (const word of grammar.words ?? []) {
		if (typeof word !== 'string') {
			throw new Error('.terse/config.json: grammar.words must be an array of strings');
		}
		const clean = word.trim();
		if (clean && !words.includes(clean)) words.push(clean);
	}
	return { spelling, dialect: grammar.dialect ?? 'american', words };
}

function configKey(config) {
	return JSON.stringify({ ...config, words: [...config.words].sort() });
}

async function createChecker(config) {
	const linter = new LocalLinter({ binary, dialect: DIALECTS[config.dialect] });
	try {
		await linter.setup();
		const defaults = await linter.getDefaultLintConfig();
		const inventory = [...ADMITTED_RULES, 'SpellCheck'];
		const enabled = [...ADMITTED_RULES, ...(config.spelling ? ['SpellCheck'] : [])];
		const missing = inventory.filter((rule) => !(rule in defaults));
		if (missing.length) {
			throw new Error(`Harper 2.7.0 is missing admitted rule(s): ${missing.join(', ')}`);
		}
		await linter.setLintConfig(Object.fromEntries(
			Object.keys(defaults).map((rule) => [rule, enabled.includes(rule)])));
		if (config.words.length) await linter.importWords(config.words);
		return linter;
	} catch (err) {
		try { await linter.dispose(); } catch { /* keep the setup error */ }
		throw err;
	}
}

// Every suggestion becomes the full text that replaces the match. Harper
// reports an insertion as the inserted text alone; passed through, a hint
// such as `use " "` on a comma would tell the fixer to delete the comma.
function uniqueSuggestions(lint, match) {
	return [...new Set(lint.suggestions().map((suggestion) => {
		const text = suggestion.get_replacement_text();
		if (typeof text !== 'string') return null;
		if (suggestion.kind() === SuggestionKind.InsertAfter) return match + text;
		if (suggestion.kind() === SuggestionKind.Remove) return '';
		return text;
	}).filter((suggestion) => suggestion !== null))];
}

function findingOf(rawText, file, ruleId, lint, spelling) {
	const span = lint.span();
	const start = span.start;
	const end = span.end;
	if (!Number.isInteger(start) || !Number.isInteger(end) ||
			start < 0 || end <= start || end > rawText.length) return null;
	const match = rawText.slice(start, end);
	const inContext = ADMITTED_IN_CONTEXT[ruleId];
	if (inContext && !inContext({ before: rawText.slice(Math.max(0, start - 40), start),
		match, after: rawText.slice(end, end + 200) })) return null;
	const suggestions = uniqueSuggestions(lint, match)
		.filter((suggestion) => suggestion !== match);
	if (spelling) {
		if (suggestions.length === 0) return null;
		return { file, category: 'grammar', match, span: [start, end],
			hint: `check spelling; try ${suggestions.map((s) => `"${s}"`).join(', ')}`,
			engine: 'harper', ruleId: `harper/${ruleId}`, suggestions };
	}
	if (suggestions.length !== 1) return null;
	return { file, category: 'grammar', match, span: [start, end],
		hint: `use "${suggestions[0]}"`, engine: 'harper',
		ruleId: `harper/${ruleId}`, suggestions };
}

export function createGrammarPool() {
	const checkers = new Map();
	let disposed = false;
	return {
		async check(rawText, { file = '(text)', grammar } = {}) {
			if (disposed) throw new Error('grammar checker pool is disposed');
			const config = normalizeGrammarConfig(grammar);
			const key = configKey(config);
			let pending = checkers.get(key);
			if (!pending) {
				pending = createChecker(config);
				checkers.set(key, pending);
			}
			const linter = await pending;
			const groups = await linter.organizedLints(rawText, { language: 'markdown' });
			const findings = [];
			for (const [ruleId, lints] of Object.entries(groups)) {
				const spelling = ruleId === 'SpellCheck';
				if (!ADMITTED_RULES.includes(ruleId) && !(config.spelling && spelling)) continue;
				for (const lint of lints) {
					const finding = findingOf(rawText, file, ruleId, lint, spelling);
					if (finding) findings.push(finding);
				}
			}
			return findings;
		},
		async dispose() {
			if (disposed) return;
			disposed = true;
			const settled = await Promise.allSettled(checkers.values());
			await Promise.all(settled.filter((x) => x.status === 'fulfilled')
				.map((x) => x.value.dispose()));
			checkers.clear();
		},
	};
}

export { ADMITTED_RULES };
