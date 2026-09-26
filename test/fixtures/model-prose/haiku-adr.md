# ADR-0012: Persistent Data Store for Analytics Service

**Date**: September 2025  
**Status**: Accepted  
**Author**: Platform Team  
**Deciders**: Lead Architect, Product Lead  

## Context

We are building Insight, a new analytics service that ingests event streams from our payment pipeline and generates real-time dashboards for merchants. The service will store processed analytics data (aggregates, summaries, trends) for fast retrieval.

Initial projections suggest 5–10 million records per month, with queries spanning 6-month time windows. Data is structured: events have timestamps, merchant IDs, transaction amounts, and derived metrics (success rates, average value). We did not know which database would best fit until we prototyped both options.

## Decision

We will use PostgreSQL with JSON columns for the analytics data store, not MongoDB.

## Rationale

### Query Performance

PostgreSQL's query planner excels at complex aggregations. Our analytics queries need to compute percentiles, group by multiple dimensions (merchant, region, transaction type), and filter by date ranges. We prototyped on both systems:

- **PostgreSQL**: `SELECT merchant_id, percentile_cont(0.95) WITHIN GROUP (ORDER BY amount) FROM transactions WHERE date >= NOW() - interval '6 months' GROUP BY merchant_id` executed in 800ms on 50M rows.
- **MongoDB**: Equivalent aggregation pipeline took 2.1 seconds. MongoDB's aggregation framework lacks efficient histogram computation, requiring application-layer logic.

PostgreSQL's B-tree indexing on timestamps gave us faster filtering. We indexed on `(merchant_id, date)` and achieved 99th-percentile query latency under 1.5 seconds.

### Schema Flexibility

We expected the event schema to evolve. MongoDB's schemaless model seemed attractive, but the overhead outweighed benefits:

- **PostgreSQL**: We use JSONB columns for event metadata. This gives schema flexibility (new fields appear automatically) while preserving query efficiency. We can index JSONB fields and use GIN indexes for fast lookups.
- **MongoDB**: Schema evolution was free, but without validation, we accumulated malformed documents. Queries were brittle because field names were inconsistent.

After two months, we added `user_agent` to events. In PostgreSQL, we indexed it, and queries picked it up. In MongoDB, 15% of old events lacked the field, requiring app-layer null checks.

### Operational Burden

PostgreSQL fits our existing infrastructure. Our ops team already manages PostgreSQL clusters for production systems; they know backups, replication, failover procedures. Monitoring tools (Prometheus exporters, Grafana dashboards) were already written.

MongoDB would have required:
- New training for backup/restore procedures
- Setting up a separate monitoring stack
- Separate on-call runbooks
- Authentication and authorization policies aligned with our existing RBAC model

### Transaction Safety

Our ingestion pipeline needs to atomically write aggregates. PostgreSQL transactions ensure consistency. If we compute an aggregate and simultaneously query it, we see a coherent view. MongoDB's multi-document transactions are newer and carry overhead we didn't need.

### Cost

PostgreSQL is more cost-effective for our workload. RDS PostgreSQL instances handle our read/write volume efficiently with commodity server sizes (r6i.xlarge). MongoDB Atlas pricing scales differently; our usage pattern (many reads, sequential inserts) is cheaper on Postgres.

### Trade-offs Accepted

MongoDB would have been better for:
- **Rapid schema iteration**: No schema migration overhead. We mitigated this with JSONB.
- **Horizontal sharding at scale**: MongoDB shards transparently. Postgres sharding requires application logic or pgpartman. We're nowhere near that scale yet.
- **Sub-millisecond latency on individual lookups**: MongoDB's memory-mapped engine is slightly faster at single-key retrieval. Our use case is aggregate queries, not point lookups.

## Consequences

### Positive

- Fast analytics queries support real-time merchant dashboards.
- Single data store for the team to maintain (aligned with existing Postgres infrastructure).
- Schema validation and ACID compliance reduce data corruption.
- Cost predictable and low for our workload.

### Negative

- Scaling beyond 100M events per month will require sharding. We have 18–24 months before that's necessary, but it's a known limitation.
- JSONB queries are less elegant than MongoDB's dot notation for deeply nested data.
- Developers new to Postgres may need training on query optimization.

## Validation

We will monitor and measure:
- Query latency (p95 < 2 seconds for merchant dashboards)
- Ingestion throughput (target: 10k events/second)
- Storage efficiency (target: < 50 GB for 12 months of data)

If any metric degrades unexpectedly, we will revisit this decision. A MongoDB escape hatch is available if we fundamentally misread the workload.

## Alternatives Considered

1. **Elasticsearch**: Excellent for text search and time-series data. Overkill for structured aggregations. Higher operational overhead.
2. **ClickHouse**: Purpose-built for analytics. Excellent compression and query speed. Team lacked operational expertise; not worth the learning curve right now.
3. **BigQuery**: Managed solution, zero ops. Cost scales with queries. Suitable for data warehouse, not transactional analytics.
