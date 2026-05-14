# Feature Specification: Admin Social Intelligence TikTok Embed

**Feature Branch**: `002-admin-social-intelligence-tiktok`  
**Created**: 2026-05-14  
**Status**: Implemented  
**Input**: User description: "Vamos precisar mudar a rota do que fizemos. Como está agora é publico para os usuarios, mas na verdade, vamos precisar deixar apenas para a rota admin."

## Clarifications

### Session 2026-05-14

- The host route is `/admin/social-intelligence`, not `/plataforma/materiais`.
- `Instagram` remains the default tab when no `tab` query parameter is present.
- `TikTok Analytics` is exposed as a secondary admin tab in the same route.
- The public `materiais` exposure is removed and the seeded public material is deleted.
- The standalone TikTok Analytics domain remains public and continues to use the existing `embed=1` contract when framed inside the admin host.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use TikTok Analytics Inside Admin Social Intelligence (Priority: P1)

As an admin, I want to open TikTok Analytics from the Social Intelligence area and use it
without leaving the admin panel, so I can analyze TikTok profiles alongside the existing
Instagram intelligence workflow.

**Why this priority**: This is the new primary entry point and the core product outcome
for the refactor.

**Independent Test**: An admin can open `/admin/social-intelligence`, switch to the
TikTok tab, and use the analyzer inside the same route.

**Acceptance Scenarios**:

1. **Given** an admin opens `/admin/social-intelligence`, **When** the page first loads,
   **Then** the Instagram intelligence view appears by default.
2. **Given** an admin is on `/admin/social-intelligence`, **When** they switch to the
   `TikTok Analytics` tab, **Then** the analyzer appears inside the admin page without
   redirecting to another site.
3. **Given** an admin opens `/admin/social-intelligence?tab=tiktok`, **When** the route
   resolves, **Then** the TikTok panel opens directly inside the admin shell.

---

### User Story 2 - Preserve Admin Stability And Existing Instagram Intelligence (Priority: P1)

As a platform owner, I want the new TikTok panel to coexist with the existing Instagram
intelligence experience, so the admin route gains functionality without regressing the
current analytics workflow.

**Why this priority**: The admin route already powers a live operational workflow. The
refactor is not acceptable if it breaks the current Instagram surface.

**Independent Test**: A tester can switch between the Instagram and TikTok tabs and
confirm the original Instagram experience still behaves as before.

**Acceptance Scenarios**:

1. **Given** the admin route loads, **When** the Instagram tab is active, **Then** the
   existing Instagram intelligence panel remains available with its current behavior.
2. **Given** the admin switches between tabs, **When** the TikTok iframe is mounted or
   retried, **Then** the surrounding admin layout, routing, and controls remain stable.
3. **Given** the TikTok iframe fails to load, **When** the admin stays on the TikTok tab,
   **Then** the route shows an inline retry path inside Social Intelligence rather than
   breaking the admin page.

---

### User Story 3 - Remove Public Exposure From Member Materials (Priority: P2)

As a platform operator, I want TikTok Analytics to stop appearing in the public member
materials flow, so only admins can access the integrated experience from the host
platform.

**Why this priority**: The feature changed audience and must no longer be visible to
non-admin members.

**Independent Test**: A non-admin member can browse `/plataforma/materiais` and no longer
find TikTok Analytics in the materials listing.

**Acceptance Scenarios**:

1. **Given** a member opens the materials page, **When** the materials list is rendered,
   **Then** TikTok Analytics is not shown as a public card.
2. **Given** the host deployment is updated, **When** cleanup runs in the host database,
   **Then** the public `materiais` record for TikTok Analytics is removed.
3. **Given** legacy host routes such as `/plataforma/ferramentas/:id` still exist,
   **When** they are used for normal inline materials, **Then** they continue to work for
   supported non-app content.

---

### Edge Cases

- What happens when an admin opens `/admin/social-intelligence` without a `tab` query?
- What happens when the TikTok iframe does not finish loading inside the admin page?
- How does the admin route behave when a user deep-links directly to `?tab=tiktok`?
- What happens to existing non-app materials after the public TikTok entry is removed?
- What happens if the public cleanup migration runs before the host UI deploy?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose TikTok Analytics from the admin-only route
  `/admin/social-intelligence` rather than from the public materials area.
- **FR-002**: The system MUST preserve the existing Instagram intelligence view as the
  default tab for `/admin/social-intelligence`.
- **FR-003**: The system MUST expose a `TikTok Analytics` tab in the same admin route and
  render the analyzer inside the host page with the approved `embed=1` URL.
- **FR-004**: The admin route MUST support `?tab=instagram|tiktok` as a stable routing
  contract, and the absence of `tab` MUST resolve to `instagram`.
- **FR-005**: The host MUST keep TikTok failures inside the admin route through an inline
  degraded state with a retry path.
- **FR-006**: The system MUST preserve the current Instagram intelligence workflow without
  regressing its behavior or removing its current capabilities.
- **FR-007**: The public member materials experience MUST stop exposing TikTok Analytics
  as a member-facing tool.
- **FR-008**: The host cleanup MUST remove the seeded `TikTok Analytics` record from
  `public.materiais` without removing the `app` enum value from `public.tipo_material`.
- **FR-009**: The standalone TikTok Analytics domain MUST remain publicly accessible and
  continue to support `embed=1` for approved host embeds.
- **FR-010**: The release plan MUST deploy the admin UI before the public cleanup
  migration so the host never points members at a half-transitioned experience.

### Key Entities *(include if feature involves data)*

- **Admin Social Intelligence Route**: The protected host route that now contains both
  Instagram and TikTok panels.
- **Admin TikTok Panel State**: The host-side state that tracks whether the embedded
  TikTok panel is loading, ready, or degraded.
- **Public Material Exposure**: The public `materiais` entry that previously exposed
  TikTok Analytics to members and must be removed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, admins can open `/admin/social-intelligence`,
  switch to TikTok Analytics, and keep the route inside the admin shell with no full-page
  redirect.
- **SC-002**: In acceptance testing, `/admin/social-intelligence` continues to open on
  the Instagram view by default after the refactor.
- **SC-003**: Regression validation confirms that `/plataforma/materiais` no longer shows
  TikTok Analytics while normal non-app material behaviors still work.
- **SC-004**: Failure validation confirms that a blocked or slow TikTok iframe always
  surfaces an inline retry state inside Social Intelligence and never opens another site
  automatically.

## Assumptions

- Existing admin auth in `member-hub-pro` already protects `/admin/social-intelligence`.
- The `embed=1` contract implemented in TikTok Analytics remains valid and does not need a
  new authentication layer for this refactor.
- The `app` enum value remains in the host database for compatibility even though the
  public member UI no longer exposes that type.
- `001-member-hub-embed` remains as historical documentation for the superseded public
  rollout path.
