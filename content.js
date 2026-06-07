(() => {
  if (window.__psrdInstalled) return;
  window.__psrdInstalled = true;

  const V8_PREFS_KEY = 'psgV8Prefs';
  const V8_CALM_PROFILES_KEY = 'psgV8CalmProfiles';
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

  const state = {
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
    historyLength: history.length,
    lastActionAt: 0,
    lastPushes: [],
    eventStream: [],
    timeline: [],
    heatmapBuckets: Array(12).fill(0),
    fingerprints: [],
    notes: [],
    confidence: 0.35,
    riskScore: 0,
    riskLabel: 'LOW',
    trustMode: 'unknown',
    domainHost: location.hostname,
    v8: {
      version: '8.4.1',
      preferences: { ...DEFAULT_V8_PREFS },
      ambientState: 'observing',
      overlayMode: 'ambient',
      visibleUrgency: 'quiet',
      calmnessScore: 100,
      attentionBudget: 6,
      quietReason: 'Ambient defense is observing quietly.',
      cognitiveSummary: 'No disruptive navigation pattern is visible.',
      compressedSummary: 'Quiet protection active.',
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
        escalationTemplate: 'calm-interrupt',
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
        explanation: 'Adaptive calmness is learning locally from this session.',
        quietHoursReason: 'Normal hours.',
        localProfile: {
          host: location.hostname,
          visits: 0,
          benignVisits: 0,
          averageRisk: 0,
          lastSeen: 0
        },
        lastProfileSaveAt: 0
      },
      cognitiveMinimalism: {
        active: true,
        minimalSurfaceMode: true,
        detailLevel: 'minimal',
        plainSummary: 'This page looks calm.',
        groupedReason: 'No unusual page behavior noticed.',
        surfaceDensity: 'low',
        progressiveDetail: true,
        expertDetailAvailable: true,
        themeMode: 'system',
        overlayAutoShow: false,
        explanation: 'Guardian keeps the interface quiet and keeps details available on demand.'
      },
      suppressedPrompts: 0,
      rawConfidence: 0.35,
      smoothedConfidence: 0.35,
      lastRiskLabel: 'LOW',
      lastOverlayMode: 'ambient',
      lastCognitionKey: 'baseline/stable',
      lastEmotionalKey: 'steady/none',
      lastAdaptiveKey: 'new-site/available',
      lastMinimalismKey: 'minimal/low'
    }
  };

  const MAX_STREAM = 500;
  const MAX_TIMELINE = 240;
  const MAX_AUDIT = 80;

  function clone(obj) {
    try { return structuredClone(obj); } catch (_) { return JSON.parse(JSON.stringify(obj)); }
  }

  function pushStream(evt) {
    state.eventStream.push(evt);
    if (state.eventStream.length > MAX_STREAM) state.eventStream.shift();
  }

  function pushTimeline(type, detail = '') {
    state.timeline.push({ t: Date.now(), type, detail });
    if (state.timeline.length > MAX_TIMELINE) state.timeline.shift();
  }

  function note(msg) {
    if (!state.notes.includes(msg)) state.notes.push(msg);
  }

  function normalizeV8Prefs(prefs = {}) {
    const calmness = ['calm', 'balanced', 'direct'].includes(prefs.calmnessLevel) ? prefs.calmnessLevel : DEFAULT_V8_PREFS.calmnessLevel;
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
      calmnessLevel: calmness
    };
  }

  function audit(type, detail = '') {
    state.v8.hiddenAuditTrail.push({ t: Date.now(), type, detail });
    if (state.v8.hiddenAuditTrail.length > MAX_AUDIT) state.v8.hiddenAuditTrail.shift();
  }

  function fingerprint(name, risk, confidence) {
    const now = Date.now();
    const exists = state.fingerprints.some(fp => fp.name === name && now - fp.t < 15000);
    if (!exists) {
      state.fingerprints.push({ name, risk, confidence, t: now });
      if (state.fingerprints.length > 20) state.fingerprints.shift();
      note(`[Fingerprint] ${name}`);
    }
  }

  function emit(type, meta = {}) {
    if (!['heartbeat', 'overlay_mode', 'init', 'v8_preferences'].includes(type)) recompute();
    const evt = { type, meta, t: Date.now(), url: location.href, host: location.hostname, trusted: !!meta.trusted };
    pushStream(evt);
    pushTimeline(type, meta.detail || '');
    const report = clone(state);
    try { window.postMessage({ __psrd: true, type: 'PSRD_UPDATE', payload: report }, '*'); } catch (_) {}
    try {
      chrome.runtime.sendMessage({ type: 'PSRD_REPORT_PUSH', report }, () => {
        if (chrome.runtime.lastError) {
          // No receiver available (e.g., popup/background not listening) — ignore silently
        }
      });
    } catch (_) {}
  }

  function addInteraction(type) {
    const now = Date.now();
    if (now - state.lastActionAt < 1200) return;
    state.userActions += 1;
    state.lastActionAt = now;
    emit('user_action', { detail: type, trusted: true });
  }

  ['click', 'touchstart', 'pointerdown'].forEach((evt) => {
    window.addEventListener(evt, () => addInteraction(evt), { passive: true, capture: true });
  });

  window.addEventListener('popstate', () => {
    state.pop += 1;
    emit('popstate', { detail: 'back_forward' });
  }, true);

  window.addEventListener('hashchange', () => {
    emit('hashchange', { detail: location.hash || '' });
  }, true);

  async function loadTrustState() {
    try {
      const data = await chrome.storage.local.get(['psrdTrustDB']);
      const db = data.psrdTrustDB || {};
      const host = location.hostname;
      if (db.trusted && db.trusted[host]) state.trustMode = 'trusted';
      else if (db.ignored && db.ignored[host]) state.trustMode = 'ignored';
      else if (db.suspicious && db.suspicious[host]) state.trustMode = 'suspicious';
      else state.trustMode = 'unknown';
    } catch (_) {}
  }

  async function loadV8Prefs() {
    try {
      const data = await chrome.storage.local.get([V8_PREFS_KEY]);
      state.v8.preferences = normalizeV8Prefs(data[V8_PREFS_KEY]);
    } catch (_) {
      state.v8.preferences = { ...DEFAULT_V8_PREFS };
    }
  }

  async function loadV8CalmProfile() {
    try {
      const data = await chrome.storage.local.get([V8_CALM_PROFILES_KEY]);
      const profiles = data[V8_CALM_PROFILES_KEY] || {};
      const host = location.hostname || 'unknown';
      const profile = profiles[host] || { host, visits: 0, benignVisits: 0, averageRisk: 0, lastSeen: 0 };
      profile.host = host;
      profile.visits = Math.min(9999, (profile.visits || 0) + 1);
      profile.lastSeen = Date.now();
      state.v8.adaptiveCalmness.localProfile = profile;
      profiles[host] = profile;
      await chrome.storage.local.set({ [V8_CALM_PROFILES_KEY]: profiles });
    } catch (_) {}
  }

  function saveV8CalmProfile(score, label) {
    const now = Date.now();
    const adaptive = state.v8.adaptiveCalmness;
    if (now - (adaptive.lastProfileSaveAt || 0) < 30000 && label !== 'HIGH') return;
    adaptive.lastProfileSaveAt = now;
    const profile = adaptive.localProfile || { host: location.hostname || 'unknown', visits: 0, benignVisits: 0, averageRisk: 0, lastSeen: 0 };
    profile.averageRisk = Math.round(((profile.averageRisk || 0) * 0.8) + (score * 0.2));
    if (label === 'LOW') profile.benignVisits = Math.min(9999, (profile.benignVisits || 0) + 1);
    profile.lastSeen = now;
    adaptive.localProfile = profile;
    chrome.storage.local.get([V8_CALM_PROFILES_KEY], (data) => {
      const profiles = data[V8_CALM_PROFILES_KEY] || {};
      profiles[profile.host || location.hostname || 'unknown'] = profile;
      chrome.storage.local.set({ [V8_CALM_PROFILES_KEY]: profiles }, () => {});
    });
  }

  function applyTrustBias(score) {
    if (state.trustMode === 'trusted') return Math.max(0, Math.round(score * 0.55));
    if (state.trustMode === 'ignored') return Math.max(0, Math.round(score * 0.15));
    if (state.trustMode === 'suspicious') return Math.min(100, Math.round(score * 1.1));
    return score;
  }

  function computeConfidence() {
    let c = 0.35;
    if (state.pushWithoutAction >= 3) c += 0.12;
    if (state.bursts >= 1) c += 0.14;
    if (state.popup >= 1) c += 0.08;
    if (state.fullscreen >= 1) c += 0.10;
    if (state.notification >= 1) c += 0.10;
    if (state.fingerprints.length) c += Math.min(0.18, state.fingerprints.length * 0.04);
    if (state.trustMode === 'trusted') c -= 0.10;
    if (state.trustMode === 'ignored') c -= 0.18;
    return Math.max(0.05, Math.min(0.99, c));
  }

  function smoothConfidence(raw) {
    const previous = state.v8.smoothedConfidence || raw;
    const next = previous * 0.72 + raw * 0.28;
    state.v8.rawConfidence = raw;
    state.v8.smoothedConfidence = Math.max(0.05, Math.min(0.99, next));
    return state.v8.smoothedConfidence;
  }

  function classifyRisk(rawScore) {
    const score = applyTrustBias(rawScore);
    let label = 'LOW';
    if (score >= 70) label = 'HIGH';
    else if (score >= 40) label = 'MED';
    return { score, label };
  }

  function computeV8Coexistence(score, label) {
    const prefs = state.v8.preferences;
    const highRisk = label === 'HIGH' || score >= 70;
    const mediumRisk = label === 'MED' || score >= 40;
    const trusted = state.trustMode === 'trusted' || state.trustMode === 'ignored';
    const interactionCount = state.userActions || 0;
    const noisySignals = state.pushWithoutAction + state.bursts + state.fullscreen + state.popup + state.notification + state.clipboard;

    let overlayMode = 'full';
    if (prefs.ambientMode) overlayMode = 'ambient';
    if (prefs.quietMode && !highRisk) overlayMode = mediumRisk ? 'compact' : 'ambient';
    if (prefs.expertDetail && !prefs.quietMode) overlayMode = 'full';
    if (highRisk) overlayMode = 'full';
    if (trusted && !highRisk && prefs.quietMode) overlayMode = 'ambient';

    const calmnessBase = prefs.calmnessLevel === 'calm' ? 18 : prefs.calmnessLevel === 'direct' ? -8 : 6;
    const calmnessScore = Math.max(0, Math.min(100, 100 - score - noisySignals * 4 + interactionCount * 2 + calmnessBase));
    const attentionBudget = prefs.calmnessLevel === 'calm' ? 3 : prefs.calmnessLevel === 'direct' ? 8 : 5;
    const visibleUrgency = highRisk ? 'urgent' : mediumRisk ? 'review' : 'quiet';
    const ambientState = highRisk ? 'needs-attention' : mediumRisk ? 'quiet-review' : 'coexisting';
    const quietReason = highRisk
      ? 'Urgent risk is allowed through quiet mode.'
      : mediumRisk
        ? 'Suspicious behavior is kept compact unless it escalates.'
        : 'Low-risk activity is handled as ambient protection.';
    const cognitiveSummary = highRisk
      ? 'Navigation behavior is strong enough to interrupt calmly.'
      : mediumRisk
        ? 'The system is watching a suspicious pattern without forcing a full warning.'
        : 'Behavioral cognition is running silently with no disruptive pattern.';
    const compressedSummary = highRisk
      ? 'Needs attention.'
      : mediumRisk
        ? 'Quiet review.'
        : 'Ambient protection active.';

    if (state.v8.lastRiskLabel !== label) {
      audit('risk-transition', `${state.v8.lastRiskLabel} -> ${label}`);
      state.v8.lastRiskLabel = label;
    }
    if (state.v8.lastOverlayMode !== overlayMode) {
      audit('surface-change', `${state.v8.lastOverlayMode} -> ${overlayMode}`);
      state.v8.lastOverlayMode = overlayMode;
    }

    state.v8.ambientState = ambientState;
    state.v8.overlayMode = overlayMode;
    state.v8.visibleUrgency = visibleUrgency;
    state.v8.calmnessScore = calmnessScore;
    state.v8.attentionBudget = attentionBudget;
    state.v8.quietReason = quietReason;
    state.v8.cognitiveSummary = cognitiveSummary;
    state.v8.compressedSummary = compressedSummary;
    state.v8.suppressedPrompts = overlayMode === 'ambient' ? Math.min(999, state.v8.suppressedPrompts + 1) : state.v8.suppressedPrompts;
  }

  function computeInvisibleCognition(score, label) {
    const prefs = state.v8.preferences;
    const promptPressure = state.popup + state.notification + state.fullscreen + state.clipboard;
    const historyPressure = state.pushWithoutAction + state.bursts + state.pop;
    const totalNavigation = state.push + state.replace + state.pop;
    let behaviorCluster = 'baseline';
    let trajectory = 'stable';
    let forecast = 'No disruptive navigation pattern is expected.';
    let quietForecast = 'Stable browsing.';
    let explanation = 'Signals are low and cognition is staying invisible by default.';
    let clusterConfidence = Math.max(0.35, state.confidence || 0.35);

    if (promptPressure >= 2 && historyPressure >= 2) {
      behaviorCluster = 'mixed-coercion';
      trajectory = 'escalating';
      forecast = 'Multiple coercive signals are converging; a visible warning may be needed.';
      quietForecast = 'Coercive flow forming.';
      explanation = 'Prompt-like events and history manipulation are rising together, so quiet mode will yield if risk escalates.';
      clusterConfidence += 0.18;
    } else if (historyPressure >= 3 || state.bursts >= 1) {
      behaviorCluster = 'history-pressure';
      trajectory = label === 'HIGH' ? 'escalating' : 'watching';
      forecast = 'Navigation pressure may continue if pushState bursts remain active.';
      quietForecast = 'Watching history pressure.';
      explanation = 'Repeated navigation signals are being grouped as history pressure rather than shown as separate alerts.';
      clusterConfidence += 0.14;
    } else if (promptPressure >= 1) {
      behaviorCluster = 'prompt-pressure';
      trajectory = label === 'LOW' ? 'watching' : 'escalating';
      forecast = 'Prompt or permission pressure is present and will stay quiet unless it repeats.';
      quietForecast = 'Prompt pressure observed.';
      explanation = 'Permission, popup, fullscreen, or clipboard signals are grouped into one prompt-pressure family.';
      clusterConfidence += 0.1;
    } else if (totalNavigation >= 3 && state.userActions > 0) {
      behaviorCluster = 'interactive-navigation';
      trajectory = 'stable';
      forecast = 'Navigation appears tied to user interaction and should remain ambient.';
      quietForecast = 'User-led navigation.';
      explanation = 'Navigation events are near user actions, so cognition treats the session as interactive rather than manipulative.';
      clusterConfidence += 0.06;
    }

    if (label === 'HIGH') trajectory = 'interrupt';
    if (score >= 40 && trajectory === 'stable') trajectory = 'watching';

    const cognitionKey = `${behaviorCluster}/${trajectory}`;
    state.v8.invisibleCognition = {
      active: true,
      revealMode: prefs.revealCognition || prefs.expertDetail || label === 'HIGH',
      behaviorCluster,
      clusterConfidence: Math.max(0.05, Math.min(0.99, clusterConfidence)),
      trajectory,
      forecast,
      quietForecast,
      explanation,
      privacyBoundary: 'local-session-only',
      lastEvaluatedAt: Date.now()
    };

    if (state.v8.lastCognitionKey !== cognitionKey) {
      audit('cognition-evaluation', cognitionKey);
      state.v8.lastCognitionKey = cognitionKey;
    }
  }

  function computeEmotionalErgonomics(score, label) {
    const prefs = state.v8.preferences;
    const cognition = state.v8.invisibleCognition || {};
    const recentEvents = state.timeline.filter((item) => Date.now() - item.t < 30000).length;
    const fatigueScore = Math.max(0, Math.min(100, recentEvents * 3 + state.v8.suppressedPrompts * 2 + state.notes.length * 2));
    const highRisk = label === 'HIGH' || score >= 70;
    const mediumRisk = label === 'MED' || score >= 40;

    let tone = 'steady';
    let warningIntensity = 'none';
    let userMessage = 'Everything looks calm right now.';
    let reassurance = 'Protection is active in the background.';
    let recoveryAction = 'Continue browsing normally.';
    let timing = 'ambient';
    let escalationTemplate = 'calm-background';

    if (highRisk) {
      tone = 'firm-calm';
      warningIntensity = 'interrupt';
      userMessage = 'This page is showing strong navigation pressure.';
      reassurance = 'You are still in control; no action has been taken without you.';
      recoveryAction = 'Pause before interacting further, then use the browser back button or close the tab if the page feels wrong.';
      timing = 'now';
      escalationTemplate = 'calm-interrupt';
    } else if (mediumRisk) {
      tone = fatigueScore > 45 || prefs.calmnessLevel === 'calm' ? 'soft-review' : 'steady-review';
      warningIntensity = 'review';
      userMessage = 'Some navigation behavior is unusual, so Guardian is watching quietly.';
      reassurance = 'This is not a panic state; it is a quiet review.';
      recoveryAction = 'Keep browsing if this was expected, or reveal details before trusting the page.';
      timing = fatigueScore > 45 ? 'deferred' : 'compact';
      escalationTemplate = 'quiet-review';
    } else if (cognition.trajectory === 'watching' || cognition.trajectory === 'escalating') {
      tone = 'soft-watch';
      warningIntensity = 'notice';
      userMessage = 'A small pattern is being watched without interrupting you.';
      reassurance = 'Low-risk signals are grouped together to avoid repeated prompts.';
      recoveryAction = 'No action is needed unless the page starts forcing navigation or prompts.';
      timing = 'quiet';
      escalationTemplate = 'non-interruptive';
    }

    if (!prefs.emotionalSupport) {
      reassurance = 'Emotional support copy is disabled.';
      recoveryAction = highRisk ? 'Review page behavior before continuing.' : 'Review details if needed.';
    }

    const autonomyReminder = prefs.expertDetail || prefs.revealCognition
      ? 'Details are visible because you asked for more context.'
      : 'Details stay available on demand without interrupting your session.';
    const safetyReview = userMessage.includes('panic') || userMessage.includes('danger')
      ? 'needs-copy-review'
      : 'copy-safe';
    const emotionalKey = `${tone}/${warningIntensity}`;

    state.v8.emotionalErgonomics = {
      active: true,
      tone,
      warningIntensity,
      userMessage,
      reassurance,
      recoveryAction,
      timing,
      fatigueScore,
      autonomyReminder,
      escalationTemplate,
      safetyReview
    };

    if (state.v8.lastEmotionalKey !== emotionalKey) {
      audit('emotional-tone', emotionalKey);
      state.v8.lastEmotionalKey = emotionalKey;
    }
  }

  function computeAdaptiveCalmness(score, label) {
    const prefs = state.v8.preferences;
    const emotional = state.v8.emotionalErgonomics || {};
    const profile = state.v8.adaptiveCalmness.localProfile || { visits: 0, benignVisits: 0, averageRisk: 0 };
    const hour = new Date().getHours();
    const quietHoursActive = hour >= 22 || hour < 7;
    const highRisk = label === 'HIGH' || score >= 70;
    const mediumRisk = label === 'MED' || score >= 40;
    const familiarSite = (profile.visits || 0) >= 3;
    const benignRatio = profile.visits ? (profile.benignVisits || 0) / profile.visits : 0;
    const trustBonus = state.trustMode === 'trusted' ? 35 : state.trustMode === 'ignored' ? 18 : state.trustMode === 'suspicious' ? -25 : 0;
    const trustContinuityScore = Math.max(0, Math.min(100,
      trustBonus +
      Math.min(25, (profile.visits || 0) * 4) +
      Math.round(benignRatio * 25) +
      (score < 20 ? 15 : score > 60 ? -15 : 0)
    ));
    const fatigue = emotional.fatigueScore || 0;
    const interruptibility = highRisk
      ? 'interruptible'
      : quietHoursActive || fatigue > 55
        ? 'low'
        : state.userActions > 0
          ? 'available'
          : 'unknown';
    const cooldownActive = Date.now() < (state.v8.adaptiveCalmness.alertCooldownUntil || 0);
    let alertCooldownUntil = state.v8.adaptiveCalmness.alertCooldownUntil || 0;
    if (mediumRisk && !cooldownActive) alertCooldownUntil = Date.now() + (quietHoursActive ? 60000 : 30000);

    let mitigationSoftness = 'ambient';
    if (highRisk) mitigationSoftness = 'direct';
    else if (mediumRisk && (quietHoursActive || trustContinuityScore >= 55 || fatigue > 45)) mitigationSoftness = 'soft';
    else if (mediumRisk) mitigationSoftness = 'balanced';

    const siteCalmProfile = familiarSite && (profile.averageRisk || 0) < 25
      ? 'calm-familiar'
      : familiarSite
        ? 'familiar'
        : 'new-site';
    const learnedPreference = siteCalmProfile === 'calm-familiar'
      ? 'quieter-on-this-site'
      : (profile.averageRisk || 0) >= 45
        ? 'more-visible-on-this-site'
        : prefs.calmnessLevel;
    const quietHoursReason = quietHoursActive ? 'Quiet-hours logic is active for this local browser session.' : 'Normal hours.';
    const explanation = highRisk
      ? 'Adaptive calmness is bypassed because this risk should stay visible.'
      : cooldownActive
        ? 'A recent alert is cooling down, so repeated prompts stay compact.'
        : trustContinuityScore >= 55
          ? 'This site has enough local trust continuity to keep low-risk signals quiet.'
          : quietHoursActive
            ? 'Quiet-hours logic lowers interruption unless risk becomes urgent.'
            : 'Adaptive calmness is balancing current risk, fatigue, and local site history.';

    if (prefs.adaptiveCalmness) {
      if (highRisk) {
        state.v8.overlayMode = 'full';
      } else if (mediumRisk && (cooldownActive || quietHoursActive || trustContinuityScore >= 55)) {
        state.v8.overlayMode = 'compact';
      } else if (!mediumRisk && (siteCalmProfile === 'calm-familiar' || quietHoursActive || fatigue > 45)) {
        state.v8.overlayMode = 'ambient';
      }
      state.v8.attentionBudget = Math.max(1, Math.min(8, state.v8.attentionBudget - (quietHoursActive ? 1 : 0) - (fatigue > 55 ? 1 : 0) + (highRisk ? 3 : 0)));
    }

    state.v8.adaptiveCalmness = {
      ...state.v8.adaptiveCalmness,
      active: prefs.adaptiveCalmness,
      quietHoursActive,
      trustContinuityScore,
      siteCalmProfile,
      alertCooldownUntil,
      mitigationSoftness,
      learnedPreference,
      interruptibility,
      explanation,
      quietHoursReason,
      localProfile: profile
    };

    const adaptiveKey = `${siteCalmProfile}/${interruptibility}/${mitigationSoftness}`;
    if (state.v8.lastAdaptiveKey !== adaptiveKey) {
      audit('adaptive-calmness', adaptiveKey);
      state.v8.lastAdaptiveKey = adaptiveKey;
    }
    saveV8CalmProfile(score, label);
  }

  function computeCognitiveMinimalism(score, label) {
    const prefs = state.v8.preferences;
    const highRisk = label === 'HIGH' || score >= 70;
    const mediumRisk = label === 'MED' || score >= 40;
    const expertVisible = prefs.expertDetail === true || prefs.revealCognition === true || highRisk;

    let plainSummary = 'This page looks calm.';
    let groupedReason = 'No unusual page behavior noticed.';
    let detailLevel = 'minimal';
    let surfaceDensity = prefs.autoShowOverlay ? 'compact' : 'quiet';

    if (highRisk) {
      plainSummary = 'This page needs attention.';
      groupedReason = 'The page is applying strong navigation pressure.';
      detailLevel = 'full';
      surfaceDensity = 'attention';
      state.v8.overlayMode = 'full';
      state.v8.visibleUrgency = 'urgent';
    } else if (mediumRisk) {
      plainSummary = 'Worth a quick look.';
      groupedReason = 'The page is changing browsing behavior more than usual.';
      detailLevel = expertVisible ? 'guided' : 'minimal';
      surfaceDensity = prefs.autoShowOverlay ? 'compact' : 'quiet';
    } else if ((state.push + state.replace + state.pop) > 0) {
      plainSummary = 'Browsing is still calm.';
      groupedReason = 'Page changes look consistent with normal browsing.';
    }

    if (expertVisible && !highRisk) {
      detailLevel = prefs.expertDetail ? 'full' : 'guided';
      surfaceDensity = prefs.expertDetail ? 'full' : surfaceDensity;
    }

    if (!prefs.autoShowOverlay && !highRisk) {
      state.v8.overlayMode = 'hidden';
    }

    const explanation = prefs.autoShowOverlay
      ? 'Overlay can appear in compact form while browsing; details remain available from the popup.'
      : 'Overlay stays out of sight during normal browsing and returns only for urgent risk or manual reveal.';
    const minimalismKey = `${detailLevel}/${surfaceDensity}/${prefs.colorMode}/${prefs.autoShowOverlay ? 'auto' : 'manual'}`;

    state.v8.cognitiveMinimalism = {
      active: true,
      minimalSurfaceMode: !prefs.expertDetail,
      detailLevel,
      plainSummary,
      groupedReason,
      surfaceDensity,
      progressiveDetail: true,
      expertDetailAvailable: true,
      themeMode: prefs.colorMode,
      overlayAutoShow: prefs.autoShowOverlay,
      explanation
    };

    if (state.v8.lastMinimalismKey !== minimalismKey) {
      audit('minimal-surface', minimalismKey);
      state.v8.lastMinimalismKey = minimalismKey;
    }
  }

  function recompute() {
    const raw =
      Math.min(state.push * 2, 24) +
      Math.min(state.replace * 1.2, 10) +
      Math.min(state.pop * 6, 18) +
      Math.min(state.pushWithoutAction * 8, 28) +
      Math.min(state.bursts * 12, 20) +
      Math.min(state.fullscreen * 12, 20) +
      Math.min(state.popup * 10, 16) +
      Math.min(state.notification * 10, 18) +
      Math.min(state.clipboard * 8, 12) +
      (state.userActions === 0 && (state.push + state.replace) >= 3 ? 18 : 0) +
      (state.historyLength > 80 ? 6 : 0);

    const { score, label } = classifyRisk(raw);
    state.riskScore = score;
    state.riskLabel = label;
    state.confidence = smoothConfidence(computeConfidence());
    computeV8Coexistence(score, label);
    computeInvisibleCognition(score, label);
    computeEmotionalErgonomics(score, label);
    computeAdaptiveCalmness(score, label);
    computeCognitiveMinimalism(score, label);

    if (state.pushWithoutAction >= 3) note('pushState without nearby user action');
    if (state.bursts >= 1) note('Burst navigation pattern detected');
    if (state.pop >= 3) note('Repeated popstate events');
    if (state.historyLength > 80) note('Unusually large history length');
  }

  function markPush(now) {
    state.push += 1;
    state.lastPushes.push(now);
    if (state.lastPushes.length > 32) state.lastPushes.shift();
    const recent = state.lastPushes.filter((t) => now - t <= 1000).length;
    if (recent >= 5) state.bursts += 1;
    if (now - state.lastActionAt > 1800) state.pushWithoutAction += 1;
    const bucket = Math.min(11, Math.floor(((now - state.startedAt) / 1000) / 5));
    state.heatmapBuckets[bucket] += 1;
    pushTimeline('pushState', location.pathname);
  }

  function markReplace() {
    state.replace += 1;
    pushTimeline('replaceState', location.pathname);
  }

  function markFullscreen(detail) {
    state.fullscreen += 1;
    pushTimeline('fullscreen', detail);
    emit('fullscreen_request', { detail, trusted: state.lastActionAt && (Date.now() - state.lastActionAt < 2000) });
    if (state.fullscreen >= 1 && state.userActions === 0) fingerprint('Fullscreen without obvious interaction', 78, 0.84);
  }

  function markPopup(url) {
    state.popup += 1;
    pushTimeline('popup', url || 'unknown');
    emit('popup_open', { detail: url || 'unknown', trusted: state.lastActionAt && (Date.now() - state.lastActionAt < 1500) });
    if (state.popup >= 2 && state.userActions === 0) fingerprint('Popup coercion pattern', 82, 0.79);
  }

  function markNotification() {
    state.notification += 1;
    pushTimeline('notification', 'requestPermission');
    emit('notification_request', { detail: 'requestPermission', trusted: state.lastActionAt && (Date.now() - state.lastActionAt < 1500) });
    if (state.notification >= 1 && state.userActions === 0) fingerprint('Notification bait-like flow', 84, 0.76);
  }

  function markClipboard() {
    state.clipboard += 1;
    pushTimeline('clipboard', 'writeText');
    emit('clipboard_write', { detail: 'writeText', trusted: state.lastActionAt && (Date.now() - state.lastActionAt < 1500) });
  }

  function injectBridge() {
    try {
      // Request the background service worker to inject the bridge into the page's main world.
      chrome.runtime.sendMessage({ type: 'INJECT_BRIDGE' }, (resp) => {
        if (chrome.runtime.lastError) {
          try { chrome.runtime.sendMessage({ type: 'PSRD_DIAG', diag: { kind: 'inject_request_failed', error: chrome.runtime.lastError.message, url: location.href, ts: Date.now() } }); } catch (_) {}
        } else if (!resp || !resp.ok) {
          try { chrome.runtime.sendMessage({ type: 'PSRD_DIAG', diag: { kind: 'inject_failed', error: resp && resp.error ? resp.error : 'unknown', url: location.href, ts: Date.now() } }); } catch (_) {}
        }
      });
      // If the bridge hasn't shown up quickly, record a diagnostic entry.
      setTimeout(() => {
        try {
          if (!window.__psrdPageInstalled) {
            try { chrome.runtime.sendMessage({ type: 'PSRD_DIAG', diag: { kind: 'bridge_not_seen', url: location.href, ts: Date.now() } }); } catch (_) {}
          }
        } catch (_) {}
      }, 1500);
    } catch (_) {}
  }

  window.addEventListener('message', (event) => {
    if (!event || !event.data || event.data.__psrdBridge !== true) return;
    const payload = event.data.payload || {};
    const type = payload.type;
    const detail = payload.meta && payload.meta.detail ? payload.meta.detail : '';
    if (type === 'pushState') {
      markPush(payload.t || Date.now());
      emit('pushState', { detail });
      recompute();
    } else if (type === 'replaceState') {
      markReplace();
      emit('replaceState', { detail });
      recompute();
    } else if (type === 'fullscreen_request') {
      markFullscreen(detail || 'unknown');
      recompute();
    } else if (type === 'popup_open') {
      markPopup(detail || 'unknown');
      recompute();
    } else if (type === 'notification_request') {
      markNotification();
      recompute();
    } else if (type === 'clipboard_write') {
      markClipboard();
      recompute();
    }
  });

  setInterval(() => {
    state.historyLength = history.length;
    recompute();
    emit('heartbeat', { detail: String(state.historyLength) });
  }, 1200);

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'PSRD_GET_REPORT') {
      sendResponse({ report: clone(state) });
      return true;
    }
    if (msg && msg.type === 'PSRD_SET_OVERLAY_MODE') {
      state.hiddenOverlay = !!msg.hiddenOverlay;
      state.compactOverlay = !!msg.compactOverlay;
      emit('overlay_mode', { detail: state.hiddenOverlay ? 'hidden' : state.compactOverlay ? 'compact' : 'full' });
      try {
        window.postMessage({
          __psrd: true,
          type: 'PSRD_OVERLAY_COMMAND',
          payload: {
            hiddenOverlay: state.hiddenOverlay,
            compactOverlay: state.compactOverlay,
            duration: 45000
          }
        }, '*');
      } catch (_) {}
      sendResponse({ ok: true });
      return true;
    }
    if (msg && msg.type === 'PSRD_TRUST_REFRESH') {
      loadTrustState().then(() => { recompute(); sendResponse({ ok: true, trustMode: state.trustMode }); });
      return true;
    }
    if (msg && msg.type === 'PSG_V8_SET_PREFS') {
      state.v8.preferences = normalizeV8Prefs(msg.preferences || {});
      chrome.storage.local.set({ [V8_PREFS_KEY]: state.v8.preferences }, () => {
        recompute();
        emit('v8_preferences', { detail: 'updated' });
        sendResponse({ ok: true, preferences: clone(state.v8.preferences), report: clone(state) });
      });
      return true;
    }
    return false;
  });

  window.addEventListener('message', (event) => {
    try {
      if (!event || !event.data || event.data.__psrd !== true) return;
      if (event.data.type === 'PSRD_REQUEST') {
        window.postMessage({ __psrd: true, type: 'PSRD_UPDATE', payload: clone(state) }, '*');
      }
    } catch (_) {}
  });

  Promise.all([loadTrustState(), loadV8Prefs(), loadV8CalmProfile()]).then(() => {
    injectBridge();
    recompute();
    emit('init', { detail: 'ready' });
  });
})();
