import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ClaimClient } from '../src/claimClient.js';

const reply = (status, body = {}) => ({ ok: status < 400, status, json: async () => body });

test('submit posts the claim as JSON', async () => {
	const calls = [];
	const client = new ClaimClient({
		baseUrl: 'https://intake.example.gov',
		fetchImpl: async (url, init) => { calls.push({ url, init }); return reply(201, { id: 'c-1' }); },
	});
	assert.deepEqual(await client.submit({ ssnLast4: '1234' }), { id: 'c-1' });
	assert.equal(calls[0].url, 'https://intake.example.gov/claims');
	assert.equal(calls[0].init.method, 'POST');
});
