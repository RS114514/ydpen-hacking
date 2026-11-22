// pages/game/game.js —— 超宽带鱼屏 390+322+88 分栏视觉小说主引擎
import { S, getGal, log, getChapterByLine } from '../../common.js';
import {
  readAllSaves,
  writeAllSaves,
  saveSlotRecord,
  loadSlotRecord,
  getNowDateStr,
  pushBacklog,
  readSettings
} from '../../storage.js';
import { chapter_all } from '../../data/chapter_all.js';
import { after_yoshino } from '../../data/after_yoshino.js';
import { after_mako } from '../../data/after_mako.js';
import { after_murasame } from '../../data/after_murasame.js';
import { after_rena } from '../../data/after_rena.js';
import { after_koharu } from '../../data/after_koharu.js';
import { after_roka } from '../../data/after_roka.js';
import { scn_yoshino } from '../../data/scn_yoshino.js';
import { scn_mako } from '../../data/scn_mako.js';
import { scn_murasame } from '../../data/scn_murasame.js';
import { scn_rena } from '../../data/scn_rena.js';
import { scn_koharu } from '../../data/scn_koharu.js';
import { scn_roka } from '../../data/scn_roka.js';
import { flowchart_data, choices as FLOW_CHOICES } from '../../data/flowchart_data.js';
import { choices_all } from '../../data/choices_all.js';
import { fx_events } from '../../data/fx_events.js';

var FLOW_NODE_MAP = {};
for (var flowNodeIndex = 0; flowNodeIndex < flowchart_data.nodes.length; flowNodeIndex++) {
  FLOW_NODE_MAP[flowchart_data.nodes[flowNodeIndex].id] = flowchart_data.nodes[flowNodeIndex];
}

// 共通线选择支仅属于 main 剧本：个人线数据行号会与共通线大量重合，
// 若不加场景判定，进入个人线后会在相同行号误弹共通选择支。
var CHOICE_BY_SCENARIO = {};
for (var choiceEntryIndex = 0; choiceEntryIndex < choices_all.length; choiceEntryIndex++) {
  var choiceEntry = choices_all[choiceEntryIndex];
  var choiceScenario = choiceEntry.scenario || 'main';
  if (!CHOICE_BY_SCENARIO[choiceScenario]) CHOICE_BY_SCENARIO[choiceScenario] = {};
  CHOICE_BY_SCENARIO[choiceScenario][choiceEntry.line] = choiceEntry;
}

function findChoiceForLine(line, scenario) {
  var key = scenario || 'main';
  var byLine = CHOICE_BY_SCENARIO[key];
  if (byLine && byLine[line]) return byLine[line];
  // 兜底：旧 flowchart 的共通选择（正常路径由 choices_all 命中）
  if (key === 'main') {
    for (var i = 0; i < FLOW_CHOICES.length; i++) {
      if (FLOW_CHOICES[i].targetLine === line) return FLOW_CHOICES[i];
    }
  }
  return null;
}

function findSubRouteChoice(vm, line) {
  if (!vm || vm.currentScenario !== 'route_koharu' || line !== SUB_SELECT_LINE) return null;
  if (vm.choiceSelections && vm.choiceSelections['s507*sub_part_7_sel']) return null;
  var rows = SCENARIOS.route_koharu;
  return {
    id: 's507*sub_part_7_sel',
    prompt: rows && rows[SUB_SELECT_LINE - 1] ? rows[SUB_SELECT_LINE - 1][2] : '请选择',
    options: [
      {
        index: 1,
        text: '小春的笑容',
        targetLine: 2727,
        flagGain: { flag: 'koh', points: 1 },
        skipAfterLine: 2736,
        skipToLine: 2754
      },
      {
        index: 2,
        text: '芦花姐的笑容',
        targetLine: 2737,
        flagGain: { flag: 'rok', points: 1 },
        skipAfterLine: 2753,
        skipToLine: 2925
      }
    ]
  };
}

function resolveChoiceOptionLine(option) {
  if (!option) return null;
  if (typeof option.targetLine === 'number') return option.targetLine;
  var target = FLOW_NODE_MAP[option.targetNode];
  return target && typeof target.targetLine === 'number' ? target.targetLine : null;
}

var SCENARIOS = {
  main: chapter_all,
  after_yoshino: after_yoshino,
  after_mako: after_mako,
  after_murasame: after_murasame,
  after_rena: after_rena,
  after_koharu: after_koharu,
  after_roka: after_roka,
  route_yoshino: scn_yoshino,
  route_mako: scn_mako,
  route_murasame: scn_murasame,
  route_rena: scn_rena,
  route_koharu: scn_koharu,
  route_roka: scn_roka
};

// 原版共通线三处分歧点（数值与剧本数组的 0 基行号一致）
// 8435 句后：len == 2 -> 蕾娜线；9104 句后：yos == 2 -> 芳乃线，否则 mak == 2 -> 茉子线；
// 9139 句后：mur == 2 -> 丛雨线，否则 sub == 2 且已有通关记录 -> 小春/芦花支线。
var ROUTE_BRANCH_RENA_LINE = 8435;
var ROUTE_BRANCH_YOSHINO_MAKO_LINE = 9104;
var ROUTE_BRANCH_MURASAME_SUB_LINE = 9139;
var SUB_SELECT_LINE = 2727;
var SUB_SELECT_END_LINE = 3177;

