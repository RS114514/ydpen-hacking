// root.js —— 《千恋＊万花》根组件（构建后为 Component.js.bin）
import { titleMethods, renderTitle } from './TitleView.js';
import { gameMethods, renderGame } from './GameView.js';
import { galleryMethods, renderGallery } from './GalleryView.js';
import { getGal, log } from './Common.js';

var methods = {
  onShow: function () {
    log('root onShow, view=' + this.view);
    if (this.view === 'title' && typeof this.initTitle === 'function') {
      this.initTitle();
    } else if (this.view === 'game' && typeof this.initGame === 'function') {
      this.initGame();
    }
  },
  onHide: function () {
    var G = getGal();
    if (G) {
      G.stopVoice();
    }
  },
  onUnload: function () {
    var G = getGal();
    if (G) {
      G.stopVoice();
      G.stopBgm();
      G.stopVideo();
    }
  }
};

var k;
for (k in titleMethods) methods[k] = titleMethods[k];
for (k in gameMethods) methods[k] = gameMethods[k];
for (k in galleryMethods) methods[k] = galleryMethods[k];

export default {
  name: 'index',
  data: function () {
    return {
      view: 'title', // 'title' | 'game' | 'gallery'
      bgmOn: false,
      titleModalType: '',
      titleSaves: {},
      currentLine: 0,
      currentBgm: '',
      hasVoice: false,
      autoPlay: false,
      autoTimer: null,
      skipMode: false,
      zoomMode: false,
      modalType: '', // '' | 'save' | 'load' | 'menu'
      modalSaves: {},
      savePage: 0,
      selectedSlot: 1,
      confirmModal: null,
      titleSavePage: 0,
      titleSelectedSlot: 1,
      titleConfirmModal: null,
      titleScrollY: 0,
      galleryTab: 'cg', // 'cg' | 'bgm' | 'stand' | 'scene'
      galleryCgFullscreen: false,
      galleryCgIndex: 0,
      galleryPlayingBgm: 'BGM01.opus',
      galleryBgmIndex: 0,
      galleryStandChar: 'yoshino',
      galleryStandDress: 0,
      galleryStandFace: 0,
      galleryStandPos: 0,
      galleryPage: 0,
      index: 0,
      zoomIdx: 0,
      uiVisible: true,
      panX: 0,
      panY: 0,
      touchStartX: 0,
      touchStartY: 0,
      panStartX: 0,
      panStartY: 0,
      hasMoved: false
    };
  },
  methods: methods,
  render: function (h) {
    if (this.view === 'game') {
      return renderGame(this, h);
    } else if (this.view === 'gallery') {
      return renderGallery(this, h);
    }
    return renderTitle(this, h);
  }
};
