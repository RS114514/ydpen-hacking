import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceUrl = new URL('../app/pages/flowchart/flowchart.js', import.meta.url);
const DATA_URL = new URL('../app/data/flowchart_data.js', import.meta.url);
const CHOICES_URL = new URL('../app/data/choices_all.js', import.meta.url);
const CHAPTER_URL = new URL('../app/data/chapter_all.js', import.meta.url);

function dataUrl(source) {
  return 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}

const flowDataSource = await readFile(DATA_URL, 'utf8');
const choicesSource = await readFile(CHOICES_URL, 'utf8');
const chapterSource = await readFile(CHAPTER_URL, 'utf8');
const flowDataUrl = dataUrl(flowDataSource);
const choicesDataUrl = dataUrl(choicesSource);
const chapterDataUrl = dataUrl(chapterSource);
const { flowchart_data: data } = await import(flowDataUrl);
const { choices_all: choicesAll } = await import(choicesDataUrl);

const SCENARIO_LENGTHS = {
  main: 9155,
  route_yoshino: 9790,
  route_mako: 9109,
  route_murasame: 10990,
  route_rena: 9438,
  route_koharu: 5277,
  route_roka: 1967
};

async function loadFlowchart() {
  let source = await readFile(sourceUrl, 'utf8');
  source = source.replace(
    /import \{[^}]+\} from '\.\.\/\.\.\/common\.js';/,
    "const S = (name, extra) => Object.assign({ className: name }, extra || {}); const log = () => {};"
  );
  source = source.replace(
    "import { flowchart_data } from '../../data/flowchart_data.js';",
    `import { flowchart_data } from ${JSON.stringify(flowDataUrl)};`
  );
  source = source.replace(
    "import { choices_all } from '../../data/choices_all.js';",
    `import { choices_all } from ${JSON.stringify(choicesDataUrl)};`
  );
  source = source.replace(
    "import { chapter_all } from '../../data/chapter_all.js';",
    `import { chapter_all } from ${JSON.stringify(chapterDataUrl)};`
  );
  assert.doesNotMatch(source, /from '\.\.\/\.\.\/data\//, 'flowchart.js must load with data imports stubbed');
  return import(dataUrl(source));
}

function h(tag, props, children) {
  return { tag, props: props || {}, children: children || [] };
}

function textOf(tree) {
  if (tree == null || tree === false) return '';
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (Array.isArray(tree)) return tree.map(textOf).join('|');
  return textOf(tree.children);
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function eachChapter(state, fn) {
  for (const route of data.routes) {
    state.selectFcRoute(route);
    const chapters = state.getFcChapters();
    assert.ok(chapters.length > 0, `${route} 应至少有一个选项章节`);
    for (let i = 0; i < chapters.length; i++) {
      state.setFcChapter(i);
      fn(route, chapters[i], state.getFcChapterNodes(), state._fcLayout);
    }
  }
}

test('流程图只保留选项与分支节点，不再堆普通章节', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const state = Object.assign({}, methods);
  state.initFlowchart();
  let selectCount = 0;
  let optionSectionCount = 0;

  eachChapter(state, (route, chapter, nodes) => {
    assert.ok(nodes.length > 0, `${route} / ${chapter} 不能为空`);
    const branchIds = new Set();
    for (const node of nodes) {
      assert.notEqual(node.type, 'chapter', `${route} / ${chapter} 不应出现章节节点`);
      if (node.type === 'select' || node.type === 'branch' || node.type === 'warp') {
        if (node.type === 'select') selectCount += 1;
        const next = Array.isArray(node.next) ? node.next : (node.next ? [node.next] : []);
        for (const id of next) branchIds.add(id);
      }
    }
    for (const node of nodes) {
      if (node.type === 'section') {
        assert.ok(branchIds.has(node.id), `${route} / ${chapter} 的 ${node.id} 是普通剧情节点，不应出现`);
        optionSectionCount += 1;
      } else {
        assert.ok(['select', 'branch', 'warp'].includes(node.type), `${node.id} 类型不应出现`);
      }
    }
  });

  assert.ok(selectCount >= 42, `至少应显示 42 个选择节点，实际 ${selectCount}`);
  assert.ok(optionSectionCount >= 80, `至少应显示 80 个选项分支点，实际 ${optionSectionCount}`);
  state.selectFcRoute('共通');
  const commonChapters = state.getFcChapters();
  assert.ok(!commonChapters.includes('CHAPTER 2-2'), '无选项的 CHAPTER 2-2 不应出现');
  assert.ok(!commonChapters.includes('CHAPTER 2-3'), '无选项的 CHAPTER 2-3 不应出现');
});

