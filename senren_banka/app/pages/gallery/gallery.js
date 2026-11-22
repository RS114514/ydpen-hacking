// pages/gallery/gallery.js —— 柚子社和风多合一鉴赏收藏馆（CG/音乐，横向滑动选择与大图手势交互）
import { S, log, getGal } from '../../common.js';
import { readSettings } from '../../storage.js';
import { gallery_cgs } from '../../data/gallery_cgs.js';
import { gallery_scenes } from '../../data/gallery_scenes.js';

// 全量 101 张 CG：先选女主/共通，再进该组网格
var CG_GROUPS = [
  { key: 'yoshino', name: '芳乃', ema: 'ema_12.jpg' },
  { key: 'mako', name: '茉子', ema: 'ema_13.jpg' },
  { key: 'murasame', name: '丛雨', ema: 'ema_14.jpg' },
  { key: 'rena', name: '蕾娜', ema: 'ema_06.jpg' },
  { key: 'koharu', name: '小春', ema: 'ema_09.jpg' },
  { key: 'roka', name: '芦花', ema: 'ema_01.jpg' },
  { key: 'common', name: '共通', ema: '' }
];

var CG_LIST = [];
for (var cgi = 0; cgi < gallery_cgs.length; cgi++) {
  var cgItem = gallery_cgs[cgi];
  cgItem.src = 'file:///userdisk/SenrenBanka/cg/' + cgItem.id + '.png';
  CG_LIST.push(cgItem);
}

var CG_GROUP_LISTS = {};
for (var cgg = 0; cgg < CG_GROUPS.length; cgg++) {
  var groupKey = CG_GROUPS[cgg].key;
  var grouped = [];
  for (var cgl = 0; cgl < CG_LIST.length; cgl++) {
    if (CG_LIST[cgl].group === groupKey) grouped.push(CG_LIST[cgl]);
  }
  for (var cgx = 0; cgx < grouped.length; cgx++) grouped[cgx].idx = cgx;
  CG_GROUP_LISTS[groupKey] = grouped;
}

// 原版「场景鉴赏」24 个场景：芳乃4 / 茉子6 / 丛雨4 / 蕾娜4 / 小春3 / 芦花3
// 每个场景对应一张原版分层 CG，variants 是同一姿势下的表情差分。
var SCENE_GROUPS = [
  { key: 'yoshino', name: '芳乃' },
  { key: 'mako', name: '茉子' },
  { key: 'murasame', name: '丛雨' },
  { key: 'rena', name: '蕾娜' },
  { key: 'koharu', name: '小春' },
  { key: 'roka', name: '芦花' }
];

var SCENE_LIST = [];
for (var sci = 0; sci < gallery_scenes.length; sci++) {
  SCENE_LIST.push(gallery_scenes[sci]);
}

var SCENE_GROUP_LISTS = {};
for (var scg = 0; scg < SCENE_GROUPS.length; scg++) {
  var sceneGroupKey = SCENE_GROUPS[scg].key;
  var sceneGrouped = [];
  for (var scl = 0; scl < SCENE_LIST.length; scl++) {
    if (SCENE_LIST[scl].route === sceneGroupKey) sceneGrouped.push(SCENE_LIST[scl]);
  }
  for (var scx = 0; scx < sceneGrouped.length; scx++) sceneGrouped[scx].idx = scx;
  SCENE_GROUP_LISTS[sceneGroupKey] = sceneGrouped;
}

function activeSceneList(vm) {
  return (vm && vm.gallerySceneGroup && SCENE_GROUP_LISTS[vm.gallerySceneGroup]) || SCENE_LIST;
}

function sceneVariantCount(scene) {
  return (scene && scene.variants && scene.variants.length) || 1;
}

function sceneVariantSrc(scene, index) {
  if (!scene) return '';
  var variants = scene.variants || [];
  var file = variants[index] || variants[0];
  if (file) return 'file:///userdisk/SenrenBanka/scene/' + file;
  return 'file:///userdisk/SenrenBanka/cg/' + scene.cover + 'a.png';
}

function sceneGroupMaxPan(vm) {
  var list = (vm && vm.gallerySceneGroup && SCENE_GROUP_LISTS[vm.gallerySceneGroup]) || [];
  var width = list.length * (176 + 10) + 10;
  return Math.max(0, width - 800);
}

// 原版「立绘鉴赏」：7 名主要角色，服装/表情差分来自设备端 fg 目录
var STAND_CHARS = [
  { key: 'yoshino', name: '芳乃', char: '芳乃', dresses: ['巫女服', '制服', '私服', '舞服'], faces: 20 },
  { key: 'mako', name: '茉子', char: '茉子', dresses: ['忍者', '制服', '洋装', '私服'], faces: 20 },
  { key: 'murasame', name: '丛雨', char: '丛雨', dresses: ['制服', '寝間着', '洋装', '私服'], faces: 20 },
  { key: 'rena', name: '蕾娜', char: '蕾娜', dresses: ['仲居服', '制服', '和装', '私服'], faces: 20 },
  { key: 'koharu', name: '小春', char: '小春', dresses: ['仕事着', '制服', '私服'], faces: 20 },
  { key: 'roka', name: '芦花', char: '芦花', dresses: ['仕事着', '私服'], faces: 20 },
  { key: 'genshuro', name: '玄十郎', char: '玄十郎', dresses: ['剣道', '私服'], faces: 19 }
];

