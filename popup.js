const DEFAULT_V8_PREFS = {
  ambientMode: true,
  quietMode: true,
  expertDetail: false,
  revealCognition: false,
  emotionalSupport: true,
  adaptiveCalmness: true,
  autoShowOverlay: false,
  colorMode: 'system',
  calmnessLevel: 'balanced'
};

const DEFAULT_REPORT = {
  startedAt: Date.now(),
  push: 0,
  replace: 0,
  pop: 0,
  fullscreen: 0,
  popup: 0,
  notification: 0,
  clipboard: 0,
  userActions: 0,
  pushWithoutAction: 0,
  bursts: 0,
  historyLength: 0,
  timeline: [],
  heatmapBuckets: Array(12).fill(0),
  fingerprints: [],
  notes: [],
  confidence: 0.35,
  riskScore: 0,
  riskLabel: 'LOW',
  trustMode: 'unknown',
  domainHost: '',
  v8: {
    version: '8.4.1',
    preferences: { ...DEFAULT_V8_PREFS },
    ambientState: 'coexisting',
    overlayMode: 'ambient',
    visibleUrgency: 'quiet',
    calmnessScore: 100,
    attentionBudget: 6,
    quietReason: 'Low-risk activity is handled as ambient protection.',
    cognitiveSummary: 'Behavioral cognition is running silently with no disruptive pattern.',
    compressedSummary: 'Ambient protection active.',
    hiddenAuditTrail: [],
    invisibleCognition: {
      active: true,
      revealMode: false,
      behaviorCluster: 'baseline',
      clusterConfidence: 0.35,
      trajectory: 'stable',
      forecast: 'No disruptive navigation pattern is expected.',
      quietForecast: 'Stable browsing.',
      explanation: 'Cognition is observing locally and will explain itself on demand.',
      privacyBoundary: 'local-session-only',
      lastEvaluatedAt: Date.now()
    },
    emotionalErgonomics: {
      active: true,
      tone: 'steady',
      warningIntensity: 'none',
      userMessage: 'Everything looks calm right now.',
      reassurance: 'Protection is active in the background.',
      recoveryAction: 'Continue browsing normally.',
      timing: 'ambient',
      fatigueScore: 0,
      autonomyReminder: 'You can reveal details or change calmness at any time.',
      escalationTemplate: 'calm-background',
      safetyReview: 'copy-safe'
    },
    adaptiveCalmness: {
      active: true,
      quietHoursActive: false,
      trustContinuityScore: 0,
      siteCalmProfile: 'new-site',
      alertCooldownUntil: 0,
      mitigationSoftness: 'ambient',
      learnedPreference: 'balanced',
      interruptibility: 'available',
      explanation: 'Adaptive calmness is balancing current risk, fatigue, and local site history.',
      quietHoursReason: 'Normal hours.',
      localProfile: {
        host: '',
        visits: 0,
        benignVisits: 0,
        averageRisk: 0,
        lastSeen: 0
      }
    },
    cognitiveMinimalism: {
      active: true,
      minimalSurfaceMode: true,
      detailLevel: 'minimal',
      plainSummary: 'This page looks calm.',
      groupedReason: 'No unusual page behavior noticed.',
      surfaceDensity: 'quiet',
      progressiveDetail: true,
      expertDetailAvailable: true,
      themeMode: 'system',
      overlayAutoShow: false,
      explanation: 'Guardian keeps the interface quiet and keeps details available on demand.'
    }
  }
};

let currentTabId = null;
let currentPrefs = { ...DEFAULT_V8_PREFS };
let lastReport = { ...DEFAULT_REPORT };

function normalizeV8Prefs(prefs = {}) {
  const calmnessLevel = ['calm', 'balanced', 'direct'].includes(prefs.calmnessLevel) ? prefs.calmnessLevel : DEFAULT_V8_PREFS.calmnessLevel;
  const colorMode = ['system', 'light', 'dark'].includes(prefs.colorMode) ? prefs.colorMode : DEFAULT_V8_PREFS.colorMode;
  return {
    ambientMode: prefs.ambientMode !== false,
    quietMode: prefs.quietMode !== false,
    expertDetail: prefs.expertDetail === true,
    revealCognition: prefs.revealCognition === true,
    emotionalSupport: prefs.emotionalSupport !== false,
    adaptiveCalmness: prefs.adaptiveCalmness !== false,
    autoShowOverlay: prefs.autoShowOverlay === true,
    colorMode,
    calmnessLevel
  };
}

