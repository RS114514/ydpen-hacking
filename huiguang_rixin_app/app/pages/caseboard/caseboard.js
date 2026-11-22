// pages/caseboard/caseboard.js —— 百廿文脉案卷白板（24 宗案卷 · 多段推演）

import { STORY_DATA } from '../../data/story_data.js';

function findCase(id) {
  var cases = STORY_DATA.cases || [];
  for (var i = 0; i < cases.length; i++) {
    if (cases[i].id === id) return cases[i];
  }
  return cases[0] || {};
}

function caseIndex(id) {
  var cases = STORY_DATA.cases || [];
  for (var i = 0; i < cases.length; i++) {
    if (cases[i].id === id) return i;
  }
  return 0;
}

function stagesOf(c) {
  if (c && c.deduction && c.deduction.stages && c.deduction.stages.length) {
    return c.deduction.stages;
  }
  if (c && c.deduction && c.deduction.question && c.deduction.options) {
    return [{
      id: (c.id || 'case') + '_single',
      question: c.deduction.question,
      options: c.deduction.options,
      explanation: c.deduction.explanation || ''
    }];
  }
  return [];
}

function volumeLabel(key) {
  var m = {
    'vol1_autumn': '第一卷·金秋',
    'vol2_winter': '第二卷·凛冬',
    'vol3_spring': '第三卷·鸣春',
    'vol4_summer': '第四卷·盛夏'
  };
  return m[key] || '春晖';
}

function chainInfo(q) {
  var cs = STORY_DATA.sideChains || [];
  for (var i = 0; i < cs.length; i++) {
    if (cs[i].name === q.chain) return cs[i];
  }
  return null;
}

function nextRingIndex(q) {
  var qs = STORY_DATA.sideQuests || [];
  if (!q || !q.chain) return -1;
  for (var i = 0; i < qs.length; i++) {
    if (qs[i].chain === q.chain && qs[i].ring === q.ring + 1) return i;
  }
  return -1;
}

export var caseboardMethods = {
  initCaseboard: function () {
    if (!this.selectedCaseId && STORY_DATA.cases && STORY_DATA.cases.length > 0) {
      this.selectedCaseId = STORY_DATA.cases[0].id;
    }
    this.caseStageIndex = 0;
    this.caseChoice = -1;
    this.caseAnswered = false;
    if (!this.caseMode) this.caseMode = 'cases';
  },
  onOpenSide: function () {
    this.caseMode = 'side';
    this.sideIndex = 0;
  },
  onOpenCases: function () {
    this.caseMode = 'cases';
  },
  onPrevSide: function () {
    var qs = STORY_DATA.sideQuests || [];
    if (!qs.length) return;
    this.sideIndex = ((this.sideIndex || 0) - 1 + qs.length) % qs.length;
  },
  onNextSide: function () {
    var qs = STORY_DATA.sideQuests || [];
    if (!qs.length) return;
    this.sideIndex = ((this.sideIndex || 0) + 1) % qs.length;
  },
  onNextRing: function () {
    var qs = STORY_DATA.sideQuests || [];
    var q = qs[this.sideIndex || 0];
    var i = nextRingIndex(q);
    if (i >= 0) this.sideIndex = i;
  },
  onSelectCase: function (caseId) {
    this.selectedCaseId = caseId;
    this.caseStageIndex = 0;
    this.caseChoice = -1;
    this.caseAnswered = false;
  },
  onPrevCase: function () {
    var cases = STORY_DATA.cases || [];
    if (!cases.length) return;
    var i = caseIndex(this.selectedCaseId);
    this.onSelectCase(cases[(i - 1 + cases.length) % cases.length].id);
  },
  onNextCase: function () {
    var cases = STORY_DATA.cases || [];
    if (!cases.length) return;
    var i = caseIndex(this.selectedCaseId);
    this.onSelectCase(cases[(i + 1) % cases.length].id);
  },
  onCaseDeduce: function () {
    this.caseStageIndex = 1;
    this.caseChoice = -1;
    this.caseAnswered = false;
  },
  onCaseOption: function (index) {
    this.caseChoice = index;
    this.caseAnswered = true;
  },
  onCaseNextStage: function () {
    var c = findCase(this.selectedCaseId);
    var stages = stagesOf(c);
    if (this.caseStageIndex <= stages.length) {
      this.caseStageIndex = this.caseStageIndex + 1;
      this.caseChoice = -1;
      this.caseAnswered = false;
    }
  },
  onCaseRestart: function () {
    this.caseStageIndex = 0;
    this.caseChoice = -1;
    this.caseAnswered = false;
  },
  onBack: function () {
    this.view = 'game';
  }
};

