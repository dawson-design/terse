# On-Call Runbook: High Queue Latency in Payment Processor

**Alert**: `PaymentQueue::AverageLatency > 5000ms` over 5 minutes  
**Severity**: P1 (production impact, customer-facing)  
**Oncall Contact**: #payments-oncall Slack channel  
**Last Updated**: September 2025

## Quick Facts

The payment queue is our distributed job processor that handles transaction submissions across 12 regional endpoints. Normal p95 latency is 400ms; anything above 2s is elevated. Latencies above 5s indicate a serious bottleneck.

## Immediate Actions (0–5 min)

1. **Confirm the alert is real**. Check the Datadog dashboard [Payment Queue Metrics](https://datadog-link/dashboard). Look at the latency chart for all regions. Is it spiking everywhere, or just one region?
   
2. **Check for deployments**. Run `deploy-status --service payments-queue`. If a deployment is in progress, it may be the cause. If so, notify the #deployments channel and ask whether to rollback.

3. **Check database connectivity**. The queue writes transaction records to our PostgreSQL cluster (proddb-payments-1). Run:
   ```
   psql -h proddb-payments-1 -c "SELECT 1;"
   ```
   If this hangs or fails, the database is down or unreachable. Page the database oncall immediately.

## Diagnosis (5–15 min)

4. **Inspect queue depth**. High latency often correlates with queue backup. SSH to any queue worker (`queue-worker-us-east-1.internal`) and run:
   ```
   queue-cli status
   ```
   This shows pending job count, processed rate, and queue utilization. If pending > 50,000, we are backlogged.

5. **Check worker health**. Latency can spike if workers are crashing or restarting. Run:
   ```
   kubectl logs -n payments -l app=payment-queue --tail=50 | grep -i "error\|panic"
   ```
   Look for recurring errors or panics. Common culprits:
   - Memory pressure (OOM kills)
   - Resource exhaustion (connection pool full)
   - Downstream service timeouts (calls to card processor, fraud checker)

6. **Test downstream dependencies**. The queue calls three external services. Check their health:
   - **Stripe API**: `curl -I https://api.stripe.com/v1/health 2>/dev/null | head -1`
   - **Sift fraud checker**: `curl -I https://sift.local/health 2>/dev/null | head -1`
   - **Acquirer gateway** (internal): `curl -I https://acquirer.payment.svc/health 2>/dev/null | head -1`
   
   If any return non-200, that service is degraded. Escalate to the owning team.

## Common Causes and Fixes

**Scenario A: Queue is backed up (pending > 50,000)**

Cause: Workers are processing slower than jobs are arriving.

Action: Scale up the queue worker deployment:
```
kubectl scale deployment payment-queue --replicas=20 -n payments
```
The deployment normally runs 8 replicas. Going to 20 should absorb the backlog within 10 minutes. Monitor the queue depth and scale back down once p95 latency < 1s.

**Scenario B: One region is slow, others are fine**

Cause: Likely a regional database replica lag or network partition.

Action: Check replica lag for the slow region. If lag > 5s, fail traffic over to another region's replica. Run:
```
failover-queue-region --from us-west-2 --to eu-west-1
```
Then notify #platform-reliability so they can investigate the origin region.

**Scenario C: All workers are unhealthy**

Cause: Bug in a recent deployment, misconfiguration, or resource starvation.

Action: Rollback the last deployment:
```
deploy-rollback --service payments-queue --to previous
```
This takes ~60 seconds. Once healthy, investigate what went wrong in the rolled-back version.

## Escalation

If latency does not improve after 15 minutes, page:
- **Database oncall** (if DB is slow)
- **Stripe/Sift oncall** (if external service is failing)
- **Infrastructure oncall** (if cluster is resource-constrained)

Link them to this runbook and share the Datadog dashboard. Do not attempt to fix unfamiliar systems yourself.

## Post-Incident

After the alert clears, open an incident in PagerDuty and briefly note what you found. Was it expected? Are there preventive measures? Tag #post-incident-review so the team can debrief.