function mergeReport(report) {
  const merged = { ...DEFAULT_REPORT, ...(report || {}) };
  merged.v8 = { ...DEFAULT_REPORT.v8, ...((report && report.v8) || {}) };
  merged.v8.preferences = normalizeV8Prefs(merged.v8.preferences || currentPrefs);
  merged.v8.invisibleCognition = { ...DEFAULT_REPORT.v8.invisibleCognition, ...(merged.v8.invisibleCognition || {}) };
  merged.v8.emotionalErgonomics = { ...DEFAULT_REPORT.v8.emotionalErgonomics, ...(merged.v8.emotionalErgonomics || {}) };
  merged.v8.adaptiveCalmness = { ...DEFAULT_REPORT.v8.adaptiveCalmness, ...(merged.v8.adaptiveCalmness || {}) };
  merged.v8.cognitiveMinimalism = { ...DEFAULT_REPORT.v8.cognitiveMinimalism, ...(merged.v8.cognitiveMinimalism || {}) };
  return merged;
}

function calcScore(report) {
  const base =
    Math.min((report.push || 0) * 2, 24) +
    Math.min((report.replace || 0) * 1.2, 10) +
    Math.min((report.pop || 0) * 6, 18) +
    Math.min((report.pushWithoutAction || 0) * 8, 28) +
    Math.min((report.bursts || 0) * 12, 20) +
    Math.min((report.fullscreen || 0) * 12, 20) +
    Math.min((report.popup || 0) * 10, 16) +
    Math.min((report.notification || 0) * 10, 18) +
    Math.min((report.clipboard || 0) * 8, 12) +
    ((report.userActions || 0) === 0 && ((report.push || 0) + (report.replace || 0)) >= 3 ? 18 : 0) +
    ((report.historyLength || 0) > 80 ? 6 : 0);

  let score = Math.round(base);
  if (report.trustMode === 'trusted') score = Math.round(score * 0.55);
  if (report.trustMode === 'ignored') score = Math.round(score * 0.15);
  if (report.trustMode === 'suspicious') score = Math.min(100, Math.round(score * 1.1));
  return Math.max(0, Math.min(100, score));
}

