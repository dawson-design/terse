// Terse's native grammar patterns: mechanical errors a regular expression can
// prove on one sentence, each with the single fix it proposes. style-check.mjs
// runs them per sentence beside the lexicon; grammar-check.mjs adds the
// admitted Harper rules. Every pattern is gated on clean human and model prose.

// Common misspellings with one correct form. Broad spelling is Harper's
// opt-in SpellCheck in grammar-check.mjs.
const MISSPELLINGS = {
	seperate: 'separate', seperately: 'separately', seperated: 'separated',
	recieve: 'receive', recieved: 'received', recieving: 'receiving',
	occured: 'occurred', occuring: 'occurring', occurence: 'occurrence',
	occurences: 'occurrences', definately: 'definitely', alot: 'a lot',
	untill: 'until', wich: 'which', accomodate: 'accommodate',
	acheive: 'achieve', acheived: 'achieved', begining: 'beginning',
	beleive: 'believe', comittee: 'committee', existance: 'existence',
	goverment: 'government', independant: 'independent',
	neccessary: 'necessary', necessary: 'necessary', occassion: 'occasion',
	publically: 'publicly', recomend: 'recommend', recomended: 'recommended',
	refered: 'referred', succesful: 'successful', sucessful: 'successful',
	sucess: 'success', tommorow: 'tomorrow', truely: 'truly', wierd: 'weird',
	enviroment: 'environment', arguement: 'argument', liason: 'liaison',
	mispell: 'misspell', noticable: 'noticeable', perseverence: 'perseverance',
	priviledge: 'privilege', similiar: 'similar', thier: 'their',
	dependancy: 'dependency', dependancies: 'dependencies',
	liscence: 'license', maintainance: 'maintenance', prefered: 'preferred',
	transfered: 'transferred', writting: 'writing', comming: 'coming',
	buisness: 'business', becuase: 'because', teh: 'the', greatful: 'grateful',
	harrass: 'harass', lenght: 'length', embarass: 'embarrass',
	occassionally: 'occasionally', paralell: 'parallel', paralel: 'parallel',
	recieves: 'receives', retreive: 'retrieve', retreived: 'retrieved',
	suprise: 'surprise', suprised: 'surprised', threshhold: 'threshold',
	adress: 'address', calander: 'calendar', concensus: 'consensus',
	consistant: 'consistent', persistant: 'persistent', existant: 'existent',
	guage: 'gauge', heirarchy: 'hierarchy', immediatly: 'immediately',
	lisence: 'license', millenium: 'millennium', miniscule: 'minuscule',
	pronounciation: 'pronunciation', reccomend: 'recommend',
	seige: 'siege', tendancy: 'tendency', useable: 'usable',
	quater: 'quarter',
};
delete MISSPELLINGS.necessary;

const alt = (words) => words.join('|');
const eitherCase = (word) => `[${word[0].toUpperCase()}${word[0]}]${word.slice(1)}`;
const keepCase = (from, to) => (/^[A-Z]/.test(from) ? to[0].toUpperCase() + to.slice(1) : to);

// Agreement at an edit seam: a subject whose number changed while its verb
// did not ("The artifacts is uploaded", "Each request take"). A regular
// expression cannot parse a sentence, so each pattern reads only a
// determiner, at most one modifier, the noun, and the verb right after it.
// Three limits keep that honest. The noun phrase must open a clause (the
// sentence start, a comma, or a subordinator), because a noun phrase inside a
// clause is usually an object ("Exploring the mines is not allowed"). Nouns
// are lowercase, so product names stay out. And a noun that may be plural or
// collective in either form stays out.

const CLAUSE_OPENERS = ['[Ww]hen', '[Ii]f', '[Oo]nce', '[Bb]ecause', '[Ww]hile',
	'[Aa]fter', '[Bb]efore', '[Ss]ince', '[Uu]ntil', '[Uu]nless', '[Ww]hether',
	'[Aa]lthough', '[Tt]hough', '[Ww]here', '[Ww]hich', '[Ww]ho', '[Bb]ut', '[Ss]o',
	'[Tt]hen'];
const clauseStart = (openers) => '(?:^(?:\\s|[-*+>]\\s|\\d{1,2}[.)]\\s)*|[,;:(]\\s*|' +
	`\\b(?:${alt(openers)})\\s+)`;
