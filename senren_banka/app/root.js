// root.js —— 《千恋＊万花》根组件（构建后为 Component.js.bin）
import { titleMethods, renderTitle } from './pages/title/title.js';
import { gameMethods, renderGame } from './pages/game/game.js';
import { galleryMethods, renderGallery } from './pages/gallery/gallery.js';
import { flowchartMethods, renderFlowchart } from './pages/flowchart/flowchart.js';
import { afterstoryMethods, renderAfterstory } from './pages/afterstory/afterstory.js';
import { getGal, log } from './common.js';

var methods = {
  onShow: function () {
    log('root onShow, view=' + this.view);
    if (this.view === 'title' && typeof this.initTitle === 'function') {
      this.initTitle();
    } else if (this.view === 'game' && typeof this.initGame === 'function') {
      this.initGame();
    } else if (this.view === 'flowchart' && typeof this.initFlowchart === 'function') {
      this.initFlowchart();
    } else if (this.view === 'afterstory' && typeof this.initAfterStory === 'function') {
      this.initAfterStory();
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
for (k in flowchartMethods) methods[k] = flowchartMethods[k];
for (k in afterstoryMethods) methods[k] = afterstoryMethods[k];

export default {
  name: 'index',
  data: function () {
    return {
      view: 'title', // 'title' | 'game' | 'gallery' | 'flowchart' | 'afterstory'
      bgmOn: true,
      titleModalType: '',
      titleSaves: {},
      currentLine: 0,
      currentBgm: '',
      hasVoice: false,
      autoPlay: false,
      autoTimer: null,
      skipMode: false,
      zoomMode: false,
      gameZoomIndex: 0,
      gameImgPanX: 0,
      gameImgPanY: 0,
      historyFocusIndex: 0,
      modalType: '', // '' | 'save' | 'load' | 'menu' | 'history'
      modalSaves: {},
      historyList: [],
      historyScrollY: 0,
      historyMaxScroll: 0,
      historyChapter: '',
      savePage: 0,
      selectedSlot: 1,
      confirmModal: null,
      titleSavePage: 0,
      titleSelectedSlot: 1,
      titleConfirmModal: null,
      titleScrollY: 0,
      galleryTab: 'cg', // 'cg' | 'bgm' | 'stand' | 'scene'
      galleryPanX: 0,
      galleryCgFullscreen: false,
      galleryCgIndex: 0,
      galleryZoomIndex: 0,
      galleryImgPanX: 0,
      galleryImgPanY: 0,
      galleryPlayingBgm: 'BGM01.opus',
      galleryBgmIndex: 0,
      galleryStandChar: 'yoshino',
      galleryStandDress: 0,
      galleryStandFace: 0,
      galleryStandPos: 0,
      galleryPage: 0,
      flowPanX: 0,
      flowPanY: 0,
      afterPanX: 0,
      selectedAfterHeroine: 'yoshino',
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
    } else if (this.view === 'flowchart') {
      return renderFlowchart(this, h);
    } else if (this.view === 'afterstory') {
      return renderAfterstory(this, h);
    }
    return renderTitle(this, h);
  }
};
