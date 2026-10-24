// pages/title/title.js —— 原版文字主菜单与鉴赏/日后谈入口
import { S, getGal, log, getChapterByLine } from '../../common.js';
import { readAllSaves } from '../../storage.js';

export var titleMethods = {
  initTitle: function () {
    var G = getGal();
    if (G && !this.bgmOn) {
      this.bgmOn = true;
      G.playBgm('/userdisk/SenrenBanka/bgm/BGM01.opus', true, 0.8);
    }
    this.titleConfirmModal = null;
  },
  startNewGame: function () {
    log('start new game');
    this.currentLine = 0;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame();
    }
  },
  continueGame: function () {
    log('continue game');
    var saves = readAllSaves();
    var latestSlot = saves.latest || '1';
    var data = saves['slot' + latestSlot];
    if (data && typeof data.line === 'number') {
      this.currentLine = data.line;
    } else {
      this.currentLine = 0;
    }
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame();
    }
  },
  openTitleLoadModal: function () {
    this.titleModalType = 'load';
    this.titleConfirmModal = null;
    this.titleSaves = readAllSaves();
    this.titleSavePage = this.titleSavePage || 0;
    this.titleSelectedSlot = this.titleSelectedSlot || 1;
  },
  changeTitleSavePage: function (delta) {
    var p = (this.titleSavePage || 0) + delta;
    if (p < 0) p = 4;
    if (p > 4) p = 0;
    this.titleSavePage = p;
    this.titleConfirmModal = null;
  },
  selectTitleSlotItem: function (slotNum) {
    this.titleSelectedSlot = slotNum;
    var saves = this.titleSaves || readAllSaves();
    var data = saves['slot' + slotNum];
    if (data && typeof data.line === 'number') {
      var pageStr = (this.titleSavePage || 0) + 1;
      var codeStr = 's000' + pageStr + '-' + (slotNum < 10 ? '0' + slotNum : '' + slotNum);
      this.titleConfirmModal = {
        slotNum: slotNum,
        title: '读取进度确认',
        subtitle: '载入目标：' + codeStr + '（' + (data.time || '——') + ' · ' + (data.chapter || '1-1') + '）',
        message: '是否确定载入该槽位的物语推进记录？'
      };
    }
  },
  confirmExecuteTitleLoad: function () {
    if (!this.titleConfirmModal) return;
    var slotNum = this.titleConfirmModal.slotNum;
    this.titleConfirmModal = null;
    this.loadSlotFromTitle(slotNum);
  },
  cancelTitleConfirm: function () {
    this.titleConfirmModal = null;
  },
  openFlowchartModal: function () {
    this.titleModalType = 'flowchart';
    this.titleConfirmModal = null;
  },
  jumpFromFlowchart: function (line) {
    this.currentLine = line || 0;
    this.titleModalType = '';
    this.titleConfirmModal = null;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame();
    }
  },
  openAfterModal: function () {
    this.titleModalType = 'after';
    this.titleConfirmModal = null;
  },
  startAfterStory: function (heroineKey, line) {
    this.currentLine = line || 0;
    this.titleModalType = '';
    this.titleConfirmModal = null;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame();
    }
  },
  closeTitleModal: function () {
    this.titleModalType = '';
    this.titleConfirmModal = null;
  },
  loadSlotFromTitle: function (slotNum) {
    var saves = this.titleSaves || readAllSaves();
    var data = saves['slot' + slotNum];
    if (data && typeof data.line === 'number') {
      this.currentLine = data.line;
      this.titleModalType = '';
      this.titleConfirmModal = null;
      this.view = 'game';
      if (typeof this.initGame === 'function') {
        this.initGame();
      }
    }
  },
  openGallery: function () {
    log('open gallery');
    this.view = 'gallery';
  },
  toggleTitleBgm: function () {
    var G = getGal();
    this.bgmOn = !this.bgmOn;
    if (G) {
      if (this.bgmOn) {
        G.playBgm('/userdisk/SenrenBanka/bgm/BGM01.opus', true, 0.8);
      } else {
        G.stopBgm();
      }
    }
  },
  onMenuTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      this._menuStartY = e.changedTouches[0].pageY || e.changedTouches[0].clientY || 0;
      this._menuStartScroll = this.titleScrollY || 0;
      this._menuMoved = false;
    }
  },
  onMenuTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var y = e.changedTouches[0].pageY || e.changedTouches[0].clientY || 0;
      var dy = y - this._menuStartY;
      if (Math.abs(dy) > 5) {
        this._menuMoved = true;
      }
      var newY = this._menuStartScroll + dy;
      if (newY > 0) newY = 0;
      if (newY < -135) newY = -135;
      this.titleScrollY = newY;
    }
  },
  onMenuTouchEnd: function () {
    var self = this;
    setTimeout(function () {
      self._menuMoved = false;
    }, 120);
  },
  scrollMenuUp: function () {
    var y = (this.titleScrollY || 0) + 68;
    if (y > 0) y = 0;
    this.titleScrollY = y;
  },
  scrollMenuDown: function () {
    var y = (this.titleScrollY || 0) - 68;
    if (y < -135) y = -135;
    this.titleScrollY = y;
  }
};

