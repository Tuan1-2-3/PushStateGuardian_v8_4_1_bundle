(() => {
  if (window.__psrdOverlayInstalled) return;
  window.__psrdOverlayInstalled = true;

  const host = document.createElement('div');
  host.id = 'psrd-overlay-host';
  host.style.position = 'fixed';
  host.style.right = '18px';
  host.style.top = '18px';
  host.style.zIndex = '2147483647';
  host.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  host.style.pointerEvents = 'none';
  host.style.contain = 'strict';
  host.style.isolation = 'isolate';
  host.style.transform = 'translateZ(0)';
  host.style.willChange = 'transform, opacity';

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        display:block;
        --psg-text:#e7eef8;
        --psg-muted:rgba(231,238,248,.68);
        --psg-surface:rgba(22,28,39,.88);
        --psg-surface-soft:rgba(255,255,255,.055);
        --psg-border:rgba(255,255,255,.12);
        --psg-ring-core:#0b1020;
        --psg-shadow:0 18px 42px rgba(0,0,0,.34), 0 8px 18px rgba(31,70,120,.18);
      }
      :host(.theme-light) {
        --psg-text:#172033;
        --psg-muted:rgba(23,32,51,.66);
        --psg-surface:rgba(251,253,255,.92);
        --psg-surface-soft:rgba(36,75,130,.07);
        --psg-border:rgba(30,64,110,.14);
        --psg-ring-core:#f8fbff;
        --psg-shadow:0 18px 42px rgba(30,64,110,.16), 0 6px 16px rgba(30,64,110,.10);
      }
      :host(.theme-dark) {
        color-scheme: dark;
      }
      @media (prefers-color-scheme: light) {
        :host(.theme-system) {
          --psg-text:#172033;
          --psg-muted:rgba(23,32,51,.66);
          --psg-surface:rgba(251,253,255,.92);
          --psg-surface-soft:rgba(36,75,130,.07);
          --psg-border:rgba(30,64,110,.14);
          --psg-ring-core:#f8fbff;
          --psg-shadow:0 18px 42px rgba(30,64,110,.16), 0 6px 16px rgba(30,64,110,.10);
        }
      }
      .shell {
        pointer-events: auto;
        position: relative;
        width: 318px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 32px);
        color: var(--psg-text);
        border-radius: 26px;
        background: var(--psg-surface);
        border: 1px solid var(--psg-border);
        box-shadow: var(--psg-shadow);
        backdrop-filter: blur(18px);
        overflow: hidden;
        transition: opacity .18s ease, transform .18s ease;
      }
      .head {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:14px 14px 12px;
        border-bottom:1px solid var(--psg-border);
        cursor: move;
        user-select:none;
      }
      .titleBlock { min-width: 0; flex: 1; }
      .eyebrow { font-size:10px; letter-spacing:0; text-transform:uppercase; color:#1a73e8; font-weight:850; }
      .subtitle { max-width: 190px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; color:var(--psg-muted); margin-top:4px; }
      .controls { display:flex; gap:6px; align-items:center; flex: 0 0 auto; cursor: default; }
      .pill {
        padding:7px 12px;
        border-radius:999px;
        font-size:11px;
        font-weight:800;
        border:1px solid rgba(74,222,128,.32);
        background: rgba(74,222,128,.12);
        color:#4ade80;
      }
      .mini {
        width: 16px;
        height: 16px;
        padding: 0;
        display:grid;
        place-items:center;
        cursor:pointer;
        border-radius:50%;
        font-size:9px;
        font-weight:900;
        line-height:1;
        border:1px solid var(--psg-border);
        background: var(--psg-surface-soft);
        color:var(--psg-text);
        opacity:.55;
        transform:translateY(-1px);
        transition: opacity .16s ease, transform .16s ease, background .16s ease;
        box-shadow:none;
      }
      .shell:hover .mini, .mini:focus-visible { opacity:.92; transform:translateY(0); }
      .mini:hover { background: rgba(96,165,250,.20); }
      .compactMark { display:none; align-items:center; gap:6px; min-width:0; color:var(--psg-text); font-size:12px; font-weight:900; }
      .compactBrand { display:grid; place-items:center; width:18px; height:18px; border-radius:50%; background:rgba(26,115,232,.13); color:#1a73e8; font-size:9px; }
      .body { padding: 14px; display:grid; gap:12px; }
      .scoreCard {
        display:grid; grid-template-columns: 1fr auto; gap:14px; padding:14px; border-radius:18px;
        background: var(--psg-surface-soft); border: 1px solid var(--psg-border);
      }
      .score { font-size: 34px; line-height:1; font-weight: 900; letter-spacing: 0; }
      .score small { font-size: 11px; color: var(--psg-muted); font-weight: 700; }
      .summary { margin-top:6px; font-size:12px; color: var(--psg-muted); line-height:1.45; }
      .ring {
        width: 86px; height: 86px; border-radius: 50%; display:grid; place-items:center; position:relative;
        background: radial-gradient(circle at center, var(--psg-ring-core) 54%, transparent 55%), conic-gradient(#1a73e8 0deg, #9c6ade 240deg, rgba(125,145,170,.16) 240deg);
        box-shadow: inset 0 0 24px rgba(26,115,232,.12);
      }
      .ring span { position: relative; z-index: 2; font-size: 18px; font-weight: 900; }
      .grid { display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .metric { padding: 11px; border-radius: 18px; background: var(--psg-surface-soft); border: 1px solid var(--psg-border); }
      .metric span { display:block; font-size: 11px; color: var(--psg-muted); margin-bottom: 5px; }
      .metric strong { font-size: 18px; }
      .chartCard { padding: 12px 14px 14px; border-top: 1px solid var(--psg-border); background: rgba(255,255,255,.025); }
      .chartTitle { display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; gap: 8px; }
      .chartTitle h3 { margin: 0; font-size: 12px; color: var(--psg-text); }
      .chartTitle span { font-size: 11px; color: var(--psg-muted); }
      .timeline, .heatmap { display:grid; grid-template-columns: repeat(24, 1fr); gap: 3px; }
      .bar, .cell { height: 16px; border-radius: 5px; background: rgba(148,163,184,.12); border: 1px solid rgba(255,255,255,.04); }
      .cell { height: 12px; }
      .reasons { padding: 12px 14px 14px; border-top: 1px solid var(--psg-border); background: rgba(255,255,255,.025); }
      .reasons h3 { margin: 0 0 8px; font-size: 12px; color: var(--psg-text); }
      .reasons ul { margin: 0; padding-left: 18px; font-size: 11px; line-height:1.55; color: var(--psg-muted); }
      :host(.collapsed) .body, :host(.collapsed) .chartCard, :host(.collapsed) .reasons { display:none; }
      :host(.collapsed) .shell, :host(.ambient):not(.expanded) .shell {
        width: 136px;
        height: 30px;
        border-radius:999px;
        box-shadow:0 4px 18px rgba(0,0,0,.18);
      }
      :host(.collapsed) .head, :host(.ambient):not(.expanded) .head {
        height:30px;
        padding:0 8px;
        gap:6px;
        border-bottom:0;
      }
      :host(.collapsed) .titleBlock, :host(.ambient):not(.expanded) .titleBlock { display:none; }
      :host(.collapsed) .compactMark, :host(.ambient):not(.expanded) .compactMark { display:flex; }
      :host(.collapsed) .pill, :host(.ambient):not(.expanded) .pill {
        padding:3px 7px;
        font-size:9px;
        max-width:58px;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      :host(.collapsed) .mini, :host(.ambient):not(.expanded) .mini { opacity:0; }
      :host(.collapsed) .shell:hover .mini,
      :host(.ambient):not(.expanded) .shell:hover .mini,
      :host(.collapsed) .mini:focus-visible,
      :host(.ambient):not(.expanded) .mini:focus-visible { opacity:.9; }
      :host(.hidden) {
        visibility:hidden;
        pointer-events:none !important;
      }
      :host(.hidden) .shell {
        opacity:0;
        transform:translateY(-8px) scale(.98);
        pointer-events:none;
      }
      :host(.ambient) .shell { opacity: .92; }
      :host(.ambient) .subtitle { max-width: 120px; }
      :host(.minimal) .chartCard, :host(.minimal) .reasons { display:none; }
      :host(.reducedMotion) .shell,
      :host(.reducedMotion) .mini { transition: opacity .18s ease, transform .18s ease !important; }
    </style>
    <div class="shell">
      <div class="head" id="drag">
        <div class="compactMark"><span class="compactBrand">G</span><strong id="compactScore">0</strong></div>
        <div class="titleBlock"><div class="eyebrow">PAGE GUARDIAN</div><div class="subtitle" id="overlaySub">Quiet protection</div></div>
        <div class="controls" id="controls">
          <div class="pill" id="pill">CALM</div>
          <button class="mini" id="toggleCompact" title="Compact mode" aria-label="Compact mode">v</button>
          <button class="mini" id="toggleHide" title="Hide overlay" aria-label="Hide overlay">x</button>
        </div>
      </div>
      <div class="body">
        <div class="scoreCard">
          <div>
            <div class="score"><span id="score">0</span><small>/100</small></div>
            <div class="summary" id="summary">Checking this page quietly.</div>
          </div>
          <div class="ring"><span id="ringText">0</span></div>
        </div>
        <div class="grid">
          <div class="metric"><span>page changes</span><strong id="push">0</strong></div>
          <div class="metric"><span>history edits</span><strong id="replace">0</strong></div>
          <div class="metric"><span>back events</span><strong id="pop">0</strong></div>
          <div class="metric"><span>your actions</span><strong id="user">0</strong></div>
        </div>
      </div>
      <div class="chartCard">
        <div class="chartTitle"><h3>Recent activity</h3><span id="timelineMeta">0 events</span></div>
        <div class="timeline" id="timeline"></div>
      </div>
      <div class="chartCard">
        <div class="chartTitle"><h3>Page changes</h3><span>quiet view</span></div>
        <div class="heatmap" id="heatmap"></div>
      </div>
      <div class="reasons">
        <h3>What Guardian noticed</h3>
        <ul id="reasonsList"><li>No unusual behavior noticed yet.</li></ul>
      </div>
    </div>`;
  document.documentElement.appendChild(host);

  const $ = (id) => shadow.getElementById(id);
  const shell = shadow.querySelector('.shell');
  const drag = shadow.getElementById('drag');
  const controls = shadow.getElementById('controls');
  const toggleCompact = shadow.getElementById('toggleCompact');
  const toggleHide = shadow.getElementById('toggleHide');
  let hidden = false, compact = false, dragging = false, offsetX = 0, offsetY = 0, idleTimer = null;
  let manualOverrideUntil = 0;
  let currentOverlayMode = 'ambient';
  let currentRiskLabel = 'LOW';
  let lastReport = {};
  let storagePrefs = null;

  function cloneForOverlay(obj) {
    try { return structuredClone(obj); } catch (_) { return JSON.parse(JSON.stringify(obj || {})); }
  }

  function reportWithPrefs(prefs) {
    const report = cloneForOverlay(lastReport || {});
    report.v8 = { ...(report.v8 || {}), preferences: { ...(prefs || {}) } };
    if (prefs && prefs.autoShowOverlay === true && report.v8.overlayMode === 'hidden') {
      report.v8.overlayMode = 'ambient';
    }
    if (prefs && prefs.autoShowOverlay !== true && report.riskLabel !== 'HIGH') {
      report.v8.overlayMode = 'hidden';
    }
    return report;
  }

  function requestFreshReport() {
    try { window.postMessage({ __psrd: true, type: 'PSRD_REQUEST' }, '*'); } catch (_) {}
  }

  function setHidden(v) { hidden = !!v; host.classList.toggle('hidden', hidden); }
  function setCompact(v) {
    compact = !!v;
    host.classList.toggle('collapsed', compact);
    host.classList.toggle('expanded', !compact);
  }
  function markManualOverride(duration = 30000) { manualOverrideUntil = Date.now() + duration; }
  function revealOverlay(duration = 45000) {
    markManualOverride(duration);
    setHidden(false);
    setCompact(false);
    requestFreshReport();
  }
  controls.addEventListener('mousedown', (e) => e.stopPropagation());
  toggleCompact.addEventListener('click', (e) => { e.stopPropagation(); markManualOverride(); setCompact(!compact); });
  toggleHide.addEventListener('click', (e) => { e.stopPropagation(); markManualOverride(); setHidden(!hidden); });
  document.addEventListener('keydown', (e) => {
    // Alt+X: keep existing hide/show toggle
    if (e.altKey && e.key && e.key.toLowerCase() === 'x') {
      if (hidden) revealOverlay(); else { markManualOverride(); setHidden(true); }
    }
    // Ctrl+Alt+C: toggle compact mode (replaces Alt+C)
    if (e.ctrlKey && e.altKey && e.key && e.key.toLowerCase() === 'c') {
      markManualOverride();
      setCompact(!compact);
    }
    // Ctrl+Shift+G: reveal overlay (was Ctrl+Alt+G) — avoid conflicts (e.g., Google Drive)
    if (e.ctrlKey && e.shiftKey && e.key && e.key.toLowerCase() === 'g') {
      revealOverlay();
    }
  });
  drag.addEventListener('mousedown', (e) => { dragging = true; const rect = host.getBoundingClientRect(); offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top; e.preventDefault(); });
  window.addEventListener('mousemove', (e) => { if (!dragging) return; const x = Math.max(8, Math.min(window.innerWidth - shell.offsetWidth - 8, e.clientX - offsetX)); const y = Math.max(8, Math.min(window.innerHeight - shell.offsetHeight - 8, e.clientY - offsetY)); host.style.left = `${x}px`; host.style.top = `${y}px`; host.style.right = 'auto'; host.style.bottom = 'auto'; });
  window.addEventListener('mouseup', () => dragging = false);
  const resetIdle = () => {
    clearTimeout(idleTimer);
    if (currentRiskLabel === 'HIGH') return;
    const delay = 6000;
    idleTimer = setTimeout(() => {
      if (Date.now() < manualOverrideUntil) return;
      if (currentOverlayMode === 'ambient') setCompact(true);
      else if (currentOverlayMode === 'compact') setCompact(true);
    }, delay);
  };
  ['mousemove', 'mousedown', 'click', 'keydown', 'wheel', 'touchstart'].forEach((evt) => window.addEventListener(evt, resetIdle, { passive: true }));
  resetIdle();

  function updateVisual(report = {}) {
    const score = report.riskScore || 0;
    const label = report.riskLabel || 'LOW';
    const confidence = report.confidence || 0.35;
    const v8 = report.v8 || {};
    const prefs = { ...(storagePrefs || {}), ...((v8 && v8.preferences) || {}) };
    const cognition = v8.invisibleCognition || {};
    const emotional = v8.emotionalErgonomics || {};
    const minimalism = v8.cognitiveMinimalism || {};
    const colorMode = ['system', 'light', 'dark'].includes(prefs.colorMode) ? prefs.colorMode : 'system';
    const autoShowOverlay = prefs.autoShowOverlay === true;
    currentOverlayMode = v8.overlayMode || (label === 'HIGH' ? 'full' : 'ambient');
    currentRiskLabel = label;
    host.classList.toggle('theme-system', colorMode === 'system');
    host.classList.toggle('theme-light', colorMode === 'light');
    host.classList.toggle('theme-dark', colorMode === 'dark');
    $('score').textContent = score;
    $('ringText').textContent = score;
    $('compactScore').textContent = score;
    $('push').textContent = report.push || 0;
    $('replace').textContent = report.replace || 0;
    $('pop').textContent = report.pop || 0;
    $('user').textContent = report.userActions || 0;
    $('timelineMeta').textContent = `${(report.timeline || []).length} events`;
    let accent = '#4ade80'; let glow = 'rgba(74,222,128,.12)';
    if (label === 'HIGH') { accent = '#fb7185'; glow = 'rgba(251,113,133,.16)'; }
    else if (label === 'MED') { accent = '#fbbf24'; glow = 'rgba(251,191,36,.16)'; }
    $('overlaySub').textContent = minimalism.plainSummary || emotional.userMessage || cognition.quietForecast || 'Quiet protection';
    $('pill').textContent = label === 'HIGH' ? 'LOOK' : label === 'MED' ? 'CHECK' : 'CALM';
    $('pill').style.color = accent;
    $('pill').style.background = glow;
    $('pill').style.borderColor = `color-mix(in srgb, ${accent} 35%, transparent)`;
    const cognitionRevealed = prefs.revealCognition === true || prefs.expertDetail === true || label === 'HIGH';
    const summaryText = minimalism.groupedReason || emotional.userMessage || (cognitionRevealed && cognition.forecast ? cognition.forecast : (v8.cognitiveSummary || (label === 'HIGH' ? 'Strong page pressure noticed.' : label === 'MED' ? 'Unusual page behavior noticed.' : 'No unusual behavior noticed.')));
    $('summary').textContent = summaryText;
    shadow.querySelector('.ring').style.background = `radial-gradient(circle at center, var(--psg-ring-core) 54%, transparent 55%), conic-gradient(#1a73e8 0deg, ${accent} ${score * 3.6}deg, rgba(125,145,170,.16) ${score * 3.6}deg 360deg)`;
    const expertDetail = prefs.expertDetail === true || prefs.revealCognition === true || label === 'HIGH';
    const reasons = [];
    if (emotional.recoveryAction) reasons.push(emotional.recoveryAction);
    if (!expertDetail && minimalism.groupedReason) reasons.push(minimalism.groupedReason);
    if (expertDetail && cognition.behaviorCluster) reasons.push(`Behavior group: ${cognition.behaviorCluster}`);
    if (!expertDetail && v8.quietReason) reasons.push(v8.quietReason);
    if (expertDetail && (report.push || 0) >= 6) reasons.push(`Page changes: ${report.push}`);
    if (expertDetail && (report.pushWithoutAction || 0) >= 3) reasons.push('Page changed several times without a nearby action.');
    if (expertDetail && (report.bursts || 0) >= 1) reasons.push('A fast navigation burst was noticed.');
    if (expertDetail && (report.pop || 0) >= 3) reasons.push(`Back/forward events: ${report.pop}`);
    if (expertDetail && (report.fullscreen || 0) >= 1) reasons.push(`Fullscreen requests: ${report.fullscreen}`);
    if (expertDetail && (report.popup || 0) >= 1) reasons.push(`Popup opens: ${report.popup}`);
    if (expertDetail && (report.notification || 0) >= 1) reasons.push(`Notification prompts: ${report.notification}`);
    if (expertDetail && (report.clipboard || 0) >= 1) reasons.push(`Clipboard writes: ${report.clipboard}`);
    if (expertDetail && (report.historyLength || 0) > 80) reasons.push(`Browser history length: ${report.historyLength}`);
    if (expertDetail) (report.notes || []).slice(0, 3).forEach((n) => reasons.push(n));
    const list = $('reasonsList'); list.innerHTML = '';
    if (!reasons.length) { const li = document.createElement('li'); li.textContent = 'No unusual behavior noticed yet.'; list.appendChild(li); }
    else reasons.slice(0, 5).forEach((r) => { const li = document.createElement('li'); li.textContent = r; list.appendChild(li); });
    const timeline = report.timeline || [];
    const buckets = Array(24).fill(0);
    const start = timeline.length ? timeline[0].t : Date.now();
    const end = timeline.length ? timeline[timeline.length - 1].t : start + 1;
    const span = Math.max(1, end - start);
    timeline.forEach((item) => { const idx = Math.min(23, Math.floor(((item.t - start) / span) * 24)); buckets[idx] += item.type === 'pushState' ? 2 : 1; });
    renderBars($('timeline'), buckets);
    renderBars($('heatmap'), report.heatmapBuckets || Array(12).fill(0));
    host.classList.toggle('ambient', currentOverlayMode === 'ambient' || currentOverlayMode === 'hidden');
    host.classList.toggle('minimal', !expertDetail);
    host.classList.toggle('reducedMotion', (v8.adaptiveCalmness && v8.adaptiveCalmness.interruptibility === 'low') || (emotional.fatigueScore || 0) > 55);
    if (!autoShowOverlay && label !== 'HIGH' && Date.now() >= manualOverrideUntil) {
      setHidden(true);
      setCompact(true);
      return;
    }
    if (currentOverlayMode === 'hidden' && label !== 'HIGH' && Date.now() >= manualOverrideUntil) {
      setHidden(true);
      setCompact(true);
      return;
    }
    if (Date.now() >= manualOverrideUntil || label === 'HIGH') {
      if (currentOverlayMode === 'full' || label === 'HIGH') {
        setHidden(false);
        setCompact(false);
      } else {
        setHidden(false);
        setCompact(true);
      }
    }
  }
  function renderBars(container, values) {
    container.innerHTML = '';
    const maxValue = Math.max(1, ...values);
    values.forEach((v) => {
      const el = document.createElement('div');
      el.className = container.id === 'timeline' ? 'bar' : 'cell';
      if (container.id === 'timeline') {
        const h = Math.max(4, Math.round((v / maxValue) * 16));
        el.style.height = `${h}px`;
        el.style.background = v > 0 ? 'linear-gradient(180deg, rgba(34,211,238,.85), rgba(139,92,246,.85))' : 'rgba(148,163,184,.12)';
      } else {
        const a = Math.min(1, v / maxValue);
        el.style.background = v > 0 ? `rgba(34,211,238,${0.12 + a * 0.75})` : 'rgba(148,163,184,.10)';
      }
      container.appendChild(el);
    });
  }

  function handlePrefsUpdate(prefs = {}) {
    storagePrefs = { ...(storagePrefs || {}), ...(prefs || {}) };
    updateVisual(reportWithPrefs(storagePrefs));
    resetIdle();
    requestFreshReport();
  }

  function initOverlayStateFromStorage() {
    try {
      if (typeof chrome !== 'undefined' && chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['psgV8Prefs'], (data) => {
          storagePrefs = data && data.psgV8Prefs ? data.psgV8Prefs : null;
          updateVisual(reportWithPrefs(storagePrefs || {}));
          resetIdle();
          requestFreshReport();
        });

        if (chrome.storage.onChanged && chrome.storage.onChanged.addListener) {
          chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local' || !changes.psgV8Prefs) return;
            handlePrefsUpdate(changes.psgV8Prefs.newValue || {});
          });
        }
        return;
      }
    } catch (_) {}
    updateVisual({});
    resetIdle();
    requestFreshReport();
  }

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.__psrd !== true) return;
    if (e.data.type === 'PSRD_UPDATE') {
      lastReport = cloneForOverlay(e.data.payload || {});
      updateVisual(lastReport);
      resetIdle();
    } else if (e.data.type === 'PSRD_OVERLAY_COMMAND') {
      const payload = e.data.payload || {};
      if (payload.reveal === true) {
        revealOverlay(payload.duration || 45000);
      } else if (typeof payload.hiddenOverlay === 'boolean') {
        markManualOverride(payload.duration || 30000);
        setHidden(payload.hiddenOverlay);
        if (typeof payload.compactOverlay === 'boolean') setCompact(payload.compactOverlay);
      }
    }
  });
  initOverlayStateFromStorage();
  // Heartbeat: periodically report overlay health to the background for diagnostics
  try {
    const sendHeartbeat = () => {
      try {
        const rect = host.getBoundingClientRect();
        const s = getComputedStyle(host);
        const payload = {
          hidden: !!hidden,
          compact: !!compact,
          overlayMode: currentOverlayMode,
          riskLabel: currentRiskLabel,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          style: {
            display: s.display,
            visibility: s.visibility,
            opacity: parseFloat(s.opacity || '0'),
            zIndex: parseInt(s.zIndex || '0', 10)
          },
          devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
          viewport: { w: window.innerWidth, h: window.innerHeight },
          ts: Date.now()
        };
        if (typeof chrome !== 'undefined' && chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'PSRD_HEARTBEAT', payload }, () => {});
        }
      } catch (e) {}
    };
    // conservative heartbeat interval to reduce storage/noise
    sendHeartbeat();
    setInterval(sendHeartbeat, 15000);
  } catch (e) {}
})();
