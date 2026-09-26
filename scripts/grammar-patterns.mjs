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
	neccessary: 'necessary', occassion: 'occasion',
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

const alt = (words) => words.join('|');
// The start of a sentence as the span refiner sees it: the raw sentence may
// open with the line break before it or a list marker.
const LINE_START = '^(?:\\s|[-*+>]\\s|\\d{1,2}[.)]\\s)*';
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

// "after", "before", "since", and "until" stay out: as prepositions they
// put a noun phrase before the real subject ("arguments after the command
// are appended").
const CLAUSE_OPENERS = ['[Ww]hen', '[Ii]f', '[Oo]nce', '[Bb]ecause', '[Ww]hile',
	'[Uu]nless', '[Ww]hether', '[Aa]lthough', '[Tt]hough', '[Ww]here', '[Ww]hich',
	'[Ww]ho', '[Bb]ut', '[Ss]o', '[Tt]hen'];
const clauseStart = (openers) => `(?:${LINE_START}|[,;:(]\\s*|\\b(?:${alt(openers)})\\s+)`;
// "that" opens no clause here: it is often a relative pronoun ("the config
// that the installer writes lives"), and "requires that the client have a
// token" is a subjunctive. "and" and "or" join nouns inside a phrase as
// often as clauses ("Britain and its inhabitants").
const SUBJECT_START = clauseStart(CLAUSE_OPENERS);
// "were" after a singular subject is a subjunctive after "if", "though",
// "unless", or "whether" ("if the primary were to fail"), and before "to".
const WERE_SUBJECT_START = clauseStart(CLAUSE_OPENERS.filter((w) =>
	!/^\[..\](?:f|hough|lthough|nless|hether)$/.test(w)));
// A modifier is not a function word or a superlative: "the most useful are"
// uses an adjective as the noun, and a preposition means a phrase.
const NOT_MODIFIER = '(?!(?:most|least|best|worst|only|of|in|on|at|for|with|from|to|by|as|' +
	'about|after|before|into|than|and|or|but|that|which|who|whose)\\s)';
const MODIFIER = `(?:${NOT_MODIFIER}[a-z][a-z-]*\\s+)?`;
// A plural modifier would make the next word the noun: "the users now have".
const SINGULAR_MODIFIER = `(?:${NOT_MODIFIER}(?![a-z-]*s\\s)[a-z][a-z-]*\\s+)?`;

// Words that end in s but are singular, adverbs, pronouns, verbs that open a
// pseudo-cleft ("what the team needs is"), or lowercase product names. The
// suffix check covers class, status, analysis, famous, and physics.
const NOT_PLURAL_NOUN = alt(['news', 'series', 'species', 'means', 'lens', 'canvas',
	'alias', 'atlas', 'bias', 'gas', 'chaos', 'ethos', 'kudos', 'always', 'sometimes',
	'perhaps', 'towards', 'afterwards', 'besides', 'nowadays', 'whereas', 'yes',
	'hers', 'ours', 'yours', 'theirs', 'its', 'has', 'was', 'does', 'thus', 'plus',
	'minus', 'us', 'as', 'headquarters', 'whereabouts', 'wants', 'needs', 'likes', 'says',
	'thinks', 'sees', 'knows', 'cares', 'matters', 'counts', 'costs', 'gets', 'takes',
	'makes', 'gives', 'expects', 'requires', 'prefers', 'uses', 'asks', 'feels',
	'finds', 'hears', 'believes', 'intends', 'plans', 'wishes', 'hopes', 'seems',
	'looks', 'sounds', 'runs', 'works', 'shows', 'tells', 'calls', 'keeps', 'lets',
	'helps', 'tries', 'goes', 'comes', 'postgres', 'kubernetes', 'jenkins', 'express',
	'rails', 'pandas', 'aws', 'dns', 'https', 'css', 'sms', 'gps', 'cms', 'os', 'ios',
	'macos', 'js', 'ts', 'fs', 'ms']);
const PLURAL_NOUN = `(?![a-z]*(?:ss|us|is|ous|ics)\\b)(?!(?:${NOT_PLURAL_NOUN})\\b)` +
	'[a-z]+s\\b(?![-\'’])';

// Where a noun phrase ends: punctuation, a closed-class word, or a past-tense
// verb, none of which can be the phrase's head noun.
const PHRASE_END = '(?=\\s*(?:[.,;:!?)]|$)|\\s+(?:and|or|but|than|to|in|on|at|of|for|per|' +
	'with|from|by|after|before|during|since|until|over|under|across|about|are|were|' +
	'will|would|can|could|should|may|might|that|which|who|when|if|as|so|because|' +
	'today|now|here|there|overall|(?![a-z]*eed\\b)[a-z]{3,}ed)\\b)';

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
	'loci', 'foci', 'cacti', 'alumni', 'ocelli', 'bacilli', 'termini', 'syllabi', 'radii',
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
// -ae and -ii cover Latin plurals such as algae and radii; -men, -people, -children, and
// -data cover compounds such as salesmen and metadata; -ed covers
// participles ("the user approved are").
const PLURAL_ENDING = '(?:s|ing|ly|ae|ata|ii|ed|men|people|children|data)';
const SINGULAR_NOUN = `(?![a-z]*${PLURAL_ENDING}\\b)(?!(?:${NOT_SINGULAR_NOUN})\\b)` +
	"[a-z]+\\b(?![-'’])";
