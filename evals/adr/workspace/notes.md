# Architecture review, 2026-10-14: claim status caching

Attendees: Dana Reyes (tech lead), Priya Shah (security), Marcus Lee (product), Jo Alvarez (platform)

## Problem
- Claim status page calls the claims system's status endpoint on every page load. The claims system is a mainframe behind the agency ESB.
- p95 latency on that endpoint is 4.2 s (Sept dashboards). Median 1.1 s.
- ~1.8M status calls a day. Status for a given claim changes a few times a week at most, sometimes twice in one day.
- Upstream maintenance window Sundays 01:00-05:00 ET, plus about 2 unplanned outages a month. During those the page shows an error and the call center gets the calls.

## Options we talked through
1. Cache in Redis (ElastiCache, the cluster the auth service already uses), keyed by claim ID, 10-minute TTL. Store only the status code and the upstream last-updated timestamp.
2. Keep calling direct, add a circuit breaker (Resilience4j) so outages fail fast with a friendly message.
3. Nightly snapshot of all claim statuses into a Postgres table, page reads the table.

## Discussion
- Circuit breaker alone: page still waits 4.2 s at p95, and still shows nothing during outages. Fails fast but doesn't fix the user's problem.
- Nightly snapshot: too stale. Status can change during the day and the call center already gets complaints when the page lags the letter.
- Cache: staleness up to 10 min. Marcus is fine with that if the page shows "last updated". We can't invalidate on change because the claims system emits no events.
- Priya: status code + timestamp aren't PII, so no ATO amendment for PII at rest. Anything more (names, claim type details) would need one. Keep the cached value to those two fields.
- Jo: no new infra, the auth cluster has headroom. Blast radius is small since it's read-only. Happy path works in the spike.
- On a cache miss during an outage we still show the error. Accepted for now.

## Outcome
- Agreed direction: option 1, 10-minute TTL, status code and timestamp only, show "last updated" on the page.
- Dana to write it up as ADR 0014 and open a PR for sign-off.
- Open: do we warm the cache for active claims before the Sunday window? Nobody owns this yet.
