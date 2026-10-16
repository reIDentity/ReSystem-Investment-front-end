# reSystem Investment - start here

This is the investor frontend repository, not a monorepo. The complete platform is planned across five independent repositories.

Before continuing platform work, read:

1. [Implementation plan](docs/planning/RE_SYSTEM_IMPLEMENTATION_PLAN.md) - confirmed business rules, architecture, current state, open decisions and delivery sequence.
2. [Task backlog](docs/planning/tasks.json) - stable task IDs, dependencies and acceptance criteria.
3. [Notion tracker mapping](docs/planning/notion-tracker.json) - live workspace/database IDs and task-page URLs.

The live project workspace is [reSystem Investment | Project Management](https://app.notion.com/p/3fb3b21ac925815cab02d74e0f79fc0b). It is private to the connected Notion workspace; do not share or move it without user direction. Archive all project documents in the [Documents library](https://app.notion.com/p/02d0e65d064b4316b6fbe3a9c466434f), keep the [Services inventory](https://app.notion.com/p/772a663cc1334f269b73e144c998f089) current as tools/services are added or changed, and follow the [Maintenance workflow](https://app.notion.com/p/3fb3b21ac9258126a8cdf47262d97fb2). Actual development/testnet credential values belong only in [Development Credentials](https://app.notion.com/p/3fb3b21ac925812da705f4394432fe55).

## Required task workflow

- Reconcile the selected task with its current Notion page; the JSON backlog is an initial snapshot, not automatically synchronized live state.
- Move a task to **In progress** when implementation actually starts. Record the start, task ID and repository.
- Complete the task's acceptance criteria and relevant verification. Record blockers rather than claiming completion.
- Commit in the correct repository and attach a genuine, accessible GitHub commit URL plus verification evidence. Publish changes only within the user's authorized Git workflow.
- Move the task to **Done** only after that evidence exists. Multiple commits can be listed in the task body; keep the final implementation commit in the GitHub commit field.
- If Notion is unavailable, record pending updates locally and reconcile them later. Do not silently imply the board was updated.
- Archive new or revised project documents in the private Notion project and update Services with purpose, environment, hosting target, actual deployment status, owner and credential-page reference. A hosting decision is not proof that a service is deployed.
- A future session must read the current user request and repository state before deciding which task to start. This handoff does not authorize unattended work or deployment.

## Preserve the current workspace

Platform implementation was approved and started on 16 October 2026. All five independent repositories now have published implementations on dev. The investor app uses actual backend data rather than a DemoProvider; unavailable features and empty/partial states are explicit. This is not complete financial UAT or production acceptance. Read docs/planning/IMPLEMENTATION_STATUS.md and the live Notion board before continuing. Inspect current Git state and preserve any concurrent agent work.

The agreed fixed pricing rule is **1 USDT = 3.6 reAED**. Any INFRA wallet may receive/trade fractions. The user approved all v1 defaults in the implementation plan.

## Confirmed hosting and development credentials

- Investor frontend: **Vercel**; the existing public investor deployment belongs to a different Vercel account than the connected tool. The user must apply the reviewed server-only BFF settings in that account; do not use the unrelated connected account.
- Admin frontend, NestJS backend, PostgreSQL, Redis/workers, standalone indexer and any separately approved optional GraphQL service: **FP server, accessed through Teleport**. The user confirmed the FP node as `footprint.frontend`; read-only SSH through the permitted `resystem` account and Docker availability are verified. DNS and the ACME certificate for resyste.isuru.dev are verified. The user changed the canonical admin/API target to `https://admin.resystem.org` on16October2026; DNS points to FP and TLS/origin migration is underway. The previous temporary site, backend, worker, private PostgreSQL/Redis, migrations/grants, staff password/MFA login and an encrypted backup/new-database restore have been verified. The exact-pinned indexer adapter is being rebuilt after an INFRA trace compatibility fix; readiness and complete financial UAT remain open. FP recovered after the user reported the server working; its outage cause is unverified. Do not blindly rerun provisioning or reset existing runtime credentials. REST/OpenAPI is the initial API and GraphQL is optional.
- Current blockchain work uses **INFRA testnet/UAT**, not live production. The base factory/implementation/marketplace/router are deployed; their verified manifest is in the contracts repository at artifacts/v1/deployment.15324.json. No project or investor funding has been created. The narrow reID provider approval-safety patch was deployed with exact binary/commit checks and rollback preservation. Backend submission remains explicitly disabled pending fresh user consent and exact approved wallet UAT.

The user has authorized archiving this project's actual development/testnet credential values in the dedicated private Notion **Development Credentials** page. Keep literal private keys, API secrets, access/refresh tokens and passwords out of Git, local handoffs, general Notion/project documentation, task bodies, the client PDF and logs. General documents and service records may link to the credential page; protect runtime values through server-only environment injection. Existing credentials may support authorized development/testnet work. Rotate them before live production; rotation is not a prerequisite for current development.

**16 October 2026 decision update:** private Notion is the project document archive and development credential register; Services must be maintained continuously; investor hosting is Vercel and other project services target FP/Teleport. Actual implementation and deployment evidence is recorded separately in the implementation status document and live task board; do not infer completion from a hosting choice.

The client-facing visual plan is [the PDF](output/pdf/reSystem-Investment-Platform-Plan.pdf).

All five checkouts are siblings under `/Users/isurutmv/Developer Office/reSystem/workspaces/`, including this investor app (`ReSystem-Investment-front-end`). The main `reSystem` directory is only a local container. See `docs/planning/repositories.json`.

Security requirements, implemented controls, evidence and open release gates are recorded in `docs/security/SECURITY_ARCHITECTURE.md` and the dedicated private Notion security page. Keep both current.
