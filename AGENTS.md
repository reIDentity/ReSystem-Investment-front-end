<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## reSystem platform continuation

Before platform implementation, read `START_HERE.md`, `docs/planning/RE_SYSTEM_IMPLEMENTATION_PLAN.md`, `docs/planning/tasks.json`, and `docs/planning/notion-tracker.json`.

Track each authorized implementation task in the linked Notion workspace: **To do -> In progress -> Done**. Start status when work actually begins. Mark Done only after acceptance criteria and relevant checks pass and a real GitHub commit URL is attached. Do not invent evidence, assume a local commit is published, or mark unfinished work complete. If Notion is unavailable, record the pending update locally and reconcile it later.

Keep the investor frontend, admin frontend, backend, contracts and indexer in separate repositories. Preserve existing uncommitted work. This handoff does not authorize automatic implementation, pushing, or contract deployment in a later session without an applicable user request.

Archive all project documents in the private Notion [Documents library](https://app.notion.com/p/02d0e65d064b4316b6fbe3a9c466434f) and keep the [Services inventory](https://app.notion.com/p/772a663cc1334f269b73e144c998f089) current as tools or services are added or changed. Follow the [Maintenance workflow](https://app.notion.com/p/3fb3b21ac9258126a8cdf47262d97fb2). Record hosting targets separately from verified runtime/deployment status. The investor frontend targets Vercel; the admin frontend, NestJS backend, PostgreSQL, Redis/workers, indexer and any separately approved optional GraphQL service target the FP server accessed through Teleport. The user confirmed FP as `footprint.frontend`; preserve its unrelated explorer and Fractionaire services. Read `docs/planning/IMPLEMENTATION_STATUS.md` for observed deployment and readiness evidence. REST/OpenAPI remains the initial API plan. Current INFRA work is testnet/UAT.

The user has authorized storing this project's actual development/testnet credential values in the dedicated private Notion [Development Credentials](https://app.notion.com/p/3fb3b21ac925812da705f4394432fe55) page. Keep literal credentials out of Git, local handoffs, the client PDF, general documentation, task bodies and logs; general pages may link to that private page. Runtime secrets still use protected environment injection. Existing development/testnet credentials may be used for authorized development; rotate them before live production rather than treating rotation as a blocker for current testnet work. Preserve the private project's access boundary and do not publish or share its documents or credentials.

## Preserve the approved UI

The user explicitly instructed: **“do not ever change UI.”** Preserve the approved Figma design and the user's accepted blue/white branding corrections. The current visual restoration is authorized to undo integration-driven redesigns; it is not permission to invent a new interface.

- Bind live data and backend actions to the existing approved components and layout. Do not replace designed screens with generic technical panels, change their hierarchy, remove form controls, or add implementation prose during integration.
- Preserve spacing, typography, icons, images, colours, button shape and placement, navigation, responsive behavior and copy unless the user explicitly requests that visual change. Use the supplied Figma assets at their intended geometry.
- Retain the shared homepage logo/blue, white text on blue, the original green Fractionaire logo and the user's requested Coming soon treatment for unavailable card/bank payments.
- An unavailable API value uses the same designed slot with an honest empty/unavailable state. Never restore fabricated balances, revenue, forecasts, identities, wallet addresses or successful transaction states to imitate sample Figma data. Financial review and approval must remain truthful.
- Compare all affected screens with their original Figma references at desktop and phone widths before publishing. Record explicit user-requested exceptions and verified evidence. Future backend work must preserve the visual baseline.
