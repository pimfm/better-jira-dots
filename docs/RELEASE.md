# Release Guide

End-to-end walkthrough for publishing **Better Jira Dots** to the Chrome Web Store and Firefox Add-ons (AMO).

---

## 0 · Prerequisites checklist

- [ ] Bump `manifest.json` `"version"` (and `package.json` `"version"`) using semver.
- [ ] Update `CHANGELOG.md` with the new version + a 1–3 line note.
- [ ] `npm run lint` passes.
- [ ] Manually load the unpacked extension in Chrome and Firefox; confirm dots behave correctly on a real board.
- [ ] `npm run package` — produces `dist/better-jira-dots-chrome.zip` and `dist/better-jira-dots-firefox.zip`.
- [ ] Tag the release: `git tag v<version> && git push --tags`.
- [ ] Capture (or refresh) the Jira board screenshots — see [§4](#4--screenshots-only-you-can-take).

---

## 1 · Chrome Web Store

### 1.1 Developer account (one-time)

1. Go to <https://chrome.google.com/webstore/devconsole>.
2. Sign in with the Google account that will own the listing.
3. Pay the **one-time $5 USD** developer registration fee.
4. Verify identity (Google may request a phone number / ID — turnaround usually < 1 day).

### 1.2 First-time submission

1. Developer Dashboard → **New Item** → upload `dist/better-jira-dots-chrome.zip`.
2. Fill in the **Store listing** tab using the copy in [`docs/store/chrome.md`](store/chrome.md).
3. Upload assets:
   - **Store icon** — `icons/icon-128.png`
   - **Screenshots** — at least one. Required size: 1280×800 or 640×400 PNG.
     - Already prepared: `assets/screenshots/marketing-tile.png` (1280×800)
     - Optional: settings page (`assets/screenshots/options.png`) — pad/letterbox to 1280×800 in any image editor.
     - Recommended: 2–3 real Jira board shots (see [§4](#4--screenshots-only-you-can-take)).
4. **Privacy practices** tab:
   - Single-purpose statement → see `docs/store/chrome.md`.
   - Permission justifications → see `docs/store/chrome.md`.
   - Data usage: tick **none** (extension does not collect any of the listed categories).
   - Privacy policy URL: `https://github.com/pimfm/better-jira-dots/blob/main/PRIVACY.md`.
5. **Distribution** tab: Public, all regions, free.
6. Click **Submit for review**.

### 1.3 Review timeline

- Typical: **1–3 business days**.
- First-time publishers and listings with broad host permissions can take longer.
- Common rejection reasons & how this listing avoids them:
  - *Single purpose unclear* → described explicitly in the listing.
  - *Permission justification missing* → both `storage` and the host permission are explained.
  - *Privacy policy link broken* → link points to the file in the public repo.

### 1.4 Subsequent updates

1. Bump version, repackage, upload the new ZIP via the dashboard.
2. Listing copy persists; only re-edit if a screenshot or description changed.
3. Submit for review.

---

## 2 · Firefox Add-ons (AMO)

### 2.1 Developer account (one-time)

1. Go to <https://addons.mozilla.org/en-US/developers/>.
2. Sign in with a Firefox Account (or create one).
3. Read & accept the **Add-on Developer Agreement**. No fee.

### 2.2 First-time submission

1. Developer Hub → **Submit a New Add-on**.
2. Choose **On this site** (publicly listed). Pick **Firefox** as the platform.
3. Upload `dist/better-jira-dots-firefox.zip`.
4. AMO auto-validates the manifest. The validator may print warnings about `browser_specific_settings` — those are informational; proceed.
5. Source code: **Yes, my add-on contains minified, concatenated, or otherwise machine-generated code** → answer **No** (this codebase ships unbundled). If AMO still asks for a source archive, upload the same ZIP — it *is* the source.
6. Fill the listing using the copy in [`docs/store/firefox.md`](store/firefox.md):
   - Name, summary, description (HTML)
   - Categories & tags
   - License: MIT
   - Privacy policy URL, homepage URL, support email, support URL
7. Upload screenshots (min 1000px wide):
   - `assets/screenshots/marketing-tile.png`
   - `assets/screenshots/options.png`
   - `assets/screenshots/popup.png`
   - 2–3 real Jira board shots
8. Add captions (suggested captions in `docs/store/firefox.md`).
9. **Notes to reviewer** (private) → paste the block from `docs/store/firefox.md`. This dramatically speeds up review for content-script extensions on broad host permissions.
10. Submit.

### 2.3 Review timeline

- Listed add-ons: usually **1–10 days** for first review; subsequent updates often within hours.
- AMO reviewers will read the **Notes to reviewer** field — keep it accurate.

### 2.4 Subsequent updates

1. Bump version (must be strictly greater than the last published one), repackage.
2. Developer Hub → your add-on → **Upload New Version**.
3. Update the listing only if copy changed.

---

## 3 · Post-publish

- [ ] Add the Chrome Web Store and AMO listing URLs to `README.md` (replace the "Coming soon" block).
- [ ] Add badges:
  - Chrome: `https://img.shields.io/chrome-web-store/v/<EXTENSION_ID>`
  - Firefox: `https://img.shields.io/amo/v/better-jira-dots`
- [ ] Create a GitHub Release matching the tag, attach both ZIPs.
- [ ] Optional: post a short note in r/jira or r/atlassian.

---

## 4 · Screenshots only you can take

Both stores benefit hugely from real Jira board screenshots. Capture these on a board you have access to. Resolution: **1280×800 or larger**, retina/2x is fine. PNG.

### Shot 1 — "Native Jira, before installing"

- Open a real board with at least 6–10 cards spread across To Do / In Progress / Done.
- Make sure several cards have **multiple aging dots visible**, including in To Do or Done.
- Capture the board area — crop tight to columns. No personal data in card titles; use a demo project if needed.

### Shot 2 — "Same board, after installing"

- Same board, same zoom level, ideally minutes later (so dot counts are similar).
- To Do and Done columns should now have **no dots**.
- In Progress dots should reflect the lower working-day count.

### Shot 3 — "A weekend-spanning card"

- Find or create a card moved into In Progress on a Friday, currently it's Monday or Tuesday.
- Native version: red dot. After installing: still grey.
- A side-by-side (Photoshop / Preview / GIMP) is ideal.

### Shot 4 (optional) — "Settings panel over a board"

- Open the extension's options page in one tab and a board in another, screenshot the options page; this one is already generated as `assets/screenshots/options.png`.

### Sanity tips

- **Hide PII.** Blur or rename teammates' avatars and any sensitive ticket text.
- **Match aspect ratio.** Chrome wants 1280×800. Firefox is more lenient (≥ 1000px wide).
- **Save as PNG**, not JPEG. Avoid recompression.

Drop the captured PNGs into `assets/screenshots/jira/` and reference them from the listing.

---

## 5 · Troubleshooting

| Issue | Fix |
| --- | --- |
| Chrome rejects: "permissions broader than necessary" | Justification text covers it; if still rejected, link to the source file lines that use the permission. |
| Firefox validator: `browser_specific_settings.gecko.id` warning | Already set in `manifest.json`; warnings are informational only. |
| AMO review asks for source despite no minification | Re-upload the same ZIP labelled as source. Add a note: "submitted ZIP is the source — no build step beyond `npm run package` (zips the files referenced by manifest.json)." |
| Chrome version field complaint | `version` must be 1–4 dot-separated numbers, each ≤ 65535. |
