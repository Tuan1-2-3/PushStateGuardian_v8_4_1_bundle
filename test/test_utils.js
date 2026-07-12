// Small, self-contained copies of pure logic from popup.js for testing
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

module.exports = { normalizeV8Prefs, calcScore, calcConfidence, DEFAULT_V8_PREFS };
