# Implementation Plan: Embedded TikTok Analytics In Member Hub

**Branch**: `001-member-hub-embed` | **Date**: 2026-05-13 | **Spec**: [specs/001-member-hub-embed/spec.md](specs/001-member-hub-embed/spec.md)  
**Input**: Feature specification from `/specs/001-member-hub-embed/spec.md`

**Note**: This plan covers coordinated work in this repository and in the sibling
`../member-hub-pro` repository because the feature spans an embedded app and its host
platform.

## Summary

Embed TikTok Analytics inside the `member-hub-pro` materials flow by treating it as a
first-class in-platform tool rather than a separate destination. The host application will
add an `app` material type, render the analyzer inside the existing
`/plataforma/ferramentas/:id` route, and keep failure handling inline. TikTok Analytics
will add a dedicated `embed=1` mode that removes duplicate chrome, adopts the approved
host theme, preserves internal navigation inside the iframe, and keeps standalone mode
working. Planning assumption: eligible member-hub users will use the current public
analytics surface inside the embed without a second login prompt.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Node.js runtime via `tsx`  
**Primary Dependencies**: React Router v6, TanStack Query, tRPC v11, Tailwind CSS,
`next-themes`, Supabase, Bright Data  
**Storage**: Supabase for TikTok Analytics data and a separate Supabase project in
`member-hub-pro` for materials metadata  
**Testing**: Vitest + Playwright in `tiktokanalytics`; Vitest in `member-hub-pro`  
**Target Platform**: Browser-based SPA embedded in `member-hub-pro` plus standalone web
access on the VPS/Traefik deployment  
**Project Type**: Web application with coordinated external host integration  
**Performance Goals**: Preserve SPA navigation in the host, avoid full-page redirects for
the primary journey, and surface inline fallback states instead of breaking the host page  
**Constraints**: Must not interfere with member-hub routing or layout; must not
auto-open an external site on failure; must preserve standalone analytics mode; requires
two-repo rollout; requires host enum migration and embed frame policy validation  
**Scale/Scope**: One new embedded tool flow spanning two repositories, one new host
material type, one embed presentation mode, and regression coverage for host materials and
analytics home/profile journeys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Contract surface changes are identified and the compatibility or migration plan is
      recorded for all affected consumers.
      Contracts affected: host `Material.tipo`, host route behavior for
      `/plataforma/ferramentas/:id`, generated Supabase enum types, the TikTok Analytics
      `embed=1` presentation contract, and the framing policy exposed by the analytics
      deployment.
- [x] Risk-based test coverage is defined for every changed calculation, ingestion path,
      cache rule, provider error path, navigation flow, or embed behavior.
      Coverage will focus on host material navigation/rendering, inline failure behavior,
      analytics embed rendering, and non-regression of the existing analytics search and
      profile flows.
- [x] Provider and infrastructure impact is documented, including external services, schema
      changes, headers or CSP changes, deploy order, and rollback path.
      Impact includes a `member-hub-pro` Supabase enum migration, data seed/update for the
      new material entry, analytics server and Traefik framing policy checks, and a staged
      rollout that deploys the analytics embed mode before exposing the host material.
- [x] Standalone and embed compatibility is assessed whenever the feature can be hosted
      inside another surface or container.
      Standalone mode remains the baseline public experience; embed mode suppresses
      duplicate chrome and applies host-specific theming without changing the standalone
      route structure.

## Project Structure

### Documentation (this feature)

```text
specs/001-member-hub-embed/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── member-hub-material-app.md
│   └── tiktokanalytics-embed-mode.md
└── tasks.md
```

### Source Code (repository root)

```text
tiktokanalytics/
├── src/
│   ├── app.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/layout/
│   └── pages/
├── server/prod.ts
├── ops/traefik/tiktokanalytics-web.yaml
├── tests/
│   ├── unit/
│   └── e2e/
└── specs/001-member-hub-embed/

../member-hub-pro/
├── src/contexts/DataContext.tsx
├── src/pages/plataforma/
│   ├── Materiais.tsx
│   └── MaterialDetail.tsx
├── src/pages/admin/AdminMateriais.tsx
├── src/integrations/supabase/types.ts
├── src/test/
└── supabase/migrations/
```

**Structure Decision**: Keep the Speckit artifacts in this repository because TikTok
Analytics owns the embed mode contract, but plan and implement the host integration as a
coordinated sibling-repo change in `../member-hub-pro`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Coordinated two-repo rollout | The host UI and the embedded app deploy independently and both must change to deliver the feature safely | A single-repo or host-only change would either leave the embed contract missing or force users out to a separate site, which violates the spec |
