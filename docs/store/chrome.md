# Chrome Web Store — Listing Copy

Paste these into the Chrome Web Store Developer Dashboard fields. All copy fits Chrome's character limits (verified 2026).

---

## Item name (≤45 chars)

```
Better Jira Dots
```

## Summary (≤132 chars)

```
Smarter column-aging for Jira Cloud. Hide aging dots in To Do/Done and count working days only — no weekends, no false alarms.
```

## Category

`Productivity`

## Language

English (en)

---

## Description (≤16,000 chars)

```
Better Jira Dots fixes two long-standing annoyances with Jira Cloud's column-aging indicator — the row of dots that shows how long a card has been sitting in its current column.

THE PROBLEM
• Native dots count weekends. A card moved Friday afternoon turns red Monday morning, even though nobody worked on it.
• Native dots are shown everywhere — including To Do and Done — where aging is just visual noise.

WHAT THIS EXTENSION DOES
• Hides aging dots in the status categories you choose. Defaults: To Do and Done. Optional: also hide them in In Progress.
• Recomputes the count using working days only. Mon–Fri by default; configurable per weekday — perfect for four-day weeks or non-Western weekends.
• Mirrors Jira's documented dot progression (1, 2, 3, 4 grey · 7d turns one red · 8d two red · 12d three red · 20d+ all red), capped at four dots.
• Settings sync across browsers via chrome.storage.sync.
• Toolbar popup with a one-click on/off toggle.

PRIVACY
• No telemetry. No analytics. No third-party servers.
• Calls only your own Jira instance's REST API, on the tab you have open, using your existing browser session.
• Reads only the data needed to render the dots (issue status category + timestamp of last status change).
• Open source — MIT licensed: https://github.com/pimfm/better-jira-dots

PERMISSIONS
• "storage" — to remember your settings.
• Host access to https://*.atlassian.net/* — to inject the content script and read status/changelog data from your Jira REST API.

WORKS WITH
• Jira Cloud (any *.atlassian.net instance).
• Software, Business, and Service Management projects on Cloud.

NOT FOR
• Jira Server / Data Center (self-hosted) — the DOM and APIs differ.

SOURCE & SUPPORT
• Source code: https://github.com/pimfm/better-jira-dots
• Issues: https://github.com/pimfm/better-jira-dots/issues
• Privacy policy: https://github.com/pimfm/better-jira-dots/blob/main/PRIVACY.md
```

---

## Single-purpose statement

```
Replaces Jira Cloud's column-aging indicator with a working-days count and lets the user hide it in non-actionable status categories (To Do, Done).
```

## Permission justifications

### `storage`

```
Used to persist user preferences (which status categories to hide and which weekdays count as working days) via chrome.storage.sync. No other data is stored.
```

### Host permission `https://*.atlassian.net/*`

```
The extension runs on Jira Cloud (Atlassian) pages. It needs host access to inject the content script that finds aging-indicator DOM nodes and to call the Jira REST API on the user's own instance (/rest/api/3/issue/{key}) for the status changelog timestamp used to compute the dot count. No third-party domains are contacted.
```

### Remote code

```
No remote code is used. All scripts are bundled with the extension.
```

---

## Privacy disclosures (Data Usage tab)

Tick **none** of the data-collection boxes. The extension does not collect any of the listed categories.

If asked to certify:

- ☑ I do not sell or transfer user data to third parties for purposes unrelated to my single purpose.
- ☑ I do not use or transfer user data for purposes unrelated to my single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

Privacy policy URL:
```
https://github.com/pimfm/better-jira-dots/blob/main/PRIVACY.md
```

---

## Required asset sizes

| Asset | Size | File |
| --- | --- | --- |
| Store icon | 128×128 PNG | `icons/icon-128.png` |
| Small promo tile (optional but recommended) | 440×280 PNG | *needs to be created* |
| Marquee promo tile (optional, featured listings) | 1400×560 PNG | *needs to be created* |
| Screenshot 1 | 1280×800 or 640×400 PNG | `assets/screenshots/marketing-tile.png` (1280×800) |
| Screenshot 2 | 1280×800 or 640×400 PNG | settings page (capture after you have a real Jira screenshot to combine) |
| Screenshot 3–5 | 1280×800 or 640×400 PNG | real Jira board before/after — see `docs/RELEASE.md` shot list |

Minimum: store icon + 1 screenshot.

---

## Pricing & distribution

- Free, no in-app purchases.
- Visibility: **Public**.
- Distribution regions: **All regions**.
- Mature content: **No**.