function standMeta(key) {
  for (var i = 0; i < STAND_CHARS.length; i++) {
    if (STAND_CHARS[i].key === key) return STAND_CHARS[i];
  }
  return null;
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function standSrc(meta, dressIndex, faceIndex) {
  if (!meta) return '';
  var dress = meta.dresses[dressIndex || 0] || meta.dresses[0];
  var face = ((faceIndex || 0) % meta.faces) + 1;
  return 'file:///userdisk/SenrenBanka/fg/' + meta.char + '_' + dress + '_' + pad2(face) + '.png';
}

function activeCgList(vm) {
  return (vm && vm.galleryCgGroup && CG_GROUP_LISTS[vm.galleryCgGroup]) || CG_LIST;
}

var CG_PAGE_SIZE = 4;
var SCENE_PAGE_SIZE = 4;

function cgGroupMaxPan(vm) {
  var list = (vm && vm.galleryCgGroup && CG_GROUP_LISTS[vm.galleryCgGroup]) || [];
  var width = list.length * (176 + 10) + 10;
  return Math.max(0, width - 800);
}


// 横向画廊布局：CG 卡 176×154（16:9 图片 176×99 + 信息条 55），卡间距 10
// 800px 视口内可见 4 张多；列表末尾保留 10px 间距，保证最后一张完整可达
var GALLERY_VIEW_W = 800;
var CG_CARD_W = 176;
var CG_CARD_GAP = 10;
var CG_CONTENT_W = CG_LIST.length * (CG_CARD_W + CG_CARD_GAP) + CG_CARD_GAP;
var CG_MAX_PAN = 0;

// 官方 55 首 BGM 原版真实清单
var BGM_TRACKS = [
  { id: 'bgm01', file: 'BGM01.opus', code: 'BGM01' },
  { id: 'bgm01i', file: 'bgm01i.opus', code: 'BGM01i' },
  { id: 'bgm02', file: 'bgm02.opus', code: 'BGM02' },
  { id: 'bgm03', file: 'bgm03.opus', code: 'BGM03' },
  { id: 'bgm04', file: 'bgm04.opus', code: 'BGM04' },
  { id: 'bgm05', file: 'bgm05.opus', code: 'BGM05' },
  { id: 'bgm06', file: 'bgm06.opus', code: 'BGM06' },
  { id: 'bgm07', file: 'bgm07.opus', code: 'BGM07' },
  { id: 'bgm08', file: 'bgm08.opus', code: 'BGM08' },
  { id: 'bgm09', file: 'bgm09.opus', code: 'BGM09' },
  { id: 'bgm10', file: 'bgm10.opus', code: 'BGM10' },
  { id: 'bgm11', file: 'bgm11.opus', code: 'BGM11' },
  { id: 'bgm12', file: 'bgm12.opus', code: 'BGM12' },
  { id: 'bgm13', file: 'bgm13.opus', code: 'BGM13' },
  { id: 'bgm14', file: 'bgm14.opus', code: 'BGM14' },
  { id: 'bgm15', file: 'bgm15.opus', code: 'BGM15' },
  { id: 'bgm21', file: 'bgm21.opus', code: 'BGM21' },
  { id: 'bgm22', file: 'bgm22.opus', code: 'BGM22' },
  { id: 'bgm23', file: 'bgm23.opus', code: 'BGM23' },
  { id: 'bgm24', file: 'bgm24.opus', code: 'BGM24' },
  { id: 'bgm25', file: 'bgm25.opus', code: 'BGM25' },
  { id: 'bgm26', file: 'bgm26.opus', code: 'BGM26' },
  { id: 'bgm27', file: 'bgm27.opus', code: 'BGM27' },
  { id: 'bgm28', file: 'bgm28.opus', code: 'BGM28' },
  { id: 'bgm29', file: 'bgm29.opus', code: 'BGM29' },
  { id: 'bgm30', file: 'bgm30.opus', code: 'BGM30' },
  { id: 'bgm31', file: 'bgm31.opus', code: 'BGM31' },
  { id: 'bgm32', file: 'bgm32.opus', code: 'BGM32' },
  { id: 'bgm33', file: 'bgm33.opus', code: 'BGM33' },
  { id: 'bgm34', file: 'bgm34.opus', code: 'BGM34' },
  { id: 'bgm35', file: 'bgm35.opus', code: 'BGM35' },
  { id: 'bgm36', file: 'bgm36.opus', code: 'BGM36' },
  { id: 'bgm37', file: 'bgm37.opus', code: 'BGM37' },
  { id: 'bgm38', file: 'bgm38.opus', code: 'BGM38' },
  { id: 'bgm39', file: 'bgm39.opus', code: 'BGM39' },
  { id: 'bgm40', file: 'bgm40.opus', code: 'BGM40' },
  { id: 'bgm41', file: 'bgm41.opus', code: 'BGM41' },
  { id: 'bgm42', file: 'bgm42.opus', code: 'BGM42' },
  { id: 'bgm43', file: 'bgm43.opus', code: 'BGM43' },
  { id: 'bgm44', file: 'bgm44.opus', code: 'BGM44' },
  { id: 'bgm45', file: 'bgm45.opus', code: 'BGM45' },
  { id: 'bgm46', file: 'bgm46.opus', code: 'BGM46' },
  { id: 'bgm51', file: 'bgm51.opus', code: 'BGM51' },
  { id: 'bgm52', file: 'bgm52.opus', code: 'BGM52' },
  { id: 'bgm53', file: 'bgm53.opus', code: 'BGM53' },
  { id: 'bgm54', file: 'bgm54.opus', code: 'BGM54' },
  { id: 'bgm56', file: 'bgm56.opus', code: 'BGM56' },
  { id: 'bgm61', file: 'bgm61.opus', code: 'BGM61' },
  { id: 'songop', file: 'songop.opus', code: 'SongOp' },
  { id: 'songed1', file: 'songed1.opus', code: 'SongED1' },
  { id: 'songed2', file: 'songed2.opus', code: 'SongED2' },
  { id: 'songed3', file: 'songed3.opus', code: 'SongED3' },
  { id: 'songed4', file: 'songed4.opus', code: 'SongED4' },
  { id: 'songed5', file: 'songed5.opus', code: 'SongED5' },
  { id: 'songed6', file: 'songed6.opus', code: 'SongED6' }
];

for (var j = 0; j < BGM_TRACKS.length; j++) {
  BGM_TRACKS[j].idx = j;
}

// 缩放档位（16:9等比）
var ZOOM_LEVELS = [
  { scale: 1.0, w: 391, h: 220, label: '1.0x' },
  { scale: 1.5, w: 587, h: 330, label: '1.5x' },
  { scale: 2.0, w: 782, h: 440, label: '2.0x' },
  { scale: 2.5, w: 978, h: 550, label: '2.5x' }
];

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

export var galleryMethods = {
  initGallery: function () {
    this.galleryTab = this.galleryTab || 'cg';
    this.galleryPanX = 0;
    this._gStartX = 0;
    this._gStartPanX = 0;
    this._gMoved = false;
    this.galleryCgFullscreen = false;

    // 大图交互状态
    this.galleryZoomIndex = 0;
    this.galleryImgPanX = 0;
    this.galleryImgPanY = 0;
    this.galleryCgGroup = '';
    this.galleryCgPage = 0;
    this.galleryCgFullscreen = false;
    this.gallerySceneGroup = '';
    this.galleryScenePage = 0;
    this.gallerySceneIndex = 0;
    this.gallerySceneExpr = 0;
    this.gallerySceneFullscreen = false;
    this.galleryStandChar = this.galleryStandChar || '';
    this.galleryStandDress = this.galleryStandDress || 0;
    this.galleryStandFace = this.galleryStandFace || 0;
    this._imgTouchStartX = 0;
    this._imgTouchStartY = 0;
    this._imgStartPanX = 0;
    this._imgStartPanY = 0;
  },

  setGalleryTab: function (tab) {
    this.galleryTab = tab;
    this.galleryPanX = 0;
    this.galleryCgFullscreen = false;
    this.gallerySceneFullscreen = false;
    if (tab === 'cg') {
      this.galleryCgGroup = '';
      this.galleryCgPage = 0;
    } else if (tab === 'scene') {
      this.gallerySceneGroup = '';
      this.galleryScenePage = 0;
      this.gallerySceneIndex = 0;
      this.gallerySceneExpr = 0;
    }
  },

  selectCgGroup: function (key) {
    if (!CG_GROUP_LISTS[key]) return;
    this.galleryCgGroup = key;
    this.galleryCgPage = 0;
    this.galleryCgIndex = 0;
    this.galleryPanX = 0;
  },

  backToCgGroups: function () {
    this.galleryCgGroup = '';
    this.galleryCgPage = 0;
    this.galleryCgIndex = 0;
    this.galleryPanX = 0;
  },

  setCgPage: function (delta) {
    var list = CG_GROUP_LISTS[this.galleryCgGroup] || [];
    var pages = Math.max(1, Math.ceil(list.length / CG_PAGE_SIZE));
    var page = (this.galleryCgPage || 0) + delta;
    if (page < 0) page = 0;
    if (page >= pages) page = pages - 1;
    this.galleryCgPage = page;
    var maxPan = cgGroupMaxPan(this);
    var target = -page * CG_PAGE_SIZE * (176 + 10);
    if (target < -maxPan) target = -maxPan;
    this.galleryPanX = target;
  },

  selectSceneGroup: function (key) {
    if (!SCENE_GROUP_LISTS[key]) return;
    this.gallerySceneGroup = key;
    this.galleryScenePage = 0;
    this.gallerySceneIndex = 0;
    this.gallerySceneExpr = 0;
    this.galleryPanX = 0;
  },

  backToSceneGroups: function () {
    this.gallerySceneGroup = '';
    this.galleryScenePage = 0;
    this.gallerySceneIndex = 0;
    this.gallerySceneExpr = 0;
    this.galleryPanX = 0;
  },

  setScenePage: function (delta) {
    var list = SCENE_GROUP_LISTS[this.gallerySceneGroup] || [];
    var pages = Math.max(1, Math.ceil(list.length / SCENE_PAGE_SIZE));
    var page = (this.galleryScenePage || 0) + delta;
    if (page < 0) page = 0;
    if (page >= pages) page = pages - 1;
    this.galleryScenePage = page;
    var maxPan = sceneGroupMaxPan(this);
    var target = -page * SCENE_PAGE_SIZE * (176 + 10);
    if (target < -maxPan) target = -maxPan;
    this.galleryPanX = target;
  },

  openFullscreenScene: function (idx) {
    if (this._gMoved) return;
    this.gallerySceneFullscreen = true;
    this.gallerySceneIndex = idx;
    this.gallerySceneExpr = 0;
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  exitFullscreenScene: function () {
    this.gallerySceneFullscreen = false;
  },

  prevFullscreenScene: function () {
    var list = activeSceneList(this);
    var idx = (this.gallerySceneIndex || 0) - 1;
    if (idx < 0) idx = list.length - 1;
    this.gallerySceneIndex = idx;
    this.gallerySceneExpr = 0;
  },

  nextFullscreenScene: function () {
    var list = activeSceneList(this);
    var idx = (this.gallerySceneIndex || 0) + 1;
    if (idx >= list.length) idx = 0;
    this.gallerySceneIndex = idx;
    this.gallerySceneExpr = 0;
  },

  changeSceneExpr: function (delta) {
    var list = activeSceneList(this);
    var scene = list[this.gallerySceneIndex || 0];
    var count = sceneVariantCount(scene);
    var expr = (this.gallerySceneExpr || 0) + delta;
    if (expr < 0) expr = count - 1;
    if (expr >= count) expr = 0;
    this.gallerySceneExpr = expr;
  },

  resetSceneExpr: function () {
    this.gallerySceneExpr = 0;
  },

  selectStandChar: function (key) {
    if (!standMeta(key)) return;
    this.galleryStandChar = key;
    this.galleryStandDress = 0;
    this.galleryStandFace = 0;
  },

  backToStandChars: function () {
    this.galleryStandChar = '';
    this.galleryStandDress = 0;
    this.galleryStandFace = 0;
  },

  setStandDress: function (index) {
    var meta = standMeta(this.galleryStandChar);
    if (!meta || !meta.dresses[index]) return;
    this.galleryStandDress = index;
  },

  changeStandFace: function (delta) {
    var meta = standMeta(this.galleryStandChar);
    if (!meta) return;
    var face = (this.galleryStandFace || 0) + delta;
    if (face < 0) face = meta.faces - 1;
    if (face >= meta.faces) face = 0;
    this.galleryStandFace = face;
  },

  // 画廊滑动选择手势（类似日后谈）
  onGalleryTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._gStartX = t.pageX || t.clientX || 0;
      this._gStartPanX = this.galleryPanX || 0;
      this._gMoved = false;
    }
  },

  onGalleryTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var dx = cx - this._gStartX;
      if (Math.abs(dx) > 6) {
        this._gMoved = true;
      }
      var newX = this._gStartPanX + dx;
      if (newX > 0) newX = 0;
      var maxPan;
      if (this.galleryTab === 'cg') {
        if (!this.galleryCgGroup) { this.galleryPanX = 0; return; }
        maxPan = -cgGroupMaxPan(this);
      } else if (this.galleryTab === 'scene') {
        if (!this.gallerySceneGroup) { this.galleryPanX = 0; return; }
        maxPan = -sceneGroupMaxPan(this);
      } else {
        maxPan = -(BGM_TRACKS.length * 130 - 700);
      }
      if (newX < maxPan) newX = maxPan;
      this.galleryPanX = newX;
    }
  },

  onGalleryTouchEnd: function () {
    var self = this;
    setTimeout(function () {
      self._gMoved = false;
    }, 120);
  },

  // 全屏大图交互
  openFullscreenCg: function (idx) {
    if (this._gMoved) return;
    this.galleryCgFullscreen = true;
    this.galleryCgIndex = idx;
    this.resetImgZoom();
  },

  exitFullscreenCg: function () {
    this.galleryCgFullscreen = false;
  },

  prevFullscreenCg: function () {
    var list = activeCgList(this);
    var idx = (this.galleryCgIndex || 0) - 1;
    if (idx < 0) idx = list.length - 1;
    this.galleryCgIndex = idx;
    this.resetImgZoom();
  },

  nextFullscreenCg: function () {
    var list = activeCgList(this);
    var idx = (this.galleryCgIndex || 0) + 1;
    if (idx >= list.length) idx = 0;
    this.galleryCgIndex = idx;
    this.resetImgZoom();
  },

  resetImgZoom: function () {
    this.galleryZoomIndex = 0;
    var z = ZOOM_LEVELS[0];
    this.galleryImgPanX = Math.round((664 - z.w) / 2);
    this.galleryImgPanY = Math.round((220 - z.h) / 2);
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  zoomInImg: function () {
    var cur = this.galleryZoomIndex || 0;
    if (cur < ZOOM_LEVELS.length - 1) {
      this.galleryZoomIndex = cur + 1;
      this.clampImgPan();
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  zoomOutImg: function () {
    var cur = this.galleryZoomIndex || 0;
    if (cur > 0) {
      this.galleryZoomIndex = cur - 1;
      this.clampImgPan();
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  clampImgPan: function () {
    var z = ZOOM_LEVELS[this.galleryZoomIndex || 0];
    // 水平拖动边界（视口宽 664px）
    if (z.w <= 664) {
      this.galleryImgPanX = Math.round((664 - z.w) / 2);
    } else {
      var minX = 664 - z.w;
      if (this.galleryImgPanX < minX) this.galleryImgPanX = minX;
      if (this.galleryImgPanX > 0) this.galleryImgPanX = 0;
    }
    // 垂直拖动边界（视口高 220px）
    if (z.h <= 220) {
      this.galleryImgPanY = Math.round((220 - z.h) / 2);
    } else {
      var minY = 220 - z.h;
      if (this.galleryImgPanY < minY) this.galleryImgPanY = minY;
      if (this.galleryImgPanY > 0) this.galleryImgPanY = 0;
    }
  },

  onImgTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._imgTouchStartX = t.pageX || t.clientX || 0;
      this._imgTouchStartY = t.pageY || t.clientY || 0;
      this._imgStartPanX = this.galleryImgPanX || 0;
      this._imgStartPanY = this.galleryImgPanY || 0;
    }
  },

  onImgTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var cy = t.pageY || t.clientY || 0;
      var dx = cx - this._imgTouchStartX;
      var dy = cy - this._imgTouchStartY;

      var z = ZOOM_LEVELS[this.galleryZoomIndex || 0];
      if (z.w > 664) {
        var nx = this._imgStartPanX + dx;
        var minX = 664 - z.w;
        if (nx < minX - 40) nx = minX - 40;
        if (nx > 40) nx = 40;
        this.galleryImgPanX = nx;
      }
      if (z.h > 220) {
        var ny = this._imgStartPanY + dy;
        var minY = 220 - z.h;
        if (ny < minY - 30) ny = minY - 30;
        if (ny > 30) ny = 30;
        this.galleryImgPanY = ny;
      }
    }
  },

  onImgTouchEnd: function () {
    this.clampImgPan();
  },

  // 音乐播放
  playGalleryBgm: function (index) {
    if (this._gMoved) return;
    var t = BGM_TRACKS[index];
    if (!t) return;
    this.galleryBgmIndex = index;
    if (this.galleryPlayingBgm === t.file) {
      this.galleryPlayingBgm = '';
      var currentGal = getGal();
      if (currentGal) currentGal.stopBgm();
      return;
    }
    var playback = getBgmPlaybackSettings();
    var G = getGal();
    if (!playback.enabled) {
      this.galleryPlayingBgm = '';
      if (G) G.stopBgm();
      return;
    }
    this.galleryPlayingBgm = t.file;
    if (G) {
      G.playBgm('/userdisk/SenrenBanka/bgm/' + t.file, true, playback.volume);
    }
  },

  toggleGalleryBgmState: function () {
    var G = getGal();
    if (!G) return;
    if (this.galleryPlayingBgm) {
      G.stopBgm();
      this.galleryPlayingBgm = '';
    } else {
      var playback = getBgmPlaybackSettings();
      if (!playback.enabled) {
        this.galleryPlayingBgm = '';
        G.stopBgm();
        return;
      }
      var t = BGM_TRACKS[this.galleryBgmIndex || 0];
      if (t) {
        this.galleryPlayingBgm = t.file;
        G.playBgm('/userdisk/SenrenBanka/bgm/' + t.file, true, playback.volume);
      }
    }
  },

  goBackTitle: function () {
    this.galleryCgFullscreen = false;
    this.gallerySceneFullscreen = false;
    this.stopGalleryBgm();
    this.view = 'title';
    if (typeof this.initTitle === 'function') {
      this.initTitle();
    }
  },

  stopGalleryBgm: function () {
    var G = getGal();
    if (G) {
      G.stopBgm();
    }
    this.galleryPlayingBgm = '';
  }
};

