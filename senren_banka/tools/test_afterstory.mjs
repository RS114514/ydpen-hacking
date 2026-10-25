import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const MODULE_URL = new URL('app/pages/afterstory/afterstory.js', ROOT);
const CSS_URL = new URL('app/pages/afterstory/afterstory.css', ROOT);
const KEYS = ['yoshino', 'mako', 'murasame', 'rena', 'koharu', 'roka'];
const VOICE_PREFIX = '/userdisk/SenrenBanka/voice/';
const EXPECTED_HEROINES = [
  { key: 'yoshino', name: '朝武 芳乃', chapter: '115 · AFTER', lines: 707, voices: 260, ema: 'ema_12.jpg' },
  { key: 'mako', name: '常陆 茉子', chapter: '211 · AFTER', lines: 604, voices: 243, ema: 'ema_13.jpg' },
  { key: 'murasame', name: '丛 雨', chapter: '317 · AFTER', lines: 766, voices: 336, ema: 'ema_14.jpg' },
  { key: 'rena', name: '蕾 娜', chapter: '429 · AFTER', lines: 436, voices: 194, ema: 'ema_06.jpg' },
  { key: 'koharu', name: '鞍马 小春', chapter: '513 · AFTER', lines: 442, voices: 194, ema: 'ema_09.jpg' },
  { key: 'roka', name: '马场 芦花', chapter: '523 · AFTER', lines: 478, voices: 184, ema: 'ema_01.jpg' }
];

function dataUrl(source) {
  return 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}

const commonStub = `
export function S(names, extra) {
  return Object.assign({ testClasses: names }, extra || {});
}
export function log() {}
export function getGal() { return globalThis.__afterstoryTestGal; }
`;
const AFTER_DATA = {};
for (const key of KEYS) {
  const dataSource = await readFile(new URL('app/data/after_' + key + '.js', ROOT), 'utf8');
  const url = dataUrl(dataSource);
  const dataModule = await import(url);
  AFTER_DATA[key] = { url, lines: dataModule['after_' + key] };
}

const source = await readFile(MODULE_URL, 'utf8');
const commonUrl = dataUrl(commonStub);
let instrumentedSource = source.replace(
  "import { S, log, getGal } from '../../common.js';",
  "import { S, log, getGal } from '" + commonUrl + "';"
);
assert.notEqual(instrumentedSource, source, 'test must load the real afterstory module with common.js stubbed');
for (const key of KEYS) {
  instrumentedSource = instrumentedSource.replace(
    "import { after_" + key + " } from '../../data/after_" + key + ".js';",
    "import { after_" + key + " } from '" + AFTER_DATA[key].url + "';"
  );
}
const { afterstoryMethods, renderAfterstory } = await import(dataUrl(instrumentedSource));

function h(tag, data, children) {
  return { tag, data: data || {}, children: children == null ? [] : children };
}

function makeVm() {
  const voices = [];
  globalThis.__afterstoryTestGal = {
    stopVoice() { voices.push({ method: 'stopVoice' }); },
    playVoice(file, volume) { voices.push({ method: 'playVoice', file, volume }); }
  };
  const vm = Object.assign(Object.create(afterstoryMethods), {
    view: 'afterstory',
    initGameCalls: [],
    initTitleCalls: 0,
    initGame(...args) { this.initGameCalls.push(args); },
    initTitle() { this.initTitleCalls++; }
  });
  vm.initAfterStory();
  return { vm, voices };
}

function getCards(vm) {
  const tree = renderAfterstory(vm, h);
  const viewport = findByClass(tree, 'as-viewport');
  assert.ok(viewport, 'afterstory must render the horizontal viewport');
  const list = viewport.children[0];
  return { tree, viewport, list, cards: list.children };
}

function getBottomButton(card, index) {
  const actions = findByClass(card, 'as-card-bottom-actions');
  assert.ok(actions, 'card must expose the bottom action row');
  return actions.children[index];
}

