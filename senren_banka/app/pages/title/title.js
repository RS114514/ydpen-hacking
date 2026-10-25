// pages/title/title.js —— 原版文字主菜单与鉴赏/日后谈入口
import { S, getGal, log, getChapterByLine } from '../../common.js';
import { readAllSaves, readSettings, writeSettings } from '../../storage.js';

// 标题页读档/新游戏的安全场景解析：仅允许 main 与 after_* 剧本
function safeScenario(value) {
  if (typeof value === 'string' && (value === 'main' || /^after_[A-Za-z0-9_]+$/.test(value))) {
    return value;
  }
  return 'main';
}

function safeLine(value) {
  if (typeof value !== 'number' || !isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export var titleMethods = {
  initTitle: function () {
    this.titleModalType = '';
    var settings = readSettings() || {};
    this.bgmOn = settings.bgmEnabled !== false;
    this.bgmVolume = typeof settings.bgmVolume === 'number' ? settings.bgmVolume : 0.8;
    if (this.bgmVolume < 0) this.bgmVolume = 0;
    if (this.bgmVolume > 1) this.bgmVolume = 1;
    var G = getGal();
    if (G) {
      G.setBgmVolume(this.bgmVolume);
      if (this.bgmOn) {
        G.playBgm('/userdisk/SenrenBanka/bgm/BGM01.opus', true, this.bgmVolume);
      } else {
        G.stopBgm();
      }
    }
    this.titleConfirmModal = null;
    this._confirmExecuting = false;
  },
  startNewGame: function () {
    log('start new game');
    // 新游戏必须显式回到 main 剧本，清除日后谈等残留场景状态
    this.currentScenario = 'main';
    this.currentLine = 0;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame('main', 0);
    }
  },
  continueGame: function () {
    log('continue game');
    var saves = readAllSaves();
    var latestSlot = saves.latest || '1';
    var data = saves['slot' + latestSlot];
    var scenario = data ? safeScenario(data.scenario) : 'main';
    var line = data ? safeLine(data.line) : 0;
    this.currentScenario = scenario;
    this.currentLine = line;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame(scenario, line);
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
    this.titleModalType = '';
    this.titleConfirmModal = null;
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
    this.titleModalType = '';
    this.titleConfirmModal = null;
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
      var scenario = safeScenario(data.scenario);
      var line = safeLine(data.line);
      this.currentScenario = scenario;
      this.currentLine = line;
      this.titleModalType = '';
      this.titleConfirmModal = null;
      this.view = 'game';
      if (typeof this.initGame === 'function') {
        this.initGame(scenario, line);
      }
    }
  },
  openGallery: function () {
    log('open gallery');
    this.titleModalType = '';
    this.titleConfirmModal = null;
    this.galleryCgFullscreen = false;
    this.view = 'gallery';
    if (typeof this.initGallery === 'function') {
      this.initGallery();
    }
  },
  openTitleSettings: function () {
    var settings = readSettings() || {};
    this.bgmOn = settings.bgmEnabled !== false;
    this.bgmVolume = typeof settings.bgmVolume === 'number' ? settings.bgmVolume : 0.8;
    this.titleModalType = 'settings';
    this.titleConfirmModal = null;
  },
  toggleTitleBgm: function () {
    var G = getGal();
    this.bgmOn = !this.bgmOn;
    if (G) {
      if (this.bgmOn) {
        G.setBgmVolume(this.bgmVolume);
        G.playBgm('/userdisk/SenrenBanka/bgm/BGM01.opus', true, this.bgmVolume);
      } else {
        G.stopBgm();
      }
    }
    writeSettings({ bgmEnabled: this.bgmOn, bgmVolume: this.bgmVolume });
  },
  adjustTitleBgmVolume: function (delta) {
    var volume = Math.round((this.bgmVolume + delta) * 10) / 10;
    if (volume < 0) volume = 0;
    if (volume > 1) volume = 1;
    this.bgmVolume = volume;
    var G = getGal();
    if (G) G.setBgmVolume(volume);
    writeSettings({ bgmEnabled: this.bgmOn, bgmVolume: volume });
  },
  openTitleExitModal: function () {
    this.titleModalType = 'exit';
    this.titleConfirmModal = null;
  },
  cancelTitleExit: function () {
    this.titleModalType = '';
  },
  confirmTitleExit: function () {
    if (this.$page && typeof this.$page.finish === 'function') {
      this.$page.finish();
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
  // 左列 4 个核心游玩按钮
  var col1Buttons = [
    // (1) 新游戏
    h('div', {
      staticStyle: S('title-menu-btn title-btn-primary'),
      on: { click: function () { log('click new game'); vm.startNewGame(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '新游戏'),
      h('text', { staticStyle: S('title-btn-sub-highlight') }, 'START')
    ]),
    // (2) 继续游戏
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click continue'); vm.continueGame(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '继续游戏'),
      h('text', { staticStyle: S('title-btn-sub') }, 'CONTINUE')
    ]),
    // (3) 读取存档
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click load'); vm.openTitleLoadModal(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '读取存档'),
      h('text', { staticStyle: S('title-btn-sub') }, 'LOAD')
    ]),
    // (4) 流程图
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click flowchart'); vm.openFlowchartModal(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '流程图'),
      h('text', { staticStyle: S('title-btn-sub') }, 'CHART')
    ])
  ];

  // 右列 4 个鉴赏扩展按钮
  var col2Buttons = [
    // (5) 鉴赏 EXTRA
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click gallery'); vm.openGallery(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '鉴赏'),
      h('text', { staticStyle: S('title-btn-sub') }, 'EXTRA')
    ]),
    // (6) 日后谈 AFTER
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
      on: { click: function () { log('click system'); vm.openTitleSettings(); } }
    }, [
      h('text', { staticStyle: S('title-btn-label') }, '系统设置'),
      h('text', { staticStyle: S('title-btn-sub') }, 'SYSTEM')
    ]),
    // (8) 退出游戏 EXIT
    h('div', {
      staticStyle: S('title-menu-btn'),
      on: { click: function () { log('click exit'); vm.openTitleExitModal(); } }
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

    // 2. 左侧双列 8 大按钮（位于 Logo 正下方，完全不遮挡四女主与 Logo）
    h('div', { staticStyle: S('title-menu-container') }, [
      h('div', { staticStyle: S('title-menu-col') }, col1Buttons),
      h('div', { staticStyle: S('title-menu-col') }, col2Buttons)
    ])
  ];

  // 弹窗浮层
  if (vm.titleModalType) {
    if (vm.titleModalType === 'settings') {
      children.push(
        h('div', { staticStyle: S('title-system-mask') }, [
          h('div', { staticStyle: S('title-system-box') }, [
            h('div', { staticStyle: S('title-system-header') }, [
              h('text', { staticStyle: S('title-system-title') }, '❖ 系统设置 SYSTEM ❖'),
              h('text', { staticStyle: S('title-system-subtitle') }, '音频设置将立即生效并保存')
            ]),
            h('div', { staticStyle: S('title-system-content') }, [
              h('div', { staticStyle: S('title-system-row') }, [
                h('text', { staticStyle: S('title-system-label') }, 'BGM 背景音乐'),
                h('div', {
                  staticStyle: S('title-system-btn title-system-switch'),
                  on: { click: function () { vm.toggleTitleBgm(); } }
                }, [
                  h('text', { staticStyle: S('title-system-btn-text') }, vm.bgmOn ? '开启 ON' : '关闭 OFF')
                ])
              ]),
              h('div', { staticStyle: S('title-system-row') }, [
                h('text', { staticStyle: S('title-system-label') }, 'BGM 音量'),
                h('div', { staticStyle: S('title-system-volume') }, [
                  h('div', {
                    staticStyle: S('title-system-btn title-system-volume-btn'),
                    on: { click: function () { vm.adjustTitleBgmVolume(-0.1); } }
                  }, [
                    h('text', { staticStyle: S('title-system-volume-text') }, '－')
                  ]),
                  h('text', { staticStyle: S('title-system-percent') }, Math.round(vm.bgmVolume * 100) + '%'),
                  h('div', {
                    staticStyle: S('title-system-btn title-system-volume-btn'),
                    on: { click: function () { vm.adjustTitleBgmVolume(0.1); } }
                  }, [
                    h('text', { staticStyle: S('title-system-volume-text') }, '＋')
                  ])
                ])
              ])
            ]),
            h('div', { staticStyle: S('title-system-footer') }, [
              h('div', {
                staticStyle: S('title-system-btn title-system-close'),
                on: { click: function () { vm.closeTitleModal(); } }
              }, [
                h('text', { staticStyle: S('title-system-btn-text') }, '返回标题')
              ])
            ])
          ])
        ])
      );
    } else if (vm.titleModalType === 'exit') {
      children.push(
        h('div', { staticStyle: S('title-system-mask') }, [
          h('div', { staticStyle: S('title-system-box title-exit-box') }, [
            h('div', { staticStyle: S('title-system-header') }, [
              h('text', { staticStyle: S('title-system-title') }, '❖ 退出游戏 EXIT ❖')
            ]),
            h('div', { staticStyle: S('title-exit-content') }, [
              h('text', { staticStyle: S('title-exit-message') }, '是否确定结束游戏并退出当前页面？'),
              h('text', { staticStyle: S('title-exit-warn') }, '未保存的物语进度将会丢失')
            ]),
            h('div', { staticStyle: S('title-system-footer title-exit-actions') }, [
              h('div', {
                staticStyle: S('title-system-btn title-system-confirm'),
                on: { click: function () { vm.confirmTitleExit(); } }
              }, [
                h('text', { staticStyle: S('title-system-btn-text') }, '确定退出')
              ]),
              h('div', {
                staticStyle: S('title-system-btn title-system-close'),
                on: { click: function () { vm.cancelTitleExit(); } }
              }, [
                h('text', { staticStyle: S('title-system-btn-text') }, '取消')
              ])
            ])
          ])
        ])
      );
    } else if (vm.titleModalType === 'load') {
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
