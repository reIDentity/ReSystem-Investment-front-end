# Platform review fixes — 31 October 2026

## Investor behavior

- Keep stable project metadata cached between visits and stop unnecessary periodic polling; account-specific data remains isolated and revalidated.
- Show project names in action reviews, safe error reasons and a request reference. An uncertain write directs the investor to Activity instead of suggesting a duplicate financial submission. USDT allowance approval and purchase remain separate actions.
- Support opens at the newest messages, offers older history and preserves idempotency keys across interrupted ticket/reply requests. Delayed responses cannot cross account or ticket boundaries.
- Render bounded 96px icons and 720px cards through the public artwork route. The backend verifies the approved original hash, uses fixed gateways, limits concurrency and caches successful variants. The proxy forwards no session cookies or credentials. Frozen NFT originals remain unchanged; external MetaMask/explorer media delivery remains an operator dependency.
- Populate the existing chart area with twelve months of verified cumulative purchase cost and claimed rewards, with an accessible monthly table. Preserve separate asset accounting and label the fixed conversion. This is not market value, investment profit or a forecast; incomplete history remains unavailable.
- Label ERC-1155 issuance as shares received from a purchase. Existing layouts, reduced-motion behavior, financial confirmation and wallet-approval boundaries remain intact.
- Expose safe BFF/API duration timing without identity or wallet payload telemetry.

## Validation

172 frontend tests, lint, TypeScript and production build passed before the final development dependency patch; CI and the release manifest record the final exact commit. Tests cover support retry isolation, bounded image responses, canonical history validation, transaction recovery and rendering. Static production-component previews were checked at desktop and 390 × 844 phone widths; the history chart was corrected to preserve the existing area and avoid overflow. These previews are not a claim of live authenticated acceptance.

The updated API schema and generated types match the backend public contract. Publish this investor version after the compatible backend is live. No financial actions, contract deployments, credential changes or database migrations are included.

## Development dependency maintenance

The modern TypeScript ESLint minimatch dependency is pinned to patched 11.0.3. Legacy plugins still use the callable v3 API. The owner approved a development-only exception for minimatch 3.1.5 / GHSA-g3hv-75wg-m249 through 14 November 2026. CI additionally checks its exact source hash and absence of the affected optimization routine; production findings remain forbidden. npm peer cycles are traversed once without dropping reachable advisory leaves; advisory-free cycles and malformed graphs fail closed.

## Remaining independent work

Live release evidence belongs in the release manifest. Population latency percentiles, independent security/client acceptance, a versioned normalized activity read model, external NFT gateways and owner-deferred off-host backups remain separately tracked. This release does not claim those are complete.
