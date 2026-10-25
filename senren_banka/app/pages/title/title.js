// pages/title/title.js —— 原版文字主菜单与鉴赏/日后谈入口
import { S, getGal, log, getChapterByLine } from '../../common.js';
import { readAllSaves, readSettings } from '../../storage.js';

export var titleMethods = {
  initTitle: function () {
    var G = getGal();
    if (G) {
      this.bgmOn = true;
      G.playBgm('/userdisk/SenrenBanka/bgm/BGM01.opus', true, 0.8);
    }
    this.titleConfirmModal = null;
    this._confirmExecuting = false;
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
    this.titleSelectedSlot = p * 6 + 1;
    this.titleConfirmModal = null;
  },
  selectTitleSlotItem: function (slotNum) {
    if (this._confirmExecuting) return;
    this.titleSelectedSlot = slotNum;
    var saves = this.titleSaves || readAllSaves();
    var data = saves['slot' + slotNum];
    if (data && typeof data.line === 'number') {
      var pageStr = (this.titleSavePage || 0) + 1;
      var codeStr = 's000' + pageStr + '-' + (slotNum < 10 ? '0' + slotNum : '' + slotNum);
      this.titleConfirmModal = {
        slotNum: slotNum,
        isAfterStory: false,
        title: '读取进度确认',
        subtitle: '载入目标：' + codeStr + '（' + (data.time || '——') + ' · ' + (data.chapter || '1-1') + '）',
        message: '是否确定载入该槽位的物语推进记录？',
        warn: '※ 提示：载入将直接跳转至目标物语进度，未保存进度将丢失'
      };
    }
  },
  confirmExecuteTitleLoad: function () {
    if (!this.titleConfirmModal || this._confirmExecuting) return;
    if (this.titleConfirmModal.isAfterStory) {
      this.titleConfirmModal = null;
      return;
    }
    this._confirmExecuting = true;
    var slotNum = this.titleConfirmModal.slotNum;
    this.titleConfirmModal = null;
    var self = this;
    setTimeout(function () {
      self._confirmExecuting = false;
      self.loadSlotFromTitle(slotNum);
    }, 60);
  },
  cancelTitleConfirm: function () {
    this.titleConfirmModal = null;
    this._confirmExecuting = false;
  },
  openFlowchartModal: function () {
    this.view = 'flowchart';
    if (typeof this.initFlowchart === 'function') {
      this.initFlowchart();
    }
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
    this.view = 'afterstory';
    if (typeof this.initAfterStory === 'function') {
      this.initAfterStory();
    }
  },
  selectAfterHeroine: function (item) {
    if (!item) return;
    var G = getGal();
    if (G && item.voice) {
      G.stopVoice();
      G.playVoice('/userdisk/SenrenBanka/voice/' + item.voice, 1.0);
    }
    var settings = readSettings();
    var cleared = settings && settings.clearedRoutes && settings.clearedRoutes.indexOf(item.key) >= 0;
    this.afterSelectedHeroine = item.key;
    this.titleConfirmModal = {
      slotNum: null,
      isAfterStory: true,
      voiceFile: item.voice,
      title: '日后谈 · ' + item.name,
      subtitle: item.title + '（AFTER STORY）',
      message: cleared
        ? '【已通关本篇】该角色专属日后谈物语已解锁。'
        : '【待解锁】日后谈为该角色线完结之后的追加故事，需先通关本篇【' + item.name + '线】达成结局后开启。',
      warn: cleared ? '※ 状态：已解锁' : '※ 提示：请先在主线流程图中达成该角色路线结局',
      isCleared: cleared
    };
  },
  playHeroineVoiceAgain: function (voiceFile) {
    var G = getGal();
    if (G && voiceFile) {
      G.stopVoice();
      G.playVoice('/userdisk/SenrenBanka/voice/' + voiceFile, 1.0);
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
      if (newY < -124) newY = -124;
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
    var y = (this.titleScrollY || 0) + 66;
    if (y > 0) y = 0;
    this.titleScrollY = y;
  },
  scrollMenuDown: function () {
    var y = (this.titleScrollY || 0) - 66;
    if (y < -124) y = -124;
    this.titleScrollY = y;
  }
};

export function renderTitle(vm, h) {
  var menuButtons = [
    // (1) 新游戏 NEW GAME
    h('div', {
      staticStyle: S('title-menu-btn title-btn-primary'),
      on: { click: function () { log('click new game'); vm.startNewGame(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '新游戏'),
      h('text', { staticStyle: S('title-btn-sub-highlight') }, 'START ›')
    ]),

    // (2) 继续游戏 CONTINUE
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click continue'); vm.continueGame(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '继续游戏'),
      h('text', { staticStyle: S('title-btn-sub') }, 'CONTINUE')
    ]),

    // (3) 读取存档 LOAD DATA
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click load'); vm.openTitleLoadModal(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '读取存档'),
      h('text', { staticStyle: S('title-btn-sub') }, 'DATA LOAD')
    ]),

    // (4) 流程图 FLOW CHART
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click flowchart'); vm.openFlowchartModal(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '流程图'),
      h('text', { staticStyle: S('title-btn-sub') }, 'CHART')
    ]),

    // (5) 鉴赏 EXTRA（严格修正为原版真实名称“鉴赏”）
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click gallery'); vm.openGallery(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '鉴赏'),
      h('text', { staticStyle: S('title-btn-sub') }, 'EXTRA')
    ]),

    // (6) 日后谈 AFTER STORY（主线/单人线完结后的专属故事）
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click afterstory'); vm.openAfterModal(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '日后谈'),
      h('text', { staticStyle: S('title-btn-sub') }, 'AFTER')
    ]),

    // (7) 系统设置 SYSTEM
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click system'); vm.toggleTitleBgm(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '系统设置'),
      h('text', { staticStyle: S('title-btn-sub') }, 'SYSTEM')
    ]),

    // (8) 退出游戏 EXIT
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click exit'); vm.toggleTitleBgm(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '退出游戏'),
      h('text', { staticStyle: S('title-btn-sub') }, 'EXIT')
    ])
  ];

  // 计算右侧滑动指示滑块位置
  var curY = vm.titleScrollY || 0;
  var ratio = -curY / 124.0;
  if (ratio < 0) ratio = 0;
  if (ratio > 1) ratio = 1;
  var thumbTop = Math.round(ratio * 74);

  var children = [
    // 1. 官方原版 800x220 四女主与官方 Logo 大背景
    h('image', {
      staticStyle: S('title-bg-img'),
      attrs: { src: 'file:///userdisk/SenrenBanka/bg/title_bg.png' }
    }),

    // 2. 左侧原版纵向和风毛笔滑动菜单（位于千恋万花Logo正下方，完全避开Logo，支持滑动）
    h('div', {
      staticStyle: S('title-menu-viewport'),
      on: {
        touchstart: function (e) { vm.onMenuTouchStart(e); },
        touchmove: function (e) { vm.onMenuTouchMove(e); },
        touchend: function (e) { vm.onMenuTouchEnd(e); }
      }
    }, [
      h('div', {
        staticStyle: S('title-menu-list', {
          top: (vm.titleScrollY || 0) + 'px'
        })
      }, menuButtons)
    ]),

    // 4. 菜单右侧滑动微调控制条（上滑 ▲ / 下滑 ▼ / 进度滑块）
    h('div', { staticStyle: S('title-menu-scroll-ctrl') }, [
      h('div', {
        staticStyle: S((vm.titleScrollY || 0) >= 0 ? 'title-scroll-arrow title-scroll-arrow-disabled' : 'title-scroll-arrow'),
        on: { click: function () { vm.scrollMenuUp(); } }
      }, [
        h('text', { staticStyle: S('title-scroll-arrow-text') }, '▲')
      ]),
      h('div', { staticStyle: S('title-scroll-bar') }, [
        h('div', {
          staticStyle: S('title-scroll-thumb', {
            height: '24px',
            top: thumbTop + 'px'
          })
        })
      ]),
      h('div', {
        staticStyle: S((vm.titleScrollY || 0) <= -172 ? 'title-scroll-arrow title-scroll-arrow-disabled' : 'title-scroll-arrow'),
        on: { click: function () { vm.scrollMenuDown(); } }
      }, [
        h('text', { staticStyle: S('title-scroll-arrow-text') }, '▼')
      ])
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
              h('text', { staticStyle: S('flowchart-subtitle') }, '原版章节节点（1-1、1-2、1-3、2-1），轻触直接跳转')
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
                  h('text', { staticStyle: S('flowchart-node-desc') }, '第 1 ~ 350 句剧情')
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
                  h('text', { staticStyle: S('flowchart-node-desc') }, '第 351 ~ 550 句剧情')
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
                  h('text', { staticStyle: S('flowchart-node-desc') }, '第 551 ~ 780 句剧情')
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
                  h('text', { staticStyle: S('flowchart-node-desc') }, '第 781 句开始')
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
                  h('text', { staticStyle: S('flowchart-branch-sub') }, '主线物语')
                ]),
                h('div', { staticStyle: S('flowchart-branch-end') }, [
                  h('text', { staticStyle: S('flowchart-branch-end-text') }, 'TRUE END')
                ])
              ]),

              // 茉子线
              h('div', {
                staticStyle: S('flowchart-branch-card'),
                on: { click: function () { vm.jumpFromFlowchart(400); } }
              }, [
                h('div', { staticStyle: S('flowchart-branch-info') }, [
                  h('text', { staticStyle: S('flowchart-branch-name') }, '【茉子】常陆茉子线'),
                  h('text', { staticStyle: S('flowchart-branch-sub') }, '主线物语')
                ]),
                h('div', { staticStyle: S('flowchart-branch-end') }, [
                  h('text', { staticStyle: S('flowchart-branch-end-text') }, 'HAPPY END')
                ])
              ]),

              // 丛雨线
              h('div', {
                staticStyle: S('flowchart-branch-card'),
                on: { click: function () { vm.jumpFromFlowchart(560); } }
              }, [
                h('div', { staticStyle: S('flowchart-branch-info') }, [
                  h('text', { staticStyle: S('flowchart-branch-name') }, '【丛雨】丛雨幼刀线'),
                  h('text', { staticStyle: S('flowchart-branch-sub') }, '主线物语')
                ]),
                h('div', { staticStyle: S('flowchart-branch-end') }, [
                  h('text', { staticStyle: S('flowchart-branch-end-text') }, 'TRUE END')
                ])
              ]),

              // 蕾娜线
              h('div', {
                staticStyle: S('flowchart-branch-card'),
                on: { click: function () { vm.jumpFromFlowchart(250); } }
              }, [
                h('div', { staticStyle: S('flowchart-branch-info') }, [
                  h('text', { staticStyle: S('flowchart-branch-name') }, '【蕾娜】蕾娜异国线'),
                  h('text', { staticStyle: S('flowchart-branch-sub') }, '主线物语')
                ]),
                h('div', { staticStyle: S('flowchart-branch-end') }, [
                  h('text', { staticStyle: S('flowchart-branch-end-text') }, 'HAPPY END')
                ])
              ])
            ])
          ])
        ])
      );
    } else if (vm.titleModalType === 'after') {
      var afterHeroines = [
        { key: 'yoshino', tag: '【芳乃】', name: '朝武 芳乃', title: '115 · 芳乃－ａｆｔｅｒ', desc: '主线、共同线与芳乃线完结后的专属后日谈', voice: 'yoshino_after.ogg' },
        { key: 'mako', tag: '【茉子】', name: '常陆 茉子', title: '211 · 茉子－ａｆｔｅｒ', desc: '主线、共同线与茉子线完结后的专属后日谈', voice: 'mako_after.ogg' },
        { key: 'murasame', tag: '【丛雨】', name: '丛 雨', title: '317 · ムラサメちゃんおまけルート', desc: '主线、共同线与丛雨线完结后的专属后日谈', voice: 'murasame_after.ogg' },
        { key: 'lena', tag: '【蕾娜】', name: '蕾 娜', title: '429 · レナ・いらっしゃい', desc: '主线、共同线与蕾娜线完结后的专属后日谈', voice: 'lena_after.ogg' },
        { key: 'koharu', tag: '【小春】', name: '鞍马 小春', title: '513 · 小春－ａｆｔｅｒ', desc: '主线、共同线与小春线完结后的专属后日谈', voice: 'koharu_after.ogg' },
        { key: 'roka', tag: '【芦花】', name: '马场 芦花', title: '523 · 芦花－ａｆｔｅｒ', desc: '主线、共同线与芦花线完结后的专属后日谈', voice: 'roka_after.ogg' }
      ];

      var afterCards = afterHeroines.map(function (it) {
        return h('div', {
          key: it.key,
          staticStyle: S('after-card'),
          on: { click: function () { vm.selectAfterHeroine(it); } }
        }, [
          h('div', { staticStyle: S('after-card-top') }, [
            h('div', { staticStyle: S('after-card-name-box') }, [
              h('text', { staticStyle: S('after-card-icon') }, it.tag),
              h('text', { staticStyle: S('after-card-name') }, it.name)
            ]),
            h('div', { staticStyle: S('after-card-badge') }, [
              h('text', { staticStyle: S('after-card-badge-text') }, '日后谈')
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
              h('text', { staticStyle: S('after-subtitle') }, '主线、共同线与单人线完结之后的追加故事，轻触角色卡片查看解锁详情与原版台词')
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

  // 和风二次确认弹窗（TITLE DATA LOAD CONFIRM / AFTER STORY NOTICE）
  if (vm.titleConfirmModal) {
    var isAfter = vm.titleConfirmModal.isAfterStory;
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
            h('text', { staticStyle: S('confirm-msg-text') }, vm.titleConfirmModal.message),
            vm.titleConfirmModal.warn ? h('text', { staticStyle: S('confirm-sub-warn') }, vm.titleConfirmModal.warn) : null
          ]),
          // 底部双按钮操作区
          h('div', { staticStyle: S('confirm-actions') }, isAfter ? [
            h('div', {
              staticStyle: S('confirm-btn confirm-btn-ok'),
              on: { click: function () { vm.confirmExecuteTitleLoad(); } }
            }, [
              h('text', { staticStyle: S('confirm-btn-ok-text') }, '我知道了')
            ]),
            h('div', {
              staticStyle: S('confirm-btn confirm-btn-cancel'),
              on: { click: function () { vm.playHeroineVoiceAgain(vm.titleConfirmModal.voiceFile); } }
            }, [
              h('text', { staticStyle: S('confirm-btn-cancel-text') }, '♪ 重听台词')
            ])
          ] : [
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
