// Deterministic checks on deliverables.
import { describe, it, expect } from 'vitest';
import {
	checkBudget, checkFacts, checkSections, checkShape, countWords, headingsOf, leadText,
} from '../../scripts/eval/checks.mjs';

describe('word count', () => {
	it('counts prose words and skips front matter, code, blockquotes, and comments', () => {
		const md = '---\ntitle: x\n---\n# Two words\n\nThree more words.\n\n```\nnot counted at all\n```\n\n> quoted text\n\n<!-- hidden -->\n| a | b |';
		expect(countWords(md)).toBe(7);
	});
});

describe('fenced prose', () => {
	const review = '## Summary\n\nRequest changes.\n\n## Inline comments\n\n~~~markdown\n**issue (blocking):** logs the SSN for 60 days.\n\n```suggestion\nlogger.info(id)\n```\n~~~\n';

	it('counts a markdown fence as prose and still drops the code inside it', () => {
		expect(countWords(review)).toBe(13);
		expect(checkFacts(review, [{ id: 'ttl', any: ['60 days'] }, { id: 'code', any: ['logger.info'] }]).missing)
			.toEqual(['code']);
	});

	it('flags a summary heading only when it closes the document', () => {
		expect(checkShape(review, {}).pass).toBe(true);
		expect(checkShape('## Design\n\ntext\n\n## Summary\n\nrecap\n', {}).problems).toEqual(['closing summary heading']);
	});

	it('leaves the subject line out of the word count', () => {
		expect(countWords('Subject: Approve the June 18 release?\n\nCan you approve it?\n')).toBe(4);
	});
});

describe('sections', () => {
	const md = '# Title\n\n## Context\n\ntext\n\n**Decision**\n\ntext\n\n## Extra\n\n## Consequences\n';

	it('reads Markdown headings and bold-only lines', () => {
		expect(headingsOf(md)).toEqual(['title', 'context', 'decision', 'extra', 'consequences']);
	});

	it('passes when required sections appear in order, extras allowed', () => {
		expect(checkSections(md, [{ name: 'Context' }, { name: 'Decision' }, { name: 'Consequences' }]).pass).toBe(true);
	});

	it('reports missing and out-of-order sections, matching aliases', () => {
		const result = checkSections(md, [
			{ name: 'Decision' }, { name: 'Background', aliases: ['Context'] }, { name: 'Options' },
		]);
		expect(result).toMatchObject({ pass: false, missing: ['Options'], outOfOrder: ['Background'] });
	});

	it('matches a heading that extends the name', () => {
		expect(checkSections('## Context and problem statement\n', [{ name: 'Context' }]).pass).toBe(true);
	});
});

describe('budget and facts', () => {
	it('passes inside the budget and fails outside it', () => {
		expect(checkBudget('one two three', { maxWords: 3 }).pass).toBe(true);
		expect(checkBudget('one two three four', { maxWords: 3 }).pass).toBe(false);
		expect(checkBudget('one', { maxWords: 3, minWords: 2 }).pass).toBe(false);
	});

	it('finds facts by any alternative, ignoring case and line breaks', () => {
		const result = checkFacts('Ship on June\n18 with Redis.', [
			{ id: 'date', any: ['June 18'] }, { id: 'cache', any: ['redis'] }, { id: 'ttl', any: ['10 minute'] },
		]);
		expect(result).toEqual({ pass: false, missing: ['ttl'] });
	});
});

describe('short-form shape', () => {
	const email = 'Subject: Approve June 18 release?\n\nMaria,\n\nCan you approve moving the release to June 18?\n';

	it('passes a subject line, no headings, and the ask in the lead', () => {
		const shape = checkShape(email, { subjectLine: true, noHeadings: true,
			lead: { withinWords: 12, mentionsAny: [['June 18'], ['approve']] } });
		expect(shape).toEqual({ pass: true, problems: [] });
	});

	it('reads the lead after the subject line', () => {
		expect(leadText(email, 3)).toBe('Maria, Can you');
	});

	it('reports a missing subject, headings, a closing summary, and a late ask', () => {
		const shape = checkShape('## Update\n\nBackground first.\n\nApprove June 18?\n\n## Summary\n', {
			subjectLine: true, noHeadings: true, lead: { withinWords: 3, mentionsAny: [['June 18']] } });
		expect(shape.problems).toEqual(['no subject line', 'has headings', 'closing summary heading', 'lead lacks June 18']);
	});

	it('checks mention order and ignores a group that never appears', () => {
		expect(checkShape('The SSN leak, then naming.', { mentionOrder: [['ssn'], ['n+1'], ['naming']] }).pass).toBe(true);
		expect(checkShape('Naming first, then the SSN.', { mentionOrder: [['ssn'], ['naming']] }).pass).toBe(false);
	});
});
