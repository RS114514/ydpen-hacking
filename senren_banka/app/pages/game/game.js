// pages/game/game.js —— 超宽带鱼屏 390+322+88 分栏视觉小说主引擎
import { S, getGal, log, getChapterByLine } from '../../common.js';
import {
  readAllSaves,
  writeAllSaves,
  saveSlotRecord,
  loadSlotRecord,
  getNowDateStr,
  pushBacklog
} from '../../storage.js';
import { chapter001 } from '../../data/chapter001.js';

export var gameMethods = {
  initGame: function () {
    var line = this.currentLine || 0;
    if (line < 0) line = 0;
    if (line >= chapter001.length) line = chapter001.length - 1;
    this.currentLine = line;
    this.modalType = ''; // '' | 'save' | 'load' | 'menu'
    this.confirmModal = null; // null | { mode, slotNum, title, subtitle, message, isOverwrite }
    this.modalSaves = readAllSaves();
    this.savePage = 0;
    this.selectedSlot = 1;
    this.zoomMode = false;
    this.autoPlay = false;
    this.skipMode = false;
    this.clearAutoTimer();
    this.applyCurrentLine(true);
  },

  applyCurrentLine: function (playVoice) {
    var row = chapter001[this.currentLine || 0];
    if (!row) return;

    var speaker = row[1];
    var text = row[2];
    var voice = row[3];
    var bgm = row[5];
    var chapterTag = getChapterByLine(this.currentLine);

    // 录入通用历史履历 backlog
    pushBacklog({
      id: this.currentLine,
      chapter: chapterTag,
      speaker: speaker || '',
      text: text || '',
      voice: voice || null,
      bgm: bgm || null
    });

    var G = getGal();
    if (G) {
      // BGM 处理
      if (bgm && bgm !== this.currentBgm) {
        this.currentBgm = bgm;
        var bgmFile = bgm.toLowerCase().indexOf('.opus') >= 0 ? bgm : bgm + '.opus';
        G.playBgm('/userdisk/SenrenBanka/bgm/' + bgmFile, true, 0.8);
      }

      // 语音处理
      if (playVoice) {
        G.stopVoice();
        if (voice) {
          var voiceFile = voice.toLowerCase().indexOf('.ogg') >= 0 ? voice : voice + '.ogg';
          G.playVoice('/userdisk/SenrenBanka/voice/' + voiceFile, 1.0);
          this.hasVoice = true;
        } else {
          this.hasVoice = false;
        }
      }
    }

    // 自动或快进定时器
    if (this.skipMode) {
      this.scheduleSkipNext();
    } else if (this.autoPlay) {
      this.scheduleAutoNext(text, voice);
    }
  },

  scheduleAutoNext: function (text, voice) {
    this.clearAutoTimer();
    var self = this;
    var delay = voice ? 3800 : Math.max(2000, (text || '').length * 150);
    this.autoTimer = setTimeout(function () {
      if (self.autoPlay && self.view === 'game' && !self.modalType && !self.confirmModal) {
        self.nextLine();
      }
    }, delay);
  },

  scheduleSkipNext: function () {
    this.clearAutoTimer();
    var self = this;
    this.autoTimer = setTimeout(function () {
      if (self.skipMode && self.view === 'game' && !self.modalType && !self.confirmModal) {
        self.nextLine();
      }
    }, 180);
  },

  clearAutoTimer: function () {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  },

  nextLine: function () {
    if (this.modalType || this.confirmModal) return;
    if (this.zoomMode) {
      this.zoomMode = false;
      return;
    }
    if (this.currentLine < chapter001.length - 1) {
      this.currentLine++;
      this.applyCurrentLine(true);
    } else {
      this.skipMode = false;
      this.autoPlay = false;
      this.openGameModal('menu');
    }
  },

  replayVoice: function () {
    var row = chapter001[this.currentLine || 0];
    if (!row) return;
    var voice = row[3];
    var G = getGal();
    if (G && voice) {
      G.stopVoice();
      var voiceFile = voice.toLowerCase().indexOf('.ogg') >= 0 ? voice : voice + '.ogg';
      G.playVoice('/userdisk/SenrenBanka/voice/' + voiceFile, 1.0);
    }
  },

  toggleAutoPlay: function () {
    this.skipMode = false;
    this.autoPlay = !this.autoPlay;
    if (this.autoPlay) {
      var row = chapter001[this.currentLine || 0];
      if (row) {
        this.scheduleAutoNext(row[2], row[3]);
      }
    } else {
      this.clearAutoTimer();
    }
  },

  toggleSkipMode: function () {
    this.autoPlay = false;
    this.skipMode = !this.skipMode;
    if (this.skipMode) {
      this.scheduleSkipNext();
    } else {
      this.clearAutoTimer();
    }
  },

  toggleZoom: function () {
    this.zoomMode = !this.zoomMode;
  },

  openGameModal: function (type) {
    this.modalType = type;
    this.confirmModal = null;
    this.modalSaves = readAllSaves();
    this.savePage = this.savePage || 0;
    this.selectedSlot = this.selectedSlot || 1;
    this.clearAutoTimer();
    this.skipMode = false;
  },

  closeGameModal: function () {
    this.modalType = '';
    this.confirmModal = null;
    if (this.autoPlay) {
      var row = chapter001[this.currentLine || 0];
      if (row) this.scheduleAutoNext(row[2], row[3]);
    }
  },

  switchModalMode: function (mode) {
    this.modalType = mode;
    this.confirmModal = null;
  },

  changeSavePage: function (delta) {
    var p = (this.savePage || 0) + delta;
    if (p < 0) p = 4;
    if (p > 4) p = 0;
    this.savePage = p;
    this.selectedSlot = p * 6 + 1;
    this.confirmModal = null;
  },

  // 槽位点击交互：触发和风二次确认弹窗
  selectSlotItem: function (slotNum) {
    if (this._confirmExecuting) return;
    this.selectedSlot = slotNum;
    var saves = this.modalSaves || readAllSaves();
    var existing = saves['slot' + slotNum];
    var pageStr = (this.savePage || 0) + 1;
    var codeStr = 's000' + pageStr + '-' + (slotNum < 10 ? '0' + slotNum : '' + slotNum);
    var currentChapter = getChapterByLine(this.currentLine);

    if (this.modalType === 'save') {
      if (existing) {
        this.confirmModal = {
          mode: 'save',
          slotNum: slotNum,
          isOverwrite: true,
          title: '覆盖存档确认',
          subtitle: '槽位 ' + codeStr + ' 已存有数据（' + (existing.time || '——') + ' · ' + (existing.chapter || '1-1') + '）',
          message: '覆盖后原有进度将无法找回，是否确定要覆盖此槽位？',
          warn: '※ 提示：原存档数据一经覆盖将无法复原'
        };
      } else {
        this.confirmModal = {
          mode: 'save',
          slotNum: slotNum,
          isOverwrite: false,
          title: '保存物语进度',
          subtitle: '目标：空存档槽位 ' + codeStr,
          message: '是否将当前【' + currentChapter + '】物语进度封存至此槽位？',
          warn: '※ 提示：将保存当前台词进度及场景数据'
        };
      }
    } else if (this.modalType === 'load') {
      if (existing && typeof existing.line === 'number') {
        this.confirmModal = {
          mode: 'load',
          slotNum: slotNum,
          isOverwrite: false,
          title: '读取进度确认',
          subtitle: '载入目标：' + codeStr + '（' + (existing.time || '——') + ' · ' + (existing.chapter || '1-1') + '）',
          message: '读取后当前未保存的推进进度将会丢失，是否确定读取？',
          warn: '※ 提示：载入将直接跳转至目标物语进度，当前未保存进度将丢失'
        };
      }
    }
  },

  confirmExecuteAction: function () {
    if (!this.confirmModal || this._confirmExecuting) return;
    this._confirmExecuting = true;
    var slotNum = this.confirmModal.slotNum;
    var mode = this.confirmModal.mode;
    this.confirmModal = null;
    var self = this;
    setTimeout(function () {
      self._confirmExecuting = false;
      if (mode === 'save') {
        self.executeSaveToSlot(slotNum);
      } else if (mode === 'load') {
        self.executeLoadFromSlot(slotNum);
      }
    }, 60);
  },

  cancelConfirmAction: function () {
    this.confirmModal = null;
    this._confirmExecuting = false;
  },

  executeSaveToSlot: function (slotNum) {
    var row = chapter001[this.currentLine || 0] || [];
    var chapterTag = getChapterByLine(this.currentLine);
    saveSlotRecord(slotNum, {
      line: this.currentLine || 0,
      chapter: chapterTag,
      speaker: row[1] || '',
      text: row[2] || '',
      bg: row[4] || '',
      bgm: row[5] || '',
      character: row[6] || null
    });
    this.modalSaves = readAllSaves();
    this.selectedSlot = slotNum;
  },

  executeLoadFromSlot: function (slotNum) {
    var saves = this.modalSaves || readAllSaves();
    var data = saves['slot' + slotNum];
    if (data && typeof data.line === 'number') {
      this.currentLine = data.line;
      this.closeGameModal();
      this.applyCurrentLine(true);
    }
  },

  exitToTitle: function () {
    this.clearAutoTimer();
    var G = getGal();
    if (G) {
      G.stopVoice();
      G.stopBgm();
    }
    this.view = 'title';
    this.modalType = '';
    this.confirmModal = null;
    this.zoomMode = false;
    this.skipMode = false;
    this.autoPlay = false;
    if (typeof this.initTitle === 'function') {
      this.initTitle();
    }
  }
};

