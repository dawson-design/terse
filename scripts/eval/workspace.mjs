// Temporary workspaces, the git fixture, judge inputs, and saved artifacts.
// Every function here touches the filesystem or runs git.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
	appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
	renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

const FIXED_DATE = '2026-10-01T09:00:00Z';
// What a host loads from the plugin: the manifest, the skills, and what they read.
const PLUGIN_PATHS = ['.claude-plugin', 'skills', 'references', 'scripts/claudisms.mjs', 'scripts/outline.mjs'];
const GIT_ENV = {
	GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
	GIT_AUTHOR_NAME: 'Dana Reyes', GIT_AUTHOR_EMAIL: 'dana@example.gov',
	GIT_COMMITTER_NAME: 'Dana Reyes', GIT_COMMITTER_EMAIL: 'dana@example.gov',
	GIT_AUTHOR_DATE: FIXED_DATE, GIT_COMMITTER_DATE: FIXED_DATE,
};

/**
 * A fresh directory outside the repo, so no parent CLAUDE.md applies. It holds
 * the case's input files and a .terse/config.json that keeps the user's
 * personal voice out of the plugin arm.
 */
export function createWorkspace(caseDef) {
	const dir = mkdtempSync(join(tmpdir(), `terse-eval-${caseDef.id}-`));
	if (caseDef.git) buildGitFixture(dir, caseDef);
	const inputs = join(caseDef.dir, 'workspace');
	if (existsSync(inputs)) cpSync(inputs, dir, { recursive: true });
	mkdirSync(join(dir, '.terse'), { recursive: true });
	writeFileSync(join(dir, '.terse', 'config.json'), '{"personal": false}\n');
	if (caseDef.git) excludeFromGit(dir, inputs);
	return dir;
}

function git(dir, args) {
	return execFileSync('git', args, { cwd: dir, env: { ...process.env, ...GIT_ENV }, encoding: 'utf8' });
}

/** The base commit on main, then the branch built from the case's patches. */
export function buildGitFixture(dir, caseDef) {
	const fixture = join(caseDef.dir, 'fixture');
	cpSync(join(fixture, 'repo'), dir, { recursive: true });
	git(dir, ['init', '-q', '-b', 'main']);
	git(dir, ['add', '-A']);
	git(dir, ['commit', '-q', '-m', caseDef.git.baseMessage]);
	git(dir, ['checkout', '-q', '-b', caseDef.git.branch]);
	const patches = readdirSync(join(fixture, 'commits')).filter((f) => f.endsWith('.patch')).sort();
	git(dir, ['am', '-q', '--committer-date-is-author-date',
		...patches.map((patch) => join(fixture, 'commits', patch))]);
}

// Input files and the isolation folder stay out of `git status`.
function excludeFromGit(dir, inputs) {
	const names = existsSync(inputs) ? readdirSync(inputs) : [];
	appendFileSync(join(dir, '.git', 'info', 'exclude'), ['.terse/', ...names].map((n) => `${n}\n`).join(''));
}

export function readDeliverable(dir, path) {
	const file = join(dir, path);
	return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

function filesUnder(root, path) {
	const full = join(root, path);
	if (!statSync(full).isDirectory()) return [full];
	return readdirSync(full).filter((name) => name !== '.terse')
		.flatMap((name) => filesUnder(root, join(path, name)));
}

/**
 * Copy what the plugin arm loads into a temporary folder and hash it. Every
 * session then runs the same version, and the eval's answer key (case
 * files, judge prompt, earlier results) stays out of the plugin's reach.
 */
export function snapshotPlugin(repo) {
	const dir = mkdtempSync(join(tmpdir(), 'terse-plugin-'));
	for (const file of PLUGIN_PATHS.flatMap((path) => filesUnder(repo, path))) {
		const target = join(dir, relative(repo, file));
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, readFileSync(file));
	}
	return { dir, hash: hashFiles(repo, PLUGIN_PATHS) };
}

/** A short hash of every file under the given paths, names included. */
export function hashFiles(root, paths) {
	const hash = createHash('sha256');
	for (const file of paths.flatMap((path) => filesUnder(root, path)).sort()) {
		hash.update(`${relative(root, file)}\0`).update(readFileSync(file)).update('\0');
	}
	return hash.digest('hex').slice(0, 12);
}

/** Every input the judge sees, as paths relative to their input folder. */
export function collectJudgeInputs(caseDef) {
	return caseDef.judgeInputs.flatMap((input) => filesUnder(caseDef.dir, input).map((file) => ({
		path: relative(join(caseDef.dir, input), file) || input.split('/').at(-1),
		text: readFileSync(file, 'utf8'),
	})));
}

/** Copy one session's deliverable, stream, and hook log into the run folder. */
export function saveSession(runDir, { caseId, run, arm }, { deliverable, stdout, hookLog }) {
	const dir = join(runDir, caseId, `run-${run}`, arm);
	rmSync(dir, { recursive: true, force: true }); // a resumed run must not judge an older draft
	mkdirSync(dir, { recursive: true });
	if (deliverable !== null) writeFileSync(join(dir, 'deliverable.md'), deliverable);
	writeFileSync(join(dir, 'stream.jsonl'), stdout);
	writeFileSync(join(dir, 'hooks.jsonl'), hookLog);
	return dir;
}

/** Write JSON through a temporary file, so a crash never leaves half a file. */
export function saveJson(path, value) {
	mkdirSync(join(path, '..'), { recursive: true });
	writeFileSync(`${path}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
	renameSync(`${path}.tmp`, path);
}

export function removeWorkspace(dir) {
	rmSync(dir, { recursive: true, force: true });
}
