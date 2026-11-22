import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const MODULE_URL = new URL('app/pages/gallery/gallery.js', ROOT);
const CSS_URL = new URL('app/pages/gallery/gallery.css', ROOT);
const DATA_URL = new URL('app/data/gallery_cgs.js', ROOT);
const SCENE_DATA_URL = new URL('app/data/gallery_scenes.js', ROOT);

function dataUrl(source) {
  return 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}

const commonStub = `
export function S(names, extra) { return Object.assign({ testClasses: names }, extra || {}); }
export function log() {}
export function getGal() { return globalThis.__galleryTestGal; }
`;
const storageStub = `
export function readSettings() { return Object.assign({}, globalThis.__galleryTestSettings); }
`;

const dataSource = await readFile(DATA_URL, 'utf8');
const dataModule = await import(dataUrl(dataSource));
const galleryData = dataModule.gallery_cgs;
const sceneDataSource = await readFile(SCENE_DATA_URL, 'utf8');
const sceneDataModule = await import(dataUrl(sceneDataSource));
const sceneData = sceneDataModule.gallery_scenes;

let instrumentedSource = (await readFile(MODULE_URL, 'utf8')).replace(
  /import \{[^}]+\} from '\.\.\/\.\.\/common\.js';/,
  `import { S, log, getGal } from '${dataUrl(commonStub)}';`
);
instrumentedSource = instrumentedSource.replace(
  /import \{[^}]+\} from '\.\.\/\.\.\/storage\.js';/,
  `import { readSettings } from '${dataUrl(storageStub)}';`
);
instrumentedSource = instrumentedSource.replace(
  /import \{ gallery_cgs \} from '\.\.\/\.\.\/data\/gallery_cgs\.js';/,
  `import { gallery_cgs } from '${dataUrl(dataSource)}';`
);
instrumentedSource = instrumentedSource.replace(
  /import \{ gallery_scenes \} from '\.\.\/\.\.\/data\/gallery_scenes\.js';/,
  `import { gallery_scenes } from '${dataUrl(sceneDataSource)}';`
);
assert.doesNotMatch(
  instrumentedSource,
  /from '\.\.\/\.\.\/(?:common|storage|data)\//,
  'gallery.js must load with native dependencies stubbed'
);
const { galleryMethods, renderGallery } = await import(dataUrl(instrumentedSource));
const css = await readFile(CSS_URL, 'utf8');

function h(tag, data, children) {
  return { tag, data: data || {}, children: children == null ? [] : children };
}

function findRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}', 's'));
  assert.ok(match, 'missing CSS rule ' + selector);
  const style = {};
  for (const decl of match[1].split(';')) {
    const colon = decl.indexOf(':');
    if (colon < 0) continue;
    const key = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (key) style[key] = value;
  }
  return style;
}

function px(style, key) {
  const value = style[key];
  assert.ok(value, 'missing ' + key);
  const match = value.match(/^(-?[\d.]+)px$/);
  assert.ok(match, key + ' must be px, got ' + value);
  return parseFloat(match[1]);
}

function findByClass(node, className) {
  if (!node || typeof node !== 'object') return null;
  const classes = node.data && node.data.staticStyle && node.data.staticStyle.testClasses;
  if (classes && classes.split(/\s+/).includes(className)) return node;
  for (const child of node.children || []) {
    const found = findByClass(child, className);
    if (found) return found;
  }
  return null;
}

function collectByClass(node, className, out = []) {
  if (!node || typeof node !== 'object') return out;
  const classes = node.data && node.data.staticStyle && node.data.staticStyle.testClasses;
  if (classes && classes.split(/\s+/).includes(className)) out.push(node);
  for (const child of node.children || []) collectByClass(child, className, out);
  return out;
}

function textContent(node) {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.children);
}

function makeVm() {
  globalThis.__galleryTestSettings = { bgmEnabled: true, bgmVolume: 0.8 };
  const nativeCalls = [];
  globalThis.__galleryTestGal = {
    playBgm(file, loop, volume) { nativeCalls.push({ method: 'playBgm', file, loop, volume }); },
    stopBgm() { nativeCalls.push({ method: 'stopBgm' }); }
  };
  const vm = Object.assign(Object.create(galleryMethods), {
    galleryTab: 'cg',
    galleryCgGroup: '',
    galleryCgPage: 0,
    galleryCgFullscreen: false,
    galleryCgIndex: 0,
    gallerySceneGroup: '',
    galleryScenePage: 0,
    gallerySceneIndex: 0,
    gallerySceneExpr: 0,
    gallerySceneFullscreen: false,
    galleryStandChar: '',
    galleryStandDress: 0,
    galleryStandFace: 0
  });
  globalThis.__galleryTestNativeCalls = nativeCalls;
  vm.initTitleCalls = 0;
  vm.initTitle = function () { vm.initTitleCalls++; };
  vm.initGallery();
  return vm;
}

