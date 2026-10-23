// The blind pairwise judge: prompt, schema, verdict parsing, and reconciling
// the two presentation orders. Pure.

export const CRITERIA = ['structure_fit', 'length_fit', 'ask_clarity', 'accuracy', 'human_voice'];

const score = { type: 'integer', minimum: 1, maximum: 5 };
const scores = {
	type: 'object', additionalProperties: false, required: CRITERIA,
	properties: Object.fromEntries(CRITERIA.map((name) => [name, score])),
};

// Scores come before the verdict so the judge commits to them first.
export const JUDGE_SCHEMA = {
	type: 'object', additionalProperties: false, required: ['scores', 'winner', 'reason'],
	properties: {
		scores: {
			type: 'object', additionalProperties: false, required: ['A', 'B'],
			properties: { A: scores, B: scores },
		},
		winner: { enum: ['A', 'B', 'tie'] },
		reason: { type: 'string', maxLength: 400 },
	},
};

export function fillTemplate(template, values) {
	return template.replace(/\{(\w+)\}/g, (m, key) => (key in values ? values[key] : m));
}

export function renderInputs(files) {
	return files.map(({ path, text }) => `<file path="${path}">\n${text.trimEnd()}\n</file>`).join('\n\n');
}

/** Mask the plugin's name so a draft can't reveal its arm. */
export function blind(markdown) {
	const text = markdown.replace(/<!--[\s\S]*?-->/g, '').replace(/terse/gi, '[tool]');
	return { text, leak: /terse/i.test(markdown) };
}

export function buildJudgePrompt(template, { caseDef, request, inputs, draftA, draftB }) {
	return fillTemplate(template, {
		docLabel: caseDef.docLabel,
		reader: caseDef.judge.reader,
		questions: caseDef.judge.questions.map((q) => `- ${q}`).join('\n'),
		request, inputs: renderInputs(inputs), draftA, draftB,
	});
}

/** The verdict from a judge result, or an error naming what was wrong. */
export function parseVerdict(result) {
	let verdict = result?.structured_output;
	if (!verdict && typeof result?.result === 'string') {
		try { verdict = JSON.parse(result.result); } catch { verdict = null; }
	}
	if (!verdict || !['A', 'B', 'tie'].includes(verdict.winner)) throw new Error('no valid verdict');
	for (const label of ['A', 'B']) {
		for (const name of CRITERIA) {
			const value = verdict.scores?.[label]?.[name];
			if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error(`bad score ${label}.${name}`);
		}
	}
	return verdict;
}

/** Translate a verdict from labels to arms. pluginLabel is the label the plugin's draft had. */
export function toArms(verdict, pluginLabel) {
	const bareLabel = pluginLabel === 'A' ? 'B' : 'A';
	const winner = verdict.winner === 'tie' ? 'tie' : verdict.winner === pluginLabel ? 'plugin' : 'bare';
	return { winner, scores: { plugin: verdict.scores[pluginLabel], bare: verdict.scores[bareLabel] },
		reason: verdict.reason };
}

/** Two orders agree, or the pair is a tie. Scores average across the orders. */
export function reconcile(first, second) {
	const consistent = first.winner === second.winner;
	const mean = (arm) => Object.fromEntries(CRITERIA.map((name) =>
		[name, (first.scores[arm][name] + second.scores[arm][name]) / 2]));
	return {
		winner: consistent ? first.winner : 'tie',
		consistent,
		scores: { plugin: mean('plugin'), bare: mean('bare') },
		reasons: [first.reason, second.reason],
	};
}
