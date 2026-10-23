// Submits unemployment insurance claims to the state intake API.
export class ClaimClient {
	constructor({ baseUrl, fetchImpl = fetch }) {
		this.baseUrl = baseUrl;
		this.fetch = fetchImpl;
	}

	async submit(claim) {
		const response = await this.fetch(`${this.baseUrl}/claims`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(claim),
		});
		if (!response.ok) {
			throw new Error(`intake API returned ${response.status}`);
		}
		return response.json();
	}
}
