// Terse's native grammar patterns: mechanical errors a regular expression can
// prove on one sentence, each with the single fix it proposes. style-check.mjs
// runs them per sentence beside the lexicon; grammar-check.mjs adds the
// admitted Harper rules. Every pattern is gated on clean human and model prose.

// Mechanics a pattern can prove: doubled function words, "could of",
// "its" before a word only "it's" precedes, "their" before a be-verb, and a
// short list of misspellings with one correct form. Everything else in the
// grammar scope stays with the model.
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
];
