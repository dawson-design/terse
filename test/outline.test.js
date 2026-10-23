// The outline CLI maps a document's parts: each heading with the prose words
// under it and any words in code, so a skill can run the split test without
// reading the whole file.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/outline.mjs', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

function write(markdown) {
	const file = join(mkdtempSync(join(tmpdir(), 'terse-outline-')), 'spec.md');
	writeFileSync(file, markdown);
	return file;
}

const SPEC = [
	'---', 'status: draft', '---',
	'# Upload spec', '', 'One two three.', '',
	'## Requirements', '', 'The service shall scan each file.', '',
	'### Limits', '', 'Files stay under 25 MB.', '',
	'## Delivery plan', '', 'Three tasks follow.', '',
	'```yaml', '# not a heading', 'replicas: 2', '```', '',
	'> A quoted line.', '',
	'#### Deep detail', '', 'Hidden from the map.', '',
].join('\n');

describe('the outline CLI', () => {
	it('prints the total, then each heading to three levels with the words in its section', () => {
		const result = run(write(SPEC));
		expect(result.status).toBe(0);
		expect(result.stdout).toBe([
			'29 words of prose (0.1 pages at 500 words a page), 5 in code',
			'# Upload spec  [29, 5 in code]',
			'  ## Requirements  [13]',
			'    ### Limits  [6]',
			'  ## Delivery plan  [11, 5 in code]',
			'',
		].join('\n'));
	});

	it('indents from the highest heading level the document uses', () => {
		const result = run(write('Intro words here.\n\n## Design\n\nOne.\n\n## Rollout\n\nTwo.\n'));
		expect(result.stdout).toBe([
			'7 words of prose (0 pages at 500 words a page)',
			'(before the first heading)  [3]',
			'## Design  [2]',
			'## Rollout  [2]',
			'',
		].join('\n'));
	});

	it('takes no headings from fenced Markdown, comments, or front matter', () => {
		const doc = [
			'---', 'title: Spec', '# owner: platform', '---', '# Spec', '', 'Intro words.', '',
			'<!--', '## Old section', '-->', '',
			'~~~markdown', '## Template heading', 'Body words here.', '```suggestion', 'fix(it)', '```', '~~~', '',
			'```npm test``` runs it.', '',
			'## Real', '', 'Done.', '',
		].join('\n');
		expect(run(write(doc)).stdout).toBe([
			'14 words of prose (0 pages at 500 words a page), 1 in code',
			'# Spec  [14, 1 in code]',
			'  ## Real  [2]',
			'',
		].join('\n'));
	});

	it('keeps the headings around a comment marker in inline code or a prose arrow', () => {
		const doc = '# Guide\n\nWrite `<!--` to hide text.\n\n## Install\n\nRun it.\n\n## Flow\n\nrequest --> queue\n';
		expect(run(write(doc)).stdout).toBe([
			'11 words of prose (0 pages at 500 words a page)',
			'# Guide  [11]',
			'  ## Install  [3]',
			'  ## Flow  [3]',
			'',
		].join('\n'));
	});

	it('reads an opening rule as a rule, and a fence inside front matter as front matter', () => {
		const rule = run(write('---\n\n# Title\n\nIntro words.\n\n---\n\n## Part\n\nMore.\n'));
		expect(rule.stdout).toBe('5 words of prose (0 pages at 500 words a page)\n# Title  [5]\n  ## Part  [2]\n');
		const yaml = run(write('---\nexample: |\n  ```\n  code here\n---\n# Doc\n\nWords here.\n'));
		expect(yaml.stdout).toBe('3 words of prose (0 pages at 500 words a page)\n# Doc  [3]\n');
	});

	it('reads Windows line endings', () => {
		expect(run(write(SPEC.replace(/\n/g, '\r\n'))).stdout).toBe(run(write(SPEC)).stdout);
	});

	it('shows the three heading levels the document uses, indented or not', () => {
		const result = run(write('# Title\n\nA.\n\n ### Deep\n\nB.\n\n#### Deeper\n\nC.\n'));
		expect(result.stdout).toBe([
			'6 words of prose (0 pages at 500 words a page)',
			'# Title  [6]',
			'  ### Deep  [4]',
			'    #### Deeper  [2]',
			'',
		].join('\n'));
	});

	it('exits 2 with a usage line when no file is given', () => {
		const result = run();
		expect(result.status).toBe(2);
		expect(result.stderr).toMatch(/usage/);
	});
});
