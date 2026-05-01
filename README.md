# Better Jira Dots

A Firefox + Chrome extension that fixes two annoyances with Jira Cloud's "days in column" aging dots:

1. The dots show on **To Do** and **Done** columns, where they're not actionable. This extension hides them there (configurable).
2. The dot count includes weekends. This extension recomputes the count using working days only.

Works on Jira Cloud (`*.atlassian.net`). Uses only the Jira REST API your browser already has access to — no third-party servers, no telemetry.

## Install (development)

### Firefox
1. Run `npm install` (only needed if you want to rebuild icons; the repo ships with prebuilt PNGs).
2. Open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select `manifest.json`.

### Chrome
1. Open `chrome://extensions` → enable **Developer mode**.
2. Click **Load unpacked** → select the project root.

## Build for store submission

```sh
npm run package
```

Produces:
- `dist/better-jira-dots-chrome.zip` — upload to the Chrome Web Store.
- `dist/better-jira-dots-firefox.zip` — upload to addons.mozilla.org.

## Configuration

Click the extension icon (or open the options page) to configure:

- **Hidden status categories** — by default, `To Do` and `Done`. You can also unhide them or add `In Progress` to hide all dots entirely.
- **Custom working days** — Mon–Fri by default; tick or untick any day. Excluded days are subtracted from the count.

All settings sync across browsers if your browser account syncs `chrome.storage.sync`.

The dot colour and count match Jira Cloud's documented progression and are not configurable:

| Working days | Pattern |
| --- | --- |
| 1 | grey |
| 2 | grey grey |
| 3 | grey grey grey |
| 4–5 | 4× grey |
| 7 | 3× grey + 1× red |
| 8–11 | 2× grey + 2× red |
| 12–19 | 1× grey + 3× red |
| 20+ | 4× red |

## How it works

1. A content script runs on Jira Cloud board pages.
2. A `MutationObserver` watches for cards being added or moved.
3. For each visible card, the extension reads the issue key from the DOM, fetches `/rest/api/3/issue/{key}?expand=changelog&fields=status` (cached), and finds the timestamp of the most recent status change.
4. If the card's status category is in the "hidden" list, the native aging indicator is hidden and nothing is rendered.
5. Otherwise, the extension counts working days from the last status change to now (skipping weekends and any disabled weekdays) and renders its own dots in place of the native one.

The native indicator is hidden via CSS so the extension's count is the only one shown.

## Project layout

```
manifest.json
src/
  content/         injected on Jira pages (settings, api, workdays, dots, main)
  options/         settings UI
styles/
  content.css      hides native dots, styles custom ones
icons/             16/32/48/128 PNGs
_locales/en/       i18n strings
scripts/           build + icon generator
```

## Privacy

No data leaves your browser. See [PRIVACY.md](./PRIVACY.md).

## License

MIT — see [LICENSE](./LICENSE).
