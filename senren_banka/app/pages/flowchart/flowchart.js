// pages/flowchart/flowchart.js —— 由真实拓扑数据驱动的章节局部流程图
import { S, log } from '../../common.js';
import { flowchart_data } from '../../data/flowchart_data.js';
import { choices_all } from '../../data/choices_all.js';
import { chapter_all } from '../../data/chapter_all.js';

var FC_VIEW_WIDTH = 688;
var FC_VIEW_HEIGHT = 128;
var FC_CARD_WIDTH = 148;
var FC_CARD_HEIGHT = 48;
var FC_STEP_X = 174;
var FC_STEP_Y = 58;
var FC_NODE_MAP = {};
var FC_CHOICE_MAP = {};
var FC_ROUTES = flowchart_data.routes;
var FC_EMA = {
  '共通': ['01', '02', '03', '04', '05', '07', '08', '10'],
  '芳乃': ['12', '04', '15'],
  '茉子': ['13', '07', '03'],
  'ムラサメ': ['14', '02', '10'],
  'レナ': ['06', '11', '05'],
  'サブ': ['09', '01', '15']
};

// 个人线路线 → 剧本 key。サブ线在运行时会按 storage 前缀细分到小春/芦花。
export var FC_ROUTE_SCENARIO = {
  '芳乃': 'route_yoshino',
  '茉子': 'route_mako',
  'ムラサメ': 'route_murasame',
  'レナ': 'route_rena',
  'サブ': 'route_koharu'
};

// 各个人线 CHAPTER 在剧本数组中的 0 基起始行；由剧本第 8 列逐行统计得到。
// EPILOGUE 在剧本数据中写作 SEC-xxx，这里映射到对应 SEC 的首行。
export var FC_CHAPTER_START = {
  route_yoshino: {
    'CHAPTER 3-8': 0, 'CHAPTER 4-1': 286, 'CHAPTER 4-2': 908, 'CHAPTER 4-3': 1710,
    'CHAPTER 5-1': 2371, 'CHAPTER 5-2': 3034, 'CHAPTER 5-3': 3358, 'CHAPTER 5-4': 4155,
    'CHAPTER 5-5': 4712, 'CHAPTER 6-1': 5471, 'CHAPTER 6-2': 5696, 'CHAPTER 7-1': 6835,
    'CHAPTER 7-2': 7354, 'CHAPTER 7-3': 8089, 'EPILOGUE': 8971
  },
  route_mako: {
    'CHAPTER 3-8': 0, 'CHAPTER 4-1': 211, 'CHAPTER 4-2': 848, 'CHAPTER 4-3': 1016,
    'CHAPTER 5-1': 1858, 'CHAPTER 5-2': 2338, 'CHAPTER 5-3': 2932, 'CHAPTER 6-1': 4052,
    'CHAPTER 6-2': 4385, 'CHAPTER 6-3': 4682, 'CHAPTER 6-4': 4704, 'CHAPTER 6-5': 4907,
    'CHAPTER 7-1': 5751, 'CHAPTER 7-2': 6709, 'EPILOGUE': 7703
  },
  route_murasame: {
    'CHAPTER 4-1': 0, 'CHAPTER 4-2': 626, 'CHAPTER 4-3': 1037, 'CHAPTER 4-4': 1379,
    'CHAPTER 5-1': 1929, 'CHAPTER 5-2': 2267, 'CHAPTER 5-3': 2564, 'CHAPTER 5-4': 3170,
    'CHAPTER 6-1': 4418, 'CHAPTER 6-2': 4834, 'CHAPTER 6-3': 5019, 'CHAPTER 6-4': 5272,
    'CHAPTER 7-1': 6152, 'CHAPTER 7-2': 6724, 'CHAPTER 7-3': 6966, 'CHAPTER 8-1': 7409,
    'CHAPTER 8-2': 8011, 'CHAPTER 8-3': 8583, 'CHAPTER 8-4': 9091, 'CHAPTER 8-5': 9198,
    'CHAPTER 9-1': 9863, 'CHAPTER 9-2': 10059, 'EPILOGUE': 10121
  },
  route_rena: {
    'CHAPTER 3-6': 0, 'CHAPTER 4-1': 715, 'CHAPTER 4-2': 1096, 'CHAPTER 5-1': 1729,
    'CHAPTER 5-2': 2547, 'CHAPTER 5-3': 3227, 'CHAPTER 5-4': 3860, 'CHAPTER 6-1': 4472,
    'CHAPTER 6-2': 4928, 'CHAPTER 7-1': 5754, 'CHAPTER 7-2': 6858, 'CHAPTER 7-3': 7344,
    'CHAPTER 8-1': 7640, 'CHAPTER 8-2': 8215, 'EPILOGUE': 8841
  },
  // サブ线 4-1 ~ 7-1 使用合并剧本 scn_koharu；8-1 起按角色分到 koharu / roka。
  route_koharu: {
    'CHAPTER 4-1': 0, 'CHAPTER 4-2': 372, 'CHAPTER 4-3': 759, 'CHAPTER 4-4': 1210,
    'CHAPTER 4-5': 1420, 'CHAPTER 5-1': 1696, 'CHAPTER 5-2': 1968, 'CHAPTER 6-1': 2272,
    'CHAPTER 6-2': 2559, 'CHAPTER 6-3': 2597, 'CHAPTER 6-4': 2754, 'CHAPTER 6-5': 3115,
    'CHAPTER 7-1': 3133, 'CHAPTER 8-1': 3339, 'CHAPTER 8-2': 3459, 'CHAPTER 8-3': 4271,
    'CHAPTER 8-4': 4349, 'EPILOGUE': 4835
  },
  route_roka: {
    'CHAPTER 8-1': 0, 'CHAPTER 8-2': 981, 'EPILOGUE': 1489
  }
};