function clickNode(node) {
  assert.ok(node && node.data && node.data.on && typeof node.data.on.click === 'function', 'clickable node required');
  node.data.on.click();
}

function findTextNode(root, text) {
  let found = null;
  (function walk(node) {
    if (found || !node || typeof node !== 'object') return;
    if (typeof node.children === 'string' && node.children === text && node.data && node.data.on) {
      found = node;
      return;
    }
    for (const child of node.children || []) walk(child);
  })(root);
  return found;
}

function navButton(root, label) {
  const buttons = collectByClass(root, 'g-cg-nav-btn');
  const button = buttons.find((item) => textContent(item).includes(label));
  assert.ok(button, 'missing nav button ' + label);
  return button;
}

const GROUP_COUNTS = { yoshino: 25, mako: 18, murasame: 18, rena: 18, koharu: 8, roka: 8, common: 6 };

test('gallery data has 101 CGs in seven groups', () => {
  assert.equal(galleryData.length, 101);
  const counts = {};
  for (const item of galleryData) {
    counts[item.group] = (counts[item.group] || 0) + 1;
    assert.match(item.id, /^ev\d/);
    assert.ok(item.code && item.role);
  }
  assert.deepEqual(counts, GROUP_COUNTS);
});

test('CG tab starts with seven heroine/common selection cards', () => {
  const vm = makeVm();
  const tree = renderGallery(vm, h);
  const cards = collectByClass(tree, 'g-group-card');
  assert.equal(cards.length, 7);
  assert.equal(findByClass(tree, 'g-cg-tile'), null, 'no flat CG list before choosing a heroine');
  const text = textContent(tree);
  for (const name of ['芳乃', '茉子', '丛雨', '蕾娜', '小春', '芦花', '共通']) {
    assert.ok(text.includes(name), 'missing group ' + name);
  }
  assert.ok(text.includes('25 张 CG'));
  const image = findRule('.g-group-img');
  assert.equal(px(image, 'width'), 100);
  assert.equal(px(image, 'height'), 56);
});

test('selecting a heroine opens a swipeable list with page buttons', () => {
  const vm = makeVm();
  clickNode(collectByClass(renderGallery(vm, h), 'g-group-card')[0]);
  assert.equal(vm.galleryCgGroup, 'yoshino');
  let tree = renderGallery(vm, h);
  assert.equal(collectByClass(tree, 'g-cg-card').length, 25, 'all heroine CGs live in one swipe list');
  assert.ok(textContent(tree).includes('芳乃 · 1/7 · 25 张'));
  const list = findByClass(tree, 'g-cg-group-list');
  assert.equal(px({ width: list.data.staticStyle.width }, 'width'), 25 * 186 + 10);
  assert.equal(list.data.staticStyle.left, '0px');

  clickNode(navButton(tree, '下一页'));
  assert.equal(vm.galleryCgPage, 1);
  assert.equal(vm.galleryPanX, -4 * 186, 'next page slides exactly four cards');
  assert.ok(textContent(renderGallery(vm, h)).includes('2/7'));

  vm.onGalleryTouchStart({ changedTouches: [{ pageX: 700 }] });
  vm.onGalleryTouchMove({ changedTouches: [{ pageX: -99999 }] });
  assert.equal(vm.galleryPanX, -(25 * 186 + 10 - 800), 'drag stops at the last card');

  clickNode(navButton(renderGallery(vm, h), '女主选择'));
  assert.equal(vm.galleryCgGroup, '');
  assert.equal(collectByClass(renderGallery(vm, h), 'g-group-card').length, 7);
});

