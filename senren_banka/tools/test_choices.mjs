import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const GAME_URL = new URL('app/pages/game/game.js', ROOT);
const FLOW_URL = new URL('app/data/flowchart_data.js', ROOT);
const CHOICES_URL = new URL('app/data/choices_all.js', ROOT);

function dataUrl(source) {
  return 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}

const commonStub = `
export function S(names, extra) { return Object.assign({ testClasses: names }, extra || {}); }
export function log() {}
export function getChapterByLine() { return '1-1'; }
export function getGal() { return globalThis.__choiceGal; }
`;
const storageStub = `
export function readAllSaves() { return globalThis.__choiceSaves || {}; }
export function writeAllSaves() { return true; }
export function saveSlotRecord() {}
export function loadSlotRecord() { return null; }
export function getNowDateStr() { return '10-25 00:00'; }
export function pushBacklog() {}
export function readSettings() { return { bgmEnabled: true, bgmVolume: 0.8 }; }
`;

const rows = Array.from({ length: 120 }, (_, index) => [
  index,
  index === 106 ? '芦花' : '将臣',
  index === 106
    ? '「还是说我脸上沾了什么东西？」'
    : index === 107
      ? '「说实话，我确实是看入迷了」'
      : index === 112
        ? '「你眼睛下面沾了沙子」'
        : '第 ' + index + ' 句',
  null,
  '画面_黒',
  'bgm01',
  null,
  'CHAPTER 1-1'
]);

