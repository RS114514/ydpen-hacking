import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const FX_URL = new URL('app/data/fx_events.js', ROOT);
const src = await readFile(FX_URL, 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const fx = mod.fx_events;

const LENGTHS = {
  main: 9155,
  route_yoshino: 9790, route_mako: 9109, route_murasame: 10990,
  route_rena: 9438, route_koharu: 5277, route_roka: 1967,
  after_yoshino: 707, after_mako: 604, after_murasame: 766,
  after_rena: 436, after_koharu: 442, after_roka: 478
};
const CODES = new Set(['F', 'f', 'W', 'S', 'O', 'T', 'G', 'V', 'M']);

test('fx_events scenario keys and line ranges are valid', () => {
  assert.deepEqual(Object.keys(fx).sort(), Object.keys(LENGTHS).sort());
  let total = 0;
  for (const [scenario, events] of Object.entries(fx)) {
    const len = LENGTHS[scenario];
    assert.ok(len, scenario);
    for (const [line, list] of Object.entries(events)) {
      const idx = Number(line);
      assert.ok(Number.isInteger(idx) && idx >= 0 && idx < len, scenario + ':' + line);
      assert.ok(Array.isArray(list) && list.length > 0, scenario + ':' + line);
      for (const ev of list) {
        assert.ok(CODES.has(ev[0]), scenario + ':' + line + ' code ' + ev[0]);
        total += 1;
      }
    }
  }
  assert.ok(total > 5000, 'expected a substantial FX table, got ' + total);
});

test('every scenario starts with its own FX entries', () => {
  for (const scenario of ['main', 'route_yoshino', 'route_mako', 'route_murasame',
    'route_rena', 'route_koharu', 'route_roka', 'after_yoshino', 'after_rena']) {
    assert.ok(fx[scenario] && Object.keys(fx[scenario]).length > 0, scenario);
  }
});

test('main and route_yoshino line 0 are distinguishable', () => {
  assert.ok(fx.main[0], 'main line 0');
  assert.ok(fx.route_yoshino[0], 'yoshino line 0');
  assert.notDeepEqual(fx.main[0], fx.route_yoshino[0]);
});
