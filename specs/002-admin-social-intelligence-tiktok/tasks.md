# Tasks: Admin Social Intelligence TikTok Embed

**Input**: Design documents from `/specs/002-admin-social-intelligence-tiktok/`  
**Prerequisites**: plan.md, spec.md, contracts/, quickstart.md

**Tests**: This refactor changes host routing, admin embed behavior, and public exposure,
so risk-based automated tests are required in `../member-hub-pro`.

**Organization**: Tasks are grouped by outcome so the admin route, public cleanup, and
documentation can be tracked independently.

## Format: `[ID] [P?] [Area] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Area]**: Which delivery area the task belongs to
- Include exact file paths in descriptions

## Phase 1: Admin Route Refactor

- [X] T001 [Admin] Extract the existing Instagram intelligence implementation into `../member-hub-pro/src/components/admin/social-intelligence/AdminInstagramIntelligencePanel.tsx`
- [X] T002 [Admin] Refactor `../member-hub-pro/src/pages/admin/AdminSocialIntelligence.tsx` into a tab shell for `instagram` and `tiktok`
- [X] T003 [Admin] Add the TikTok iframe panel with inline loading and degraded states in `../member-hub-pro/src/components/admin/social-intelligence/AdminTikTokAnalyticsPanel.tsx`

## Phase 2: Public Surface Cleanup

- [X] T004 [Public] Remove public TikTok exposure from `../member-hub-pro/src/pages/plataforma/Materiais.tsx`
- [X] T005 [Public] Restore non-app-only detail behavior in `../member-hub-pro/src/pages/plataforma/MaterialDetail.tsx`
- [X] T006 [Public] Remove the `app` option from the admin materials form in `../member-hub-pro/src/pages/admin/AdminMateriais.tsx`
- [X] T007 [Public] Add the cleanup migration in `../member-hub-pro/supabase/migrations/202605140001_remove_tiktokanalytics_public_material.sql`

## Phase 3: Regression Coverage

- [X] T008 [P] [Tests] Add admin tab routing coverage in `../member-hub-pro/src/pages/admin/AdminSocialIntelligence.test.tsx`
- [X] T009 [P] [Tests] Add admin TikTok degraded-state coverage in `../member-hub-pro/src/components/admin/social-intelligence/AdminTikTokAnalyticsPanel.test.tsx`
- [X] T010 [P] [Tests] Add public materials non-exposure coverage in `../member-hub-pro/src/pages/plataforma/Materiais.public.test.tsx`
- [X] T011 [P] [Tests] Add admin materials option coverage in `../member-hub-pro/src/pages/admin/AdminMateriais.test.tsx`
- [X] T012 [Tests] Remove superseded public embed tests from `../member-hub-pro/src/pages/plataforma/`

## Phase 4: Speckit Successor Documentation

- [X] T013 [Docs] Create the successor spec in `specs/002-admin-social-intelligence-tiktok/spec.md`
- [X] T014 [Docs] Create the successor plan in `specs/002-admin-social-intelligence-tiktok/plan.md`
- [X] T015 [Docs] Create the rollout quickstart in `specs/002-admin-social-intelligence-tiktok/quickstart.md`
- [X] T016 [Docs] Refresh the host and embed contracts in `specs/002-admin-social-intelligence-tiktok/contracts/`
- [X] T017 [Docs] Point `AGENTS.md` to `specs/002-admin-social-intelligence-tiktok/plan.md`

## Validation

- [X] T018 [Validation] Run focused admin/public regression tests in `../member-hub-pro`
- [X] T019 [Validation] Run `npm run build` in `../member-hub-pro`
- [X] T020 [Validation] Keep `001-member-hub-embed` untouched as historical reference while the successor docs become the active plan source
