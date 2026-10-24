// pages/gallery/gallery.js —— 柚子社和风多合一鉴赏收藏馆（CG/音乐/立绘/场景）
import { S, log, getGal } from '../../common.js';

var CG_LIST = [
  { idx: 0, id: 'ev112a', title: '朝武芳乃 · 破除诅咒', src: 'file:///userdisk/SenrenBanka/cg/ev112a_hd.png', tag: '无修正' },
  { idx: 1, id: 'ev214a', title: '常陆茉子 · 温泉秘汤', src: 'file:///userdisk/SenrenBanka/cg/ev214a_hd.png', tag: '无修正' },
  { idx: 2, id: 'ev317a', title: '丛雨 · 魂之契约', src: 'file:///userdisk/SenrenBanka/cg/ev317a_hd.png', tag: '无修正' },
  { idx: 3, id: 'ev414a', title: '蕾娜 · 异国恋曲', src: 'file:///userdisk/SenrenBanka/cg/ev414a_hd.png', tag: '无修正' },
  { idx: 4, id: 'ev505a', title: '鞍马小春 · 春色和果', src: 'file:///userdisk/SenrenBanka/cg/ev505a_hd.png', tag: '无修正' },
  { idx: 5, id: 'ev604a', title: '马场芦花 · 茶寮微醺', src: 'file:///userdisk/SenrenBanka/cg/ev604a_hd.png', tag: '无修正' }
];

var BGM_TRACKS = [
  { id: 'bgm01', file: 'BGM01.opus', title: '縁結びの神社', theme: '神圣庄严的主题雅乐', author: 'Famishin' },
  { id: 'bgm05', file: 'bgm05.opus', title: '穏やかな昼下がり', theme: '穗织小镇明媚日光', author: 'Famishin' },
  { id: 'bgm21', file: 'bgm21.opus', title: '忍びの道', theme: '常陆茉子忠义潜行', author: 'Famishin' },
  { id: 'bgm22', file: 'bgm22.opus', title: '幽霊少女の戯れ', theme: '丛雨灵动轻快之曲', author: 'Famishin' },
  { id: 'bgm24', file: 'bgm24.opus', title: '穗织之祭', theme: '热闹欢腾的古风盛典', author: 'Famishin' },
  { id: 'bgm26', file: 'bgm26.opus', title: '誓いの調べ', theme: '结缘与誓约的深情旋律', author: 'Famishin' }
];

var STAND_CHARS = [
  { id: 'yoshino', tag: '【芳乃】', name: '朝武 芳乃', title: '朝武神社巫女 / 祟神宿主', voice: 'yos001_012.ogg' },
  { id: 'mako', tag: '【茉子】', name: '常陆 茉子', title: '朝武家护卫 / 忍者少女', voice: 'uts001_001.ogg' },
  { id: 'murasame', tag: '【丛雨】', name: '丛 雨', title: '神刀丛雨丸之灵 / 幽灵少女', voice: 'mur001_069.ogg' },
  { id: 'lena', tag: '【蕾娜】', name: '蕾 娜', title: '芬兰留学生 / 绿茶爱好者', voice: 'uts001_002.ogg' },
  { id: 'koharu', tag: '【小春】', name: '鞍马 小春', title: '甜点店学徒 / 温柔后辈', voice: 'uts001_003.ogg' },
  { id: 'roka', tag: '【芦花】', name: '马场 芦花', title: '志那都庄老板娘 / 幼驯染', voice: 'uts001_004.ogg' }
];

var SCENES = [
  { id: 'sc01', name: '1-1 · 穗织来访', desc: '初临神域，古镇街道漫步', line: 0 },
  { id: 'sc02', name: '1-2 · 庆典拔刀', desc: '神社盛典，拔出名刀丛雨丸', line: 350 },
  { id: 'sc03', name: '1-3 · 刀灵现身', desc: '神刀少女显现，五百年心意相通', line: 550 },
  { id: 'sc04', name: '2-1 · 婚约分歧', desc: '四方宿命分道扬镳之抉择点', line: 780 }
];


