// Pins the installable manifests, their shared version, and the absence of hooks.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
describe('Codex plugin contract', () => {
	it('declares a skills-only productivity plugin', () => {
		const manifest = readJson('.codex-plugin/plugin.json');
		expect(manifest).toMatchObject({
			name: 'terse',
			version: '1.0.0',
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
			'Write an ADR for this decision.',
			'Draft the PR description for this branch.',
			'Turn my review notes into PR comments.',
		]);
		for (const field of [
			'hooks', 'apps', 'mcp', 'mcpServers', 'commands', 'agents',
			'legal', 'legalPolicy', 'assets', 'icon', 'iconSmall', 'iconLarge',
		]) {
			expect(manifest).not.toHaveProperty(field);
		}
	});

	it('keeps both host manifests and package metadata on version 1.0.0', () => {
		const codex = readJson('.codex-plugin/plugin.json');
		const claude = readJson('.claude-plugin/plugin.json');
		const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
		const pkg = readJson('package.json');
		expect([codex.version, claude.version, claudeMarketplace.metadata.version,
			claudeMarketplace.plugins[0].version, pkg.version])
			.toEqual(Array(5).fill('1.0.0'));
	});

	it('ships no hooks, so nothing runs when the user writes a file', () => {
		expect(existsSync(join(ROOT, 'hooks', 'hooks.json'))).toBe(false);
		expect(readJson('.claude-plugin/plugin.json')).not.toHaveProperty('hooks');
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
