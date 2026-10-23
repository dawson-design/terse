// The claudism list and its matcher: the list parses, the notation compiles
// as documented, every labeled tell is found, human prose stays silent, and
// a voice template's kept phrases are allowed.
import { describe, it, expect } from 'vitest';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
	LIST_PATH, compilePattern, findClaudisms, parseClaudisms, resolveVoicePath, voiceAllowances,
} from '../scripts/claudisms.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SCRIPT = join(HERE, '..', 'scripts', 'claudisms.mjs');
const FIXTURES = join(HERE, 'fixtures', 'human-prose');
const { rules, errors } = parseClaudisms(readFileSync(LIST_PATH, 'utf8'));
const matches = (pattern, text) => [...text.matchAll(compilePattern(pattern))].map((m) => m[0]);
const found = (text) => findClaudisms(text, rules).map((hit) => hit.match.toLowerCase());

// Each entry plants one tell the list still covers.
const LABELED_TELLS = [
	["We're thrilled to announce our newest feature.", 'thrilled to announce'],
	['Under the hood, the sync engine batches writes.', 'under the hood'],
	['This is just the beginning for the platform.', 'this is just the beginning'],
	["We can't wait to see what you build.", "can't wait to see"],
	['The update is a game-changer for small teams.', 'game-changer'],
	['Our tool will revolutionize your workflow.', 'revolutionize'],
	['The editor empowers teams to move fast.', 'empowers teams'],
	['Unleash the full potential of your notes.', 'unleash the full'],
	['Take a deep dive into the scheduler.', 'deep dive'],
	["In today's fast-paced world, speed wins.", "in today's fast-paced world"],
	['The pipeline uses state-of-the-art caching.', 'state-of-the-art'],
	['Say goodbye to merge conflicts.', 'say goodbye to'],
	['Worth noting: the cache is shared.', 'worth noting'],
	['This sentence is load-bearing for the argument.', 'load-bearing'],
	["It's not just a checker, it's an editor.", "it's not just a checker, it's an"],
	['The tool not only checks but also rewrites.', 'not only checks but also'],
	['No staging queue, no broken builds, no waiting.', 'no staging queue, no broken builds, no'],
	['The new cache earns its place in the request path.', 'earns its place'],
	['The redesign moved the needle on churn.', 'moved the needle'],
	['The runtime does the heavy lifting for you.', 'heavy lifting'],
	['Start with the low-hanging fruit in the backlog.', 'low-hanging fruit'],
	['The team delved into the logs.', 'delved'],
	['The cache earns its keep under load.', 'earns its keep'],
	['One example carries the argument.', 'carries the argument'],
	['The prefix carries the weight of the convention.', 'carries the weight'],
	['The routing logic lives in the gateway.', 'logic lives in'],
	['The uptime is a testament to the design.', 'testament to'],
	['The codebase is a tapestry of styles.', 'tapestry of'],
	['That lives in the realm of speculation.', 'realm of'],
	['The security landscape shifted this year.', 'security landscape'],
	['We mapped the customer journey end to end.', 'customer journey'],
	['The developer ecosystem keeps growing.', 'developer ecosystem'],
	['Harness the power of the scheduler.', 'harness the power'],
	['The outage underscores the need for retries.', 'underscores the'],
	['The cache unlocks new possibilities.', 'unlocks new possibilities'],
	['The plan fosters a culture of review.', 'fosters a culture'],
	['It will supercharge your workflow.', 'supercharge'],
	['The retry loop quietly swallows the error.', 'quietly swallows'],
	['The old parser was the culprit.', 'the culprit'],
	['Delete the offending line.', 'the offending'],
	['The scheduler is battle-tested.', 'battle-tested'],
	['This felt like a footgun during review.', 'footgun'],
	['The cron job is the linchpin of the pipeline.', 'linchpin'],
	['That distinction actually matters for the reader.', 'actually matters'],
	['The real question is ownership.', 'the real question'],
	['Why this matters: the cache is shared by every tenant.', 'why this matters'],
	['Bottom line: the small fix ships first.', 'bottom line:'],
	['The kicker is the license change.', 'the kicker'],
	['The tell is the em dash.', 'the tell is'],
	['Let me be blunt about the timeline.', 'let me be blunt'],
	['The honest answer is that nobody measured it.', 'the honest answer'],
	['The fix works. Period.', 'period.'],
	['The design is hand-wavy about failure.', 'hand-wavy'],
	['Great question, and the answer is no.', 'great question'],
	['Spot on, the loop allocates every pass.', 'spot on,'],
	['Your instinct is right about the cache.', 'your instinct is right'],
	["This isn't a limit, it's a target.", "isn't a limit, it's a"],
	["The debate isn't about speed, it's about trust.", "isn't about speed, it's about"],
	['Not just faster, also smaller.', 'not just'],
	['If anything, the queue is too small.', 'if anything,'],
	['The migration is non-trivial.', 'non-trivial'],
	['That said, the fallback works.', 'that said'],
	['As we will see, the broker drops the message.', 'as we will see'],
	['The prefix is not enforced, nor should it be.', 'nor should it'],
	['To be fair, the spec changed twice.', 'to be fair'],
	['It is worth checking the index first.', 'worth checking'],
	['The happy path skips validation.', 'happy path'],
	['Keep the blast radius small.', 'blast radius'],
	['Run a sanity check on the totals.', 'sanity check'],
	['Retries here are belt-and-suspenders.', 'belt-and-suspenders'],
	['Bootstrapping is a chicken-and-egg problem.', 'chicken-and-egg'],
	['Add guardrails around the delete flow.', 'add guardrails'],
	['These concerns are orthogonal.', 'are orthogonal'],
	['That whole layer is just plumbing.', 'just plumbing'],
	['Verdict: keep the old client.', 'verdict:'],
	['TL;DR: ship the small fix first.', 'tl;dr'],
	['Just let me know if the build breaks.', 'just let me know'],
	['Want me to wire up the failing case?', 'want me to wire up the failing case?'],
	['Hope this helps with the rollout.', 'hope this helps'],
	['That being said, the plan holds.', 'that being said'],
	['Latency is our north star.', 'north star'],
];

