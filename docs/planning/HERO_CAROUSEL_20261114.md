# Landing hero carousel — local implementation and verification

## Authorized visual update

14 November 2026 — The owner supplied the desktop and portrait WhatsApp animation videos and requested replacing the landing hero animation. Both show a rotating 3D project-card carousel. The clips were reviewed as design references; their mock projects and simulated investment/success screens were not used as live application state.

## Implemented behavior

- Responsive blue carousel with perspective, depth, soft background cards and smooth transitions, using real published project titles, descriptions, artwork and existing public project URLs.
- Automatic rotation every three seconds; previous/next, desktop project selectors, a compact phone counter, native project links and horizontal touch swipes.
- Pause/play, hover/focus pause, offscreen/hidden-tab pause and OS reduced-motion support. Explicit Play resumes intentionally; a new focus/hover interaction pauses it again.
- Stable selection by immutable project ID across catalogue refreshes and removal. Only the active card is interactive/focusable; inactive cards are inert and hidden from assistive technology.
- Touch swipes preserve vertical page scrolling, ignore secondary pointers, pause during the gesture and suppress the following synthetic click.
- Existing public data reads are reused. No new per-slide API calls, video downloads, external media hosts, animation libraries or continuous JavaScript animation loop.
- During browser QA, duplicate title-based React keys in the existing revenue-breakdown UI were replaced with project IDs, also separating hover state for projects with the same name. Its presentation and financial values are unchanged.

## Local verification

All262 tests pass, including14 carousel interaction tests. ESLint, production build/TypeScript and diff checks pass. Browser checks verified desktop1440 and phone390 layouts, real artwork/project links, automatic rotation and pause/play, one active focusable card, no horizontal overflow, and zero console errors after the duplicate-key correction. The phone controls have44px minimum height and44px previous/next targets.

The implementation is in branch `local/project-inner-design-20261114`, worktree `/Users/isurutmv/Developer Office/reSystem/.runtime/project-inner-design-20261114`. Main files: `HeroVisual.tsx`, `HeroVisual.css`, `MoneyFlow.tsx` and `tests/hero-showcase.test.mjs`.

Local screenshots and contact sheets are retained under `/Users/isurutmv/Developer Office/reSystem/.runtime/hero-motion-review-20261114`. No media or screenshots were uploaded.

## Testing and release status

The production-built local preview is running at http://127.0.0.1:4321 for owner review. Changes remain uncommitted and unpublished. No GitHub push, Vercel promotion, FP action, financial switch or wallet transaction occurred. The task stays In progress pending visual acceptance and an authorized publication with real commit evidence.

Private record: https://app.notion.com/p/4183b21ac9258130b00ccdf6316b485d
