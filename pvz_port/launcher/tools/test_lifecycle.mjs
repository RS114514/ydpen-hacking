import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/root.js', import.meta.url), 'utf8');
let invocation = 0;
async function setup(ok) {
  const calls = [];
  globalThis.__hlTest = {
    stop() { calls.push('stop'); return { ok }; },
    save() { calls.push('save'); return { ok }; },
    isRunning() { return true; }
  };
  const text = source.replace("import hl from 'hl';", 'const hl = globalThis.__hlTest;');
  const { default: component } = await import('data:text/javascript;base64,' + Buffer.from(text).toString('base64') + '#' + invocation++);
  const instance = {
    ...component.data(), ...component.methods,
    $page: { finish() { calls.push('finish'); } }
  };
  return { instance, calls };
}

const settle = () => new Promise(resolve => setTimeout(resolve, 400));

test('failed save-and-stop keeps the game page open for retry', async () => {
  const { instance, calls } = await setup(false);
  instance.handleBack();
  await settle();
  assert.ok(!calls.includes('finish'));
  assert.equal(instance.exiting, false);
  assert.match(instance.statusText, /失败|未能/);
});

test('back saves through stop exactly once before closing the page', async () => {
  const { instance, calls } = await setup(true);
  instance.handleBack();
  instance.handleBack();
  await settle();
  assert.deepEqual(calls, ['stop', 'finish']);
});

test('hide during a completed exit does not start another save', async () => {
  const { instance, calls } = await setup(true);
  instance.exiting = true;
  instance.onHide();
  assert.deepEqual(calls, []);
});