// Literal, human senses of the same words stay silent.
const INNOCENT_LOOKALIKES = [
	'A spot on the shirt gave him away.',
	'If anything changes overnight, page the on-call engineer.',
	'They want me to resign before the vote.',
	'The grace period. It ended in March.',
	'The tell was nothing: the raid squads kept quiet.',
	'The men carried the wounded across the road.',
	'My cousin lives in a flat above the bakery.',
	'What makes the engine run is the spark plug.',
	'The test harness runs nightly.',
	'Prefix private names with an underscore.',
	'The state pays for foster care.',
	'Unlock the door with the master key.',
	'She unleashed the dogs at the park.',
	'The desert landscape stretched for miles.',
	'Their journeys shaped the roadmap.',
	'The forest ecosystem recovered after the fire.',
	'Orthogonal vectors span the plane.',
	'The dinner was spaghetti and bread.',
	'The guardrail on the bridge bent in the crash.',
	'The revolutionary government fell in March.',
	'The board discussed the bottom line all quarter.',
	'Two men did the work before noon.',
	'Gotcha, I will rebase the branch.',
	'Please read the note that Sam left.',
	'As the work is not repeatable, it is hard to automate.',
	"As the work isn't repeatable, it's hard to automate.",
];

describe('the claudism list', () => {
	it('parses with no errors into ten families of 60 to 120 hinted entries', () => {
		expect(errors).toEqual([]);
		expect(new Set(rules.map((rule) => rule.family)).size).toBe(10);
		expect(rules.length).toBeGreaterThanOrEqual(60);
		expect(rules.length).toBeLessThanOrEqual(120);
		expect(new Set(rules.map((rule) => rule.pattern)).size).toBe(rules.length);
		for (const rule of rules) expect(rule.hint.trim()).not.toBe('');
	});

	it.each(LABELED_TELLS)('finds the tell in %j', (text, tell) => {
		expect(found(text)).toContain(tell);
	});

	it.each(INNOCENT_LOOKALIKES)('stays silent on %j', (text) => {
		expect(found(text)).toEqual([]);
	});

	it('stays silent on edited human prose', () => {
		for (const file of readdirSync(FIXTURES)) {
			expect(found(readFileSync(join(FIXTURES, file), 'utf8')), file).toEqual([]);
		}
	});
});

describe('the pattern notation', () => {
	it('matches inflections with ~, including doubled consonants and y to ied', () => {
		expect(matches('drop~ it', 'dropped it, drops it, dropping it')).toHaveLength(3);
		expect(matches('carry~ it', 'carried it, carries it')).toHaveLength(2);
	});

	it('treats an empty alternative as optional', () => {
		expect(matches('seamless{ly|} integrate', 'seamless integrate and seamlessly integrate'))
			.toHaveLength(2);
	});

	it('lets * span one to six words inside one clause', () => {
		expect(matches('not only * but also', 'not only one but also')).toHaveLength(1);
		expect(matches('not only * but also', 'not only a b c d e f but also')).toHaveLength(1);
		expect(matches('not only * but also', 'not only a b c d e f g but also')).toHaveLength(0);
		expect(matches('not only * but also', 'not only this, but also')).toHaveLength(0);
	});

	it('anchors ^ to the start of a sentence, line, or list item', () => {
		expect(matches('^that said', 'That said, go.')).toHaveLength(1);
		expect(matches('^that said', 'It works. That said, go.')).toHaveLength(1);
		expect(matches('^that said', '- That said, go.')).toHaveLength(1);
		expect(matches('^that said', 'The man that said it left.')).toHaveLength(0);
	});

	it('lets a hyphen, a space, and an apostrophe match their variants', () => {
		expect(matches('load-bearing', 'load bearing, loadbearing, load-bearing')).toHaveLength(3);
		expect(matches('happy path', 'the happy-path case')).toHaveLength(1);
		expect(matches("can't wait", 'I can’t wait')).toHaveLength(1);
	});

	it('matches whole words only', () => {
		expect(matches('delve~', 'Delvefield')).toHaveLength(0);
	});

	it('rejects nested groups', () => {
		expect(() => compilePattern('{a|{b|c}}')).toThrow(/nested/);
	});
});

