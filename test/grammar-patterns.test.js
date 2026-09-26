// Native grammar patterns (scripts/grammar-patterns.mjs), tested through the
// checkText API a caller uses. Each pattern has a planted error with its
// fix, and the correct lookalikes that once misfired stay silent. The corpus
// gates hold the patterns to the labeled real errors in edited human prose
// and unedited model prose, by file and line.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkText } from '../scripts/style-check.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const grammar = (text) => checkText(text).flags.filter((f) => f.category === 'grammar');

// One finding, whose span covers exactly its match: a fixer that applies the
// hint edits the span, so a span that drifts edits the wrong words.
function expectOne(text, match, hint) {
	const flags = grammar(text);
	expect(flags).toEqual([expect.objectContaining({ match, hint })]);
	expect(text.slice(...flags[0].span).replace(/\s+/g, ' ')).toBe(match);
}

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
		['There is 2,000 users on the waitlist.', 'There is', 'use "There are"'],
		['There is 10 new failing checks.', 'There is', 'use "There are"'],
		['The server were down all night.', 'were', 'use "was"'],
		['The tests has had three failures.', 'has', 'use "have"'],
		['It need a restart after the upgrade.', 'need', 'use "needs"'],
		["There's two ways to roll back.", "There's", 'use "There are"'],
	])('%s', (text, match, hint) => {
		expectOne(text, match, hint);
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
		['I wish the build were faster. Suppose the cache were empty.'],
		['The sales calls happen weekly. The ops runs happen at night.'],
		['The sales calls last an hour. The sales calls usually happen weekly.'],
		['The schemata are versioned. The radii are equal.'],
		['If the primary were to fail, the replica takes over.'],
		['Even if the cache were empty, the job would run.'],
		['It behaves as if the token were valid.'],
		['The sales calls are scheduled weekly.'],
		['The customs checks are slow.'],
		['The salesmen have quotas. The grandchildren are visiting.'],
		['When the townspeople were asked, they agreed.'],
		['The policemen remain focused.'],
		['It need not be perfect. It need only run once.'],
		['The metadata are stored in the header.'],
		['Each time take a backup first.'],
		['The emoji are rendered as images. The emoji take up two columns.'],
		['The graffiti were removed.'],
		['This will help ensure the tests pass. This can help prevent memory leaks.'],
		['This can cause compile issues.'],
		['The latest are listed below. The best are free.'],
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
		['We need to check weather this flag is set.', 'weather', 'use "whether"'],
		['Please advice the customer to upgrade.', 'advice', 'use "advise"'],
		['The dashboard loads real slow on mobile.', 'real', 'use "really"'],
		['We deploy everyday at noon.', 'everyday', 'use "every day"'],
	])('%s', (text, match, hint) => {
		expectOne(text, match, hint);
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
		['The cable is not loose. Set the tension from tight to loose.'],
		['The agent checks weather forecasts hourly.'],
		['There is 99.9% availability. There is 10.5 GB free.'],
		['There is 2 TB left. There is 24/7 support.'],
		['There is 10 kB free. There is 5 min left. There is 50 cents due.'],
		['There is 20 ms of latency. There is 30 mins left.'],
		['The optional `getOptions` are applied to the result.'],
		['The app `arguments` are app dependent.'],
		['The more schemas `stringify` has to try, the slower it gets.'],
		["The `API`'s are versioned by date."],
		['The agent checked weather this morning.'],
		['We built it for everyday and professional use.'],
	])('leaves the correct sentence %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});
});

