# PushState Guardian v8.4.1

Calm browsing protection with v8.4 cognitive minimalism, local themes, manual overlay control, and v8.4.1 overlay stability fixes.

## Files
- `manifest.json`
- `background.js`
- `content.js`
- `overlay.js`
- `popup.html`
- `popup.css`
- `popup.js`
- `icons/icon16.png`
- `icons/icon48.png`
- `icons/icon128.png`
- `ROADMAP_v1_to_v10.md`
- `V7_5.md`
- `V8.md`
- `V8_1.md`
- `V8_2.md`
- `V8_3.md`
- `V8_4.md`
- `AGENT_CHANGELOG.md`

## Install locally
1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select this `extension` folder.

## v8.4 Notes
- Cognitive minimalism keeps the default UI calmer and less technical.
- Popup theme supports System, Light, and Dark modes.
- The overlay does not auto-appear during normal browsing by default; it can still be manually revealed.
- High-risk behavior bypasses quiet display rules and expands the overlay.
- Expert details, background notes, timeline data, and audit export remain available on demand.

## v8.4.1 Patch Notes
- Overlay hidden state no longer removes the host with `display:none`.
- Overlay listens for local preference changes and can request a fresh content report.
- Popup has a Show overlay button for manual reveal.
- Popup theme switching is cached and rendered through `requestAnimationFrame` to reduce flicker.

## Shortcuts
- `Alt+X`: hide/show overlay.
- `Ctrl+Alt+C`: toggle compact overlay.
- `Ctrl+Shift+F`: reveal overlay temporarily.
- Use the "Show overlay" button in the popup for a manual reveal, or enable "Show overlay while browsing" in the popup settings to auto-show the overlay during browsing.