// "that" opens a clause for a plural subject ("ensure that the tests
// passes"), but not for a singular one, where "requires that the client have
// a token" is a subjunctive. "and" and "or" open no clause here: they join
// nouns inside a phrase as often as clauses ("Britain and its inhabitants").
const PLURAL_SUBJECT_START = clauseStart([...CLAUSE_OPENERS, '[Tt]hat']);
const SINGULAR_SUBJECT_START = clauseStart(CLAUSE_OPENERS);
const MODIFIER = '(?:[a-z][a-z-]*\\s+)?';
// A plural modifier would make the next word the noun: "the users now have".
const SINGULAR_MODIFIER = '(?:(?![a-z-]*s\\s)[a-z][a-z-]*\\s+)?';

// Words that end in s but are singular, adverbs, pronouns, verbs that open a
// pseudo-cleft ("what the team needs is"), or lowercase product names. The
// suffix check covers class, status, analysis, famous, and physics.
const NOT_PLURAL_NOUN = alt(['news', 'series', 'species', 'means', 'lens', 'canvas',
	'alias', 'atlas', 'bias', 'gas', 'chaos', 'ethos', 'kudos', 'always', 'sometimes',
	'perhaps', 'towards', 'afterwards', 'besides', 'nowadays', 'whereas', 'yes',
	'hers', 'ours', 'yours', 'theirs', 'its', 'has', 'was', 'does', 'thus', 'plus',
	'minus', 'us', 'headquarters', 'whereabouts', 'wants', 'needs', 'likes', 'says',
	'thinks', 'sees', 'knows', 'cares', 'matters', 'counts', 'costs', 'gets', 'takes',
	'makes', 'gives', 'expects', 'requires', 'prefers', 'uses', 'asks', 'feels',
	'finds', 'hears', 'believes', 'intends', 'plans', 'wishes', 'hopes', 'seems',
	'looks', 'sounds', 'runs', 'works', 'shows', 'tells', 'calls', 'keeps', 'lets',
	'helps', 'tries', 'goes', 'comes', 'postgres', 'kubernetes', 'jenkins', 'express',
	'rails', 'pandas', 'aws', 'dns', 'https', 'css', 'sms', 'gps', 'cms', 'os', 'ios',
	'macos', 'js', 'ts', 'fs', 'ms']);
const PLURAL_NOUN = `(?![a-z]*(?:ss|us|is|ous|ics)\\b)(?!(?:${NOT_PLURAL_NOUN})\\b)` +
	'[a-z]+s\\b(?![-\'’])';

// Nouns without a plural s that may still take a plural verb: irregular
// plurals, collectives (plural in British use), quantities, pronouns that
// open a relative clause ("the code you have"), and adjectives used as nouns.
const NOT_SINGULAR_NOUN = alt(['people', 'children', 'men', 'women', 'police',
	'staff', 'personnel', 'cattle', 'data', 'media', 'criteria', 'phenomena',
	'bacteria', 'alumni', 'stimuli', 'fungi', 'nuclei', 'feet', 'teeth', 'mice',
	'geese', 'sheep', 'deer', 'fish', 'aircraft', 'spacecraft', 'offspring', 'team',
	'crew', 'family', 'government', 'company', 'committee', 'audience', 'public',
	'board', 'band', 'class', 'majority', 'minority', 'rest', 'remainder', 'bulk',
	'number', 'lot', 'couple', 'dozen', 'handful', 'bunch', 'variety', 'total',
	'half', 'third', 'quarter', 'few', 'many', 'most', 'same', 'other', 'former',
	'latter', 'following', 'above', 'below', 'first', 'last', 'next', 'two',
	'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred',
	'thousand', 'million', 'billion', 'rich', 'poor', 'young', 'old', 'elderly',
	'wealthy', 'unemployed', 'homeless', 'sick', 'dead', 'living', 'injured',
	'i', 'you', 'we', 'they', 'he', 'she', 'it', 'who', 'which', 'what', 'there', 'here',
	'larvae', 'elytra', 'microglia', 'strata', 'genera', 'corpora', 'dice', 'lice', 'oxen',
	'club', 'garrison', 'army', 'navy', 'group', 'council', 'jury', 'squad', 'faculty',
	'parliament', 'cabinet', 'management', 'department', 'union', 'firm',
	// time words open an adverbial, not a subject ("each time, take a backup")
	'time', 'day', 'week', 'month', 'year', 'night', 'morning', 'evening', 'hour',
	'minute', 'second', 'step',
	// function words, modals, and irregular participles, which a modifier
	// would otherwise push into the noun slot ("her story might have")
	'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'and', 'or', 'but', 'if',
	'as', 'than', 'that', 'so', 'not', 'no', 'also', 'still', 'just', 'then', 'now',
	'already', 'even', 'all', 'both', 'each', 'either', 'neither', 'often', 'once',
	'soon', 'too', 'very', 'ever', 'yet', 'again', 'together', 'instead', 'since',
	'rather', 'almost', 'quite', 'can', 'could', 'will', 'would', 'should', 'shall', 'may',
	'might', 'must', 'did', 'do', 'had', 'am', 'be', 'been', 'where', 'when', 'how', 'why',
	'whom', 'whose', 'taken', 'given', 'written', 'chosen', 'driven', 'broken', 'spoken',
	'stolen', 'forgotten', 'hidden', 'known', 'shown', 'seen', 'done', 'gone', 'made',
	'held', 'built', 'sent', 'found', 'left', 'kept', 'said', 'paid', 'set', 'put']);
