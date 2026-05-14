# Tasks: Embedded TikTok Analytics In Member Hub

**Input**: Design documents from `/specs/001-member-hub-embed/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature changes host contracts, embed behavior, navigation, and framing
policy, so risk-based automated tests are required in both repositories.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared fixtures and helpers used across the two-repo implementation.

- [X] T001 Create host-side app material fixtures in `../member-hub-pro/src/test/material-app-fixtures.ts`
- [X] T002 [P] Create analytics embed-mode helper utilities in `src/lib/embed.ts`
- [X] T003 [P] Create analytics embed test helpers in `tests/unit/embed-test-helpers.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Complete the schema, typing, shell, and presentation prerequisites required by
all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add the `app` material enum migration in `../member-hub-pro/supabase/migrations/202605130001_add_app_material_type.sql`
- [X] T005 Update host material typings in `../member-hub-pro/src/integrations/supabase/types.ts` and `../member-hub-pro/src/contexts/DataContext.tsx`
- [X] T006 [P] Add analytics embed-mode shell plumbing in `src/main.tsx`, `src/app.tsx`, and `src/components/layout/app-shell.tsx`
- [X] T007 [P] Add member-hub font assets and embed theme tokens in `public/fonts/`, `src/index.css`, and `tailwind.config.ts`
- [X] T008 Create the TikTok Analytics material seed/update migration in `../member-hub-pro/supabase/migrations/202605130002_seed_tiktokanalytics_app.sql`

**Checkpoint**: The host can represent an embedded app entry, and TikTok Analytics can
differentiate standalone versus embed presentation modes.

---

## Phase 3: User Story 1 - Use The Analyzer Inside The Platform (Priority: P1) 🎯 MVP

**Goal**: Let a member open TikTok Analytics from the materials area and complete the
standard analysis flow without leaving the member hub.

**Independent Test**: From `/plataforma/materiais`, a tester can open the TikTok Analytics
entry, see it inside `/plataforma/ferramentas/:id`, and search for a profile without being
sent to another website or platform.

### Tests for User Story 1 ⚠️

- [X] T009 [P] [US1] Add host app-card navigation coverage in `../member-hub-pro/src/pages/plataforma/Materiais.app.test.tsx`
- [X] T010 [P] [US1] Add host embedded detail render coverage in `../member-hub-pro/src/pages/plataforma/MaterialDetail.app.test.tsx`
- [X] T011 [P] [US1] Add the analytics embed journey Playwright test in `tests/e2e/embed-mode.spec.ts`

### Implementation for User Story 1

- [X] T012 [US1] Update app material listing behavior in `../member-hub-pro/src/pages/plataforma/Materiais.tsx`
- [X] T013 [US1] Render the embedded TikTok Analytics iframe in `../member-hub-pro/src/pages/plataforma/MaterialDetail.tsx`
- [X] T014 [US1] Preserve the analytics home and profile journeys in embed mode in `src/pages/home-page.tsx` and `src/pages/profile-page.tsx`

**Checkpoint**: User Story 1 is complete when members can launch and use the analyzer fully
inside the platform.

---

## Phase 4: User Story 2 - Preserve Member Hub Stability (Priority: P1)

**Goal**: Keep the embedded analyzer isolated so it does not break host layout, navigation,
or existing materials behavior.

**Independent Test**: A tester can use the embedded analyzer, return to the materials list,
and verify that non-app materials and surrounding member-hub navigation still behave
normally.

### Tests for User Story 2 ⚠️

- [X] T015 [P] [US2] Add host isolation regression coverage in `../member-hub-pro/src/pages/plataforma/EmbeddedToolIsolation.test.tsx`
- [X] T016 [P] [US2] Add standalone-versus-embed cleanup coverage in `tests/unit/embed-mode.test.tsx`

### Implementation for User Story 2

- [X] T017 [US2] Scope embed-only theme and class cleanup in `src/main.tsx` and `src/index.css`
- [X] T018 [US2] Preserve host breadcrumb, sizing, and non-app behavior in `../member-hub-pro/src/pages/plataforma/MaterialDetail.tsx` and `../member-hub-pro/src/pages/plataforma/Materiais.tsx`
- [X] T019 [US2] Add `app` management to the host admin flow in `../member-hub-pro/src/pages/admin/AdminMateriais.tsx`

