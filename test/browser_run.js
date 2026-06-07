(function () {
  function ok(cond, message) {
    return { ok: !!cond, message };
  }

  const t = window.testUtils;
  const results = [];

  try {
    // normalize defaults
    const d = t.normalizeV8Prefs();
    results.push(ok(d.colorMode === t.DEFAULT_V8_PREFS.colorMode, 'default colorMode'));
    results.push(ok(d.calmnessLevel === t.DEFAULT_V8_PREFS.calmnessLevel, 'default calmnessLevel'));
    results.push(ok(d.ambientMode === true, 'ambientMode default true'));
    results.push(ok(d.expertDetail === false, 'expertDetail default false'));

    // overrides
    const c = t.normalizeV8Prefs({ colorMode: 'light', calmnessLevel: 'calm', ambientMode: false });
    results.push(ok(c.colorMode === 'light', 'colorMode override'));
    results.push(ok(c.calmnessLevel === 'calm', 'calmnessLevel override'));
    results.push(ok(c.ambientMode === false, 'ambientMode override'));

    // calcScore
    results.push(ok(t.calcScore({}) === 0, 'empty report score 0'));
    results.push(ok(t.calcScore({ push: 10 }) === 20, 'push 10 -> score 20'));
    results.push(ok(t.calcScore({ push: 10, trustMode: 'trusted' }) === 11, 'trusted reduces score'));

    // calcConfidence
    results.push(ok(Number(t.calcConfidence({}).toFixed(2)) === 0.35, 'default confidence'));
    results.push(ok(Number(t.calcConfidence({ pushWithoutAction: 3 }).toFixed(2)) === 0.47, 'pushWithoutAction increases confidence'));
    results.push(ok(Number(t.calcConfidence({ pushWithoutAction: 3, trustMode: 'ignored' }).toFixed(2)) === 0.29, 'ignored reduces confidence'));
  } catch (e) {
    results.push({ ok: false, message: `Exception during tests: ${e && e.message ? e.message : e}` });
  }

  // Render results
  const container = document.getElementById('results');
  container.innerHTML = '';
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  const header = document.createElement('h2');
  header.textContent = `${passed} / ${total} tests passed`;
  container.appendChild(header);

  const ul = document.createElement('ul');
  results.forEach((r) => {
    const li = document.createElement('li');
    li.textContent = (r.ok ? '✓ ' : '✖ ') + r.message;
    li.style.color = r.ok ? 'green' : 'crimson';
    ul.appendChild(li);
  });
  container.appendChild(ul);

  const note = document.createElement('p');
  note.textContent = 'Open the console for debug details.';
  container.appendChild(note);

  const rerun = document.getElementById('rerun');
  rerun.addEventListener('click', () => location.reload());
})();