function renderSideBoard(h, ctx) {
  var quests = STORY_DATA.sideQuests || [];
  var idx = ctx.sideIndex || 0;
  var q = quests[idx] || {};
  var lines = q.lines || [];
  var chain = q.chain ? chainInfo(q) : null;
  var nextRing = nextRingIndex(q);
  var meta = volumeLabel(q.volume) + ' · ' + (q.chapterId || '') + ' · ' + (q.place || '');
  if (chain) meta += ' · 连环 ' + q.ring + '/' + chain.ringCount;
  var center = [
    h('div', { class: 'case-header-box' }, [
      h('text', { class: 'case-title-text' }, '【' + (q.name || '支线委托') + '】'),
      h('text', { class: 'case-meta' }, meta)
    ])
  ];
  for (var i = 0; i < lines.length; i++) {
    center.push(h('text', { class: 'case-summary-text' }, lines[i].text));
  }
  center.push(h('div', { class: 'case-action-row' }, [
    h('text', { class: 'case-hint', on: { click: ctx.onPrevSide } }, '◀ 上一委托'),
    h('text', { class: 'case-hint', on: { click: nextRing >= 0 ? ctx.onNextRing : ctx.onNextSide } },
      nextRing >= 0 ? '下一环 ▶' : '下一委托 ▶'),
    h('text', { class: 'case-hint', on: { click: ctx.onOpenCases } }, '返回案卷')
  ]));
  return h('div', { class: 'board-container' }, [
    h('div', { class: 'board-header' }, [
      h('text', { class: 'board-title' }, '【支线委托】 ' + quests.length + ' 项 · 连环 ' + ((STORY_DATA.sideChains || []).length) + ' 条'),
      h('text', { class: 'board-close', on: { click: ctx.onBack } }, '[✕ 返回游戏]')
    ]),
    h('div', { class: 'board-body' }, [
      h('div', { class: 'board-sidebar' }, [
        h('div', { class: 'side-tab', on: { click: ctx.onOpenCases } }, [h('text', { class: 'tab-text' }, '◀ 返回案卷')]),
        h('div', { class: 'side-tab tab-active' }, [h('text', { class: 'tab-text' }, '● 支线 ' + (idx + 1) + '/' + quests.length)]),
        h('div', { class: 'side-tab' }, [h('text', { class: 'tab-text' }, chain ? ('◆ 连环 ' + q.ring + '/' + chain.ringCount) : ('○ 线索 ' + (q.clue ? q.clue.name : '—')))])
      ]),
      h('div', { class: 'board-content' }, center),
      h('div', { class: 'board-clues' }, [
        h('text', { class: 'clues-title' }, chain ? ('【' + chain.name + '】') : '【委托线索】'),
        h('div', { class: 'clue-card clue-found' }, [h('text', { class: 'clue-text' }, '✓ ' + (q.clue ? q.clue.name : '待记录'))]),
        h('text', { class: 'clue-text' }, q.clue ? q.clue.desc : '')
      ])
    ])
  ]);
}

