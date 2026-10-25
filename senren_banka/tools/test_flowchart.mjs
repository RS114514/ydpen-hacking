import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceUrl = new URL('../app/pages/flowchart/flowchart.js', import.meta.url);
const dataUrl = new URL('../app/data/flowchart_data.js', import.meta.url);
const dataSource = await readFile(dataUrl, 'utf8');
const dataModuleUrl = 'data:text/javascript;base64,' + Buffer.from(dataSource).toString('base64');
const { flowchart_data: data } = await import(dataModuleUrl);

async function loadFlowchart() {
  let source = await readFile(sourceUrl, 'utf8');
  source = source.replace(
    /import \{[^}]+\} from '\.\.\/\.\.\/common\.js';/,
    "const S = (name, extra) => Object.assign({ className: name }, extra || {}); const log = () => {}; const getGal = () => null;"
  );
  source = source.replace(
    "import { flowchart_data } from '../../data/flowchart_data.js';",
    `import { flowchart_data } from ${JSON.stringify(dataModuleUrl)};`
  );
  const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    Math,
    Number,
    String,
    Array,
    Object,
    JSON
  });
  const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  return import(moduleUrl);
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

function countTag(tree, tag) {
  if (!tree || typeof tree !== 'object' || Array.isArray(tree) || !Array.isArray(tree.children)) return 0;
  return (tree.tag === tag ? 1 : 0) + tree.children.reduce((sum, child) => sum + countTag(child, tag), 0);
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('真实数据驱动六路线，默认共通且只渲染当前章节', async () => {
  assert.equal(data.nodes.length, 204);
  assert.deepEqual(data.routes, ['共通', '芳乃', '茉子', 'ムラサメ', 'レナ', 'サブ']);
  const { flowchartMethods: methods, renderFlowchart } = await loadFlowchart();
  const state = { flowPanX: 7, flowPanY: 9 };
  Object.assign(state, methods);
  state.initFlowchart();
  assert.equal(state.flowRoute, '共通');
  assert.equal(state.flowPanX, 0);
  assert.equal(state.flowPanY, 0);
  for (const route of data.routes) {
    state.selectFcRoute(route);
    const chapters = state.getFcChapters();
    assert.ok(chapters.length > 0, `${route} 应有可用章节`);
    assert.ok(state.flowChapterIndex >= 0 && state.flowChapterIndex < chapters.length);
    assert.ok(state.getFcChapterNodes().every(node => node.route === route && node.chapter === chapters[state.flowChapterIndex]));
    const renderedText = textOf(renderFlowchart(state, h));
    assert.ok(renderedText.includes(route));
  }
  state.selectFcRoute('共通');
  state.setFcChapter(0);
  assert.ok(countTag(renderFlowchart(state, h), 'image') < 20, '不得一次堆叠全量节点图片');
  assert.ok(!textOf(renderFlowchart(state, h)).includes('s015*com_part_end'));
});

test('有效数字行按契约跳转，零行也有效', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const calls = [];
  const state = Object.assign({
    view: 'flowchart',
    initGame: (...args) => calls.push(args)
  }, methods);
  state.jumpFromFlowchart(0);
  assert.equal(state.currentScenario, 'main');
  assert.equal(state.currentScenarioData, null);
  assert.equal(state.view, 'game');
  assert.deepEqual(calls, [['main', 0]]);
  state.jumpFromFlowchart(107);
  assert.deepEqual(calls.at(-1), ['main', 107]);
});

test('无有效 targetLine 的节点只显示详情，绝不误跳', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const calls = [];
  const state = Object.assign({ view: 'flowchart', initGame: (...args) => calls.push(args) }, methods);
  state.initFlowchart();
  const invalid = data.nodes.find(node => node.id === 's100*yos_part_0');
  state.activateFcNode(invalid);
  assert.equal(calls.length, 0);
  assert.equal(state.view, 'flowchart');
  assert.equal(state.flowSelectedNodeId, invalid.id);
  assert.match(state.flowNotice, /不可跳转|章节详情/);
  for (const line of [null, undefined, NaN, Infinity, -1, '107']) {
    state.jumpFromFlowchart(line);
  }
  assert.equal(calls.length, 0);
  const valid = data.nodes.find(node => node.id === 's001*com_part_1');
  state.activateFcNode(valid);
  assert.deepEqual(calls, [['main', 0]]);
});