function cssRule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}', 's'));
  assert.ok(match, 'missing CSS rule ' + selector);
  return match[1];
}

function cssNumber(rule, property) {
  const match = rule.match(new RegExp('(?:^|;|\\s)' + property + ':\\s*(-?[\\d.]+)(?:px)?'));
  assert.ok(match, 'missing CSS property ' + property + ' in: ' + rule.trim());
  return parseFloat(match[1]);
}

function cssOpacity(rule) {
  const match = rule.match(/opacity:\s*([\d.]+)/);
  return match ? parseFloat(match[1]) : 1;
}

function rgbaAlpha(rule, property = 'background-color') {
  const match = rule.match(new RegExp(property + ':\\s*rgba\\(([^)]+)\\)'));
  assert.ok(match, 'missing rgba ' + property + ' in: ' + rule.trim());
  const parts = match[1].split(',').map(part => parseFloat(part));
  assert.equal(parts.length, 4, 'rgba needs an explicit alpha');
  return parts[3];
}

function textContent(node) {
  if (typeof node === 'string') return node;
  if (!node) return '';
  if (typeof node.children === 'string') return node.children;
  if (!Array.isArray(node.children)) return '';
  return node.children.map(textContent).join('');
}

function allText(node) {
  return textContent(node);
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

function touch(pageX) {
  return { changedTouches: [{ pageX }] };
}

test('renders the six canonical heroine keys', () => {
  const { vm } = makeVm();
  const { cards } = getCards(vm);
  assert.deepEqual(cards.map(card => card.data.key), KEYS);
});

test('card metadata is calculated from the six real after arrays', () => {
  const { vm } = makeVm();
  const { cards } = getCards(vm);
  for (const expected of EXPECTED_HEROINES) {
    const realLines = AFTER_DATA[expected.key].lines;
    assert.equal(realLines.length, expected.lines, expected.key + ' fixture line count');
    assert.equal(realLines.filter(line => line[3]).length, expected.voices, expected.key + ' fixture voice count');

    const card = cards[KEYS.indexOf(expected.key)];
    assert.equal(allText(findByClass(card, 'as-card-name')), expected.name);
    assert.equal(allText(findByClass(card, 'as-card-chapter')), expected.chapter);
    assert.equal(
      allText(findByClass(card, 'as-card-stats')),
      expected.lines + ' 句台词 · ' + expected.voices + ' 条语音'
    );
  }
});

test('cards omit fabricated quotes, roles and event CG in favor of route ema', () => {
  const { vm } = makeVm();
  const { cards } = getCards(vm);
  for (const expected of EXPECTED_HEROINES) {
    const card = cards[KEYS.indexOf(expected.key)];
    assert.equal(findByClass(card, 'as-card-quote'), null);
    assert.equal(findByClass(card, 'as-card-role'), null);
    assert.equal(
      findByClass(card, 'as-card-cover-img').data.attrs.src,
      'file:///userdisk/SenrenBanka/bg/ema/' + expected.ema
    );
    assert.doesNotMatch(allText(card), /巫女 \/|忍者少女|幼刀幽灵|绿茶爱好者|温柔后辈|青梅竹马/);
  }
});

test('clicking each card selects it and plays its existing announcement', () => {
  for (const key of KEYS) {
    const { vm, voices } = makeVm();
    const { cards } = getCards(vm);
    const index = KEYS.indexOf(key);
    assert.equal(typeof cards[index].data.on.click, 'function');
    cards[index].data.on.click();
    assert.equal(vm.selectedAfterHeroine, key);
    const expectedFile = key === 'rena' ? 'lena_after.ogg' : key + '_after.ogg';
    assert.deepEqual(voices, [
      { method: 'stopVoice' },
      { method: 'playVoice', file: VOICE_PREFIX + expectedFile, volume: 1.0 }
    ]);
  }
});

test('enter button starts every after module at line zero and switches to game', () => {
  for (const key of KEYS) {
    const { vm } = makeVm();
    const { cards } = getCards(vm);
    const enter = getBottomButton(cards[KEYS.indexOf(key)], 1);
    assert.match(allText(enter), /进入后日谈物语/);
    enter.data.on.click();
    assert.equal(vm.view, 'game');
    assert.deepEqual(vm.initGameCalls, [['after_' + key, 0]]);
  }
});

test('selected card alone receives as-card-active', () => {
  const { vm } = makeVm();
  vm.selectedAfterHeroine = 'rena';
  const { cards } = getCards(vm);
  for (let i = 0; i < cards.length; i++) {
    const classes = cards[i].data.staticStyle.testClasses.split(/\s+/);
    assert.equal(classes.includes('as-card-active'), KEYS[i] === 'rena');
  }
});

test('a stationary touch still clicks after touch tracking', () => {
  const { vm, voices } = makeVm();
  const { cards } = getCards(vm);
  vm.onAsTouchStart(touch(100));
  vm.onAsTouchMove(touch(104));
  vm.onAsTouchEnd();
  cards[1].data.on.click();
  assert.equal(vm.selectedAfterHeroine, 'mako');
  assert.equal(voices.filter(call => call.method === 'playVoice').length, 1);
});

test('dragging suppresses the resulting click without poisoning later taps', () => {
  const { vm, voices } = makeVm();
  const { cards } = getCards(vm);
  vm.onAsTouchStart(touch(300));
  vm.onAsTouchMove(touch(180));
  vm.onAsTouchEnd();
  cards[1].data.on.click();
  assert.equal(vm.selectedAfterHeroine, 'yoshino');
  assert.equal(voices.length, 0);

  vm.onAsTouchStart(touch(180));
  vm.onAsTouchEnd();
  cards[1].data.on.click();
  assert.equal(vm.selectedAfterHeroine, 'mako');
  assert.equal(voices.filter(call => call.method === 'playVoice').length, 1);
});

test('returning and reopening keeps the last selection', () => {
  const { vm, voices } = makeVm();
  const { cards } = getCards(vm);
  cards[3].data.on.click();
  assert.equal(vm.selectedAfterHeroine, 'rena');
  vm.returnToTitleFromAs();
  assert.equal(vm.view, 'title');
  assert.equal(vm.initTitleCalls, 1);
  assert.equal(voices.at(-1).method, 'stopVoice');
  vm.view = 'afterstory';
  vm.initAfterStory();
  assert.equal(vm.selectedAfterHeroine, 'rena');
});

test('horizontal drag bounds and list width use the real six-card content size', () => {
  const { vm } = makeVm();
  const { list } = getCards(vm);
  const contentWidth = 6 * (180 + 12) + 12 * 2;
  const minPan = 800 - contentWidth;
  assert.equal(list.data.staticStyle.width, contentWidth + 'px');

  vm.onAsTouchStart(touch(500));
  vm.onAsTouchMove(touch(-5000));
  assert.equal(vm.afterPanX, minPan);
  vm.onAsTouchStart(touch(0));
  vm.onAsTouchMove(touch(5000));
  assert.equal(vm.afterPanX, 0);
});

test('every one of the six enlarged cards is fully reachable when panned', () => {
  const { vm } = makeVm();
  const { list } = getCards(vm);
  const width = parseFloat(list.data.staticStyle.width);
  const cardWidth = 180;
  const gap = 12;
  const padding = 12;
  assert.equal(width, 6 * (cardWidth + gap) + padding * 2);
  assert.equal(width, 1176);

  const minPan = 800 - width;
  assert.equal(minPan, -376);

  // first card sits fully inside the viewport at rest
  assert.ok(padding + cardWidth <= 800, 'first card visible at pan 0');

  // last card is fully visible at the far end, still leaving the right gutter
  const lastLeft = padding + 5 * (cardWidth + gap);
  const lastRight = lastLeft + cardWidth;
  assert.ok(lastRight + minPan <= 800 - padding, 'last card reachable at min pan');

  // every card can be fully displayed at some pan inside the allowed range
  for (let index = 0; index < 6; index++) {
    const cardLeft = padding + index * (cardWidth + gap);
    const pan = Math.max(minPan, Math.min(0, padding - cardLeft));
    assert.ok(cardLeft + pan >= 0, 'card ' + index + ' left edge reachable');
    assert.ok(cardLeft + cardWidth + pan <= 800, 'card ' + index + ' right edge reachable');
  }
});

test('layout remains 800 by 220 and keeps the active-card style', async () => {
  const css = await readFile(CSS_URL, 'utf8');
  assert.match(css, /\.as-root\s*\{[^}]*width:\s*800px;[^}]*height:\s*220px;/s);
  assert.match(css, /\.as-card-active\s*\{/);
});

test('enter control is wide enough for its label and has a touch-friendly height', async () => {
  const css = await readFile(CSS_URL, 'utf8');
  const button = css.match(/\.as-btn-play\s*\{([^}]*)\}/s);
  const label = css.match(/\.as-btn-play-text\s*\{([^}]*)\}/s);
  assert.ok(button && label);
  assert.ok(parseFloat(button[1].match(/width:\s*([\d.]+)px/)[1]) >= 90);
  assert.ok(parseFloat(button[1].match(/height:\s*([\d.]+)px/)[1]) >= 26);
  assert.ok(parseFloat(label[1].match(/font-size:\s*([\d.]+)px/)[1]) >= 10);
});