// 分支节点无法只靠 CHAPTER 首行表达，单独指定目标与后续分流上下文。
var FC_SPECIAL_TARGETS = {
  's507*sub_part_7_sel': {
    scenario: 'route_koharu', line: 2727,
    clearChoice: 's507*sub_part_7_sel', clearFlags: true
  },
  's507*507_01A': {
    scenario: 'route_koharu', line: 2727,
    flags: { koh: 1, rok: 0 }, selections: { 's507*sub_part_7_sel': 1 },
    skipAfterLine: 2736, skipToLine: 2754
  },
  's507*507_01B': {
    scenario: 'route_koharu', line: 2737,
    flags: { koh: 0, rok: 1 }, selections: { 's507*sub_part_7_sel': 2 },
    skipAfterLine: 2753, skipToLine: 2925
  },
  's508a*sub_part_8a': {
    scenario: 'route_koharu', line: 2754,
    flags: { koh: 1, rok: 0 }, selections: { 's507*sub_part_7_sel': 1 }
  },
  's508b*sub_part_8b': {
    scenario: 'route_koharu', line: 2925,
    flags: { koh: 0, rok: 1 }, selections: { 's507*sub_part_7_sel': 2 }
  },
  's508b*chapter65rok': {
    scenario: 'route_koharu', line: 3115,
    flags: { koh: 0, rok: 1 }, selections: { 's507*sub_part_7_sel': 2 }
  },
  's509*509_koh': {
    scenario: 'route_koharu', line: 3178,
    flags: { koh: 1, rok: 0 }, skipAfterLine: 3251, skipToLine: 3339
  },
  's509*509_rok': {
    scenario: 'route_koharu', line: 3252,
    flags: { koh: 0, rok: 1 }, skipAfterLine: 3338, skipScenario: 'route_roka'
  }
};

for (var fc_i = 0; fc_i < flowchart_data.nodes.length; fc_i++) {
  FC_NODE_MAP[flowchart_data.nodes[fc_i].id] = flowchart_data.nodes[fc_i];
}
for (var fc_j = 0; fc_j < flowchart_data.choices.length; fc_j++) {
  FC_CHOICE_MAP[flowchart_data.choices[fc_j].id] = flowchart_data.choices[fc_j];
}

var FC_SCENARIO_ROUTE = {
  main: '共通',
  route_yoshino: '芳乃',
  route_mako: '茉子',
  route_murasame: 'ムラサメ',
  route_rena: 'レナ',
  route_koharu: 'サブ',
  route_roka: 'サブ'
};