function calcConfidence(report) {
  let c = 0.35;
  if ((report.pushWithoutAction || 0) >= 3) c += 0.12;
  if ((report.bursts || 0) >= 1) c += 0.14;
  if ((report.popup || 0) >= 1) c += 0.08;
  if ((report.fullscreen || 0) >= 1) c += 0.10;
  if ((report.notification || 0) >= 1) c += 0.10;
  if ((report.fingerprints || []).length) c += Math.min(0.18, (report.fingerprints || []).length * 0.04);
  if (report.trustMode === 'trusted') c -= 0.10;
  if (report.trustMode === 'ignored') c -= 0.18;
  return Math.max(0.05, Math.min(0.99, c));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function applyTheme(score, label) {
  const badge = document.getElementById('riskBadge');
  const ringFill = document.getElementById('ringFill');
  const status = document.getElementById('statusText');

  let accent = '#1f8a55';
  let border = 'rgba(31, 138, 85, 0.24)';
  let fillBg = 'rgba(31, 138, 85, 0.12)';
  let badgeLabel = 'CALM';
  let statusText = 'Quiet';

  if (score >= 70) {
    accent = '#ba1a1a';
    border = 'rgba(186, 26, 26, 0.28)';
    fillBg = 'rgba(186, 26, 26, 0.12)';
    badgeLabel = 'LOOK';
    statusText = 'Needs attention';
  } else if (score >= 40) {
    accent = '#a66700';
    border = 'rgba(166, 103, 0, 0.28)';
    fillBg = 'rgba(166, 103, 0, 0.13)';
    badgeLabel = 'CHECK';
    statusText = 'Quiet review';
  }

  badge.textContent = badgeLabel;
  badge.style.background = fillBg;
  badge.style.borderColor = border;
  badge.style.color = accent;
  status.textContent = statusText;
  if (ringFill) ringFill.style.background = `conic-gradient(#1a73e8 0deg, ${accent} ${score * 3.6}deg, rgba(125,145,170,0.18) ${score * 3.6}deg 360deg)`;
}

function buildReasons(report) {
  const prefs = report.v8.preferences;
  const minimalism = report.v8.cognitiveMinimalism || DEFAULT_REPORT.v8.cognitiveMinimalism;
  const reasons = [];
  if ((report.push || 0) >= 6) reasons.push(`The page changed browser history ${report.push} times.`);
  if ((report.pushWithoutAction || 0) >= 3) reasons.push('The page changed history several times without a nearby action.');
  if ((report.bursts || 0) >= 1) reasons.push('A fast navigation burst was noticed.');
  if ((report.pop || 0) >= 3) reasons.push(`Back/forward events repeated ${report.pop} times.`);
  if ((report.fullscreen || 0) >= 1) reasons.push(`Fullscreen requests: ${report.fullscreen}`);
  if ((report.popup || 0) >= 1) reasons.push(`Popup opens: ${report.popup}`);
  if ((report.notification || 0) >= 1) reasons.push(`Notification prompts: ${report.notification}`);
  if ((report.clipboard || 0) >= 1) reasons.push(`Clipboard writes: ${report.clipboard}`);
  if ((report.historyLength || 0) > 80) reasons.push(`Browser history is unusually long: ${report.historyLength}`);
  if (Array.isArray(report.notes)) reasons.push(...report.notes.slice(0, 3));

  if (!reasons.length) return [minimalism.groupedReason || report.v8.compressedSummary || 'No unusual behavior noticed.'];
  return prefs.expertDetail ? reasons.slice(0, 6) : reasons.slice(0, 3);
}

function renderBars(container, values) {
  container.innerHTML = '';
  const maxValue = Math.max(1, ...values);
  values.forEach((v) => {
    const el = document.createElement('div');
    el.className = container.id === 'timeline' ? 'bar' : 'cell';
    if (container.id === 'timeline') {
      const h = Math.max(4, Math.round((v / maxValue) * 14));
      el.style.height = `${h}px`;
      el.style.background = v > 0 ? 'linear-gradient(180deg, rgba(26,115,232,.85), rgba(115,86,191,.85))' : 'rgba(125,145,170,.16)';
    } else {
      const a = Math.min(1, v / maxValue);
      el.style.background = v > 0 ? `rgba(26,115,232,${0.12 + a * 0.70})` : 'rgba(125,145,170,.14)';
    }
    container.appendChild(el);
  });
}

function renderAudit(report) {
  const auditEl = document.getElementById('auditTrail');
  auditEl.innerHTML = '';
  const entries = (report.v8.hiddenAuditTrail || []).slice(-6).reverse();
  if (!entries.length) {
    const li = document.createElement('li');
    li.textContent = 'No background notes yet.';
    auditEl.appendChild(li);
    return;
  }
  entries.forEach((entry) => {
    const li = document.createElement('li');
    const time = new Date(entry.t || Date.now()).toLocaleTimeString();
    li.textContent = `${time} - ${entry.type}: ${entry.detail || 'updated'}`;
    auditEl.appendChild(li);
  });
}

function loadDiagnostics() {
  try {
    chrome.storage.local.get(null, (data) => {
      const arr = (data && data.psrdDiagnostics) || [];
      const list = document.getElementById('diagnosticsList');
      if (!list) return;
      list.innerHTML = '';
      if (!arr.length) {
        const li = document.createElement('li');
        li.textContent = 'No diagnostics recorded.';
        list.appendChild(li);
      } else {
        arr.slice(-8).reverse().forEach((entry) => {
          const li = document.createElement('li');
          li.className = 'diag-entry';
          const t = document.createElement('div');
          t.className = 'diag-time';
          t.textContent = new Date(entry.ts || Date.now()).toLocaleString();
          const k = document.createElement('div');
          k.className = 'diag-kind';
          k.textContent = entry.type || entry.kind || entry.kind || 'diag';
          const p = document.createElement('pre');
          p.className = 'diag-msg';
          p.textContent = entry.error || entry.info || JSON.stringify(entry, null, 2);
          li.appendChild(t);
          li.appendChild(k);
          li.appendChild(p);
          list.appendChild(li);
        });
      }

      // Populate per-tab reports dropdown
      try {
        const select = document.getElementById('diagTabSelect');
        if (select) {
          select.innerHTML = '';
          const defaultOpt = document.createElement('option');
          defaultOpt.value = '';
          defaultOpt.textContent = 'Select tab report...';
          select.appendChild(defaultOpt);
          Object.keys(data || {}).forEach((k) => {
            if (k && k.indexOf('psrdLatestReport_') === 0) {
              const tabId = k.slice('psrdLatestReport_'.length);
              const rpt = data[k];
              const host = (rpt && rpt.domainHost) || (rpt && rpt.v8 && rpt.v8.domainHost) || '';
              const label = host ? `Tab ${tabId} — ${host}` : `Tab ${tabId}`;
              const opt = document.createElement('option');
              opt.value = tabId;
              opt.textContent = label;
              select.appendChild(opt);
            }
          });
        }
      } catch (e) {
        // ignore select population errors
      }
    });
  } catch (e) {
    // ignore
  }
}

function clearDiagnostics() {
  try {
    chrome.storage.local.set({ psrdDiagnostics: [] }, () => {
      loadDiagnostics();
    });
  } catch (e) { }
}

let _diagMsgTimer = null;
function showDiagMessage(msg, type = 'info', timeout = 4000) {
  try {
    const el = document.getElementById('diagMessage');
    if (!el) {
      console.warn(msg);
      return;
    }
    el.textContent = msg;
    el.classList.remove('show', 'success', 'error', 'info');
    if (type === 'success') el.classList.add('success');
    else if (type === 'error') el.classList.add('error');
    else el.classList.add('info');
    el.classList.add('show');
    if (_diagMsgTimer) clearTimeout(_diagMsgTimer);
    _diagMsgTimer = setTimeout(() => { el.classList.remove('show'); _diagMsgTimer = null; }, timeout);
  } catch (e) {
    console.warn(msg, e);
  }
}

function exportDiagnostics() {
  try {
    chrome.storage.local.get(null, (data) => {
      const arr = data.psrdDiagnostics || [];
      const perTabReports = {};
      Object.keys(data).forEach((k) => {
        if (k && k.indexOf('psrdLatestReport_') === 0) {
          const tabId = k.slice('psrdLatestReport_'.length);
          perTabReports[tabId] = data[k];
        }
      });
      const payload = {
        exportedAt: new Date().toISOString(),
        diagnostics: arr,
        perTabReports
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      showExportSpinner(true);
      chrome.downloads.download({ url, filename: `pushstate-guardian-diagnostics-${Date.now()}.json`, saveAs: true }, (downloadId) => {
        showExportSpinner(false);
        if (chrome.runtime.lastError) showDiagMessage('Export failed: ' + chrome.runtime.lastError.message, 'error');
        else showDiagMessage('Diagnostics export started', 'success');
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      });
    });
  } catch (e) {
    console.warn('exportDiagnostics failed', e);
  }
}

function showExportSpinner(on) {
  try {
    const s = document.getElementById('diagSpinner');
    if (!s) return;
    if (on) s.classList.add('active');
    else s.classList.remove('active');
  } catch (e) { }
}

let activeColorModeClass = '';

function applyColorMode(mode) {
  const normalized = ['system', 'light', 'dark'].includes(mode) ? mode : 'system';
  const nextClass = `theme-${normalized}`;
  if (activeColorModeClass === nextClass && document.body.classList.contains(nextClass)) return;
  const preserved = Array.from(document.body.classList).filter((className) => !className.startsWith('theme-'));
  document.body.className = preserved.concat(nextClass).join(' ');
  activeColorModeClass = nextClass;
}

function renderControls(prefs) {
  document.getElementById('ambientMode').checked = prefs.ambientMode;
  document.getElementById('quietMode').checked = prefs.quietMode;
  document.getElementById('expertDetail').checked = prefs.expertDetail;
  document.getElementById('revealCognition').checked = prefs.revealCognition;
  document.getElementById('emotionalSupport').checked = prefs.emotionalSupport;
  document.getElementById('adaptiveCalmness').checked = prefs.adaptiveCalmness;
  document.getElementById('autoShowOverlay').checked = prefs.autoShowOverlay;
  document.getElementById('colorMode').value = prefs.colorMode;
  document.getElementById('calmnessLevel').value = prefs.calmnessLevel;
}

function renderCognition(report) {
  const cognition = report.v8.invisibleCognition || DEFAULT_REPORT.v8.invisibleCognition;
  const revealMode = cognition.revealMode || report.v8.preferences.revealCognition || report.v8.preferences.expertDetail;
  document.body.classList.toggle('cognition-on', revealMode);
  setText('cognitionMode', revealMode ? 'shown' : 'quiet');
  setText('cognitionForecast', revealMode ? cognition.forecast : cognition.quietForecast);
  setText('cognitionCluster', cognition.behaviorCluster || 'baseline');
  setText('cognitionTrajectory', cognition.trajectory || 'stable');
  setText('cognitionExplanation', report.v8.preferences.expertDetail ? `${cognition.explanation} Boundary: ${cognition.privacyBoundary || 'local-session-only'}.` : cognition.explanation);
}

function renderEmotionalErgonomics(report) {
  const emotional = report.v8.emotionalErgonomics || DEFAULT_REPORT.v8.emotionalErgonomics;
  setText('toneChip', emotional.tone || 'steady');
  setText('emotionalMessage', emotional.userMessage || 'Everything looks calm right now.');
  setText('recoveryAction', `${emotional.reassurance || ''} ${emotional.recoveryAction || ''}`.trim());
  setText('warningIntensity', emotional.warningIntensity === 'none' ? 'No interruption' : `${emotional.warningIntensity} interruption`);
  setText('fatigueScore', `Fatigue ${Math.round(emotional.fatigueScore || 0)}`);
}

function renderAdaptiveCalmness(report) {
  const adaptive = report.v8.adaptiveCalmness || DEFAULT_REPORT.v8.adaptiveCalmness;
  setText('softnessChip', adaptive.mitigationSoftness || 'ambient');
  setText('adaptiveExplanation', adaptive.explanation || 'Adaptive calmness is balancing current risk, fatigue, and local site history.');
  setText('trustContinuity', Math.round(adaptive.trustContinuityScore || 0));
  setText('interruptibility', adaptive.interruptibility || 'available');
  setText('siteCalmProfile', adaptive.siteCalmProfile || 'new-site');
  setText('quietHours', adaptive.quietHoursActive ? 'quiet hours' : 'normal hours');
}

function renderCognitiveMinimalism(report) {
  const minimalism = report.v8.cognitiveMinimalism || DEFAULT_REPORT.v8.cognitiveMinimalism;
  setText('surfaceSummary', minimalism.explanation || 'Guardian keeps the interface quiet and keeps details available on demand.');
  setText('detailLevel', minimalism.detailLevel || 'minimal');
  setText('surfaceDensity', minimalism.surfaceDensity || 'quiet');
  setText('themeStatus', minimalism.themeMode || report.v8.preferences.colorMode || 'system');
  setText('overlayAutoShow', minimalism.overlayAutoShow ? 'overlay can appear' : 'manual overlay');
}

let renderRaf = 0;
let queuedReport = null;

function renderNow(reportInput) {
  const report = mergeReport(reportInput);
  const score = report.riskScore ?? calcScore(report);
  const confidence = report.confidence ?? calcConfidence(report);
  const prefs = report.v8.preferences;
  const minimalism = report.v8.cognitiveMinimalism || DEFAULT_REPORT.v8.cognitiveMinimalism;
  currentPrefs = { ...prefs };
  lastReport = report;

  applyColorMode(prefs.colorMode);
  document.body.classList.toggle('expert-on', prefs.expertDetail);
  document.body.classList.toggle('quiet-on', prefs.quietMode);

  setText('riskScore', score);
  setText('ringText', score);
  setText('pushState', report.push || 0);
  setText('replaceState', report.replace || 0);
  setText('popstate', report.pop || 0);
  setText('userInteractions', report.userActions || 0);
  setText('fullscreen', report.fullscreen || 0);
  setText('popupNotification', (report.popup || 0) + (report.notification || 0));
  setText('riskSummary', minimalism.plainSummary || report.v8.emotionalErgonomics.userMessage || 'Checking this page quietly.');
  setText('confidenceChip', `steady ${(confidence * 100).toFixed(0)}%`);
  setText('trustChip', report.trustMode || 'unknown');
  setText('ambientStatus', report.v8.ambientState || 'coexisting');
  setText('coexistenceSummary', `${minimalism.groupedReason || report.v8.compressedSummary} ${report.v8.quietReason || ''}`.trim());
  setText('calmnessScore', `Calm ${Math.round(report.v8.calmnessScore ?? 100)}`);
  setText('overlayMode', report.v8.overlayMode === 'hidden' ? 'Overlay manual' : `Overlay ${report.v8.overlayMode || 'ambient'}`);
  applyTheme(score, report.riskLabel);
  renderControls(prefs);
  renderCognitiveMinimalism(report);
  renderCognition(report);
  renderEmotionalErgonomics(report);
  renderAdaptiveCalmness(report);

  const reasonsEl = document.getElementById('reasons');
  reasonsEl.innerHTML = '';
  buildReasons(report).forEach((r) => {
    const li = document.createElement('li');
    li.textContent = r;
    reasonsEl.appendChild(li);
  });
  renderAudit(report);

  const timeline = report.timeline || [];
  const buckets = Array(24).fill(0);
  const start = timeline.length ? timeline[0].t : Date.now();
  const end = timeline.length ? timeline[timeline.length - 1].t : start + 1;
  const span = Math.max(1, end - start);
  timeline.forEach((item) => {
    const idx = Math.min(23, Math.floor(((item.t - start) / span) * 24));
    buckets[idx] += item.type === 'pushState' ? 2 : 1;
  });
  renderBars(document.getElementById('timeline'), buckets);
}

function render(reportInput) {
  queuedReport = reportInput;
  if (renderRaf) return;
  renderRaf = requestAnimationFrame(() => {
    renderRaf = 0;
    const nextReport = queuedReport;
    queuedReport = null;
    renderNow(nextReport);
  });
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0] ? tabs[0] : null));
  });
}