// After "these" or "those" an -ing word is a noun ("these setting is").
const NOUN_AFTER_DEMONSTRATIVE = `(?![a-z]*(?:s|ly|ae|ata|ii|ed|men|people|children|data)\\b)` +
	`(?!(?:${NOT_SINGULAR_NOUN})\\b)` +
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
const SINGULAR_VERBS = ['returns', 'supports', 'includes', 'contains', 'depends',
	'fails', 'passes', 'creates', 'deletes', 'sends', 'accepts', 'rejects', 'allows',
	'provides', 'exposes', 'emits', 'retries', 'owns', 'belongs', 'exists', 'happens',
	'occurs', 'appears', 'becomes', 'remains', 'receives', 'ensures', 'prevents',
	'causes', 'lives', 'connects', 'listens', 'resolves', 'renders', 'parses',
	'compiles', 'fetches', 'seems', 'takes', 'gets', 'makes', 'keeps', 'helps', 'tries',
	'goes', 'comes', 'expects', 'requires', 'wants'];
// Verbs that also name a plural thing ("the sales calls last an hour"). After
// a plural noun they count only before an object: "the workers polls the queue".
const NOUN_LIKE_VERBS = ['polls', 'shares', 'handles', 'stores', 'loads', 'reads',
	'writes', 'starts', 'stops', 'updates', 'matches', 'points', 'checks', 'waits',
	'triggers', 'deploys', 'builds', 'shows', 'runs', 'works', 'uses', 'needs',
	'looks', 'calls'];
const AUXILIARY = '(?:is|are|was|were|has|have|had|did|does|do|will|would|can|could|' +
	'should|may|might|must)';
const PLURAL_AUX = { have: 'has', are: 'is', were: 'was', do: 'does',
	"don't": "doesn't", "aren't": "isn't", "weren't": "wasn't", "haven't": "hasn't" };
// Base forms that are rarely nouns, so "each request take" is a verb slot.
const BASE_VERBS = ['take', 'contain', 'require', 'include', 'get', 'send',
	'create', 'provide', 'expose', 'accept', 'reject', 'expect', 'allow', 'emit',
	'depend', 'belong', 'seem', 'appear', 'become', 'remain', 'exist', 'happen',
	'occur', 'receive', 'ensure', 'prevent', 'give', 'go', 'come', 'know', 'compile',
	'listen', 'connect', 'resolve', 'have', 'do', 'fail'];