describe('prose exemptions', () => {
	it('skips code, blockquotes, quotations, and URLs', () => {
		const text = [
			'Run `happy path` first.',
			'```\nthe happy path\n```',
			'> The happy path is fine.',
			'She wrote "the happy path" in the notes.',
			'See https://example.com/happy-path for more.',
		].join('\n\n');
		expect(found(text)).toEqual([]);
	});

	it('scans text inside a markdown or text fence, but not code inside it', () => {
		const text = '~~~markdown\nThe happy path works.\n\n```js\nconst blastRadius = "blast radius";\n```\n~~~\n\n```text\nHope this helps.\n```\n';
		expect(found(text)).toEqual(['happy path', 'hope this helps']);
	});

	it.each([
		['four backticks outside, three inside', '````markdown\nThe happy path works.\n\n```suggestion\nconst x = "blast radius";\n```\n````\n'],
		['tildes outside, backticks inside', '~~~markdown\nThe happy path works.\n\n```suggestion\nconst x = "blast radius";\n```\n~~~\n'],
	])('reads a nested comment fence with %s', (style, text) => {
		expect(found(text)).toEqual(['happy path']);
	});

	it('reads fences in a file with CRLF line endings', () => {
		const text = 'Intro.\r\n\r\n```js\r\nconst x = 1;\r\n```\r\n\r\nThe happy path works.\r\n';
		expect(found(text)).toEqual(['happy path']);
	});

	it('reads a fence indented inside a nested list item', () => {
		expect(found('- step\n    - sub\n\n      ```sh\n      echo "happy path"\n      ```\n')).toEqual([]);
	});

	it('treats an unclosed code fence as code to the end', () => {
		expect(found('```js\nconst happyPath = "happy path";\n')).toEqual([]);
	});

	it('reports the line of each match', () => {
		const [hit] = findClaudisms('First line.\n\nThe happy path wins.', rules);
		expect(hit.line).toBe(3);
	});
});

describe('voice allowances', () => {
	const voice = [
		'---', 'status: approved (user, 2026-10-20)', '---', '', '# Voice', '',
		'## Traits', '', '- Opens on a connective.',
		'  - Theirs: "Not only because of their number but also because of their age."',
		'  - Default: "The happy path is fine."', '',
		'## Exceptions', '', '- "to be fair": "To be fair, the spec changed."', '',
		'## Habits to drop', '', 'None.',
	].join('\n');

	it('allows the phrases the Exceptions and Theirs samples use, and nothing from Default lines', () => {
		expect([...voiceAllowances(rules, voice)].sort())
			.toEqual(['not only * but also', 'to be fair']);
	});

	it('allows sentence-start entries and samples that wrap across lines', () => {
		const anchored = '## Exceptions\n\n- "that said": "That said, we shipped."\n\n## Traits\n\n  - Theirs: "We tried it.\n    Honestly, the queue was the problem."\n';
		expect([...voiceAllowances(rules, anchored)].sort()).toEqual(['^that said', '^{honestly|frankly},']);
	});

	it('allows a sentence-start entry only where the author starts a sentence with it', () => {
		const midSentence = '## Traits\n\n  - Theirs: "The outage was not a disaster, and the man that said otherwise\n    had left after the trial period. I note that now."\n';
		expect([...voiceAllowances(rules, midSentence)]).toEqual([]);
	});

	it('skips allowed phrases when finding', () => {
		const allowed = voiceAllowances(rules, voice);
		const hits = findClaudisms('To be fair, the happy path works.', rules, allowed);
		expect(hits.map((hit) => hit.match)).toEqual(['happy path']);
	});
});

