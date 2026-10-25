// pages/flowchart/flowchart.js —— 剧情演进与分支走向树状流程图
import { S, log, getGal } from '../../common.js';

var TRUNK_NODES_1 = [
  {
    chapter: 'CHAPTER 1-1',
    status: '● 已解锁',
    title: '穗织探访与重逢',
    desc: '第 1 ~ 350 句 · 芦花相遇',
    line: 0,
    isDecision: false
  },
  {
    chapter: 'CHAPTER 1-2',
    status: '● 已解锁',
    title: '拔出神刀丛雨丸',
    desc: '第 351 ~ 550 句 · 祭典拔刀',
    line: 350,
    isDecision: false
  }
];

var TRUNK_NODES_2 = [
  {
    chapter: 'CHAPTER 1-3',
    status: '● 已解锁',
    title: '巫女婚约与幽灵现身',
    desc: '第 551 ~ 780 句 · 丛雨显形',
    line: 550,
    isDecision: false
  },
  {
    chapter: 'CHAPTER 2-1',
    status: '★ 命运分歧点',
    title: '学园日常与分歧选择',
    desc: '第 781 句开始 · 多方路线交汇',
    line: 780,
    isDecision: true
  }
];

var BRANCH_ROUTES = [
  {
    tag: '【芳乃线】',
    name: '朝武 芳乃 · 巫女解咒',
    desc: '解开祟神宿命与神刀契约',
    endType: 'TRUE END',
    line: 804
  },
  {
    tag: '【茉子线】',
    name: '常陆 茉子 · 忠诚守护',
    desc: '忍者少女伴随身旁的恋心',
    endType: 'HAPPY END',
    line: 400
  },
  {
    tag: '【丛雨线】',
    name: '丛 雨 · 五百年羁绊',
    desc: '幼刀神灵的欢笑与救赎',
    endType: 'TRUE END',
    line: 560
  },
  {
    tag: '【蕾娜线】',
    name: '蕾 娜 · 异国恋曲',
    desc: '芬兰留学生的明媚笑颜',
    endType: 'HAPPY END',
    line: 250
  },
  {
    tag: '【小春线】',
    name: '鞍马 小春 · 和果子物语',
    desc: '甜品屋中的害羞后辈',
    endType: 'HAPPY END',
    line: 600
  },
  {
    tag: '【芦花线】',
    name: '马场 芦花 · 温泉微醺',
    desc: '青梅竹马大姐姐的久别眷恋',
    endType: 'HAPPY END',
    line: 110
  }
];

export var flowchartMethods = {
  initFlowchart: function () {
    this.flowPanX = 0;
    this.flowPanY = 0;
    this._fcStartX = 0;
    this._fcStartY = 0;
    this._fcStartPanX = 0;
    this._fcStartPanY = 0;
    this._fcMoved = false;
  },
  onFcTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._fcStartX = t.pageX || t.clientX || 0;
      this._fcStartY = t.pageY || t.clientY || 0;
      this._fcStartPanX = this.flowPanX || 0;
      this._fcStartPanY = this.flowPanY || 0;
      this._fcMoved = false;
    }
  },
  onFcTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var cy = t.pageY || t.clientY || 0;
      var dx = cx - this._fcStartX;
      var dy = cy - this._fcStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        this._fcMoved = true;
      }
      var newX = this._fcStartPanX + dx;
      var newY = this._fcStartPanY + dy;
      if (newX > 0) newX = 0;
      if (newX < -380) newX = -380;
      if (newY > 0) newY = 0;
      if (newY < -120) newY = -120;
      this.flowPanX = newX;
      this.flowPanY = newY;
    }
  },
  onFcTouchEnd: function () {
    var self = this;
    setTimeout(function () {
      self._fcMoved = false;
    }, 120);
  },
  resetFcPan: function () {
    this.flowPanX = 0;
    this.flowPanY = 0;
  },
  jumpFromFlowchart: function (line) {
    if (this._fcMoved) return;
    log('jump from flowchart to line ' + line);
    this.currentLine = line || 0;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame();
    }
  },
  returnToTitleFromFc: function () {
    this.view = 'title';
    if (typeof this.initTitle === 'function') {
      this.initTitle();
    }
  }
};

