// One `claude -p` session: its arguments and environment, the process, and
// what its stream-json transcript and hook log show. Only spawnClaude has
// effects; the rest is pure.
import { spawn } from 'node:child_process';

// Settings no other source can change, so both arms load no user or project files.
const ISOLATION = ['--setting-sources', '', '--strict-mcp-config', '--no-session-persistence'];
const HOOK = 'cat >> "$TERSE_EVAL_HOOK_LOG"; echo >> "$TERSE_EVAL_HOOK_LOG"';
const AUTH_ERRORS = new Set(['authentication_failed', 'oauth_org_not_allowed', 'account_on_hold',
	'verification_required', 'billing_error']);
const RATE_ERRORS = new Set(['rate_limit', 'overloaded', 'server_error']);
const SCRUBBED_ENV = ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'CLAUDE_CODE_EFFORT_LEVEL'];

/** SessionStart proves the hooks ran; InstructionsLoaded reports any memory file. */
export function hookSettings() {
	const entry = [{ hooks: [{ type: 'command', command: HOOK }] }];
	return JSON.stringify({ hooks: { SessionStart: entry, InstructionsLoaded: entry } });
}

/** Arguments for a generation session; the arms differ only by pluginDir. */
export function generationArgs({ model, maxTurns, effort, pluginDir }) {
	return [
		'-p', '--model', model, ...ISOLATION, '--settings', hookSettings(),
		'--allowedTools', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'Skill',
		'--disallowedTools', 'WebFetch', 'WebSearch',
		'--max-turns', String(maxTurns), '--max-budget-usd', '4',
		'--output-format', 'stream-json', '--verbose',
		...(effort ? ['--effort', effort] : []),
		...(pluginDir ? ['--plugin-dir', pluginDir] : []),
	];
}

export function judgeArgs({ model, effort, schema }) {
	return ['-p', '--model', model, '--effort', effort, ...ISOLATION, '--tools', '',
		'--output-format', 'json', '--json-schema', JSON.stringify(schema), '--max-turns', '3'];
}

export function childEnv(base, extra = {}) {
	const env = { ...base, ...extra };
	for (const key of SCRUBBED_ENV) delete env[key];
	return env;
}

/** Run claude with the prompt on stdin. Never rejects; a spawn failure is a result. */
export function spawnClaude(args, { cwd, env, input, timeoutMs }) {
	return new Promise((resolve) => {
		const child = spawn('claude', args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
		let stdout = '';
		let stderr = '';
		let killed = false;
		const timer = setTimeout(() => { killed = true; child.kill('SIGTERM'); }, timeoutMs);
		child.stdout.on('data', (chunk) => { stdout += chunk; });
		child.stderr.on('data', (chunk) => { stderr += chunk; });
		child.on('error', (err) => { stderr += err.message; });
		child.on('close', (code) => { clearTimeout(timer); resolve({ code, killed, stdout, stderr }); });
		child.stdin.on('error', () => {}); // a child that exits early closes its stdin
		child.stdin.end(input);
	});
}

export function parseStream(text) {
	return text.split('\n').flatMap((line) => {
		try { return line.trim() ? [JSON.parse(line)] : []; } catch { return []; }
	});
}

export const initEvent = (events) => events.find((e) => e.type === 'system' && e.subtype === 'init');
export const resultEvent = (events) => events.findLast((e) => e.type === 'result');

export function toolUses(events) {
	return events.filter((e) => e.type === 'assistant')
		.flatMap((e) => e.message?.content ?? [])
		.filter((block) => block.type === 'tool_use');
}

export function skillsInvoked(events) {
	return toolUses(events).filter((use) => use.name === 'Skill')
		.map((use) => String(use.input?.skill ?? use.input?.command ?? ''));
}

function assistantErrors(events) {
	return events.filter((e) => e.type === 'assistant' && e.error).map((e) => e.error);
}

/** One status per session: auth, rate-limit, timeout, transient, max-turns, over-budget, or ok. */
export function classifySession({ code, killed, events }) {
	const errors = assistantErrors(events);
	const result = resultEvent(events);
	if (errors.some((e) => AUTH_ERRORS.has(e))) return 'auth';
	if (errors.some((e) => RATE_ERRORS.has(e))) return 'rate-limit';
	if (!errors.length && looksUnauthenticated(result, events)) return 'auth';
	if (killed) return 'timeout';
	if (!result) return 'transient';
	if (result.subtype === 'error_max_turns') return 'max-turns';
	if (result.subtype === 'error_max_budget_usd') return 'over-budget';
	return code === 0 ? 'ok' : 'transient';
}

// An expired login "succeeds" with one message, no tools, and no cost.
function looksUnauthenticated(result, events) {
	if (!result) return false;
	if (/Failed to authenticate|Please run \/login|OAuth (token|session)/i.test(String(result.result))) return true;
	return result.total_cost_usd === 0 && toolUses(events).length === 0 && (result.num_turns ?? 0) <= 1;
}

/** Hook log lines: whether SessionStart fired, and any memory files loaded. */
export function memoryLoads(hookLog) {
	const entries = hookLog.split('\n').flatMap((line) => {
		try { return line.trim() ? [JSON.parse(line)] : []; } catch { return []; }
	});
	return {
		hooksRan: entries.some((e) => e.hook_event_name === 'SessionStart'),
		loads: entries.filter((e) => e.hook_event_name === 'InstructionsLoaded')
			.map((e) => ({ path: e.file_path, type: e.memory_type })),
	};
}

/**
 * True when any tool call names a file in the personal voice folder (other
 * than config.json), as a read or a glob would. Listing the folder doesn't
 * reveal the voice, so it doesn't count.
 */
export function voiceLeak(events, home) {
	const prefix = ['~', '\\$HOME', home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')].join('|');
	const file = new RegExp(`(?:${prefix})/\\.terse/(?!config\\.json)[\\w*]`);
	return toolUses(events).some((use) => file.test(JSON.stringify(use.input ?? {})));
}