test('each card renders an ema cover band above a separate info band', () => {
  const { vm } = makeVm();
  const { cards } = getCards(vm);
  for (const card of cards) {
    const cover = findByClass(card, 'as-card-cover');
    const info = findByClass(card, 'as-card-info');
    assert.ok(cover, 'card needs a dedicated cover band');
    assert.ok(info, 'card needs a dedicated info band');
    assert.ok(card.children.indexOf(cover) < card.children.indexOf(info), 'cover renders above info');

    const coverImage = findByClass(cover, 'as-card-cover-img');
    assert.ok(coverImage, 'cover band owns the ema image');
    assert.match(coverImage.data.attrs.src, /\/bg\/ema\/ema_\d+\.jpg$/);

    // only the small chapter corner badge is allowed on the artwork
    assert.ok(findByClass(cover, 'as-card-chapter'));
    assert.equal(findByClass(cover, 'as-card-name'), null);
    assert.equal(findByClass(cover, 'as-card-stats'), null);
    assert.equal(findByClass(cover, 'as-card-bottom-actions'), null);

    // real metadata and both controls stay in the info band
    assert.ok(findByClass(info, 'as-card-name'));
    assert.ok(findByClass(info, 'as-card-stats'));
    assert.ok(findByClass(info, 'as-card-bottom-actions'));
    assert.equal(findByClass(info, 'as-card-cover-img'), null);
  }
});

