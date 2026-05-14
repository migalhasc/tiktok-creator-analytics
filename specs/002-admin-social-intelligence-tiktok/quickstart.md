# Quickstart: Admin Social Intelligence TikTok Embed

## 1. Prepare both repositories

1. In `tiktokanalytics`, check out `002-admin-social-intelligence-tiktok`.
2. In `../member-hub-pro`, check out the matching host branch.
3. Confirm both projects have their normal environment files configured.

## 2. Validate the admin route locally

1. Start `member-hub-pro`.
2. Open `#/admin/social-intelligence`.
3. Confirm the page loads on the `Instagram` tab by default.
4. Switch to `TikTok Analytics` and confirm:
   - the URL updates to `?tab=tiktok`
   - the TikTok app renders inside the page
   - the browser does not leave the admin route
5. Simulate a failed iframe load and confirm the admin panel shows the inline retry state.

## 3. Validate the public cleanup locally

1. Open `#/plataforma/materiais`.
2. Confirm `TikTok Analytics` no longer appears in the listing.
3. Confirm normal non-app materials still behave correctly:
   - inline markdown materials continue using `/plataforma/ferramentas/:id`
   - external materials still open with `window.open`
4. Confirm the admin materials form no longer offers `app` as a selectable type.

## 4. Apply rollout in the safe order

1. Deploy the updated `member-hub-pro` admin UI first.
2. Validate `/admin/social-intelligence` in the deployed environment.
3. Run the host cleanup migration:
   - `202605140001_remove_tiktokanalytics_public_material.sql`
4. Re-check that `TikTok Analytics` is absent from `/plataforma/materiais`.

## 5. Keep the standalone app available

1. Open `https://tiktokanalytics.ickanz.easypanel.host`.
2. Confirm the standalone app still works publicly.
3. Open `https://tiktokanalytics.ickanz.easypanel.host?embed=1`.
4. Confirm the embed presentation still renders correctly for host use.

## 6. Validation commands

1. In `../member-hub-pro`, run:
   - `npm run test -- src/pages/admin/AdminSocialIntelligence.test.tsx src/components/admin/social-intelligence/AdminTikTokAnalyticsPanel.test.tsx src/pages/plataforma/Materiais.public.test.tsx src/pages/admin/AdminMateriais.test.tsx`
   - `npm run build`
2. If the deployed admin iframe degrades unexpectedly, validate:
   - the browser console for frame errors
   - the analytics response headers still allow `https://ifp.blankschool.com.br`
   - the admin page continues showing the inline retry state instead of navigating away