test('二维拖动及替代按钮共享动态边界', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const state = Object.assign({}, methods);
  state.initFlowchart();
  const chapterIndex = state.getFcChapters().indexOf('CHAPTER 3-2');
  state.setFcChapter(chapterIndex);
  assert.ok(state.flowPanMaxX > 0, JSON.stringify({ chapterIndex, current: state.flowChapterIndex, nodes: state.getFcChapterNodes().length, layout: state._fcLayout && { width: state._fcLayout.width, height: state._fcLayout.height } }));
  assert.ok(state.flowPanMaxY > 0);
  state.onFcTouchStart({ changedTouches: [{ pageX: 100, pageY: 100 }] });
  state.onFcTouchMove({ changedTouches: [{ pageX: -10000, pageY: -10000 }] });
  assert.equal(state.flowPanX, -state.flowPanMaxX);
  assert.equal(state.flowPanY, -state.flowPanMaxY);
  state.panFcBy(9999, 9999);
  assert.equal(state.flowPanX, 0);
  assert.equal(state.flowPanY, 0);
  state.panFcBy(-40, -30);
  assert.equal(state.flowPanX, -40);
  assert.equal(state.flowPanY, -30);
  state.resetFcPan();
  assert.equal(state.flowPanX, 0);
  assert.equal(state.flowPanY, 0);
});

test('章节前后导航、可点击进度和路线切换均恢复有效章节', async () => {
  const { flowchartMethods: methods, renderFlowchart } = await loadFlowchart();
  const state = Object.assign({}, methods);
  state.initFlowchart();
  assert.equal(state.getFcChapters()[state.flowChapterIndex], 'CHAPTER 1-1');
  state.prevFcChapter();
  assert.equal(state.flowChapterIndex, 0);
  state.nextFcChapter();
  assert.equal(state.getFcChapters()[state.flowChapterIndex], 'CHAPTER 1-2');
  state.selectFcChapter('CHAPTER 3-2');
  assert.equal(state.getFcChapterNodes().length, data.nodes.filter(n => n.route === '共通' && n.chapter === 'CHAPTER 3-2').length);
  const progressText = textOf(renderFlowchart(state, h));
  assert.ok(progressText.includes('3-2'));
  assert.ok(progressText.includes('选项') || progressText.includes('接下来干什么'));
  state.selectFcRoute('芳乃');
  assert.equal(state.flowRoute, '芳乃');
  assert.equal(state.getFcChapters()[state.flowChapterIndex], 'CHAPTER 3-8');
  const last = state.getFcChapters().length - 1;
  state.setFcChapter(last);
  state.nextFcChapter();
  assert.equal(state.flowChapterIndex, last);
  state.selectFcRoute('サブ');
  assert.ok(state.getFcChapterNodes().every(node => node.route === 'サブ'));
});