function requestReport(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'PSRD_GET_REPORT' }, (response) => {
      if (chrome.runtime.lastError || !response) resolve(null);
      else resolve(response.report || null);
    });
  });
}

function loadTrustDB() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['psrdTrustDB'], (data) => resolve(data.psrdTrustDB || { trusted: {}, ignored: {}, suspicious: {} }));
  });
}

function saveTrustDB(db) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ psrdTrustDB: db }, () => resolve());
  });
}

function loadV8Prefs() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['psgV8Prefs'], (data) => resolve(normalizeV8Prefs(data.psgV8Prefs || DEFAULT_V8_PREFS)));
  });
}

function saveV8Prefs(prefs) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ psgV8Prefs: normalizeV8Prefs(prefs) }, () => resolve());
  });
}

function sendV8Prefs(tabId, prefs) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'PSG_V8_SET_PREFS', preferences: normalizeV8Prefs(prefs) }, (response) => {
      if (chrome.runtime.lastError || !response) resolve(null);
      else resolve(response.report || null);
    });
  });
}

async function updateV8Prefs(patch) {
  currentPrefs = normalizeV8Prefs({ ...currentPrefs, ...patch });
  await saveV8Prefs(currentPrefs);
  if (currentTabId != null) {
    const report = await sendV8Prefs(currentTabId, currentPrefs);
    if (report) {
      render(report);
      return;
    }
  }
  render({ ...lastReport, v8: { ...lastReport.v8, preferences: currentPrefs } });
}

