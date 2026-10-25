import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const MODULE_URL = new URL('app/pages/gallery/gallery.js', ROOT);
const CSS_URL = new URL('app/pages/gallery/gallery.css', ROOT);

const VIEW_W = 800;
const VIEW_H = 220;
const CG_COUNT = 37;
const CG_W = 176;
const CG_H = 154;
const CG_IMG_H = 99;
const CG_BAR_H = 55;
const CG_GAP = 10;
const BGM_COUNT = 55;

function dataUrl(source) {
  return 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}

const commonStub = `
export function S(names, extra) {
  return Object.assign({ testClasses: names }, extra || {});
}
export function log() {}
export function getGal() { return globalThis.__galleryTestGal; }
`;

const source = await readFile(MODULE_URL, 'utf8');
const instrumentedSource = source.replace(
  /import \{[^}]+\} from '\.\.\/\.\.\/common\.js';/,
  `import { S, log, getGal } from '${dataUrl(commonStub)}';`
);
assert.notEqual(instrumentedSource, source, 'test must load gallery.js with common.js stubbed');
const { galleryMethods, renderGallery } = await import(dataUrl(instrumentedSource));

const css = await readFile(CSS_URL, 'utf8');

function h(tag, data, children) {
  return { tag, data: data || {}, children: children == null ? [] : children };
}

function findRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}', 's'));
  assert.ok(match, `missing CSS rule ${selector}`);
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
  assert.ok(value, `missing ${key}`);
  const match = value.match(/^(-?[\d.]+)px$/);
  assert.ok(match, `${key} must be a px value, got ${value}`);
  return parseFloat(match[1]);
}