**Checkpoint**: User Stories 1 and 2 are complete when the embedded experience works and
the host remains stable for unrelated user flows.

---

## Phase 5: User Story 3 - Handle Embed Failures Safely (Priority: P2)

**Goal**: Fail safely inside the member hub when the embed cannot be displayed or framed.

**Independent Test**: If the embedded app is unavailable or blocked, the user sees an inline
error state with retry and return actions, and the rest of the member hub remains usable.

### Tests for User Story 3 ⚠️

- [X] T020 [P] [US3] Add host degraded-state coverage in `../member-hub-pro/src/pages/plataforma/MaterialDetail.failure.test.tsx`
- [X] T021 [P] [US3] Add framing-policy regression coverage in `tests/unit/embed-framing-policy.test.ts`

### Implementation for User Story 3

- [X] T022 [US3] Implement inline retry and return states in `../member-hub-pro/src/pages/plataforma/MaterialDetail.tsx`
- [X] T023 [US3] Enforce the approved framing policy in `server/prod.ts` and `ops/traefik/tiktokanalytics-web.yaml`
- [X] T024 [US3] Update degraded-flow rollout and recovery steps in `specs/001-member-hub-embed/quickstart.md`

**Checkpoint**: All user stories are complete when embed failures stay inside the host and
do not push users out to another site.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cross-repo validation, documentation alignment, and rollout readiness.

- [X] T025 [P] Refresh host contract notes in `specs/001-member-hub-embed/contracts/member-hub-material-app.md`
- [X] T026 [P] Refresh analytics embed contract notes in `specs/001-member-hub-embed/contracts/tiktokanalytics-embed-mode.md`
- [X] T027 Validate the full rollout and rollback checklist in `specs/001-member-hub-embed/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Starts after Foundational completion; delivers the MVP.
- **User Story 2 (Phase 4)**: Starts after User Story 1 because it hardens the same host
  and embed surfaces for isolation and regression safety.
- **User Story 3 (Phase 5)**: Starts after User Story 1 because it extends the same
  embedded detail surface with degraded-state behavior and framing guarantees.
- **Polish (Phase 6)**: Starts after all user stories are complete.

### User Story Dependencies

- **US1**: No dependency on other user stories; establishes the embedded tool path.
- **US2**: Depends on US1 surfaces existing; focuses on non-interference and host stability.
- **US3**: Depends on the embedded route from US1; can proceed independently of US2 once the
  iframe path exists, but is simplest after US2.

### Within Each User Story

- Tests before implementation tasks in that story.
- Host routing/rendering changes before analytics journey refinements.
- Failure handling after the success-path embed route exists.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T006 and T007 can run in parallel after T005.
- T009, T010, and T011 can run in parallel.
- T015 and T016 can run in parallel.
- T020 and T021 can run in parallel.
- T025 and T026 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch the user-story-specific tests together:
Task: "Add host app-card navigation coverage in ../member-hub-pro/src/pages/plataforma/Materiais.app.test.tsx"
Task: "Add host embedded detail render coverage in ../member-hub-pro/src/pages/plataforma/MaterialDetail.app.test.tsx"
Task: "Add the analytics embed journey Playwright test in tests/e2e/embed-mode.spec.ts"

# Then implement host and analytics changes:
Task: "Update app material listing behavior in ../member-hub-pro/src/pages/plataforma/Materiais.tsx"
Task: "Preserve the analytics home and profile journeys in src/pages/home-page.tsx and src/pages/profile-page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the in-platform launch and search flow
5. Demo the member journey before moving on

### Incremental Delivery

1. Finish setup and foundational tasks.
2. Deliver US1 to prove the embedded journey.
3. Deliver US2 to protect host stability and admin consistency.
4. Deliver US3 to harden degraded states and frame policy.
5. Finish cross-cutting rollout validation.

### Parallel Team Strategy

With multiple developers:

1. One developer handles host schema and material typing tasks.
2. One developer handles analytics embed-mode shell and theming tasks.
3. After Phase 2, split host rendering, analytics journey, and failure hardening across
   story phases while preserving file ownership.

---

## Notes

- Every task follows the Speckit checklist format with checkbox, ID, labels, and file path.
- `../member-hub-pro` is an intentional sibling-repo dependency for this feature.
- The MVP scope is **User Story 1**.
- The current public-access assumption for the embed remains in force until a later spec
  changes it.