async function showOverlayManually() {
  let tabId = currentTabId;
  if (tabId == null) {
    const tab = await getActiveTab();
    tabId = tab && typeof tab.id === 'number' ? tab.id : null;
  }
  if (tabId == null) return;
  chrome.tabs.sendMessage(tabId, {
    type: 'PSRD_SET_OVERLAY_MODE',
    hiddenOverlay: false,
    compactOverlay: false
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('showOverlayManually: sendMessage failed:', chrome.runtime.lastError.message);
    }
    refresh();
  });
}

async function updateTrust(host, action) {
  const db = await loadTrustDB();
  const now = Date.now();
  if (action === 'trust') {
    db.trusted[host] = { updated: now };
    delete db.ignored[host];
  } else if (action === 'ignore') {
    db.ignored[host] = { updated: now };
  } else if (action === 'false_positive') {
    db.suspicious[host] = db.suspicious[host] || { falsePositiveCount: 0, updated: now };
    db.suspicious[host].falsePositiveCount = (db.suspicious[host].falsePositiveCount || 0) + 1;
    db.suspicious[host].updated = now;
  }
  await saveTrustDB(db);
  if (currentTabId != null) {
    chrome.tabs.sendMessage(currentTabId, { type: 'PSRD_TRUST_REFRESH' }, (resp) => {
      if (chrome.runtime.lastError) console.warn('updateTrust: PSRD_TRUST_REFRESH failed:', chrome.runtime.lastError.message);
    });
  }
  await refresh();
}

