// The skill files load the way a host loads them: each has front matter
// naming its directory, a description the host can match, and only
// <terse-root> paths that exist.
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOCUMENT_SKILLS = ['adr', 'email', 'pr-description', 'pr-review', 'prd', 'slack', 'tech-spec'];
const skillNames = readdirSync(join(ROOT, 'skills')).sort();
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

function frontMatter(markdown) {
	const block = /^---\n([\s\S]*?)\n---\n/.exec(markdown)?.[1] ?? '';
	const field = (key) => new RegExp(`^${key}: (.+)$`, 'm').exec(block)?.[1];
	const description = field('description');
	return { name: field('name'), description: description && JSON.parse(description) };
}

const rootPaths = (markdown) => [...markdown.matchAll(/<terse-root>\/([\w./-]+[\w])/g)]
	.map((m) => m[1]);

describe('skill files', () => {
	it('ship the seven document skills and the voice skill', () => {
		expect(skillNames).toEqual([...DOCUMENT_SKILLS, 'voice'].sort());
	});

	it.each(skillNames)('%s has a name matching its directory and a description', (skill) => {
		const { name, description } = frontMatter(read(`skills/${skill}/SKILL.md`));
		expect(name).toBe(skill);
		expect(description.length).toBeGreaterThan(80);
		expect(description.length).toBeLessThanOrEqual(1024);
	});

	it.each(DOCUMENT_SKILLS)('%s reads the shared principles', (skill) => {
		expect(rootPaths(read(`skills/${skill}/SKILL.md`))).toContain('references/principles.md');
	});

	it.each(['adr', 'prd', 'tech-spec'])('%s runs the split test', (skill) => {
		expect(rootPaths(read(`skills/${skill}/SKILL.md`))).toContain('references/splitting.md');
	});

	it('names only <terse-root> paths that exist', () => {
		const files = [
			...skillNames.map((skill) => `skills/${skill}/SKILL.md`),
			'references/principles.md',
			'references/splitting.md',
		];
		for (const file of files) {
			for (const path of rootPaths(read(file))) {
				expect(existsSync(join(ROOT, path)), `${file} names ${path}`).toBe(true);
			}
		}
	});
});
