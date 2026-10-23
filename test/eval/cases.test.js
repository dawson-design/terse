// The committed cases load, match their skills, and build their workspaces.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOC_TYPES, loadCases, validateCase } from '../../scripts/eval/cases.mjs';
import { collectJudgeInputs, createWorkspace, removeWorkspace } from '../../scripts/eval/workspace.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const cases = loadCases(join(ROOT, 'evals'));
const skillText = (docType) => readFileSync(join(ROOT, 'skills', docType, 'SKILL.md'), 'utf8').toLowerCase();

describe('eval cases', () => {
	it('cover every document type once', () => {
		expect(cases.map((c) => c.docType)).toEqual(DOC_TYPES);
	});

	it.each(cases.map((c) => [c.id, c]))('%s states its word ceiling in its skill', (id, caseDef) => {
		const max = caseDef.budget.maxWords;
		const forms = [`${max} words`, `${max.toLocaleString('en-US')} words`];
		expect(forms.some((form) => skillText(caseDef.docType).includes(form))).toBe(true);
	});

	it.each(cases.map((c) => [c.id, c]))('%s requires only sections its skill names', (id, caseDef) => {
		for (const { name } of caseDef.structure.sections) {
			expect(skillText(caseDef.docType), name).toContain(name.toLowerCase());
		}
	});

	it.each(cases.map((c) => [c.id, c]))('%s has a prompt that never names the plugin', (id, caseDef) => {
		expect(caseDef.prompt).not.toMatch(/terse/i);
		expect(caseDef.prompt).toContain(caseDef.deliverable);
	});

	it.each(cases.map((c) => [c.id, c]))('%s has judge inputs', (id, caseDef) => {
		expect(collectJudgeInputs(caseDef).length).toBeGreaterThan(0);
	});

	it('rejects a case with a missing budget and an unknown type', () => {
		expect(validateCase({ id: 'x', docType: 'memo', docLabel: 'memo', deliverable: 'm.md',
			judge: { reader: 'r', questions: ['q'] } }, 'x'))
			.toEqual([expect.stringMatching(/^docType/), 'budget.maxWords must be an integer']);
	});
});

describe('workspaces', () => {
	const git = (dir, args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();

	it('build the PR fixture as a branch of three commits with a clean status', () => {
		const dir = createWorkspace(cases.find((c) => c.id === 'pr-description'));
		try {
			expect(git(dir, ['branch', '--show-current'])).toBe('feature/idempotent-claim-submit');
			expect(git(dir, ['rev-list', '--count', 'main..HEAD'])).toBe('3');
			expect(git(dir, ['status', '--porcelain'])).toBe('');
			expect(existsSync(join(dir, 'issue-311.md'))).toBe(true);
		} finally {
			removeWorkspace(dir);
		}
	});

	it('keep the personal voice out with a project config', () => {
		const dir = createWorkspace(cases.find((c) => c.id === 'email'));
		try {
			expect(JSON.parse(readFileSync(join(dir, '.terse', 'config.json'), 'utf8'))).toEqual({ personal: false });
			expect(existsSync(join(dir, 'context.md'))).toBe(true);
		} finally {
			removeWorkspace(dir);
		}
	});
});