export var galleryMethods = {
  setGalleryTab: function (tab) {
    this.galleryTab = tab;
  },
  openFullscreenCg: function (idx) {
    this.galleryCgFullscreen = true;
    this.galleryCgIndex = idx;
  },
  prevFullscreenCg: function () {
    var idx = (this.galleryCgIndex || 0) - 1;
    if (idx < 0) idx = CG_LIST.length - 1;
    this.galleryCgIndex = idx;
  },
  nextFullscreenCg: function () {
    var idx = (this.galleryCgIndex || 0) + 1;
    if (idx >= CG_LIST.length) idx = 0;
    this.galleryCgIndex = idx;
  },
  exitFullscreenCg: function () {
    this.galleryCgFullscreen = false;
  },
  setGalleryPage: function (p) {
    this.galleryPage = p;
  },
  playGalleryBgm: function (index) {
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
  stopGalleryBgm: function () {
    var G = getGal();
    if (G) {
      G.stopBgm();
    }
    this.galleryPlayingBgm = '';
  },
  prevGalleryBgm: function () {
    var idx = (this.galleryBgmIndex || 0) - 1;
    if (idx < 0) idx = BGM_TRACKS.length - 1;
    this.playGalleryBgm(idx);
  },
  nextGalleryBgm: function () {
    var idx = (this.galleryBgmIndex || 0) + 1;
    if (idx >= BGM_TRACKS.length) idx = 0;
    this.playGalleryBgm(idx);
  },
  selectStandChar: function (charId) {
    this.galleryStandChar = charId;
    this.galleryStandDress = 0;
    this.galleryStandFace = 0;
  },
  selectStandDress: function (dressIdx) {
    this.galleryStandDress = dressIdx;
  },
  selectStandFace: function (faceIdx) {
    this.galleryStandFace = faceIdx;
  },
  playStandVoice: function () {
    var curId = this.galleryStandChar || 'yoshino';
    var found = null;
    for (var i = 0; i < STAND_CHARS.length; i++) {
      if (STAND_CHARS[i].id === curId) {
        found = STAND_CHARS[i];
        break;
      }
    }
    if (found && found.voice) {
      var G = getGal();
      if (G) {
        G.playVoice('/userdisk/SenrenBanka/voice/' + found.voice);
      }
    }
  },
  jumpFromSceneMemory: function (line) {
    this.currentLine = line || 0;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame();
    }
  },
  goBackTitle: function () {
    this.view = 'title';
  }
};