export function renderGallery(vm, h) {
  var tab = vm.galleryTab || 'cg';
  var groupKey = vm.galleryCgGroup || '';
  var groupMeta = null;
  for (var gmi = 0; gmi < CG_GROUPS.length; gmi++) {
    if (CG_GROUPS[gmi].key === groupKey) groupMeta = CG_GROUPS[gmi];
  }
  var sceneGroupKey = vm.gallerySceneGroup || '';
  var sceneGroupMeta = null;
  for (var sgmi = 0; sgmi < SCENE_GROUPS.length; sgmi++) {
    if (SCENE_GROUPS[sgmi].key === sceneGroupKey) sceneGroupMeta = SCENE_GROUPS[sgmi];
  }
  var activeList = activeCgList(vm);
  var standSelected = standMeta(vm.galleryStandChar);
  var subtitle;
  if (tab === 'cg') {
    subtitle = groupMeta
      ? groupMeta.name + ' · ' + activeList.length + ' 张 CG · 轻触看大图'
      : '先选择女主角 / 共通 · 共 ' + CG_LIST.length + ' 张原版 CG';
  } else if (tab === 'scene') {
    subtitle = sceneGroupMeta
      ? sceneGroupMeta.name + ' · ' + activeSceneList(vm).length + ' 个场景 · 轻触切换表情'
      : '原版 24 个场景 · 6 位女主角 · 每个场景含表情差分';
  } else if (tab === 'stand') {
    subtitle = standSelected
      ? standSelected.name + ' · ' + standSelected.dresses[vm.galleryStandDress || 0]
        + ' · 表情 ' + ((vm.galleryStandFace || 0) + 1) + '/' + standSelected.faces
      : '原版 7 名角色立绘 · 可切换服装与表情';
  } else {
    subtitle = '横向滑动浏览 55 首原版 BGM · 轻触播放';
  }

  // 1. 场景鉴赏全屏：左侧切场景，右侧切表情差分
  if (vm.gallerySceneFullscreen) {
    var sceneFsList = activeSceneList(vm);
    var curScene = sceneFsList[vm.gallerySceneIndex || 0] || sceneFsList[0] || SCENE_LIST[0];
    var exprCount = sceneVariantCount(curScene);
    var exprIdx = vm.gallerySceneExpr || 0;
    if (exprIdx < 0) exprIdx = 0;
    if (exprIdx >= exprCount) exprIdx = exprCount - 1;
    var sceneImgLeft = Math.round((664 - 391) / 2);

    return h('div', { staticStyle: S('gallery-fs-root') }, [
      h('div', { staticStyle: S('gallery-fs-left-wing') }, [
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.prevFullscreenScene(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '< 上场景')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.nextFullscreenScene(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '下场景 >')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn-exit'),
          on: { click: function () { vm.exitFullscreenScene(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '退出')
        ])
      ]),

      h('div', { staticStyle: S('gallery-fs-viewport') }, [
        h('image', {
          staticStyle: S('gallery-fs-img', {
            left: sceneImgLeft + 'px',
            top: '0px',
            width: '391px',
            height: '220px'
          }),
          attrs: { src: sceneVariantSrc(curScene, exprIdx), resize: 'contain' }
        }),
        h('div', { staticStyle: S('gallery-fs-header') }, [
          h('text', { staticStyle: S('gallery-fs-header-text') },
            (vm.gallerySceneIndex + 1) + '/' + sceneFsList.length + ' · '
            + curScene.role + ' · ' + curScene.title
            + ' · 表情 ' + (exprIdx + 1) + '/' + exprCount)
        ])
      ]),

      h('div', { staticStyle: S('gallery-fs-right-wing') }, [
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.changeSceneExpr(1); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '表情 +')
        ]),
        h('div', { staticStyle: S('gallery-fs-wing-badge') }, [
          h('text', { staticStyle: S('gallery-fs-wing-badge-text') }, (exprIdx + 1) + '/' + exprCount)
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.changeSceneExpr(-1); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '表情 -')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.resetSceneExpr(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '重置')
        ])
      ])
    ]);
  }

  // 2. 全屏大图模式（16:9等比 + 缩放 + 手势拖动，双翼式布局：左侧翻页退出，右侧缩放重置）
  if (vm.galleryCgFullscreen) {
    var fsList = activeCgList(vm);
    var curCg = fsList[vm.galleryCgIndex || 0] || fsList[0] || CG_LIST[0];
    var z = ZOOM_LEVELS[vm.galleryZoomIndex || 0];
    var imgLeft = vm.galleryImgPanX !== undefined ? vm.galleryImgPanX : Math.round((664 - z.w) / 2);
    var imgTop = vm.galleryImgPanY !== undefined ? vm.galleryImgPanY : Math.round((220 - z.h) / 2);

    return h('div', { staticStyle: S('gallery-fs-root') }, [
      // 左翼控制栏 (宽 68px: 翻页与退出)
      h('div', { staticStyle: S('gallery-fs-left-wing') }, [
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.prevFullscreenCg(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text')
          }, '< 上张')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.nextFullscreenCg(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text')
          }, '下张 >')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn-exit'),
          on: { click: function () { vm.exitFullscreenCg(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text')
          }, '退出')
        ])
      ]),

      // 中间大图视口 (宽 664px: 手势拖动)
      h('div', {
        staticStyle: S('gallery-fs-viewport'),
        on: {
          touchstart: function (e) { vm.onImgTouchStart(e); },
          touchmove: function (e) { vm.onImgTouchMove(e); },
          touchend: function () { vm.onImgTouchEnd(); }
        }
      }, [
        // 等比图片画布
        h('image', {
          staticStyle: S('gallery-fs-img', {
            left: imgLeft + 'px',
            top: imgTop + 'px',
            width: z.w + 'px',
            height: z.h + 'px'
          }),
          attrs: { src: curCg.src, resize: 'contain' }
        }),

        // 顶部悬浮状态条（原版代号与序号）
        h('div', { staticStyle: S('gallery-fs-header') }, [
          h('text', { staticStyle: S('gallery-fs-header-text') }, (curCg.idx + 1) + '/' + fsList.length + ' · ' + curCg.code + ' [' + curCg.role + ']')
        ])
      ]),

      // 右翼控制栏 (宽 68px: 缩放与重置)
      h('div', { staticStyle: S('gallery-fs-right-wing') }, [
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.zoomInImg(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text')
          }, '+ 放大')
        ]),
        h('div', { staticStyle: S('gallery-fs-wing-badge') }, [
          h('text', { staticStyle: S('gallery-fs-wing-badge-text') }, z.label)
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.zoomOutImg(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text')
          }, '- 缩小')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.resetImgZoom(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text')
          }, '重置')
        ])
      ])
    ]);
  }

  // 2. 主画廊模式（顶部标签 + 横向滑动卡片列表，同日后谈）
  var topHeader = h('div', { staticStyle: S('gallery-header') }, [
    h('div', { staticStyle: S('gallery-title-box') }, [
      h('text', { staticStyle: S('gallery-title') }, '◆ 鉴赏 EXTRA ◆'),
      h('text', { staticStyle: S('gallery-subtitle') }, subtitle)
    ]),
    h('div', { staticStyle: S('gallery-tabs') }, [
      h('div', {
        staticStyle: tab === 'cg' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('cg'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, 'CG 鉴赏')
      ]),
      h('div', {
        staticStyle: tab === 'scene' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('scene'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, '场景鉴赏')
      ]),
      h('div', {
        staticStyle: tab === 'stand' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('stand'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, '立绘鉴赏')
      ]),
      h('div', {
        staticStyle: tab === 'bgm' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('bgm'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, '音乐鉴赏')
      ]),
      h('div', {
        staticStyle: S('gallery-back-btn'),
        on: { click: function () { vm.goBackTitle(); } }
      }, [
        h('text', { staticStyle: S('gallery-back-text') }, '‹ 返回标题')
      ])
    ])
  ]);

  var bodyContent = null;

  // TAB 1: CG 鉴赏 —— 先选女主/共通，再进该组网格
  if (tab === 'cg') {
    if (!groupKey) {
      var groupCards = CG_GROUPS.map(function (g) {
        var list = CG_GROUP_LISTS[g.key] || [];
        if (!list.length) return null;
        var cover = g.ema
          ? 'file:///userdisk/SenrenBanka/bg/ema/' + g.ema
          : list[0].src;
        return h('div', {
          key: g.key,
          staticStyle: S('g-group-card'),
          on: { click: function () { vm.selectCgGroup(g.key); } }
        }, [
          h('image', {
            staticStyle: S('g-group-img'),
            attrs: { src: cover, resize: 'cover' }
          }),
          h('div', { staticStyle: S('g-group-info') }, [
            h('text', { staticStyle: S('g-group-name') }, g.name),
            h('text', { staticStyle: S('g-group-count') }, list.length + ' 张 CG')
          ])
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-group-viewport') }, [
        h('text', { staticStyle: S('g-group-hint') }, '轻触角色卡片，查看该线的全部 CG'),
        h('div', { staticStyle: S('g-group-row') }, groupCards)
      ]);
    } else {
      var groupList = activeList;
      var pageSize = CG_PAGE_SIZE;
      var pages = Math.max(1, Math.ceil(groupList.length / pageSize));
      var page = Math.min(Math.max(vm.galleryCgPage || 0, 0), pages - 1);
      var listWidth = groupList.length * (176 + 10) + 10;
      var cards = groupList.map(function (it) {
        return h('div', {
          key: it.id,
          staticStyle: S('g-cg-card'),
          on: { click: function () { vm.openFullscreenCg(it.idx); } }
        }, [
          h('image', {
            staticStyle: S('g-cg-card-img'),
            attrs: { src: it.src, resize: 'cover' }
          }),
          h('div', { staticStyle: S('g-cg-card-bar') }, [
            h('text', { staticStyle: S('g-cg-card-code') }, it.code),
            h('text', { staticStyle: S('g-cg-card-role') }, it.role)
          ])
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-cg-group-pane') }, [
        h('div', { staticStyle: S('g-cg-nav') }, [
          h('div', {
            staticStyle: S('g-cg-nav-btn'),
            on: { click: function () { vm.backToCgGroups(); } }
          }, [
            h('text', { staticStyle: S('g-cg-nav-text') }, '‹ 女主选择')
          ]),
          h('text', { staticStyle: S('g-cg-nav-page') },
            groupMeta.name + ' · ' + (page + 1) + '/' + pages + ' · ' + groupList.length + ' 张'),
          h('div', {
            staticStyle: S('g-cg-nav-btn'),
            on: { click: function () { vm.setCgPage(-1); } }
          }, [
            h('text', { staticStyle: S('g-cg-nav-text') }, '‹ 上一页')
          ]),
          h('div', {
            staticStyle: S('g-cg-nav-btn'),
            on: { click: function () { vm.setCgPage(1); } }
          }, [
            h('text', { staticStyle: S('g-cg-nav-text') }, '下一页 ›')
          ])
        ]),
        h('div', {
          staticStyle: S('g-cg-group-viewport'),
          on: {
            touchstart: function (e) { vm.onGalleryTouchStart(e); },
            touchmove: function (e) { vm.onGalleryTouchMove(e); },
            touchend: function () { vm.onGalleryTouchEnd(); }
          }
        }, [
          h('div', {
            staticStyle: S('g-cg-group-list', {
              left: (vm.galleryPanX || 0) + 'px',
              width: listWidth + 'px'
            })
          }, cards)
        ])
      ]);
    }
  }

  // TAB 2: 场景鉴赏 —— 先选女主，再进 24 个原版场景（可切表情差分）
  if (tab === 'scene') {
    if (!sceneGroupKey) {
      var sceneGroupCards = SCENE_GROUPS.map(function (g) {
        var list = SCENE_GROUP_LISTS[g.key] || [];
        if (!list.length) return null;
        var cover = sceneVariantSrc(list[0], 0);
        return h('div', {
          key: g.key,
          staticStyle: S('g-group-card'),
          on: { click: function () { vm.selectSceneGroup(g.key); } }
        }, [
          h('image', {
            staticStyle: S('g-group-img'),
            attrs: { src: cover, resize: 'cover' }
          }),
          h('div', { staticStyle: S('g-group-info') }, [
            h('text', { staticStyle: S('g-group-name') }, g.name),
            h('text', { staticStyle: S('g-group-count') }, list.length + ' 个场景')
          ])
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-group-viewport') }, [
        h('text', { staticStyle: S('g-group-hint') }, '原版 24 个场景 · 轻触角色卡片进入'),
        h('div', { staticStyle: S('g-group-row') }, sceneGroupCards)
      ]);
    } else {
      var sceneGroupList = activeSceneList(vm);
      var scenePages = Math.max(1, Math.ceil(sceneGroupList.length / SCENE_PAGE_SIZE));
      var scenePage = Math.min(Math.max(vm.galleryScenePage || 0, 0), scenePages - 1);
      var sceneListWidth = sceneGroupList.length * (176 + 10) + 10;
      var sceneCards = sceneGroupList.map(function (it) {
        return h('div', {
          key: it.id,
          staticStyle: S('g-cg-card'),
          on: { click: function () { vm.openFullscreenScene(it.idx); } }
        }, [
          h('image', {
            staticStyle: S('g-cg-card-img'),
            attrs: { src: sceneVariantSrc(it, 0), resize: 'cover' }
          }),
          h('div', { staticStyle: S('g-cg-card-bar') }, [
            h('text', { staticStyle: S('g-cg-card-code') }, it.title),
            h('text', { staticStyle: S('g-cg-card-role') }, '表情 ' + sceneVariantCount(it))
          ])
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-cg-group-pane') }, [
        h('div', { staticStyle: S('g-cg-nav') }, [
          h('div', {
            staticStyle: S('g-cg-nav-btn'),
            on: { click: function () { vm.backToSceneGroups(); } }
          }, [
            h('text', { staticStyle: S('g-cg-nav-text') }, '‹ 女主选择')
          ]),
          h('text', { staticStyle: S('g-cg-nav-page') },
            sceneGroupMeta.name + ' · ' + (scenePage + 1) + '/' + scenePages + ' · ' + sceneGroupList.length + ' 个场景'),
          h('div', {
            staticStyle: S('g-cg-nav-btn'),
            on: { click: function () { vm.setScenePage(-1); } }
          }, [
            h('text', { staticStyle: S('g-cg-nav-text') }, '‹ 上一页')
          ]),
          h('div', {
            staticStyle: S('g-cg-nav-btn'),
            on: { click: function () { vm.setScenePage(1); } }
          }, [
            h('text', { staticStyle: S('g-cg-nav-text') }, '下一页 ›')
          ])
        ]),
        h('div', {
          staticStyle: S('g-cg-group-viewport'),
          on: {
            touchstart: function (e) { vm.onGalleryTouchStart(e); },
            touchmove: function (e) { vm.onGalleryTouchMove(e); },
            touchend: function () { vm.onGalleryTouchEnd(); }
          }
        }, [
          h('div', {
            staticStyle: S('g-cg-group-list', {
              left: (vm.galleryPanX || 0) + 'px',
              width: sceneListWidth + 'px'
            })
          }, sceneCards)
        ])
      ]);
    }
  }

  // TAB 3: 立绘鉴赏 —— 7 名角色的服装 / 表情差分
  if (tab === 'stand') {
    if (!standSelected) {
      var standCards = STAND_CHARS.map(function (item) {
        return h('div', {
          key: item.key,
          staticStyle: S('g-group-card'),
          on: { click: function () { vm.selectStandChar(item.key); } }
        }, [
          h('image', {
            staticStyle: S('g-stand-group-img'),
            attrs: { src: standSrc(item, 0, 0), resize: 'contain' }
          }),
          h('div', { staticStyle: S('g-group-info') }, [
            h('text', { staticStyle: S('g-group-name') }, item.name),
            h('text', { staticStyle: S('g-group-count') }, item.dresses.length + ' 套服装')
          ])
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-group-viewport') }, [
        h('text', { staticStyle: S('g-group-hint') }, '轻触角色，进入服装与表情差分鉴赏'),
        h('div', { staticStyle: S('g-group-row') }, standCards)
      ]);
    } else {
      var dressButtons = standSelected.dresses.map(function (dress, di) {
        var active = (vm.galleryStandDress || 0) === di;
        return h('div', {
          key: dress,
          staticStyle: active ? S('g-stand-dress-btn g-stand-dress-btn-active') : S('g-stand-dress-btn'),
          on: { click: function () { vm.setStandDress(di); } }
        }, [
          h('text', { staticStyle: S('g-stand-dress-text') }, dress)
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-stand-pane') }, [
        h('div', { staticStyle: S('g-stand-stage') }, [
          h('image', {
            staticStyle: S('g-stand-img'),
            attrs: { src: standSrc(standSelected, vm.galleryStandDress || 0, vm.galleryStandFace || 0), resize: 'contain' }
          })
        ]),
        h('div', { staticStyle: S('g-stand-controls') }, [
          h('div', { staticStyle: S('g-stand-nav') }, [
            h('div', {
              staticStyle: S('g-stand-back-btn'),
              on: { click: function () { vm.backToStandChars(); } }
            }, [
              h('text', { staticStyle: S('g-stand-back-text') }, '‹ 角色选择')
            ]),
            h('text', { staticStyle: S('g-stand-title') }, standSelected.name + ' · ' + standSelected.dresses[vm.galleryStandDress || 0])
          ]),
          h('div', { staticStyle: S('g-stand-dress-row') }, dressButtons),
          h('div', { staticStyle: S('g-stand-face-row') }, [
            h('div', {
              staticStyle: S('g-stand-face-btn'),
              on: { click: function () { vm.changeStandFace(-1); } }
            }, [
              h('text', { staticStyle: S('g-stand-face-btn-text') }, '‹ 表情')
            ]),
            h('text', { staticStyle: S('g-stand-face-text') }, ((vm.galleryStandFace || 0) + 1) + ' / ' + standSelected.faces),
            h('div', {
              staticStyle: S('g-stand-face-btn'),
              on: { click: function () { vm.changeStandFace(1); } }
            }, [
              h('text', { staticStyle: S('g-stand-face-btn-text') }, '表情 ›')
            ])
          ]),
          h('text', { staticStyle: S('g-stand-hint') }, '服装与表情均取自原版 fg 差分')
        ])
      ]);
    }
  }

  // TAB 4: 音乐鉴赏（横向滑动列表）
  if (tab === 'bgm') {
    var bgmCards = BGM_TRACKS.map(function (it) {
      var isPlaying = vm.galleryPlayingBgm === it.file;
      return h('div', {
        key: it.id,
        staticStyle: isPlaying ? S('g-bgm-card g-bgm-card-active') : S('g-bgm-card'),
        on: { click: function () { vm.playGalleryBgm(it.idx); } }
      }, [
        h('div', { staticStyle: S('g-bgm-card-top') }, [
          h('text', { staticStyle: S('g-bgm-card-idx') }, '#' + (it.idx + 1 < 10 ? '0' + (it.idx + 1) : it.idx + 1)),
          h('text', { staticStyle: isPlaying ? S('g-bgm-card-state active') : S('g-bgm-card-state') }, isPlaying ? '▶ 播放中' : '♪')
        ]),
        h('text', { staticStyle: S('g-bgm-card-code') }, it.code),
        h('div', { staticStyle: S('g-bgm-card-btn') }, [
          h('text', { staticStyle: S('g-bgm-card-btn-text') }, isPlaying ? '暂停' : '播放')
        ])
      ]);
    });

    bodyContent = h('div', {
      staticStyle: S('g-scroll-viewport'),
      on: {
        touchstart: function (e) { vm.onGalleryTouchStart(e); },
        touchmove: function (e) { vm.onGalleryTouchMove(e); },
        touchend: function () { vm.onGalleryTouchEnd(); }
      }
    }, [
      h('div', {
        staticStyle: S('g-scroll-list', {
          left: (vm.galleryPanX || 0) + 'px',
          width: (BGM_TRACKS.length * 130 + 40) + 'px'
        })
      }, bgmCards)
    ]);
  }

  return h('div', { staticStyle: S('gallery-root') }, [
    h('image', {
      staticStyle: S('gallery-bg-img'),
      attrs: { src: 'file:///userdisk/SenrenBanka/bg/title_bg.png' }
    }),
    topHeader,
    bodyContent
  ]);
}
