# Async document upload: notes

Author: Dana Reyes. Reviewers wanted: Jo Alvarez (platform), Priya Shah (security).

## Today
- The disability claim form uploads supporting documents through our API:
  browser -> API gateway -> claims-api pod -> S3. The API holds the whole file
  in memory and scans it with the ClamAV sidecar before writing to S3.
- The gateway times out at 30 s. Files over about 10 MB on a slow connection
  hit it. Upload logs for September: 6.1% of uploads failed, almost all over
  10 MB. Support tickets about "upload keeps failing" doubled since July.
- Agency policy caps uploads at 25 MB. PDF, JPG, and PNG only.

## Proposal
- POST /uploads returns { uploadId, url, expiresAt }. The url is a presigned S3
  PUT to a quarantine bucket, valid 15 minutes, limited to the declared size
  and content type.
- Browser PUTs the file straight to S3.
- S3 event -> SQS -> scanner service (ClamAV on ECS Fargate). Clean files move
  to the documents bucket. Infected files get deleted and the upload marked
  infected.
- Form polls GET /uploads/{id} for status: pending, clean, infected, failed.
  Claim submission only accepts clean uploads.
- Quarantine bucket lifecycle: delete after 24 h. Documents bucket keeps the
  current 7-year retention. Both encrypted with our KMS key.

## Constraints
- AWS GovCloud (us-gov-west-1), FedRAMP Moderate boundary. Everything stays
  inside it.
- Scanner must keep up with the September peak: 9,400 uploads on the busiest
  day.

## Alternatives we looked at
- Raise the gateway timeout to 120 s. Platform said no: the gateway is shared
  and long requests tie up connections for every team.
- Multipart upload through the API in chunks. Still proxies every byte through
  claims-api pods, so memory stays the bottleneck.
- A third-party upload service. Not FedRAMP authorized.

## Rollout
- Behind a feature flag per form, starting with the disability claim form.
  Blast radius is small since it's behind a flag. Happy path is a clean PDF.
- Keep the old path until the new one has run a month at 100%.

## Open questions
1. Does the agency WAF allow browsers to PUT straight to S3 endpoints?
2. Who owns ClamAV signature updates for the scanner service?
3. What does the form show while a scan takes more than 60 s?
