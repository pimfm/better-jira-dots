# Firefox Add-ons (AMO) — Listing Copy

Paste these into the AMO Developer Hub when submitting `dist/better-jira-dots-firefox.zip`.

---

## Add-on name

```
Better Jira Dots
```

## Add-on summary (≤250 chars)

```
Smarter column-aging for Jira Cloud. Hides aging dots in To Do and Done columns where they're just noise, and recomputes the count using working days only — no weekends, no false alarms. Configurable per status category and per weekday.
```

## Categories

- Primary: **Other** → **Productivity** (or **Tabs** if Productivity isn't offered for the chosen tag set)
- Tag suggestions: `jira`, `productivity`, `kanban`, `agile`

## Default locale

`English (US)`

---

## Description (HTML allowed; AMO supports a limited subset)

```html
<p><strong>Better Jira Dots</strong> fixes two long-standing annoyances with Jira Cloud's column-aging indicator — the row of dots that shows how long a card has been sitting in its current column.</p>

<h3>The problem</h3>
<ul>
  <li>Native dots count weekends. A card moved Friday afternoon turns red Monday morning, even though nobody worked on it.</li>
  <li>Native dots are shown everywhere — including <em>To Do</em> and <em>Done</em> — where aging is just visual noise.</li>
</ul>

<h3>What this extension does</h3>
<ul>
  <li>Hides aging dots in the status categories you choose. Defaults: <em>To Do</em> and <em>Done</em>. Optionally also <em>In Progress</em>.</li>
  <li>Recomputes the count using working days only. Mon–Fri by default; configurable per weekday — perfect for four-day weeks or non-Western weekends.</li>
  <li>Mirrors Jira's documented dot progression (1/2/3/4 grey → 7d one red → 8d two red → 12d three red → 20d+ all red), capped at four dots.</li>
  <li>Toolbar popup with one-click on/off. Settings sync across browsers via <code>storage.sync</code>.</li>
</ul>

<h3>Privacy</h3>
<ul>
  <li>No telemetry. No analytics. No third-party servers.</li>
  <li>Calls only your own Jira instance's REST API, on the tab you have open, using your existing browser session.</li>
  <li>Reads only the data needed to render the dots (issue status category + timestamp of last status change).</li>
  <li>Open source, MIT-licensed: <a href="https://github.com/pimfm/better-jira-dots">github.com/pimfm/better-jira-dots</a></li>
</ul>

<h3>Works with</h3>
<ul>
  <li>Jira <strong>Cloud</strong> (any <code>*.atlassian.net</code> instance).</li>
  <li>Software, Business, and Service Management projects.</li>
</ul>

<h3>Not for</h3>
<ul>
  <li>Jira Server / Data Center (self-hosted). The DOM and APIs differ.</li>
</ul>
```

---

## Notes to reviewer (private; not shown in listing)

```
Better Jira Dots is a small content-script-only extension that runs on Jira Cloud pages (https://*.atlassian.net/jira/* and /secure/RapidBoard.jspa).

How it works:
1. A content script observes board DOM mutations and finds Jira's existing aging-indicator nodes.
2. For each card, it reads the issue key from the DOM and calls the user's own Jira REST API (/rest/api/3/issue/{key}?expand=changelog&fields=status) using the existing browser session — same-origin, no third-party hosts.
3. It computes the working-days delta from the last status change and renders custom dots in place of the native indicator (which is hidden via CSS).

No bundlers, minifiers, or remote code. The submitted ZIP contains only the source files referenced from manifest.json. The repository is public:
https://github.com/pimfm/better-jira-dots

To test:
1. Install the add-on.
2. Open any Jira Cloud board (atlassian.net).
3. Cards in In Progress columns should show dots with a working-days count; cards in To Do and Done columns should have no dots (default config).
4. The toolbar icon opens a popup with an enable/disable toggle. Full settings live on the options page.

No login is required for the extension itself; reviewers will need access to a Jira Cloud instance to see the visual effect. A free Atlassian Cloud trial works.

Build:
- The submitted ZIP is produced by `npm run package` from the repo root. It is unminified plain JS.
- A README is included; the privacy policy is at PRIVACY.md.

Permissions justification:
- "storage": persist user settings via storage.sync.
- "https://*.atlassian.net/*" host permission: inject the content script and call the user's own Jira REST API. No other hosts are contacted.
```

---

## License

`MIT (link to LICENSE file)` — AMO accepts MIT.

## Privacy policy URL

```
https://github.com/pimfm/better-jira-dots/blob/main/PRIVACY.md
```

## Homepage URL

```
https://github.com/pimfm/better-jira-dots
```

## Support email

```
<your email — will be public on the listing>
```

## Support site URL

```
https://github.com/pimfm/better-jira-dots/issues
```

---

## Required asset sizes

| Asset | Size | Notes |
| --- | --- | --- |
| Icon | 128×128 PNG | already in `icons/icon-128.png`; AMO will use it |
| Screenshot 1 | min 1000px wide | use `assets/screenshots/marketing-tile.png` |
| Screenshot 2+ | min 1000px wide | use `assets/screenshots/options.png` and the Jira board shots from your shot list |

AMO accepts up to 10 screenshots. PNG or JPEG. Caption each one (max 250 chars).

### Suggested captions

1. *Same card, 7 days later — native Jira shows a red alert; Better Jira Dots still shows grey, because only 5 working days have elapsed.* — for `marketing-tile.png`
2. *Settings: pick which status categories should hide dots, and which weekdays to count.* — for `options.png`
3. *One-click on/off from the toolbar.* — for `popup.png`
4. *Real Jira board, before — dots crowd the board, including To Do and Done.* — *needs your screenshot*
5. *Same board, after — dots only appear where work is in flight.* — *needs your screenshot*
