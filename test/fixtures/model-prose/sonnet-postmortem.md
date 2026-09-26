# Checkout Outage Postmortem — September 18, 2026

## Summary

On September 18, 2026, checkout was unavailable for 47 minutes, from 14:12 to 14:59 UTC, following a configuration change to the payments-service database connection pool. The change was intended to free up database connections ahead of a scheduled marketing promotion, but instead caused the pool to exhaust itself under ordinary load, leaving every checkout request waiting on a connection that never became available.

## Impact

- Checkout success rate dropped to 0% for the full 47 minutes.
- Approximately 3,200 checkout attempts failed.
- Estimated revenue impact: $58,000, based on average order value and historical conversion for the affected window.
- Customer support logged 140 tickets referencing failed payments during the incident.

## Timeline (UTC)

- **14:05** — Config change deployed to payments-service, reducing `max_pool_size` from 100 to 20 and `idle_timeout` from 300s to 30s.
- **14:12** — Checkout error rate climbs sharply; an alert fires for elevated 5xx responses on `/api/checkout`.
- **14:14** — On-call engineer acknowledges the page and begins reviewing application logs.
- **14:22** — Logs show `ConnectionPoolTimeoutException` across all payments-service instances; suspicion shifts to the database tier.
- **14:31** — Database team confirms the primary database is healthy; connection count from payments-service is near zero rather than near the limit, which briefly confuses the investigation.
- **14:38** — The on-call engineer correlates the incident's start with the 14:05 deploy and identifies the pool size reduction as the likely cause.
- **14:45** — Rollback of the config change is initiated.
- **14:57** — Rollback completes; payments-service instances restart with the previous settings.
- **14:59** — Checkout success rate returns to baseline; incident declared resolved.

## Root Cause

The new 30-second `idle_timeout` recycled connections far more aggressively than the previous 300-second setting. Combined with a `max_pool_size` reduced from 100 to 20, the pool couldn't open replacement connections fast enough, particularly given checkout's payment authorization path, which issues two sequential queries per request. Under sustained load, all 20 connections ended up simultaneously closing or reopening, and requests queued for a connection that never arrived within the request timeout.

## Detection

Alerting on checkout error rate worked as intended and paged within two minutes of impact. However, there was no alert tied directly to connection pool utilization, so the on-call engineer had to infer the cause manually rather than seeing it immediately on a dashboard. This added roughly 20 minutes to the investigation.

## Resolution

The fix was a straightforward rollback to the prior pool configuration (`max_pool_size: 100`, `idle_timeout: 300s`). No code changes were required.

## Action Items

- Add a dashboard panel and alert for connection pool utilization and wait time — owned by the database team, due October 3.
- Require a canary deploy stage for any configuration change touching connection pool settings — owned by platform engineering, due October 10.
- Add a load test to CI exercising checkout's payment authorization path against pool configuration changes — owned by the payments team, due October 17.
- Evaluate combining the two sequential queries in payment authorization into one — owned by the payments team, due October 24.

## Lessons Learned

The change passed code review because it read as a minor tuning adjustment, but nobody modeled how the new settings would behave against checkout's specific query pattern under real load. Configuration changes to shared infrastructure, like connection pools, deserve the same scrutiny as code changes — including a rollback plan and a canary period — even when the diff looks small.
