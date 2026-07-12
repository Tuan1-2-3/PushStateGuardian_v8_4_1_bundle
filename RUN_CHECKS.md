RUNNING CHECKS & E2E TESTS

This file contains exact commands to run the extension's automated checks and Playwright E2E suite. Use these steps in local dev or CI (Codex/automation) to reproduce the test runs.

Prerequisites
- Node.js 16+ (LTS) and npm
- On CI, ensure system packages required by Playwright are available (see Playwright docs). Use `npx playwright install --with-deps` on Linux containers.

Install dependencies (reproducible):
```bash
cd extension
npm ci
npx playwright install
```

Run the Playwright e2e suite (non-headless; tests control their own browser flags):
```bash
npm run test:e2e
```

If you need to run a single test file (for debugging):
```bash
npx playwright test test/playwright/e2e.spec.js -g "Overlay E2E"
```

Troubleshooting
- If Playwright reports missing browsers, run `npx playwright install`.
- On CI, allow required ports or run in a headful environment that supports launching Chromium.
- If tests fail with network name resolution errors, ensure the fixture server is allowed to bind to the port (the tests start a local HTTP server internally).

Artifacts
- Tests produce traces, screenshots, and videos in `extension/test-results/` and an HTML report in `extension/playwright-report/` when enabled.

- CI uploads Playwright artifacts for each run (artifact name: `playwright-artifacts-<run_number>`). Uploaded files include:
	- `extension/test-results/**` (videos, traces, attachments)
	- `extension/playwright-report/**` (HTML report)

- Download artifacts from GitHub Actions:
	- GitHub UI: Actions → select the workflow run → Artifacts → Download the `playwright-artifacts-*` zip.
	- GH CLI (example):
		```bash
		# list recent runs for the Playwright workflow
		gh run list --workflow playwright-e2e.yml --limit 5

		# download all artifacts for a specific run
		gh run download <run-id> --dir ./artifacts

		# or download a specific artifact by name
		gh run download <run-id> --name "playwright-artifacts-<run_number>" --dir ./artifacts
		```

- View the Playwright HTML report locally (after downloading or when generated locally):
	```bash
	npx playwright show-report extension/playwright-report
	```

Notes for Codex/automation
- Run the exact commands above in order. Use `npm ci` for deterministic installs.
- Ensure the working directory is the `extension` folder when invoking `npm run test:e2e`.

Expected outcome
- The suite currently contains 10 tests and should pass locally. If failures occur, capture the Playwright output and the background service worker console logs for diagnosis.