export function renderGame(vm, h) {
  var lineIdx = vm.currentLine || 0;
  var row = chapter001[lineIdx] || [0, '', '……', null, '画面_黒', 'bgm01', null];
  var speaker = row[1];
  var text = row[2];
  var bg = row[4];
  var bgSrc = (!bg || bg === '画面_黒') ? '' : 'file:///userdisk/SenrenBanka/bg/' + bg + '.png';

  // 舞台区立绘与差分表情解析
  var charInfo = row[6];
  var charSrc = '';
  if (charInfo && charInfo.char && charInfo.face && charInfo.file) {
    charSrc = 'file:///userdisk/SenrenBanka/fg/' + charInfo.char + '_' + (charInfo.dress || '私服') + '_' + charInfo.face + '.png';
  }

  var speakerDisplay = speaker ? '【' + speaker + '】' : '【独 白】';
  var isNarration = !speaker;
  var currentChapter = getChapterByLine(lineIdx);
  var progressStr = (lineIdx + 1) + ' / ' + chapter001.length;

  var children = [
    // 1. 左侧画面舞台区（390px x 220px 纯净无遮挡，背景 + 角色立绘）
    h('div', {
      staticStyle: S('game-stage-pane'),
      on: { click: function () { vm.toggleZoom(); } }
    }, [
      bgSrc ? h('image', {
        staticStyle: S('game-stage-img'),
        attrs: { src: bgSrc }
      }) : null,
      charSrc ? h('image', {
        staticStyle: S('game-stage-char'),
        attrs: { src: charSrc }
      }) : null
    ]),

    // 2. 中间大字号剧情对话区（322px x 220px，点击推进）
    h('div', {
      staticStyle: S('game-dialog-pane'),
      on: { click: function () { vm.nextLine(); } }
    }, [
      // 头部名牌
      h('div', { staticStyle: S('game-dialog-header') }, [
        h('div', {
          staticStyle: S(isNarration ? 'game-speaker-badge game-speaker-badge-narration' : 'game-speaker-badge')
        }, [
          h('text', { staticStyle: S('game-speaker-name') }, speakerDisplay)
        ]),
        h('text', { staticStyle: S('game-dialog-progress') }, progressStr)
      ]),

      // 中间台词正文（大字号 20px，支持超长文本上下滚动）
      h('div', { staticStyle: S('game-dialog-body') }, [
        h('text', { staticStyle: S('game-dialog-text') }, text)
      ]),

      // 底部操作提示与状态栏（规范章节名展示：1-1）
      h('div', { staticStyle: S('game-dialog-footer') }, [
        h('div', { staticStyle: S('game-dialog-footer-left') }, [
          h('div', { staticStyle: S('game-sub-chapter-tag') }, [
            h('text', { staticStyle: S('game-sub-chapter-text') }, currentChapter)
          ]),
          h('div', {
            staticStyle: S('game-sub-zoom-tag'),
            on: {
              click: function () {
                vm.toggleZoom();
              }
            }
          }, [
            h('text', { staticStyle: S('game-sub-zoom-text') }, '轻触特写')
          ]),
          vm.hasVoice ? h('text', { staticStyle: S('game-voice-playing-hint') }, '♪ 发声') : null
        ]),
        h('text', { staticStyle: S('game-dialog-tap-hint') }, '轻触推进 ▼')
      ])
    ]),

    // 3. 右侧大尺寸触控快捷栏（88px x 220px，4 个核心功能按键）
    h('div', { staticStyle: S('game-ctrl-pane') }, [
      // (1) 语音
      h('div', {
        staticStyle: S('game-ctrl-btn'),
        on: { click: function () { vm.replayVoice(); } }
      }, [
        h('text', { staticStyle: S('game-ctrl-btn-title') }, '♪ 重听'),
        h('text', { staticStyle: S('game-ctrl-btn-sub') }, 'VOICE')
      ]),

      // (2) 自动
      h('div', {
        staticStyle: S(vm.autoPlay ? 'game-ctrl-btn game-ctrl-btn-active' : 'game-ctrl-btn'),
        on: { click: function () { vm.toggleAutoPlay(); } }
      }, [
        h('text', { staticStyle: S('game-ctrl-btn-title') }, vm.autoPlay ? '■ 停止' : '▶ 自动'),
        h('text', { staticStyle: S(vm.autoPlay ? 'game-ctrl-btn-sub-active' : 'game-ctrl-btn-sub') }, 'AUTO')
      ]),

      // (3) 快进
      h('div', {
        staticStyle: S(vm.skipMode ? 'game-ctrl-btn game-ctrl-btn-active' : 'game-ctrl-btn'),
        on: { click: function () { vm.toggleSkipMode(); } }
      }, [
        h('text', { staticStyle: S('game-ctrl-btn-title') }, vm.skipMode ? '■ 停止' : '» 快进'),
        h('text', { staticStyle: S(vm.skipMode ? 'game-ctrl-btn-sub-active' : 'game-ctrl-btn-sub') }, 'SKIP')
      ]),

      // (4) 菜单
      h('div', {
        staticStyle: S('game-ctrl-btn'),
        on: { click: function () { vm.openGameModal('menu'); } }
      }, [
        h('text', { staticStyle: S('game-ctrl-btn-title') }, '≡ 菜单'),
        h('text', { staticStyle: S('game-ctrl-btn-sub') }, 'MENU')
      ])
    ])
  ];

  // 全屏特写模式（点击左侧舞台进入）
  if (vm.zoomMode) {
    children.push(
      h('div', {
        staticStyle: S('game-zoom-overlay'),
        on: { click: function () { vm.toggleZoom(); } }
      }, [
        bgSrc ? h('image', {
          staticStyle: S('game-zoom-img'),
          attrs: { src: bgSrc }
        }) : null,
        charSrc ? h('image', {
          staticStyle: S('game-zoom-char'),
          attrs: { src: charSrc }
        }) : null,
        h('div', { staticStyle: S('game-zoom-close-bar') }, [
          h('text', { staticStyle: S('game-zoom-close-text') }, '轻触任意处退出特写 [X]')
        ])
      ])
    );
  }

  // 弹窗浮层（原版 DATA SAVE / DATA LOAD 存档中心 或 系统菜单）
  if (vm.modalType === 'save' || vm.modalType === 'load') {
    var isSave = vm.modalType === 'save';
    var page = vm.savePage || 0;
    var totalPages = 5;
    var pageStr = '000' + (page + 1) + ' / 000' + totalPages;
    var mSaves = vm.modalSaves || {};
    var selSlot = vm.selectedSlot || (page * 6 + 1);

    // 左侧选定槽位预览数据
    var selItem = mSaves['slot' + selSlot];
    var selBg = selItem && selItem.bg && selItem.bg !== '画面_黒' ? 'file:///userdisk/SenrenBanka/bg/' + selItem.bg + '.png' : '';
    var selDate = selItem && selItem.time ? selItem.time : '——';
    var selChapter = selItem && selItem.chapter ? selItem.chapter : currentChapter;
    var selComment = selItem ? (selItem.speaker ? '【' + selItem.speaker + '】' : '') + selItem.text : 'NO DATA';

    // 右侧 6 个槽位卡片
    var slotCards = [];
    var startNum = page * 6 + 1;
    for (var i = 0; i < 6; i++) {
      (function (slotNum) {
        var it = mSaves['slot' + slotNum];
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
            on: { click: function () { vm.selectSlotItem(slotNum); } }
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
            h('text', { staticStyle: S('saveload-title-text') }, isSave ? 'DATA SAVE' : 'DATA LOAD')
          ]),
          h('div', { staticStyle: S('saveload-header-right') }, [
            // 模式切换 TAB
            h('div', { staticStyle: S('saveload-mode-tabs') }, [
              h('div', {
                staticStyle: S(isSave ? 'saveload-mode-tab saveload-mode-tab-active' : 'saveload-mode-tab'),
                on: { click: function () { vm.switchModalMode('save'); } }
              }, [
                isSave ? h('div', { staticStyle: S('saveload-mode-dot') }) : null,
                h('text', { staticStyle: S(isSave ? 'saveload-mode-text-active' : 'saveload-mode-text') }, '存档')
              ]),
              h('div', {
                staticStyle: S(!isSave ? 'saveload-mode-tab saveload-mode-tab-active' : 'saveload-mode-tab'),
                on: { click: function () { vm.switchModalMode('load'); } }
              }, [
                !isSave ? h('div', { staticStyle: S('saveload-mode-dot') }) : null,
                h('text', { staticStyle: S(!isSave ? 'saveload-mode-text-active' : 'saveload-mode-text') }, '读取')
              ])
            ]),
            // 翻页控制器
            h('div', { staticStyle: S('saveload-pager') }, [
              h('div', {
                staticStyle: S('saveload-pager-btn'),
                on: { click: function () { vm.changeSavePage(-1); } }
              }, [
                h('text', { staticStyle: S('saveload-pager-btn-text') }, '‹')
              ]),
              h('text', { staticStyle: S('saveload-pager-text') }, pageStr),
              h('div', {
                staticStyle: S('saveload-pager-btn'),
                on: { click: function () { vm.changeSavePage(1); } }
              }, [
                h('text', { staticStyle: S('saveload-pager-btn-text') }, '›')
              ])
            ]),
            // 关闭按钮
            h('div', {
              staticStyle: S('saveload-header-close-btn'),
              on: { click: function () { vm.closeGameModal(); } }
            }, [
              h('text', { staticStyle: S('saveload-header-close-text') }, '返回游戏')
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
          h('text', { staticStyle: S('saveload-bottom-tip') },
            isSave ? '保存界面。轻触槽位弹出保存与覆盖确认。' : '载入界面。轻触有数据的槽位弹出载入确认。'
          ),
          h('div', { staticStyle: S('saveload-bottom-actions') }, [
            h('div', {
              staticStyle: S('saveload-bottom-btn'),
              on: { click: function () { vm.exitToTitle(); } }
            }, [
              h('text', { staticStyle: S('saveload-bottom-btn-text') }, '返回标题界面')
            ]),
            h('div', {
              staticStyle: S('saveload-bottom-btn'),
              on: { click: function () { vm.closeGameModal(); } }
            }, [
              h('text', { staticStyle: S('saveload-bottom-btn-text') }, '返回游戏')
            ])
          ])
        ])
      ])
    );
  } else if (vm.modalType === 'menu') {
    var modalContent = h('div', { staticStyle: S('game-menu-grid') }, [
      h('div', {
        staticStyle: S('game-menu-action-btn'),
        on: { click: function () { vm.openGameModal('save'); } }
      }, [
        h('text', { staticStyle: S('game-menu-action-title') }, '保存进度'),
        h('text', { staticStyle: S('game-menu-action-sub') }, 'SAVE GAME')
      ]),
      h('div', {
        staticStyle: S('game-menu-action-btn'),
        on: { click: function () { vm.openGameModal('load'); } }
      }, [
        h('text', { staticStyle: S('game-menu-action-title') }, '读取进度'),
        h('text', { staticStyle: S('game-menu-action-sub') }, 'LOAD GAME')
      ]),
      h('div', {
        staticStyle: S('game-menu-action-btn'),
        on: { click: function () { vm.exitToTitle(); } }
      }, [
        h('text', { staticStyle: S('game-menu-action-title') }, '返回标题'),
        h('text', { staticStyle: S('game-menu-action-sub') }, 'RETURN TITLE')
      ])
    ]);

    children.push(
      h('div', { staticStyle: S('game-modal-mask') }, [
        h('div', { staticStyle: S('game-modal-card') }, [
          h('div', { staticStyle: S('game-modal-header') }, [
            h('text', { staticStyle: S('game-modal-title') }, '≡ 系统菜单 ≡'),
            h('div', {
              staticStyle: S('game-modal-close-btn'),
              on: { click: function () { vm.closeGameModal(); } }
            }, [
              h('text', { staticStyle: S('game-modal-close-text') }, '返回游戏')
            ])
          ]),
          modalContent
        ])
      ])
    );
  }

  // 和风二次确认弹窗（SAVE / LOAD CONFIRM）
  if (vm.confirmModal) {
    children.push(
      h('div', { staticStyle: S('confirm-mask') }, [
        h('div', { staticStyle: S('confirm-box') }, [
          // 顶部标题
          h('div', { staticStyle: S('confirm-header') }, [
            h('text', { staticStyle: S('confirm-title-icon') }, '❖'),
            h('text', { staticStyle: S('confirm-title-text') }, vm.confirmModal.title),
            h('text', { staticStyle: S('confirm-title-icon') }, '❖')
          ]),
          // 中间提示与风险信息
          h('div', { staticStyle: S('confirm-content') }, [
            h('text', { staticStyle: S('confirm-slot-code') }, vm.confirmModal.subtitle),
            h('text', { staticStyle: S('confirm-msg-text') }, vm.confirmModal.message),
            vm.confirmModal.warn ? h('text', { staticStyle: S('confirm-sub-warn') }, vm.confirmModal.warn) : null
          ]),
          // 底部双按钮操作区
          h('div', { staticStyle: S('confirm-actions') }, [
            h('div', {
              staticStyle: S('confirm-btn confirm-btn-ok'),
              on: { click: function () { vm.confirmExecuteAction(); } }
            }, [
              h('text', { staticStyle: S('confirm-btn-ok-text') }, vm.confirmModal.mode === 'save' ? (vm.confirmModal.isOverwrite ? '确定覆盖' : '确定保存') : '确定载入')
            ]),
            h('div', {
              staticStyle: S('confirm-btn confirm-btn-cancel'),
              on: { click: function () { vm.cancelConfirmAction(); } }
            }, [
              h('text', { staticStyle: S('confirm-btn-cancel-text') }, '取消')
            ])
          ])
        ])
      ])
    );
  }

  return h('div', { staticStyle: S('game-root') }, children);
}
