# Data Model: Embedded TikTok Analytics In Member Hub

## Embedded Tool Entry

**Purpose**: Represents the host-side material record that exposes TikTok Analytics as an
in-platform tool.

**Fields**:
- `id`: Unique identifier for the material record.
- `titulo`: Member-facing tool name.
- `descricao`: Short description of the analytics capability.
- `categoria`: Host category used in materials grouping.
- `tipo`: Must be `app` for embedded tools.
- `link`: Approved analytics URL that includes `embed=1`.
- `data_adicionado`: Display ordering / freshness field already used by the host.
- `conteudo`: Optional host field that remains unused for `app` entries.

**Validation rules**:
- `tipo` must be a valid host enum value and include `app`.
- `link` must target the approved TikTok Analytics origin for this integration.
- `link` must resolve to embed mode rather than the standalone presentation mode.

**Relationships**:
- One `Embedded Tool Entry` launches one `Embedded Analytics Session`.

## Embedded Analytics Session

**Purpose**: Represents a user session where TikTok Analytics runs inside the host
container rather than as a separate destination.

**Fields**:
- `hostRoute`: The member-hub route used to display the tool.
- `embedMode`: Boolean presentation flag derived from the launch URL.
- `entryState`: `loading | ready | degraded`.
- `returnTarget`: The host route used by the inline back action.
- `searchJourney`: The standard analytics workflow initiated from the embedded home screen.

**Validation rules**:
- `embedMode` must preserve internal analytics navigation inside the iframe.
- `returnTarget` must always keep the user inside the member hub.
- `entryState = degraded` must expose retry and return actions inside the host.

**State transitions**:
- `loading -> ready` when the iframe and analytics shell load successfully.
- `loading -> degraded` when the iframe cannot be rendered or the embed is blocked.
- `ready -> degraded` when a runtime load failure prevents continued use.
- `ready -> closed` when the user returns to the host materials area.

## Host Integration State

**Purpose**: Describes whether the overall host integration is safe to expose to users.

**Fields**:
- `materialEnabled`: Whether the host is showing the app entry to users.
- `embedReachable`: Whether the analytics deployment is frameable by the approved host.
- `themeParity`: Whether the embedded UI is using the approved host presentation profile.
- `hostRegressionStatus`: Whether the validated host flows remain intact after integration.

**Validation rules**:
- The tool entry must not be exposed until `embedReachable` is true.
- The integration is considered releasable only when host regression checks pass.

**Relationships**:
- Governs rollout readiness for the `Embedded Tool Entry`.

## Embed Presentation Profile

**Purpose**: Captures the analytics-side presentation contract for standalone versus embed
mode.

**Fields**:
- `mode`: `standalone | embed`
- `showsAppShell`: Whether the analytics header/chrome is rendered.
- `themeVariant`: `analytics-default | member-hub`
- `framingPolicy`: Allowed embedding origins for the deployed surface.

**Validation rules**:
- `mode = embed` must hide duplicate analytics chrome.
- `mode = embed` must preserve functional parity for supported search and profile flows.
- `framingPolicy` must explicitly allow the approved host and must not block it with
  conflicting headers.