function fcChapterForLine(scenario, line) {
  if (scenario === 'main') {
    var row = chapter_all[line];
    return (row && row[7]) || 'CHAPTER 1-1';
  }
  var table = FC_CHAPTER_START[scenario] || {};
  var keys = Object.keys(table);
  var best = '';
  var bestStart = -1;
  for (var i = 0; i < keys.length; i++) {
    var start = table[keys[i]];
    if (typeof start === 'number' && start <= line && start > bestStart) {
      best = keys[i];
      bestStart = start;
    }
  }
  return best || 'CHAPTER ?';
}

function fcRawNext(node) {
  var next = flowchart_data.chain[node.id];
  if (next === undefined) next = node.next;
  if (!next) return [];
  return Array.isArray(next) ? next : [next];
}

// 流程图只保留「出现选项 / 路线分歧」的节点，以及选项直接通往的分支点。
// 原版章节节点（CHAPTER 2-2、2-3 这类纯剧情段）不再进入画布。
var FC_DISPLAY_NODES = [];
var FC_DISPLAY_MAP = {};
function addFcDisplayNode(node) {
  if (!node || FC_DISPLAY_MAP[node.id]) return;
  FC_DISPLAY_MAP[node.id] = true;
  FC_DISPLAY_NODES.push(node);
}

for (var fcDispI = 0; fcDispI < flowchart_data.nodes.length; fcDispI++) {
  var fcDispNode = flowchart_data.nodes[fcDispI];
  if (fcDispNode.type === 'select' || fcDispNode.type === 'branch' || fcDispNode.type === 'warp') {
    addFcDisplayNode(fcDispNode);
    if (fcDispNode.type === 'select') {
      var fcDispNext = fcRawNext(fcDispNode);
      for (var fcDispJ = 0; fcDispJ < fcDispNext.length; fcDispJ++) {
        var fcOptionNode = FC_NODE_MAP[fcDispNext[fcDispJ]];
        if (fcOptionNode && fcOptionNode.type === 'section') addFcDisplayNode(fcOptionNode);
      }
    }
  }
}

for (var fcChoiceI = 0; fcChoiceI < choices_all.length; fcChoiceI++) {
  var fcChoice = choices_all[fcChoiceI];
  var fcChoiceRoute = FC_SCENARIO_ROUTE[fcChoice.scenario];
  if (!fcChoiceRoute) continue;
  if (FC_DISPLAY_MAP[fcChoice.id]) {
    if (!FC_CHOICE_MAP[fcChoice.id]) {
      var fcExistingOpts = [];
      for (var fcExistI = 0; fcExistI < fcChoice.options.length; fcExistI++) {
        var fcExistOption = fcChoice.options[fcExistI];
        fcExistingOpts.push({
          index: fcExistOption.index,
          text: fcExistOption.text,
          targetNode: fcExistOption.targetNode || null
        });
      }
      FC_CHOICE_MAP[fcChoice.id] = { id: fcChoice.id, options: fcExistingOpts };
    }
    continue;
  }
  var fcChoiceChapter = fcChapterForLine(fcChoice.scenario, fcChoice.line);
  var fcOptIds = [];
  var fcOptChoices = [];
  for (var fcOptI = 0; fcOptI < fcChoice.options.length; fcOptI++) {
    var fcOption = fcChoice.options[fcOptI];
    var fcOptId = 'opt_' + fcChoice.id + '_' + fcOption.index;
    if (!FC_DISPLAY_MAP[fcOptId]) {
      addFcDisplayNode({
        id: fcOptId,
        type: 'section',
        route: fcChoiceRoute,
        scenario: fcChoice.scenario,
        chapter: fcChoiceChapter,
        title: fcOption.text || ('分支 ' + fcOption.index),
        storage: null,
        target: null,
        targetLine: fcOption.targetLine,
        exact: true,
        next: null
      });
    }
    fcOptIds.push(fcOptId);
    fcOptChoices.push({ index: fcOption.index, text: fcOption.text, targetNode: fcOptId });
  }
  if (!FC_DISPLAY_MAP[fcChoice.id]) {
    addFcDisplayNode({
      id: fcChoice.id,
      type: 'select',
      route: fcChoiceRoute,
      scenario: fcChoice.scenario,
      chapter: fcChoiceChapter,
      title: fcChoice.prompt || ('选项 #' + fcChoice.line),
      storage: null,
      target: null,
      targetLine: fcChoice.line,
      exact: true,
      next: fcOptIds
    });
  }
  if (!FC_CHOICE_MAP[fcChoice.id]) {
    FC_CHOICE_MAP[fcChoice.id] = { id: fcChoice.id, options: fcOptChoices };
  }
}

