# Agent Change Log

Use this file to record meaningful repository changes so future AI agents and contributors can understand what changed, why it changed, and how it was verified.

## Entry format
- Date:
- Summary:
- Files:
- Why:
- Verification:

## 2026-07-12
- Date: 2026-07-12
- Summary: Fixed the manual overlay reveal flow and prevented popup metrics from mixing reports from different tabs.
- Files: background.js, content.js, overlay.js, popup.js, test/playwright/e2e.spec.js
- Why: The popup and keyboard shortcut paths were not reliably revealing the overlay, and popup updates could flicker between reports from different tabs.
- Verification: Ran the full Playwright suite; 11 tests passed.

## 2026-07-12 (additional detail)
- Date: 2026-07-12
- Summary: Added a safer manual overlay reveal path and fallback targeting logic.
- Files: popup.js, background.js
- Why: The popup’s "Show overlay" button could send the reveal command to an inactive or unreachable tab, which prevented the overlay from appearing even though no runtime error was shown.
- Verification: Verified with the Playwright popup reveal regression test; 1 passed.