const apostrophe = (word) => word.replace("'", "['’]");
const straight = (word) => word.replace('’', "'");
// A replacement keeps the author's apostrophe: "isn’t" becomes "aren’t".
const sameMarks = (from, to) => (from.includes('’') ? to.replace(/'/g, '’') : to);

/** The verb form a plural subject takes: "passes" -> "pass", "is" -> "are". */
function pluralVerb(verb) {
	const plain = straight(verb.toLowerCase());
	if (SINGULAR_AUX[plain]) return SINGULAR_AUX[plain];
	if (plain === 'goes') return 'go';
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

/**
 * The singular of a plural noun when dropping its s is certain ("checks" ->
 * "check"), or null. An -es or -ies plural is ambiguous: "statuses" drops
 * "es", "caches" drops "s", and "movies" does not end in -y.
 */
function singularNoun(noun) {
	return /[^es]s$/.test(noun) ? noun.slice(0, -1) : null;
}

const AGREEMENT = [
	// A plural subject with a singular verb: "the artifacts is uploaded". A
	// lexical verb followed by another verb was a noun ("the ops runs
	// happen"), and a noun-like one needs an object after it.
	{ re: new RegExp(`(?<=${SUBJECT_START}(?:${PLURAL_DETERMINER})\\s+${MODIFIER}` +
		`${PLURAL_NOUN}\\s+)(?:(?:${alt(Object.keys(SINGULAR_AUX).map(apostrophe))})\\b|` +
		`(?:${alt(SINGULAR_VERBS)})\\b(?!\\s+(?:${AUXILIARY}|${alt(BASE_VERBS)}|happen|run|` +
		`work|start|stop|pass)\\b)|(?:${alt(NOUN_LIKE_VERBS)})\\b(?=\\s+(?:the|a|an|its|their|` +
		'our|your|every|each|all|this|that|these|those|no|it|them)\\b))(?![-\'’])', 'g'),
		hint: (m) => `use "${sameMarks(m[0], pluralVerb(m[0]))}"` },
	// A singular subject with a plural verb: "the pipeline have three stages".
	{ re: new RegExp(`(?<=${SUBJECT_START}(?:${SINGULAR_DETERMINER})\\s+${SINGULAR_MODIFIER}` +
		`${SINGULAR_NOUN}\\s+)(?:${alt(Object.keys(PLURAL_AUX).filter((v) => !v.startsWith('were'))
			.map(apostrophe))})(?![\\w'’-])`, 'g'),
		hint: (m) => `use "${sameMarks(m[0], singularVerb(m[0]))}"` },
	{ re: new RegExp(`(?<=${WERE_SUBJECT_START}(?:${SINGULAR_DETERMINER})\\s+${SINGULAR_MODIFIER}` +
		`${SINGULAR_NOUN}\\s+)were(?:n['’]t)?(?![\\w'’-])(?!\\s+to\\b)`, 'g'),
		hint: (m) => `use "${sameMarks(m[0], singularVerb(m[0]))}"` },
	// ... or with a base verb that is rarely a noun: "the config file contain".
	{ re: new RegExp(`(?<=${SUBJECT_START}(?:${SINGULAR_DETERMINER})\\s+${SINGULAR_MODIFIER}` +
		`${SINGULAR_NOUN}\\s+)(?:${alt(BASE_VERBS.filter((v) => !PLURAL_AUX[v]))})\\b(?![-'’])`, 'g'),
		hint: (m) => `use "${singularVerb(m[0])}"` },
	// "it" with a base verb: "It run every night". "read" and "put" stay out:
	// their past tense is spelled like the base ("because it read as").
	// "need" counts unless it is the modal ("it need not be perfect").
	{ re: new RegExp(`(?<=${SUBJECT_START}[Ii]t\\s+)(?:${alt(BASE_VERBS)}|run|use|` +
		'need(?!\\s+(?:not|only|never|hardly|scarcely|no|be)\\b)|' +
		"work|call|return|start|stop|update|check|build|load|write|store|handle|show|" +
		"look|pass|break|crash|hang|wait|retry|poll)\\b(?![-'’])", 'g'),
		hint: (m) => `use "${singularVerb(m[0])}"` },
	// A plural demonstrative before a singular noun and verb: "These setting is".
	{ re: new RegExp(`\\b(?:[Tt]hese|[Tt]hose)(?=\\s+${NOUN_AFTER_DEMONSTRATIVE}\\s+(?:is|was|has|does)\\b)`, 'g'),
		hint: (m) => `use "${keepCase(m[0], m[0].toLowerCase() === 'these' ? 'this' : 'that')}"` },
	// "each" and "every" take a singular noun and a singular verb.
	{ re: new RegExp(`(?<=\\b[Ee](?:ach|very)\\s+)${PLURAL_NOUN}` +
		'(?=\\s+(?:is|are|was|were|has|have|runs?|must|should|can|will|may)\\b)', 'g'),
		hint: (m) => (singularNoun(m[0]) ? `use "${singularNoun(m[0])}"`
			: '"each" takes a singular noun') },
	// "There is three open incidents." The count is a whole number followed,
	// within three words, by a plural noun that is not a unit: "there is 10.5
	// GB free", "there is 24/7 support", and "there is 20 ms" stay.
	{ re: /\b([Tt]here)(?:['’]s|\s+is|\s+(was))(?=\s+(?:two|three|four|five|six|seven|eight|nine|ten|several|many|multiple|[2-9]|\d{1,3}(?:,\d{3})+|\d{2,})(?![\w.,/%-])\s+(?:[a-z-]+\s+){0,2}(?!(?:minutes|mins|hours|hrs|seconds|secs|days|weeks|months|years|dollars|euros|pounds|cents|times|bytes|kilobytes|megabytes|gigabytes|terabytes|ms|ns|rps|kbps|mbps|gbps)\b)[a-z-]+s\b)/g,
		hint: (m) => `use "${m[1]} ${m[2] ? 'were' : 'are'}"` },
];

// Homophones in the one frame where only one spelling is grammatical.
const HOMOPHONES = [
	{ re: /\b[Ii]t['’]s(?=\s+own\b)/g, hint: (m) => `use "${keepCase(m[0], 'its')}"` },
	{ re: /\b[Yy]ou['’]re(?=\s+own\b)/g, hint: (m) => `use "${keepCase(m[0], 'your')}"` },
	{ re: /\b[Yy]our(?=\s+(?:going\s+to|not\b(?!-)|able\s+to|all\s+set\b|welcome\s*[.!,]))/g,
		hint: (m) => `use "${keepCase(m[0], "you're")}"` },
	{ re: /\b[Tt]heir(?=\s+going\s+to\b)/g, hint: (m) => `use "${keepCase(m[0], "they're")}"` },
	{ re: /(?<=\bover\s+)their(?=\s*[.,;:!?])/g, hint: () => 'use "there"' },
	{ re: /\b[Ww]hose(?=\s+(?:going|been|gonna)\b)/g, hint: (m) => `use "${keepCase(m[0], "who's")}"` },
	// "loose" is an adjective after "is not" or "from tight to", so only a
	// verb slot counts: a modal, a negated auxiliary, or an infinitive "to".
	{ re: /(?<=\b(?:will|won['’]t|would|could|can|can['’]t|might|may|must|should|don['’]t|doesn['’]t|didn['’]t|(?:want|wants|need|needs|going|trying|try|afraid|about|not|easy|hard)\s+to)\s+)loose\b(?=\s+[a-z])/g,
		hint: () => 'use "lose"' },
	{ re: /\bprinciple(?=\s+(?:engineer|investigator|architect|designer|developer|scientist|component|components|owner|author|consultant|analyst|officer|reason|cause|concern|source)\b)/g,
		hint: () => 'use "principal"' },
	// "weather" must open a clause ("decide weather to roll back"); "checks
	// weather forecasts" is the weather.
	{ re: /(?<=\b(?:decide|decides|decided|deciding|know|knows|knew|check|checks|checked|determine|determines|determined|ask|asked|wonder|wondered|unsure|unclear|choose|chose)\s+)weather(?=\s+(?:to|or|it|we|they|you|I|he|she|the|a|an|there|our|their|its|(?:this|that)(?!\s+(?:morning|afternoon|evening|week|month|year|quarter|time)\b))\b)|\bweather(?=\s+or\s+not\b)/g,
		hint: () => 'use "whether"' },
	{ re: /(?<=\b(?:[Pp]lease|will|would|should|can|could|must|we|I|they|you)\s+)advice(?=\s+(?:the|a|an|you|them|us|him|her|me|our|your|their|on|against)\b)/g,
		hint: () => 'use "advise"' },
	{ re: /(?<!\b(?:a|an|the)\s+)\breal(?=\s+(?:slow|fast|quick|good|bad|easy|hard|simple|big|small|well|soon|quickly|slowly)\b)/g,
		hint: () => 'use "really"' },
	// "everyday and professional use" is the adjective, so only a clause
	// boundary or a preposition may follow.
	{ re: /\beveryday(?=\s*[.,;:!?]|\s+(?:at|in|on|to|for|by|until|before|after|from|since)\b)/g,
		hint: () => 'use "every day"' },
	// "to" before an adjective that "too" must intensify: "was to complex to
	// finish", "is to large for the queue", "are to many retries".
	{ re: /(?<=\b(?:is|are|was|were|be|been|being|seems?|seemed|looks?|looked|feels?|felt|gets?|got|becomes?|became|far|way)\s+)to(?=\s+(?:complex|complicated|large|big|small|long|short|late|early|high|low|hard|difficult|expensive|costly|risky|busy|old|new|heavy|strict|broad|narrow|wide|deep|shallow|noisy|verbose|aggressive|conservative|vague|generic|brittle|fragile|tight|slow|easy|simple|weak|strong|thin|thick|wordy|dense|sparse|frequent|rare|good|bad)\b(?:\s+(?:to|for)\b|\s*[.,;:!?]))/g,
		hint: () => 'use "too"' },
	{ re: /(?<=\b(?:is|are|was|were|be|been|far|way)\s+)to(?=\s+(?:many|much|few)\b)/g,
		hint: () => 'use "too"' },
];

// A closed compound noun used as a verb: "Setup the server", "we shutdown the
// old cluster", "need to login to the console". Only verb slots count, and
// each needs an object after it: after a subject pronoun, a modal, or
// "please"; after an infinitive "to"; or opening an imperative at the
// sentence start or after a label and colon ("Action: Rollback the last
// deployment"). An object is a determiner or pronoun, never "to": "Failover
// to the secondary is automatic" is the noun. "Setup takes a day", "Can setup
// be automated?", and "we email you login instructions" stay.
const PHRASAL = { setup: 'set up', login: 'log in', logout: 'log out', signup: 'sign up',
	signin: 'sign in', backup: 'back up', checkout: 'check out', shutdown: 'shut down',
	cleanup: 'clean up', rollout: 'roll out', rollback: 'roll back', lookup: 'look up',
	startup: 'start up', teardown: 'tear down', failover: 'fail over',
	followup: 'follow up', handoff: 'hand off', workaround: 'work around' };
const COMPOUND = `(?:${alt(Object.keys(PHRASAL))})`;
// A demonstrative, "each", or "every" before a time word opens an
// adverbial, not an object: "Rollout this quarter is behind schedule".
const OBJECT = '(?:the|a|an|your|our|their|its|all|any|it|them|' +
	'(?:this|that|these|those|each|every)(?!\\s+(?:week|month|quarter|year|morning|' +
	'afternoon|evening|night|day|time|sprint|release|cycle)\\b))';
const OBJECT_AFTER = `(?=\\s+${OBJECT}\\b)`;
// Where the compound can only be a verb, "to", "into", or "for" may follow.
const OBJECT_OR_TO_AFTER = `(?=\\s+(?:${OBJECT}|to|into|for)\\b)`;
const phrasalHint = (m) => `use "${keepCase(m[0], PHRASAL[m[0].toLowerCase()])}"`;
const MODAL_VERB = '(?:will|would|can|could|should|must|might|may)';
const PHRASAL_VERBS = [
	// A verb slot: after "I", "we", "they", "please", or a negation, with an
	// optional modal between a subject and the compound ("you can login to").
	{ re: new RegExp('(?<=\\b(?:(?:I|[Ww]e|[Tt]hey|[Yy]ou)\\s+' + MODAL_VERB + '|I|[Ww]e|' +
		"[Tt]hey|[Pp]lease|[Dd]on['’]t|[Dd]oesn['’]t|[Dd]idn['’]t|[Ww]on['’]t)\\s+)" +
		`${COMPOUND}\\b${OBJECT_OR_TO_AFTER}`, 'g'), hint: phrasalHint },
	// A modal with no subject before it may open a question ("how long will
	// failover to the replica take?"), so there the compound needs an object.
	{ re: new RegExp(`(?<=\\b${MODAL_VERB}\\s+)${COMPOUND}\\b${OBJECT_AFTER}`, 'g'),
		hint: phrasalHint },
	// "you" is often an object ("we email you login instructions"), so after
	// it the compound needs a determiner or pronoun object.
	{ re: new RegExp(`(?<=\\b[Yy]ou\\s+)${COMPOUND}\\b${OBJECT_AFTER}`, 'g'), hint: phrasalHint },
	{ re: new RegExp('(?<=\\b(?:need|needs|needed|want|wants|wanted|try|tries|tried|how|' +
		'remember|forget|able|have|has|had|going|plan|plans|decide|decided|allowed|' +
		'required|unable|easy|hard|possible|time|order|used|ask|asked)\\s+to\\s+)' +
		`${COMPOUND}\\b${OBJECT_OR_TO_AFTER}`, 'g'), hint: phrasalHint },
	{ re: new RegExp(`(?<=${LINE_START}|:\\s+)(?:` +
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
// A process word after a determiner is a noun ("mark the run successful");
// "this" and "that" stay out, since they are often the subject ("this
// happens automatic").
const ADVERB_SLOT = [
	{ re: new RegExp('(?<=(?<!\\b(?:the|a|an|each|every|its|our|your|their|my)\\s+)' +
		`\\b${PROCESS_VERB}\\s+)(?:${alt(Object.keys(ADVERB_OF))})` +
		'(?=\\s*[.;:!?]|\\s+(?:when|if|on|in|at|after|before|but|for|with|during|' +
		'every|once|until|unless|whenever|without|across|of)\\b)', 'g'),
		hint: (m) => `use "${ADVERB_OF[m[0]]}"` },
];

// Comma splices a conjunctive adverb reveals: ", however the migration was".
// "However" also means "in whatever way" ("name it, however the team
// prefers", "keep the date, however the client has formatted it", "however
// the field is formatted"), so it counts only when a determiner opens the
// subject and a copula follows it, not before a participle.
const SUBJECT = '(?:the|a|an|this|that|these|those|it|we|they|you|I|he|she|there|our|' +
	'their|its|my|your|some|most|no)';
const DETERMINER_SUBJECT = '(?:the|a|an|this|that|these|those|our|their|its|my|your|some|' +
	'most|no)\\s+[a-z-]+';
const SPLICES = [
	{ re: new RegExp(`,\\s+(however)(?=\\s+${DETERMINER_SUBJECT}\\s+(?:[a-z-]+\\s+)?` +
		'(?:is|are|was|were)\\b(?!\\s+[a-z]+(?:ed|en)\\b))', 'g'),
		hint: (m) => `use "; ${m[1]},"` },
	{ re: new RegExp('(?<!\\b(?:is|was|are|were|be))' +
		',\\s+(therefore|moreover|furthermore|nevertheless|nonetheless|consequently)' +
		`(?=\\s+${SUBJECT}\\b)`, 'g'), hint: (m) => `use "; ${m[1]},"` },
];

// Whole-sentence shapes, checked on prose only because a list item may be a
// fragment by design. Each anchors past leading whitespace: the span is
// refined on the raw sentence, which can open with the line break before it.
const SENTENCE_SHAPES = [
	// A question closed with a period, with a pronoun subject: API docs open
	// descriptions on a bare verb ("Does the same thing as ...", "Has the same
	// effect"), though not on "Did". "Do" and "Have" also open imperatives,
	// and a comma may mark an inverted condition ("Should the canary fail, ...").
	{ re: /(?<=^(?:\s|[-*+>]\s|\d{1,2}[.)]\s)*(?:(?:Did|Does|Is|Are|Was|Were|Has|Can|Could|Will|Would|Should)\s+(?:it|this|that|there|we|you|they|he|she|I|anyone|everyone)|Did\s+(?:the|our|your|their))\b[^.?!:;,]*)\.$/g,
		prose: true, hint: () => 'use "?"' },
	// A subordinate clause with no main clause: "Which means the cache is
	// stale." or "Because the build failed." The same shape catches an opening
	// clause that runs into its main clause without a comma. The lowercase
	// letter before the period keeps an abbreviation such as "U.S." from
	// ending the sentence. As `fragment`, it skips the answer to a question
	// ("How come? Because ..."), where a fragment is idiomatic.
	// "Which approach you choose depends on your needs" is a whole sentence,
	// so "Which" counts only as the relative pronoun before its verb, and not
	// in a question used as a subject ("Which is better depends on ...",
	// "Which causes the error is still unknown").
	{ re: new RegExp(`(?<=${LINE_START})(?:Which\\s+(?:(?:is|was)(?!\\s+(?:better|best|worse|` +
		'worst|faster|slower|right|correct|preferred|easier|harder|cheaper|safer)\\b)|means|' +
		'meant|makes|made|explains|explained|leaves|left|lets|gives|gave|allows|allowed|causes|' +
		'caused|led|leads|results|resulted|breaks|broke|requires|required|forces|forced|' +
		'triggers|triggered|would|will|also)\\b(?![^.]*\\b(?:depends|matters|varies|' +
		'determines|decides|is\\s+(?:still\\s+)?(?:unknown|unclear|up\\s+to))\\b)|' +
		'Because(?!\\s+of\\b)|Although|Whereas|Such as)\\b[^,;:?!]*[a-z0-9]\\.$', 'g'),
		prose: true, fragment: true,
		hint: () => 'a subordinate clause needs a main clause: join it to the sentence ' +
			'it depends on, or add a comma where the main clause starts' },
];

const SUBJECT_FORM = { him: 'He', her: 'She', them: 'They' };

// Forms that break after a subject, modal, or quantity.
const FORMS = [
	{ re: /\b([Bb]etween\s+you\s+and\s+)I\b/g, hint: (m) => `use "${m[1]}me"` },
	{ re: /(?<=\b(?:to|for|with|from|about|by|at|of|like|than|toward|towards|without)\s+[A-Z][a-z]+\s+and\s+)I(?=\s*[.,;:!?]|\s+(?:to|for|in|on|at|by|with|about|after|before|until)\b)/g,
		hint: () => 'use "me"' },
	{ re: new RegExp(`(?<=${LINE_START})(?:Him|Her|Them)(?=\\s+and\\b)`, 'g'),
		hint: (m) => `use "${SUBJECT_FORM[m[0].toLowerCase()]}"` },
	{ re: /\b(?:[Cc]an['’]t|[Cc]annot|[Cc]ouldn['’]t)\s+(?:hardly|barely|scarcely)\b/g,
		hint: (m) => `use "${m[0].replace(/^([Cc])(?:an['’]t|annot)/, '$1an').replace(/^([Cc])ouldn['’]t/, '$1ould')}"` },
	{ re: /\b(?:[Dd]on['’]t|[Dd]oesn['’]t|[Dd]idn['’]t|[Ww]on['’]t)\s+(?:have|has|need|want|get|see|know|find)\s+(?:no|nothing|nobody|none)\b(?!-|\s+(?:one|longer|more|less)\b)/g,
		hint: () => 'a double negative: use "any", "anything", or "anybody", or drop the "not"' },
	{ re: new RegExp(`(?<=\\b(?:${['need', 'needs', 'needed', 'want', 'wants', 'wanted',
		'remember', 'forget', 'try', 'tries', 'tried', 'how', 'able', 'decide',
		'decided'].map(eitherCase).join('|')})\\s+to\\s+)` +
		'(?![a-z]*(?:ss|us|is|as|eed)\\b)(?!(?:bring|sing|ring|sting|swing|spring|string|' +
		'fling|cling|sling|wring|ping|wing|king|ding|zing|embed|shed|shred)\\b)' +
		'(?!(?:always|sometimes|perhaps|nowadays|afterwards|towards|besides|thus)\\b)' +
		'[a-z]+(?:ed|ing|s)\\b', 'g'),
		hint: () => 'the verb after "to" takes its base form ("to run", not "to runs")' },
	// "plan" is often a noun ("apply the plan to existing clusters"), so it
	// counts only after a subject or modal, and then only before an -ing verb,
	// not an -ing noun ("we plan to staging").
	{ re: /(?<=\b(?:I|[Ww]e|[Tt]hey|[Yy]ou|will|would|should|must|might|may|can|could|to)\s+plan(?:s|ned)?\s+to\s+)(?!(?:bring|string|spring|thing|training|meeting|staging|testing|building|funding|marketing|engineering|morning|evening)\b)[a-z]{3,}ing\b/g,
		hint: () => 'the verb after "to" takes its base form ("to run", not "to runs")' },
	{ re: /\b(?:informations|feedbacks|softwares|hardwares|equipments|knowledges|furnitures|advices)\b/g,
		hint: (m) => `use "${m[0].slice(0, -1)}"` },
	{ re: new RegExp(`(?<=${LINE_START})Me\\s+and\\s+([A-Z][a-z]+|him|her|them)\\b(?=\\s+[a-z]+\\b)`, 'g'),
		hint: (m) => `use "${SUBJECT_FORM[m[1]] ?? m[1]} and I"` },
	{ re: new RegExp('(?<=(?<!\\b(?:[Hh]ave|[Hh]as|[Hh]ad|[Hh]aving|[Hh]aven[\'’]t|[Hh]asn[\'’]t|' +
		'[Hh]adn[\'’]t)\\s+)\\b(?:I|[Ww]e|' +
		"[Yy]ou|[Tt]hey|[Hh]e|[Ss]he)\\s+)seen\\b", 'g'),
		hint: () => 'use "saw"' },
	{ re: /(?<=\b(?:can|could|will|would|should|must|might|may|shall)(?:\s+not)?\s+)(?!\w*eed\b)(?!(?:embed|shed|shred|wed|bed|sled|red|bred)\b)[a-z]+ed\b/g,
		hint: () => 'a modal takes the base form of the verb ("will fix", not "will fixed")' },
	{ re: new RegExp('(?<=\\b(?:can|could|will|would|should|must|might|may|shall)\\s+)' +
		'(?:has|does|is|was|goes|retries|runs|returns|fixes|needs|takes|makes|gets|uses)\\b', 'g'),
		hint: (m) => `use "${{ has: 'have', does: 'do', is: 'be', was: 'be' }[m[0]] ??
			pluralVerb(m[0])}"` },
	// "Less happens at startup" is a pronoun before its verb, "field-less" a
	// suffix, and a plural before another noun is a modifier ("less sales
	// tax"), so the plural must end its phrase.
	{ re: new RegExp(`(?<![\\w-]|\\bor\\s+)([Ll]ess)(?=\\s+(?!(?:${alt(SINGULAR_VERBS)})\\b)` +
		`${PLURAL_NOUN}${PHRASE_END})`, 'g'),
		hint: (m) => `use "${keepCase(m[1], 'fewer')}"` },
	{ re: /\b[A-Z]{2,}['’]s(?=\s+(?:are|were|have|do|don['’]t)\b)/g,
		hint: (m) => `use "${m[0].slice(0, -2)}s"` },
	{ re: /(?<![\w/.-])(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|september|october|november|december)(?![\w/-]|\.\w)/g,
		hint: (m) => `use "${m[0][0].toUpperCase() + m[0].slice(1)}"` },
];

// Grammar that spans a phrase or a clause boundary. A regular expression
// cannot parse, so each frame anchors on the words that settle the reading.

// Heads that take a plural verb after "of" ("a number of jobs are", "the rest
// of the files are") or read either way ("a set of tools is").
const QUANTITY_HEAD = alt(['number', 'lot', 'majority', 'minority', 'rest', 'remainder',
	'bulk', 'couple', 'dozen', 'handful', 'bunch', 'variety', 'range', 'total', 'half',
	'third', 'quarter', 'percent', 'fraction', 'portion', 'part', 'kind', 'sort', 'type',
	'series', 'set', 'group', 'pair', 'host', 'plenty', 'none', 'all', 'most', 'some',
	'any', 'team', 'staff', 'crew', 'family', 'board', 'committee', 'percentage', 'minimum',
	'maximum', 'fourth', 'fifth', 'tenth', 'hundredth', 'ton', 'tons', 'best', 'worst', 'least',
	'share', 'proportion', 'average', 'sum']);
// Words that open a new clause inside a relative clause, so the verb after
// them belongs to that clause ("the page that shows which users are active").
const CLAUSE_WORD = alt(['and', 'or', 'but', 'that', 'which', 'who', 'whom', 'whose', 'whether',
	'if', 'when', 'where', 'how', 'why', 'what', 'we', 'they', 'you', 'i', 'he', 'she', 'it']);

// The words inside the "of" phrase are modifiers: a relative word there
// opens a clause ("the list of users whose accounts are locked is empty").
const OF_PLURAL = '\\s+of\\s+(?:(?:the|these|those|our|your|their|its|all|his|her|my|' +
	`both|several|many)\\s+)?(?:(?!(?:${CLAUSE_WORD})\\b)[a-z][a-z-]*\\s+){0,2}?` +
	`(?!(?:${CLAUSE_WORD})\\b)${PLURAL_NOUN}\\s+`;
const PLURAL_AUX_VERB = "(?:are|were|have|aren['’]t|weren['’]t|haven['’]t)(?![\\w'’-])";
const PHRASE_SUBJECT_START = `(?:${LINE_START}|[,;:(]\\s*)`;
const CLAUSE_VERBS_3SG = ['ensures', 'checks', 'confirms', 'reports', 'verifies', 'shows',
	'means', 'says', 'assumes', 'requires', 'expects', 'guarantees', 'proves', 'indicates',
	'suggests', 'implies', 'determines', 'decides', 'knows', 'finds', 'notes', 'states',
	'warns', 'asserts', 'claims', 'argues', 'needs', 'wants', 'makes', 'lets', 'helps',
	'returns'];

const ACROSS_A_PHRASE = [
	// "The list of open issues are longer": the verb agrees with "list". The
	// head must open the sentence or follow a comma: after "since" or "when"
	// it may be a fronted phrase ("since the end of the series rumors have").
	{ re: new RegExp(`(?<=${PHRASE_SUBJECT_START}(?:${SINGULAR_DETERMINER})\\s+` +
		`${SINGULAR_MODIFIER}(?!(?:${QUANTITY_HEAD})\\b)${SINGULAR_NOUN}${OF_PLURAL})` +
		PLURAL_AUX_VERB, 'g'), hint: (m) => `use "${sameMarks(m[0], singularVerb(m[0]))}"` },
	// "The number of open tickets have grown"; "a number of" is plural.
	{ re: new RegExp(`(?<=${PHRASE_SUBJECT_START}[Tt]he\\s+number${OF_PLURAL})` +
		PLURAL_AUX_VERB, 'g'), hint: (m) => `use "${sameMarks(m[0], singularVerb(m[0]))}"` },
	// "One of the servers were down"; "one of the servers that are down" stays.
	{ re: new RegExp(`(?<=${PHRASE_SUBJECT_START}(?:[Oo]ne|[Ee]ach|[Ee]very\\s+one)` +
		`${OF_PLURAL})${PLURAL_AUX_VERB}`, 'g'),
		hint: (m) => `use "${sameMarks(m[0], singularVerb(m[0]))}"` },
	// "The service that handles retries were restarted": the relative verb
	// proves the head singular. A verb that takes a clause stays out, since
	// "the hook that ensures the tests are green runs" has its own subject.
	{ re: new RegExp(`(?<=${PHRASE_SUBJECT_START}(?:${SINGULAR_DETERMINER})\\s+` +
		`${SINGULAR_MODIFIER}${SINGULAR_NOUN}\\s+(?:that|which|who)\\s+(?:is|was|has|does|` +
		`${alt(SINGULAR_VERBS.filter((v) => !CLAUSE_VERBS_3SG.includes(v)))}|` +
		`${alt(NOUN_LIKE_VERBS.filter((v) => !CLAUSE_VERBS_3SG.includes(v)))})\\s+` +
		`(?:(?!(?:${CLAUSE_WORD})\\b)` +
		`[a-z][a-z-]*\\s+){0,4})${PLURAL_AUX_VERB}`, 'g'),
		hint: (m) => `use "${sameMarks(m[0], singularVerb(m[0]))}"` },
];

// A comma splice: two sentences joined by a comma alone. Many correct
// sentences put a comma between two stretches that each hold a noun and a
// verb: an introductory phrase ("That is, the cache is rebuilt"), a time
// clause ("The week we launched, the site went down"), an appositive with a
// participle ("a parser, a small tool designed for configs"), an absolute
// phrase ("the decision made weeks earlier"), or a series ("the build passed,
// the tests passed and we shipped"). So the frame reads only the plainest
// case. The first clause opens on a subject pronoun or a definite
// determiner and holds no pronoun, subordinator, or conjunction after it.
// The second clause opens on a subject pronoun with a finite verb, or on a
// definite noun phrase with a verb that cannot be a participle. Nothing
// later in the sentence joins a series. Recall stays low by design.
// Time nouns open a fronted time clause ("the next time the notifier runs,").
const NOT_IN_FIRST_CLAUSE = alt(['although', 'though', 'if', 'when', 'whenever', 'because',
	'since', 'unless', 'while', 'whereas', 'as', 'after', 'before', 'until', 'once', 'whether',
	'where', 'but', 'and', 'or', 'yet', 'so', 'that', 'which', 'who', 'we', 'they', 'he', 'she',
	'i', 'you', 'it', 'provided', 'given', 'time', 'day', 'week', 'month', 'year', 'moment',
	'minute', 'hour', 'night', 'morning', 'evening']);
const DEFINITE_SUBJECT = '(?:The|This|These|Those|Our|Their|Its|My|Your)\\s+' +
	`(?:(?!(?:${NOT_IN_FIRST_CLAUSE})\\b)[a-z][a-z-]*\\s+){0,3}?`;
const PRONOUN_SUBJECT = '(?:I|We|They|He|She|It)\\s+';
const REPORTING_VERB = alt(['said', 'says', 'noted', 'added', 'explained', 'replied', 'wrote',
	'asked', 'answered', 'argued', 'claimed', 'warned', 'announced', 'thought', 'think']);
const FIRST_CLAUSE_TAIL = `(?:(?!\\b(?:${NOT_IN_FIRST_CLAUSE})\\b)[^,;:.?!]){0,160}?`;
// Verbs that are finite in any position: auxiliaries, their negations,
// third-person forms, and past tenses no participle shares.
const NEGATED_AUX = "(?:is|are|was|were|has|have|had|did|does|do|wo|ca|could|should|would)n['’]t";
const PAST_ONLY = alt(['went', 'came', 'saw', 'took', 'gave', 'ran', 'began', 'fell', 'rose',
	'knew', 'wrote', 'drove', 'chose', 'froze', 'shook', 'stole', 'threw', 'woke', 'became',
	'did', 'was', 'were', 'had']);
// A noun phrase's words are modifiers and a noun, never a pronoun, relative
// word, preposition, or article.
const NOT_SUBJECT_WORD = `(?!(?:${CLAUSE_WORD}|by|of|in|on|at|for|with|from|to|as|a|an|the)\\b)`;
const FINITE_ANYWHERE = `(?:${AUXILIARY}|${NEGATED_AUX}|${PAST_ONLY}|${alt(SINGULAR_VERBS)})`;
const SECOND_CLAUSE = '(?:(?:we|they|he|she|I|it|nobody|nothing|everyone|everything)\\s+' +
	`(?:not\\s+)?(?:${FINITE_ANYWHERE}|[a-z]+ed)|(?:the|this|these|those|our|their|its|my|` +
	`your)\\s+(?:${NOT_SUBJECT_WORD}[a-z][a-z-]*\\s+){0,2}?${NOT_SUBJECT_WORD}[a-z][a-z-]*\\s+` +
	`(?:not\\s+)?${FINITE_ANYWHERE})\\b`;

const CLAUSE_JOINS = [
	// The first clause needs a finite verb: after a pronoun an -ed verb is
	// one, but after a noun it may be a participle ("its cache warmed, ...").
	// A comma straight after a copula introduces a clause ("the problem was,
	// the fix ...").
	{ re: new RegExp(`(?<=${LINE_START}(?:${PRONOUN_SUBJECT}${FIRST_CLAUSE_TAIL}` +
		`\\b(?:${FINITE_ANYWHERE}|[a-z]+ed)|${DEFINITE_SUBJECT}${FIRST_CLAUSE_TAIL}` +
		`\\b${FINITE_ANYWHERE})\\b${FIRST_CLAUSE_TAIL})(?<!\\b(?:${REPORTING_VERB}|is|are|was|were))` +
		`,(?=\\s+${SECOND_CLAUSE}(?![^.?!]*\\b(?:and|or)\\b))`, 'g'),
		prose: true,
		hint: () => 'two sentences joined by a comma: use a period, a semicolon, or ' +
			'"and", "but", or "so"' },
];

const DOUBLED_MARKS = [
	// After a word, before a space or the end: "!!null" is a YAML tag.
	{ re: /(?<=\w)(?:!{2,}|\?{2,})(?=\s|$)/g, hint: (m) => `use "${m[0][0]}"` },
];

/**
 * Every native grammar pattern, in report order. Each entry holds `re`, a
 * global regular expression run on one whitespace-normalized sentence;
 * `hint(m)`, which returns the finding's hint for a match (`use "X"` means
 * replace the matched text with X); and `prose`, set when a list item is
 * exempt. The match must be text a fixer can replace in place: style-check.mjs
 * re-runs `re` on the raw sentence to find the finding's span.
 */
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
	...ACROSS_A_PHRASE,
	...CLAUSE_JOINS,
	...DOUBLED_MARKS,
];
