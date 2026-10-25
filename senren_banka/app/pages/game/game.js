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
import { chapter_all } from '../../data/chapter_all.js';
import { after_yoshino } from '../../data/after_yoshino.js';
import { after_mako } from '../../data/after_mako.js';
import { after_murasame } from '../../data/after_murasame.js';
import { after_rena } from '../../data/after_rena.js';
import { after_koharu } from '../../data/after_koharu.js';
import { after_roka } from '../../data/after_roka.js';

var SCENARIOS = {
  main: chapter_all,
  after_yoshino: after_yoshino,
  after_mako: after_mako,
  after_murasame: after_murasame,
  after_rena: after_rena,
  after_koharu: after_koharu,
  after_roka: after_roka
};

var GAME_ZOOM_LEVELS = [
  { scale: 1.0, w: 391, h: 220, label: '1.0x' },
  { scale: 1.5, w: 587, h: 330, label: '1.5x' },
  { scale: 2.0, w: 782, h: 440, label: '2.0x' },
  { scale: 2.5, w: 978, h: 550, label: '2.5x' }
];

// 获取当前运行剧本数据源
function getActiveScenario(vm) {
  var key = (vm && vm.currentScenario) || 'main';
  if (SCENARIOS[key]) {
    return SCENARIOS[key];
  }
  if (vm && vm.currentScenarioData && vm.currentScenarioData.length) {
    return vm.currentScenarioData;
  }
  return chapter_all;
}

// 核心角色立绘多级容错解析
function resolveCharacterSprite(charInfo) {
  if (!charInfo || !charInfo.char) return '';
  var c = charInfo.char;
  if (c === 'ムラサメ') c = '丛雨';
  if (c === 'レナ') c = '蕾娜';

  var maxFaces = {
    '玄十郎': 19,
    '茉子': 20,
    '丛雨': 20,
    '蕾娜': 20,
    '小春': 20,
    '芦花': 20,
    '芳乃': 20
  };

  var maxF = maxFaces[c];
  if (!maxF) return ''; // 非核心配角不展示舞台全身立绘

  var d = charInfo.dress || '私服';
  d = d.replace('寝间着', '寝間着').replace('剑道', '剣道');
  var f = charInfo.face || '01';
  var fNum = parseInt(f, 10);
  if (isNaN(fNum) || fNum <= 0) fNum = 1;
  var mappedNum = ((fNum - 1) % maxF) + 1;
  var mappedFace = mappedNum < 10 ? '0' + mappedNum : '' + mappedNum;

  // 默认使用计算得出的立绘文件名
  return 'file:///userdisk/SenrenBanka/fg/' + c + '_' + d + '_' + mappedFace + '.png';
}

