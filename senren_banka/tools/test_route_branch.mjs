import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const GAME_URL = new URL('app/pages/game/game.js', ROOT);
const TITLE_URL = new URL('app/pages/title/title.js', ROOT);
const FLOW_URL = new URL('app/data/flowchart_data.js', ROOT);
const CHOICES_URL = new URL('app/data/choices_all.js', ROOT);
const SETTINGS_PATH = '/userdisk/gal_data/senren_banka/settings.json';

function dataUrl(source) {
  return 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}

const commonStub = `
export function S(names, extra) { return Object.assign({ testClasses: names }, extra || {}); }
export function log() {}
export function getChapterByLine() { return '1-1'; }
export function getGal() { return globalThis.__routeGal; }
`;

const storageStub = `
var SETTINGS_PATH = ${JSON.stringify(SETTINGS_PATH)};
export function readAllSaves() { return globalThis.__routeSaves || {}; }
export function writeAllSaves() { return true; }
export function saveSlotRecord() {}
export function loadSlotRecord() { return null; }
export function getNowDateStr() { return '10-25 00:00'; }
export function pushBacklog() {}
export function readSettings() {
  var files = globalThis.__routeFiles || {};
  var txt = files[SETTINGS_PATH];
  if (txt) return JSON.parse(txt);
  return Object.assign(
    { gameId: 'senren_banka', bgmEnabled: true, bgmVolume: 0.8, clearedRoutes: [] },
    globalThis.__routeSettings || {}
  );
}
export function writeSettings(settings) {
  var files = globalThis.__routeFiles || (globalThis.__routeFiles = {});
  var merged = Object.assign({}, readSettings(), settings || {});
  files[SETTINGS_PATH] = JSON.stringify(merged);
  return true;
}
`;

const MAIN_LINES = 9155;
const ROUTE_LINES = 200;

function rowsFor(name, count) {
  return Array.from({ length: count }, (_, index) => [
    index,
    '',
    name + '-' + index,
    null,
    '画面_黒',
    'bgm01',
    null,
    'CHAPTER X'
  ]);
}

const mainRows = rowsFor('main', MAIN_LINES);

function installGal() {
  if (!globalThis.__routeFiles) globalThis.__routeFiles = {};
  const calls = [];
  globalThis.__routeGal = {
    playBgm(file, loop, volume) { calls.push({ method: 'playBgm', file, loop, volume }); },
    stopBgm() { calls.push({ method: 'stopBgm' }); },
    playVoice(file) { calls.push({ method: 'playVoice', file }); },
    stopVoice() { calls.push({ method: 'stopVoice' }); },
    status() { return { voice: false }; },
    readText(path) { return globalThis.__routeFiles[path] || ''; },
    writeText(path, value) {
      globalThis.__routeFiles[path] = String(value);
      return true;
    }
  };
  return calls;
}

function resetSettings(clearedRoutes) {
  globalThis.__routeFiles[SETTINGS_PATH] = JSON.stringify({
    gameId: 'senren_banka',
    bgmEnabled: true,
    bgmVolume: 0.8,
    clearedRoutes: clearedRoutes || []
  });
}

