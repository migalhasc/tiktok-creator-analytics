<!--
Sync Impact Report
Version change: none -> 1.0.0
Modified principles:
- Added I. Public Analytics With Clear Outcomes
- Added II. Stable Contracts Across Surfaces
- Added III. Risk-Based Test Coverage
- Added IV. Provider Resilience And Diagnostics
- Added V. Embed-Ready UX Consistency
Added sections:
- Operational Constraints
- Delivery Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ updated .specify/templates/plan-template.md
- ✅ updated .specify/templates/spec-template.md
- ✅ updated .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->
# TikTok Analytics Constitution

## Core Principles

### I. Public Analytics With Clear Outcomes
TikTok Analytics MUST stay focused on clear analysis of public TikTok profile
performance. New capabilities MAY be added only when they improve user understanding,
diagnostic quality, or decision-making. Features that add operational noise, duplicate
existing insight, or expand scope without improving analytic outcomes MUST be rejected.

### II. Stable Contracts Across Surfaces
Routes, query parameters, tRPC procedures, shared types, payload shapes, and embed
surfaces MUST be treated as public contracts. Any breaking change MUST include an
explicit compatibility plan, migration path, rollout order, and coordination notes for
all dependent consumers, including external hosts such as member platforms or embedded
surfaces.

### III. Risk-Based Test Coverage
Changes to calculations, ingestion logic, cache behavior, provider error handling,
navigation, embed behavior, and other critical user flows MUST include automated tests
at the appropriate layer. Purely cosmetic changes MAY skip automated tests only when a
manual validation path is documented in the feature plan or delivery notes. Teams MUST
choose test scope based on regression risk rather than defaulting to either zero tests
or universal TDD.

### IV. Provider Resilience And Diagnostics
Integrations with Bright Data, Supabase, and any external host or infrastructure layer
MUST fail predictably and surface safe, actionable diagnostics. Provider-facing code
MUST preserve throttling, caching, and error translation guarantees, and operational
changes MUST document the expected degradation mode, observability signal, and recovery
path before release.

### V. Embed-Ready UX Consistency
When a feature requires embedded delivery, the application MUST support both standalone
and embed modes without duplicating chrome or breaking internal navigation. Embed mode
MUST inherit an approved host theme, remove conflicting app shell elements, and preserve
the integrity of the host container while keeping the embedded experience functionally
equivalent for supported journeys.

## Operational Constraints

The official application stack MUST remain React, TypeScript, and Vite on the frontend;
Node.js and tRPC on the server boundary; `shared/` as the source of truth for cross-layer
contracts; Supabase for persistence; and Bright Data for TikTok data collection unless an
amendment explicitly changes that baseline. Features that span multiple repositories or
runtime environments MUST enumerate required schema migrations, CSP or framing headers,
shared assets, deploy order, and rollback steps before implementation starts.

## Delivery Workflow

Non-trivial work MUST follow the Speckit flow from specification through planning and
task generation before implementation. Every implementation plan MUST include a
Constitution Check that verifies contract stability, risk-based test coverage,
provider or infrastructure impact, and standalone versus embed compatibility when
relevant. Deviations from these rules MUST be documented explicitly in the plan with a
clear rationale and the simpler rejected alternative.

## Governance

This constitution is the normative source for delivery decisions in TikTok Analytics and
supersedes conflicting local habits or undocumented conventions. Amendments MUST include
the proposed rationale, the set of affected principles or sections, and updates to any
dependent templates or workflow guidance before adoption. Versioning follows semantic
rules: MAJOR for incompatible principle redefinitions or removals, MINOR for new
principles or materially expanded governance, and PATCH for clarifications that do not
change expected behavior. Compliance review MUST occur during plan review and again
before implementation is considered complete.

**Version**: 1.0.0 | **Ratified**: 2026-05-13 | **Last Amended**: 2026-05-13