// -ae covers Latin plurals such as algae; -ed covers participles ("the user
// approved are").
const SINGULAR_NOUN = `(?![a-z]*(?:s|ing|ly|ae|ed)\\b)(?!(?:${NOT_SINGULAR_NOUN})\\b)` +
	"[a-z]+\\b(?![-'’])";
// After "these" or "those" an -ing word is a noun ("these setting is").
const NOUN_AFTER_DEMONSTRATIVE = `(?![a-z]*(?:s|ly|ae|ed)\\b)(?!(?:${NOT_SINGULAR_NOUN})\\b)` +
	"[a-z]+\\b(?![-'’])";

const PLURAL_DETERMINER = alt(['[Tt]he', '[Tt]hese', '[Tt]hose', '[Bb]oth', '[Mm]any',
	'[Ss]everal', '[Aa]ll', '[Vv]arious', '[Mm]ultiple', '[Oo]ur', '[Yy]our',
	'[Tt]heir', '[Mm]y', '[Hh]is', '[Hh]er', '[Ii]ts', '[Ss]ome', '[Mm]ost', '[Oo]ther']);
const SINGULAR_DETERMINER = alt(['[Tt]he', '[Tt]his', '[Ee]ach', '[Ee]very', '[Aa]',
	'[Aa]n', '[Aa]nother', '[Ii]ts', '[Oo]ur', '[Yy]our', '[Tt]heir', '[Mm]y', '[Hh]is',
	'[Hh]er']);

// Third-person singular verbs, each with its plural form.
const SINGULAR_AUX = { is: 'are', was: 'were', has: 'have', does: 'do',
	"isn't": "aren't", "wasn't": "weren't", "hasn't": "haven't", "doesn't": "don't" };
const SINGULAR_VERBS = ['returns', 'polls', 'shares', 'supports', 'includes',
	'contains', 'depends', 'fails', 'passes', 'creates', 'deletes', 'sends',
	'accepts', 'rejects', 'allows', 'provides', 'exposes', 'emits', 'retries',
	'owns', 'belongs', 'exists', 'happens', 'occurs', 'appears', 'becomes',
	'remains', 'receives', 'ensures', 'prevents', 'causes', 'handles', 'stores',
	'loads', 'reads', 'writes', 'starts', 'stops', 'updates', 'matches', 'points',
	'checks', 'waits', 'triggers', 'lives', 'connects', 'listens', 'resolves',
	'renders', 'parses', 'compiles', 'deploys', 'builds', 'fetches', 'shows', 'runs',
	'works', 'uses', 'needs', 'takes', 'gets', 'makes', 'looks', 'seems', 'calls',
	'keeps', 'helps', 'tries', 'goes', 'comes', 'expects', 'requires', 'wants'];
const PLURAL_AUX = { have: 'has', are: 'is', were: 'was', do: 'does',
	"don't": "doesn't", "aren't": "isn't", "weren't": "wasn't", "haven't": "hasn't" };
// Base forms that are rarely nouns, so "each request take" is a verb slot.
const BASE_VERBS = ['take', 'contain', 'require', 'include', 'get', 'send',
	'create', 'provide', 'expose', 'accept', 'reject', 'expect', 'allow', 'emit',
	'depend', 'belong', 'seem', 'appear', 'become', 'remain', 'exist', 'happen',
	'occur', 'receive', 'ensure', 'prevent', 'give', 'go', 'come', 'know', 'compile',
	'listen', 'connect', 'parse', 'render', 'resolve', 'have', 'do', 'fail'];

