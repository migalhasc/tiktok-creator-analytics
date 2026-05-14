# Contract: Member Hub Material App Entry

## Purpose

Define the host-side contract required for `member-hub-pro` to treat TikTok Analytics as
an in-platform tool rather than as an external link destination.

## Contract Surface

### Data contract

- `material.tipo` includes the enum value `app`.
- A TikTok Analytics material record uses:
  - `titulo`: member-facing product label
  - `descricao`: short purpose statement
  - `categoria`: host grouping label
  - `tipo`: `app`
  - `link`: approved analytics URL with `embed=1`

### Routing contract

- Clicking an `app` material navigates to `/plataforma/ferramentas/:id`.
- The host route transition remains SPA-based.
- The host does not open a new tab or redirect the browser to another site for the primary
  success path.
- Existing non-`app` materials keep their current behavior:
  - inline markdown materials continue using the same detail route
  - external materials still open with `window.open`

### Rendering contract

- `MaterialDetail` renders the linked tool inside an iframe when `material.tipo = app`.
- The host preserves its own breadcrumb/back action to the materials list.
- The host does not render markdown content for `app` materials.
- The embedded iframe uses the material `link` as source, keeps a full-width layout, and
  targets a viewport-height presentation (`calc(100vh - 8rem)`).
- If an `app` material still has legacy `conteudo`, that markdown is ignored in favor of
  the iframe contract.

### Failure contract

- If the embed cannot be rendered, the host shows an inline error state.
- The host fallback remains inside the member hub and exposes retry and return actions.
- The host never auto-opens the standalone analytics site during the failure path.
- The current host implementation treats the embed as degraded if it has not finished
  loading within the host timeout window and then swaps to retry/return actions inline.

## Non-Interference Rules

- The embedded tool must not alter unrelated host routes.
- The embedded tool must not break materials navigation or unrelated member hub flows.
- Existing non-`app` material behaviors remain unchanged.