export function renderGallery(vm, h) {
  var tab = vm.galleryTab || 'cg';

  // 1. 全屏大图模式
  if (vm.galleryCgFullscreen) {
    var curCg = CG_LIST[vm.galleryCgIndex || 0] || CG_LIST[0];
    return h('div', { staticStyle: S('gallery-fs-root') }, [
      h('image', {
        staticStyle: S('gallery-fs-img'),
        attrs: { src: curCg.src }
      }),
      h('div', { staticStyle: S('gallery-fs-bar') }, [
        h('text', { staticStyle: S('gallery-fs-title') }, (curCg.idx + 1) + '/6 · ' + curCg.title + ' [' + curCg.tag + ']'),
        h('div', { staticStyle: S('gallery-fs-actions') }, [
          h('div', {
            staticStyle: S('gallery-fs-btn'),
            on: { click: function () { vm.prevFullscreenCg(); } }
          }, [
            h('text', { staticStyle: S('gallery-fs-btn-text') }, '‹ 上一张')
          ]),
          h('div', {
            staticStyle: S('gallery-fs-btn'),
            on: { click: function () { vm.nextFullscreenCg(); } }
          }, [
            h('text', { staticStyle: S('gallery-fs-btn-text') }, '下一张 ›')
          ]),
          h('div', {
            staticStyle: S('gallery-fs-btn'),
            on: { click: function () { vm.exitFullscreenCg(); } }
          }, [
            h('text', { staticStyle: S('gallery-fs-btn-text') }, '✕ 退出全屏')
          ])
        ])
      ])
    ]);
  }

  // 2. 正常鉴赏模式（顶部 4 标签栏）
  var topHeader = h('div', { staticStyle: S('gallery-header') }, [
    h('text', { staticStyle: S('gallery-title') }, '◆ 鉴赏 EXTRA ◆'),
    h('div', { staticStyle: S('gallery-tabs') }, [
      h('div', {
        staticStyle: tab === 'cg' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('cg'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, 'CG鉴赏')
      ]),
      h('div', {
        staticStyle: tab === 'bgm' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('bgm'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, '音乐鉴赏')
      ]),
      h('div', {
        staticStyle: tab === 'stand' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('stand'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, '立绘鉴赏')
      ]),
      h('div', {
        staticStyle: tab === 'scene' ? S('gallery-tab-item gallery-tab-active') : S('gallery-tab-item'),
        on: { click: function () { vm.setGalleryTab('scene'); } }
      }, [
        h('text', { staticStyle: S('gallery-tab-text') }, '场景回想')
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

  // TAB 1: CG 鉴赏
  if (tab === 'cg') {
    var page = vm.galleryPage || 0;
    var slice = CG_LIST.slice(page * 3, page * 3 + 3);

    var cards = slice.map(function (it) {
      return h('div', {
        key: it.id,
        staticStyle: S('cg-card'),
        on: { click: function () { vm.openFullscreenCg(it.idx); } }
      }, [
        h('image', { staticStyle: S('cg-card-img'), attrs: { src: it.src } }),
        h('div', { staticStyle: S('cg-card-info') }, [
          h('text', { staticStyle: S('cg-card-title') }, it.title),
          h('div', { staticStyle: S('cg-card-badge') }, [
            h('text', { staticStyle: S('cg-card-badge-text') }, it.tag)
          ])
        ])
      ]);
    });

    bodyContent = h('div', { staticStyle: S('gallery-cg-container') }, [
      h('div', { staticStyle: S('gallery-cg-row') }, cards),
      h('div', { staticStyle: S('gallery-cg-footer') }, [
        h('text', { staticStyle: S('gallery-cg-tip') }, '轻触缩略图可全屏浏览高清画卷（支持上一张/下一张切换）'),
        h('div', { staticStyle: S('gallery-cg-pager') }, [
          h('div', {
            staticStyle: S('gallery-pager-btn'),
            on: { click: function () { vm.setGalleryPage(0); } }
          }, [
            h('text', { staticStyle: S('gallery-pager-text') }, '上卷 (芳乃/茉子/丛雨)')
          ]),
          h('div', {
            staticStyle: S('gallery-pager-btn'),
            on: { click: function () { vm.setGalleryPage(1); } }
          }, [
            h('text', { staticStyle: S('gallery-pager-text') }, '下卷 (蕾娜/小春/芦花)')
          ])
        ])
      ])
    ]);
  }

  // TAB 2: 音乐鉴赏
  else if (tab === 'bgm') {
    var currentBgmIdx = vm.galleryBgmIndex || 0;
    var curTrack = BGM_TRACKS[currentBgmIdx] || BGM_TRACKS[0];
    var isPlaying = !!vm.galleryPlayingBgm;

    var trackListItems = BGM_TRACKS.map(function (it, idx) {
      var isCurrent = currentBgmIdx === idx;
      var itemClass = 'gallery-bgm-item';
      if (isCurrent) itemClass += ' gallery-bgm-item-active';

      return h('div', {
        key: it.id,
        staticStyle: S(itemClass),
        on: { click: function () { vm.playGalleryBgm(idx); } }
      }, [
        h('div', { staticStyle: S('gallery-bgm-item-left') }, [
          h('text', { staticStyle: S('gallery-bgm-icon') }, (isCurrent && isPlaying) ? '▶' : '♫'),
          h('text', { staticStyle: S('gallery-bgm-name') }, (idx + 1) + '. ' + it.title)
        ]),
        h('text', { staticStyle: S('gallery-bgm-theme') }, it.theme)
      ]);
    });

    bodyContent = h('div', { staticStyle: S('gallery-bgm-container') }, [
      // 左侧：曲目列表
      h('div', { staticStyle: S('gallery-bgm-list') }, trackListItems),

      // 右侧：播放器面板
      h('div', { staticStyle: S('gallery-bgm-player') }, [
        h('div', { staticStyle: S('gallery-player-header') }, [
          h('text', { staticStyle: S('gallery-player-status') }, isPlaying ? '● 正在播放 (循环模式)' : '○ 播放已暂停'),
          h('text', { staticStyle: S('gallery-player-title') }, curTrack.title),
          h('text', { staticStyle: S('gallery-player-author') }, '作曲：' + curTrack.author + ' · ' + curTrack.theme)
        ]),
        h('div', { staticStyle: S('gallery-player-controls') }, [
          h('div', {
            staticStyle: S('gallery-player-btn'),
            on: { click: function () { vm.prevGalleryBgm(); } }
          }, [
            h('text', { staticStyle: S('gallery-player-btn-text') }, '‹ 上一曲')
          ]),
          h('div', {
            staticStyle: S('gallery-player-btn gallery-player-btn-primary'),
            on: { click: function () { vm.toggleGalleryBgmState(); } }
          }, [
            h('text', { staticStyle: S('gallery-player-btn-text') }, isPlaying ? '⏸ 暂停' : '▶ 播放')
          ]),
          h('div', {
            staticStyle: S('gallery-player-btn'),
            on: { click: function () { vm.stopGalleryBgm(); } }
          }, [
            h('text', { staticStyle: S('gallery-player-btn-text') }, '■ 停止')
          ]),
          h('div', {
            staticStyle: S('gallery-player-btn'),
            on: { click: function () { vm.nextGalleryBgm(); } }
          }, [
            h('text', { staticStyle: S('gallery-player-btn-text') }, '下一曲 ›')
          ])
        ])
      ])
    ]);
  }

  // TAB 3: 立绘鉴赏
  else if (tab === 'stand') {
    var curCharId = vm.galleryStandChar || 'yoshino';
    var curChar = null;
    for (var i = 0; i < STAND_CHARS.length; i++) {
      if (STAND_CHARS[i].id === curCharId) {
        curChar = STAND_CHARS[i];
        break;
      }
    }
    if (!curChar) curChar = STAND_CHARS[0];

    var curDress = vm.galleryStandDress || 0;
    var curFace = vm.galleryStandFace || 0;

    var dressList = ['巫女服', '振袖私服', '夏日浴衣', '学院校服'];
    var faceList = ['微笑', '羞涩', '惊讶', '威严'];

    var charButtons = STAND_CHARS.map(function (it) {
      var isCurrent = curCharId === it.id;
      var btnClass = 'gallery-char-btn';
      if (isCurrent) btnClass += ' gallery-char-active';

      return h('div', {
        key: it.id,
        staticStyle: S(btnClass),
        on: { click: function () { vm.selectStandChar(it.id); } }
      }, [
        h('text', { staticStyle: S('gallery-char-text') }, it.tag + ' ' + it.name)
      ]);
    });

    var dressButtons = dressList.map(function (d, idx) {
      return h('div', {
        key: 'dress_' + idx,
        staticStyle: curDress === idx ? S('gallery-opt-btn gallery-opt-active') : S('gallery-opt-btn'),
        on: { click: function () { vm.selectStandDress(idx); } }
      }, [
        h('text', { staticStyle: S('gallery-opt-text') }, d)
      ]);
    });

    var faceButtons = faceList.map(function (f, idx) {
      return h('div', {
        key: 'face_' + idx,
        staticStyle: curFace === idx ? S('gallery-opt-btn gallery-opt-active') : S('gallery-opt-btn'),
        on: { click: function () { vm.selectStandFace(idx); } }
      }, [
        h('text', { staticStyle: S('gallery-opt-text') }, f)
      ]);
    });

    bodyContent = h('div', { staticStyle: S('gallery-stand-container') }, [
      // 左侧：6 女主选择
      h('div', { staticStyle: S('gallery-stand-chars') }, charButtons),

      // 右侧：立绘与换装控制台
      h('div', { staticStyle: S('gallery-stand-stage') }, [
        h('div', { staticStyle: S('gallery-stage-header') }, [
          h('text', { staticStyle: S('gallery-stage-name') }, curChar.tag + ' ' + curChar.name),
          h('text', { staticStyle: S('gallery-stage-title') }, curChar.title)
        ]),
        h('div', { staticStyle: S('gallery-stage-row') }, [
          h('text', { staticStyle: S('gallery-stage-label') }, '服装造型 :'),
          h('div', { staticStyle: S('gallery-stage-options') }, dressButtons)
        ]),
        h('div', { staticStyle: S('gallery-stage-row') }, [
          h('text', { staticStyle: S('gallery-stage-label') }, '神态表情 :'),
          h('div', { staticStyle: S('gallery-stage-options') }, faceButtons)
        ]),
        h('div', {
          staticStyle: S('gallery-voice-btn'),
          on: { click: function () { vm.playStandVoice(); } }
        }, [
          h('text', { staticStyle: S('gallery-voice-text') }, '试听【' + curChar.name + '】原版角色台词语音')
        ])
      ])
    ]);
  }

  // TAB 4: 场景回想
  else if (tab === 'scene') {
    var sceneCards = SCENES.map(function (s) {
      return h('div', {
        key: s.id,
        staticStyle: S('gallery-scene-card')
      }, [
        h('div', { staticStyle: S('gallery-scene-info') }, [
          h('text', { staticStyle: S('gallery-scene-name') }, s.name),
          h('text', { staticStyle: S('gallery-scene-desc') }, s.desc)
        ]),
        h('div', {
          staticStyle: S('gallery-scene-btn'),
          on: { click: function () { vm.jumpFromSceneMemory(s.line); } }
        }, [
          h('text', { staticStyle: S('gallery-scene-btn-text') }, '🎬 进入回想')
        ])
      ]);
    });

    bodyContent = h('div', { staticStyle: S('gallery-scene-container') }, sceneCards);
  }

  return h('div', { staticStyle: S('gallery-root') }, [
    topHeader,
    bodyContent
  ]);
}