let gameSource = await readFile(GAME_URL, 'utf8');
const choicesSource = await readFile(CHOICES_URL, 'utf8');
gameSource = gameSource.replace(
  /import \{[^}]+\} from '\.\.\/\.\.\/common\.js';/,
  `import { S, getGal, log, getChapterByLine } from '${dataUrl(commonStub)}';`
);
gameSource = gameSource.replace(
  /import \{[^']*?\} from '\.\.\/\.\.\/storage\.js';/,
  `import { readAllSaves, writeAllSaves, saveSlotRecord, loadSlotRecord, getNowDateStr, pushBacklog, readSettings } from '${dataUrl(storageStub)}';`
);
gameSource = gameSource.replace(
  /import \{ (\w+) \} from '\.\.\/\.\.\/data\/(?!choices_all|fx_events)[^']+\.js';/g,
  (_match, name) => {
    const rows = name === 'chapter_all'
      ? mainRows
      : rowsFor(name, name === 'scn_koharu' ? 3500 : name === 'scn_yoshino' ? 9790 : name === 'scn_rena' ? 9438 : ROUTE_LINES);
    return `import { ${name} } from '${dataUrl('export var ' + name + ' = ' + JSON.stringify(rows) + ';')}';`;
  }
);
gameSource = gameSource.replace(
  /import \{ flowchart_data, choices as FLOW_CHOICES \} from '\.\.\/\.\.\/data\/flowchart_data\.js';/,
  `import { flowchart_data, choices as FLOW_CHOICES } from '${dataUrl(await readFile(FLOW_URL, 'utf8'))}';`
);
gameSource = gameSource.replace(
  /import \{ choices_all \} from '\.\.\/\.\.\/data\/choices_all\.js';/,
  `import { choices_all } from '${dataUrl(choicesSource)}';`
);
gameSource = gameSource.replace(
  /import \{ fx_events \} from '\.\.\/\.\.\/data\/fx_events\.js';/,
  `import { fx_events } from '${dataUrl('export var fx_events = {};')}';`
);
assert.doesNotMatch(
  gameSource,
  /from '\.\.\/\.\.\/(?:common|storage|data)\//,
  'game.js must load with every native dependency stubbed'
);
const { gameMethods, renderGame } = await import(dataUrl(gameSource));

let titleSource = await readFile(TITLE_URL, 'utf8');
titleSource = titleSource.replace(
  /import \{[^}]+\} from '\.\.\/\.\.\/common\.js';/,
  `import { S, getGal, log, getChapterByLine } from '${dataUrl(commonStub)}';`
);
titleSource = titleSource.replace(
  /import \{[^}]+\} from '\.\.\/\.\.\/storage\.js';/,
  `import { readAllSaves, readSettings, writeSettings } from '${dataUrl(storageStub)}';`
);
const { titleMethods } = await import(dataUrl(titleSource));