const flowSource = await readFile(FLOW_URL, 'utf8');
const choicesSource = await readFile(CHOICES_URL, 'utf8');
let gameSource = await readFile(GAME_URL, 'utf8');
gameSource = gameSource.replace(
  /import \{[^}]+\} from '\.\.\/\.\.\/common\.js';/,
  `import { S, getGal, log, getChapterByLine } from '${dataUrl(commonStub)}';`
);
gameSource = gameSource.replace(
  /import \{[^']*?\} from '\.\.\/\.\.\/storage\.js';/,
  `import { readAllSaves, writeAllSaves, saveSlotRecord, loadSlotRecord, getNowDateStr, pushBacklog, readSettings } from '${dataUrl(storageStub)}';`
);
gameSource = gameSource.replace(
  /import \{ chapter_all \} from '\.\.\/\.\.\/data\/chapter_all\.js';/,
  `import { chapter_all } from '${dataUrl('export var chapter_all = ' + JSON.stringify(rows) + ';')}';`
);
gameSource = gameSource.replace(
  /import \{ (after_\w+) \} from '\.\.\/\.\.\/data\/after_\w+\.js';/g,
  (_match, name) => `import { ${name} } from '${dataUrl(
    'export var ' + name + ' = ' + JSON.stringify(rows) + ';'
  )}';`
);
gameSource = gameSource.replace(
  /import \{ (scn_\w+) \} from '\.\.\/\.\.\/data\/scn_\w+\.js';/g,
  (_match, name) => `import { ${name} } from '${dataUrl(
    'export var ' + name + ' = ' + JSON.stringify(rows) + ';'
  )}';`
);
gameSource = gameSource.replace(
  /import \{ flowchart_data, choices as FLOW_CHOICES \} from '\.\.\/\.\.\/data\/flowchart_data\.js';/,
  `import { flowchart_data, choices as FLOW_CHOICES } from '${dataUrl(flowSource)}';`
);
gameSource = gameSource.replace(
  /import \{ choices_all \} from '\.\.\/\.\.\/data\/choices_all\.js';/,
  `import { choices_all } from '${dataUrl(choicesSource)}';`
);
gameSource = gameSource.replace(
  /import \{ fx_events \} from '\.\.\/\.\.\/data\/fx_events\.js';/,
  `import { fx_events } from '${dataUrl('export var fx_events = {};')}';`
);
assert.match(gameSource, /FLOW_CHOICES/, 'choice data import must exist');
assert.doesNotMatch(gameSource, /from '\.\.\/\.\.\/(?:common|storage|data)\//);

const { gameMethods, renderGame } = await import(dataUrl(gameSource));

function makeVm(line) {
  const calls = [];
  globalThis.__choiceGal = {
    playBgm(file, loop, volume) { calls.push({ method: 'playBgm', file, volume }); },
    stopBgm() { calls.push({ method: 'stopBgm' }); },
    playVoice(file) { calls.push({ method: 'playVoice', file }); },
    stopVoice() {},
    status() { return { voice: false }; }
  };
  const vm = Object.assign(Object.create(gameMethods), {
    view: 'game',
    currentScenario: 'main',
    choiceSelections: {},
    choiceFlags: {}
  });
  vm.initGame('main', line);
  return { vm, calls };
}

function h(tag, data, children) {
  return { tag, data: data || {}, children: children == null ? [] : children };
}

function textContent(node) {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.children);
}

test('choice line pauses progression and renders every real option', () => {
  const { vm } = makeVm(107);
  assert.ok(vm.activeChoice, 'choice must open at target line');
  assert.equal(vm.activeChoice.id, 's001*com_part_1_sel');
  const before = vm.currentLine;
  vm.nextLine();
  assert.equal(vm.currentLine, before, 'tap-to-advance must not skip a pending choice');

  const output = textContent(renderGame(vm, h));
  assert.match(output, /说实话/);
  assert.match(output, /敷衍过去/);
});

test('choosing a branch updates line, records flag and does not reopen', () => {
  const first = makeVm(107);
  first.vm.chooseChoice(first.vm.activeChoice.options[1]);
  assert.equal(first.vm.activeChoice, null);
  assert.equal(first.vm.currentLine, 112);
  assert.equal(first.vm.choiceSelections['s001*com_part_1_sel'], 2);
  assert.equal(first.vm.choiceFlags.sub, undefined, 'second option has no flag gain');

  const flagged = makeVm(107);
  flagged.vm.chooseChoice(flagged.vm.activeChoice.options[0]);
  assert.equal(flagged.vm.currentLine, 107);
  assert.equal(flagged.vm.activeChoice, null);
  assert.equal(flagged.vm.choiceFlags.sub, 1);

  flagged.vm.applyCurrentLine(true);
  assert.equal(flagged.vm.activeChoice, null, 'selected choice must stay resolved');
  flagged.vm.nextLine();
  assert.equal(flagged.vm.currentLine, 108);
});

test('choices without a playable target line stay disabled', () => {
  const { vm } = makeVm(107);
  assert.equal(vm.activeChoice.id, 's001*com_part_1_sel');
  const disabled = {
    index: 1,
    text: '不可跳转',
    targetNode: 'missing',
    flagGain: null
  };
  const before = vm.currentLine;
  vm.chooseChoice(disabled);
  assert.equal(vm.currentLine, before);
  assert.ok(vm.activeChoice, 'invalid option must not consume the choice');
});


test('branch choice skips the unchosen branch to the merge line', () => {
  const { vm } = makeVm(107);
  vm.chooseChoice(vm.activeChoice.options[0]);
  for (let i = 0; i < 4; i++) vm.nextLine();
  assert.equal(vm.currentLine, 111);
  vm.nextLine();
  assert.equal(vm.currentLine, 121, 'must jump to the merge, not play option 2');
});

test('normal END shows an END card instead of the pause menu', () => {
  const { vm } = makeVm(119);
  vm.nextLine();
  assert.equal(vm.normalEnd, true);
  assert.equal(vm.modalType, '');
  assert.match(textContent(renderGame(vm, h)), /NORMAL END/);
});


const choicesModule = await import(dataUrl(choicesSource));
const CHOICE_LENGTHS = {
  main: 9155,
  route_yoshino: 9790, route_mako: 9109, route_murasame: 10990,
  route_rena: 9438, route_koharu: 5277, route_roka: 1967,
  after_yoshino: 707, after_mako: 604, after_murasame: 766,
  after_rena: 436, after_koharu: 442, after_roka: 478
};

test('choices_all covers every scenario with valid skip ranges', () => {
  const all = choicesModule.choices_all;
  assert.equal(all.length, 51);
  assert.equal(all.filter((c) => c.scenario === 'main').length, 8);
  assert.equal(all.filter((c) => c.scenario.startsWith('after_')).length, 10);
  const seen = new Set();
  for (const choice of all) {
    const key = choice.scenario + ':' + choice.id;
    assert.ok(!seen.has(key), 'duplicate choice ' + key);
    seen.add(key);
    const len = CHOICE_LENGTHS[choice.scenario];
    assert.ok(len, 'unknown scenario ' + choice.scenario);
    assert.ok(choice.line >= 0 && choice.line < len, choice.id + ' line');
    assert.ok(choice.options.length >= 2, choice.id + ' options');
    for (const option of choice.options) {
      assert.ok(option.targetLine >= 0 && option.targetLine < len, choice.id + ' target');
      assert.ok(option.skipAfterLine >= option.targetLine && option.skipAfterLine < len, choice.id + ' after');
      assert.ok(option.skipToLine > option.skipAfterLine && option.skipToLine <= len, choice.id + ' merge');
    }
  }
});

test('nested 010 choice keeps inner and outer skip targets', () => {
  const all = choicesModule.choices_all;
  const outer = all.find((c) => c.id === 's010*010_01com_sel');
  const inner = all.find((c) => c.id === 's010*010_02A_sel');
  assert.ok(outer && inner);
  assert.equal(outer.options[0].skipAfterLine, 6306);
  assert.equal(outer.options[0].skipToLine, 6307);
  assert.equal(inner.options[0].skipAfterLine, 6011);
  assert.equal(inner.options[0].skipToLine, 6304);
  assert.equal(inner.options[1].skipAfterLine, 6112);
  assert.equal(inner.options[1].skipToLine, 6304);
});

test('loading inside a chosen branch restores the pending merge skip', () => {
  const { vm } = makeVm(107);
  vm.chooseChoice(vm.activeChoice.options[0]);
  vm.currentLine = 109;
  vm.modalSaves = {
    slot1: {
      line: 109,
      scenario: 'main',
      extra: { flags: { sub: 1 }, choices: { 's001*com_part_1_sel': 1 } }
    }
  };
  vm.executeLoadFromSlot(1);
  assert.equal(vm.currentLine, 109);
  vm.currentLine = 111;
  vm.nextLine();
  assert.equal(vm.currentLine, 121, 'loaded branch must still skip the unchosen branch');
});