export var gameMethods = {
  initGame: function (scenarioKey, startLine) {
    if (typeof scenarioKey === 'string' && scenarioKey) {
      this.currentScenario = scenarioKey;
    } else if (!this.currentScenario) {
      this.currentScenario = 'main';
    }

    if (typeof startLine === 'number') {
      this.currentLine = startLine;
    }

    var data = getActiveScenario(this);
    var line = this.currentLine || 0;
    if (line < 0) line = 0;
    if (line >= data.length) line = data.length - 1;
    this.currentLine = line;
    this.modalType = ''; // '' | 'save' | 'load' | 'menu' | 'history'
    this.confirmModal = null; // null | { mode, slotNum, title, subtitle, message, isOverwrite }
    this.modalSaves = readAllSaves();
    this.savePage = 0;
    this.selectedSlot = 1;
    this.zoomMode = false;
    this.autoPlay = false;
    this.skipMode = false;

    // 特写缩放与拖动
    this.gameZoomIndex = 0;
    this.gameImgPanX = 204;
    this.gameImgPanY = 0;

    // 历史对话
    this.historyScrollY = 0;
    this._hStartY = 0;
    this._hStartScrollY = 0;

    this.clearAutoTimer();
    this.applyCurrentLine(true);
  },

  applyCurrentLine: function (playVoice) {
    var data = getActiveScenario(this);
    var row = data[this.currentLine || 0];
    if (!row) return;

    var speaker = row[1];
    var text = row[2];
    var voice = row[3];
    var bgm = row[5];
    var chapterTag = row[7] || getChapterByLine(this.currentLine);

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
      if (playVoice && voice) {
        // 词典笔 ALSA 声卡独占保护：语音播放时优先避让 BGM
        if (this.currentBgm) {
          G.stopBgm();
          this.bgmSuspendedForVoice = true;
        }
        G.stopVoice();
        var voiceFile = voice.toLowerCase().indexOf('.ogg') >= 0 ? voice : voice + '.ogg';
        G.playVoice('/userdisk/SenrenBanka/voice/' + voiceFile, 1.0);
        this.hasVoice = true;
        this.startVoiceWatcher();
      } else {
        this.hasVoice = false;
        if (this._voiceWatchTimer) {
          clearInterval(this._voiceWatchTimer);
          this._voiceWatchTimer = null;
        }
        G.stopVoice();

        // 恢复或切换 BGM
        if (bgm && bgm !== this.currentBgm) {
          this.currentBgm = bgm;
          this.bgmSuspendedForVoice = false;
          var bgmFile = bgm.toLowerCase().indexOf('.opus') >= 0 ? bgm : bgm + '.opus';
          G.playBgm('/userdisk/SenrenBanka/bgm/' + bgmFile, true, 0.8);
        } else if (this.bgmSuspendedForVoice && this.currentBgm) {
          this.bgmSuspendedForVoice = false;
          var curBgmFile = this.currentBgm.toLowerCase().indexOf('.opus') >= 0 ? this.currentBgm : this.currentBgm + '.opus';
          G.playBgm('/userdisk/SenrenBanka/bgm/' + curBgmFile, true, 0.8);
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

  startVoiceWatcher: function () {
    if (this._voiceWatchTimer) {
      clearInterval(this._voiceWatchTimer);
      this._voiceWatchTimer = null;
    }
    var self = this;
    var checkCount = 0;
    this._voiceWatchTimer = setInterval(function () {
      checkCount++;
      var G = getGal();
      if (!G) {
        clearInterval(self._voiceWatchTimer);
        self._voiceWatchTimer = null;
        return;
      }
      var st = G.status ? G.status() : null;
      if (st && !st.voice && checkCount >= 2) {
        clearInterval(self._voiceWatchTimer);
        self._voiceWatchTimer = null;
        if (self.bgmSuspendedForVoice && self.currentBgm && self.view === 'game') {
          self.bgmSuspendedForVoice = false;
          var bgmFile = self.currentBgm.toLowerCase().indexOf('.opus') >= 0 ? self.currentBgm : self.currentBgm + '.opus';
          G.playBgm('/userdisk/SenrenBanka/bgm/' + bgmFile, true, 0.8);
        }
      } else if (checkCount > 50) {
        clearInterval(self._voiceWatchTimer);
        self._voiceWatchTimer = null;
      }
    }, 200);
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
    var data = getActiveScenario(this);
    if (this.currentLine < data.length - 1) {
      this.currentLine++;
      this.applyCurrentLine(true);
    } else {
      this.skipMode = false;
      this.autoPlay = false;
      this.openGameModal('menu');
    }
  },

  replayVoice: function () {
    var data = getActiveScenario(this);
    var row = data[this.currentLine || 0];
    if (!row) return;
    var voice = row[3];
    var G = getGal();
    if (G && voice) {
      if (this.currentBgm) {
        G.stopBgm();
        this.bgmSuspendedForVoice = true;
      }
      G.stopVoice();
      var voiceFile = voice.toLowerCase().indexOf('.ogg') >= 0 ? voice : voice + '.ogg';
      G.playVoice('/userdisk/SenrenBanka/voice/' + voiceFile, 1.0);
      this.startVoiceWatcher();
    }
  },

  toggleAutoPlay: function () {
    this.skipMode = false;
    this.autoPlay = !this.autoPlay;
    if (this.autoPlay) {
      var data = getActiveScenario(this);
      var row = data[this.currentLine || 0];
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
    if (this.zoomMode) {
      this.resetGameZoom();
    }
  },

  resetGameZoom: function () {
    this.gameZoomIndex = 0;
    var z = GAME_ZOOM_LEVELS[0];
    this.gameImgPanX = Math.round((664 - z.w) / 2);
    this.gameImgPanY = Math.round((220 - z.h) / 2);
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  zoomInGameImg: function () {
    var cur = this.gameZoomIndex || 0;
    if (cur < GAME_ZOOM_LEVELS.length - 1) {
      this.gameZoomIndex = cur + 1;
      this.clampGameImgPan();
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  zoomOutGameImg: function () {
    var cur = this.gameZoomIndex || 0;
    if (cur > 0) {
      this.gameZoomIndex = cur - 1;
      this.clampGameImgPan();
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  clampGameImgPan: function () {
    var z = GAME_ZOOM_LEVELS[this.gameZoomIndex || 0];
    if (z.w <= 664) {
      this.gameImgPanX = Math.round((664 - z.w) / 2);
    } else {
      var minX = 664 - z.w;
      if (this.gameImgPanX < minX) this.gameImgPanX = minX;
      if (this.gameImgPanX > 0) this.gameImgPanX = 0;
    }
    if (z.h <= 220) {
      this.gameImgPanY = Math.round((220 - z.h) / 2);
    } else {
      var minY = 220 - z.h;
      if (this.gameImgPanY < minY) this.gameImgPanY = minY;
      if (this.gameImgPanY > 0) this.gameImgPanY = 0;
    }
  },

  onGameImgTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._gImgStartX = t.pageX || t.clientX || 0;
      this._gImgStartY = t.pageY || t.clientY || 0;
      this._gImgStartPanX = this.gameImgPanX || 0;
      this._gImgStartPanY = this.gameImgPanY || 0;
    }
  },

  onGameImgTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var cy = t.pageY || t.clientY || 0;
      var dx = cx - this._gImgStartX;
      var dy = cy - this._gImgStartY;
      var z = GAME_ZOOM_LEVELS[this.gameZoomIndex || 0];
      if (z.w > 664) {
        var nx = this._gImgStartPanX + dx;
        var minX = 664 - z.w;
        if (nx < minX - 40) nx = minX - 40;
        if (nx > 40) nx = 40;
        this.gameImgPanX = nx;
      }
      if (z.h > 220) {
        var ny = this._gImgStartPanY + dy;
        var minY = 220 - z.h;
        if (ny < minY - 30) ny = minY - 30;
        if (ny > 30) ny = 30;
        this.gameImgPanY = ny;
      }
    }
  },

  onGameImgTouchEnd: function () {
    this.clampGameImgPan();
  },

  // 历史对话（Backlog）
  openHistoryModal: function () {
    this.modalType = 'history';
    this.confirmModal = null;
    this.clearAutoTimer();
    this.skipMode = false;
    this.historyFocusIndex = this.currentLine || 0;
  },

  onHistoryTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._hStartY = t.pageY || t.clientY || 0;
      this._hStartFocus = this.historyFocusIndex !== undefined ? this.historyFocusIndex : (this.currentLine || 0);
    }
  },

  onHistoryTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cy = t.pageY || t.clientY || 0;
      var dy = cy - this._hStartY;
      var maxIdx = this.currentLine || 0;
      // 手指向下拉（dy > 0）翻看较早句子，向上推（dy < 0）查看更新句子
      var steps = Math.round(dy / 30);
      var newFocus = this._hStartFocus - steps;
      if (newFocus < 0) newFocus = 0;
      if (newFocus > maxIdx) newFocus = maxIdx;
      this.historyFocusIndex = newFocus;
    }
  },

  onHistoryTouchEnd: function () {},

  scrollHistoryUp: function () {
    var cur = this.historyFocusIndex !== undefined ? this.historyFocusIndex : (this.currentLine || 0);
    cur -= 2;
    if (cur < 0) cur = 0;
    this.historyFocusIndex = cur;
  },

  scrollHistoryDown: function () {
    var cur = this.historyFocusIndex !== undefined ? this.historyFocusIndex : (this.currentLine || 0);
    var maxIdx = this.currentLine || 0;
    cur += 2;
    if (cur > maxIdx) cur = maxIdx;
    this.historyFocusIndex = cur;
  },

  scrollHistoryToLatest: function () {
    this.historyFocusIndex = this.currentLine || 0;
  },

  playHistoryVoice: function (voice) {
    if (!voice) return;
    var G = getGal();
    if (G) {
      G.stopVoice();
      var voiceFile = voice.toLowerCase().indexOf('.ogg') >= 0 ? voice : voice + '.ogg';
      G.playVoice('/userdisk/SenrenBanka/voice/' + voiceFile, 1.0);
    }
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
      var data = getActiveScenario(this);
      var row = data[this.currentLine || 0];
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
    var data = getActiveScenario(this);
    var row = data[this.currentLine || 0] || [];
    var currentChapter = row[7] || getChapterByLine(this.currentLine);

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
    var data = getActiveScenario(this);
    var row = data[this.currentLine || 0] || [];
    var chapterTag = row[7] || getChapterByLine(this.currentLine);
    saveSlotRecord(slotNum, {
      scenario: this.currentScenario || 'main',
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
      this.currentScenario = data.scenario || 'main';
      this.currentScenarioData = null;
      this.currentLine = data.line;
      this.closeGameModal();
      this.applyCurrentLine(true);
    }
  },

  exitToTitle: function () {
    this.clearAutoTimer();
    if (this._voiceWatchTimer) {
      clearInterval(this._voiceWatchTimer);
      this._voiceWatchTimer = null;
    }
    this.bgmSuspendedForVoice = false;
    var G = getGal();
    if (G) {
      G.stopVoice();
      G.stopBgm();
    }
    this.modalType = '';
    this.confirmModal = null;
    this.zoomMode = false;
    this.skipMode = false;
    this.autoPlay = false;
    if (this.currentScenario && this.currentScenario.indexOf('after_') === 0) {
      this.view = 'afterstory';
      if (typeof this.initAfterStory === 'function') {
        this.initAfterStory();
      }
    } else {
      this.view = 'title';
      if (typeof this.initTitle === 'function') {
        this.initTitle();
      }
    }
  }
};

export function renderGame(vm, h) {
  var data = getActiveScenario(vm);
  var lineIdx = vm.currentLine || 0;
  var row = data[lineIdx] || [0, '', '……', null, '画面_黒', 'bgm01', null, 'CHAPTER 1-1'];
  var speaker = row[1];
  var text = row[2];
  var bg = row[4];
  var bgSrc = (!bg || bg === '画面_黒') ? '' : 'file:///userdisk/SenrenBanka/bg/' + bg + '.png';

  // 舞台区立绘与差分表情解析（全角色多级容错）
  var charInfo = row[6];
  var charSrc = resolveCharacterSprite(charInfo);

  var speakerDisplay = speaker ? '【' + speaker + '】' : '【独 白】';
  var isNarration = !speaker;
  var currentChapter = row[7] || getChapterByLine(lineIdx);
  var progressStr = (lineIdx + 1) + ' / ' + data.length;

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
            h('text', {
              staticStyle: S('game-sub-zoom-text'),
              on: { click: function () { vm.toggleZoom(); } }
            }, '轻触特写')
          ]),
          h('div', {
            staticStyle: S('game-sub-zoom-tag'),
            on: {
              click: function () {
                vm.openHistoryModal();
              }
            }
          }, [
            h('text', {
              staticStyle: S('game-sub-zoom-text'),
              on: { click: function () { vm.openHistoryModal(); } }
            }, '历史对话')
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
        h('text', {
          staticStyle: S('game-ctrl-btn-title'),
          on: { click: function () { vm.openGameModal('menu'); } }
        }, '≡ 菜单'),
        h('text', {
          staticStyle: S('game-ctrl-btn-sub'),
          on: { click: function () { vm.openGameModal('menu'); } }
        }, 'MENU')
      ])
    ])
  ];

  // 全屏特写模式（16:9等比 + 缩放 + 手势拖动，双翼式布局：左侧退出，右侧缩放重置）
  if (vm.zoomMode) {
    var z = GAME_ZOOM_LEVELS[vm.gameZoomIndex || 0];
    var gImgLeft = vm.gameImgPanX !== undefined ? vm.gameImgPanX : Math.round((664 - z.w) / 2);
    var gImgTop = vm.gameImgPanY !== undefined ? vm.gameImgPanY : Math.round((220 - z.h) / 2);

    children.push(
      h('div', { staticStyle: S('game-zoom-overlay') }, [
        // 左翼控制栏 (宽 68px: 退出特写)
        h('div', { staticStyle: S('game-zoom-left-wing') }, [
          h('div', {
            staticStyle: S('game-zoom-wing-btn-exit'),
            on: { click: function () { vm.toggleZoom(); } }
          }, [
            h('text', {
              staticStyle: S('game-zoom-wing-btn-text'),
              on: { click: function () { vm.toggleZoom(); } }
            }, '退出\n特写')
          ])
        ]),

        // 中间大图视口 (宽 664px: 手势拖动与画布)
        h('div', {
          staticStyle: S('game-zoom-viewport'),
          on: {
            touchstart: function (e) { vm.onGameImgTouchStart(e); },
            touchmove: function (e) { vm.onGameImgTouchMove(e); },
            touchend: function () { vm.onGameImgTouchEnd(); }
          }
        }, [
          bgSrc ? h('image', {
            staticStyle: S('game-zoom-img', {
              left: gImgLeft + 'px',
              top: gImgTop + 'px',
              width: z.w + 'px',
              height: z.h + 'px'
            }),
            attrs: { src: bgSrc }
          }) : null,
          charSrc ? h('image', {
            staticStyle: S('game-zoom-char', {
              left: gImgLeft + 'px',
              top: gImgTop + 'px',
              width: z.w + 'px',
              height: z.h + 'px'
            }),
            attrs: { src: charSrc }
          }) : null,

          // 顶部场景标题
          h('div', { staticStyle: S('game-zoom-header') }, [
            h('text', { staticStyle: S('game-zoom-header-text') }, '◆ 舞台特写 · ' + currentChapter + ' ◆')
          ])
        ]),

        // 右翼控制栏 (宽 68px: 缩放与重置)
        h('div', { staticStyle: S('game-zoom-right-wing') }, [
          h('div', {
            staticStyle: S('game-zoom-wing-btn'),
            on: { click: function () { vm.zoomInGameImg(); } }
          }, [
            h('text', {
              staticStyle: S('game-zoom-wing-btn-text'),
              on: { click: function () { vm.zoomInGameImg(); } }
            }, '+ 放大')
          ]),
          h('div', { staticStyle: S('game-zoom-wing-badge') }, [
            h('text', { staticStyle: S('game-zoom-wing-badge-text') }, z.label)
          ]),
          h('div', {
            staticStyle: S('game-zoom-wing-btn'),
            on: { click: function () { vm.zoomOutGameImg(); } }
          }, [
            h('text', {
              staticStyle: S('game-zoom-wing-btn-text'),
              on: { click: function () { vm.zoomOutGameImg(); } }
            }, '- 缩小')
          ]),
          h('div', {
            staticStyle: S('game-zoom-wing-btn'),
            on: { click: function () { vm.resetGameZoom(); } }
          }, [
            h('text', {
              staticStyle: S('game-zoom-wing-btn-text'),
              on: { click: function () { vm.resetGameZoom(); } }
            }, '重置')
          ])
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
        on: { click: function () { vm.openHistoryModal(); } }
      }, [
        h('text', {
          staticStyle: S('game-menu-action-title'),
          on: { click: function () { vm.openHistoryModal(); } }
        }, '历史对话'),
        h('text', {
          staticStyle: S('game-menu-action-sub'),
          on: { click: function () { vm.openHistoryModal(); } }
        }, 'BACKLOG')
      ]),
      h('div', {
        staticStyle: S('game-menu-action-btn'),
        on: { click: function () { vm.openGameModal('save'); } }
      }, [
        h('text', {
          staticStyle: S('game-menu-action-title'),
          on: { click: function () { vm.openGameModal('save'); } }
        }, '保存进度'),
        h('text', {
          staticStyle: S('game-menu-action-sub'),
          on: { click: function () { vm.openGameModal('save'); } }
        }, 'SAVE GAME')
      ]),
      h('div', {
        staticStyle: S('game-menu-action-btn'),
        on: { click: function () { vm.openGameModal('load'); } }
      }, [
        h('text', {
          staticStyle: S('game-menu-action-title'),
          on: { click: function () { vm.openGameModal('load'); } }
        }, '读取进度'),
        h('text', {
          staticStyle: S('game-menu-action-sub'),
          on: { click: function () { vm.openGameModal('load'); } }
        }, 'LOAD GAME')
      ]),
      h('div', {
        staticStyle: S('game-menu-action-btn'),
        on: { click: function () { vm.exitToTitle(); } }
      }, [
        h('text', {
          staticStyle: S('game-menu-action-title'),
          on: { click: function () { vm.exitToTitle(); } }
        }, '返回标题'),
        h('text', {
          staticStyle: S('game-menu-action-sub'),
          on: { click: function () { vm.exitToTitle(); } }
        }, 'RETURN TITLE')
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
              h('text', {
                staticStyle: S('game-modal-close-text'),
                on: { click: function () { vm.closeGameModal(); } }
              }, '返回游戏')
            ])
          ]),
          modalContent
        ])
      ])
    );
  } else if (vm.modalType === 'history') {
    var curIdx = vm.currentLine || 0;
    var focusIdx = vm.historyFocusIndex !== undefined ? vm.historyFocusIndex : curIdx;
    if (focusIdx < 0) focusIdx = 0;
    if (focusIdx > curIdx) focusIdx = curIdx;

    // 视口展示以 focusIdx 为基准的 3 句，默认处于最新位置
    var startIdx = focusIdx - 2;
    if (startIdx < 0) startIdx = 0;
    var endIdx = startIdx + 2;
    if (endIdx > curIdx) {
      endIdx = curIdx;
      startIdx = Math.max(0, endIdx - 2);
    }

    var data = getActiveScenario(vm);
    var historyItems = [];
    for (var hIdx = startIdx; hIdx <= endIdx; hIdx++) {
      (function (idx) {
        var row = data[idx];
        if (!row) return;
        var isLatest = (idx === curIdx);
        var isFocus = (idx === focusIdx);
        var speaker = row[1];
        var text = row[2];
        var voice = row[3];

        var itemStyle = 'game-history-item';
        if (isLatest) {
          itemStyle += ' game-history-item-latest';
        }

        historyItems.push(
          h('div', {
            key: 'h_' + idx,
            staticStyle: S(itemStyle)
          }, [
            h('div', { staticStyle: S('game-history-main') }, [
              h('div', { staticStyle: S('game-history-item-head') }, [
                speaker ? h('text', { staticStyle: S('game-history-speaker') }, '【' + speaker + '】') : h('text', { staticStyle: S('game-history-speaker-narration') }, '【独 白】'),
                isLatest ? h('text', { staticStyle: S('game-history-latest-tag') }, ' 最新 ') : null,
                h('text', { staticStyle: S('game-history-line-num') }, '#' + (idx + 1))
              ]),
              h('text', { staticStyle: S('game-history-text') }, text || '')
            ]),
            voice ? h('div', {
              staticStyle: S('game-history-voice-btn'),
              on: { click: function () { vm.playHistoryVoice(voice); } }
            }, [
              h('text', {
                staticStyle: S('game-history-voice-text'),
                on: { click: function () { vm.playHistoryVoice(voice); } }
              }, '♪ 重听')
            ]) : null
          ])
        );
      })(hIdx);
    }

    var rangeStr = '共 ' + (curIdx + 1) + ' 句 · 正在浏览 第 ' + (startIdx + 1) + ' ~ ' + (endIdx + 1) + ' 句' + (focusIdx === curIdx ? ' [最新]' : '');

    children.push(
      h('div', { staticStyle: S('game-modal-mask') }, [
        h('div', { staticStyle: S('game-history-card') }, [
          // 顶部栏
          h('div', { staticStyle: S('game-history-header') }, [
            h('div', { staticStyle: S('game-history-title-box') }, [
              h('text', { staticStyle: S('game-history-title') }, '◆ 历史对话 BACKLOG ◆'),
              h('text', { staticStyle: S('game-history-sub') }, rangeStr)
            ]),
            h('div', {
              staticStyle: S('game-modal-close-btn'),
              on: { click: function () { vm.closeGameModal(); } }
            }, [
              h('text', {
                staticStyle: S('game-modal-close-text'),
                on: { click: function () { vm.closeGameModal(); } }
              }, '✕ 返回')
            ])
          ]),

          // 对话列表视口（支持手势滑动，默认定位在最新句）
          h('div', {
            staticStyle: S('game-history-viewport'),
            on: {
              touchstart: function (e) { vm.onHistoryTouchStart(e); },
              touchmove: function (e) { vm.onHistoryTouchMove(e); },
              touchend: function () { vm.onHistoryTouchEnd(); }
            }
          }, [
            h('div', { staticStyle: S('game-history-list') }, historyItems)
          ]),

          // 底部微调控制条
          h('div', { staticStyle: S('game-history-footer') }, [
            h('text', { staticStyle: S('game-history-tip') }, '手势上下滑动翻看历史 · 点击重听再听一次语音'),
            h('div', { staticStyle: S('game-history-navs') }, [
              h('div', {
                staticStyle: S('game-history-nav-btn'),
                on: { click: function () { vm.scrollHistoryUp(); } }
              }, [
                h('text', {
                  staticStyle: S('game-history-nav-text'),
                  on: { click: function () { vm.scrollHistoryUp(); } }
                }, '▲ 上翻')
              ]),
              h('div', {
                staticStyle: S('game-history-nav-btn'),
                on: { click: function () { vm.scrollHistoryDown(); } }
              }, [
                h('text', {
                  staticStyle: S('game-history-nav-text'),
                  on: { click: function () { vm.scrollHistoryDown(); } }
                }, '▼ 下翻')
              ]),
              h('div', {
                staticStyle: S('game-history-nav-btn'),
                on: { click: function () { vm.scrollHistoryToLatest(); } }
              }, [
                h('text', {
                  staticStyle: S('game-history-nav-text'),
                  on: { click: function () { vm.scrollHistoryToLatest(); } }
                }, '⤓ 最新')
              ])
            ])
          ])
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
