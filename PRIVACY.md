# Privacy Policy

**Better Jira Dots** does not collect, transmit, store on remote servers, or share any personal data.

## What the extension does

- Runs only on `https://*.atlassian.net/jira/*` pages.
- Reads issue status and changelog data from your Jira instance using your existing browser session — exactly the same data your browser already has access to.
- Stores your preferences (which status categories to hide, weekday/threshold settings) in your browser via `chrome.storage.sync`. Your browser may sync this between devices using your browser account; the extension itself does not.

## What the extension does NOT do

- No analytics or telemetry.
- No third-party servers, no remote APIs.
- No reading or transmitting of issue contents, comments, attachments, or user information beyond what is required to render the dots (status category and timestamp of last status change).
- No tracking, no cookies, no fingerprinting.

## Permissions explained

- **`storage`** — to remember your settings.
- **`https://*.atlassian.net/*` host permission** — to inject the content script into Jira Cloud pages and call your own Jira's REST API for status/changelog data.

## Contact

Issues or questions: open an issue on the project's GitHub repository.

_Last updated: 2026-04-30._
