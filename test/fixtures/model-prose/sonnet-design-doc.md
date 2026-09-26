# Design Doc: Queue-Based Worker Service for Background Jobs

Author: Alastair Dawson
Status: Draft
Date: September 26, 2026

## Context

Orderflow's monolith runs all background jobs — receipt emails, inventory reconciliation, report generation, and partner webhook delivery — in-process, using a thread pool inside the main Rails application. As traffic has grown, these jobs increasingly compete with web requests for CPU and database connections. During last November's peak sales period, a backlog of report-generation jobs measurably slowed checkout latency because both were contending for the same connection pool.

This doc proposes moving background job execution into a separate worker service that consumes jobs from a message queue, decoupling job execution from the web tier.

## Goals

- Remove background job execution from the web application process entirely.
- Allow background job throughput to scale independently of web traffic.
- Provide at-least-once delivery with visibility into failed and retried jobs.
- Keep the change transparent to the roughly 40 call sites that enqueue jobs today, so migration doesn't require rewriting business logic.

## Non-Goals

- Changing the business logic of any existing job.
- Exactly-once delivery; idempotency stays the responsibility of individual job handlers, as it is today.
- Migrating scheduled or cron-style jobs in this phase — only on-demand jobs enqueued from application code are in scope.

## Proposed Design

Jobs publish to Amazon SQS, one queue per category (`emails`, `reconciliation`, `reports`, `webhooks`) rather than a single shared queue, so a backlog in one category can't starve another. A new standalone worker service, deployed as its own set of containers, polls these queues and executes job handlers. Existing handler code moves largely unchanged into a shared gem so both the monolith and the worker service depend on the same job definitions.

Enqueueing goes through a thin adapter mirroring the current in-process API — e.g. `Jobs.enqueue(:send_receipt, order_id: 123)` — so call sites don't change. Failed jobs retry with exponential backoff up to five times, then land in a dead-letter queue that alerts the owning team.

## Alternatives Considered

- **Sidekiq with Redis**: familiar and simpler to operate than SQS, but ties job durability to Redis persistence settings that need careful tuning. We'd rather not add another stateful system when SQS already meets our durability needs.
- **Resource-isolate jobs in-process**: run the existing thread pool in a separate process on the same host, sharing only the deploy artifact. Rejected because it doesn't address the database contention that caused last year's incident.
- **A managed workflow engine, such as Temporal**: more powerful for multi-step workflows with complex state, but a heavy investment for a problem that's currently just "jobs compete with web requests for resources."

## Risks and Mitigations

- **Message ordering**: SQS standard queues don't guarantee order. No handler currently depends on ordering, but we'll audit this before migration and use FIFO queues for any that do.
- **Operational surface area**: a new service means new deploys, dashboards, and on-call load. We'll onboard it into existing tooling before migrating real traffic.
- **Partial migration state**: some jobs run in-process and some via the queue simultaneously during rollout. We'll migrate one category at a time, starting with `emails`, and monitor two weeks before moving on.

## Rollout Plan

Emails first, then webhooks, then reconciliation, then reports, each with a two-week bake period before proceeding. Full migration is targeted for the end of Q4 2026.

## Open Questions

- Should the shared job-definitions gem version independently, or deploy in lockstep with both services?
- Do we need per-category autoscaling from day one, or start with a fixed pool size and revisit later?
