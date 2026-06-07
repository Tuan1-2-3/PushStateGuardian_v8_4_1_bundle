chrome.runtime.onInstalled.addListener(() => {
  console.log("PushState Guardian v8.4.1 initialized");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return false;

  if (msg.type === 'INJECT_BRIDGE') {
    const tabId = sender && sender.tab && sender.tab.id;
    if (!tabId) {
      sendResponse({ ok: false, error: 'no_tab' });
      return false;
    }
    (async () => {
      const recordDiag = (info) => {
        try {
          chrome.storage.local.get(['psrdDiagnostics'], (data) => {
            const arr = data.psrdDiagnostics || [];
            arr.push(info);
            chrome.storage.local.set({ psrdDiagnostics: arr }, () => {});
          });
        } catch (e) {}
      };

      const url = chrome.runtime.getURL('page_bridge.js');

      // Try file injection first
      try {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['page_bridge.js'], world: 'MAIN' });
        sendResponse({ ok: true, method: 'files' });
        return;
      } catch (errFiles) {
        recordDiag({ type: 'inject_try_files_failed', error: String(errFiles), url: sender.tab && sender.tab.url, ts: Date.now() });
      }

      // Try fetching file and eval'ing in page
      try {
        const res = await fetch(url);
        const code = await res.text();
        await chrome.scripting.executeScript({ target: { tabId }, func: (src) => { try { new Function(src)(); } catch (e) { console.error('psgd eval failed', e); } }, args: [code], world: 'MAIN' });
        sendResponse({ ok: true, method: 'eval' });
        return;
      } catch (errEval) {
        recordDiag({ type: 'inject_try_eval_failed', error: String(errEval), url: sender.tab && sender.tab.url, ts: Date.now() });
      }

      // Try appending script element with chrome-extension src in page main world
      try {
        await chrome.scripting.executeScript({ target: { tabId }, func: (u) => { try { const s = document.createElement('script'); s.src = u; s.onload = () => s.remove(); (document.documentElement || document.head || document.body).appendChild(s); } catch (e) { console.error(e); } }, args: [url], world: 'MAIN' });
        sendResponse({ ok: true, method: 'append' });
        return;
      } catch (errAppend) {
        recordDiag({ type: 'inject_try_append_failed', error: String(errAppend), url: sender.tab && sender.tab.url, ts: Date.now() });
        sendResponse({ ok: false, error: `all_methods_failed`, details: [String(errFiles), String(errEval), String(errAppend)] });
        return;
      }
    })();
    return true;
  }

  if (msg.type === 'PSRD_REPORT_PUSH') {
    const tabId = sender && sender.tab && sender.tab.id;
    const key = tabId ? `psrdLatestReport_${tabId}` : `psrdLatestReport_global`;
    try { chrome.storage.local.set({ [key]: msg.report }, () => {}); } catch (e) {}
    try { chrome.runtime.sendMessage({ type: 'PSRD_REPORT_PUSH', report: msg.report }); } catch (_) {}
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'PSRD_DIAG') {
    try {
      chrome.storage.local.get(['psrdDiagnostics'], (data) => {
        const arr = data.psrdDiagnostics || [];
        arr.push(msg.diag || { ts: Date.now(), info: 'unknown' });
        chrome.storage.local.set({ psrdDiagnostics: arr }, () => {});
      });
    } catch (_) {}
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'PSRD_HEARTBEAT') {
    const tabId = sender && sender.tab && sender.tab.id;
    const key = tabId ? `psrdOverlayHealth_${tabId}` : `psrdOverlayHealth_global`;
    try {
      const payload = { ...(msg.payload || {}), recordedAt: Date.now(), url: sender && sender.tab && sender.tab.url };
      chrome.storage.local.get([key], (data) => {
        try {
          const prev = (data && data[key]) || { history: [] };
          prev.last = payload;
          prev.history = (prev.history || []).concat(payload).slice(-10);
          chrome.storage.local.set({ [key]: prev }, () => {});
        } catch (e) {}
      });
    } catch (e) {}
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
