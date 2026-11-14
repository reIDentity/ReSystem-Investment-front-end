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

## Follow-up — supplied ZIP choreography supersedes the step carousel

The owner supplied `invest-showcase.zip` and identified the earlier animation as incorrect. Its SHA-256 is `32d62eb8a03b45974617b317170feccf9dc8a76bfacfe9d92d3f12c392182e0d`. The archive's source and SVG artwork were inspected as reference data; its package installation instructions and simulated purchase confirmation do not authorize application or financial actions.

The local `fix/showcase-reference-motion` correction follows the reference's 1920×1080 desktop and 1080×1920 portrait stages, exact card keyframes, blue tint/depth/velocity tilt, three cursor-led continuous drags, lift/wobble, spring popup, cursor press/ripple/sparks, and bounded decorative confetti. A pure deterministic motion model preserves its 300ms initial delay and 15,270ms repeating cycle. The cursor targets the actual live-content popup button after its opening animation. A delayed visible frame advances by its real elapsed time; it does not stretch the reference timing.

Published project data and native detail links remain authoritative. The ZIP's hardcoded project list, auto-click and “You're in” success claim were not copied as real behavior. The embedded walkthrough is labelled as an illustration, describes quote/reID/chain approval and never submits anything. Global body styling, archive dependencies, external assets and viewport-blocking overlays were not imported. Only the component is styled. Pause/play, keyboard/touch navigation, reduced motion, hidden/offscreen pause and stable project identity are retained. Pointer capture stays on the original touch target so a stationary tap can reach its native link.

All279 tests pass, including22 actual client/RAF interaction cases and9 pure timing/geometry cases. Repository lint, production build/TypeScript and diff checks pass. Independent reviews covered effect cleanup, bounded particles, mode/CTA reset, live-data removal, safe navigation and delayed frames. Browser checks verified desktop/390px portrait layout, cursor-led motion and the project popup, no horizontal overflow or new console errors, and native navigation to the matching public project. Device-sized browser checks and synthetic touch regressions are distinct from a physical-phone gesture test.

Screenshots are local under `/Users/isurutmv/Developer Office/reSystem/.runtime/showcase-reference-review-20261114`: `desktop.jpg` and `phone.jpg`. The production-mode preview is available at http://127.0.0.1:4321/#project-showcase and remains running for owner review. No screenshots or archive assets were uploaded. This correction is uncommitted/unpublished; earlier PR21 does not contain it. No production deployment, FP change or blockchain action occurred.