function fcChapterSortKey(chapter) {
  if (chapter === 'EPILOGUE') return [999, 999];
  var m = /^CHAPTER (\d+)-(\d+)$/.exec(chapter || '');
  return m ? [Number(m[1]), Number(m[2])] : [1000, 1000];
}

function fcTypeSortOrder(type) {
  if (type === 'select') return 0;
  if (type === 'branch' || type === 'warp') return 1;
  return 2;
}

FC_DISPLAY_NODES.sort(function (a, b) {
  var ra = FC_ROUTES.indexOf(a.route);
  var rb = FC_ROUTES.indexOf(b.route);
  if (ra !== rb) return ra - rb;
  var ka = fcChapterSortKey(a.chapter);
  var kb = fcChapterSortKey(b.chapter);
  if (ka[0] !== kb[0]) return ka[0] - kb[0];
  if (ka[1] !== kb[1]) return ka[1] - kb[1];
  var la = typeof a.targetLine === 'number' ? a.targetLine : 0;
  var lb = typeof b.targetLine === 'number' ? b.targetLine : 0;
  if (la !== lb) return la - lb;
  return fcTypeSortOrder(a.type) - fcTypeSortOrder(b.type);
});

function fcValidLine(line) {
  return typeof line === 'number' && isFinite(line) && line >= 0 && Math.floor(line) === line;
}

function fcNodeScenario(node) {
  if (!node) return null;
  if (node.scenario) return node.scenario;
  if (node.route === '共通') return 'main';
  if (node.route === 'サブ') {
    var storage = node.storage || '';
    if (/^(521|522|523)/.test(storage)) return 'route_roka';
    return 'route_koharu';
  }
  return FC_ROUTE_SCENARIO[node.route] || null;
}

// 返回 { scenario, line, flags?, selections?, clearChoice?, clearFlags?, skip... } 或 null。
// 共通线沿用官方节点里已有的精确 targetLine；个人线由 CHAPTER 起始表与分支节点特例推导。
export function fcNodeTarget(node) {
  if (!node) return null;

  if (node.route === '共通') {
    return fcValidLine(node.targetLine) ? { scenario: 'main', line: node.targetLine } : null;
  }

  var special = FC_SPECIAL_TARGETS[node.id];
  if (special) return Object.assign({}, special);

  var scenario = fcNodeScenario(node);
  if (!scenario) return null;

  if (node.exact && fcValidLine(node.targetLine)) {
    return { scenario: scenario, line: node.targetLine };
  }

  var table = FC_CHAPTER_START[scenario] || {};
  var line = (typeof node.chapter === 'string' && node.chapter)
    ? table[node.chapter]
    : 0;
  if (!fcValidLine(line)) return null;
  return { scenario: scenario, line: line };
}

function fcClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fcNextList(node) {
  return fcRawNext(node);
}

function fcChapters(route) {
  var chapters = [];
  var seen = {};
  for (var i = 0; i < FC_DISPLAY_NODES.length; i++) {
    var node = FC_DISPLAY_NODES[i];
    if (node.route === route && node.chapter && !seen[node.chapter]) {
      seen[node.chapter] = true;
      chapters.push(node.chapter);
    }
  }
  return chapters;
}

