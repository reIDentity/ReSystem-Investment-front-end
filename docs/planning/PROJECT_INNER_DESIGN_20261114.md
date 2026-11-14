# Project inner-page design — local implementation and verification

## Scope and implementation

14 November 2026 — Applied the owner-supplied infra-global.html design to public and authenticated project inner pages in the investor frontend. This is the explicit exception for these pages only; the landing page and other investor screens are unchanged.

Local branch: `local/project-inner-design-20261114`, based on published stable `ba898a0da2a44a171d0987cabe9718f9b1bf9775`. Worktree: `/Users/isurutmv/Developer Office/reSystem/.runtime/project-inner-design-20261114`. The earlier working tree and its uncommitted work were preserved.

The layout includes the framed public header, blue project hero, connected money-flow diagram, pricing cards, features, grouped allocation blocks and phase cards, revenue/earnings panels, contract actions, and light/dark investment panel. Scoped CSS Modules prevent these styles affecting other pages. The existing Tailwind Turbopack rule now excludes CSS Modules so native module exports remain intact.

## Data and action integrity

- Real public project media, prices, current sale availability, phase allocation and eligibility drive the page. No prototype access switches or hardcoded example amounts were copied.
- Reserved inventory remains unissued/locked; hidden or paginated phases retain aggregate totals without invented sold counts or prices. Legacy projects retain their real single-sale allocation.
- The existing authenticated quantity, balances, exact quote, limited allowance, transaction review, transfer and resale handlers are retained. Public contribution links retain the target project through sign-in.
- Revenue uses verified canonical series when available, with 14 exact daily records and an accessible table. Missing series show an honest empty state, without the illustrative rising curve.
- Reduced-motion preferences are supported. The block grid is proportional, not a map of individually reserved token IDs.

## Verification

- 248 tests pass, including legacy/phased/expanded/huge and uneven allocation, access locks, anonymous privacy, exact pricing, unavailable/stale resources and real revenue records.
- Repository ESLint passes without warnings. Next.js production build and its TypeScript step pass. Git diff whitespace checks pass.
- Browser checks covered desktop (1280 and 1440), phones (390 and 320), real anonymous legacy and phased projects, loaded artwork, exactly 100 grouped allocation tiles, no horizontal overflow, functioning revenue-record disclosure and zero console errors on the production project page.
- Public contribution navigation retained the correct next-project URL. A completed local reID login and new chain transaction were deliberately outside this presentation-only test; existing checkout regression tests passed.
- Preview screenshots are local at `/Users/isurutmv/Developer Office/reSystem/.runtime/project-inner-design-review-20261114`: desktop-preview.png, desktop-full.png, mobile-preview.png and mobile-full.png. Images were not uploaded.

## Publication status

Implementation is local and uncommitted. No source push, Vercel promotion, FP restart, financial gate change or wallet transaction was performed. Review and publication remain pending; the task stays In progress until real published evidence is attached. This change does not complete the separate six-product blockchain replacement plan.

Private record: https://app.notion.com/p/4183b21ac925817f91afe5b20cf0bcbc


## Follow-up — clickable landing project cards

The owner explicitly requested whole-card navigation. Each ProductCard is now one native anchor with its existing public project URL and project-specific accessible label. The footer CTA is a styled span, avoiding nested links. Appearance, data, tooltips, artwork and route resolution are preserved. Keyboard focus has a visible outline.

All25 focused catalogue/SEO tests, targeted ESLint, production build/TypeScript and diff checks pass. Browser checks verified image clicks and Enter-key navigation to the same inner page, six native cards with no nested controls, and visible keyboard focus. Screenshot: `.runtime/project-inner-design-review-20261114/clickable-cards.png` in the workspace root.

The local production preview is running at http://127.0.0.1:4321/#where for owner testing. This change remains local and unpublished.

## Follow-up — match the landing-page blue

The owner requested the new inner-page design use the landing page's blue theme. The three scoped project CSS modules now share `var(--color-brand, #0091ff)` for primary buttons, links and highlights, with blue hero/diagram gradients and pale blue surfaces. Purple/indigo accents were removed. Whitelist inventory uses distinct teal; reserved/future gray and issued amber still explain allocation categories. Existing approved white button labels are preserved. No geometry, data calculations, access conditions or transaction handlers changed.

All 29 focused allocation/share/overview tests, targeted ESLint, production build/TypeScript and whitespace checks pass. An independent read-only review found no remaining purple/indigo or functional change in the affected presentation files. Browser checks at 1440 and 390 pixels confirm primary buttons compute to `rgb(0, 145, 255)`, no horizontal overflow, 100 real allocation tiles and no console errors. Screenshots: `blue-theme-desktop.jpg` and `blue-theme-mobile.jpg` in the existing workspace review directory. Local preview remains on port 4321; no push or deployment occurred.
