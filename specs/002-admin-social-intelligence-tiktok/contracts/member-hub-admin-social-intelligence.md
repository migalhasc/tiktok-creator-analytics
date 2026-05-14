# Contract: Member Hub Admin Social Intelligence Host

## Purpose

Define the host-side contract for exposing TikTok Analytics only inside the protected
admin Social Intelligence route.

## Routing Contract

- The host route is `/admin/social-intelligence`.
- Query parameter `tab` supports:
  - `instagram`
  - `tiktok`
- Absence of `tab` resolves to the `instagram` view.
- Switching to TikTok keeps the browser inside the same SPA route and must not redirect
  the top-level window to another site.

## Rendering Contract

- The page renders two admin tabs:
  - `Instagram`
  - `TikTok Analytics`
- The Instagram tab preserves the previous intelligence implementation.
- The TikTok tab renders an iframe whose `src` is
  `https://tiktokanalytics.ickanz.easypanel.host?embed=1`.
- The TikTok panel owns its own loading and degraded states inside the admin layout.

## Failure Contract

- If the iframe does not become ready within the host timeout window, the page shows an
  inline degraded state.
- The degraded state exposes a retry action and stays inside `/admin/social-intelligence`.
- The host never auto-opens the standalone TikTok site during the failure path.

## Public Exposure Contract

- `/plataforma/materiais` no longer renders TikTok Analytics as a public material card.
- `/plataforma/ferramentas/:id` continues serving supported non-app inline materials.
- The cleanup migration deletes the seeded `TikTok Analytics` record from
  `public.materiais`.
- The `app` enum value remains present in `public.tipo_material` for compatibility.