const apostrophe = (word) => word.replace("'", "['’]");
const straight = (word) => word.replace('’', "'");

/** The verb form a plural subject takes: "passes" -> "pass", "is" -> "are". */
function pluralVerb(verb) {
	const plain = straight(verb.toLowerCase());
	if (SINGULAR_AUX[plain]) return SINGULAR_AUX[plain];
	if (/ies$/.test(plain)) return plain.slice(0, -3) + 'y';
	if (/(?:ss|x|z|ch|sh)es$/.test(plain)) return plain.slice(0, -2);
	return plain.slice(0, -1);
}

/** The verb form a singular subject takes: "take" -> "takes", "have" -> "has". */
function singularVerb(verb) {
	const plain = straight(verb.toLowerCase());
	if (PLURAL_AUX[plain]) return PLURAL_AUX[plain];
	if (plain === 'go') return 'goes';
	if (/[^aeiou]y$/.test(plain)) return plain.slice(0, -1) + 'ies';
	if (/(?:s|x|z|ch|sh|o)$/.test(plain)) return plain + 'es';
	return plain + 's';
}

/** The singular of a regular plural noun: "checks" -> "check". */
function singularNoun(noun) {
	if (/ies$/.test(noun)) return noun.slice(0, -3) + 'y';
	if (/(?:ss|x|ch|sh)es$/.test(noun)) return noun.slice(0, -2);
	return noun.slice(0, -1);
}

