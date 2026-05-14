# Contract: TikTok Analytics Embed Mode

## Purpose

Define the analytics-side behavior required when TikTok Analytics is rendered inside the
member hub.

## Input Contract

- Launch URL targets the approved TikTok Analytics origin.
- Query string contains `embed=1`.
- The embedding host is `https://ifp.blankschool.com.br`.

## Behavior Contract

- `embed=1` switches the app into embed presentation mode.
- The embed bootstrap applies the `embed-mode` class to both `html` and `body`.
- Embed mode removes duplicate analytics chrome that would conflict with the host shell.
- Embed mode applies the approved host theme profile, including typography and core visual
  tokens.
- Embed mode uses the member-hub font stack (`Airbnb Cereal` and `Libre Caslon Condensed`)
  and dark neutral token set inside the iframe.
- Internal navigation for supported analytics journeys remains inside the iframe.
- Internal route changes preserve `embed=1` so direct in-app transitions do not fall back
  to standalone presentation mid-session.
- Standalone mode remains available and unchanged when `embed=1` is absent.

## Access Contract

- Planning assumption for v1: the embed uses the current public analytics access pattern
  and does not introduce a second login prompt inside the host.

## Failure and Security Contract

- The app must be frameable by the approved host origin.
- The deployment must not emit conflicting `X-Frame-Options` behavior that blocks the
  approved host.
- Preferred policy is an explicit `Content-Security-Policy` `frame-ancestors` rule for the
  approved host.
- The current deployment contract sets the `frame-ancestors 'self'
  https://ifp.blankschool.com.br` policy in both the Node server response headers and the
  Traefik edge middleware.
- If the host cannot frame the app, the host-side fallback handles recovery inline.
