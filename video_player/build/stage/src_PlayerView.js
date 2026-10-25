// pages/player/player.js —— 播放视图逻辑（左侧控制栏 + 中间视频及自隐藏进度条 + 右侧信息与放缩控制）
import { S, fmtTime, getPlayer, parseNative, log } from './Common.js';

var HIDE_MS = 4000;      // 进度条浮层 4 秒无操作自动隐藏
var TICK_MS = 250;       // 播放器状态轮询间隔
var SEG_N = 18;          // 进度条分段格数（每格约 20px 宽，方便触控）
var STEP_MS = 15000;     // 快进快退步长 15s

// 放缩倍率序列（等比缩放，严格限制最高宽度不超过 960px）
var ZOOM_LEVELS = [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
var DEFAULT_ZOOM_IDX = 2; // 默认 1.0 (100%)

var STATE_TEXT = { loading: '加载中…', playing: '正在播放', paused: '已暂停', ended: '播放结束', error: '播放出错', idle: '' };

export var playerMethods = {
  // ---- 动态等比计算视频显示尺寸（适配各类比例视频，最高宽不超过 960） ----
  computeDimensions: function () {
    var it = this.cur || {};
    var origW = it.width || 0;
    var origH = it.height || 0;
    var ratio = 16 / 9; // 默认 16:9 比例
    if (origW > 0 && origH > 0) {
      ratio = origW / origH;
    }

    // 物理基准尺寸：物理满高 266px，根据原片比例算出基准宽，上限 960px
    var baseW = Math.min(960, Math.round(266 * ratio));
    var baseH = Math.round(baseW / ratio);

    var scale = ZOOM_LEVELS[this.zoomIdx] || 1.0;
    // 等比放缩宽度与高度（最高宽严格限制在 960px 以内）
    var targetW = Math.min(960, Math.round(baseW * scale));
    var targetH = Math.round(targetW / ratio);

    // 保证宽高为偶数（有利于硬件解码管线）
    targetW = targetW & ~1;
    targetH = targetH & ~1;
    if (targetW < 120) targetW = 120;
    if (targetH < 80) targetH = 80;

    return { w: targetW, h: targetH, scale: scale, ratio: ratio };
  },

  // ---- 起播 / 退出 ----
  openItem: function (it) {
    this.cur = it;
    this.view = 'player';
    this.zoomIdx = DEFAULT_ZOOM_IDX; // 默认 100%
    this.state = 'loading';
    this.loading = true;
    this.started = false;
    this.errText = '';
    this.posMs = 0;
    this.durMs = (it && it.durationMs) || 0;
    this._pos = 0;
    this.controlsVisible = true; // 起播时显示进度条

    this.startPipeline(0);
    this.startTick();
    this.resetHide();
  },

  // 以当前计算出的等比尺寸启动 GStreamer 管道（无缝续播）
  startPipeline: function (fromMs) {
    var P = getPlayer();
    if (!P) { this.fail('缺少 player 原生模块'); return; }
    var it = this.cur;
    if (!it || !it.path) return;
    var uri = it.path.indexOf('file://') === 0 ? it.path : ('file://' + it.path);
    var dims = this.computeDimensions();
    var startMs = Math.max(0, Math.round(fromMs || 0));

    var r = null;
    try {
      // 传入计算好的真实宽高 dims.w, dims.h（不加 add-borders，杜绝 YUV 全零绿边）
      r = parseNative(P.open(uri, startMs, 0, 24, 1, 1, 0, 0, dims.w, dims.h));
    } catch (e) {
      this.fail('起播异常: ' + e);
      return;
    }
    log('open ' + uri + ' size=' + dims.w + 'x' + dims.h + ' scale=' + Math.round(dims.scale * 100) + '% -> ' + JSON.stringify(r));
    if (!r || r.ok === false) { this.fail((r && r.error) || '起播失败'); return; }
  },

  fail: function (msg) {
    this.state = 'error';
    this.loading = false;
    this.errText = msg;
    this.controlsVisible = true;
    this.clearHide();
  },

  backToList: function () {
    var P = getPlayer();
    this.stopTick();
    this.clearHide();
    try { if (P) P.stop(); } catch (e) { /* 忽略 */ }
    this.view = 'list';
    this.state = 'idle';
    this.cur = null;
    if (typeof this.loadDirectory === 'function') {
      this.loadDirectory(this.currentDir);
    }
  },

  // ---- 画面真正的等比放缩功能 ----
  zoomIn: function () {
    if (this.zoomIdx < ZOOM_LEVELS.length - 1) {
      this.zoomIdx++;
      this.applyCurrentZoom();
    }
  },
  zoomOut: function () {
    if (this.zoomIdx > 0) {
      this.zoomIdx--;
      this.applyCurrentZoom();
    }
  },
  applyCurrentZoom: function () {
    var current = this._pos || this.posMs || 0;
    var dims = this.computeDimensions();
    log('zoom change: ' + Math.round(dims.scale * 100) + '% (' + dims.w + 'x' + dims.h + ') at ' + current + 'ms');
    this.startPipeline(current);
    this.resetHide();
  },

  replay: function () {
    var P = getPlayer();
    if (!P) return;
    this.seekTo(0);
    P.resume();
    this.state = 'playing';
    this.resetHide();
  },

  // ---- 状态轮询 ----
  startTick: function () {
    var self = this;
    this.stopTick();
    this._tick = setInterval(function () { self.tick(); }, TICK_MS);
  },
  stopTick: function () {
    if (this._tick) { clearInterval(this._tick); this._tick = null; }
  },
  tick: function () {
    var P = getPlayer();
    if (!P || this.view !== 'player') return;
    var st = null;
    try { st = parseNative(P.status()); } catch (e) { st = null; }
    if (!st) return;
    if (st.state === 'error' || st.ok === false) {
      this.fail(st.error || '播放出错');
      return;
    }
    // 起播判定：frames > 0 且 state === 'playing'
    if (!this.started && st.frames > 0 && st.state === 'playing') {
      this.started = true;
      this.loading = false;
      this.resetHide();
    }
    // 动态同步原生片源宽高（如果此前未录入）
    if (this.cur && (!this.cur.width || this.cur.width <= 0) && st.videoWidth > 0) {
      this.cur.width = st.videoWidth;
      this.cur.height = st.videoHeight;
    }
    this._pos = st.positionMs || 0;
    if (st.durationMs > 0 && st.durationMs !== this.durMs) this.durMs = st.durationMs;
    if (st.state !== this.state && st.state !== 'idle') this.state = st.state;
    if (st.state === 'ended') {
      this.controlsVisible = true;
      this.clearHide();
    }
    if (Math.floor(this._pos / 1000) !== Math.floor(this.posMs / 1000)) {
      this.posMs = this._pos;
    }
  },

  // ---- 中间进度条自动隐藏控制 ----
  onCenterTap: function () {
    this.controlsVisible = true;
    this.resetHide();
  },
  resetHide: function () {
    var self = this;
    this.clearHide();
    this._hide = setTimeout(function () {
      if (self.view === 'player' && self.state === 'playing' && self.started) {
        self.controlsVisible = false;
      }
    }, HIDE_MS);
  },
  clearHide: function () {
    if (this._hide) { clearTimeout(this._hide); this._hide = null; }
  },

  // ---- 播放与跳转控制 ----
  togglePlay: function () {
    var P = getPlayer();
    if (!P) return;
    if (this.state === 'ended') {
      this.seekTo(0);
      P.resume();
      this.state = 'playing';
      this.resetHide();
    } else if (this.state === 'playing') {
      P.pause();
      this.state = 'paused';
      this.controlsVisible = true;
      this.clearHide();
    } else if (this.state === 'paused') {
      P.resume();
      this.state = 'playing';
      this.resetHide();
    }
  },
  seekTo: function (ms) {
    var P = getPlayer();
    if (!P) return;
    var t = Math.max(0, Math.round(ms));
    if (this.durMs > 0 && t > this.durMs) t = this.durMs;
    P.seek(t);
    this._pos = t;
    this.posMs = t;
    if (this.state === 'ended') this.state = 'playing';
    this.resetHide();
  },
  seekRel: function (d) {
    this.seekTo((this._pos || this.posMs) + d);
  },
  seekRatio: function (r) {
    if (this.durMs > 0) this.seekTo(r * this.durMs);
  },
};

export function renderPlayer(vm, h) {
  var ratio = vm.durMs > 0 ? Math.min(1, vm.posMs / vm.durMs) : 0;
  var filled = Math.round(ratio * SEG_N);
  var zoomText = Math.round((ZOOM_LEVELS[vm.zoomIdx] || 1.0) * 100) + '%';

  // ---- 进度槽单元（触控区域加大，方便点击） ----
  var segs = [];
  for (var i = 0; i < SEG_N; i++) {
    segs.push((function (idx) {
      return h('div', {
        key: 's' + idx,
        staticStyle: S('seg-cell'),
        on: { click: function () { vm.seekRatio((idx + 0.5) / SEG_N); } },
      }, [
        h('div', { staticStyle: S('seg-fill', idx < filled ? { backgroundColor: '#58a6ff' } : null) }),
      ]);
    })(i));
  }

  // ---- 1. 左侧大按钮控制面板（宽 156px，高 220px） ----
  var leftPanel = h('div', { staticStyle: S('side-left') }, [
    h('div', { staticStyle: S('btn-back'), on: { click: function () { vm.backToList(); } } }, [
      h('text', { staticStyle: S('btn-back-text') }, '‹ 返回列表'),
    ]),
    h('div', { staticStyle: S('btn-primary'), on: { click: function () { vm.togglePlay(); } } }, [
      h('text', { staticStyle: S('btn-primary-text') }, vm.state === 'playing' ? '❚❚ 暂停' : '▶ 播放'),
    ]),
    h('div', { staticStyle: S('row-dual') }, [
      h('div', { staticStyle: S('btn-half'), on: { click: function () { vm.seekRel(-STEP_MS); } } }, [
        h('text', { staticStyle: S('btn-half-text') }, '-15s'),
      ]),
      h('div', { staticStyle: S('btn-half'), on: { click: function () { vm.seekRel(STEP_MS); } } }, [
        h('text', { staticStyle: S('btn-half-text') }, '+15s'),
      ]),
    ]),
    h('text', { staticStyle: S('time-display') }, fmtTime(vm.posMs) + ' / ' + fmtTime(vm.durMs)),
    h('text', { staticStyle: S('state-badge') }, STATE_TEXT[vm.state] || ''),
  ]);

  // ---- 2. 中间视频透视与自隐藏进度条区域（宽 488px，高 220px） ----
  var centerChildren = [
    h('div', { staticStyle: S('center-touch'), on: { click: function () { vm.onCenterTap(); } } }),
  ];

  if (vm.errText) {
    centerChildren.push(h('text', { staticStyle: S('center-tip', { color: '#f85149' }) }, vm.errText));
  } else if (vm.loading) {
    centerChildren.push(h('text', { staticStyle: S('center-tip') }, '正在加载视频…'));
  }

  // 进度条：一段时间不点击自动隐藏（controlsVisible = false 时不渲染浮层）
  if (vm.controlsVisible) {
    centerChildren.push(h('div', { staticStyle: S('floating-bar') }, [
      h('div', { staticStyle: S('seek-track-wide') }, segs),
      h('text', { staticStyle: S('floating-time') }, fmtTime(vm.posMs)),
    ]));
  }

  var centerArea = h('div', { staticStyle: S('center-viewport') }, centerChildren);

  // ---- 3. 右侧信息与直观放缩控制面板（宽 156px，高 220px） ----
  var rightPanel = h('div', { staticStyle: S('side-right') }, [
    h('text', { staticStyle: S('video-info-name') }, vm.cur ? vm.cur.name : ''),
    h('div', { staticStyle: S('btn-zoom'), on: { click: function () { vm.zoomIn(); } } }, [
      h('text', { staticStyle: S('btn-zoom-text') }, '➕ 放大画面'),
    ]),
    h('div', { staticStyle: S('btn-zoom'), on: { click: function () { vm.zoomOut(); } } }, [
      h('text', { staticStyle: S('btn-zoom-text') }, '➖ 缩小画面'),
    ]),
    h('text', { staticStyle: S('zoom-level-text') }, '当前画面: ' + zoomText),
    h('div', { staticStyle: S('btn-action'), on: { click: function () { vm.replay(); } } }, [
      h('text', { staticStyle: S('btn-action-text') }, '↺ 从头重播'),
    ]),
  ]);

  return h('div', { staticStyle: S('player-root') }, [leftPanel, centerArea, rightPanel]);
}