test('CG card opens fullscreen and pages only inside the selected group', () => {
  const vm = makeVm();
  vm.selectCgGroup('yoshino');
  const tile = collectByClass(renderGallery(vm, h), 'g-cg-card')[0];
  clickNode(tile);
  assert.equal(vm.galleryCgFullscreen, true);
  assert.equal(vm.galleryCgIndex, 0);

  const fs = renderGallery(vm, h);
  const image = findByClass(fs, 'gallery-fs-img');
  assert.ok(image);
  assert.equal(image.data.attrs.src, 'file:///userdisk/SenrenBanka/cg/ev101a.png');
  assert.ok(textContent(fs).includes('1/25'));

  vm.prevFullscreenCg();
  assert.equal(vm.galleryCgIndex, 24, 'prev wraps inside the heroine group');
  assert.ok(textContent(renderGallery(vm, h)).includes('25/25'));
  vm.nextFullscreenCg();
  assert.equal(vm.galleryCgIndex, 0);

  vm.exitFullscreenCg();
  assert.equal(vm.galleryCgFullscreen, false);
  assert.equal(vm.galleryCgGroup, 'yoshino', 'exit returns to the selected heroine grid');
});

test('scene data has the original 24 scenes in six heroine groups', () => {
  assert.equal(sceneData.length, 24);
  const counts = {};
  for (const item of sceneData) {
    counts[item.route] = (counts[item.route] || 0) + 1;
    assert.match(item.id, /^(yos|mak|mur|ren|koh|rok)\d+$/);
    assert.ok(item.role && item.title && item.cover && Array.isArray(item.cgs));
    assert.ok(item.variants.length >= 4, item.id + ' needs expression variants');
    for (const file of item.variants) assert.match(file, /\.png$/);
  }
  assert.deepEqual(counts, { yoshino: 4, mako: 6, murasame: 4, rena: 4, koharu: 3, roka: 3 });
});

test('scene tab starts with six heroine cards and opens a swipeable scene list', () => {
  const vm = makeVm();
  vm.setGalleryTab('scene');
  let tree = renderGallery(vm, h);
  const cards = collectByClass(tree, 'g-group-card');
  assert.equal(cards.length, 6);
  assert.ok(textContent(tree).includes('场景鉴赏'));
  assert.ok(textContent(tree).includes('24 个场景'));
  clickNode(cards[0]);
  assert.equal(vm.gallerySceneGroup, 'yoshino');
  tree = renderGallery(vm, h);
  assert.equal(collectByClass(tree, 'g-cg-card').length, 4);
  assert.ok(textContent(tree).includes('芳乃 · 1/1 · 4 个场景'));
  const list = findByClass(tree, 'g-cg-group-list');
  assert.equal(px({ width: list.data.staticStyle.width }, 'width'), 4 * 186 + 10);
  assert.ok(textContent(tree).includes('表情 '));
});

test('scene fullscreen switches expression variants and wraps scenes', () => {
  const vm = makeVm();
  vm.setGalleryTab('scene');
  vm.selectSceneGroup('yoshino');
  clickNode(collectByClass(renderGallery(vm, h), 'g-cg-card')[0]);
  assert.equal(vm.gallerySceneFullscreen, true);
  assert.equal(vm.gallerySceneIndex, 0);
  assert.equal(vm.gallerySceneExpr, 0);
  let fs = renderGallery(vm, h);
  let image = findByClass(fs, 'gallery-fs-img');
  assert.equal(image.data.attrs.src, 'file:///userdisk/SenrenBanka/scene/' + sceneData[0].variants[0]);
  const total = sceneData[0].variants.length;
  assert.ok(textContent(fs).includes('表情 1/' + total));

  vm.changeSceneExpr(1);
  assert.equal(vm.gallerySceneExpr, 1);
  image = findByClass(renderGallery(vm, h), 'gallery-fs-img');
  assert.equal(image.data.attrs.src, 'file:///userdisk/SenrenBanka/scene/' + sceneData[0].variants[1]);
  vm.changeSceneExpr(-2);
  assert.equal(vm.gallerySceneExpr, total - 1, 'expression wraps backwards');
  vm.changeSceneExpr(1);
  assert.equal(vm.gallerySceneExpr, 0, 'expression wraps forwards');

  vm.prevFullscreenScene();
  assert.equal(vm.gallerySceneIndex, 3, 'scene prev wraps inside the heroine group');
  vm.nextFullscreenScene();
  assert.equal(vm.gallerySceneIndex, 0);
  vm.exitFullscreenScene();
  assert.equal(vm.gallerySceneFullscreen, false);
  assert.equal(vm.gallerySceneGroup, 'yoshino');
});