describe('voice resolution', () => {
	const approved = '---\nstatus: approved (user, 2026-10-22)\n---\n# Voice\n';
	const draft = '---\nstatus: draft\n---\n# Voice\n';
	const setup = ({ project, config, personal }) => {
		const root = mkdtempSync(join(tmpdir(), 'terse-voice-'));
		const home = join(root, 'home');
		const repo = join(root, 'repo');
		mkdirSync(join(home, '.terse'), { recursive: true });
		mkdirSync(join(repo, '.terse'), { recursive: true });
		if (personal) writeFileSync(join(home, '.terse', 'voice.md'), personal);
		if (project) writeFileSync(join(repo, '.terse', 'voice.md'), project);
		if (config) writeFileSync(join(repo, '.terse', 'config.json'), JSON.stringify(config));
		return { home, repo };
	};

	it('prefers an approved project voice', () => {
		const { home, repo } = setup({ project: approved, personal: approved });
		expect(resolveVoicePath(repo, home)).toBe(join(repo, '.terse', 'voice.md'));
	});

	it('falls back to an approved personal voice', () => {
		const { home, repo } = setup({ project: draft, personal: approved });
		expect(resolveVoicePath(repo, home)).toBe(join(home, '.terse', 'voice.md'));
	});

	it('reads an approved status written with CRLF line endings or quotes', () => {
		const { home, repo } = setup({ project: '---\r\nstatus: "approved (user)"\r\n---\r\n# Voice\r\n' });
		expect(resolveVoicePath(repo, home)).toBe(join(repo, '.terse', 'voice.md'));
	});

	it('treats the home folder as no project', () => {
		const { home } = setup({ personal: approved });
		expect(resolveVoicePath(home, home)).toBe(join(home, '.terse', 'voice.md'));
	});

	it('skips the personal voice when the project opts out', () => {
		const { home, repo } = setup({ personal: approved, config: { personal: false } });
		expect(resolveVoicePath(repo, home)).toBeNull();
	});
});

describe('the claudisms CLI', () => {
	const run = (input) => {
		const cwd = mkdtempSync(join(tmpdir(), 'terse-cli-'));
		mkdirSync(join(cwd, '.terse'));
		writeFileSync(join(cwd, '.terse', 'config.json'), '{"personal": false}');
		return spawnSync(process.execPath, [SCRIPT, '-'], { cwd, input, encoding: 'utf8' });
	};

	it('prints each match with its line, family, and hint, and exits 1', () => {
		const result = run('Plain opener.\nThe happy path skips validation.\n');
		expect(result.status).toBe(1);
		expect(result.stdout).toBe(
			'stdin:2: "happy path" (Metaphor soup): name the case: valid input, the success case\n');
	});

	it('prints nothing and exits 0 on clean text', () => {
		const result = run('The retry policy backs off for 30 seconds.\n');
		expect(result.status).toBe(0);
		expect(result.stdout).toBe('');
	});

	it('runs when invoked through a symlinked path', () => {
		const link = join(mkdtempSync(join(tmpdir(), 'terse-link-')), 'claudisms.mjs');
		symlinkSync(SCRIPT, link);
		const cwd = mkdtempSync(join(tmpdir(), 'terse-cli-'));
		const result = spawnSync(process.execPath, [link, '--no-voice', '-'], { cwd, input: 'The happy path.\n', encoding: 'utf8' });
		expect(result.status).toBe(1);
	});

	it('takes the voice from the folder given to --voice, and from each file\'s folder when scanning', () => {
		const project = mkdtempSync(join(tmpdir(), 'terse-cli-project-'));
		mkdirSync(join(project, '.terse'));
		writeFileSync(join(project, '.terse', 'voice.md'), '---\nstatus: approved\n---\n## Exceptions\n\n- "happy path": "The happy path ran."\n');
		writeFileSync(join(project, 'draft.md'), 'The happy path works.\n');
		const elsewhere = mkdtempSync(join(tmpdir(), 'terse-cli-elsewhere-'));
		const voice = spawnSync(process.execPath, [SCRIPT, '--voice', project], { cwd: elsewhere, encoding: 'utf8' });
		expect(voice.stdout.trim()).toBe(join(project, '.terse', 'voice.md'));
		const scan = spawnSync(process.execPath, [SCRIPT, join(project, 'draft.md')], { cwd: elsewhere, encoding: 'utf8' });
		expect(scan.status).toBe(0);
	});

	it('prints the approved voice path with --voice, and nothing when the project opts out', () => {
		const cwd = mkdtempSync(join(tmpdir(), 'terse-cli-voice-'));
		mkdirSync(join(cwd, '.terse'));
		const voice = join(cwd, '.terse', 'voice.md');
		writeFileSync(voice, '---\nstatus: approved (user, 2026-10-22)\n---\n');
		const found = spawnSync(process.execPath, [SCRIPT, '--voice'], { cwd, encoding: 'utf8' });
		expect(found.stdout.trim()).toBe(realpathSync(voice));
		writeFileSync(voice, '---\nstatus: draft\n---\n');
		writeFileSync(join(cwd, '.terse', 'config.json'), '{"personal": false}');
		const none = spawnSync(process.execPath, [SCRIPT, '--voice'], { cwd, encoding: 'utf8' });
		expect(none.stdout).toBe('');
	});
});
