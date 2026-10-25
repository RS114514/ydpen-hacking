// pages/gallery/gallery.js —— 柚子社和风多合一鉴赏收藏馆（CG/音乐，横向滑动选择与大图手势交互）
import { S, log, getGal } from '../../common.js';

// 全量精选 37 款原版 CG（直接使用官方编号）
var CG_LIST = [
  // 芳乃
  { id: 'ev101a', code: 'EV101', role: '芳乃', src: 'file:///userdisk/SenrenBanka/cg/ev101a.png' },
  { id: 'ev102a', code: 'EV102', role: '芳乃', src: 'file:///userdisk/SenrenBanka/cg/ev102a.png' },
  { id: 'ev105a', code: 'EV105', role: '芳乃', src: 'file:///userdisk/SenrenBanka/cg/ev105a.png' },
  { id: 'ev106a', code: 'EV106', role: '芳乃', src: 'file:///userdisk/SenrenBanka/cg/ev106a.png' },
  { id: 'ev107a', code: 'EV107', role: '芳乃', src: 'file:///userdisk/SenrenBanka/cg/ev107a.png' },
  { id: 'ev108a', code: 'EV108', role: '芳乃', src: 'file:///userdisk/SenrenBanka/cg/ev108a.png' },
  { id: 'ev112a', code: 'EV112', role: '芳乃', src: 'file:///userdisk/SenrenBanka/cg/ev112a.png' },
  // 茉子
  { id: 'ev202a', code: 'EV202', role: '茉子', src: 'file:///userdisk/SenrenBanka/cg/ev202a.png' },
  { id: 'ev206a', code: 'EV206', role: '茉子', src: 'file:///userdisk/SenrenBanka/cg/ev206a.png' },
  { id: 'ev207a', code: 'EV207', role: '茉子', src: 'file:///userdisk/SenrenBanka/cg/ev207a.png' },
  { id: 'ev209a', code: 'EV209', role: '茉子', src: 'file:///userdisk/SenrenBanka/cg/ev209a.png' },
  { id: 'ev211a', code: 'EV211', role: '茉子', src: 'file:///userdisk/SenrenBanka/cg/ev211a.png' },
  { id: 'ev214a', code: 'EV214', role: '茉子', src: 'file:///userdisk/SenrenBanka/cg/ev214a.png' },
  // 丛雨
  { id: 'ev301a', code: 'EV301', role: '丛雨', src: 'file:///userdisk/SenrenBanka/cg/ev301a.png' },
  { id: 'ev302a', code: 'EV302', role: '丛雨', src: 'file:///userdisk/SenrenBanka/cg/ev302a.png' },
  { id: 'ev303a', code: 'EV303', role: '丛雨', src: 'file:///userdisk/SenrenBanka/cg/ev303a.png' },
  { id: 'ev304a', code: 'EV304', role: '丛雨', src: 'file:///userdisk/SenrenBanka/cg/ev304a.png' },
  { id: 'ev308a', code: 'EV308', role: '丛雨', src: 'file:///userdisk/SenrenBanka/cg/ev308a.png' },
  { id: 'ev317a', code: 'EV317', role: '丛雨', src: 'file:///userdisk/SenrenBanka/cg/ev317a.png' },
  // 蕾娜
  { id: 'ev401a', code: 'EV401', role: '蕾娜', src: 'file:///userdisk/SenrenBanka/cg/ev401a.png' },
  { id: 'ev403a', code: 'EV403', role: '蕾娜', src: 'file:///userdisk/SenrenBanka/cg/ev403a.png' },
  { id: 'ev404a', code: 'EV404', role: '蕾娜', src: 'file:///userdisk/SenrenBanka/cg/ev404a.png' },
  { id: 'ev406a', code: 'EV406', role: '蕾娜', src: 'file:///userdisk/SenrenBanka/cg/ev406a.png' },
  { id: 'ev407a', code: 'EV407', role: '蕾娜', src: 'file:///userdisk/SenrenBanka/cg/ev407a.png' },
  { id: 'ev414a', code: 'EV414', role: '蕾娜', src: 'file:///userdisk/SenrenBanka/cg/ev414a.png' },
  // 小春
  { id: 'ev501a', code: 'EV501', role: '小春', src: 'file:///userdisk/SenrenBanka/cg/ev501a.png' },
  { id: 'ev502a', code: 'EV502', role: '小春', src: 'file:///userdisk/SenrenBanka/cg/ev502a.png' },
  { id: 'ev503a', code: 'EV503', role: '小春', src: 'file:///userdisk/SenrenBanka/cg/ev503a.png' },
  { id: 'ev505a', code: 'EV505', role: '小春', src: 'file:///userdisk/SenrenBanka/cg/ev505a.png' },
  // 芦花
  { id: 'ev601a', code: 'EV601', role: '芦花', src: 'file:///userdisk/SenrenBanka/cg/ev601a.png' },
  { id: 'ev602a', code: 'EV602', role: '芦花', src: 'file:///userdisk/SenrenBanka/cg/ev602a.png' },
  { id: 'ev603a', code: 'EV603', role: '芦花', src: 'file:///userdisk/SenrenBanka/cg/ev603a.png' },
  { id: 'ev604a', code: 'EV604', role: '芦花', src: 'file:///userdisk/SenrenBanka/cg/ev604a.png' },
  // 共通
  { id: 'ev701a', code: 'EV701', role: '共通', src: 'file:///userdisk/SenrenBanka/cg/ev701a.png' },
  { id: 'ev702a', code: 'EV702', role: '共通', src: 'file:///userdisk/SenrenBanka/cg/ev702a.png' },
  { id: 'ev703a', code: 'EV703', role: '共通', src: 'file:///userdisk/SenrenBanka/cg/ev703a.png' },
  { id: 'ev705a', code: 'EV705', role: '共通', src: 'file:///userdisk/SenrenBanka/cg/ev705a.png' }
];

