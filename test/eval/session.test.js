// What a session's arguments, stream, and hook log show.
import { describe, it, expect } from 'vitest';
import {
	childEnv, classifySession, generationArgs, memoryLoads, parseStream, skillsInvoked, voiceLeak,
} from '../../scripts/eval/session.mjs';

const line = (event) => JSON.stringify(event);
const assistant = (content, extra = {}) => line({ type: 'assistant', message: { content }, ...extra });
const result = (extra) => line({ type: 'result', subtype: 'success', total_cost_usd: 0.4, num_turns: 6, result: 'done', ...extra });
const tool = (name, input) => ({ type: 'tool_use', name, input });
const stream = (...lines) => parseStream(lines.join('\n'));

describe('session classification', () => {
	it('is ok when the run finished and cost something', () => {
		const events = stream(assistant([tool('Skill', { skill: 'terse:email' })]), result());
		expect(classifySession({ code: 0, killed: false, events })).toBe('ok');
		expect(skillsInvoked(events)).toEqual(['terse:email']);
	});

	it('is auth when an expired login "succeeds" with one message and no cost', () => {
		const events = stream(assistant([{ type: 'text', text: 'Failed to authenticate' }]),
			result({ total_cost_usd: 0, num_turns: 1, result: 'Failed to authenticate. API Error: 401' }));
		expect(classifySession({ code: 0, killed: false, events })).toBe('auth');
	});

	it('is auth when a session does nothing and costs nothing, whatever its text says', () => {
		const events = stream(assistant([{ type: 'text', text: 'Done.' }]),
			result({ total_cost_usd: 0, num_turns: 1, result: 'Done.' }));
		expect(classifySession({ code: 0, killed: false, events })).toBe('auth');
	});

	it('is auth when an assistant message carries an auth error', () => {
		const events = stream(assistant([], { error: 'authentication_failed' }), result());
		expect(classifySession({ code: 1, killed: false, events })).toBe('auth');
	});

	it('is rate-limit, not auth, when the first call is rate limited at no cost', () => {
		const events = stream(assistant([], { error: 'rate_limit' }), result({ total_cost_usd: 0, num_turns: 1, result: 'API Error' }));
		expect(classifySession({ code: 1, killed: false, events })).toBe('rate-limit');
	});

	it('is over-budget when the session hits its spending cap', () => {
		const events = stream(result({ subtype: 'error_max_budget_usd' }));
		expect(classifySession({ code: 1, killed: false, events })).toBe('over-budget');
	});

	it('is transient when the process exits 1 with no output', () => {
		expect(classifySession({ code: 1, killed: false, events: [] })).toBe('transient');
	});

	it('is rate-limit, timeout, or max-turns when those happen', () => {
		expect(classifySession({ code: 1, killed: false, events: stream(assistant([], { error: 'rate_limit' })) })).toBe('rate-limit');
		expect(classifySession({ code: null, killed: true, events: stream(assistant([])) })).toBe('timeout');
		expect(classifySession({ code: 0, killed: false, events: stream(result({ subtype: 'error_max_turns' })) })).toBe('max-turns');
	});

	it('skips lines that are not JSON', () => {
		expect(parseStream('noise\n{"type":"result"}\n')).toEqual([{ type: 'result' }]);
	});
});

describe('isolation evidence', () => {
	it('reads SessionStart and memory loads from the hook log', () => {
		const log = [
			line({ hook_event_name: 'SessionStart' }),
			line({ hook_event_name: 'InstructionsLoaded', file_path: '/x/CLAUDE.md', memory_type: 'Project' }),
		].join('\n\n');
		expect(memoryLoads(log)).toEqual({ hooksRan: true, loads: [{ path: '/x/CLAUDE.md', type: 'Project' }] });
		expect(memoryLoads('')).toEqual({ hooksRan: false, loads: [] });
	});

	it('flags a read of the personal voice through Read or Bash', () => {
		const read = stream(assistant([tool('Read', { file_path: '/Users/a/.terse/voice.md' })]));
		const bash = stream(assistant([tool('Bash', { command: 'cat ~/.terse/voice.md' })]));
		const clean = stream(assistant([tool('Read', { file_path: '/tmp/w/.terse/config.json' })]));
		expect(voiceLeak(read, '/Users/a')).toBe(true);
		expect(voiceLeak(bash, '/Users/a')).toBe(true);
		expect(voiceLeak(clean, '/Users/a')).toBe(false);
	});

	it('does not count listing the voice folder or reading its config', () => {
		const list = stream(assistant([tool('Bash', { command: 'ls ~/.terse 2>/dev/null; ls ~/.terse/' })]));
		const config = stream(assistant([tool('Read', { file_path: '/Users/a/.terse/config.json' })]));
		const glob = stream(assistant([tool('Bash', { command: 'cat $HOME/.terse/*' })]));
		expect(voiceLeak(list, '/Users/a')).toBe(false);
		expect(voiceLeak(config, '/Users/a')).toBe(false);
		expect(voiceLeak(glob, '/Users/a')).toBe(true);
	});
});

describe('invocation', () => {
	it('gives the two arms the same arguments except --plugin-dir', () => {
		const bare = generationArgs({ model: 'm', maxTurns: 60 });
		const plugin = generationArgs({ model: 'm', maxTurns: 60, pluginDir: '/repo' });
		expect(plugin).toEqual([...bare, '--plugin-dir', '/repo']);
		expect(bare).toEqual(expect.arrayContaining(['--setting-sources', '', '--strict-mcp-config']));
	});

	it('scrubs variables that would change the model, effort, or billing', () => {
		const env = childEnv({ PATH: '/bin', ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'x', CLAUDE_CODE_EFFORT_LEVEL: 'max' }, { X: '1' });
		expect(env).toEqual({ PATH: '/bin', X: '1' });
	});
});