export function renderTitle(vm, h) {
  var bgmText = vm.bgmOn ? '♫ 雅乐: 奏鸣中' : '♫ 雅乐: 已止音';

  var col1Buttons = [
    // (1) 新游戏 NEW GAME
    h('div', {
      staticStyle: S('title-menu-btn title-btn-primary'),
      on: { click: function () { vm.startNewGame(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '新游戏'),
      h('text', { staticStyle: S('title-btn-sub-highlight') }, 'START ›')
    ]),

    // (2) 继续游戏 CONTINUE
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { vm.continueGame(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '继续游戏'),
      h('text', { staticStyle: S('title-btn-sub') }, 'CONTINUE')
    ]),

    // (3) 读取存档 LOAD DATA
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { vm.openTitleLoadModal(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '读取存档'),
      h('text', { staticStyle: S('title-btn-sub') }, 'DATA LOAD')
    ]),

    // (4) 流程图 FLOW CHART
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { vm.openFlowchartModal(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '流程图'),
      h('text', { staticStyle: S('title-btn-sub') }, 'CHART')
    ])
  ];

  var col2Buttons = [
    // (5) 鉴赏 EXTRA（严格修正为原版真实名称“鉴赏”）
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { vm.openGallery(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '鉴赏'),
      h('text', { staticStyle: S('title-btn-sub') }, 'EXTRA')
    ]),

    // (6) 日后谈 AFTER STORY（主线/单人线完结后的专属故事）
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { vm.openAfterModal(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '日后谈'),
      h('text', { staticStyle: S('title-btn-sub') }, 'AFTER')
    ]),

    // (7) 系统设置 SYSTEM
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { vm.toggleTitleBgm(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '系统设置'),
      h('text', { staticStyle: S('title-btn-sub') }, 'SYSTEM')
    ]),

    // (8) 退出游戏 EXIT
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { vm.toggleTitleBgm(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '退出游戏'),
      h('text', { staticStyle: S('title-btn-sub') }, 'EXIT')
    ])
  ];

  var children = [
    // 1. 官方原版 800x220 四女主与官方 Logo 大背景
    h('image', {
      staticStyle: S('title-bg-img'),
      attrs: { src: 'file:///userdisk/SenrenBanka/bg/title_bg.png' }
    }),

    // 2. 右上角原版极简雅乐按键
    h('div', { staticStyle: S('title-top-bar') }, [
      h('div', {
        staticStyle: S('title-bgm-pill'),
        on: { click: function () { vm.toggleTitleBgm(); } }
      }, [
        h('text', { staticStyle: S('title-bgm-pill-text') }, bgmText)
      ])
    ]),

    // 3. 左侧原版双列文字菜单栏（2列 x 4行，8个官方选项一览无余）
    h('div', { staticStyle: S('title-menu-scroll') }, [
      h('div', { staticStyle: S('title-menu-col') }, col1Buttons),
      h('div', { staticStyle: S('title-menu-col') }, col2Buttons)
    ])
  ];

  // 弹窗浮层
  if (vm.titleModalType) {
    if (vm.titleModalType === 'load') {
      var page = vm.titleSavePage || 0;
      var totalPages = 5;
      var pageStr = '000' + (page + 1) + ' / 000' + totalPages;
      var tSaves = vm.titleSaves || {};
      var selSlot = vm.titleSelectedSlot || (page * 6 + 1);

      // 左侧选定槽位预览数据
      var selItem = tSaves['slot' + selSlot];
      var selBg = selItem && selItem.bg && selItem.bg !== '画面_黒' ? 'file:///userdisk/SenrenBanka/bg/' + selItem.bg + '.png' : '';
      var selDate = selItem && selItem.time ? selItem.time : '——';
      var selChapter = selItem && selItem.chapter ? selItem.chapter : '——';
      var selComment = selItem ? (selItem.speaker ? '【' + selItem.speaker + '】' : '') + selItem.text : 'NO DATA';

      // 右侧 6 个槽位卡片
      var slotCards = [];
      var startNum = page * 6 + 1;
      for (var i = 0; i < 6; i++) {
        (function (slotNum) {
          var it = tSaves['slot' + slotNum];
          var codeStr = 's000' + (page + 1) + '-' + (slotNum < 10 ? '0' + slotNum : '' + slotNum);
          var timeStr = it && it.time ? it.time : '';
          var bgPath = it && it.bg && it.bg !== '画面_黒' ? 'file:///userdisk/SenrenBanka/bg/' + it.bg + '.png' : '';
          var descStr = it ? (it.speaker ? '【' + it.speaker + '】' : '') + it.text : 'NO DATA';
          var isCurrentSelected = selSlot === slotNum;
          var cardClass = 'saveload-slot-card';
          if (isCurrentSelected) cardClass += ' saveload-slot-card-active';
          if (it) cardClass += ' saveload-slot-card-hasdata';

          slotCards.push(
            h('div', {
              staticStyle: S(cardClass),
              on: { click: function () { vm.selectTitleSlotItem(slotNum); } }
            }, [
              h('div', { staticStyle: S('saveload-slot-header') }, [
                h('text', { staticStyle: S('saveload-slot-code') }, codeStr),
                h('text', { staticStyle: S('saveload-slot-time') }, timeStr)
              ]),
              h('div', { staticStyle: S('saveload-slot-body') }, [
                bgPath ? h('image', {
                  staticStyle: S('saveload-slot-body-img'),
                  attrs: { src: bgPath }
                }) : h('text', { staticStyle: S('saveload-slot-noimage') }, 'NO IMAGE')
              ]),
              h('div', { staticStyle: S('saveload-slot-footer') }, [
                h('text', { staticStyle: S('saveload-slot-desc') }, descStr.substring(0, 16))
              ])
            ])
          );
        })(startNum + i);
      }

      children.push(
        h('div', { staticStyle: S('saveload-root') }, [
          // 1. 顶部 Header
          h('div', { staticStyle: S('saveload-header') }, [
            h('div', { staticStyle: S('saveload-title-box') }, [
              h('text', { staticStyle: S('saveload-title-cloud') }, '☁'),
              h('text', { staticStyle: S('saveload-title-text') }, 'DATA LOAD')
            ]),
            h('div', { staticStyle: S('saveload-header-right') }, [
              // 模式指示
              h('div', { staticStyle: S('saveload-mode-tabs') }, [
                h('div', { staticStyle: S('saveload-mode-tab saveload-mode-tab-active') }, [
                  h('div', { staticStyle: S('saveload-mode-dot') }),
                  h('text', { staticStyle: S('saveload-mode-text-active') }, '读取物语')
                ])
              ]),
              // 翻页控制器
              h('div', { staticStyle: S('saveload-pager') }, [
                h('div', {
                  staticStyle: S('saveload-pager-btn'),
                  on: { click: function () { vm.changeTitleSavePage(-1); } }
                }, [
                  h('text', { staticStyle: S('saveload-pager-btn-text') }, '‹')
                ]),
                h('text', { staticStyle: S('saveload-pager-text') }, pageStr),
                h('div', {
                  staticStyle: S('saveload-pager-btn'),
                  on: { click: function () { vm.changeTitleSavePage(1); } }
                }, [
                  h('text', { staticStyle: S('saveload-pager-btn-text') }, '›')
                ])
              ]),
              // 关闭按钮
              h('div', {
                staticStyle: S('saveload-header-close-btn'),
                on: { click: function () { vm.closeTitleModal(); } }
              }, [
                h('text', { staticStyle: S('saveload-header-close-text') }, '返回标题')
              ])
            ])
          ]),

          // 2. 主体区（左侧大预览 + 右侧槽位网格）
          h('div', { staticStyle: S('saveload-body') }, [
            // 左侧信息预览
            h('div', { staticStyle: S('saveload-left-pane') }, [
              h('div', { staticStyle: S('saveload-preview-box') }, [
                selBg ? h('image', {
                  staticStyle: S('saveload-preview-img'),
                  attrs: { src: selBg }
                }) : h('text', { staticStyle: S('saveload-preview-noimage') }, 'NO IMAGE')
              ]),
              h('div', { staticStyle: S('saveload-info-card') }, [
                h('div', { staticStyle: S('saveload-info-row') }, [
                  h('text', { staticStyle: S('saveload-info-label') }, 'DATE :'),
                  h('text', { staticStyle: S('saveload-info-val') }, selDate)
                ]),
                h('div', { staticStyle: S('saveload-info-row') }, [
                  h('text', { staticStyle: S('saveload-info-label') }, 'CHAPTER :'),
                  h('text', { staticStyle: S('saveload-info-val') }, selChapter)
                ]),
                h('div', { staticStyle: S('saveload-info-row') }, [
                  h('text', { staticStyle: S('saveload-info-label') }, 'COMMENT :'),
                  h('text', { staticStyle: S('saveload-info-val') }, selComment.substring(0, 18))
                ])
              ])
            ]),

            // 右侧 6 个槽位卡片网格
            h('div', { staticStyle: S('saveload-right-grid') }, slotCards)
          ]),

          // 3. 底部状态与操作条
          h('div', { staticStyle: S('saveload-bottom-bar') }, [
            h('text', { staticStyle: S('saveload-bottom-tip') }, '载入界面。轻触有数据的槽位弹出载入确认。'),
            h('div', { staticStyle: S('saveload-bottom-actions') }, [
              h('div', {
                staticStyle: S('saveload-bottom-btn'),
                on: { click: function () { vm.closeTitleModal(); } }
              }, [
                h('text', { staticStyle: S('saveload-bottom-btn-text') }, '返回标题')
              ])
            ])
          ])
        ])
      );
    } else if (vm.titleModalType === 'flowchart') {
      children.push(
        h('div', { staticStyle: S('flowchart-root') }, [
          // 顶部标题与返回
          h('div', { staticStyle: S('flowchart-header') }, [
            h('div', { staticStyle: S('flowchart-title-box') }, [
              h('text', { staticStyle: S('flowchart-title-text') }, '◆ 流程图 FLOW CHART ◆'),
              h('text', { staticStyle: S('flowchart-subtitle') }, '规范真实章节节点（1-1、1-2、1-3、2-1），轻触直接跳转')
            ]),
            h('div', {
              staticStyle: S('flowchart-close-btn'),
              on: { click: function () { vm.closeTitleModal(); } }
            }, [
              h('text', { staticStyle: S('flowchart-close-text') }, '返回标题')
            ])
          ]),

          // 树状图主体（左侧规范章节主干 + 右侧四女主分支）
          h('div', { staticStyle: S('flowchart-body') }, [
            // 左侧：主干路径
            h('div', { staticStyle: S('flowchart-trunk-pane') }, [
              // 第一行：1-1 -> 1-2
              h('div', { staticStyle: S('flowchart-trunk-row') }, [
                h('div', {
                  staticStyle: S('flowchart-node'),
                  on: { click: function () { vm.jumpFromFlowchart(0); } }
                }, [
                  h('div', { staticStyle: S('flowchart-node-header') }, [
                    h('text', { staticStyle: S('flowchart-node-tag') }, 'CHAPTER 1-1'),
                    h('text', { staticStyle: S('flowchart-node-status') }, '● 已解锁')
                  ]),
                  h('text', { staticStyle: S('flowchart-node-title') }, '1-1'),
                  h('text', { staticStyle: S('flowchart-node-desc') }, '初临神域，古镇街道漫步')
                ]),
                h('div', { staticStyle: S('flowchart-arrow') }, [
                  h('text', { staticStyle: S('flowchart-arrow-text') }, '▶')
                ]),
                h('div', {
                  staticStyle: S('flowchart-node'),
                  on: { click: function () { vm.jumpFromFlowchart(350); } }
                }, [
                  h('div', { staticStyle: S('flowchart-node-header') }, [
                    h('text', { staticStyle: S('flowchart-node-tag') }, 'CHAPTER 1-2'),
                    h('text', { staticStyle: S('flowchart-node-status') }, '● 已解锁')
                  ]),
                  h('text', { staticStyle: S('flowchart-node-title') }, '1-2'),
                  h('text', { staticStyle: S('flowchart-node-desc') }, '神社盛典，拔出名刀丛雨丸')
                ])
              ]),

              // 第二行：1-3 -> 2-1
              h('div', { staticStyle: S('flowchart-trunk-row') }, [
                h('div', {
                  staticStyle: S('flowchart-node'),
                  on: { click: function () { vm.jumpFromFlowchart(550); } }
                }, [
                  h('div', { staticStyle: S('flowchart-node-header') }, [
                    h('text', { staticStyle: S('flowchart-node-tag') }, 'CHAPTER 1-3'),
                    h('text', { staticStyle: S('flowchart-node-status') }, '● 已解锁')
                  ]),
                  h('text', { staticStyle: S('flowchart-node-title') }, '1-3'),
                  h('text', { staticStyle: S('flowchart-node-desc') }, '神刀少女显现，五百年心意相通')
                ]),
                h('div', { staticStyle: S('flowchart-arrow') }, [
                  h('text', { staticStyle: S('flowchart-arrow-text') }, '▶')
                ]),
                h('div', {
                  staticStyle: S('flowchart-node-decision'),
                  on: { click: function () { vm.jumpFromFlowchart(780); } }
                }, [
                  h('div', { staticStyle: S('flowchart-node-header') }, [
                    h('text', { staticStyle: S('flowchart-node-tag') }, 'CHAPTER 2-1'),
                    h('text', { staticStyle: S('flowchart-node-status') }, '★ 分歧点')
                  ]),
                  h('text', { staticStyle: S('flowchart-node-title') }, '2-1'),
                  h('text', { staticStyle: S('flowchart-node-desc') }, '四方宿命由此分道扬镳')
                ])
              ])
            ]),

            // 右侧：四女主分支
            h('div', { staticStyle: S('flowchart-branch-pane') }, [
              // 芳乃线
              h('div', {
                staticStyle: S('flowchart-branch-card'),
                on: { click: function () { vm.jumpFromFlowchart(804); } }
              }, [
                h('div', { staticStyle: S('flowchart-branch-info') }, [
                  h('text', { staticStyle: S('flowchart-branch-name') }, '【芳乃】朝武芳乃线'),
                  h('text', { staticStyle: S('flowchart-branch-sub') }, '神刀解除・巫女誓约')
                ]),
                h('div', { staticStyle: S('flowchart-branch-end') }, [
                  h('text', { staticStyle: S('flowchart-branch-end-text') }, '蝶印 · TRUE END')
                ])
              ]),

              // 茉子线
              h('div', {
                staticStyle: S('flowchart-branch-card'),
                on: { click: function () { vm.jumpFromFlowchart(400); } }
              }, [
                h('div', { staticStyle: S('flowchart-branch-info') }, [
                  h('text', { staticStyle: S('flowchart-branch-name') }, '【茉子】常陆茉子线'),
                  h('text', { staticStyle: S('flowchart-branch-sub') }, '忍者少女・忠义守护')
                ]),
                h('div', { staticStyle: S('flowchart-branch-end') }, [
                  h('text', { staticStyle: S('flowchart-branch-end-text') }, '蝶印 · HAPPY END')
                ])
              ]),

              // 丛雨线
              h('div', {
                staticStyle: S('flowchart-branch-card'),
                on: { click: function () { vm.jumpFromFlowchart(560); } }
              }, [
                h('div', { staticStyle: S('flowchart-branch-info') }, [
                  h('text', { staticStyle: S('flowchart-branch-name') }, '【丛雨】丛雨幼刀线'),
                  h('text', { staticStyle: S('flowchart-branch-sub') }, '五百年宿命・神刀之誓')
                ]),
                h('div', { staticStyle: S('flowchart-branch-end') }, [
                  h('text', { staticStyle: S('flowchart-branch-end-text') }, '蝶印 · TRUE END')
                ])
              ]),

              // 蕾娜线
              h('div', {
                staticStyle: S('flowchart-branch-card'),
                on: { click: function () { vm.jumpFromFlowchart(250); } }
              }, [
                h('div', { staticStyle: S('flowchart-branch-info') }, [
                  h('text', { staticStyle: S('flowchart-branch-name') }, '【蕾娜】蕾娜异国线'),
                  h('text', { staticStyle: S('flowchart-branch-sub') }, '异国微风・绿茶物语')
                ]),
                h('div', { staticStyle: S('flowchart-branch-end') }, [
                  h('text', { staticStyle: S('flowchart-branch-end-text') }, '蝶印 · HAPPY END')
                ])
              ])
            ])
          ])
        ])
      );
    } else if (vm.titleModalType === 'after') {
      var afterHeroines = [
        { key: 'yoshino', tag: '【芳乃】', name: '朝武 芳乃', title: '「巫女新娘的日常」', desc: '神刀解除后的甘甜同居时光', line: 784 },
        { key: 'mako', tag: '【茉子】', name: '常陆 茉子', title: '「忍者少女的假日」', desc: '卸下护卫重任的两人约会', line: 200 },
        { key: 'murasame', tag: '【丛雨】', name: '丛 雨', title: '「幽灵的永恒之约」', desc: '跨越五百年的相伴温暖心愿', line: 560 },
        { key: 'lena', tag: '【蕾娜】', name: '蕾 娜', title: '「绿茶香气的晨光」', desc: '异国风情调配与晨间轻吻', line: 260 },
        { key: 'koharu', tag: '【小春】', name: '鞍马 小春', title: '「甜点屋的和风修行」', desc: '和果子制作中的心跳亲近', line: 160 },
        { key: 'roka', tag: '【芦花】', name: '马场 芦花', title: '「温泉旅馆的微醺之夜」', desc: '志那都庄老板娘的温柔照料', line: 120 }
      ];

      var afterCards = afterHeroines.map(function (it) {
        return h('div', {
          key: it.key,
          staticStyle: S('after-card'),
          on: { click: function () { vm.startAfterStory(it.key, it.line); } }
        }, [
          h('div', { staticStyle: S('after-card-top') }, [
            h('div', { staticStyle: S('after-card-name-box') }, [
              h('text', { staticStyle: S('after-card-icon') }, it.tag),
              h('text', { staticStyle: S('after-card-name') }, it.name)
            ]),
            h('div', { staticStyle: S('after-card-badge') }, [
              h('text', { staticStyle: S('after-card-badge-text') }, '后日篇')
            ])
          ]),
          h('text', { staticStyle: S('after-card-title') }, it.title),
          h('text', { staticStyle: S('after-card-desc') }, it.desc)
        ]);
      });

      children.push(
        h('div', { staticStyle: S('after-root') }, [
          h('div', { staticStyle: S('after-header') }, [
            h('div', { staticStyle: S('after-title-box') }, [
              h('text', { staticStyle: S('after-title-text') }, '◆ 日后谈 AFTER STORY ◆'),
              h('text', { staticStyle: S('after-subtitle') }, '主线、共同线与单人线完结之后的追加故事，轻触角色卡片开启物语')
            ]),
            h('div', {
              staticStyle: S('after-close-btn'),
              on: { click: function () { vm.closeTitleModal(); } }
            }, [
              h('text', { staticStyle: S('after-close-text') }, '返回标题')
            ])
          ]),
          h('div', { staticStyle: S('after-grid') }, afterCards)
        ])
      );
    }
  }

  // 和风二次确认弹窗（TITLE DATA LOAD CONFIRM）
  if (vm.titleConfirmModal) {
    children.push(
      h('div', { staticStyle: S('confirm-mask') }, [
        h('div', { staticStyle: S('confirm-box') }, [
          // 顶部标题
          h('div', { staticStyle: S('confirm-header') }, [
            h('text', { staticStyle: S('confirm-title-icon') }, '❖'),
            h('text', { staticStyle: S('confirm-title-text') }, vm.titleConfirmModal.title),
            h('text', { staticStyle: S('confirm-title-icon') }, '❖')
          ]),
          // 中间提示与风险信息
          h('div', { staticStyle: S('confirm-content') }, [
            h('text', { staticStyle: S('confirm-slot-code') }, vm.titleConfirmModal.subtitle),
            h('text', { staticStyle: S('confirm-msg-text') }, vm.titleConfirmModal.message)
          ]),
          // 底部双按钮操作区
          h('div', { staticStyle: S('confirm-actions') }, [
            h('div', {
              staticStyle: S('confirm-btn confirm-btn-ok'),
              on: { click: function () { vm.confirmExecuteTitleLoad(); } }
            }, [
              h('text', { staticStyle: S('confirm-btn-ok-text') }, '确定载入')
            ]),
            h('div', {
              staticStyle: S('confirm-btn confirm-btn-cancel'),
              on: { click: function () { vm.cancelTitleConfirm(); } }
            }, [
              h('text', { staticStyle: S('confirm-btn-cancel-text') }, '取消')
            ])
          ])
        ])
      ])
    );
  }

  return h('div', { staticStyle: S('title-root') }, children);
}