for (var i = 0; i < CG_LIST.length; i++) {
  CG_LIST[i].idx = i;
}

// 横向画廊布局：CG 卡 176×154（16:9 图片 176×99 + 信息条 55），卡间距 10
// 800px 视口内可见 4 张多；列表末尾保留 10px 间距，保证最后一张完整可达
var GALLERY_VIEW_W = 800;
var CG_CARD_W = 176;
var CG_CARD_GAP = 10;
var CG_CONTENT_W = CG_LIST.length * (CG_CARD_W + CG_CARD_GAP) + CG_CARD_GAP;
var CG_MAX_PAN = Math.max(0, CG_CONTENT_W - GALLERY_VIEW_W);

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
    this._imgTouchStartX = 0;
    this._imgTouchStartY = 0;
    this._imgStartPanX = 0;
    this._imgStartPanY = 0;
  },

  setGalleryTab: function (tab) {
    this.galleryTab = tab;
    this.galleryPanX = 0;
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
      var maxPan = this.galleryTab === 'cg' ? -CG_MAX_PAN : -(BGM_TRACKS.length * 130 - 700);
      if (maxPan > 0) maxPan = 0;
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
    var idx = (this.galleryCgIndex || 0) - 1;
    if (idx < 0) idx = CG_LIST.length - 1;
    this.galleryCgIndex = idx;
    this.resetImgZoom();
  },

  nextFullscreenCg: function () {
    var idx = (this.galleryCgIndex || 0) + 1;
    if (idx >= CG_LIST.length) idx = 0;
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
    this.galleryPlayingBgm = t.file;
    var G = getGal();
    if (G) {
      G.playBgm('/userdisk/SenrenBanka/bgm/' + t.file, true, 0.8);
    }
  },

  toggleGalleryBgmState: function () {
    var G = getGal();
    if (!G) return;
    if (this.galleryPlayingBgm) {
      G.stopBgm();
      this.galleryPlayingBgm = '';
    } else {
      var t = BGM_TRACKS[this.galleryBgmIndex || 0];
      if (t) {
        this.galleryPlayingBgm = t.file;
        G.playBgm('/userdisk/SenrenBanka/bgm/' + t.file, true, 0.8);
      }
    }
  },

  goBackTitle: function () {
    this.stopGalleryBgm();
    this.view = 'title';
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

  // 1. 全屏大图模式（16:9等比 + 缩放 + 手势拖动，双翼式布局：左侧翻页退出，右侧缩放重置）
  if (vm.galleryCgFullscreen) {
    var curCg = CG_LIST[vm.galleryCgIndex || 0] || CG_LIST[0];
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
            staticStyle: S('gallery-fs-wing-btn-text'),
            on: { click: function () { vm.prevFullscreenCg(); } }
          }, '< 上张')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.nextFullscreenCg(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text'),
            on: { click: function () { vm.nextFullscreenCg(); } }
          }, '下张 >')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn-exit'),
          on: { click: function () { vm.exitFullscreenCg(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text'),
            on: { click: function () { vm.exitFullscreenCg(); } }
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
          attrs: { src: curCg.src }
        }),

        // 顶部悬浮状态条（原版代号与序号）
        h('div', { staticStyle: S('gallery-fs-header') }, [
          h('text', { staticStyle: S('gallery-fs-header-text') }, (curCg.idx + 1) + '/' + CG_LIST.length + ' · ' + curCg.code + ' [' + curCg.role + ']')
        ])
      ]),

      // 右翼控制栏 (宽 68px: 缩放与重置)
      h('div', { staticStyle: S('gallery-fs-right-wing') }, [
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.zoomInImg(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text'),
            on: { click: function () { vm.zoomInImg(); } }
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
            staticStyle: S('gallery-fs-wing-btn-text'),
            on: { click: function () { vm.zoomOutImg(); } }
          }, '- 缩小')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.resetImgZoom(); } }
        }, [
          h('text', {
            staticStyle: S('gallery-fs-wing-btn-text'),
            on: { click: function () { vm.resetImgZoom(); } }
          }, '重置')
        ])
      ])
    ]);
  }

  // 2. 主画廊模式（顶部标签 + 横向滑动卡片列表，同日后谈）
  var topHeader = h('div', { staticStyle: S('gallery-header') }, [
    h('div', { staticStyle: S('gallery-title-box') }, [
      h('text', { staticStyle: S('gallery-title') }, '◆ 鉴赏 EXTRA ◆'),
      h('text', { staticStyle: S('gallery-subtitle') }, tab === 'cg' ? '横向滑动浏览 37 款原版 CG · 轻触进入大图' : '横向滑动浏览 55 首原版 BGM · 轻触播放')
    ]),
    h('div', { staticStyle: S('gallery-tabs') }, [
      h('div', {
        staticStyle: tab === 'cg' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('cg'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, 'CG 鉴赏')
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

  // TAB 1: CG 鉴赏（横向滑动卡片列表）
  if (tab === 'cg') {
    var cgCards = CG_LIST.map(function (it) {
      return h('div', {
        key: it.id,
        staticStyle: S('g-cg-card'),
        on: { click: function () { vm.openFullscreenCg(it.idx); } }
      }, [
        h('image', {
          staticStyle: S('g-cg-card-img'),
          attrs: { src: it.src }
        }),
        h('div', { staticStyle: S('g-cg-card-bar') }, [
          h('text', { staticStyle: S('g-cg-card-code') }, it.code),
          h('text', { staticStyle: S('g-cg-card-role') }, it.role)
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
          width: CG_CONTENT_W + 'px'
        })
      }, cgCards)
    ]);
  }

  // TAB 2: 音乐鉴赏（横向滑动列表）
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