test('六路线全部章节的局部边、节点坐标及画布边界符合真实拓扑', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const state = Object.assign({}, methods);
  state.initFlowchart();
  const visited = new Set();
  let chapterCount = 0;
  let edgeCount = 0;

  for (const route of data.routes) {
    state.selectFcRoute(route);
    const chapters = state.getFcChapters();
    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      state.setFcChapter(chapterIndex);
      const chapter = chapters[chapterIndex];
      const context = `${route} / ${chapter}`;
      const nodes = state.getFcChapterNodes();
      const layout = state._fcLayout;
      const localIds = new Set(nodes.map(node => node.id));
      const expectedEdges = [];
      for (const node of nodes) {
        visited.add(node.id);
        const outgoing = data.chain[node.id] !== undefined ? data.chain[node.id] : node.next;
        const next = outgoing == null ? [] : (Array.isArray(outgoing) ? outgoing : [outgoing]);
        for (const target of next) {
          if (localIds.has(target)) expectedEdges.push({ from: node.id, to: target });
        }
      }
      const edgeKey = edge => `${edge.from}\u0000${edge.to}`;
      const actualEdges = layout.edges.map(edge => ({ from: edge.from, to: edge.to }));
      assert.deepEqual(
        actualEdges.sort((a, b) => edgeKey(a).localeCompare(edgeKey(b))),
        expectedEdges.sort((a, b) => edgeKey(a).localeCompare(edgeKey(b))),
        `${context} 的 chain/next 局部边必须完整且不多边`
      );
      assert.deepEqual(Object.keys(layout.placed).sort(), [...localIds].sort(), `${context} 每个局部节点只能布局一次`);
      assert.ok(Number.isFinite(layout.width) && layout.width > 0, `${context} 画布宽度无效`);
      assert.ok(Number.isFinite(layout.height) && layout.height > 0, `${context} 画布高度无效`);

      const positions = new Set();
      for (const node of nodes) {
        const placed = layout.placed[node.id];
        assert.equal(placed.node, node, `${context} / ${node.id} 布局必须引用真实节点`);
        for (const field of ['depth', 'row', 'x', 'y']) {
          assert.ok(Number.isFinite(placed[field]), `${context} / ${node.id} 的 ${field} 无效`);
        }
        assert.ok(Number.isInteger(placed.depth) && placed.depth >= 0, `${context} / ${node.id} 层级无效`);
        assert.ok(Number.isInteger(placed.row) && placed.row >= 0, `${context} / ${node.id} 行号无效`);
        assert.ok(placed.x >= 0 && placed.x + 148 <= layout.width, `${context} / ${node.id} 横向越出画布`);
        assert.ok(placed.y >= 0 && placed.y + 48 <= layout.height, `${context} / ${node.id} 纵向越出画布`);
        const position = `${placed.x},${placed.y}`;
        assert.ok(!positions.has(position), `${context} / ${node.id} 与其他节点坐标重叠`);
        positions.add(position);
      }
      for (const edge of layout.edges) {
        assert.equal(edge.source, layout.placed[edge.from], `${context} 边起点引用无效`);
        assert.equal(edge.target, layout.placed[edge.to], `${context} 边终点引用无效`);
        assert.ok(edge.target.depth > edge.source.depth, `${context} 局部边未形成正向 DAG`);
      }
      assert.equal(state.flowPanMaxX, Math.max(0, layout.width - 688), `${context} 横向拖动边界错误`);
      assert.equal(state.flowPanMaxY, Math.max(0, layout.height - 128), `${context} 纵向拖动边界错误`);
      assert.ok(state.flowPanX <= 0 && state.flowPanX >= -state.flowPanMaxX, `${context} 横向位置越界`);
      assert.ok(state.flowPanY <= 0 && state.flowPanY >= -state.flowPanMaxY, `${context} 纵向位置越界`);
      chapterCount += 1;
      edgeCount += layout.edges.length;
    }
  }
  assert.equal(chapterCount, 104, '必须遍历六路线的全部局部章节');
  assert.equal(edgeCount, 67, '必须核验全部局部边');
  assert.deepEqual([...visited].sort(), data.nodes.filter(node => node.chapter).map(node => node.id).sort(), '所有局部章节节点都必须被遍历');
});

