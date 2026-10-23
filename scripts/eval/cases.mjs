// Eval cases: evals/<id>/case.json plus prompt.md, validated into one shape.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const DOC_TYPES = ['adr', 'prd', 'tech-spec', 'pr-description', 'pr-review', 'email', 'slack'];

/** Problems with a raw case, as messages. Empty when the case is usable. */
export function validateCase(raw, id) {
	const problems = [];
	if (raw.id !== id) problems.push(`id must be "${id}"`);
	if (!DOC_TYPES.includes(raw.docType)) problems.push(`docType must be one of ${DOC_TYPES.join(', ')}`);
	for (const key of ['docLabel', 'deliverable']) {
		if (typeof raw[key] !== 'string' || !raw[key]) problems.push(`${key} is required`);
	}
	if (!Number.isInteger(raw.budget?.maxWords)) problems.push('budget.maxWords must be an integer');
	if (typeof raw.judge?.reader !== 'string') problems.push('judge.reader is required');
	if (!Array.isArray(raw.judge?.questions) || !raw.judge.questions.length) problems.push('judge.questions is required');
	for (const fact of raw.facts ?? []) {
		if (!fact.id || !Array.isArray(fact.any) || !fact.any.length) problems.push('each fact needs an id and an any list');
	}
	if (raw.git && !(raw.git.branch && raw.git.baseMessage)) problems.push('git needs branch and baseMessage');
	return problems;
}

/** The case with defaults filled in. */
export function normalizeCase(raw, dir, prompt) {
	return {
		...raw,
		dir,
		prompt,
		maxTurns: raw.maxTurns ?? 60,
		budget: { minWords: 0, ...raw.budget },
		structure: { sections: [], ...raw.structure },
		facts: raw.facts ?? [],
		judgeInputs: raw.judgeInputs ?? ['workspace'],
	};
}

/** Every case under evalsDir, or only the named ones. Throws on an invalid case. */
export function loadCases(evalsDir, only = []) {
	const ids = readdirSync(evalsDir)
		.filter((name) => existsSync(join(evalsDir, name, 'case.json')))
		.filter((name) => !only.length || only.includes(name))
		.sort((a, b) => DOC_TYPES.indexOf(a) - DOC_TYPES.indexOf(b));
	if (only.length && ids.length !== only.length) throw new Error(`unknown case in: ${only.join(', ')}`);
	return ids.map((id) => {
		const dir = join(evalsDir, id);
		const raw = JSON.parse(readFileSync(join(dir, 'case.json'), 'utf8'));
		const problems = validateCase(raw, id);
		if (problems.length) throw new Error(`${id}/case.json: ${problems.join('; ')}`);
		return normalizeCase(raw, dir, readFileSync(join(dir, 'prompt.md'), 'utf8'));
	});
}