test('cards grow to roughly 180x180 and still fit the 192px viewport', async () => {
  const css = await readFile(CSS_URL, 'utf8');
  const card = cssRule(css, '.as-card');
  const viewport = cssRule(css, '.as-viewport');
  const cardWidth = cssNumber(card, 'width');
  const cardHeight = cssNumber(card, 'height');
  const viewportHeight = cssNumber(viewport, 'height');

  assert.equal(viewportHeight, 192, 'viewport keeps its 192px band');
  assert.ok(cardWidth >= 176 && cardWidth <= 184, 'card width is about 180, got ' + cardWidth);
  assert.ok(cardHeight >= 176 && cardHeight <= 184, 'card height is about 180, got ' + cardHeight);
  assert.ok(cardHeight <= viewportHeight, 'card must not overflow the viewport');
  assert.ok(viewportHeight - cardHeight <= 14, 'card should fill most of the viewport');
});

test('ema cover is an independent 16:9 band that is not dimmed or stretched', async () => {
  const css = await readFile(CSS_URL, 'utf8');
  const card = cssRule(css, '.as-card');
  const cover = cssRule(css, '.as-card-cover');
  const image = cssRule(css, '.as-card-cover-img');
  const cardWidth = cssNumber(card, 'width');
  const coverWidth = cssNumber(cover, 'width');
  const coverHeight = cssNumber(cover, 'height');

  assert.equal(coverWidth, cardWidth, 'cover spans the full card width');
  assert.ok(Math.abs(coverWidth / coverHeight - 16 / 9) < 0.02, 'cover must stay 16:9, got ' + (coverWidth / coverHeight));
  assert.ok(Math.abs(coverWidth - 180) <= 2, 'cover is about 180 wide');
  assert.ok(Math.abs(coverHeight - 101) <= 2, 'cover is about 101 high');

  assert.equal(cssNumber(image, 'width'), coverWidth);
  assert.equal(cssNumber(image, 'height'), coverHeight);
  assert.ok(cssOpacity(image) >= 0.95, 'ema artwork must stay bright');
  assert.equal(cssNumber(cover, 'top'), 0);
  assert.equal(cssNumber(cover, 'left'), 0);
});

