const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

function ensureDirs() {
  const base = path.join(process.cwd(), 'test-results');
  const videos = path.join(base, 'videos');
  const traces = path.join(base, 'traces');
  if (!fs.existsSync(videos)) fs.mkdirSync(videos, { recursive: true });
  if (!fs.existsSync(traces)) fs.mkdirSync(traces, { recursive: true });
  return { base, videos, traces };
}

async function startServer(extensionPath, fileName = 'fixture.html') {
  const file = path.join(extensionPath, 'test', 'playwright', fileName);
  const server = http.createServer((req, res) => {
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(500); res.end('fixture missing'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  return { server, url: `http://127.0.0.1:${port}/` };
}

async function launchContext(extensionPath, videoDir) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'psg-e2e-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ],
    recordVideo: { dir: videoDir }
  });
  const page = context.pages().length ? context.pages()[0] : await context.newPage();
  return { context, page };
}

test.describe('Overlay E2E', () => {
  const extensionPath = path.resolve(__dirname, '..', '..');
  const dirs = ensureDirs();

  test('host is attached', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });
    const attached = await page.$('#psrd-overlay-host');
    expect(attached).not.toBeNull();
    // video
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('reveal via postMessage', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });
    await page.evaluate(() => window.postMessage({ __psrd: true, type: 'PSRD_OVERLAY_COMMAND', payload: { reveal: true, duration: 5000 } }, '*'));
    await page.waitForFunction(() => {
      const host = document.getElementById('psrd-overlay-host');
      return host && !host.classList.contains('hidden');
    }, { timeout: 8000 });
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('popup show overlay button reveals overlay', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });

    let extensionId = null;
    await page.waitForTimeout(1000);
    try {
      const sw = context.serviceWorkers().find((s) => s.url().startsWith('chrome-extension://'));
      if (sw) extensionId = new URL(sw.url()).hostname;
      else {
        const bg = context.backgroundPages().find((p) => p.url().startsWith('chrome-extension://'));
        if (bg) extensionId = new URL(bg.url()).hostname;
      }
    } catch (e) {}
    expect(extensionId).toBeTruthy();

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: 'load' });
    await popup.waitForSelector('#showOverlayBtn', { timeout: 10000 });
    await popup.click('#showOverlayBtn');

    await page.waitForFunction(() => {
      const host = document.getElementById('psrd-overlay-host');
      return host && !host.classList.contains('hidden');
    }, { timeout: 8000 });

    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('compact via postMessage', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });
    await page.evaluate(() => window.postMessage({ __psrd: true, type: 'PSRD_OVERLAY_COMMAND', payload: { hiddenOverlay: false, compactOverlay: true } }, '*'));
    await page.waitForFunction(() => document.getElementById('psrd-overlay-host')?.classList.contains('collapsed'), { timeout: 4000 });
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('hide via postMessage', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });
    await page.evaluate(() => window.postMessage({ __psrd: true, type: 'PSRD_OVERLAY_COMMAND', payload: { hiddenOverlay: true } }, '*'));
    await page.waitForFunction(() => document.getElementById('psrd-overlay-host')?.classList.contains('hidden'), { timeout: 4000 });
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('keyboard shortcuts', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });
    // Ensure page has focus
    await page.focus('body');
    // Reveal via Ctrl+Shift+F
    await page.keyboard.press('Control+Shift+f');
    await page.waitForFunction(() => { const h = document.getElementById('psrd-overlay-host'); return h && !h.classList.contains('hidden'); }, { timeout: 8000 });
    // Compact via Ctrl+Alt+C
    await page.keyboard.press('Control+Alt+c');
    await page.waitForFunction(() => document.getElementById('psrd-overlay-host')?.classList.contains('collapsed'), { timeout: 4000 });
    // Hide via Alt+X
    await page.keyboard.press('Alt+x');
    await page.waitForFunction(() => document.getElementById('psrd-overlay-host')?.classList.contains('hidden'), { timeout: 4000 });
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('computed style, z-index and shadow DOM', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });
    // Ensure overlay is revealed for style checks
    await page.evaluate(() => window.postMessage({ __psrd: true, type: 'PSRD_OVERLAY_COMMAND', payload: { reveal: true, duration: 30000 } }, '*'));
    await page.waitForFunction(() => { const h = document.getElementById('psrd-overlay-host'); return h && !h.classList.contains('hidden'); }, { timeout: 8000 });
    const info = await page.evaluate(() => {
      const host = document.getElementById('psrd-overlay-host');
      if (!host) return { exists: false };
      const s = getComputedStyle(host);
      return {
        exists: true,
        display: s.display,
        visibility: s.visibility,
        opacity: parseFloat(s.opacity || '0'),
        zIndex: parseInt(s.zIndex || '0', 10),
        hasShadow: !!host.shadowRoot,
        shellPresent: !!(host.shadowRoot && host.shadowRoot.querySelector('.shell'))
      };
    });
    expect(info.exists).toBeTruthy();
    expect(info.display).not.toBe('none');
    expect(info.visibility).toBe('visible');
    expect(info.opacity).toBeGreaterThan(0);
    expect(info.zIndex).toBeGreaterThanOrEqual(1000);
    expect(info.hasShadow).toBeTruthy();
    expect(info.shellPresent).toBeTruthy();
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('navigation resilience (pushState)', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });
    // reveal overlay then perform pushState navigations
    await page.evaluate(() => window.postMessage({ __psrd: true, type: 'PSRD_OVERLAY_COMMAND', payload: { reveal: true, duration: 30000 } }, '*'));
    await page.waitForFunction(() => { const h = document.getElementById('psrd-overlay-host'); return h && !h.classList.contains('hidden'); }, { timeout: 8000 });
    await page.evaluate(() => {
      history.pushState({ a: 1 }, '', '/n1');
      history.pushState({ b: 2 }, '', '/n2');
      location.hash = 'testhash';
    });
    // overlay should remain attached and visible
    await page.waitForFunction(() => {
      const h = document.getElementById('psrd-overlay-host'); if (!h) return false;
      const s = getComputedStyle(h); return s.display !== 'none' && s.visibility === 'visible' && parseFloat(s.opacity || '0') > 0;
    }, { timeout: 8000 });
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('overlay attaches only to top-level document (iframe separation)', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath, 'fixture_iframe.html');
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#psrd-overlay-host', { state: 'attached', timeout: 15000 });
    const res = await page.evaluate(() => {
      const topHas = !!document.getElementById('psrd-overlay-host');
      const iframe = document.getElementById('inner');
      let innerHas = false;
      try { innerHas = !!(iframe && iframe.contentDocument && iframe.contentDocument.getElementById('psrd-overlay-host')); } catch (e) { innerHas = 'error'; }
      return { topHas, innerHas };
    });
    expect(res.topHas).toBeTruthy();
    expect(res.innerHas === false).toBeTruthy();
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('bridge injection under CSP', async ({}, testInfo) => {
    const { context, page } = await launchContext(extensionPath, dirs.videos);
    const srv = await startServer(extensionPath, 'fixture_csp.html');
    await page.goto(srv.url, { waitUntil: 'load' });
    // The page_bridge should be injected by the background even if CSP blocks inline scripts
    await page.waitForFunction(() => !!window.__psrdPageInstalled, { timeout: 8000 });
    try { const vid = await page.video(); if (vid) { const vpath = await vid.path(); await testInfo.attach('video', { path: vpath, contentType: 'video/webm' }); } } catch (e) {}
    try { srv.server.close(); } catch (e) {}
    await context.close();
  });

  test('popup responsive smoke', async ({}, testInfo) => {
    const { context } = await launchContext(extensionPath, dirs.videos);
    // Find the extension id from a background page or service worker
    let extensionId = null;
    try {
      const bg = context.backgroundPages().find(p => p.url().startsWith('chrome-extension://'));
      if (bg) extensionId = new URL(bg.url()).hostname;
    } catch (e) {}
    if (!extensionId) {
      try {
        const sw = context.serviceWorkers().find(s => s.url().startsWith('chrome-extension://'));
        if (sw) extensionId = new URL(sw.url()).hostname;
      } catch (e) {}
    }
    expect(extensionId).toBeTruthy();

    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 360, height: 700 });
    await popup.goto(popupUrl, { waitUntil: 'load' });
    // Wait for main UI to render
    await popup.waitForSelector('main.shell, .hero, .diagnostics-actions', { timeout: 5000 });

    const metrics = await popup.evaluate(() => {
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      const docW = document.documentElement.scrollWidth;
      const shell = document.querySelector('main.shell') || document.querySelector('.shell') || document.body;
      const shellRect = shell.getBoundingClientRect();
      return { viewport, docW, shellW: Math.round(shellRect.width) };
    });

    // Ensure the popup content fits within the small width we set
    expect(metrics.shellW).toBeLessThanOrEqual(360);
    expect(metrics.docW).toBeLessThanOrEqual(360);

    const shot = await popup.screenshot();
    await testInfo.attach('popup-screenshot', { body: shot, contentType: 'image/png' });
    await context.close();
  });
});