async function downloadJSON(report) {
  const payload = {
    generatedAt: new Date().toISOString(),
    report,
    score: calcScore(report),
    confidence: calcConfidence(report),
    v8Preferences: currentPrefs
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  showExportSpinner(true);
  chrome.downloads.download({ url, filename: `pushstate-guardian-v8-4-audit-${Date.now()}.json`, saveAs: true }, (downloadId) => {
    showExportSpinner(false);
    if (chrome.runtime.lastError) showDiagMessage('Export failed: ' + chrome.runtime.lastError.message, 'error');
    else showDiagMessage('Audit export started', 'success');
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  });
}

async function refresh() {
  currentPrefs = await loadV8Prefs();
  const tab = await getActiveTab();
  if (!tab || typeof tab.id !== 'number') {
    render({ ...DEFAULT_REPORT, v8: { ...DEFAULT_REPORT.v8, preferences: currentPrefs } });
    return;
  }
  currentTabId = tab.id;
  const report = await requestReport(tab.id);
  render(report ? mergeReport(report) : { ...DEFAULT_REPORT, v8: { ...DEFAULT_REPORT.v8, preferences: currentPrefs } });

  try {
    const host = new URL(tab.url || '').hostname;
    document.getElementById('trustBtn').onclick = () => updateTrust(host, 'trust');
    document.getElementById('ignoreBtn').onclick = () => updateTrust(host, 'ignore');
    document.getElementById('fpBtn').onclick = () => updateTrust(host, 'false_positive');
  } catch (_) {}
}

document.getElementById('refreshBtn').addEventListener('click', refresh);
document.getElementById('exportBtn').addEventListener('click', () => downloadJSON(lastReport));
document.getElementById('showOverlayBtn').addEventListener('click', showOverlayManually);
document.getElementById('ambientMode').addEventListener('change', (e) => updateV8Prefs({ ambientMode: e.target.checked }));
document.getElementById('quietMode').addEventListener('change', (e) => updateV8Prefs({ quietMode: e.target.checked }));
document.getElementById('expertDetail').addEventListener('change', (e) => updateV8Prefs({ expertDetail: e.target.checked }));
document.getElementById('revealCognition').addEventListener('change', (e) => updateV8Prefs({ revealCognition: e.target.checked }));
document.getElementById('emotionalSupport').addEventListener('change', (e) => updateV8Prefs({ emotionalSupport: e.target.checked }));
document.getElementById('adaptiveCalmness').addEventListener('change', (e) => updateV8Prefs({ adaptiveCalmness: e.target.checked }));
document.getElementById('autoShowOverlay').addEventListener('change', (e) => updateV8Prefs({ autoShowOverlay: e.target.checked }));
document.getElementById('colorMode').addEventListener('change', (e) => updateV8Prefs({ colorMode: e.target.value }));
document.getElementById('calmnessLevel').addEventListener('change', (e) => updateV8Prefs({ calmnessLevel: e.target.value }));

// Diagnostics UI
document.getElementById('diagRefreshBtn')?.addEventListener('click', loadDiagnostics);
document.getElementById('diagClearBtn')?.addEventListener('click', clearDiagnostics);
document.getElementById('diagExportBtn')?.addEventListener('click', exportDiagnostics);
document.getElementById('diagExportTabBtn')?.addEventListener('click', () => {
  const select = document.getElementById('diagTabSelect');
  if (!select) return;
  const tabId = select.value;
  if (!tabId) {
    showDiagMessage('Please select a tab report to export.', 'error');
    return;
  }
  chrome.storage.local.get([`psrdLatestReport_${tabId}`], (data) => {
    const report = data[`psrdLatestReport_${tabId}`] || null;
    if (!report) {
      showDiagMessage('No report found for tab ' + tabId, 'error');
      return;
    }
    try {
      const payload = { exportedAt: new Date().toISOString(), tabId, report };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `pushstate-guardian-report-tab-${tabId}-${Date.now()}.json`;
      showExportSpinner(true);
      chrome.downloads.download({ url, filename, saveAs: true }, (downloadId) => {
        showExportSpinner(false);
        if (chrome.runtime.lastError) showDiagMessage('Export failed: ' + chrome.runtime.lastError.message, 'error');
        else showDiagMessage('Tab report export started', 'success');
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      });
    } catch (e) {
      console.warn('export selected tab failed', e);
      showDiagMessage('Export failed', 'error');
    }
  });
});

// Copy selected tab report to clipboard
document.getElementById('diagCopyTabBtn')?.addEventListener('click', () => {
  const select = document.getElementById('diagTabSelect');
  if (!select) return;
  const tabId = select.value;
  if (!tabId) {
    showDiagMessage('Please select a tab report to copy.', 'error');
    return;
  }
  chrome.storage.local.get([`psrdLatestReport_${tabId}`], (data) => {
    const report = data[`psrdLatestReport_${tabId}`] || null;
    if (!report) {
      showDiagMessage('No report found for tab ' + tabId, 'error');
      return;
    }
    const payload = { exportedAt: new Date().toISOString(), tabId, report };
    const json = JSON.stringify(payload, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(() => {
        showDiagMessage('Report copied to clipboard', 'success');
      }).catch((err) => {
        console.warn('clipboard.writeText failed', err);
        showDiagMessage('Copy failed', 'error');
      });
    } else {
      try {
        const ta = document.createElement('textarea');
        ta.value = json;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showDiagMessage('Report copied to clipboard', 'success');
      } catch (e) {
        console.warn('clipboard fallback failed', e);
        showDiagMessage('Copy failed', 'error');
      }
    }
  });
});

// Load diagnostics once on open
loadDiagnostics();

// Populate help shortcut labels (keep in sync with overlay.js key handlers)
(() => {
  const revealShortcut = 'Ctrl+Shift+G';
  const compactShortcut = 'Ctrl+Alt+C';
  const hideShortcut = 'Alt+X';
  const elReveal = document.getElementById('shortcutReveal');
  const elCompact = document.getElementById('shortcutCompact');
  const elHide = document.getElementById('shortcutHide');
  if (elReveal) elReveal.textContent = revealShortcut;
  if (elCompact) elCompact.textContent = compactShortcut;
  if (elHide) elHide.textContent = hideShortcut;
})();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'PSRD_REPORT_PUSH' && msg.report) {
    render(msg.report);
  }
});

refresh();
setInterval(() => { if (currentTabId !== null) refresh(); }, 1800);