function fcLayout(nodes) {
  var local = {};
  var depths = {};
  var edges = [];
  var i;
  var j;
  for (i = 0; i < nodes.length; i++) {
    local[nodes[i].id] = true;
    depths[nodes[i].id] = 0;
  }
  for (i = 0; i < nodes.length; i++) {
    var next = fcNextList(nodes[i]);
    for (j = 0; j < next.length; j++) {
      if (local[next[j]]) edges.push({ from: nodes[i].id, to: next[j] });
    }
  }
  // 有向边松弛得到 DAG 层级；上限防止异常环导致死循环。
  for (i = 0; i < nodes.length; i++) {
    for (j = 0; j < edges.length; j++) {
      var candidate = depths[edges[j].from] + 1;
      if (candidate > depths[edges[j].to]) depths[edges[j].to] = candidate;
    }
  }
  var rows = {};
  var placed = {};
  var maxDepth = 0;
  var maxRows = 1;
  for (i = 0; i < nodes.length; i++) {
    var depth = depths[nodes[i].id];
    var row = rows[depth] || 0;
    rows[depth] = row + 1;
    placed[nodes[i].id] = {
      node: nodes[i],
      depth: depth,
      row: row,
      x: 12 + depth * FC_STEP_X,
      y: 10 + row * FC_STEP_Y
    };
    if (depth > maxDepth) maxDepth = depth;
    if (row + 1 > maxRows) maxRows = row + 1;
  }
  for (i = 0; i < edges.length; i++) {
    edges[i].source = placed[edges[i].from];
    edges[i].target = placed[edges[i].to];
    var chainCondition = flowchart_data.chain[edges[i].from + ':' + edges[i].to];
    if (chainCondition && chainCondition[0] === 'branch') {
      edges[i].label = chainCondition[1] || '分歧';
    }
  }
  var choiceMap = {};
  for (i = 0; i < nodes.length; i++) {
    if (nodes[i].type === 'select' && FC_CHOICE_MAP[nodes[i].id]) {
      var options = FC_CHOICE_MAP[nodes[i].id].options;
      for (j = 0; j < options.length; j++) choiceMap[options[j].targetNode] = options[j];
    }
  }
  for (i = 0; i < edges.length; i++) {
    var option = choiceMap[edges[i].to];
    var choice = FC_CHOICE_MAP[edges[i].source.node.id];
    if (option && choice && choice.id === edges[i].source.node.id) {
      edges[i].label = option.index + '. ' + option.text;
    }
  }
  return {
    placed: placed,
    edges: edges,
    width: 24 + (maxDepth + 1) * FC_STEP_X,
    height: 20 + maxRows * FC_STEP_Y
  };
}

function fcRefreshLayout(vm) {
  var nodes = vm.getFcChapterNodes();
  var layout = fcLayout(nodes);
  vm._fcLayout = layout;
  vm.flowPanMaxX = Math.max(0, layout.width - FC_VIEW_WIDTH);
  vm.flowPanMaxY = Math.max(0, layout.height - FC_VIEW_HEIGHT);
  vm.flowPanX = fcClamp(Number(vm.flowPanX) || 0, -vm.flowPanMaxX, 0);
  vm.flowPanY = fcClamp(Number(vm.flowPanY) || 0, -vm.flowPanMaxY, 0);
}

function fcEnsure(vm) {
  if (FC_ROUTES.indexOf(vm.flowRoute) < 0) vm.flowRoute = '共通';
  var chapters = fcChapters(vm.flowRoute);
  vm.flowChapterIndex = fcClamp(Number(vm.flowChapterIndex) || 0, 0, Math.max(0, chapters.length - 1));
  if (typeof vm.flowNotice !== 'string') vm.flowNotice = '轻触节点跳转；无行号节点仅查看详情';
}

function fcShortChapter(chapter) {
  if (chapter === 'EPILOGUE') return '尾声';
  return chapter.replace('CHAPTER ', '');
}

function fcEma(vm) {
  var list = FC_EMA[vm.flowRoute] || FC_EMA['共通'];
  var id = list[vm.flowChapterIndex % list.length];
  return 'file:///userdisk/SenrenBanka/bg/ema/ema_' + id + '.jpg';
}

function fcTypeName(type) {
  if (type === 'select') return '选项';
  if (type === 'branch') return '条件';
  if (type === 'warp') return '跳转';
  if (type === 'chapter') return '章节';
  return '剧情';
}

