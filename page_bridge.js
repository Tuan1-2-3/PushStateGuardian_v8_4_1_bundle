(() => {
  if (window.__psrdPageInstalled) return;
  window.__psrdPageInstalled = true;
  const send = (type, meta = {}) => window.postMessage({ __psrdBridge: true, type: 'PSRD_PAGE_EVENT', payload: { type, meta, t: Date.now() } }, '*');
  try {
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);
    history.pushState = function(...args) { send('pushState', { detail: String(args[2] || '') }); return originalPush(...args); };
    history.replaceState = function(...args) { send('replaceState', { detail: String(args[2] || '') }); return originalReplace(...args); };
  } catch (e) {}
  try {
    const originalOpen = window.open;
    window.open = function(...args) { send('popup_open', { detail: String(args[0] || 'unknown') }); return originalOpen.apply(window, args); };
  } catch (e) {}
  try {
    const originalReq = Element.prototype.requestFullscreen;
    Element.prototype.requestFullscreen = function(...args) { send('fullscreen_request', { detail: this && this.tagName ? this.tagName : 'unknown' }); return originalReq.apply(this, args); };
  } catch (e) {}
  try {
    if (Notification && Notification.requestPermission) {
      const originalPerm = Notification.requestPermission.bind(Notification);
      Notification.requestPermission = function(...args) { send('notification_request', { detail: 'requestPermission' }); return originalPerm(...args); };
    }
  } catch (e) {}
  try {
    const originalClipboard = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText.bind(navigator.clipboard) : null;
    if (originalClipboard) {
      navigator.clipboard.writeText = function(...args) { send('clipboard_write', { detail: 'writeText' }); return originalClipboard(...args); };
    }
  } catch (e) {}
  // signal installation
  try {
    window.postMessage({ __psrdBridge: true, type: 'PSRD_PAGE_EVENT', payload: { type: 'bridge_installed', meta: {}, t: Date.now() } }, '*');
  } catch (e) {}
})();