function colorLuminance(value) {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
  assert.ok(hex, `expected solid hex color, got ${value}`);
  const channels = [0, 2, 4].map((offset) => parseInt(hex[1].slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(a, b) {
  const la = colorLuminance(a);
  const lb = colorLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function findByClass(node, className) {
  if (!node || typeof node !== 'object') return null;
  const classes = node.data && node.data.staticStyle && node.data.staticStyle.testClasses;
  if (classes && classes.split(/\s+/).includes(className)) return node;
  if (!Array.isArray(node.children)) return null;
  for (const child of node.children) {
    const match = findByClass(child, className);
    if (match) return match;
  }
  return null;
}

function collectByClass(node, className, out = []) {
  if (!node || typeof node !== 'object') return out;
  const classes = node.data && node.data.staticStyle && node.data.staticStyle.testClasses;
  if (classes && classes.split(/\s+/).includes(className)) out.push(node);
  if (!Array.isArray(node.children)) return out;
  for (const child of node.children) collectByClass(child, className, out);
  return out;
}

function textContent(node) {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.children);
}

function makeVm() {
  globalThis.__galleryTestGal = {
    playBgm() {},
    stopBgm() {}
  };
  const vm = Object.assign(Object.create(galleryMethods), {});
  vm.initGallery();
  return vm;
}

function getList(vm) {
  const tree = renderGallery(vm, h);
  const viewport = findByClass(tree, 'g-scroll-viewport');
  assert.ok(viewport, 'scroll viewport must exist');
  const list = findByClass(viewport, 'g-scroll-list');
  assert.ok(list, 'scroll list must exist');
  return { tree, viewport, list };
}

function touch(pageX) {
  return { changedTouches: [{ pageX }] };
}

test('CSS renders every CG in a strict 16:9 176x99 frame', () => {
  const image = findRule('.g-cg-card-img');
  assert.equal(px(image, 'width'), CG_W);
  assert.equal(px(image, 'height'), CG_IMG_H);
  assert.equal(px(image, 'width') * 9, px(image, 'height') * 16, 'image must be exactly 16:9');
});

test('CG card is 176x154 with a 55px high-contrast info bar', () => {
  const card = findRule('.g-cg-card');
  const image = findRule('.g-cg-card-img');
  const bar = findRule('.g-cg-card-bar');
  const code = findRule('.g-cg-card-code');

  assert.equal(px(card, 'width'), CG_W);
  assert.equal(px(card, 'height'), CG_H);
  assert.equal(px(card, 'height'), px(image, 'height') + px(bar, 'height'));
  assert.equal(px(bar, 'width'), CG_W);
  assert.equal(px(bar, 'height'), CG_BAR_H);
  assert.ok(contrastRatio(bar['background-color'], code.color) >= 4.5, 'info bar text must keep strong contrast');
});

test('CG cards use a 10px gutter and show four full cards in the 800px viewport', () => {
  const card = findRule('.g-cg-card');
  assert.equal(px(card, 'margin-left'), CG_GAP);
  const fourCards = 4 * CG_W + 3 * CG_GAP;
  const fiveCards = 5 * CG_W + 4 * CG_GAP;
  assert.ok(fourCards <= VIEW_W, `four cards (${fourCards}px) must fit`);
  assert.ok(fiveCards > VIEW_W, `five cards (${fiveCards}px) must overflow so the list is obviously scrollable`);
});

test('CG list width and drag bounds derive from 176+10 and reach both ends', () => {
  const vm = makeVm();
  const { tree, list } = getList(vm);
  const cards = collectByClass(list, 'g-cg-card');
  assert.equal(cards.length, CG_COUNT);
  assert.equal(list.data.staticStyle.left, '0px');

  const contentWidth = px({ width: list.data.staticStyle.width }, 'width');
  assert.equal(contentWidth, CG_COUNT * (CG_W + CG_GAP) + CG_GAP);
  assert.ok(contentWidth > VIEW_W, 'content must be horizontally scrollable');

  vm.onGalleryTouchStart(touch(VIEW_W));
  vm.onGalleryTouchMove(touch(-99999));
  assert.equal(vm.galleryPanX, VIEW_W - contentWidth, 'drag must stop exactly at the last card');
  const lastRight = vm.galleryPanX + CG_COUNT * (CG_W + CG_GAP);
  assert.ok(lastRight <= VIEW_W, 'last card must not overflow the right edge');
  assert.ok(lastRight >= VIEW_W - 20, 'last card must be fully reachable with only a small right padding');

  vm.onGalleryTouchStart(touch(0));
  vm.onGalleryTouchMove(touch(99999));
  assert.equal(vm.galleryPanX, 0, 'drag must stop exactly at the first card');
  assert.ok(CG_GAP >= 0 && CG_GAP <= 20, 'first card must stay inside the left edge');

  assert.ok(findByClass(tree, 'g-scroll-viewport'), 'viewport must clip overflow');
});

test('BGM tab keeps its original 130px pitch and 700px pan budget', () => {
  const vm = makeVm();
  vm.setGalleryTab('bgm');
  const { list } = getList(vm);
  const cards = collectByClass(list, 'g-bgm-card');
  assert.equal(cards.length, BGM_COUNT);
  assert.equal(px({ width: list.data.staticStyle.width }, 'width'), BGM_COUNT * 130 + 40);

  vm.onGalleryTouchStart(touch(0));
  vm.onGalleryTouchMove(touch(-99999));
  assert.equal(vm.galleryPanX, -(BGM_COUNT * 130 - 700));
});

test('tapping a card still opens fullscreen with zoom and drag intact', () => {
  const vm = makeVm();
  const { list } = getList(vm);
  const cards = collectByClass(list, 'g-cg-card');
  assert.equal(typeof cards[0].data.on.click, 'function');
  cards[0].data.on.click();
  assert.equal(vm.galleryCgFullscreen, true);
  assert.equal(vm.galleryCgIndex, 0);

  const fs = renderGallery(vm, h);
  const fsImage = findByClass(fs, 'gallery-fs-img');
  assert.ok(fsImage, 'fullscreen image entry must exist');
  assert.equal(fsImage.data.attrs.src, 'file:///userdisk/SenrenBanka/cg/ev101a.png');
  const fsText = textContent(fs);
  for (const label of ['上张', '下张', '退出', '放大', '缩小', '重置']) {
    assert.ok(fsText.includes(label), `fullscreen must keep ${label} control`);
  }

  vm.zoomInImg();
  assert.equal(vm.galleryZoomIndex, 1);
  const zoomed = findByClass(renderGallery(vm, h), 'gallery-fs-img');
  const zoomW = px(zoomed.data.staticStyle, 'width');
  const zoomH = px(zoomed.data.staticStyle, 'height');
  assert.ok(Math.abs(zoomW / zoomH - 16 / 9) < 0.005, 'zoomed fullscreen image must stay 16:9');

  vm.galleryZoomIndex = 2;
  vm.galleryImgPanX = 0;
  vm.galleryImgPanY = 0;
  vm.onImgTouchStart({ changedTouches: [{ pageX: 0, pageY: 0 }] });
  vm.onImgTouchMove({ changedTouches: [{ pageX: 10000, pageY: 10000 }] });
  assert.ok(vm.galleryImgPanX <= 40 && vm.galleryImgPanY <= 30, 'drag overscroll must be capped');
  vm.onImgTouchEnd();
  assert.equal(vm.galleryImgPanX, 0);
  assert.equal(vm.galleryImgPanY, 0);

  vm.onImgTouchStart({ changedTouches: [{ pageX: 0, pageY: 0 }] });
  vm.onImgTouchMove({ changedTouches: [{ pageX: -10000, pageY: -10000 }] });
  vm.onImgTouchEnd();
  const z = vm.galleryZoomIndex;
  assert.ok(z === 2);
  const image = findByClass(renderGallery(vm, h), 'gallery-fs-img');
  const left = px(image.data.staticStyle, 'left');
  const top = px(image.data.staticStyle, 'top');
  assert.ok(left <= 0 && left >= -200, 'horizontal drag must clamp inside the viewport');
  assert.ok(top <= 0 && top >= -300, 'vertical drag must clamp inside the viewport');

  vm.exitFullscreenCg();
  assert.equal(vm.galleryCgFullscreen, false);
});

test('gallery root still fits the 800x220 touch viewport', () => {
  const root = findRule('.gallery-root');
  assert.equal(px(root, 'width'), VIEW_W);
  assert.equal(px(root, 'height'), VIEW_H);
  const viewport = findRule('.g-scroll-viewport');
  const list = findRule('.g-scroll-list');
  assert.ok(px(list, 'top') + px(findRule('.g-cg-card'), 'height') <= px(viewport, 'height'));
  assert.equal(px(viewport, 'height'), VIEW_H - px(findRule('.gallery-header'), 'height'));
});