describe('phrasal verbs written as nouns', () => {
	it.each([
		['Setup the server before you run the tests.', 'Setup', 'use "Set up"'],
		['Rollback the last deployment.', 'Rollback', 'use "Roll back"'],
		['Action: Rollback the last deployment.', 'Rollback', 'use "Roll back"'],
		['We shutdown the old cluster on Friday.', 'shutdown', 'use "shut down"'],
		['You need to login to the console first.', 'login', 'use "log in"'],
		['You can login to the dashboard.', 'login', 'use "log in"'],
		['Please login to your account.', 'login', 'use "log in"'],
		['We should signup for the new monitoring service.', 'signup', 'use "sign up"'],
		['I backup to S3 every night.', 'backup', 'use "back up"'],
		['Please cleanup the temp files after the run.', 'cleanup', 'use "clean up"'],
	])('%s', (text, match, hint) => {
		expectOne(text, match, hint);
	});

	it.each([
		['Setup takes about half a day.'],
		['Note: Setup takes about half a day.'],
		['Rollback completes in two minutes.'],
		['Checkout success rate dropped to zero.'],
		['Go to checkout to pay.'],
		['Switch to rollback mode.'],
		['The login page times out.'],
		['Failover to the secondary region is automatic.'],
		['Rollout to production happens on Tuesday.'],
		['Backup to S3 runs nightly. Login to the portal fails if SSO is down.'],
		['Handoff to the on-call engineer happens at 9am.'],
		['Note: Failover to the secondary is manual.'],
		['Can setup be automated? Will cleanup run nightly?'],
		['We email you login instructions.'],
		['Rollout this quarter is behind schedule. Will setup this week be faster?'],
		['How long will failover to the replica take? When will rollout to all regions finish?'],
		['How can login for SSO users be simplified?'],
		['Setup each time takes an hour. Rollout every quarter follows the same plan.'],
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
		['We need to going live on Monday.', 'going',
			'the verb after "to" takes its base form ("to run", not "to runs")'],
		['We plan to migrating next week.', 'migrating',
			'the verb after "to" takes its base form ("to run", not "to runs")'],
		['Be careful not to loose the key.', 'loose', 'use "lose"'],
		['We saw less errors after the patch.', 'less', 'use "fewer"'],
		['Less customers complained after the fix.', 'Less', 'use "Fewer"'],
		['Send the report to Sam and I.', 'I', 'use "me"'],
		['Between you and I, the estimate is low.', 'Between you and I', 'use "Between you and me"'],
		['Me and Priya wrote the migration.', 'Me and Priya', 'use "Priya and I"'],
		['Him and the lead reviewed the change.', 'Him', 'use "He"'],
		["I can't hardly read the logs.", "can't hardly", 'use "can hardly"'],
		['The logs contain useful informations.', 'informations', 'use "information"'],
		["The API's are versioned by date.", "API's", 'use "APIs"'],
		['We deploy on monday.', 'monday', 'use "Monday"'],
	])('%s', (text, match, hint) => {
		expectOne(text, match, hint);
	});

	it.each([
		['The job completes successfully.'],
		['We will need it. It can proceed. They should embed it.'],
		['Have you seen this error before?'],
		['Tries to bring in the new config.'],
		['It is less obvious, and it more or less works.'],
		['Rename monday.md and the friday-report branch.'],
		["It's for the build, and that's all."],
		['Most of the budget is going to salaries. The fix is going to users next week.'],
		['Assign each plan to users in the admin panel.'],
		['Apply the plan to existing clusters. We moved the plan to pending.'],
		['Keep it tight but not to loose.'],
		["Yesterday's builds failed, but today's are green. Everyone else's are failing."],
		['Less happens at startup. Less depends on the cache now.'],
		['Only field-less variants convert. We pay less sales tax here.'],
		['Mark the run successful. Follow a process consistent with the policy.'],
		["We don't have no-code support."],
		['Remember to always test your code on Windows.'],
		['It helps you to build efficient, reliable services.'],
		['Arguments after the command are appended to the prompt.'],
		['The most useful are the merge and get helpers.'],
		['The config that the installer writes lives in the home folder.'],
		['The initial render happens after the layout pass.'],
		['Does the same thing as the async version but synchronously.'],
		['YAML tags such as !!null and !!int are supported.'],
		["Haven't you seen the logs?"],
		['We need to wing it.'],
	])('leaves the correct sentence %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});
});

describe('sentence mechanics', () => {
	it.each([
		['The build passed, however the deploy was still red.', ', however',
			'use "; however,"'],
		['The team split the config, however the migration was too complex.', ', however',
			'use "; however,"'],
		['The cache is warm, therefore the first request is fast.', ', therefore',
			'use "; therefore,"'],
		['Did the job finish.', '.', 'use "?"'],
		['We shipped it!!', '!!', 'use "!"'],
	])('%s', (text, match, hint) => {
		expectOne(text, match, hint);
	});

	it('shows inline code in the match, not the mask the patterns saw', () => {
		const text = 'Because `levelup` would overwrite the options.';
		expectOne(text, text, expect.stringMatching(/^a subordinate clause needs a main clause/));
	});

	it('flags a subordinate clause with no main clause, or no comma before one', () => {
		for (const text of ['Which means the cache is stale.', 'Because the build failed.',
			'The cache expired. Which caused the outage.',
			'Because the town is in a valley it had no railway.']) {
			expect(grammar(text).map((f) => f.hint)).toEqual([expect.stringMatching(
				/^a subordinate clause needs a main clause/)]);
		}
	});

	it.each([
		['Name it, however the team prefers.'],
		['Keep the date, however it is formatted.'],
		['Keep the date, however the client has formatted it.'],
		['Which is better depends on your workload.'],
		['Which is more reliable depends on your workload.'],
		['Which causes the error is still unknown.'],
		['Keep the timestamp, however the field is formatted.'],
		['Which approach you choose depends on your needs.'],
		['It is, therefore, the best option.'],
		['Although it works, it is slow.'],
		['Because of the outage, we slipped.'],
		['Although the U.S. Forest Service fought fires, the park burned.'],
		['Do not deploy on Fridays.'],
		['Have the reviewer sign off.'],
		['Is the cache warm?'],
		['How come? Because humans read the whole file.'],
		['## Why not wrap it?\n\nBecause the wrapper would overwrite the options.'],
	])('leaves the correct sentence %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});

	it.each([
		['Setup is done.\nDid the job finish.\n', '.'],
		['The build broke.\nBecause the cache was cold.\n', 'Because the cache was cold.'],
	])('reports a sentence-shape finding on its own line in wrapped text: %j', (text, match) => {
		const [flag] = grammar(text);
		expect(flag).toMatchObject({ line: 2, match });
		expect(text.slice(...flag.span)).toBe(match);
	});

	it.each([
		['1) Him and Bob went home.\n', 'Him'],
		['1) Me and Bob went home.\n', 'Me and Bob'],
		['- The artifacts is uploaded.\n', 'is'],
	])('places a finding inside a list item exactly: %j', (text, match) => {
		const flags = grammar(text);
		expect(flags.map((f) => text.slice(...f.span))).toEqual([match]);
	});

	it('lets a list item be a fragment', () => {
		expect(grammar('Why cache it?\n\n- Because the query is slow.\n')).toEqual([]);
	});
});

describe('grammar across a phrase or a clause boundary', () => {
	it.each([
		['The list of open issues are longer than last week.', 'are', 'use "is"'],
		['The quality of the test fixtures have improved.', 'have', 'use "has"'],
		['The number of open tickets have grown since the outage.', 'have', 'use "has"'],
		['One of the servers were down overnight.', 'were', 'use "was"'],
		['The service that handles retries were restarted.', 'were', 'use "was"'],
		['We tried a larger heap, it did not help.', ',',
			'two sentences joined by a comma: use a period, a semicolon, or "and", "but", or "so"'],
		['I checked the logs, nothing looked wrong.', ',',
			'two sentences joined by a comma: use a period, a semicolon, or "and", "but", or "so"'],
	])('%s', (text, match, hint) => {
		expectOne(text, match, hint);
	});

	it.each([
		['A number of jobs are queued. The rest of the files are cached.'],
		['The majority of users prefer the CLI. A set of tools is bundled.'],
		['One of the servers that are down needs a reboot.'],
		['The page that shows which users are active loads slowly.'],
		['Since the end of the series rumors have circulated.'],
		['When the job fails, the pager fires.'],
		['The build passed, the tests passed, and the deploy shipped.'],
		['The job failed, leaving the queue full.'],
		['Our lead, the engineer who wrote it, approved the change.'],
		['We support Linux, the BSDs, and macOS.'],
		['He said, the build is green.'],
		['The more we tested, the more we found.'],
		['Japan has 47 prefectures, each overseen by a governor.'],
		['The town is residential today, the old buildings mixed with new ones.'],
		['The tool we built last year still runs.'],
		['We found we needed more memory.'],
		['The last time it failed we paged the whole team.'],
		['We know that although the cache helps, it can still serve stale data.'],
		['And if the job is not running, you will not get alerts.'],
		['It worries us since if the queue keeps growing, it will stall the workers.'],
		['The fix is risky but with a feature flag, it will be safe to ship.'],
		['That is, the cache is rebuilt on every deploy.'],
		['All things considered, the design is sound.'],
		['Kept encrypted at rest, the keys are never logged.'],
		['That settled, we moved on to the rollout.'],
		['The week we launched, the site went down twice.'],
		['The second time it failed, we paged the whole team.'],
		['This crate provides a parser, a small tool designed for config files.'],
		['The build passed, the tests passed and we shipped.'],
		['We shipped v2 on Friday, the decision made weeks earlier.'],
		['Among the options, the second is the cheapest.'],
		['It turned out we had a typo in the config.'],
		["I'm not convinced we need a new flag."],
		['The problem was we had no alerts on the queue.'],
		['Deploys are allowed provided they are tagged.'],
		['We realised we had a problem with the cache.'],
		['A small percentage of requests are retried.'],
		['A minimum of two approvals are required for a release.'],
		['The best of these tools are free.'],
		['The list of users whose accounts are locked is empty.'],
		['The hook that ensures the tests are green runs before push.'],
		['An object of keys whose values are strings.'],
		['The next time the notifier runs, the result is cached.'],
		['The problem was, the right fix was going to break valid use cases.'],
		['Its cache warmed, the edge node began serving traffic.'],
		['The hook that runs before commits are pushed catches secrets.'],
	])('leaves the correct sentence %s alone', (text) => {
		expect(grammar(text)).toEqual([]);
	});
});

describe('hints that rebuild the right word', () => {
	it.each([
		['The tests goes green on every run.', 'goes', 'use "go"'],
		['It can goes wrong at startup.', 'goes', 'use "go"'],
		['Each checks is green after startup.', 'checks', 'use "check"'],
		['Each statuses is shown.', 'statuses', '"each" takes a singular noun'],
		["It's own design is simple.", "It's", 'use "Its"'],
		['The artifacts isn’t ready.', 'isn’t', 'use "aren’t"'],
	])('%s', (text, match, hint) => {
		expectOne(text, match, hint);
	});
});

describe('corpus gates', () => {
	const corpus = (dir) => readdirSync(dir).filter((x) => x.endsWith('.md'))
		.map((name) => [name, readFileSync(join(dir, name), 'utf8')]);

	// Haiku's runbook really does say "Action: Rollback the last deployment".
	// Hemingway joins two clauses with a comma in "It seems a pity, they are
	// such a charming lot.": by the standard a technical document follows,
	// that is a comma splice.
	it.each([
		['edited human prose', join(HERE, 'fixtures', 'human-prose'),
			['paris-is-full-of-russians.md:11: ,']],
		['Hemingway samples', join(HERE, '..', 'samples', 'hemingway'),
			['paris-full-of-russians.md:9: ,']],
		['unedited model prose', join(HERE, 'fixtures', 'model-prose'),
			['haiku-runbook.md:74: Rollback']],
	])('finds only the labeled real errors in %s', (label, dir, errors) => {
		const findings = corpus(dir).flatMap(([name, text]) => grammar(text)
			.map((f) => `${name}:${f.line}: ${f.match}`));
		expect(findings).toEqual(errors);
	});
});
