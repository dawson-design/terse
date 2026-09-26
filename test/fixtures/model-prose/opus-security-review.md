# Security Review: Ticket Attachment Uploads

**Service:** `docs-intake` (v2.4.0)
**Reviewer:** Application Security team
**Review dates:** September 8–19, 2026
**Status:** Changes required before general availability

## Summary

We reviewed the new attachment upload feature, which lets customers add PDFs, images, and spreadsheets to support tickets. Customers upload files through the web app. The `docs-intake` service processes them, stores them in the `harborline-customer-uploads` S3 bucket, and displays them to support agents in the internal console.

Overall, the design is sound, and the team has already adopted several good practices, including pre-signed upload URLs and server-side encryption at rest. However, we found one critical and two high-severity issues that must be fixed before the feature is enabled for all customers. The remaining findings can follow the normal schedule.

The review combined a design walkthrough with the team, manual code review of the upload and processing paths, and targeted testing in staging.

## Findings

### Critical

**C1: Stored cross-site scripting through SVG uploads.** The service accepts SVG files as images and serves them from the same origin as the support console. An SVG with embedded JavaScript runs in the agent's browser when opened, which gives an attacker access to the agent's session. We confirmed this in staging.

*Recommendation:* Remove SVG from the allowed types. Serve all user uploads from a separate sandboxed domain, such as `usercontent-harborline.net`, with `Content-Disposition: attachment` and a strict Content Security Policy.

### High

**H1: The client decides the file type.** The service trusts the `Content-Type` header and file extension sent by the browser. An attacker can upload an HTML or executable file labelled as a PDF.

*Recommendation:* Detect file types on the server from their magic bytes, and reject any file whose detected type isn't on the allowlist. Set the stored content type from this detection.

**H2: Pre-signed URLs don't enforce size limits.** The upload URLs lack a `content-length-range` condition, so only the frontend enforces the 25 MB limit. In staging, we uploaded a 4 GB file directly to the bucket.

*Recommendation:* Switch to pre-signed POST policies with a `content-length-range` condition, and cut URL expiry from 60 minutes to 5.

### Medium

**M1: No malware scanning.** Uploaded files become available to agents immediately, without any scanning. Agents often download and open these files on their workstations.

*Recommendation:* Quarantine new uploads until they pass a scan, for example with the ClamAV pipeline the billing service already uses. Mark them available only after they pass.

**M2: Predictable object keys.** Files are stored under keys like `tickets/{ticket_id}/{original_filename}`, and ticket IDs are sequential. The bucket is private, but predictable keys make enumeration easier if another access control fails.

*Recommendation:* Use random UUIDs for object keys and store the original filename as metadata.

### Low

**L1: Filenames are logged verbatim.** Filenames can contain customer names or other personal data, and application logs are kept for 90 days.

*Recommendation:* Log the file's ID and hash instead of its name.

**L2: File metadata is not stripped.** Stored PDFs and images keep author names, software versions, and sometimes GPS coordinates.

*Recommendation:* Strip metadata during processing. The risk is low, but this reduces unintended data exposure.

## Next steps

C1, H1, and H2 must be resolved before the feature expands beyond its current 5% rollout. We've opened tickets SEC-1182 through SEC-1188 to track each finding. Once the fixes are in, request a re-test in the #appsec-requests channel, and we'll aim to verify them within three business days.

Thanks to the Support Platform team for their help throughout the review.