// 线路通关后写入 settings.clearedRoutes 的解锁键（与日后谈入口的 key 对齐）
var ROUTE_CLEAR_KEYS = {
  route_yoshino: 'yoshino',
  route_mako: 'mako',
  route_murasame: 'murasame',
  route_rena: 'rena',
  route_koharu: 'koharu',
  route_roka: 'roka'
};

// 把 clearedRoutes 回写到 storage.readSettings 使用的同一 settings.json 路径，
// 保留平铺路径回退，确保标题页与日后谈入口都能读到最新解锁状态。
function persistClearedRoutes(routes) {
  var settings = readSettings() || {};
  var merged = Object.assign({}, settings, { clearedRoutes: routes });
  var G = getGal();
  if (!G || typeof G.writeText !== 'function') return false;
  try {
    var text = JSON.stringify(merged);
    var gameId = merged.gameId || 'senren_banka';
    var ok = G.writeText('/userdisk/gal_data/' + gameId + '/settings.json', text);
    if (!ok) {
      ok = G.writeText('/userdisk/gal_data/' + gameId + '_settings.json', text);
    }
    return !!ok;
  } catch (e) {
    log('persistClearedRoutes error: ' + e);
    return false;
  }
}

var GAME_ZOOM_LEVELS = [
  { scale: 1.0, w: 391, h: 220, label: '1.0x' },
  { scale: 1.5, w: 587, h: 330, label: '1.5x' },
  { scale: 2.0, w: 782, h: 440, label: '2.0x' },
  { scale: 2.5, w: 978, h: 550, label: '2.5x' }
];

var DIALOG_FOOTER_TAP_GUARD_MS = 350;

function markFooterTap(vm) {
  vm._footerTapTs = Date.now();
}

function shouldSkipDialogAdvance(vm) {
  var ts = vm._footerTapTs || 0;
  if (!ts) return false;
  vm._footerTapTs = 0;
  return Date.now() - ts < DIALOG_FOOTER_TAP_GUARD_MS;
}

