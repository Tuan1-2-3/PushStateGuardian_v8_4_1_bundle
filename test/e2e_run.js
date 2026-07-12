const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const extensionPath = path.resolve(__dirname, '..');
  const userDataDir = path.join(__dirname, 'tmp-user-data-dir');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  console.log('Launching Chromium with extension loaded from:', extensionPath);
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ],
  });

  const page = context.pages().length ? context.pages()[0] : await context.newPage();
  await page.goto('https://example.com', { waitUntil: 'load' });

  console.log('Page loaded — waiting for extension overlay host (attached)...');
  await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });

  const initiallyHidden = await page.evaluate(() => {
    const host = document.getElementById('psrd-overlay-host');
    return host ? host.classList.contains('hidden') : null;
  });
  console.log('Overlay host present. initiallyHidden =', initiallyHidden);

  // Reveal overlay via window.postMessage
  console.log('Sending reveal command...');
  await page.evaluate(() => window.postMessage({ __psrd: true, type: 'PSRD_OVERLAY_COMMAND', payload: { reveal: true, duration: 5000 } }, '*'));
  await page.waitForFunction(() => {
    const host = document.getElementById('psrd-overlay-host');
    return host && !host.classList.contains('hidden');
  }, { timeout: 8000 });
  console.log('Reveal: overlay is visible');

  // Toggle compact
  console.log('Sending compact command...');
  await page.evaluate(() => window.postMessage({ __psrd: true, type: 'PSRD_OVERLAY_COMMAND', payload: { hiddenOverlay: false, compactOverlay: true } }, '*'));
  await page.waitForFunction(() => document.getElementById('psrd-overlay-host')?.classList.contains('collapsed'), { timeout: 4000 });
  console.log('Compact: overlay is compact');

  // Hide overlay
  console.log('Sending hide command...');
  await page.evaluate(() => window.postMessage({ __psrd: true, type: 'PSRD_OVERLAY_COMMAND', payload: { hiddenOverlay: true } }, '*'));
  await page.waitForFunction(() => document.getElementById('psrd-overlay-host')?.classList.contains('hidden'), { timeout: 4000 });
  console.log('Hide: overlay hidden');

  await context.close();
  console.log('E2E run complete.');
  process.exit(0);
})().catch((e) => {
  console.error('E2E error:', e);
  process.exit(1);
});