export function renderFlowchart(vm, h) {
  // 构建主干行 1
  var row1Nodes = [];
  for (var i = 0; i < TRUNK_NODES_1.length; i++) {
    (function (node, isLast) {
      row1Nodes.push(
        h('div', {
          staticStyle: S('fc-node-card'),
          on: { click: function () { vm.jumpFromFlowchart(node.line); } }
        }, [
          h('div', { staticStyle: S('fc-node-header') }, [
            h('text', { staticStyle: S('fc-node-tag') }, node.chapter),
            h('text', { staticStyle: S('fc-node-status') }, node.status)
          ]),
          h('text', { staticStyle: S('fc-node-title') }, node.title),
          h('text', { staticStyle: S('fc-node-desc') }, node.desc)
        ])
      );
      if (!isLast) {
        row1Nodes.push(
          h('div', { staticStyle: S('fc-arrow-box') }, [
            h('text', { staticStyle: S('fc-arrow-text') }, '▶')
          ])
        );
      }
    })(TRUNK_NODES_1[i], i === TRUNK_NODES_1.length - 1);
  }

  // 构建主干行 2（包含 2-1 分歧点）
  var row2Nodes = [];
  for (var j = 0; j < TRUNK_NODES_2.length; j++) {
    (function (node, isLast) {
      var cardStyle = node.isDecision ? 'fc-node-decision' : 'fc-node-card';
      var statusStyle = node.isDecision ? 'fc-node-status-decision' : 'fc-node-status';
      row2Nodes.push(
        h('div', {
          staticStyle: S(cardStyle),
          on: { click: function () { vm.jumpFromFlowchart(node.line); } }
        }, [
          h('div', { staticStyle: S('fc-node-header') }, [
            h('text', { staticStyle: S('fc-node-tag') }, node.chapter),
            h('text', { staticStyle: S(statusStyle) }, node.status)
          ]),
          h('text', { staticStyle: S('fc-node-title') }, node.title),
          h('text', { staticStyle: S('fc-node-desc') }, node.desc)
        ])
      );
      if (!isLast) {
        row2Nodes.push(
          h('div', { staticStyle: S('fc-arrow-box') }, [
            h('text', { staticStyle: S('fc-arrow-text') }, '▶')
          ])
        );
      }
    })(TRUNK_NODES_2[j], j === TRUNK_NODES_2.length - 1);
  }

  // 构建右侧六分支
  var branchItems = [];
  for (var b = 0; b < BRANCH_ROUTES.length; b++) {
    (function (rt) {
      branchItems.push(
        h('div', { staticStyle: S('fc-branch-item') }, [
          h('div', { staticStyle: S('fc-branch-arrow-box') }, [
            h('text', { staticStyle: S('fc-branch-arrow-text') }, '↳')
          ]),
          h('div', {
            staticStyle: S('fc-branch-card'),
            on: { click: function () { vm.jumpFromFlowchart(rt.line); } }
          }, [
            h('div', { staticStyle: S('fc-branch-card-header') }, [
              h('text', { staticStyle: S('fc-branch-name') }, rt.tag + ' ' + rt.name),
              h('div', { staticStyle: S('fc-branch-end-badge') }, [
                h('text', { staticStyle: S('fc-branch-end-text') }, rt.endType)
              ])
            ]),
            h('text', { staticStyle: S('fc-branch-desc') }, rt.desc)
          ])
        ])
      );
    })(BRANCH_ROUTES[b]);
  }

  // 组装整体画布
  var canvasContent = h('div', {
    staticStyle: S('fc-canvas', {
      left: (vm.flowPanX || 0) + 'px',
      top: (vm.flowPanY || 0) + 'px',
      width: '780px',
      flexDirection: 'row'
    })
  }, [
    // 左侧：主干路径
    h('div', { staticStyle: S('fc-trunk-container') }, [
      h('div', { staticStyle: S('fc-row') }, row1Nodes),
      h('div', { staticStyle: S('fc-row') }, row2Nodes)
    ]),
    // 右侧：分支路径
    h('div', { staticStyle: S('fc-branches-col') }, branchItems)
  ]);

  return h('div', { staticStyle: S('fc-root') }, [
    // 背景图
    h('image', {
      staticStyle: S('fc-bg-img'),
      attrs: { src: 'file:///userdisk/SenrenBanka/bg/title_bg.png' }
    }),

    // 顶部导航栏
    h('div', { staticStyle: S('fc-header') }, [
      h('div', { staticStyle: S('fc-title-box') }, [
        h('text', { staticStyle: S('fc-title-text') }, '◆ 剧情流程图 FLOW CHART ◆'),
        h('text', { staticStyle: S('fc-subtitle') }, '滑动浏览 · 轻触节点直接跳转游玩')
      ]),
      h('div', { staticStyle: S('fc-header-actions') }, [
        h('div', {
          staticStyle: S('fc-btn-reset'),
          on: { click: function () { vm.resetFcPan(); } }
        }, [
          h('text', { staticStyle: S('fc-btn-reset-text') }, '重置视角')
        ]),
        h('div', {
          staticStyle: S('fc-btn-back'),
          on: { click: function () { vm.returnToTitleFromFc(); } }
        }, [
          h('text', { staticStyle: S('fc-btn-back-text') }, '返回标题')
        ])
      ])
    ]),

    // 视口容器，绑定手势滑动
    h('div', {
      staticStyle: S('fc-viewport'),
      on: {
        touchstart: function (e) { vm.onFcTouchStart(e); },
        touchmove: function (e) { vm.onFcTouchMove(e); },
        touchend: function () { vm.onFcTouchEnd(); }
      }
    }, [canvasContent])
  ]);
}