test('info band takes the remaining ~79px under the cover', async () => {
  const css = await readFile(CSS_URL, 'utf8');
  const card = cssRule(css, '.as-card');
  const cover = cssRule(css, '.as-card-cover');
  const info = cssRule(css, '.as-card-info');
  const cardHeight = cssNumber(card, 'height');
  const coverHeight = cssNumber(cover, 'height');
  const infoHeight = cssNumber(info, 'height');

  assert.ok(Math.abs(cardHeight - coverHeight - 79) <= 2, 'cover plus info fills the card');
  assert.ok(Math.abs(infoHeight - 79) <= 2, 'info band is about 79 high, got ' + infoHeight);
  assert.equal(cssNumber(info, 'top'), coverHeight, 'info starts right below the cover');
  assert.equal(cssNumber(info, 'width'), cssNumber(card, 'width'));

  const voiceHeight = cssNumber(cssRule(css, '.as-btn-voice'), 'height');
  const playHeight = cssNumber(cssRule(css, '.as-btn-play'), 'height');
  assert.ok(voiceHeight >= 26, 'voice button stays touch friendly');
  assert.ok(playHeight >= 26, 'enter button stays touch friendly');
  assert.ok(cssNumber(cssRule(css, '.as-card-name'), 'font-size') >= 13);
});

test('page backdrop is clearly visible while text stays readable', async () => {
  const css = await readFile(CSS_URL, 'utf8');
  const backdrop = cssRule(css, '.as-bg-img');
  const opacity = cssOpacity(backdrop);
  assert.ok(opacity >= 0.45 && opacity <= 0.6, 'backdrop opacity should be about 0.5, got ' + opacity);
  assert.equal(cssNumber(backdrop, 'width'), 800);
  assert.equal(cssNumber(backdrop, 'height'), 220);

  // a scrim sits between the backdrop and the content
  const shade = cssRule(css, '.as-bg-shade');
  const shadeAlpha = rgbaAlpha(shade);
  assert.ok(shadeAlpha > 0 && shadeAlpha <= 0.6, 'scrim must stay subtle');

  // opaque text panels keep contrast on top of the brighter backdrop
  assert.ok(rgbaAlpha(cssRule(css, '.as-card')) >= 0.9, 'card panel must be nearly opaque');
  assert.ok(rgbaAlpha(cssRule(css, '.as-card-info')) >= 0.9, 'info band must be nearly opaque');
  assert.ok(rgbaAlpha(cssRule(css, '.as-header')) >= 0.9, 'header must stay readable');
  assert.ok(rgbaAlpha(cssRule(css, '.as-card-active')) >= 0.9, 'active card must stay readable');
});