test('9 个选择节点及全部 option 目标均在所属章节 DAG 中呈现', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const state = Object.assign({}, methods);
  state.initFlowchart();
  const selects = data.nodes.filter(node => node.type === 'select');
  assert.equal(selects.length, 9);
  assert.equal(data.choices.length, 9);
  assert.deepEqual(data.choices.map(choice => choice.id).sort(), selects.map(node => node.id).sort());
  let optionCount = 0;

  for (const choice of data.choices) {
    const select = selects.find(node => node.id === choice.id);
    assert.equal(select.route, choice.route, `${choice.id} 路线元数据不一致`);
    assert.equal(select.chapter, choice.chapter, `${choice.id} 章节元数据不一致`);
    state.selectFcRoute(choice.route);
    state.selectFcChapter(choice.chapter);
    const layout = state._fcLayout;
    const source = layout.placed[choice.id];
    assert.ok(source, `${choice.id} 未出现在所属章节 DAG`);
    assert.ok(choice.options.length > 0, `${choice.id} 不应有空选项`);
    const targets = new Set();
    for (const option of choice.options) {
      optionCount += 1;
      assert.ok(!targets.has(option.targetNode), `${choice.id} 存在重复 option 目标`);
      targets.add(option.targetNode);
      const targetNode = data.nodes.find(node => node.id === option.targetNode);
      assert.ok(targetNode, `${choice.id} option ${option.index} 指向不存在的节点`);
      assert.equal(targetNode.route, choice.route, `${option.targetNode} 路线不属于选择节点`);
      assert.equal(targetNode.chapter, choice.chapter, `${option.targetNode} 章节不属于选择节点`);
      const target = layout.placed[option.targetNode];
      assert.ok(target, `${option.targetNode} 未出现在所属章节 DAG`);
      assert.ok(target.depth > source.depth, `${choice.id} -> ${option.targetNode} 不是正向 DAG 边`);
      const edges = layout.edges.filter(edge => edge.from === choice.id && edge.to === option.targetNode);
      assert.equal(edges.length, 1, `${choice.id} -> ${option.targetNode} 必须且只能呈现一次`);
      assert.equal(edges[0].label, `${option.index}. ${option.text}`, `${choice.id} option ${option.index} 标签错误`);
    }
  }
  assert.equal(optionCount, 19, '必须核验全部选择目标');
});

test('全部真实节点严格遵守有效 targetLine 跳转与无行号禁跳契约', async () => {
  const { flowchartMethods: methods } = await loadFlowchart();
  const calls = [];
  const state = Object.assign({
    view: 'flowchart',
    initGame: (...args) => calls.push(args)
  }, methods);
  state.initFlowchart();
  let validCount = 0;
  let invalidCount = 0;

  for (const node of data.nodes) {
    const valid = typeof node.targetLine === 'number' && Number.isFinite(node.targetLine) && node.targetLine >= 0 && Number.isInteger(node.targetLine);
    const callCount = calls.length;
    state.view = 'flowchart';
    state._fcMoved = false;
    state.activateFcNode(node);
    assert.equal(state.flowSelectedNodeId, node.id, `${node.id} 应成为当前详情节点`);
    if (valid) {
      validCount += 1;
      assert.ok(node.targetLine <= 9154, `${node.id} targetLine 超出真实数据范围`);
      assert.equal(calls.length, callCount + 1, `${node.id} 有效行号必须触发一次跳转`);
      assert.deepEqual(calls.at(-1), ['main', node.targetLine], `${node.id} 跳转目标错误`);
      assert.equal(state.currentScenario, 'main');
      assert.equal(state.currentScenarioData, null);
      assert.equal(state.view, 'game');
    } else {
      invalidCount += 1;
      assert.equal(calls.length, callCount, `${node.id} 无有效行号，禁止跳转`);
      assert.equal(state.view, 'flowchart', `${node.id} 禁跳时必须留在流程图`);
      assert.match(state.flowNotice, /不可跳转|章节详情/, `${node.id} 禁跳时缺少详情提示`);
    }
  }
  assert.equal(validCount + invalidCount, data.nodes.length);
  assert.ok(validCount > 0 && invalidCount > 0, '跳转与禁跳两条路径都必须被真实数据覆盖');
  assert.equal(calls.length, validCount);
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