export function renderCaseboard(h, ctx) {
  if (ctx.caseMode === 'side') return renderSideBoard(h, ctx);
  var cases = STORY_DATA.cases || [];
  var currentCase = findCase(ctx.selectedCaseId);
  var stages = stagesOf(currentCase);
  var stageIndex = ctx.caseStageIndex || 0;
  var stage = stageIndex > 0 && stageIndex <= stages.length ? stages[stageIndex - 1] : null;
  var answered = !!ctx.caseAnswered;
  var choice = typeof ctx.caseChoice === 'number' ? ctx.caseChoice : -1;
  var evidence = currentCase.evidence || [];
  var clues = currentCase.clues || [];
  var idx = caseIndex(currentCase.id);

  var centerChildren = [];
  centerChildren.push(h('div', { class: 'case-header-box' }, [
    h('text', { class: 'case-title-text' }, '【' + (currentCase.id || 'case') + ' · ' + (currentCase.title || '案卷') + '】'),
    h('text', { class: 'case-meta' }, '进度 ' + (idx + 1) + '/' + cases.length + ' · 解锁 ' + (currentCase.unlockedChapter || '未知'))
  ]));

  if (stageIndex > stages.length && stages.length) {
    centerChildren.push(h('div', { class: 'case-summary-box' }, [
      h('text', { class: 'case-summary-text' }, '案卷结论：' + ((currentCase.deduction && currentCase.deduction.answer) || '已推演完毕。')),
      h('text', { class: 'case-summary-text' }, (currentCase.deduction && currentCase.deduction.explanation) || '')
    ]));
    centerChildren.push(h('div', { class: 'case-action-row' }, [
      h('text', { class: 'case-hint', on: { click: ctx.onCaseRestart } }, '▶ 重新推演'),
      h('text', { class: 'case-hint', on: { click: ctx.onPrevCase } }, '◀ 上一案'),
      h('text', { class: 'case-hint', on: { click: ctx.onNextCase } }, '下一案 ▶')
    ]));
  } else if (!stage) {
    centerChildren.push(h('div', { class: 'case-summary-box' }, [
      h('text', { class: 'case-summary-text' }, (currentCase.summary || '暂无案情详情。') + (stages.length ? ' 本案共 ' + stages.length + ' 段推演。' : ' 本案推演数据待补。'))
    ]));
    centerChildren.push(h('div', { class: 'case-action-row' }, [
      h('text', { class: 'case-hint', on: { click: ctx.onCaseDeduce } }, stages.length ? '▶ 开始逐段推演' : '▶ 查看物证'),
      h('text', { class: 'case-hint', on: { click: ctx.onPrevCase } }, '◀ 上一案'),
      h('text', { class: 'case-hint', on: { click: ctx.onNextCase } }, '下一案 ▶')
    ]));
  } else {
    centerChildren.push(h('div', { class: 'case-summary-box' }, [
      h('text', { class: 'case-summary-text' }, '第 ' + stageIndex + '/' + stages.length + ' 段：' + stage.question)
    ]));
    for (var oi = 0; oi < stage.options.length; oi++) {
      var o = stage.options[oi];
      var mark = '';
      if (answered && choice === oi) mark = o.correct ? '✓ ' : '✗ ';
      centerChildren.push(h('text', {
        class: 'case-hint',
        on: { click: function (i) { return function () { ctx.onCaseOption(i); }; }(oi) }
      }, mark + (oi + 1) + '. ' + o.text));
    }
    if (answered) {
      var picked = stage.options[choice] || {};
      centerChildren.push(h('text', { class: 'case-hint' }, picked.correct ? '判断正确。' : '判断有误。'));
      centerChildren.push(h('text', { class: 'case-summary-text' }, stage.explanation || ''));
      centerChildren.push(h('text', {
        class: 'case-hint',
        on: { click: stageIndex < stages.length ? ctx.onCaseNextStage : ctx.onCaseRestart }
      }, stageIndex < stages.length ? '▶ 下一段推演' : '▶ 重新推演'));
    }
  }

  var clueChildren = [h('text', { class: 'clues-title' }, '【物证档案】')];
  var maxClues = Math.min(3, evidence.length || clues.length);
  for (var ci = 0; ci < maxClues; ci++) {
    var label = evidence.length ? (evidence[ci].id + ' ' + evidence[ci].name) : ('✓ ' + (clues[ci] || '物证'));
    clueChildren.push(h('div', { class: 'clue-card clue-found' }, [
      h('text', { class: 'clue-text' }, '✓ ' + label)
    ]));
  }
  if ((evidence.length || clues.length) > maxClues) {
    clueChildren.push(h('text', { class: 'clue-text' }, '…另有 ' + ((evidence.length || clues.length) - maxClues) + ' 项'));
  }
  clueChildren.push(h('div', { class: 'btn-deduce', on: { click: ctx.onCaseDeduce } }, [
    h('text', { class: 'deduce-text' }, '重新推演')
  ]));

  return h('div', { class: 'board-container' }, [
    h('div', { class: 'board-header' }, [
      h('text', { class: 'board-title' }, '【百廿文脉案件白板】 24 宗独立文史案卷'),
      h('text', { class: 'board-close', on: { click: ctx.onBack } }, '[✕ 返回游戏]')
    ]),
    h('div', { class: 'board-body' }, [
      h('div', { class: 'board-sidebar' }, [
        h('div', { class: 'side-tab tab-active' }, [h('text', { class: 'tab-text' }, '● 案卷 ' + (idx + 1))]),
        h('div', { class: 'side-tab' }, [h('text', { class: 'tab-text' }, '○ 物证 ' + (evidence.length || clues.length))]),
        h('div', { class: 'side-tab' }, [h('text', { class: 'tab-text' }, '○ 推演 ' + stages.length + ' 段')]),
        h('div', { class: 'side-tab', on: { click: ctx.onPrevCase } }, [h('text', { class: 'tab-text' }, '◀ 上一案')]),
        h('div', { class: 'side-tab', on: { click: ctx.onNextCase } }, [h('text', { class: 'tab-text' }, '下一案 ▶')]),
        h('div', { class: 'side-tab', on: { click: ctx.onOpenSide } }, [h('text', { class: 'tab-text' }, '○ 支线委托 (' + ((STORY_DATA.sideQuests || []).length) + ')')])
      ]),
      h('div', { class: 'board-content' }, centerChildren),
      h('div', { class: 'board-clues' }, clueChildren)
    ])
  ]);
}