function freshVm(scenario, line, flags, selections) {
  installGal();
  resetSettings([]);
  const vm = Object.assign(Object.create(gameMethods), {
    view: 'game',
    currentScenario: scenario,
    choiceFlags: Object.assign({}, flags || {}),
    choiceSelections: Object.assign({}, selections || {})
  });
  vm.initGame(scenario, line);
  return vm;
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

function imageSrcs(node) {
  const out = [];
  (function walk(n) {
    if (n == null) return;
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (typeof n !== 'object') return;
    if (n.tag === 'image' && n.data && n.data.attrs && n.data.attrs.src) out.push(n.data.attrs.src);
    walk(n.children);
  })(node);
  return out;
}

function storedSettings() {
  return JSON.parse(globalThis.__routeFiles[SETTINGS_PATH]);
}

test('8435: len === 2 enters route_rena at line 0 and keeps flags/selections', () => {
  const vm = freshVm('main', 8435, { len: 2, sub: 1 }, { 's001*com_part_1_sel': 1 });
  vm.nextLine();
  assert.equal(vm.currentScenario, 'route_rena');
  assert.equal(vm.currentLine, 0);
  assert.equal(vm.activeChoice, null);
  assert.deepEqual(vm.choiceFlags, { len: 2, sub: 1 });
  assert.deepEqual(vm.choiceSelections, { 's001*com_part_1_sel': 1 });
});

test('8435: len below/above 2 continues linearly (strict equality)', () => {
  for (const len of [undefined, 1, 3]) {
    const vm = freshVm('main', 8435, len === undefined ? {} : { len });
    vm.nextLine();
    assert.equal(vm.currentScenario, 'main', 'len=' + len + ' must not branch');
    assert.equal(vm.currentLine, 8436, 'len=' + len + ' must advance to 8436');
  }
});

test('9104: yos === 2 wins, otherwise mak === 2, otherwise continue (strict equality)', () => {
  const cases = [
    [{ yos: 2, mak: 2 }, 'route_yoshino'],
    [{ yos: 2, mak: 1 }, 'route_yoshino'],
    [{ yos: 1, mak: 2 }, 'route_mako'],
    [{ yos: 3, mak: 2 }, 'route_mako'],
    [{ yos: 3, mak: 3 }, null],
    [{ yos: 1, mak: 1 }, null],
    [{}, null]
  ];
  for (const [flags, expected] of cases) {
    const vm = freshVm('main', 9104, flags);
    vm.nextLine();
    if (expected) {
      assert.equal(vm.currentScenario, expected, JSON.stringify(flags));
      assert.equal(vm.currentLine, 0, JSON.stringify(flags) + ' must start route at 0');
    } else {
      assert.equal(vm.currentScenario, 'main', JSON.stringify(flags));
      assert.equal(vm.currentLine, 9105, JSON.stringify(flags) + ' must continue to 9105');
    }
  }
});

test('9139: mur === 2 wins, then sub === 2 with any cleared route, otherwise continue', () => {
  const murasame = freshVm('main', 9139, { mur: 2, sub: 2 });
  murasame.nextLine();
  assert.equal(murasame.currentScenario, 'route_murasame');
  assert.equal(murasame.currentLine, 0);

  const koharu = freshVm('main', 9139, { mur: 1, sub: 2 }, { 's507*sub_part_7_sel': 2 });
  resetSettings(['yoshino']);
  koharu.nextLine();
  assert.equal(koharu.currentScenario, 'route_koharu', 'sub route must unlock after any clear');
  assert.equal(koharu.currentLine, 0);
  assert.deepEqual(koharu.choiceFlags, { mur: 1, sub: 2 });
  assert.deepEqual(koharu.choiceSelections, { 's507*sub_part_7_sel': 2 });

  const noClear = freshVm('main', 9139, { sub: 2 });
  resetSettings([]);
  noClear.nextLine();
  assert.equal(noClear.currentScenario, 'main');
  assert.equal(noClear.currentLine, 9140, 'sub needs a non-empty clearedRoutes list');

  const subOne = freshVm('main', 9139, { sub: 1 });
  resetSettings(['mako']);
  subOne.nextLine();
  assert.equal(subOne.currentScenario, 'main');
  assert.equal(subOne.currentLine, 9140);

  const strictMur = freshVm('main', 9139, { mur: 3, sub: 2 });
  resetSettings(['mako']);
  strictMur.nextLine();
  assert.equal(strictMur.currentScenario, 'route_koharu');
});

test('hasAnyClearedRoute is true only for a non-empty clearedRoutes list', () => {
  const vm = freshVm('main', 0, {});
  resetSettings([]);
  assert.equal(vm.hasAnyClearedRoute(), false);
  resetSettings(['mako']);
  assert.equal(vm.hasAnyClearedRoute(), true);
  globalThis.__routeFiles[SETTINGS_PATH] = JSON.stringify({ bgmEnabled: true });
  assert.equal(vm.hasAnyClearedRoute(), false, 'missing clearedRoutes must not unlock the sub route');
});

test('no flags: the three branch lines advance linearly to the normal END', () => {  for (const [line, next] of [[8435, 8436], [9104, 9105], [9139, 9140]]) {
    const vm = freshVm('main', line, {});
    vm.nextLine();
    assert.equal(vm.currentScenario, 'main');
    assert.equal(vm.currentLine, next);
  }
  const end = freshVm('main', 9154, {});
  end.nextLine();
  assert.equal(end.normalEnd, true, 'normal END shows the END card');
  assert.equal(end.modalType, '');
  assert.equal(end.currentLine, 9154);
});

test('sub route restores the original 507 choices and 509 flag split', () => {
  const koharu = freshVm('route_koharu', 2726, {});
  koharu.nextLine();
  assert.equal(koharu.activeChoice.id, 's507*sub_part_7_sel');
  assert.deepEqual(koharu.activeChoice.options.map((option) => option.text), [
    '小春的笑容',
    '芦花姐的笑容'
  ]);

  koharu.chooseChoice(koharu.activeChoice.options[0]);
  assert.equal(koharu.currentLine, 2727);
  assert.equal(koharu.choiceFlags.koh, 1);
  koharu.currentLine = 2736;
  koharu.nextLine();
  assert.equal(koharu.currentLine, 2754);

  const roka = freshVm('route_koharu', 2726, {});
  roka.nextLine();
  roka.chooseChoice(roka.activeChoice.options[1]);
  assert.equal(roka.currentLine, 2737);
  assert.equal(roka.choiceFlags.rok, 1);
  roka.currentLine = 2753;
  roka.nextLine();
  assert.equal(roka.currentLine, 2925);

  const kohEnd = freshVm('route_koharu', 3177, { koh: 1 });
  kohEnd.nextLine();
  assert.equal(kohEnd.currentLine, 3178);
  kohEnd.currentLine = 3251;
  kohEnd.nextLine();
  assert.equal(kohEnd.currentLine, 3339);
  assert.equal(kohEnd.currentScenario, 'route_koharu');

  const rokaEnd = freshVm('route_koharu', 3177, { rok: 1 });
  rokaEnd.nextLine();
  assert.equal(rokaEnd.currentLine, 3252);
  rokaEnd.currentLine = 3338;
  rokaEnd.nextLine();
  assert.equal(rokaEnd.currentScenario, 'route_roka');
  assert.equal(rokaEnd.currentLine, 0);
});

test('branch points never re-trigger outside the common route', () => {
  const route = freshVm('route_koharu', 8435, { len: 2, yos: 2, mak: 2, mur: 2 });
  for (const line of [8435, 9104, 9139]) {
    assert.equal(route.resolveRouteBranchAt(line), null, 'line ' + line + ' is main-only');
  }
  const vm = freshVm('route_koharu', 107, { len: 2 });
  vm.nextLine();
  assert.equal(vm.currentScenario, 'route_koharu');
  assert.equal(vm.currentLine, 108);
});

test('common choices stay main-only; route lines with the same index do not open them', () => {
  const main = freshVm('main', 107, {});
  assert.ok(main.activeChoice, 'main must still open the s001 choice');
  assert.equal(main.activeChoice.id, 's001*com_part_1_sel');

  const route = freshVm('route_yoshino', 107, {});
  assert.equal(route.activeChoice, null, 'route scenarios must not reuse main choice lines');
  route.nextLine();
  assert.equal(route.currentLine, 108);
});

test('all six route scenarios are registered and play from line 0', () => {
  const expected = {
    route_yoshino: 'scn_yoshino',
    route_mako: 'scn_mako',
    route_murasame: 'scn_murasame',
    route_rena: 'scn_rena',
    route_koharu: 'scn_koharu',
    route_roka: 'scn_roka'
  };
  for (const [scenario, dataName] of Object.entries(expected)) {
    const vm = freshVm('main', 0, {});
    vm.initGame(scenario, 0);
    assert.equal(vm.currentScenario, scenario);
    assert.equal(vm.currentLine, 0);
    assert.match(
      textContent(renderGame(vm, h)),
      new RegExp(dataName.replace(/_/g, '_') + '-0'),
      scenario + ' must use its own imported scenario data'
    );
  }
});

test('route END writes clearedRoutes deduped and keeps the menu flow', () => {
  const vm = freshVm('route_yoshino', 9789, { yos: 2 });
  resetSettings(['mako', 'yoshino']);
  vm.nextLine();
  assert.equal(vm.modalType, 'menu');
  assert.equal(vm.confirmModal, null);
  assert.deepEqual(storedSettings().clearedRoutes, ['mako', 'yoshino']);

  const rena = freshVm('route_rena', 9437, { len: 2 });
  resetSettings([]);
  rena.nextLine();
  assert.deepEqual(storedSettings().clearedRoutes, ['rena'], 'route_rena unlocks rena');
});

test('title allows route_* saves while new game still boots main/0', () => {
  installGal();
  resetSettings(['yoshino']);
  globalThis.__routeSaves = {
    latest: '2',
    slot2: {
      line: 123,
      scenario: 'route_rena',
      chapter: 'CHAPTER 5-2',
      extra: { flags: { len: 2 }, choices: { 's010*com_part_10_sel': 1 } }
    }
  };
  const calls = [];
  const vm = Object.assign(Object.create(titleMethods), {
    currentScenario: 'main',
    initGame: (scenario, line) => calls.push([scenario, line])
  });

  vm.continueGame();

  assert.deepEqual(calls, [['route_rena', 123]]);
  assert.equal(vm.currentScenario, 'route_rena');
  assert.equal(vm.currentLine, 123);
  assert.deepEqual(vm.choiceFlags, { len: 2 });
  assert.deepEqual(vm.choiceSelections, { 's010*com_part_10_sel': 1 });

  vm.currentScenario = 'route_murasame';
  vm.currentLine = 640;
  vm.choiceFlags = { mur: 2 };
  vm.choiceSelections = { old: 1 };
  vm.activeChoice = { id: 'old' };

  vm.startNewGame();

  assert.deepEqual(calls.at(-1), ['main', 0]);
  assert.equal(vm.currentScenario, 'main');
  assert.equal(vm.currentLine, 0);
  assert.deepEqual(vm.choiceFlags, {});
  assert.deepEqual(vm.choiceSelections, {});
  assert.equal(vm.activeChoice, null);
});

test('CG rows draw the cg image over the stage and suppress the sprite', () => {
  const vm = freshVm('main', 0, {});
  vm.currentScenario = 'test_cg';
  vm.currentLine = 0;
  vm.currentScenarioData = [[
    0, '', 'CG 场景', null, '画面_黒', 'bgm01.opus',
    { char: '芳乃', dress: '私服', face: '01' }, 'CHAPTER X', 'ev102a'
  ]];
  const srcs = imageSrcs(renderGame(vm, h));
  assert.ok(srcs.some((src) => /cg\/ev102a\.png$/.test(src)), JSON.stringify(srcs));
  assert.ok(!srcs.some((src) => /fg\//.test(src)), JSON.stringify(srcs));
});

test('non-CG rows keep the background and sprite unchanged', () => {
  const vm = freshVm('main', 0, {});
  vm.currentScenario = 'test_plain';
  vm.currentLine = 0;
  vm.currentScenarioData = [[
    0, '芳乃', '普通场景', null, '学院_教室a', 'bgm01.opus',
    { char: '芳乃', dress: '私服', face: '01' }, 'CHAPTER X', null
  ]];
  const srcs = imageSrcs(renderGame(vm, h));
  assert.ok(srcs.some((src) => /bg\/学院_教室a\.png$/.test(src)), JSON.stringify(srcs));
  assert.ok(srcs.some((src) => /fg\/芳乃_私服_01\.png$/.test(src)), JSON.stringify(srcs));
  assert.ok(!srcs.some((src) => /\/cg\//.test(src)), JSON.stringify(srcs));
});

test('ear variants use _NNh sprites and missing dresses fall back to 私服', () => {
  const cases = [
    [{ char: '芳乃', dress: '私服耳', face: '08' }, /fg\/芳乃_私服_08h\.png/],
    [{ char: '芳乃', dress: '巫女服耳', face: '05' }, /fg\/芳乃_巫女服_05h\.png/],
    [{ char: '芳乃', dress: '寝間着', face: '18' }, /fg\/芳乃_私服_18\.png/]
  ];
  for (const [charInfo, expected] of cases) {
    const vm = freshVm('main', 0, {});
    vm.currentScenario = 'test_sprite';
    vm.currentLine = 0;
    vm.currentScenarioData = [[
      0, '', '立绘', null, '画面_黒', 'bgm01.opus', charInfo, 'CHAPTER X', null
    ]];
    const srcs = imageSrcs(renderGame(vm, h));
    assert.ok(srcs.some((src) => expected.test(src)), JSON.stringify({ charInfo, srcs }));
  }
});

function findNode(node, predicate) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findNode(item, predicate);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object') return null;
  if (predicate(node)) return node;
  return findNode(node.children, predicate);
}

test('footer tags do not also advance the dialogue', () => {
  const vm = freshVm('main', 1305, {});
  const tree = renderGame(vm, h);
  const pane = findNode(tree, (n) => n.data && n.data.staticStyle && n.data.staticStyle.testClasses === 'game-dialog-pane');
  const zoomTag = findNode(tree, (n) => n.data && n.data.staticStyle && n.data.staticStyle.testClasses === 'game-sub-zoom-tag' && textContent(n) === '轻触特写');
  assert.ok(pane, 'dialog pane must exist');
  assert.ok(zoomTag, 'zoom footer tag must exist');
  const before = vm.currentLine;
  zoomTag.data.on.click();
  pane.data.on.click();
  assert.equal(vm.currentLine, before, 'footer tap must not advance the dialogue');
  assert.equal(vm.zoomMode, true, 'footer tap must still open zoom');
  vm.zoomMode = false;
  vm._footerTapTs = Date.now() - 1000;
  pane.data.on.click();
  assert.equal(vm.currentLine, before + 1, 'normal dialogue tap must advance');
});


test('koharu 508a skips the roka-only 508b block', () => {
  const vm = freshVm('route_koharu', 2924, { koh: 1 });
  vm.nextLine();
  assert.equal(vm.currentLine, 3133);
});


test('pending skip stack applies the inner branch merge before the outer one', () => {
  const rows = rowsFor('skip_fixture', 40);
  const vm = freshVm('main', 0, {});
  vm.currentScenario = 'test_skips';
  vm.currentScenarioData = rows;
  vm.currentLine = 5;
  vm._routeSkips = [
    { afterLine: 10, toLine: 20 },
    { afterLine: 5, toLine: 8 }
  ];
  vm.nextLine();
  assert.equal(vm.currentLine, 8, 'inner skip must fire first');
  assert.equal(vm._routeSkips.length, 1, 'outer skip must remain pending');
  vm.currentLine = 10;
  vm.nextLine();
  assert.equal(vm.currentLine, 20, 'outer skip must still fire');
  assert.equal(vm._routeSkips.length, 0);
});


test('route choice opens from choices_all and skips to its merge line', () => {
  const vm = freshVm('route_yoshino', 6786, {});
  assert.equal(vm.currentScenario, 'route_yoshino');
  assert.equal(vm.currentLine, 6786, 'stub data must include line 6786');
  assert.ok(vm.activeChoice, 'route choice must open');
  assert.equal(vm.activeChoice.id, 's110*yos_part_10_sel');
  assert.ok(vm.activeChoice.prompt, 'prompt must be filled from the previous row');
  vm.chooseChoice(vm.activeChoice.options[0]);
  for (let i = 0; i < 40 && vm.currentLine < 6803; i++) vm.nextLine();
  assert.equal(vm.currentLine, 6803);
  vm.nextLine();
  assert.equal(vm.currentLine, 6818, 'must jump over the unchosen 6804-6817 branch');
});


test('SD/chibi rows render the sd layer', () => {
  const vm = freshVm('main', 0, {});
  vm.currentScenario = 'test_sd';
  vm.currentLine = 0;
  vm.currentScenarioData = [[
    0, '芳乃', 'Q版场景', null, '神社_境内a', 'bgm01.opus',
    { char: '芳乃', file: '芳乃.stand', dress: '私服', face: '01' }, 'CHAPTER X', '', 'sd001aa'
  ]];
  const tree = renderGame(vm, h);
  const srcs = imageSrcs(tree);
  assert.ok(srcs.some((src) => /\/sd\/SD001AA\.png$/.test(src)), JSON.stringify(srcs));
  assert.ok(!srcs.some((src) => /\/fg\//.test(src)), JSON.stringify(srcs));
  const sdImage = findNode(tree, (n) => n.tag === 'image' && n.data && n.data.attrs && /\/sd\/SD001AA\.png$/.test(n.data.attrs.src || ''));
  assert.equal(sdImage.data.attrs.resize, 'contain', 'chibi scene must keep its margins and show the scene around it');
});


test('menu jumpToNextChoice skips to the next unselected choice', () => {
  const vm = freshVm('main', 108, {}, { 's001*com_part_1_sel': 1 });
  vm.openGameModal('menu');
  assert.equal(vm.jumpToNextChoice(), true);
  assert.equal(vm.currentLine, 3458);
  assert.equal(vm.modalType, '');
});

test('menu jumpToNextChoice reports when no later choice exists', () => {
  const selections = {
    's001*com_part_1_sel': 1,
    's006*com_part_6_sel': 1,
    's010*com_part_10_sel': 1,
    's010*010_01com_sel': 1,
    's010*010_02A_sel': 1,
    's010*010_02com_sel': 1,
    's012*com_part_12_sel': 1,
    's014*com_part_14_sel': 1
  };
  const vm = freshVm('main', 9000, {}, selections);
  vm.openGameModal('menu');
  assert.equal(vm.jumpToNextChoice(), false);
  assert.match(vm.menuNotice, /没有可跳转/);
  assert.equal(vm.modalType, 'menu');
});

test('menu prevLine steps back one sentence', () => {
  const vm = freshVm('main', 10, {}, {});
  vm.openGameModal('menu');
  assert.equal(vm.prevLine(), true);
  assert.equal(vm.currentLine, 9);
  assert.equal(vm.modalType, '');
  vm.currentLine = 0;
  vm.openGameModal('menu');
  assert.equal(vm.prevLine(), false);
  assert.match(vm.menuNotice, /第一句/);
});

test('FX layers render black/white/overlay when set', () => {
  const vm = freshVm('main', 0, {});
  vm.fxWhite = 0.8;
  vm.fxBlack = 0.5;
  vm.fxOverlaySrc = 'file:///userdisk/SenrenBanka/fx/ef_牙.png';
  const tree = renderGame(vm, h);
  assert.ok(findNode(tree, (n) => n.data && n.data.staticStyle && n.data.staticStyle.testClasses === 'game-fx-black'));
  assert.ok(findNode(tree, (n) => n.data && n.data.staticStyle && n.data.staticStyle.testClasses === 'game-fx-white'));
  assert.ok(imageSrcs(tree).some((src) => /\/fx\/ef_牙\.png$/.test(src)));
});

test('monster character renders the static 祟り神 artwork', () => {
  const vm = freshVm('main', 0, {});
  vm.currentScenario = 'test_monster';
  vm.currentLine = 0;
  vm.currentScenarioData = [[
    0, '祟り神', '怪物出现', null, '画面_黒', 'bgm01.opus',
    { char: '祟り神', file: '祟り神.stand', dress: '', face: '' }, 'CHAPTER X', '', ''
  ]];
  const srcs = imageSrcs(renderGame(vm, h));
  assert.ok(srcs.some((src) => /\/fg\/祟り神\.png$/.test(src)), JSON.stringify(srcs));
});
