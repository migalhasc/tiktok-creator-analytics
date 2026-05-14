# Contract: TikTok Analytics Embed Mode For Admin Social Intelligence

## Purpose

Define the analytics-side behavior required when TikTok Analytics is embedded in the
member hub admin route.

## Input Contract

- Launch URL targets `https://tiktokanalytics.ickanz.easypanel.host`.
- Query string contains `embed=1`.
- The approved embedding host remains `https://ifp.blankschool.com.br`.

## Behavior Contract

- `embed=1` keeps the app in embed presentation mode.
- Embed mode removes duplicate chrome so the admin host remains the primary shell.
- Embed mode preserves the approved member-hub visual language inside the iframe.
- Supported internal analytics navigation remains inside the iframe and preserves
  `embed=1`.
- Standalone mode remains publicly available when `embed=1` is absent.

## Access Contract

- This refactor does not introduce a second login requirement inside the iframe.
- Admin-only host access is enforced by `member-hub-pro`, not by a new TikTok Analytics
  auth layer.

## Security And Recovery Contract

- The app remains frameable by `https://ifp.blankschool.com.br`.
- If framing is blocked or the app fails to finish loading, the host handles recovery
  inline through its degraded admin panel state.
- Any future change to `embed=1`, frame policy, or standalone/embed parity requires a new
  compatibility review because these are public cross-surface contracts.
