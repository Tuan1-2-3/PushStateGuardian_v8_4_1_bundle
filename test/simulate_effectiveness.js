const { normalizeV8Prefs, calcScore, calcConfidence, DEFAULT_V8_PREFS } = require('./test_utils');

function applyTrustBias(score, trustMode) {
  if (trustMode === 'trusted') return Math.max(0, Math.round(score * 0.55));
  if (trustMode === 'ignored') return Math.max(0, Math.round(score * 0.15));
  if (trustMode === 'suspicious') return Math.min(100, Math.round(score * 1.1));
  return score;
}

function classifyRisk(rawScore, trustMode) {
  const score = applyTrustBias(rawScore, trustMode || 'unknown');
  let label = 'LOW';
  if (score >= 70) label = 'HIGH';
  else if (score >= 40) label = 'MED';
  return { score, label };
}

function computeOverlayModeFromV8(biasedScore, label, prefs, trustMode) {
  const highRisk = (label === 'HIGH' || biasedScore >= 70);
  const mediumRisk = (label === 'MED' || biasedScore >= 40);
  const trusted = (trustMode === 'trusted' || trustMode === 'ignored');
  let overlayMode = 'full';
  if (prefs.ambientMode) overlayMode = 'ambient';
  if (prefs.quietMode && !highRisk) overlayMode = mediumRisk ? 'compact' : 'ambient';
  if (prefs.expertDetail && !prefs.quietMode) overlayMode = 'full';
  if (highRisk) overlayMode = 'full';
  if (trusted && !highRisk && prefs.quietMode) overlayMode = 'ambient';
  // Cognitive minimalism override from content.js: hide by default unless autoShowOverlay or HIGH
  if (!prefs.autoShowOverlay && !highRisk) overlayMode = 'hidden';
  return overlayMode;
}

const scenarios = [
  {
    name: 'Quiet browsing',
    report: {},
    prefs: DEFAULT_V8_PREFS,
    trustMode: 'unknown'
  },
  {
    name: 'User-led navigation (small)',
    report: { push: 2, userActions: 2 },
    prefs: DEFAULT_V8_PREFS,
    trustMode: 'unknown'
  },
  {
    name: 'Pushes without user action (burst)',
    report: { push: 5, pushWithoutAction: 3, userActions: 0 },
    prefs: DEFAULT_V8_PREFS,
    trustMode: 'unknown'
  },
  {
    name: 'Coercive signals (popups + fullscreen + history pressure)',
    report: { popup: 2, fullscreen: 1, pushWithoutAction: 5, push: 6, userActions: 0, historyLength: 120 },
    prefs: DEFAULT_V8_PREFS,
    trustMode: 'unknown'
  },
  {
    name: 'Trusted site with pushes',
    report: { push: 6, pushWithoutAction: 4, userActions: 0 },
    prefs: DEFAULT_V8_PREFS,
    trustMode: 'trusted'
  },
  {
    name: 'Auto-show enabled (moderate signals)',
    report: { push: 3, pushWithoutAction: 2, userActions: 0 },
    prefs: { ...DEFAULT_V8_PREFS, autoShowOverlay: true },
    trustMode: 'unknown'
  }
];

console.log('Protection effectiveness simulation');
console.log('-----------------------------------');
scenarios.forEach((s) => {
  const prefs = s.prefs || DEFAULT_V8_PREFS;
  const raw = calcScore(s.report);
  const confidence = calcConfidence(s.report);
  const { score: biasedScore, label } = classifyRisk(raw, s.trustMode);
  const overlayMode = computeOverlayModeFromV8(biasedScore, label, prefs, s.trustMode);

  console.log(`\nScenario: ${s.name}`);
  console.log(`  raw score: ${raw}`);
  console.log(`  biased score (after trust): ${biasedScore}`);
  console.log(`  label: ${label}`);
  console.log(`  confidence: ${Number(confidence.toFixed(2))}`);
  console.log(`  prefs.autoShowOverlay: ${prefs.autoShowOverlay}`);
  console.log(`  expected overlayMode (final): ${overlayMode}`);
});

console.log('\nSimulation complete.');