test('stand tab shows seven characters and switches dress/expression diffs', () => {
  const vm = makeVm();
  vm.setGalleryTab('stand');
  let tree = renderGallery(vm, h);
  assert.ok(textContent(tree).includes('立绘鉴赏'));
  const cards = collectByClass(tree, 'g-group-card');
  assert.equal(cards.length, 7);
  assert.ok(textContent(tree).includes('7 名角色立绘'));

  clickNode(cards[0]);
  assert.equal(vm.galleryStandChar, 'yoshino');
  tree = renderGallery(vm, h);
  let image = findByClass(tree, 'g-stand-img');
  assert.equal(image.data.attrs.src, 'file:///userdisk/SenrenBanka/fg/芳乃_巫女服_01.png');
  assert.equal(collectByClass(tree, 'g-stand-dress-btn').length, 4);
  assert.ok(textContent(tree).includes('1 / 20'));

  vm.changeStandFace(1);
  assert.equal(vm.galleryStandFace, 1);
  image = findByClass(renderGallery(vm, h), 'g-stand-img');
  assert.equal(image.data.attrs.src, 'file:///userdisk/SenrenBanka/fg/芳乃_巫女服_02.png');
  vm.changeStandFace(-2);
  assert.equal(vm.galleryStandFace, 19, 'expression wraps backwards');
  vm.changeStandFace(1);
  assert.equal(vm.galleryStandFace, 0, 'expression wraps forwards');

  vm.setStandDress(3);
  assert.equal(vm.galleryStandDress, 3);
  image = findByClass(renderGallery(vm, h), 'g-stand-img');
  assert.equal(image.data.attrs.src, 'file:///userdisk/SenrenBanka/fg/芳乃_舞服_01.png');

  vm.backToStandChars();
  assert.equal(vm.galleryStandChar, '');
  assert.equal(collectByClass(renderGallery(vm, h), 'g-group-card').length, 7);
});

test('BGM tab keeps 55 tracks and its drag budget', () => {
  const vm = makeVm();
  vm.setGalleryTab('bgm');
  const tree = renderGallery(vm, h);
  const list = findByClass(tree, 'g-scroll-list');
  assert.ok(list);
  assert.equal(collectByClass(list, 'g-bgm-card').length, 55);
  assert.equal(px({ width: list.data.staticStyle.width }, 'width'), 55 * 130 + 40);
  vm.onGalleryTouchStart({ changedTouches: [{ pageX: 0 }] });
  vm.onGalleryTouchMove({ changedTouches: [{ pageX: -99999 }] });
  assert.equal(vm.galleryPanX, -(55 * 130 - 700));
});

test('gallery group, swipe list and cards fit the 800x220 viewport', () => {
  const root = findRule('.gallery-root');
  assert.equal(px(root, 'width'), 800);
  assert.equal(px(root, 'height'), 220);
  const header = findRule('.gallery-header');
  const groupView = findRule('.g-group-viewport');
  const listPane = findRule('.g-cg-group-pane');
  const listView = findRule('.g-cg-group-viewport');
  assert.equal(px(header, 'height') + px(groupView, 'height'), 220);
  assert.equal(px(header, 'height') + px(listPane, 'height'), 220);
  assert.equal(px(listView, 'height') + px(findRule('.g-cg-nav'), 'height'), px(listPane, 'height'));
  const groupRow = 7 * px(findRule('.g-group-card'), 'width') + 6 * 6;
  assert.ok(groupRow <= 800, 'seven heroine cards must fit');
  const standPane = findRule('.g-stand-pane');
  assert.equal(px(standPane, 'height'), 182);
  assert.equal(px(header, 'height') + px(standPane, 'height'), 220);

  const card = findRule('.g-cg-card');
  const image = findRule('.g-cg-card-img');
  const bar = findRule('.g-cg-card-bar');
  assert.equal(px(image, 'width'), 176);
  assert.equal(px(image, 'height'), 99);
  assert.equal(px(image, 'width') * 9, px(image, 'height') * 16, 'CG thumb must stay 16:9');
  assert.equal(px(card, 'height'), px(image, 'height') + px(bar, 'height'));
  const fourCards = 4 * (px(card, 'width') + 10);
  assert.ok(fourCards <= 800, 'four swipe cards must fit the viewport');
});

test('returning to title stops gallery audio and reinitializes title', () => {
  const vm = makeVm();
  vm.galleryPlayingBgm = 'BGM01.opus';
  const calls = globalThis.__galleryTestNativeCalls;
  vm.goBackTitle();
  assert.equal(vm.view, 'title');
  assert.equal(vm.initTitleCalls, 1);
  assert.equal(vm.galleryPlayingBgm, '');
  assert.equal(calls.at(-1).method, 'stopBgm');
});
