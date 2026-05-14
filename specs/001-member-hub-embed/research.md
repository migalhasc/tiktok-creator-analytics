# Research: Embedded TikTok Analytics In Member Hub

## Decision: Deliver the integration through an iframe with a dedicated embed mode

**Rationale**: The current TikTok Analytics app already owns its own router, tRPC client,
theme, and deployment surface. Keeping it inside an iframe preserves process, routing, and
state isolation from `member-hub-pro`, which directly supports the non-interference
requirement in the spec.

**Alternatives considered**:
- Port the analyzer UI into `member-hub-pro`: rejected because it expands scope into a
  cross-app rewrite, duplicates analytics UI logic, and risks host regressions through
  router and dependency coupling.
- Open the existing standalone app in a new tab: rejected because it breaks the core
  requirement that the user stays inside the platform.

## Decision: Preserve the current public access pattern inside the embed

**Rationale**: The current TikTok Analytics app is already a public analytics surface, and
the spec emphasizes in-platform usage without being pushed to another platform. Reusing the
existing public access pattern avoids introducing a new cross-app authentication dependency
in v1 and keeps the embedded flow low-friction.

**Alternatives considered**:
- Require a second login inside the embed: rejected because it adds product friction and a
  new integration dependency that is not implied by the current product shape.
- Gate the embed behind a new opaque handshake token: rejected for v1 because it increases
  implementation and rollout complexity without being required by the current spec.

## Decision: Keep the host-to-embed contract minimal and URL-based

**Rationale**: The only runtime contract needed for v1 is the material link targeting the
analytics origin with `?embed=1`. This preserves iframe isolation, avoids shared state or
router coupling, and reduces the chance that the embed can break host behavior.

**Alternatives considered**:
- Use `postMessage` to coordinate route or state changes: rejected for v1 because it adds
  complexity without being required for the user journeys in scope.
- Inject host JS into the embed: rejected because it weakens isolation and increases
  regression risk.

## Decision: Fail inline inside the member hub and never auto-open an external site

**Rationale**: The spec clarification explicitly requires inline failure handling with retry
and return options. This keeps the host usable even when the embedded app is unavailable
and preserves the single-platform experience.

**Alternatives considered**:
- Automatically redirect to the standalone analytics site: rejected because it violates the
  clarified fallback rule.
- Offer a manual external fallback in v1: rejected because the clarified requirement is to
  keep recovery inside the member hub.

## Decision: Implement host-theme parity in the analytics app by copying approved assets

**Rationale**: `member-hub-pro` uses custom typography and grayscale design tokens that do
not exist in `tiktokanalytics`. Copying the approved font assets and tokens into the
analytics repo is the most deterministic way to make embed mode visually match the host
without adding runtime coupling between repositories.

**Alternatives considered**:
- Import host CSS directly at runtime: rejected because it creates deployment coupling and
  makes the embedded app sensitive to unrelated host stylesheet changes.
- Only approximate the host theme with generic tokens: rejected because the requested
  experience is intended to feel like a native tool inside the host platform.

## Decision: Use explicit frame-ancestor policy rather than permissive defaults

**Rationale**: The analytics deployment is behind the local Node server and Traefik. The
safe contract is to explicitly allow `https://ifp.blankschool.com.br` as a frame ancestor
and to avoid `X-Frame-Options` values that would block the embed.

**Alternatives considered**:
- Rely on the current absence of frame headers: rejected because the policy would be
  implicit and fragile across deploy changes.
- Allow any origin to frame the app: rejected because it broadens exposure unnecessarily.

## Decision: Treat the host `app` material type as a schema change, not just a UI toggle

**Rationale**: The host repo stores `material.tipo` in a Supabase enum and in generated
TypeScript types. Adding the TikTok Analytics entry requires an explicit migration and
type regeneration/update path, not just a frontend union change.

**Alternatives considered**:
- Reuse an existing type such as `video` or `template`: rejected because it obscures
  semantics and complicates downstream rendering rules.
- Special-case a URL pattern without schema change: rejected because it hides product
  meaning and increases maintenance risk.
