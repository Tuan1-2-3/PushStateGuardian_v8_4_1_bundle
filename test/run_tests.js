const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { normalizeV8Prefs, calcScore, calcConfidence, DEFAULT_V8_PREFS } = require('./test_utils');

console.log('Running small smoke tests...');

const d = normalizeV8Prefs();
assert.strictEqual(d.colorMode, DEFAULT_V8_PREFS.colorMode, 'default colorMode');
assert.strictEqual(d.calmnessLevel, DEFAULT_V8_PREFS.calmnessLevel, 'default calmnessLevel');
assert.strictEqual(d.ambientMode, true, 'ambientMode default true');
assert.strictEqual(d.expertDetail, false, 'expertDetail default false');
console.log('  [ok] normalizeV8Prefs defaults');

const c = normalizeV8Prefs({ colorMode: 'light', calmnessLevel: 'calm', ambientMode: false });
assert.strictEqual(c.colorMode, 'light', 'colorMode override');
assert.strictEqual(c.calmnessLevel, 'calm', 'calmnessLevel override');
assert.strictEqual(c.ambientMode, false, 'ambientMode override');
console.log('  [ok] normalizeV8Prefs overrides');

assert.strictEqual(calcScore({}), 0, 'empty report score 0');
assert.strictEqual(calcScore({ push: 10 }), 38, 'push 10 without user action -> score 38');
assert.strictEqual(calcScore({ push: 10, trustMode: 'trusted' }), 21, 'trusted reduces score');
console.log('  [ok] calcScore checks');

assert.strictEqual(calcConfidence({}), 0.35, 'default confidence');
assert.strictEqual(calcConfidence({ pushWithoutAction: 3 }), 0.47, 'pushWithoutAction increases confidence');
assert.strictEqual(Number(calcConfidence({ pushWithoutAction: 3, trustMode: 'ignored' }).toFixed(2)), 0.29, 'ignored reduces confidence');
console.log('  [ok] calcConfidence checks');

const extensionRoot = path.resolve(__dirname, '..');
const overlaySource = fs.readFileSync(path.join(extensionRoot, 'overlay.js'), 'utf8');
const contentSource = fs.readFileSync(path.join(extensionRoot, 'content.js'), 'utf8');
const popupSource = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');

assert(!overlaySource.includes(':host(.hidden) { display:none'), 'overlay hidden state must not remove host with display:none');
assert(overlaySource.includes('PSRD_REQUEST'), 'overlay can request a fresh content report');
assert(overlaySource.includes('chrome.storage.onChanged'), 'overlay listens for preference changes');
assert(contentSource.includes('PSRD_REQUEST'), 'content responds to overlay report requests');
assert(popupSource.includes('requestAnimationFrame'), 'popup batches render work');
assert(popupSource.includes('activeColorModeClass'), 'popup caches theme class changes');
assert(popupSource.includes('showOverlayManually'), 'popup exposes manual overlay reveal');
console.log('  [ok] overlay and popup stability guards');

console.log('\nAll small tests passed.');
process.exit(0);
