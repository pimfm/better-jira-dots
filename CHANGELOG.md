# Changelog

All notable changes to Better Jira Dots are documented here.

## [1.3.1] - 2026-04-30

- Fixed: re-enabling the extension via the popup or options page after it had
  been disabled didn't re-render dots until the page was reloaded. The
  observed-indicator tracking is now reset on disable so the same DOM nodes
  get re-registered on re-enable.

## [1.3.0] - 2026-04-30

- Added a toolbar popup. Clicking the extension icon now opens a small menu
  with a single on/off toggle and a button to open the full settings page.
  Toggling here flips the same setting as the options page.

## [1.2.1] - 2026-04-30

- Reverted to the documented two-tier (grey + red) scheme. The light-grey tier
  added in 1.2.0 was speculative and not part of Jira's documented anchors.

## [1.2.0] - 2026-04-30

- Added a third tier (light grey) to match the colour scheme observed on real
  Jira boards. Light grey is used while the row of dots is still accumulating
  (1–5 days), darker slate grey takes over once the row is full but not yet
  overdue (6–7 days), then the documented red transition kicks in.
- Updated dot-colour tokens (`--light`, `--dark`, `--red`) and the options
  preview to reflect the new scheme.

## [1.1.0] - 2026-04-30

- Replaced configurable colour thresholds with Jira's documented dot
  progression (1d=1 grey, 2d=2g, 3d=3g, 5d=4g, 8d=2g+2r, 12d=1g+3r, 20+d=4r),
  capped at 4 dots. The extension now mirrors what Jira renders natively for a
  given count, just with weekend days subtracted from the count.
- Removed obsolete settings: `yellowThreshold`, `redThreshold`, `maxDots`. They
  are silently dropped from any previously synced settings.
- Updated dot colours to match Jira's palette (`#6b778c` grey, `#c9372c` red).

## [1.0.1] - 2026-04-30

- Switched to native-indicator-first detection: the extension now only modifies
  DOM nodes Jira already rendered as an aging indicator. No dots are drawn on
  epic header rows or any other location that doesn't already have native dots.
- The custom dots are inserted as the next sibling of the (now hidden) native
  indicator, so they always appear in the exact slot Jira intended.
- Removed the broader card-scan logic that occasionally produced stray dots in
  unexpected places on the card.

## [1.0.0] - 2026-04-30

Initial release.

- Hides aging-indicator dots in columns whose status category matches the configured "hidden" categories. Defaults: To Do and Done.
- Recomputes the days-in-column count using working days only (Mon–Fri by default; configurable).
- Configurable yellow and red thresholds for dot color.
- Configurable max dot count.
- Options page with live preview.
- Same-origin Jira REST API calls only; no third-party services.
- Manifest V3, Chrome and Firefox compatible.