export var flowchartMethods = {
  initFlowchart: function () {
    this.flowPanX = 0;
    this.flowPanY = 0;
    this.flowRoute = '共通';
    this.flowChapterIndex = 0;
    this.flowSelectedNodeId = null;
    this.flowNotice = '轻触节点跳转；无行号节点仅查看详情';
    this._fcStartX = 0;
    this._fcStartY = 0;
    this._fcStartPanX = 0;
    this._fcStartPanY = 0;
    this._fcMoved = false;
    fcRefreshLayout(this);
  },
  getFcChapters: function () {
    fcEnsure(this);
    return fcChapters(this.flowRoute);
  },
  getFcChapterNodes: function () {
    fcEnsure(this);
    var chapter = fcChapters(this.flowRoute)[this.flowChapterIndex];
    var nodes = [];
    for (var i = 0; i < FC_DISPLAY_NODES.length; i++) {
      var node = FC_DISPLAY_NODES[i];
      if (node.route === this.flowRoute && node.chapter === chapter) nodes.push(node);
    }
    return nodes;
  },
  selectFcRoute: function (route) {
    if (FC_ROUTES.indexOf(route) < 0) return;
    this.flowRoute = route;
    this.flowChapterIndex = 0;
    this.flowSelectedNodeId = null;
    this.flowNotice = route + '线 · 请选择章节或节点';
    this.resetFcPan();
    fcRefreshLayout(this);
  },
  setFcChapter: function (index) {
    fcEnsure(this);
    var count = fcChapters(this.flowRoute).length;
    this.flowChapterIndex = fcClamp(Number(index) || 0, 0, Math.max(0, count - 1));
    this.flowSelectedNodeId = null;
    this.flowNotice = '章节 ' + fcChapters(this.flowRoute)[this.flowChapterIndex];
    this.resetFcPan();
    fcRefreshLayout(this);
  },
  selectFcChapter: function (chapter) {
    var index = this.getFcChapters().indexOf(chapter);
    if (index >= 0) this.setFcChapter(index);
  },
  prevFcChapter: function () {
    this.setFcChapter(this.flowChapterIndex - 1);
  },
  nextFcChapter: function () {
    this.setFcChapter(this.flowChapterIndex + 1);
  },
  activateFcNode: function (node) {
    if (!node || this._fcMoved) return;
    this.flowSelectedNodeId = node.id;

    var target = fcNodeTarget(node);
    if (!target) {
      this.flowNotice = '章节详情 · ' + node.title + ' · 无有效行号，不可跳转';
      return;
    }

    var flags = Object.assign({}, this.choiceFlags || {});
    var selections = Object.assign({}, this.choiceSelections || {});
    var isKoharu = target.scenario === 'route_koharu';

    // 跳入小春/芦花合并剧本时，除非节点显式指定分支，否则清掉旧分流状态，
    // 避免上一次游玩残留的 koh/rok 旗标把本次跳转带到另一条支线。
    if (target.clearFlags || (isKoharu && !target.flags)) {
      delete flags.koh;
      delete flags.rok;
    }
    if (target.clearChoice) delete selections[target.clearChoice];
    if (isKoharu && !target.selections && target.line <= 2727) {
      delete selections['s507*sub_part_7_sel'];
    }
    if (target.flags) Object.assign(flags, target.flags);
    if (target.selections) Object.assign(selections, target.selections);
    this.choiceFlags = flags;
    this.choiceSelections = selections;

    this.jumpFromFlowchart(target.scenario, target.line);

    // initGame 会重置跳过上下文，因此分流信息必须在跳转之后写入。
    if (typeof target.skipAfterLine === 'number') {
      this._routeSkipAfterLine = target.skipAfterLine;
      this._routeSkipToLine = typeof target.skipToLine === 'number' ? target.skipToLine : null;
      this._routeSkipScenario = target.skipScenario || null;
    }
  },
  onFcTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._fcStartX = typeof t.pageX === 'number' ? t.pageX : (t.clientX || 0);
      this._fcStartY = typeof t.pageY === 'number' ? t.pageY : (t.clientY || 0);
      this._fcStartPanX = this.flowPanX || 0;
      this._fcStartPanY = this.flowPanY || 0;
      this._fcMoved = false;
    }
  },
  onFcTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = typeof t.pageX === 'number' ? t.pageX : (t.clientX || 0);
      var cy = typeof t.pageY === 'number' ? t.pageY : (t.clientY || 0);
      var dx = cx - this._fcStartX;
      var dy = cy - this._fcStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this._fcMoved = true;
      this.flowPanX = fcClamp(this._fcStartPanX + dx, -(this.flowPanMaxX || 0), 0);
      this.flowPanY = fcClamp(this._fcStartPanY + dy, -(this.flowPanMaxY || 0), 0);
    }
  },
  onFcTouchEnd: function () {
    var self = this;
    setTimeout(function () { self._fcMoved = false; }, 120);
  },
  panFcBy: function (dx, dy) {
    this.flowPanX = fcClamp((this.flowPanX || 0) + dx, -(this.flowPanMaxX || 0), 0);
    this.flowPanY = fcClamp((this.flowPanY || 0) + dy, -(this.flowPanMaxY || 0), 0);
  },
  resetFcPan: function () {
    this.flowPanX = 0;
    this.flowPanY = 0;
  },
  jumpFromFlowchart: function (scenario, line) {
    // 兼容旧调用 jumpFromFlowchart(line)：单数字参数视为共通线行号。
    if (typeof scenario === 'number') {
      line = scenario;
      scenario = 'main';
    }
    if (typeof scenario !== 'string' || !scenario) scenario = 'main';
    if (this._fcMoved || !fcValidLine(line)) return;
    log('jump from flowchart to ' + scenario + ' line ' + line);
    this.currentScenario = scenario;
    this.currentScenarioData = null;
    this.view = 'game';
    if (typeof this.initGame === 'function') this.initGame(scenario, line);
  },
  returnToTitleFromFc: function () {
    this.view = 'title';
    if (typeof this.initTitle === 'function') this.initTitle();
  }
};

