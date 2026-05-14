# Quickstart: Embedded TikTok Analytics In Member Hub

## 1. Prepare both repositories

1. In `tiktokanalytics`, check out `001-member-hub-embed`.
2. In `../member-hub-pro`, check out the matching feature branch for the host changes.
3. Confirm both projects have their normal environment files configured.

## 2. Implement the analytics-side embed mode

1. Add embed-mode detection to the TikTok Analytics app and apply `embed-mode` to `html`
   and `body`.
2. Keep standalone behavior intact when `embed=1` is absent.
3. Ensure embed mode removes duplicate chrome, applies the approved member-hub theme, and
   preserves the standard analytics search/profile flow.
4. Preserve `embed=1` on internal analytics route changes so the iframe never slips back
   into standalone mode mid-session.
5. Validate the deployed or local analytics surface can be framed by
   `https://ifp.blankschool.com.br`.

## 3. Implement the host-side material integration

1. Add `app` as a valid material type in `../member-hub-pro`.
2. Add the route behavior that renders the tool inside the existing
   `/plataforma/ferramentas/:id` flow.
3. Keep the back action inside the host and render a local inline failure state when the
   embed cannot be shown.
4. Update admin/create flows so the TikTok Analytics entry can be managed without type
   mismatches.
5. Keep legacy material behaviors intact:
   - inline markdown materials still use the detail route
   - external materials still open outside the host

## 4. Apply host data changes

1. Create and run the `member-hub-pro` migration that adds `app` to the material enum.
2. Refresh or regenerate host Supabase types if that repo requires it.
3. Insert or update the TikTok Analytics material entry with the embed URL.

## 5. Validate locally

1. Start TikTok Analytics and verify the standalone home and profile flows still work.
2. Start `member-hub-pro` and navigate to the materials area.
3. Open the TikTok Analytics tool and confirm:
   - the host route changes without a full-page reload
   - the analyzer appears inside the host
   - searching for a profile stays inside the embed
   - returning to the materials area keeps the host intact
4. Simulate embed failure and confirm the host shows inline retry/return actions without
   opening another site.
5. Run the automated checks used during implementation:
   - `tiktokanalytics`: `npm run test:unit`
   - `tiktokanalytics`: `npm run test:e2e -- embed-mode.spec.ts`
   - `tiktokanalytics`: `npm run build`
   - `member-hub-pro`: `npm test -- src/pages/plataforma/Materiais.app.test.tsx src/pages/plataforma/MaterialDetail.app.test.tsx src/pages/plataforma/EmbeddedToolIsolation.test.tsx src/pages/plataforma/MaterialDetail.failure.test.tsx`
   - `member-hub-pro`: `npm run build`

## 6. Validate rollout readiness

1. Deploy the analytics-side embed changes first.
2. Verify framing policy and embed-mode rendering in the deployed analytics app.
3. Deploy the host-side UI and migration changes only after the analytics deploy is ready.
4. Re-run the core host and embedded flow checks in the deployed environment.
5. Validate response headers after deploy:
   - `curl -I https://tiktokanalytics.ickanz.easypanel.host`
   - confirm `Content-Security-Policy` includes `frame-ancestors 'self' https://ifp.blankschool.com.br`
   - confirm no blocking `X-Frame-Options` header is present
6. Roll back in reverse order if needed:
   - hide or revert the host `app` material exposure first
   - roll back the host deploy if the member hub regresses
   - keep the standalone analytics deployment available while reverting embed-specific host changes
