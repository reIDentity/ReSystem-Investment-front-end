# Automatic admin revenue references — deployed acceptance

22 October 2026 · RSI-121

Owner request: remove manual Unique funding reference / Supporting report reference bytes32 entry. The existing admin funding modal now creates a unique cryptographic reference and accepts an optional local report whose exact SHA-256 is calculated automatically. PDF/CSV/XLSX reports must be nonempty and at most10MiB. Only the digest is part of the existing command; filename and file contents are not uploaded or archived. The interface explicitly tells staff to keep the original. Replacing/removing a report invalidates stale async results and resets acknowledgment. Review remains disabled while hashing or while a report error is unresolved. Limited allowances and treasury withdrawals have no funding references. Existing exact transaction review, roles, scope, signer and MFA approval remain.

## Published evidence

- Admin source [70a569d](https://github.com/reIDentity/ReSystem-Investment-admin/commit/70a569d25bbe8387a8698bce9a3441191dff9869):191 tests, including8 focused tests, lint, TypeScript, production build and full-history secret scan.
- [Source CI39764805668](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39764805668) passes all gates. [Image workflow39765094160](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39765094160) verified exact source, archive, image configuration and layers. Its automatic release explicitly deferred because QA was enabled; a successful workflow is not itself deployment evidence.
- The owner separately approved a brief pause and confirmed no open wallet approvals. The one-session operator preserved the already-verified email policy and changed only the investor request gate, with unchanged API/worker images. The admin image was staged/loaded through the root controller; no build ran on FP.
- Exact hosted config digest: `sha256:802ea7fcd99de1e038a94c9d51d8c54a5b8e07e2b74e7441d9dc5247241c69bc`. FP's content-store image ID: `sha256:12e60707cefd6dba1195d1966a5405a701cbcb6fbecf38d3af646c63429294b4`. These represent the verified same archive on different Docker stores.
- Runtime Node22.23.3→22.23.4 was verified as the exact patch transition for these pinned old/new images, with12 preservation/negative checks. The one-release operator retained the root controller's source, drain, rollback, schema, credentials, peer and resource checks; installed controller/policy remained unchanged.
- Root receipt `release-admin-70a569d25bbe-57c12fc0cc98` reports deployed70a569d, protected state preserved, migrationRun false, fresh advancing indexer and owned signer drain resumed. Backend stays7faae39c; indexer stays6f359683; isolated signer stayse950fd91.
- Pause receipt ends `close-7da7c371edb242db8ac63239e7b0ce90`; restoration ends `open-36e6a6ae4ee64fc1b7ac02371ffa76ef` with verified_open and financialActions false. Independent root status confirms admin70a569d, API/indexer healthy and gate OPEN. Ongoing investor QA stays enabled until the owner asks to close it.

## Actual deployed browser acceptance

The signed-in admin Treasury form has zero editable reference/bytes32 fields. A clearly synthetic local CSV reaches “fingerprint ready”; Remove report clears the file selection and readiness. The project remains selectable, and Review request remains disabled with no amount/acknowledgment. Phone390×844 has a339px modal with no document horizontal overflow; the existing scroll behavior makes the controls accessible. No console errors were captured. Temporary viewport override was reset.

Screenshots remain local in protected `.runtime/admin-funding-20261022/`: `revenue-form.png`, `revenue-form-desktop.png`, `revenue-form-phone.png`. They were not uploaded to GitHub or Notion. No financial intent, wallet approval, signature, broadcast or test email occurred. No local server/container was started. This verifies the requested admin controls, not broader platform or independent client acceptance.

Private [task](https://app.notion.com/p/4013b21ac9258138be71f966f6024caa) and [document](https://app.notion.com/p/4013b21ac9258109aaedfbab95f320d9) contain matching publication/runtime evidence. Backlog121:98 Done/20 In progress/3 To do.