// 读取持久化音频设置：关闭开关则禁止播放，音量强制归一到 0..1
function getBgmPlaybackSettings() {
  var settings = readSettings() || {};
  var volume = typeof settings.bgmVolume === 'number' && isFinite(settings.bgmVolume)
    ? settings.bgmVolume
    : 0.8;
  if (volume < 0) volume = 0;
  if (volume > 1) volume = 1;
  return {
    enabled: settings.bgmEnabled !== false,
    volume: volume
  };
}

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
  if (c === '祟り神') {
    return charInfo.file ? 'file:///userdisk/SenrenBanka/fg/祟り神.png' : '';
  }

  var maxFaces = {
    '玄十郎': 19,
    '茉子': 20,
    '丛雨': 20,
    '蕾娜': 20,
    '小春': 20,
    '芦花': 20,
    '芳乃': 20
  };

  // 设备端实际存在的服装集合；缺失差分回退到私服，避免空白立绘
  var availableDresses = {
    '芳乃': ['制服', '巫女服', '私服', '舞服'],
    '茉子': ['制服', '忍者', '洋装', '私服'],
    '丛雨': ['制服', '寝間着', '洋装', '私服'],
    '蕾娜': ['仲居服', '制服', '和装', '私服'],
    '小春': ['仕事着', '制服', '私服'],
    '芦花': ['仕事着', '私服'],
    '玄十郎': ['剣道', '私服']
  };

  var maxF = maxFaces[c];
  if (!maxF) return ''; // 非核心配角不展示舞台全身立绘

  var d = charInfo.dress || '私服';
  d = d.replace('寝间着', '寝間着').replace('剑道', '剣道');
  var earVariant = false;
  var earMatch = d.match(/^(.*?)(耳|口)$/);
  if (earMatch) {
    d = earMatch[1];
    earVariant = true;
  }
  var dresses = availableDresses[c] || [];
  if (dresses.length && dresses.indexOf(d) < 0) {
    d = '私服';
  }
  var f = charInfo.face || '01';
  var fNum = parseInt(f, 10);
  if (isNaN(fNum) || fNum <= 0) fNum = 1;
  var mappedNum = ((fNum - 1) % maxF) + 1;
  var mappedFace = mappedNum < 10 ? '0' + mappedNum : '' + mappedNum;

  // 默认使用计算得出的立绘文件名；耳/口差分对应 _NNh 资源
  return 'file:///userdisk/SenrenBanka/fg/' + c + '_' + d + '_' + mappedFace + (earVariant ? 'h' : '') + '.png';
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
    this.currentBgm = '';
    this.bgmSuspendedForVoice = false;
    this.activeChoice = null;
    this.choiceNotice = '';
    this.menuNotice = '';
    this._routeSkipAfterLine = null;
    this._routeSkipToLine = null;
    this._routeSkipScenario = null;
    this._routeSkips = [];
    this.normalEnd = false;
    this._fxAnimTimer = null;
    this._fxAnim = null;
    this._lastFxBg = undefined;
    this.fxWhite = 0;
    this.fxBlack = 0;
    this.fxShakeX = 0;
    this.fxShakeY = 0;
    this.fxOverlaySrc = '';
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

    var pendingChoice = findChoiceForLine(this.currentLine || 0, this.currentScenario) ||
      findSubRouteChoice(this, this.currentLine || 0);
    if (pendingChoice && (!this.choiceSelections || !this.choiceSelections[pendingChoice.id])) {
      if (!pendingChoice.prompt) {
        var promptRow = data[(pendingChoice.line || this.currentLine || 0) - 1];
        pendingChoice.prompt = promptRow ? promptRow[2] : '请选择';
      }
      this.activeChoice = pendingChoice;
      this.autoPlay = false;
      this.skipMode = false;
      this.hasVoice = false;
      this.clearAutoTimer();
      if (this._voiceWatchTimer) {
        clearInterval(this._voiceWatchTimer);
        this._voiceWatchTimer = null;
      }
      var choiceGal = getGal();
      if (choiceGal) choiceGal.stopVoice();
      this.clearFx();
      return;
    }
    this.activeChoice = null;
    this.runLineFx(this.currentLine || 0, row);

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
          var bgmSettings = getBgmPlaybackSettings();
          if (bgmSettings.enabled) {
            var bgmFile = bgm.toLowerCase().indexOf('.opus') >= 0 ? bgm : bgm + '.opus';
            G.playBgm('/userdisk/SenrenBanka/bgm/' + bgmFile, true, bgmSettings.volume);
          }
        } else if (this.bgmSuspendedForVoice && this.currentBgm) {
          this.bgmSuspendedForVoice = false;
          var resumeSettings = getBgmPlaybackSettings();
          if (resumeSettings.enabled) {
            var curBgmFile = this.currentBgm.toLowerCase().indexOf('.opus') >= 0 ? this.currentBgm : this.currentBgm + '.opus';
            G.playBgm('/userdisk/SenrenBanka/bgm/' + curBgmFile, true, resumeSettings.volume);
          }
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
        self.onVoicePlaybackEnded();
      } else if (checkCount > 300) {
        clearInterval(self._voiceWatchTimer);
        self._voiceWatchTimer = null;
      }
    }, 200);
  },

  onVoicePlaybackEnded: function () {
    if (this.bgmSuspendedForVoice && this.currentBgm && this.view === 'game') {
      this.bgmSuspendedForVoice = false;
      var G = getGal();
      var playback = getBgmPlaybackSettings();
      if (G && playback.enabled) {
        var bgmFile = this.currentBgm.toLowerCase().indexOf('.opus') >= 0
          ? this.currentBgm
          : this.currentBgm + '.opus';
        G.playBgm('/userdisk/SenrenBanka/bgm/' + bgmFile, true, playback.volume);
      }
    }
    if (this.autoPlay && this.view === 'game' && !this.modalType &&
        !this.confirmModal && !this.activeChoice) {
      var self = this;
      this.clearAutoTimer();
      this.autoTimer = setTimeout(function () {
        if (self.autoPlay && self.view === 'game' && !self.modalType &&
            !self.confirmModal && !self.activeChoice) {
          self.nextLine();
        }
      }, 300);
    }
  },

  scheduleAutoNext: function (text, voice) {
    this.clearAutoTimer();
    if (voice) return;
    var self = this;
    this.autoTimer = setTimeout(function () {
      if (self.autoPlay && self.view === 'game' && !self.modalType &&
          !self.confirmModal && !self.activeChoice) {
        self.nextLine();
      }
    }, 5000);
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

  clearFxTimers: function () {
    if (this._fxAnimTimer) {
      clearInterval(this._fxAnimTimer);
      this._fxAnimTimer = null;
    }
    this._fxAnim = null;
  },

  clearFx: function () {
    this.clearFxTimers();
    this.fxWhite = 0;
    this.fxBlack = 0;
    this.fxShakeX = 0;
    this.fxShakeY = 0;
    this.fxOverlaySrc = '';
  },

  clearTransientFx: function () {
    this.clearFxTimers();
    this.fxWhite = 0;
    this.fxShakeX = 0;
    this.fxShakeY = 0;
    this.fxOverlaySrc = '';
  },

  fxTicks: function (ms) {
    var value = Number(ms);
    if (!isFinite(value) || value <= 0) value = 240;
    return Math.max(1, Math.ceil(value / 33));
  },

  tickFx: function () {
    var a = this._fxAnim;
    if (!a) {
      this.clearFxTimers();
      return;
    }
    if (!isFinite(a.end) || a.end < 0) {
      this.clearFxTimers();
      this.fxWhite = 0;
      this.fxShakeX = 0;
      this.fxShakeY = 0;
      this.fxOverlaySrc = '';
      return;
    }
    a.tick++;
    var black = a.black;
    var white = a.white;
    for (var i = 0; i < a.segments.length; i++) {
      var seg = a.segments[i];
      if (a.tick >= seg.end) {
        if (seg.field === 'fxBlack') black = seg.to;
        else white = seg.to;
      } else if (a.tick > seg.start) {
        var p = (a.tick - seg.start) / (seg.end - seg.start);
        var v = seg.from + (seg.to - seg.from) * p;
        if (seg.field === 'fxBlack') black = v;
        else white = v;
      }
    }
    a.black = black;
    a.white = white;
    this.fxBlack = black;
    this.fxWhite = white;

    if (a.shake) {
      if (a.tick >= a.shake.end) {
        this.fxShakeX = 0;
        this.fxShakeY = 0;
        a.shake = null;
      } else {
        var ms = (a.tick - a.shake.start) * 33;
        var total = (a.shake.end - a.shake.start) * 33;
        var decay = total > 0 ? 1 - ms / total : 0;
        var amp = a.shake.amp || 8;
        var cycle = a.shake.cycle || 200;
        var sv = amp * decay * Math.sin(2 * Math.PI * ms / cycle);
        this.fxShakeX = Math.round(sv);
        this.fxShakeY = Math.round(sv * 0.35);
      }
    }

    if (a.overlay) {
      if (a.tick >= a.overlay.end) {
        this.fxOverlaySrc = '';
        a.overlay = null;
      } else {
        this.fxOverlaySrc = a.overlay.src;
      }
    }

    if (a.tick >= a.end && !a.shake && !a.overlay) {
      this.fxBlack = a.black;
      this.fxWhite = a.white;
      this.fxShakeX = 0;
      this.fxShakeY = 0;
      this.fxOverlaySrc = '';
      this.clearFxTimers();
    }
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  runLineFx: function (line, row) {
    this.clearTransientFx();
    var byScenario = fx_events && fx_events[this.currentScenario || 'main'];
    var evs = byScenario && byScenario[line];
    var self = this;
    var anim = { tick: 0, end: 0, black: this.fxBlack || 0, white: 0, segments: [], shake: null, overlay: null };
    var lastBlack = anim.black;
    var lastWhite = 0;

    function pushBlack(to, ms) {
      var value = Number(ms);
      if (!isFinite(value) || value <= 0) {
        lastBlack = to;
        anim.black = to;
        return;
      }
      var t = self.fxTicks(value);
      var start = anim.end;
      anim.segments.push({ field: 'fxBlack', from: lastBlack, to: to, start: start, end: start + t });
      lastBlack = to;
      anim.end = start + t;
    }

    function pushWhite(to, ms) {
      var value = Number(ms);
      if (!isFinite(value) || value <= 0) {
        lastWhite = to;
        anim.white = to;
        return;
      }
      var t = self.fxTicks(value);
      var start = anim.end;
      anim.segments.push({ field: 'fxWhite', from: lastWhite, to: to, start: start, end: start + t });
      lastWhite = to;
      anim.end = start + t;
    }

    var blackIn = false, blackOut = false, blackDur = 0;
    var transition = false, transitionDur = 0;
    var white = false, whiteDur = 0;
    var shakes = [], overlays = [];
    if (evs) {
      for (var i = 0; i < evs.length; i++) {
        var e = evs[i];
        var code = e[0];
        if (code === 'f') {
          blackOut = true;
          blackDur = Math.max(blackDur, e[1] || 0);
        } else if (code === 'F') {
          blackIn = true;
          blackDur = Math.max(blackDur, e[1] || 0);
        } else if (code === 'W') {
          white = true;
          whiteDur = Math.max(whiteDur, e[1] || 0);
        } else if (code === 'T') {
          transition = true;
          transitionDur = Math.max(transitionDur, e[3] || 0);
        } else if (code === 'S') {
          shakes.push(e);
        } else if (code === 'M') {
          white = true;
          whiteDur = Math.max(whiteDur, 120);
          shakes.push(['M', 12, 200, 350]);
          if (e[1] === '祟り神') overlays.push('file:///userdisk/SenrenBanka/fg/祟り神.png');
        } else if (code === 'G') {
          shakes.push(['G', 4, 100, 200]);
        } else if (code === 'O') {
          var src = this.fxOverlayPath(e[1]);
          if (src) overlays.push(src);
        }
      }
    }

    var visible = !!(row && (row[8] || (row[4] && row[4] !== '画面_黒' && row[4] !== '画面_白')));
    var bt, bh;
    if (blackIn && blackOut) {
      bt = this.fxTicks(blackDur || 300);
      bh = Math.max(1, Math.floor(bt / 2));
      pushBlack(1, bh * 33);
      pushBlack(0, (bt - bh) * 33);
    } else if (blackOut) {
      pushBlack(0, blackDur || 260);
    } else if (blackIn) {
      if (visible) {
        bt = this.fxTicks(blackDur || 300);
        bh = Math.max(1, Math.floor(bt / 2));
        pushBlack(1, bh * 33);
        pushBlack(0, (bt - bh) * 33);
      } else {
        pushBlack(1, blackDur || 260);
      }
    } else if (transition) {
      bt = this.fxTicks(transitionDur || 300);
      bh = Math.max(1, Math.floor(bt / 2));
      pushBlack(1, bh * 33);
      pushBlack(0, (bt - bh) * 33);
    } else if (row && row[4] === '画面_黒' && !row[8]) {
      lastBlack = 1;
      anim.black = 1;
    } else if (lastBlack > 0) {
      lastBlack = 0;
      anim.black = 0;
    }

    if (white) {
      bt = this.fxTicks(whiteDur || 240);
      bh = Math.max(1, Math.floor(bt / 2));
      pushWhite(1, bh * 33);
      pushWhite(0, (bt - bh) * 33);
    }

    if (shakes.length) {
      var s = shakes[0];
      var shakeEnd = this.fxTicks(s[3] || 300);
      anim.shake = { start: 0, end: shakeEnd, amp: s[1] || 8, cycle: s[2] || 200 };
      anim.end = Math.max(anim.end, shakeEnd);
    }
    if (overlays.length) {
      var overlayEnd = this.fxTicks(500);
      anim.overlay = { start: 0, end: overlayEnd, src: overlays[0] };
      anim.end = Math.max(anim.end, overlayEnd);
    }

    this.fxBlack = anim.black;
    this.fxWhite = 0;
    if (anim.end > 0 || anim.shake || anim.overlay) {
      this._fxAnim = anim;
      this._fxAnimTimer = setInterval(function () { self.tickFx(); }, 33);
      this.tickFx();
    }
  },

  fxOverlayPath: function (kind) {
    if (!kind) return '';
    if (kind === 'cutin') return 'file:///userdisk/SenrenBanka/fx/cutin.png';
    if (kind === 'refrain') return 'file:///userdisk/SenrenBanka/fx/refrain.png';
    if (kind.indexOf('ef_') === 0) return 'file:///userdisk/SenrenBanka/fx/' + kind + '.png';
    return '';
  },

  // 共通线分支判定：仅在 main 场景、且刚好停在原版分歧句时生效
  resolveRouteBranchAt: function (line) {
    if (this.currentScenario && this.currentScenario !== 'main') return null;
    var flags = this.choiceFlags || {};
    if (line === ROUTE_BRANCH_RENA_LINE) {
      return flags.len === 2 ? 'route_rena' : null;
    }
    if (line === ROUTE_BRANCH_YOSHINO_MAKO_LINE) {
      if (flags.yos === 2) return 'route_yoshino';
      if (flags.mak === 2) return 'route_mako';
      return null;
    }
    if (line === ROUTE_BRANCH_MURASAME_SUB_LINE) {
      if (flags.mur === 2) return 'route_murasame';
      // TODO: 原始 507 选择支会在小春/芦花之间分流；本轮先让支线合成剧本
      // route_koharu 从第 0 句线性推进，不把内部分流写死成小春。
      if (flags.sub === 2 && this.hasAnyClearedRoute()) return 'route_koharu';
      return null;
    }
    return null;
  },

  hasAnyClearedRoute: function () {
    var settings = readSettings() || {};
    var cleared = settings.clearedRoutes;
    return !!(cleared && typeof cleared.length === 'number' && cleared.length > 0);
  },

  // 进入个人线：保留 choiceFlags / choiceSelections，从该线路第 0 句重新开始
  enterRoute: function (routeKey) {
    if (!routeKey || !SCENARIOS[routeKey]) return false;
    // 线路入口先释放声卡，避免上一场景 BGM 与线路首句语音争抢 ALSA 句柄
    var G = getGal();
    if (G && typeof G.stopBgm === 'function') G.stopBgm();
    this.currentScenario = routeKey;
    this.currentLine = 0;
    this.initGame(routeKey, 0);
    return true;
  },

  // 线路最后一句推进时记录通关，供日后谈解锁使用（去重）
  markRouteCleared: function () {
    var clearKey = ROUTE_CLEAR_KEYS[this.currentScenario];
    if (!clearKey) return false;
    var settings = readSettings() || {};
    var cleared = settings.clearedRoutes;
    if (!cleared || typeof cleared.length !== 'number') cleared = [];
    var next = [];
    for (var i = 0; i < cleared.length; i++) {
      if (next.indexOf(cleared[i]) < 0) next.push(cleared[i]);
    }
    if (next.indexOf(clearKey) < 0) next.push(clearKey);
    persistClearedRoutes(next);
    return true;
  },

  nextLine: function () {
    if (this.activeChoice || this.modalType || this.confirmModal) return;
    if (this.normalEnd) return;
    if (!this._routeSkips) this._routeSkips = [];
    if (this.zoomMode) {
      this.zoomMode = false;
      return;
    }
    // 小春线 508b（芦花专属 208 行）不属于小春路径，508a 结束直接进 509
    if (this.currentScenario === 'route_koharu' && this.currentLine === 2924 &&
        this.choiceFlags && this.choiceFlags.koh === 1) {
      this.currentLine = 3133;
      this.applyCurrentLine(true);
      return;
    }
    for (var skipIndex = this._routeSkips.length - 1; skipIndex >= 0; skipIndex--) {
      var pendingSkip = this._routeSkips[skipIndex];
      if (pendingSkip.afterLine === this.currentLine) {
        this._routeSkips.splice(skipIndex, 1);
        if (pendingSkip.scenario && this.enterRoute(pendingSkip.scenario)) return;
        if (typeof pendingSkip.toLine === 'number') {
          this.currentLine = pendingSkip.toLine;
          this.applyCurrentLine(true);
          return;
        }
      }
    }
    if (this.currentScenario === 'route_koharu' && this.currentLine === SUB_SELECT_END_LINE) {
      var chooseKoharu = !this.choiceFlags || this.choiceFlags.koh === 1 || this.choiceFlags.rok !== 1;
      this.currentLine = chooseKoharu ? 3178 : 3252;
      this._routeSkipAfterLine = chooseKoharu ? 3251 : 3338;
      this._routeSkipToLine = chooseKoharu ? 3339 : null;
      this._routeSkipScenario = chooseKoharu ? null : 'route_roka';
      this.applyCurrentLine(true);
      return;
    }
    if (this._routeSkipAfterLine === this.currentLine) {
      var skipScenario = this._routeSkipScenario;
      var skipTo = this._routeSkipToLine;
      this._routeSkipAfterLine = null;
      this._routeSkipToLine = null;
      this._routeSkipScenario = null;
      if (skipScenario && this.enterRoute(skipScenario)) return;
      if (typeof skipTo === 'number') {
        this.currentLine = skipTo;
        this.applyCurrentLine(true);
        return;
      }
    }
    var branch = this.resolveRouteBranchAt(this.currentLine || 0);
    if (branch && this.enterRoute(branch)) return;
    var data = getActiveScenario(this);
    if (this.currentLine < data.length - 1) {
      this.currentLine++;
      this.applyCurrentLine(true);
    } else if (this.currentScenario === 'main') {
      // NORMAL END：原版回到 *gameend_title；这里给 END 卡 + 返回标题，不写 clearedRoutes
      this.normalEnd = true;
      this.skipMode = false;
      this.autoPlay = false;
      this.clearAutoTimer();
      if (this._voiceWatchTimer) {
        clearInterval(this._voiceWatchTimer);
        this._voiceWatchTimer = null;
      }
      var endGal = getGal();
      if (endGal) {
        endGal.stopVoice();
        endGal.stopBgm();
      }
      this.currentBgm = '';
      this.bgmSuspendedForVoice = false;
      this.clearFx();
    } else {
      this.markRouteCleared();
      this.skipMode = false;
      this.autoPlay = false;
      this.openGameModal('menu');
    }
  },

  isChoiceSelected: function (id) {
    return !!(this.choiceSelections && id && this.choiceSelections[id]);
  },

  firstUnselectedChoiceLine: function (scenario, startLine) {
    var best = null;
    var byLine = CHOICE_BY_SCENARIO[scenario || 'main'];
    if (byLine) {
      var keys = Object.keys(byLine);
      for (var i = 0; i < keys.length; i++) {
        var choice = byLine[keys[i]];
        if (choice && typeof choice.line === 'number' && choice.line >= startLine &&
            !this.isChoiceSelected(choice.id)) {
          if (best === null || choice.line < best) best = choice.line;
        }
      }
    }
    if ((scenario || 'main') === 'main') {
      for (var j = 0; j < FLOW_CHOICES.length; j++) {
        var flowChoice = FLOW_CHOICES[j];
        if (typeof flowChoice.targetLine === 'number' && flowChoice.targetLine >= startLine &&
            !this.isChoiceSelected(flowChoice.id)) {
          if (best === null || flowChoice.targetLine < best) best = flowChoice.targetLine;
        }
      }
    }
    if ((scenario || 'main') === 'route_koharu' && SUB_SELECT_LINE >= startLine &&
        !this.isChoiceSelected('s507*sub_part_7_sel')) {
      if (best === null || SUB_SELECT_LINE < best) best = SUB_SELECT_LINE;
    }
    return best;
  },

  jumpToNextChoice: function () {
    var scenario = this.currentScenario || 'main';
    var line = this.currentLine || 0;
    this.menuNotice = '';
    if (scenario === 'route_koharu' && this.choiceFlags && this.choiceFlags.rok === 1 && line >= 2737) {
      var rokaLine = this.firstUnselectedChoiceLine('route_roka', 0);
      if (rokaLine !== null && this.enterRoute('route_roka')) {
        this.modalType = '';
        this.confirmModal = null;
        this.currentLine = rokaLine;
        this.rebuildChoiceSkips();
        this.applyCurrentLine(true);
        return true;
      }
    }
    var target = this.firstUnselectedChoiceLine(scenario, line + 1);
    if (target === null) {
      this.menuNotice = '后面没有可跳转的选择支';
      return false;
    }
    this.modalType = '';
    this.confirmModal = null;
    this.autoPlay = false;
    this.skipMode = false;
    this.clearAutoTimer();
    this.currentLine = target;
    this.rebuildChoiceSkips();
    this.applyCurrentLine(true);
    return true;
  },

  prevLine: function () {
    this.menuNotice = '';
    if (this.normalEnd) this.normalEnd = false;
    var line = this.currentLine || 0;
    if (line <= 0) {
      this.menuNotice = '已经是第一句';
      return false;
    }
    this.modalType = '';
    this.confirmModal = null;
    this.autoPlay = false;
    this.skipMode = false;
    this.clearAutoTimer();
    this.activeChoice = null;
    this.currentLine = line - 1;
    this.rebuildChoiceSkips();
    this.applyCurrentLine(false);
    return true;
  },

  rebuildChoiceSkips: function () {
    this._routeSkips = [];
    var line = this.currentLine || 0;
    if (this.currentScenario === 'route_koharu' && this.choiceSelections &&
        this.choiceSelections['s507*sub_part_7_sel']) {
      var subSel = this.choiceSelections['s507*sub_part_7_sel'];
      var subSkip = subSel === 1
        ? { afterLine: 2736, toLine: 2754 }
        : { afterLine: 2753, toLine: 2925 };
      var subStart = subSel === 1 ? 2727 : 2737;
      if (line >= subStart && line <= subSkip.afterLine) this._routeSkips.push(subSkip);
    }
    var byLine = CHOICE_BY_SCENARIO[this.currentScenario || 'main'];
    if (!byLine || !this.choiceSelections) return;
    var ids = Object.keys(byLine);
    for (var i = 0; i < ids.length; i++) {
      var choice = byLine[ids[i]];
      var selected = this.choiceSelections[choice.id];
      if (!selected) continue;
      var option = null;
      for (var j = 0; j < choice.options.length; j++) {
        if (choice.options[j].index === selected) { option = choice.options[j]; break; }
      }
      if (!option || typeof option.skipAfterLine !== 'number' || typeof option.skipToLine !== 'number') continue;
      if (line >= option.targetLine && line <= option.skipAfterLine) {
        this._routeSkips.push({ afterLine: option.skipAfterLine, toLine: option.skipToLine });
      }
    }
  },

  chooseChoice: function (option) {
    var choice = this.activeChoice;
    var targetLine = resolveChoiceOptionLine(option);
    if (!choice || !option || targetLine === null) {
      if (choice) this.choiceNotice = '该分支剧本尚未收录，暂时无法进入';
      return false;
    }
    if (!this.choiceSelections) this.choiceSelections = {};
    if (!this.choiceFlags) this.choiceFlags = {};
    var priorSelection = this.choiceSelections[choice.id];
    this.choiceSelections[choice.id] = option.index;
    if (priorSelection === undefined && option.flagGain && option.flagGain.flag && option.flagGain.points) {
      this.choiceFlags = Object.assign({}, this.choiceFlags);
      this.choiceFlags[option.flagGain.flag] =
        (this.choiceFlags[option.flagGain.flag] || 0) + option.flagGain.points;
    }
    this.activeChoice = null;
    this.choiceNotice = '';
    this.currentLine = targetLine;
    if (!this._routeSkips) this._routeSkips = [];
    if (typeof option.skipAfterLine === 'number' && typeof option.skipToLine === 'number') {
      // 用栈而不是单槽：嵌套选择（010 钓鱼 → yos/len 选择）必须先执行内层跳过
      this._routeSkips.push({ afterLine: option.skipAfterLine, toLine: option.skipToLine });
    } else if (typeof option.skipAfterLine === 'number' && option.skipToScenario) {
      this._routeSkips.push({ afterLine: option.skipAfterLine, scenario: option.skipToScenario });
    }
    this.applyCurrentLine(true);
    return true;
  },

  replayVoice: function () {
    if (this.activeChoice) return;
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
    if (this.activeChoice) return;
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
    if (this.activeChoice) return;
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
      character: row[6] || null,
      extra: {
        flags: this.choiceFlags || {},
        choices: this.choiceSelections || {}
      }
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
      this.choiceFlags = data.extra && data.extra.flags ? data.extra.flags : {};
      this.choiceSelections = data.extra && data.extra.choices ? data.extra.choices : {};
      this.rebuildChoiceSkips();
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
    this.normalEnd = false;
    this.skipMode = false;
    this.autoPlay = false;
    this.clearFx();
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
  var activeChoice = vm.activeChoice;
  var speaker = activeChoice ? '' : row[1];
  var text = activeChoice ? activeChoice.prompt : row[2];
  var bg = row[4];
  var cg = row[8] || '';
  var sd = row[9] || '';
  var bgSrc = cg
    ? 'file:///userdisk/SenrenBanka/cg/' + cg + '.png'
    : ((!bg || bg === '画面_黒') ? '' : 'file:///userdisk/SenrenBanka/bg/' + bg + '.png');
  var sdSrc = cg ? '' : (sd ? 'file:///userdisk/SenrenBanka/sd/' + sd.toUpperCase() + '.png' : '');

  // 舞台区立绘与差分表情解析（全角色多级容错）
  var charInfo = row[6];
  var charSrc = cg ? '' : resolveCharacterSprite(charInfo);
  // 柚子社 SD 场景：整张二头身画面替代正常立绘
  if (sdSrc) charSrc = '';

  var speakerDisplay = activeChoice ? '【请选择】' : (speaker ? '【' + speaker + '】' : '【独 白】');
  var isNarration = !speaker && !activeChoice;
  var currentChapter = row[7] || getChapterByLine(lineIdx);
  var progressStr = (lineIdx + 1) + ' / ' + data.length;

  var children = [
    // 1. 左侧画面舞台区（390px x 220px 纯净无遮挡，背景 + 角色立绘）
    h('div', {
      staticStyle: S('game-stage-pane', {
        transform: 'translate(' + (vm.fxShakeX || 0) + 'px,' + (vm.fxShakeY || 0) + 'px)'
      }),
      on: { click: function () { vm.toggleZoom(); } }
    }, [
      bgSrc ? h('image', {
        staticStyle: S('game-stage-img'),
        attrs: cg ? { src: bgSrc, resize: 'contain' } : { src: bgSrc }
      }) : null,
      sdSrc ? h('image', {
        staticStyle: S('game-stage-sd'),
        attrs: { src: sdSrc, resize: 'contain' }
      }) : null,
      charSrc ? h('image', {
        staticStyle: S('game-stage-char'),
        attrs: { src: charSrc, resize: 'contain' }
      }) : null,
      vm.fxOverlaySrc ? h('image', {
        staticStyle: S('game-fx-overlay'),
        attrs: { src: vm.fxOverlaySrc, resize: 'contain' }
      }) : null
    ]),

    // 2. 中间大字号剧情对话区（322px x 220px，点击推进）
    h('div', {
      staticStyle: S('game-dialog-pane'),
      on: {
        click: function () {
          if (shouldSkipDialogAdvance(vm)) return;
          vm.nextLine();
        }
      }
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
                markFooterTap(vm);
                vm.toggleZoom();
              }
            }
          }, [
            h('text', { staticStyle: S('game-sub-zoom-text') }, '轻触特写')
          ]),
          h('div', {
            staticStyle: S('game-sub-zoom-tag'),
            on: {
              click: function () {
                markFooterTap(vm);
                vm.openHistoryModal();
              }
            }
          }, [
            h('text', { staticStyle: S('game-sub-zoom-text') }, '历史对话')
          ]),
          vm.hasVoice ? h('text', { staticStyle: S('game-voice-playing-hint') }, '♪ 发声') : null
        ]),
        h('text', {
          staticStyle: S('game-dialog-tap-hint')
        }, activeChoice ? '请选择一项分支' : '轻触推进 ▼')
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

  var blackOpacity = Number(vm.fxBlack) || 0;
  if (blackOpacity < 0) blackOpacity = 0;
  if (blackOpacity > 1) blackOpacity = 1;
  if (blackOpacity > 0.001) {
    children.push(h('div', {
      staticStyle: S('game-fx-black', {
        backgroundColor: 'rgba(0,0,0,' + blackOpacity.toFixed(3) + ')'
      })
    }));
  }
  var whiteOpacity = Number(vm.fxWhite) || 0;
  if (whiteOpacity < 0) whiteOpacity = 0;
  if (whiteOpacity > 1) whiteOpacity = 1;
  if (whiteOpacity > 0.001) {
    children.push(h('div', {
      staticStyle: S('game-fx-white', {
        backgroundColor: 'rgba(255,255,255,' + whiteOpacity.toFixed(3) + ')'
      })
    }));
  }

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
            attrs: cg ? { src: bgSrc, resize: 'contain' } : { src: bgSrc }
          }) : null,
          sdSrc ? h('image', {
            staticStyle: S('game-zoom-sd', {
              left: gImgLeft + 'px',
              top: gImgTop + 'px',
              width: z.w + 'px',
              height: z.h + 'px'
            }),
            attrs: { src: sdSrc, resize: 'contain' }
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
    function menuBtn(title, sub, handler) {
      return h('div', {
        staticStyle: S('game-menu-action-btn'),
        on: { click: handler }
      }, [
        h('text', {
          staticStyle: S('game-menu-action-title'),
          on: { click: handler }
        }, title),
        h('text', {
          staticStyle: S('game-menu-action-sub'),
          on: { click: handler }
        }, sub)
      ]);
    }

    var modalContent = h('div', { staticStyle: S('game-menu-grid') }, [
      h('div', { staticStyle: S('game-menu-row') }, [
        menuBtn('回退上一句', 'PREV LINE', function () { vm.prevLine(); }),
        menuBtn('跳至选项', 'NEXT CHOICE', function () { vm.jumpToNextChoice(); }),
        menuBtn('历史对话', 'BACKLOG', function () { vm.openHistoryModal(); })
      ]),
      h('div', { staticStyle: S('game-menu-row') }, [
        menuBtn('保存进度', 'SAVE GAME', function () { vm.openGameModal('save'); }),
        menuBtn('读取进度', 'LOAD GAME', function () { vm.openGameModal('load'); }),
        menuBtn('返回标题', 'RETURN TITLE', function () { vm.exitToTitle(); })
      ]),
      h('text', { staticStyle: S('game-menu-notice') }, vm.menuNotice || ' ')
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

  if (vm.activeChoice) {
    var choiceOptions = [];
    for (var choiceIndex = 0; choiceIndex < vm.activeChoice.options.length; choiceIndex++) {
      (function (option) {
        var targetLine = resolveChoiceOptionLine(option);
        var enabled = targetLine !== null;
        choiceOptions.push(h('div', {
          staticStyle: S(enabled ? 'game-choice-option' : 'game-choice-option game-choice-option-disabled'),
          on: { click: function () { if (enabled) vm.chooseChoice(option); } }
        }, [
          h('text', { staticStyle: S('game-choice-option-index') }, option.index + '.'),
          h('text', { staticStyle: S('game-choice-option-text') }, option.text)
        ]));
      })(vm.activeChoice.options[choiceIndex]);
    }
    children.push(
      h('div', { staticStyle: S('game-choice-mask') }, [
        h('div', { staticStyle: S('game-choice-panel') }, [
          h('div', { staticStyle: S('game-choice-header') }, [
            h('text', { staticStyle: S('game-choice-title') }, '请选择接下来的行动'),
            h('text', { staticStyle: S('game-choice-notice') }, vm.choiceNotice || '轻触选项继续')
          ]),
          h('text', { staticStyle: S('game-choice-prompt') }, vm.activeChoice.prompt),
          h('div', { staticStyle: S('game-choice-options') }, choiceOptions)
        ])
      ])
    );
  }

  if (vm.normalEnd) {
    children.push(
      h('div', { staticStyle: S('game-normal-end') }, [
        h('text', { staticStyle: S('game-normal-end-kicker') }, '◆ 物语终章 ◆'),
        h('text', { staticStyle: S('game-normal-end-title') }, 'NORMAL END'),
        h('text', { staticStyle: S('game-normal-end-sub') }, '没有选择任何女主角，故事在穗织的日常中落幕。'),
        h('div', {
          staticStyle: S('game-normal-end-btn'),
          on: { click: function () { vm.exitToTitle(); } }
        }, [
          h('text', { staticStyle: S('game-normal-end-btn-text'), on: { click: function () { vm.exitToTitle(); } } }, '返回标题')
        ])
      ])
    );
  }

  return h('div', { staticStyle: S('game-root') }, children);
}