function fcText(h, style, value) {
  return h('text', { staticStyle: S(style) }, value);
}

function fcButton(h, style, label, action) {
  return h('div', { staticStyle: S(style), on: { click: action } }, [fcText(h, style + '-text', label)]);
}

function fcRenderEdge(vm, h, edge) {
  if (!edge.source || !edge.target || edge.target.depth <= edge.source.depth) return null;
  var x1 = edge.source.x + FC_CARD_WIDTH;
  var x2 = edge.target.x;
  var y1 = edge.source.y + FC_CARD_HEIGHT / 2;
  var y2 = edge.target.y + FC_CARD_HEIGHT / 2;
  var middle = x1 + (x2 - x1) / 2;
  var children = [
    h('div', { staticStyle: S('fc-edge-h', { left: x1 + 'px', top: y1 + 'px', width: (middle - x1) + 'px' }) }),
    h('div', { staticStyle: S('fc-edge-v', { left: middle + 'px', top: Math.min(y1, y2) + 'px', height: Math.max(1, Math.abs(y2 - y1)) + 'px' }) }),
    h('div', { staticStyle: S('fc-edge-h', { left: middle + 'px', top: y2 + 'px', width: (x2 - middle) + 'px' }) }),
    h('text', { staticStyle: S('fc-arrow', { left: (x2 - 7) + 'px', top: (y2 - 8) + 'px' }) }, '›')
  ];
  if (edge.label) {
    children.push(h('text', {
      staticStyle: S('fc-edge-label', { left: (x1 - 42) + 'px', top: (Math.min(y1, y2) - 13) + 'px' })
    }, edge.label));
  }
  return h('div', { staticStyle: S('fc-edge') }, children);
}

function fcRenderNode(vm, h, placed) {
  var node = placed.node;
  var selected = vm.flowSelectedNodeId === node.id;
  var style = 'fc-node fc-node-' + node.type + (selected ? ' fc-node-selected' : '');
  var target = fcNodeTarget(node);
  var line = target ? ('第 ' + target.line + ' 句') : '仅详情 · 禁跳';
  return h('div', {
    staticStyle: S(style, { left: placed.x + 'px', top: placed.y + 'px' }),
    on: { click: function () { vm.activateFcNode(node); } }
  }, [
    h('div', { staticStyle: S('fc-node-top') }, [
      fcText(h, 'fc-node-type', fcTypeName(node.type)),
      fcText(h, 'fc-node-line', line)
    ]),
    fcText(h, 'fc-node-title', node.title || node.id)
  ]);
}

