# #311 Duplicate claims when the intake API times out

Opened by Jordan Pike (claims operations), 2026-09-22

When the intake API is slow, the portal shows claimants "Something went
wrong" even though the claim was saved. Many claimants submit again, and the
second POST creates a second claim. We merged 140 duplicate claims in
September. Each one takes a caseworker about 20 minutes, and while both exist
the claimant can get two determination letters.

The intake team says their API supports an `Idempotency-Key` header: POSTs
with the same key within 24 hours return the first claim instead of creating
a new one. They also confirmed the 503s we see every night between 01:00 and
01:30 are their batch window and are safe to retry.

Notes from standup: happy path works today, it's only the timeout case. Blast
radius is small since the client is only used by the portal.
