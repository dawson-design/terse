# Getting Started with Webhooks

Pinecrest webhooks let your application react to events in your account as they happen, so you don't have to poll the API for changes. When something notable occurs, such as an invoice being paid or a subscription being cancelled, we send an HTTP POST request to a URL you control. The request carries a JSON payload describing the event.

This guide covers registering an endpoint, verifying that requests really come from us, handling retries, and making your handler idempotent.

## Registering an endpoint

You can register endpoints in the dashboard under **Settings → Webhooks**, or through the API by sending a POST to `/v2/webhook_endpoints`. Each endpoint needs:

- A publicly reachable HTTPS URL (plain HTTP is rejected outside test mode)
- A list of event types to subscribe to, such as `invoice.paid` or `customer.updated`
- An optional description to remind your team what it's for

When you create an endpoint, the response includes a signing secret that starts with `whsec_`. We show it only once, so store it in your secrets manager. If you lose it, roll the secret from the dashboard. The old secret stays valid for 24 hours so you can deploy the new one without dropping events.

## Verifying signatures

Anyone who discovers your endpoint URL could send it fake events, so verify every request before acting on it. Each delivery includes a `Pinecrest-Signature` header with a timestamp and an HMAC-SHA256 signature:

```
Pinecrest-Signature: t=1727337600,v1=5f2b8c...
```

To verify it, join the timestamp, a period, and the raw request body. Compute an HMAC-SHA256 of that string using your signing secret, then compare the result with the `v1` value using a constant-time comparison. Also check that the timestamp is within five minutes of your server's clock, which protects against replay attacks.

Many web frameworks parse JSON bodies automatically, but verification must use the raw bytes exactly as received, so capture the body before any parsing. Our SDKs for Node, Python, Go, and Ruby include a `verifyWebhook` helper that handles all of this.

## Retries

Your endpoint should respond with a 2xx status code within 10 seconds. If it returns anything else or times out, we treat the delivery as failed and retry with exponential backoff. We make up to eight attempts, with the final retry about 72 hours after the original event.

If an endpoint keeps failing for three days, we disable it and email the account owners. After fixing the problem, re-enable it from the dashboard and replay missed events from the event log.

Since a slow handler counts as a failure, put the event on a queue, return a 200, and process it in a background worker.

## Idempotency

We guarantee at-least-once delivery, not exactly-once. Network issues and retries mean your endpoint may sometimes receive the same event twice. Every event has a unique `id` field, such as `evt_01J8Z3K4QW`, which you can use to deduplicate.

A simple approach is to record each processed event ID in a table with a unique constraint. Before handling an event, insert its ID; if the ID already exists, skip the event and return 200. Keep these records for at least seven days.

Events can also arrive out of order. If ordering matters, compare the event's `created` timestamp with the state you already hold, or fetch the latest version of the object before updating your records.

## Next steps

Send a test event from the dashboard, or run `pinecrest webhooks trigger invoice.paid` to simulate one locally. The API reference lists every event type and its payload schema.