const AGREEMENT = [
	// A plural subject with a singular verb: "the artifacts is uploaded".
	{ re: new RegExp(`(?<=${PLURAL_SUBJECT_START}(?:${PLURAL_DETERMINER})\\s+${MODIFIER}` +
		`${PLURAL_NOUN}\\s+)(?:${alt(Object.keys(SINGULAR_AUX).map(apostrophe))}|` +
		`${alt(SINGULAR_VERBS)})\\b(?![-'’])`, 'g'),
		hint: (m) => `use "${pluralVerb(m[0])}"` },
	// A singular subject with a plural verb: "the pipeline have three stages".
	{ re: new RegExp(`(?<=${SINGULAR_SUBJECT_START}(?:${SINGULAR_DETERMINER})\\s+${SINGULAR_MODIFIER}` +
		`${SINGULAR_NOUN}\\s+)(?:${alt(Object.keys(PLURAL_AUX).map(apostrophe))})` +
		'(?![\\w\'’-])', 'g'),
		hint: (m) => `use "${singularVerb(m[0])}"` },
	// ... or with a base verb that is rarely a noun: "the config file contain".
	{ re: new RegExp(`(?<=${SINGULAR_SUBJECT_START}(?:${SINGULAR_DETERMINER})\\s+${SINGULAR_MODIFIER}` +
		`${SINGULAR_NOUN}\\s+)(?:${alt(BASE_VERBS.filter((v) => !PLURAL_AUX[v]))})\\b(?![-'’])`, 'g'),
		hint: (m) => `use "${singularVerb(m[0])}"` },
	// "it" with a base verb: "It run every night". "read" and "put" stay out:
	// their past tense is spelled like the base ("because it read as").
	{ re: new RegExp(`(?<=${SINGULAR_SUBJECT_START}[Ii]t\\s+)(?:${alt(BASE_VERBS)}|run|need|use|` +
		"work|call|return|start|stop|update|check|build|load|write|store|handle|show|" +
		"look|pass|break|crash|hang|wait|retry|poll)\\b(?![-'’])", 'g'),
		hint: (m) => `use "${singularVerb(m[0])}"` },
	// A plural demonstrative before a singular noun and verb: "These setting is".
	{ re: new RegExp(`\\b(?:[Tt]hese|[Tt]hose)(?=\\s+${NOUN_AFTER_DEMONSTRATIVE}\\s+(?:is|was|has|does)\\b)`, 'g'),
		hint: (m) => `use "${keepCase(m[0], m[0].toLowerCase() === 'these' ? 'this' : 'that')}"` },
	// "each" and "every" take a singular noun and a singular verb.
	{ re: new RegExp(`(?<=\\b[Ee](?:ach|very)\\s+)${PLURAL_NOUN}` +
		'(?=\\s+(?:is|are|was|were|has|have|runs?|must|should|can|will|may)\\b)', 'g'),
		hint: (m) => `use "${singularNoun(m[0])}"` },
	// "There is three open incidents."
	{ re: /\b([Tt]here)(?:['’]s|\s+is|\s+(was))(?=\s+(?:two|three|four|five|six|seven|eight|nine|ten|several|many|multiple|[2-9]|\d{2,})\b(?!\s*(?:-|%|percent\b|[kKMG]?B\b|ms\b|minutes?\b|hours?\b|seconds?\b|days?\b|weeks?\b|months?\b|years?\b|dollars?\b|times?\b)))/g,
		hint: (m) => `use "${m[1]} ${m[2] ? 'were' : 'are'}"` },
];

// Homophones in the one frame where only one spelling is grammatical.
const HOMOPHONES = [
	{ re: /\b[Ii]t['’]s(?=\s+own\b)/g, hint: () => 'use "its"' },
	{ re: /\b[Yy]ou['’]re(?=\s+own\b)/g, hint: (m) => `use "${keepCase(m[0], 'your')}"` },
	{ re: /\b[Yy]our(?=\s+(?:going\s+to|not\b(?!-)|able\s+to|all\s+set\b|welcome\s*[.!,]))/g,
		hint: (m) => `use "${keepCase(m[0], "you're")}"` },
	{ re: /\b[Tt]heir(?=\s+going\s+to\b)/g, hint: (m) => `use "${keepCase(m[0], "they're")}"` },
	{ re: /(?<=\bover\s+)their(?=\s*[.,;:!?])/g, hint: () => 'use "there"' },
	{ re: /\b[Ww]hose(?=\s+(?:going|been|gonna)\b)/g, hint: (m) => `use "${keepCase(m[0], "who's")}"` },
	{ re: /(?<=\b(?:to|will|won['’]t|would|could|can|can['’]t|might|may|must|should|don['’]t|doesn['’]t|didn['’]t|not|never)\s+)loose\b/g,
		hint: () => 'use "lose"' },
	{ re: /\bprinciple(?=\s+(?:engineer|investigator|architect|designer|developer|scientist|component|components|owner|author|consultant|analyst|officer|reason|cause|concern|source)\b)/g,
		hint: () => 'use "principal"' },
	{ re: /(?<=\b(?:decide|decides|decided|deciding|know|knows|knew|check|checks|checked|determine|determines|determined|ask|asked|wonder|wondered|unsure|unclear|choose|chose)\s+)weather\b|\bweather(?=\s+or\s+not\b)/g,
		hint: () => 'use "whether"' },
	{ re: /(?<=\b(?:[Pp]lease|will|would|should|can|could|must|we|I|they|you)\s+)advice(?=\s+(?:the|a|an|you|them|us|him|her|me|our|your|their|on|against)\b)/g,
		hint: () => 'use "advise"' },
	{ re: /(?<!\b(?:a|an|the)\s+)\breal(?=\s+(?:slow|fast|quick|good|bad|easy|hard|simple|big|small|well|soon|quickly|slowly)\b)/g,
		hint: () => 'use "really"' },
	{ re: /\beveryday(?=\s*[.,;:!?]|\s+(?:at|in|on|and|to|for|by|until|before|after|from|since|so|or|but)\b)/g,
		hint: () => 'use "every day"' },
	// "to" before an adjective that "too" must intensify: "was to complex to
	// finish", "is to large for the queue", "are to many retries".
	{ re: /(?<=\b(?:is|are|was|were|be|been|being|seems?|seemed|looks?|looked|feels?|felt|gets?|got|becomes?|became|far|way)\s+)to(?=\s+(?:complex|complicated|large|big|small|long|short|late|early|high|low|hard|difficult|expensive|costly|risky|busy|old|new|heavy|strict|broad|narrow|wide|deep|shallow|noisy|verbose|aggressive|conservative|vague|generic|brittle|fragile|tight|slow|easy|simple|weak|strong|thin|thick|wordy|dense|sparse|frequent|rare|good|bad)\b(?:\s+(?:to|for)\b|\s*[.,;:!?]))/g,
		hint: () => 'use "too"' },
	{ re: /(?<=\b(?:is|are|was|were|be|been|far|way)\s+)to(?=\s+(?:many|much|few)\b)/g,
		hint: () => 'use "too"' },
];

// A closed compound noun used as a verb: "Setup the server", "we shutdown the
// old cluster", "need to login to the console". Only verb slots count: after a
// subject pronoun, a modal, or "please"; after an infinitive "to"; or opening
// an imperative with an object. "Setup takes a day" and "go to checkout" stay.
const PHRASAL = { setup: 'set up', login: 'log in', logout: 'log out', signup: 'sign up',
	signin: 'sign in', backup: 'back up', checkout: 'check out', shutdown: 'shut down',
	cleanup: 'clean up', rollout: 'roll out', rollback: 'roll back', lookup: 'look up',
	startup: 'start up', teardown: 'tear down', failover: 'fail over',
	followup: 'follow up', handoff: 'hand off', workaround: 'work around' };
const COMPOUND = `(?:${alt(Object.keys(PHRASAL))})`;
const OBJECT_AFTER = '(?=\\s+(?:the|a|an|your|our|their|its|this|that|these|those|all|any|' +
	'every|each|it|them|to|into)\\b)';
const phrasalHint = (m) => `use "${keepCase(m[0], PHRASAL[m[0].toLowerCase()])}"`;
const PHRASAL_VERBS = [
	{ re: new RegExp('(?<=\\b(?:I|[Ww]e|[Yy]ou|[Tt]hey|[Ww]ill|[Ww]ould|[Cc]an|[Cc]ould|' +
		"[Ss]hould|[Mm]ust|[Mm]ight|[Mm]ay|[Pp]lease|[Dd]on['’]t|[Dd]oesn['’]t|[Dd]idn['’]t|" +
		`[Ww]on['’]t)\\s+)${COMPOUND}\\b(?![-'’])`, 'g'), hint: phrasalHint },
	{ re: new RegExp('(?<=\\b(?:need|needs|needed|want|wants|wanted|try|tries|tried|how|' +
		'remember|forget|able|have|has|had|going|plan|plans|decide|decided|allowed|' +
		'required|unable|easy|hard|possible|time|order|used|ask|asked)\\s+to\\s+)' +
		`${COMPOUND}\\b${OBJECT_AFTER}`, 'g'), hint: phrasalHint },
	{ re: new RegExp('(?<=^(?:\\s|[-*+>]\\s|\\d{1,2}[.)]\\s)*)(?:' +
		`${Object.keys(PHRASAL).map((w) => w[0].toUpperCase() + w.slice(1)).join('|')})` +
		`\\b${OBJECT_AFTER}`, 'g'), hint: phrasalHint },
];

// Adjectives in an adverb's slot, right after a process verb and before a
// clause boundary: "the rollback happens automatic".
const ADVERB_OF = { automatic: 'automatically', immediate: 'immediately',
	instant: 'instantly', perfect: 'perfectly', seamless: 'seamlessly',
	silent: 'silently', manual: 'manually', dynamic: 'dynamically',
	periodic: 'periodically', consistent: 'consistently', correct: 'correctly',
	proper: 'properly', incremental: 'incrementally', gradual: 'gradually',
	graceful: 'gracefully', efficient: 'efficiently', sequential: 'sequentially',
	synchronous: 'synchronously', asynchronous: 'asynchronously',
	concurrent: 'concurrently', recursive: 'recursively', random: 'randomly',
	continuous: 'continuously', reliable: 'reliably', quick: 'quickly',
	successful: 'successfully', intermittent: 'intermittently',
	independent: 'independently' };
const PROCESS_VERB = '(?:happen|run|ran|work|update|load|respond|restart|retry|retrie|fail|' +
	'complete|close|sync|refresh|deploy|reload|scale|recover|execute|finish|start|stop|' +
	'resolve|render|compile|built|build|install|upgrade|handle|process|exit)' +
	'(?:s|es|ed|d|ing)?';
const ADVERB_SLOT = [
	{ re: new RegExp(`(?<=\\b${PROCESS_VERB}\\s+)(?:${alt(Object.keys(ADVERB_OF))})` +
		'(?=\\s*[.,;:!?]|\\s+(?:when|if|on|in|at|after|before|and|but|for|with|during|' +
		'every|once|until|unless|whenever|without|across|of)\\b)', 'g'),
		hint: (m) => `use "${ADVERB_OF[m[0]]}"` },
];

// Comma splices a conjunctive adverb reveals: ", however the migration was".
// "However" also means "in whatever way" ("name it, however the team
// prefers"), so it counts only when an auxiliary or copula follows its
// subject.
const SUBJECT = '(?:the|a|an|this|that|these|those|it|we|they|you|I|he|she|there|our|' +
	'their|its|my|your|some|most|no)';
const AUXILIARY = '(?:is|are|was|were|has|have|had|did|does|do|will|would|can|could|' +
	'should|may|might|must)';
const SPLICES = [
	{ re: new RegExp(`,\\s+(however)(?=\\s+${SUBJECT}\\s+(?:[a-z-]+\\s+)?${AUXILIARY}\\b)`, 'g'),
		hint: (m) => `use "; ${m[1]},"` },
	{ re: new RegExp('(?<!\\b(?:is|was|are|were|be))' +
		',\\s+(therefore|moreover|furthermore|nevertheless|nonetheless|consequently)' +
		`(?=\\s+${SUBJECT}\\b)`, 'g'), hint: (m) => `use "; ${m[1]},"` },
];

// Whole-sentence shapes, checked on prose only because a list item may be a
// fragment by design.
const SENTENCE_SHAPES = [
	// A question closed with a period. "Do" and "Have" also open imperatives,
	// and a comma may mark an inverted condition ("Should the canary fail, ...").
	{ re: /(?<=^(?:Did|Does|Is|Are|Was|Were|Has|Can|Could|Will|Would|Should)\s+(?:the|it|this|that|these|those|there|we|you|they|he|she|I|our|your|their|anyone|everyone)\b[^.?!:;,]*)\.$/g,
		prose: true, hint: () => 'use "?"' },
	// A subordinate clause with no main clause: "Which means the cache is
	// stale." or "Because the build failed." The same shape catches an opening
	// clause that runs into its main clause without a comma. The lowercase
	// letter before the period keeps an abbreviation such as "U.S." from
	// ending the sentence.
	{ re: /^(?:Which|Because(?!\s+of\b)|Although|Whereas|Such as)\b[^,;:?!]*[a-z0-9]\.$/g,
		prose: true,
		hint: () => 'a subordinate clause needs a main clause: join it to the sentence ' +
			'it depends on, or add a comma where the main clause starts' },
];

const SUBJECT_FORM = { him: 'He', her: 'She', them: 'They' };

// Forms that break after a subject, modal, or quantity.
const FORMS = [
	{ re: /\b([Bb]etween\s+you\s+and\s+)I\b/g, hint: (m) => `use "${m[1]}me"` },
	{ re: /(?<=\b(?:to|for|with|from|about|by|at|of|like|than|toward|towards|without)\s+[A-Z][a-z]+\s+and\s+)I(?=\s*[.,;:!?]|\s+(?:to|for|in|on|at|by|with|about|after|before|until)\b)/g,
		hint: () => 'use "me"' },
	{ re: /(?<=^(?:\s|[-*+]\s)*)(?:Him|Her|Them)(?=\s+and\b)/g,
		hint: (m) => `use "${SUBJECT_FORM[m[0].toLowerCase()]}"` },
	{ re: /\b(?:[Cc]an['’]t|[Cc]annot|[Cc]ouldn['’]t)\s+(?:hardly|barely|scarcely)\b/g,
		hint: (m) => `use "${m[0].replace(/^([Cc])(?:an['’]t|annot)/, '$1an').replace(/^([Cc])ouldn['’]t/, '$1ould')}"` },
	{ re: /\b(?:[Dd]on['’]t|[Dd]oesn['’]t|[Dd]idn['’]t|[Ww]on['’]t)\s+(?:have|has|need|want|get|see|know|find)\s+(?:no|nothing|nobody|none)\b(?!\s+(?:one|longer|more|less)\b)/g,
		hint: () => 'a double negative: use "any", "anything", or "anybody", or drop the "not"' },
	{ re: new RegExp(`(?<=\\b(?:${['need', 'needs', 'needed', 'want', 'wants', 'wanted',
		'remember', 'forget', 'try', 'tries', 'tried', 'how', 'able', 'plan', 'plans', 'planned',
		'going', 'decide', 'decided'].map(eitherCase).join('|')})\\s+to\\s+)` +
		'(?![a-z]*(?:ss|us|is|as|eed)\\b)(?!(?:bring|sing|ring|sting|swing|spring|string|' +
		'fling|cling|sling|wring|ping|embed|shed|shred)\\b)[a-z]+(?:ed|ing|s)\\b', 'g'),
		hint: () => 'the verb after "to" takes its base form ("to run", not "to runs")' },
	{ re: /\b(?:informations|feedbacks|softwares|hardwares|equipments|knowledges|furnitures|advices)\b/g,
		hint: (m) => `use "${m[0].slice(0, -1)}"` },
	{ re: /(?<!\b(?:it|that|what|there|here|who|let|he|she))\b(?![A-Z])[a-z]+['’]s(?=\s+(?:are|were)\b)/g,
		hint: (m) => `use "${m[0].slice(0, -2)}s"` },
	{ re: /(?<=^(?:\s|[-*+]\s)*)Me\s+and\s+([A-Z][a-z]+|him|her|them)\b(?=\s+[a-z]+\b)/g,
		hint: (m) => `use "${SUBJECT_FORM[m[1]] ?? m[1]} and I"` },
	{ re: new RegExp('(?<=(?<!\\b(?:[Hh]ave|[Hh]as|[Hh]ad|[Hh]aving)\\s+)\\b(?:I|[Ww]e|' +
		"[Yy]ou|[Tt]hey|[Hh]e|[Ss]he)\\s+)seen\\b", 'g'),
		hint: () => 'use "saw"' },
	{ re: /(?<=\b(?:can|could|will|would|should|must|might|may|shall)(?:\s+not)?\s+)(?!\w*eed\b)(?!(?:embed|shed|shred|wed|bed|sled|red|bred)\b)[a-z]+ed\b/g,
		hint: () => 'a modal takes the base form of the verb ("will fix", not "will fixed")' },
	{ re: new RegExp('(?<=\\b(?:can|could|will|would|should|must|might|may|shall)\\s+)' +
		'(?:has|does|is|was|goes|retries|runs|returns|fixes|needs|takes|makes|gets|uses)\\b', 'g'),
		hint: (m) => `use "${{ has: 'have', does: 'do', is: 'be', was: 'be' }[m[0]] ??
			pluralVerb(m[0])}"` },
	{ re: new RegExp(`(?<!\\bor\\s+)\\b([Ll]ess)(?=\\s+${PLURAL_NOUN})`, 'g'),
		hint: (m) => `use "${keepCase(m[1], 'fewer')}"` },
	{ re: /\b[A-Z]{2,}['’]s(?=\s+(?:are|were|have|do|don['’]t)\b)/g,
		hint: (m) => `use "${m[0].slice(0, -2)}s"` },
	{ re: /(?<![\w/.-])(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|september|october|november|december)(?![\w/-]|\.\w)/g,
		hint: (m) => `use "${m[0][0].toUpperCase() + m[0].slice(1)}"` },
];

const DOUBLED_MARKS = [
	{ re: /!{2,}|\?{2,}/g, hint: (m) => `use "${m[0][0]}"` },
];

export const GRAMMAR_PATTERNS = [
	// Function words English never doubles. Particles and determiners stay
	// out: "log in in a tab", "turns on on boot", "what it is is", "this
	// this week", "press a a second time" are all grammatical.
	{ re: /\b(the|an|of|and|for|with|was|are|or|as|if|be)\s+\1\b/gi,
		hint: (m) => `use "${m[1].toLowerCase()}"` },
	{ re: /\b(could|should|would|must|might|may)\s+of\b(?!\s+course\b)/gi,
		hint: (m) => `use "${m[1].toLowerCase()} have"` },
	{ re: /\bits(?=\s+(?:a|an|the|not|now|also|been|being|already|still|just|going|because|too)\b)/gi,
		hint: () => 'use "it\'s"' },
	{ re: /\btheir(?=\s+(?:is|are|was|were)\b)/gi, hint: () => 'use "there"' },
	{ re: new RegExp(`\\b(${Object.keys(MISSPELLINGS).join('|')})\\b`, 'gi'),
		hint: (m) => `use "${MISSPELLINGS[m[1].toLowerCase()]}"` },
	...AGREEMENT,
	...HOMOPHONES,
	...PHRASAL_VERBS,
	...ADVERB_SLOT,
	...SPLICES,
	...SENTENCE_SHAPES,
	...FORMS,
	...DOUBLED_MARKS,
];
