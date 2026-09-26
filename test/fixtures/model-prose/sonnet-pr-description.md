# Add rate limiting to public REST API

## Motivation

Over the past month we've had three incidents where a single misbehaving integration partner sent enough traffic to `/api/v2/*` to degrade latency for everyone else on the shared API gateway. The most recent, on September 12, pushed p99 latency from 180ms to over 4 seconds for about 20 minutes while a partner's retry loop hammered `/api/v2/orders`. We have alerting for this now, but no automatic protection — someone has to notice and manually block an IP or API key before it stops.

This PR adds per-API-key rate limiting at the gateway layer so that one client's traffic can't degrade service for others, and so we have a documented, predictable limit to point partners to instead of ad hoc blocking after the fact.

## What changed

- Added a token-bucket rate limiter middleware in `gateway/middleware/rate_limit.go`, keyed by API key rather than IP, since most of our traffic comes from a small number of partner integrations sitting behind shared NAT.
- Default limit is 100 requests/second per key with a burst of 200, configurable per key via two new columns on the `api_keys` table, `rate_limit_rps` and `rate_limit_burst`. Existing keys default to the standard limit; nothing needs to be backfilled.
- Requests over the limit receive `429 Too Many Requests` with a `Retry-After` header and a JSON body describing the limit, matching the error shape we already use elsewhere in the API.
- Added `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers on every response, not just 429s, so well-behaved clients can self-throttle before hitting the wall.
- Rate limit state is stored in Redis with a 2-second TTL sliding window, chosen to keep the check cheap — a single round trip — without standing up a separate service just for this.

## Testing

- Unit tests for the token bucket logic covering burst consumption, refill timing, and per-key isolation, in `gateway/middleware/rate_limit_test.go`.
- An integration test against a real Redis instance in CI verifying header values and 429 behavior under sustained load.
- Load-tested locally with `vegeta` at 500 req/s against a single key to confirm the limiter engages at the configured threshold and that traffic under the limit is unaffected.
- Manually verified in staging by replaying real traffic patterns from logs for our two largest partner integrations; neither would have been throttled by the default limit under normal operation.

## Rollout

This ships behind a feature flag, `rate_limiting_enabled`, off by default. Plan:

1. Enable in staging now and monitor for a week.
2. Enable in production in "log only" mode — compute and expose the headers, but never return 429 — for two weeks, to validate that the default limits are set sensibly against real traffic.
3. Flip to enforcing mode for all keys, with the platform team on call to raise limits quickly for any partner that gets legitimately throttled.
4. Email partners the documented default limits before step 3, along with instructions for requesting a higher limit if their integration needs one.

There are no client-facing API contract changes beyond the new headers and the possibility of a 429 response, which is already a documented status code in our API reference.