test('全部选择支都能从流程图精确跳到选择行', async () => {
  const { flowchartMethods: methods, fcNodeTarget } = await loadFlowchart();
  const state = Object.assign({}, methods);
  state.initFlowchart();
  const display = [];
  eachChapter(state, (route, chapter, nodes) => {
    for (const node of nodes) display.push(node);
  });

  const byId = {};
  for (const node of display) byId[node.id] = node;
  const routeChoices = choicesAll.filter(c => !c.scenario.startsWith('after_'));
  for (const choice of routeChoices) {
    const node = byId[choice.id];
    assert.ok(node, `${choice.id} 应出现在流程图`);
    assert.equal(node.type, 'select');
    const target = fcNodeTarget(node);
    assert.equal(target.scenario, choice.scenario, `${choice.id} 场景错误`);
    assert.equal(target.line, choice.line, `${choice.id} 行号错误`);
    assert.ok(target.line < SCENARIO_LENGTHS[choice.scenario], `${choice.id} 行号越界`);
  }
});

test('流程图节点点击会跳转到真实剧本行号', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const calls = [];
  const state = Object.assign({
    view: 'flowchart',
    initGame: (...args) => calls.push(args),
    choiceFlags: {},
    choiceSelections: {}
  }, methods);
  state.initFlowchart();

  function findNode(route, id) {
    state.selectFcRoute(route);
    for (const chapter of state.getFcChapters()) {
      state.selectFcChapter(chapter);
      const node = state.getFcChapterNodes().find(item => item.id === id);
      if (node) return node;
    }
    return null;
  }

  state.view = 'flowchart';
  state._fcMoved = false;
  state.activateFcNode(findNode('共通', 's001*com_part_1_sel'));
  assert.deepEqual(calls.at(-1), ['main', 107]);

  state.view = 'flowchart';
  state._fcMoved = false;
  state.activateFcNode(findNode('芳乃', 's110*yos_part_10_sel'));
  assert.deepEqual(calls.at(-1), ['route_yoshino', 6786]);

  state.view = 'flowchart';
  state._fcMoved = false;
  state.activateFcNode(findNode('サブ', 's521*rok_part_1_sel'));
  assert.deepEqual(calls.at(-1), ['route_roka', 702]);

  state.view = 'flowchart';
  state._fcMoved = false;
  state.activateFcNode(findNode('芳乃', 'opt_s110*yos_part_10_sel_2'));
  assert.deepEqual(calls.at(-1), ['route_yoshino', 6804]);
});

test('507 芦花/小春选择节点仍会清掉旧分流状态', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const calls = [];
  const state = Object.assign({
    view: 'flowchart',
    initGame: (...args) => calls.push(args),
    choiceFlags: { koh: 1, rok: 1 },
    choiceSelections: { 's507*sub_part_7_sel': 1 }
  }, methods);
  state.initFlowchart();
  state.selectFcRoute('サブ');
  let node = null;
  for (const chapter of state.getFcChapters()) {
    state.selectFcChapter(chapter);
    node = state.getFcChapterNodes().find(item => item.id === 's507*sub_part_7_sel');
    if (node) break;
  }
  assert.ok(node, '507 选择节点应保留在流程图');
  state.view = 'flowchart';
  state._fcMoved = false;
  state.activateFcNode(node);
  assert.deepEqual(calls.at(-1), ['route_koharu', 2727]);
  assert.equal(state.choiceFlags.koh, undefined);
  assert.equal(state.choiceFlags.rok, undefined);
  assert.equal(state.choiceSelections['s507*sub_part_7_sel'], undefined);
});

test('选项节点在局部 DAG 中位于选择节点之后', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const state = Object.assign({}, methods);
  state.initFlowchart();
  let edgeCount = 0;
  eachChapter(state, (route, chapter, nodes, layout) => {
    const localIds = new Set(nodes.map(node => node.id));
    for (const edge of layout.edges) {
      assert.ok(localIds.has(edge.from) && localIds.has(edge.to), `${route} / ${chapter} 边越界`);
      assert.ok(edge.target.depth > edge.source.depth, `${route} / ${chapter} 边不是正向 DAG`);
      edgeCount += 1;
    }
    for (const node of nodes) {
      const placed = layout.placed[node.id];
      assert.ok(placed, `${node.id} 未布局`);
      assert.ok(placed.x >= 0 && placed.y >= 0, `${node.id} 坐标越界`);
    }
  });
  assert.ok(edgeCount >= 80, `至少应有 80 条选择边，实际 ${edgeCount}`);
});

test('流程图渲染文本不再出现普通章节节点标题', async () => {
  const { flowchartMethods: methods, renderFlowchart } = await loadFlowchart();
  const state = Object.assign({}, methods);
  state.initFlowchart();
  state.selectFcRoute('共通');
  for (const chapter of state.getFcChapters()) {
    state.selectFcChapter(chapter);
    const rendered = textOf(renderFlowchart(state, h));
    assert.ok(!rendered.includes('s002*com_part_2'), '不应渲染共通线普通 section 节点');
    assert.ok(!rendered.includes('s003*com_part_3'), '不应渲染共通线普通 section 节点');
  }
});

let failures = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error.stack || error);
  }
}
console.log(`\n${tests.length - failures}/${tests.length} tests passed`);
if (failures) process.exitCode = 1;