export function renderFlowchart(vm, h) {
  fcEnsure(vm);
  if (!vm._fcLayout) fcRefreshLayout(vm);
  var chapters = vm.getFcChapters();
  var chapter = chapters[vm.flowChapterIndex];
  var layout = vm._fcLayout;
  var progressChildren = [];
  var progressMax = Math.max(0, chapters.length * 60 - 672);
  var progressX = -fcClamp(vm.flowChapterIndex * 60 - 306, 0, progressMax);
  for (var i = 0; i < chapters.length; i++) {
    (function (name, index) {
      progressChildren.push(h('div', {
        staticStyle: S(index === vm.flowChapterIndex ? 'fc-progress fc-progress-active' : 'fc-progress', { left: (index * 60) + 'px' }),
        on: { click: function () { vm.selectFcChapter(name); } }
      }, [fcText(h, 'fc-progress-text', fcShortChapter(name))]));
    })(chapters[i], i);
  }

  var graphChildren = [];
  for (var e = 0; e < layout.edges.length; e++) {
    var edgeView = fcRenderEdge(vm, h, layout.edges[e]);
    if (edgeView) graphChildren.push(edgeView);
  }
  var nodes = vm.getFcChapterNodes();
  for (var n = 0; n < nodes.length; n++) graphChildren.push(fcRenderNode(vm, h, layout.placed[nodes[n].id]));

  var routeButtons = [];
  for (var r = 0; r < FC_ROUTES.length; r++) {
    (function (route) {
      routeButtons.push(h('div', {
        staticStyle: S(route === vm.flowRoute ? 'fc-route fc-route-active' : 'fc-route'),
        on: { click: function () { vm.selectFcRoute(route); } }
      }, [fcText(h, 'fc-route-text', route)]));
    })(FC_ROUTES[r]);
  }

  return h('div', { staticStyle: S('fc-root') }, [
    h('image', { staticStyle: S('fc-bg-img'), attrs: { src: 'file:///userdisk/SenrenBanka/bg/title_bg.png' } }),
    h('div', { staticStyle: S('fc-header') }, [
      fcText(h, 'fc-title', '剧情流程图'),
      fcText(h, 'fc-header-chapter', vm.flowRoute + ' · ' + chapter + ' · ' + (vm.flowChapterIndex + 1) + '/' + chapters.length),
      fcButton(h, 'fc-back', '返回标题', function () { vm.returnToTitleFromFc(); })
    ]),
    h('div', { staticStyle: S('fc-progress-viewport') }, [
      h('div', { staticStyle: S('fc-progress-canvas', { left: progressX + 'px', width: (chapters.length * 60) + 'px' }) }, progressChildren)
    ]),
    h('div', {
      staticStyle: S('fc-viewport'),
      on: {
        touchstart: function (event) { vm.onFcTouchStart(event); },
        touchmove: function (event) { vm.onFcTouchMove(event); },
        touchend: function () { vm.onFcTouchEnd(); }
      }
    }, [
      h('div', {
        staticStyle: S('fc-canvas', {
          left: (vm.flowPanX || 0) + 'px', top: (vm.flowPanY || 0) + 'px',
          width: layout.width + 'px', height: layout.height + 'px'
        })
      }, graphChildren)
    ]),
    h('div', { staticStyle: S('fc-toolbar') }, [
      fcButton(h, 'fc-chapter-button', '上一章', function () { vm.prevFcChapter(); }),
      fcButton(h, 'fc-chapter-button', '下一章', function () { vm.nextFcChapter(); }),
      fcText(h, 'fc-notice', vm.flowNotice),
      fcButton(h, 'fc-pan-button', '←', function () { vm.panFcBy(70, 0); }),
      fcButton(h, 'fc-pan-button', '→', function () { vm.panFcBy(-70, 0); }),
      fcButton(h, 'fc-pan-button', '↑', function () { vm.panFcBy(0, 45); }),
      fcButton(h, 'fc-pan-button', '↓', function () { vm.panFcBy(0, -45); }),
      fcButton(h, 'fc-reset', '复位', function () { vm.resetFcPan(); })
    ]),
    h('div', { staticStyle: S('fc-sidebar') }, [
      h('div', { staticStyle: S('fc-route-list') }, routeButtons),
      h('div', { staticStyle: S('fc-route-art') }, [
        h('image', { staticStyle: S('fc-route-ema'), attrs: { src: fcEma(vm) } }),
        fcText(h, 'fc-route-caption', vm.flowRoute + '线')
      ])
    ])
  ]);
}
