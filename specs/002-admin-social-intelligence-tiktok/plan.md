# Implementation Plan: Admin Social Intelligence TikTok Embed

**Branch**: `002-admin-social-intelligence-tiktok` | **Date**: 2026-05-14 | **Spec**: [specs/002-admin-social-intelligence-tiktok/spec.md](specs/002-admin-social-intelligence-tiktok/spec.md)  
**Input**: Feature specification from `/specs/002-admin-social-intelligence-tiktok/spec.md`

**Note**: This plan coordinates work in this repository and in the sibling
`../member-hub-pro` repository because the admin host and the embedded app remain separate
deployments.

## Summary

Refactor the existing public TikTok Analytics embed so it lives only inside
`member-hub-pro`'s admin route `/admin/social-intelligence`. The host keeps Instagram as
the default intelligence surface, adds `TikTok Analytics` as a secondary tab backed by
the existing `embed=1` iframe contract, removes the public exposure from
`/plataforma/materiais`, and cleans up the seeded `public.materiais` record after the
admin UI ships. TikTok Analytics keeps its standalone public experience and existing
embed-mode runtime unchanged.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Node.js runtime via `tsx`  
**Primary Dependencies**: React Router v6, Vitest, Tailwind CSS, TanStack Query, tRPC,
Supabase  
**Storage**: Supabase in `member-hub-pro` for host metadata and Supabase in
`tiktokanalytics` for analytics data  
**Testing**: Vitest in `member-hub-pro`; existing unit and e2e coverage remains in
`tiktokanalytics` for embed-mode contracts  
**Target Platform**: Browser-based SPA admin surface plus public standalone analytics site  
**Project Type**: Web application with coordinated sibling-repo host integration  
**Performance Goals**: Preserve SPA admin navigation, keep Instagram intelligence stable,
and keep TikTok loading and degraded states inside the admin shell  
**Constraints**: Must not re-expose TikTok in public materials; must keep standalone
analytics public; must not remove the `app` enum from the host database; must deploy host
UI before cleanup migration; must preserve current `embed=1` framing contract  
**Scale/Scope**: One admin route refactor, one public-surface cleanup, one host cleanup
migration, one successor documentation set

## Constitution Check

*GATE: Must pass before implementation and re-check before release.*

- [x] Contract surface changes are identified and the compatibility or migration plan is
      recorded for affected consumers.
      Contracts affected: host route `/admin/social-intelligence`, host query parameter
      `tab`, public material exposure rules, and the existing `embed=1` contract.
- [x] Risk-based test coverage is defined for changed navigation, embed behavior, and
      public exposure rules.
      Coverage focuses on default admin tab behavior, TikTok tab rendering, degraded
      admin fallback, and public material non-regression.
- [x] Provider and infrastructure impact is documented, including schema changes,
      rollout order, diagnostics, and recovery path.
      Impact includes one host cleanup migration, a two-step deploy order, and validation
      of the existing framing policy if the admin iframe degrades unexpectedly.
- [x] Standalone and embed compatibility is assessed whenever the feature can be hosted
      inside another surface.
      Standalone TikTok Analytics remains public; embed mode continues serving the admin
      iframe without changing the runtime contract.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-social-intelligence-tiktok/
├── plan.md
├── quickstart.md
├── spec.md
├── tasks.md
└── contracts/
    ├── member-hub-admin-social-intelligence.md
    └── tiktokanalytics-embed-mode.md
```

### Source Code (repository root)

```text
tiktokanalytics/
├── AGENTS.md
└── specs/002-admin-social-intelligence-tiktok/

../member-hub-pro/
├── src/components/admin/social-intelligence/
├── src/pages/admin/AdminSocialIntelligence.tsx
├── src/pages/admin/AdminMateriais.tsx
├── src/pages/plataforma/
│   ├── Materiais.tsx
│   └── MaterialDetail.tsx
├── src/integrations/supabase/types.ts
└── supabase/migrations/
```

**Structure Decision**: Keep the successor Speckit artifacts in `tiktokanalytics` because
this repository owns the embed contract, while implementing host UI and cleanup changes in
the sibling `../member-hub-pro` repository.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Coordinated two-repo rollout | The host UI, cleanup migration, and embedded app deploy independently | A one-repo-only change would either leave the public member exposure active or skip the admin integration entirely |
