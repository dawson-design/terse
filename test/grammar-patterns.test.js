// Native grammar patterns (scripts/grammar-patterns.mjs), tested through the
// checkText API a caller uses. Each pattern has a planted error with its
// fix, and the correct lookalikes that once misfired stay silent. The corpus
// gates hold the patterns to zero findings on edited human prose and
// unedited model prose.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkText } from '../scripts/style-check.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const grammar = (text) => checkText(text).flags.filter((f) => f.category === 'grammar');

describe('agreement at an edit seam', () => {
	it.each([
		['The artifacts is uploaded to the registry.', 'is', 'use "are"'],
		['Once the tests passes, the artifacts ship.', 'passes', 'use "pass"'],
		['The new endpoints returns paginated results.', 'returns', 'use "return"'],
		['The deploy pipeline have three stages.', 'have', 'use "has"'],
		['The config file contain the database URL.', 'contain', 'use "contains"'],
		['Each request take about 40 ms.', 'take', 'use "takes"'],
		['Each checks runs in its own container.', 'checks', 'use "check"'],
		['It run every night at midnight.', 'run', 'use "runs"'],
		['These setting is ignored in production.', 'These', 'use "This"'],
		['There is three open incidents this week.', 'There is', 'use "There are"'],
		["There's two ways to roll back.", "There's", 'use "There are"'],
	])('%s', (text, match, hint) => {
		expect(grammar(text)).toEqual([expect.objectContaining({ match, hint })]);
	});

	it.each([
		['The status of the jobs is green.'],
		['The API and the CLI are both versioned.'],
		['Exploring the mines is not allowed.'],
		['One of the most famous traditions is leaving a tooth under a pillow.'],
		['The first record of Britain and its inhabitants was by Pytheas.'],
		['The attributes that make up the mind are debated.'],
		['A shape the material resists is the wrong shape.'],
		['Cuts the user approved are the one exception.'],
		['What the team needs is a second reviewer.'],
		['The user may have approved the structure.'],
		['Her story might have been told.'],
		['All the men taken were of draft age.'],
		['The policy requires that the client have a token.'],
		['Should the canary fail, the system reverts.'],
		['The team are on call this week.'],
		['The data are stored in two regions.'],
		['In some groups, the elytra are fused together.'],
		['The Jenkins job is green, and the postgres is healthy.'],
		['The change passed review because it read as a small tweak.'],
		['There is 10 GB free. There is two-factor auth on every account.'],
		['Each time run the smoke tests first.'],
		['Each time take a backup first.'],
	])('leaves the correct sentence %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});
});

describe('homophones and confusables in their only grammatical frame', () => {
	it.each([
		["Each worker writes to it's own log file.", "it's", 'use "its"'],
		["Save you're own changes first.", "you're", 'use "your"'],
		['Your going to need admin rights.', 'Your', `use "You're"`],
		['Their going to cut the release tomorrow.', 'Their', `use "They're"`],
		['Put the fixtures over their, next to the tests.', 'their', 'use "there"'],
		['The migration was to complex to finish in one sprint.', 'to', 'use "too"'],
		['There are to many retries in the client.', 'to', 'use "too"'],
		['We might loose data if the disk fills.', 'loose', 'use "lose"'],
		['The principle engineer approved the design.', 'principle', 'use "principal"'],
		['Whose going to own the migration?', 'Whose', `use "Who's"`],
		['We need to decide weather to roll back.', 'weather', 'use "whether"'],
		['Please advice the customer to upgrade.', 'advice', 'use "advise"'],
		['The dashboard loads real slow on mobile.', 'real', 'use "really"'],
		['We deploy everyday at noon.', 'everyday', 'use "every day"'],
	])('%s', (text, match, hint) => {
		expect(grammar(text)).toEqual([expect.objectContaining({ match, hint })]);
	});

	it.each([
		['Send the welcome email from your welcome page.'],
		['The goal is to close the ticket.'],
		['The team gave way to social media.'],
		['The principle of least privilege applies.'],
		['Prepare for the weather to change.'],
		['It is a real fast car.'],
		['We built it for everyday use.'],
		['It is not too late to start.'],
	])('leaves the correct sentence %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});
});

describe('phrasal verbs written as nouns', () => {
	it.each([
		['Setup the server before you run the tests.', 'Setup', 'use "Set up"'],
		['Rollback the last deployment.', 'Rollback', 'use "Roll back"'],
		['We shutdown the old cluster on Friday.', 'shutdown', 'use "shut down"'],
		['You need to login to the console first.', 'login', 'use "log in"'],
		['Please cleanup the temp files after the run.', 'cleanup', 'use "clean up"'],
	])('%s', (text, match, hint) => {
		expect(grammar(text)).toEqual([expect.objectContaining({ match, hint })]);
	});

	it.each([
		['Setup takes about half a day.'],
		['Rollback completes in two minutes.'],
		['Checkout success rate dropped to zero.'],
		['Go to checkout to pay.'],
		['Switch to rollback mode.'],
		['The login page times out.'],
	])('leaves the noun in %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});
});

describe('forms that break after a verb, modal, or quantity', () => {
	it.each([
		['The rollback happens automatic.', 'automatic', 'use "automatically"'],
		['We will fixed it in the next release.', 'fixed',
			'a modal takes the base form of the verb ("will fix", not "will fixed")'],
		['The client can retries three times.', 'retries', 'use "retry"'],
		['I seen this error before.', 'seen', 'use "saw"'],
		['Remember to runs the linter.', 'runs',
			'the verb after "to" takes its base form ("to run", not "to runs")'],
		['We saw less errors after the patch.', 'less', 'use "fewer"'],
		['Send the report to Sam and I.', 'I', 'use "me"'],
		['Between you and I, the estimate is low.', 'Between you and I', 'use "Between you and me"'],
		['Me and Priya wrote the migration.', 'Me and Priya', 'use "Priya and I"'],
		['Him and the lead reviewed the change.', 'Him', 'use "He"'],
		["I can't hardly read the logs.", "can't hardly", 'use "can hardly"'],
		['The logs contain useful informations.', 'informations', 'use "information"'],
		["The API's are versioned by date.", "API's", 'use "APIs"'],
		["We added test's are for the parser.", "test's", 'use "tests"'],
		['We deploy on monday.', 'monday', 'use "Monday"'],
	])('%s', (text, match, hint) => {
		expect(grammar(text)).toEqual([expect.objectContaining({ match, hint })]);
	});

	it.each([
		['The job completes successfully.'],
		['We will need it. It can proceed. They should embed it.'],
		['Have you seen this error before?'],
		['Tries to bring in the new config.'],
		['It is less obvious, and it more or less works.'],
		['Rename monday.md and the friday-report branch.'],
		["It's for the build, and that's all."],
	])('leaves the correct sentence %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});
});

describe('sentence mechanics', () => {
	it.each([
		['The migration was too complex, however it was worth it.', ', however',
			'use "; however,"'],
		['The team split the config, however the migration was too complex.', ', however',
			'use "; however,"'],
		['The cache is warm, therefore the first request is fast.', ', therefore',
			'use "; therefore,"'],
		['Did the job finish.', '.', 'use "?"'],
		['We shipped it!!', '!!', 'use "!"'],
	])('%s', (text, match, hint) => {
		expect(grammar(text)).toEqual([expect.objectContaining({ match, hint })]);
	});

	it('flags a subordinate clause with no main clause, or no comma before one', () => {
		for (const text of ['Which means the cache is stale.', 'Because the build failed.',
			'Because the town is in a valley it had no railway.']) {
			expect(grammar(text).map((f) => f.hint)).toEqual([expect.stringMatching(
				/^a subordinate clause needs a main clause/)]);
		}
	});

	it.each([
		['Name it, however the team prefers.'],
		['It is, therefore, the best option.'],
		['Although it works, it is slow.'],
		['Because of the outage, we slipped.'],
		['Although the U.S. Forest Service fought fires, the park burned.'],
		['Do not deploy on Fridays.'],
		['Have the reviewer sign off.'],
		['Is the cache warm?'],
	])('leaves the correct sentence %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});

	it('lets a list item be a fragment', () => {
		expect(grammar('Why cache it?\n\n- Because the query is slow.\n')).toEqual([]);
	});
});

describe('corpus gates', () => {
	const corpus = (dir) => readdirSync(dir).filter((x) => x.endsWith('.md'))
		.map((name) => [name, readFileSync(join(dir, name), 'utf8')]);

	it.each([
		['edited human prose', join(HERE, 'fixtures', 'human-prose')],
		['Hemingway samples', join(HERE, '..', 'samples', 'hemingway')],
		['unedited model prose', join(HERE, 'fixtures', 'model-prose')],
	])('finds no native grammar error in %s', (label, dir) => {
		const findings = corpus(dir).flatMap(([name, text]) => grammar(text)
			.map((f) => `${name}: ${f.match}`));
		expect(findings).toEqual([]);
	});
});
