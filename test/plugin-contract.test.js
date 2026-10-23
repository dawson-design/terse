// Pins the installable Codex manifest and the shared hook entrypoint.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
describe('Codex plugin contract', () => {
	it('declares a skills-only productivity plugin', () => {
		const manifest = readJson('.codex-plugin/plugin.json');
		expect(manifest).toMatchObject({
			name: 'terse',
			version: '0.14.0',
			skills: './skills/',
			interface: {
				displayName: 'Terse',
				developerName: 'Alastair Dawson',
				category: 'Productivity',
				capabilities: ['Read', 'Write'],
			},
		});
		expect(manifest.interface.defaultPrompt).toHaveLength(3);
		expect(manifest.interface.defaultPrompt).toEqual([
			'Write a professional document in my voice.',
			'Edit this file for clarity without changing its meaning.',
			'Outline this document before drafting it.',
		]);
		for (const field of [
			'hooks', 'apps', 'mcp', 'mcpServers', 'commands', 'agents',
			'legal', 'legalPolicy', 'assets', 'icon', 'iconSmall', 'iconLarge',
		]) {
			expect(manifest).not.toHaveProperty(field);
		}
	});

	it('keeps both host manifests and package metadata on version 0.14.0', () => {
		const codex = readJson('.codex-plugin/plugin.json');
		const claude = readJson('.claude-plugin/plugin.json');
		const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
		const pkg = readJson('package.json');
		expect([codex.version, claude.version, claudeMarketplace.metadata.version,
			claudeMarketplace.plugins[0].version, pkg.version])
			.toEqual(Array(5).fill('0.14.0'));
	});

	it('uses either host plugin root for the trusted hook', () => {
		const hooks = readJson('hooks/hooks.json');
		const post = hooks.hooks.PostToolUse[0];
		expect(post.matcher).toBe('Write|Edit');
		expect(post.hooks[0].command).toBe(
			'node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/scripts/style-hook.mjs"');
	});

	it('publishes the repository root through the Codex marketplace', () => {
		const marketplace = readJson('.agents/plugins/marketplace.json');
		expect(marketplace).toMatchObject({
			name: 'terse',
			interface: { displayName: 'Terse' },
			plugins: [{
				name: 'terse',
				source: {
					source: 'url',
					url: 'https://github.com/kreek/terse.git',
				},
				policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
				category: 'Productivity',
			}],
		});
	});
});
