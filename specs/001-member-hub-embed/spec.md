# Feature Specification: Embedded TikTok Analytics In Member Hub

**Feature Branch**: `001-member-hub-embed`  
**Created**: 2026-05-13  
**Status**: Draft  
**Input**: User description: "$speckit.specify o analisador do tik tok não deve interferir e quebrar o codigo do member hub, é para ficar lá para usuario usar sem precisar abrir outro site/plataforma"

## Clarifications

### Session 2026-05-13

- Q: What should happen when the embed cannot load? → A: Show an inline error inside the member hub, with retry and return options, and never open another site.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use The Analyzer Inside The Platform (Priority: P1)

As a member using the platform, I want to open TikTok Analytics from the materials area
and use it without leaving the member hub, so I can analyze a profile inside the same
product experience.

**Why this priority**: This is the core user value. If users are still pushed to another
site or a broken experience, the feature fails its main purpose.

**Independent Test**: From the materials area, a user can open the analyzer and complete a
basic profile search without being redirected to another website or platform.

**Acceptance Scenarios**:

1. **Given** a user is browsing the materials area, **When** they open TikTok Analytics,
   **Then** the analyzer appears inside the platform instead of sending them to a separate
   site.
2. **Given** the analyzer is open inside the platform, **When** the user searches for a
   TikTok profile, **Then** the analysis workflow stays inside the same platform
   experience.

---

### User Story 2 - Preserve Member Hub Stability (Priority: P1)

As a platform owner, I want the embedded analyzer to stay isolated from the member hub,
so the tool does not break navigation, layout, or existing member hub behavior.

**Why this priority**: The embed must not damage the host product. A working analyzer that
causes regressions in the member hub is not acceptable.

**Independent Test**: A tester can open the analyzer, interact with it, return to the
materials area, and verify the surrounding member hub experience still behaves normally.

**Acceptance Scenarios**:

1. **Given** the user opens TikTok Analytics inside the platform, **When** they navigate
   back to the materials area, **Then** the member hub navigation and surrounding page
   remain intact.
2. **Given** the analyzer is being used inside the platform, **When** the user interacts
   with its internal screens, **Then** the host platform does not lose layout integrity,
   route stability, or normal controls.

---

### User Story 3 - Handle Embed Failures Safely (Priority: P2)

As a platform operator, I want failures in the analyzer experience to fail safely, so the
member hub remains usable even if the embedded tool is unavailable or restricted.

**Why this priority**: Safe degradation protects the main platform and reduces support
impact when the embedded tool or hosting environment has issues.

**Independent Test**: If the analyzer cannot be shown, the materials detail view still
communicates the problem clearly and the user can return to the rest of the platform.

**Acceptance Scenarios**:

1. **Given** the embedded analyzer cannot load, **When** the user opens the tool,
   **Then** they see a clear inline failure state inside the member hub and can continue
   using the member hub without being sent to another site.
2. **Given** an embedding restriction or service outage occurs, **When** the platform
   attempts to show the tool, **Then** the failure does not block access to other
   materials or platform navigation.

---

### Edge Cases

- What happens when the analyzer service is temporarily unavailable while the member hub is
  still functioning normally?
- How does the system behave when the embedded experience tries to move the user outside
  the current platform flow?
- What happens when the user opens the analyzer on a smaller viewport where the host and
  embedded experience must coexist?
- How does the experience recover when the user leaves the tool and then returns to the
  materials area?
- What happens when the embedded tool loads but part of its content is blocked by browser
  or hosting restrictions?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST make TikTok Analytics available from the member hub materials
  experience as an in-platform tool.
- **FR-002**: The system MUST allow a user to start and complete the standard TikTok
  profile analysis flow without requiring them to open another website or platform.
- **FR-003**: The embedded tool MUST preserve the member hub's existing navigation and let
  the user return to the materials area without losing the surrounding platform context.
- **FR-004**: The system MUST isolate the embedded analyzer experience so that it does not
  break or alter unrelated member hub behavior.
- **FR-005**: The system MUST keep existing materials and non-analyzer platform flows
  working as they do today.
- **FR-006**: The system MUST support the analyzer's internal user journey inside the host
  experience without unexpectedly ejecting the user into a separate platform flow.
- **FR-007**: The system MUST provide a safe fallback experience when the embedded analyzer
  cannot be displayed or used, and that fallback MUST remain inside the member hub with a
  retry path and a return path.
- **FR-008**: The release plan MUST define how host and analyzer changes are coordinated so
  users do not encounter a partially rolled out integration.
- **FR-009**: Any change that affects how the host platform opens or contains the analyzer
  MUST preserve backward compatibility for existing member hub users during rollout.

### Key Entities *(include if feature involves data)*

- **Embedded Tool Entry**: The member-facing listing that exposes TikTok Analytics from the
  materials area and communicates what the tool is for.
- **Embedded Analytics Session**: The in-platform usage session where a member launches,
  uses, and exits the analyzer while staying inside the member hub experience.
- **Host Integration State**: The visible state that determines whether the embedded tool
  is available, unavailable, or safely degraded inside the member hub.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of validated users can open TikTok Analytics
  from the materials area and start a profile analysis without being sent to another site
  or platform.
- **SC-002**: In acceptance testing, users can return from the analyzer to the materials
  area in one step while keeping the member hub responsive and usable.
- **SC-003**: Regression validation confirms that existing materials navigation and at
  least one non-analyzer member hub flow continue working after the integration is added.
- **SC-004**: In failure testing, users always receive a clear recovery path when the
  embedded analyzer is unavailable, no external site is opened automatically, and the
  rest of the member hub remains usable.

## Assumptions

- The member hub remains the primary user-facing surface for this feature, and users are
  expected to launch the analyzer from within that platform.
- The existing TikTok Analytics capability remains available as a standalone product
  surface, but the normal member workflow for this feature happens inside the member hub.
- The same organizations controlling the two codebases can coordinate release order and
  validation across both systems.
- Users who can access the materials area are allowed to use the embedded analyzer without
  needing to discover or open a separate platform entry point.
