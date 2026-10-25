// pages/afterstory/afterstory.js —— 6位女主专属后日谈物语与系统播报语音
import { S, log, getGal } from '../../common.js';
import { after_yoshino } from '../../data/after_yoshino.js';
import { after_mako } from '../../data/after_mako.js';
import { after_murasame } from '../../data/after_murasame.js';
import { after_rena } from '../../data/after_rena.js';
import { after_koharu } from '../../data/after_koharu.js';
import { after_roka } from '../../data/after_roka.js';

var HEROINES = [
  {
    key: 'yoshino',
    chapter: '115 · AFTER',
    name: '朝武 芳乃',
    lines: after_yoshino,
    voice: 'yoshino_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/bg/ema/ema_12.jpg'
  },
  {
    key: 'mako',
    chapter: '211 · AFTER',
    name: '常陆 茉子',
    lines: after_mako,
    voice: 'mako_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/bg/ema/ema_13.jpg'
  },
  {
    key: 'murasame',
    chapter: '317 · AFTER',
    name: '丛 雨',
    lines: after_murasame,
    voice: 'murasame_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/bg/ema/ema_14.jpg'
  },
  {
    key: 'rena',
    chapter: '429 · AFTER',
    name: '蕾 娜',
    lines: after_rena,
    voice: 'lena_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/bg/ema/ema_06.jpg'
  },
  {
    key: 'koharu',
    chapter: '513 · AFTER',
    name: '鞍马 小春',
    lines: after_koharu,
    voice: 'koharu_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/bg/ema/ema_09.jpg'
  },
  {
    key: 'roka',
    chapter: '523 · AFTER',
    name: '马场 芦花',
    lines: after_roka,
    voice: 'roka_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/bg/ema/ema_01.jpg'
  }
];

for (var i = 0; i < HEROINES.length; i++) {
  HEROINES[i].lineCount = HEROINES[i].lines.length;
  HEROINES[i].voiceCount = HEROINES[i].lines.filter(function (line) {
    return !!line[3];
  }).length;
}

var AS_VIEWPORT_WIDTH = 800;
var AS_VIEWPORT_HEIGHT = 192;
var AS_CARD_WIDTH = 180;
var AS_CARD_GAP = 12;
var AS_LIST_PADDING = 12;
var AS_CONTENT_WIDTH = HEROINES.length * (AS_CARD_WIDTH + AS_CARD_GAP) + AS_LIST_PADDING * 2;
var AS_MIN_PAN = Math.min(0, AS_VIEWPORT_WIDTH - AS_CONTENT_WIDTH);

export var afterstoryMethods = {
  initAfterStory: function () {
    this.afterPanX = 0;
    this._asStartX = 0;
    this._asStartPanX = 0;
    this._asMoved = false;
    if (!this.selectedAfterHeroine) {
      this.selectedAfterHeroine = 'yoshino';
    }
  },
  onAsTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._asStartX = t.pageX || t.clientX || 0;
      this._asStartPanX = this.afterPanX || 0;
      this._asMoved = false;
    }
  },
  onAsTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var dx = cx - this._asStartX;
      if (Math.abs(dx) > 6) {
        this._asMoved = true;
      }
      var newX = this._asStartPanX + dx;
      if (newX > 0) newX = 0;
      if (newX < AS_MIN_PAN) newX = AS_MIN_PAN;
      this.afterPanX = newX;
    }
  },
  onAsTouchEnd: function () {
    var self = this;
    setTimeout(function () {
      self._asMoved = false;
    }, 120);
  },
  selectAfterHeroine: function (heroine) {
    if (this._asMoved || !heroine) return;
    this.selectedAfterHeroine = heroine.key;
    this.playHeroineVoice(heroine.voice);
  },
  playHeroineVoice: function (voiceFile) {
    if (this._asMoved) return;
    log('play heroine voice: ' + voiceFile);
    var G = getGal();
    if (G && voiceFile) {
      G.stopVoice();
      G.playVoice('/userdisk/SenrenBanka/voice/' + voiceFile, 1.0);
    }
  },
  startHeroineStory: function (heroine) {
    if (this._asMoved || !heroine) return;
    log('start heroine story: after_' + heroine.key);
    var G = getGal();
    if (G) {
      G.stopVoice();
    }
    this.selectedAfterHeroine = heroine.key;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame('after_' + heroine.key, 0);
    }
  },
  returnToTitleFromAs: function () {
    var G = getGal();
    if (G) {
      G.stopVoice();
    }
    this.view = 'title';
    if (typeof this.initTitle === 'function') {
      this.initTitle();
    }
  }
};

export function renderAfterstory(vm, h) {
  var cards = [];
  for (var i = 0; i < HEROINES.length; i++) {
    (function (heroine) {
      cards.push(
        h('div', {
          key: heroine.key,
          staticStyle: S(vm.selectedAfterHeroine === heroine.key ? 'as-card as-card-active' : 'as-card'),
          on: { click: function () { vm.selectAfterHeroine(heroine); } }
        }, [
          // 顶部 16:9 绘马图像区（独立区域，不整卡拉伸）
          h('div', { staticStyle: S('as-card-cover') }, [
            h('image', {
              staticStyle: S('as-card-cover-img'),
              attrs: { src: heroine.bg }
            }),
            // 图片上只保留小尺寸章节角标
            h('div', { staticStyle: S('as-card-chapter-badge') }, [
              h('text', { staticStyle: S('as-card-chapter') }, heroine.chapter)
            ])
          ]),

          // 底部信息区：角色名 / 真实台词与语音数量 / 操作按钮
          h('div', { staticStyle: S('as-card-info') }, [
            h('text', { staticStyle: S('as-card-name') }, heroine.name),

            // 由真实后日谈数组计算的台词与语音数量
            h('text', {
              staticStyle: S('as-card-stats')
            }, heroine.lineCount + ' 句台词 · ' + heroine.voiceCount + ' 条语音'),

            // 底部操作区
            h('div', { staticStyle: S('as-card-bottom-actions') }, [
              h('div', {
                staticStyle: S('as-btn-voice'),
                on: { click: function (e) {
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  vm.selectAfterHeroine(heroine);
                } }
              }, [
                h('text', { staticStyle: S('as-btn-voice-text') }, '♪ 播报')
              ]),
              h('div', {
                staticStyle: S('as-btn-play'),
                on: { click: function (e) {
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  vm.startHeroineStory(heroine);
                } }
              }, [
                h('text', { staticStyle: S('as-btn-play-text') }, '▶ 进入后日谈物语')
              ])
            ])
          ])
        ])
      );
    })(HEROINES[i]);
  }

  return h('div', { staticStyle: S('as-root') }, [
    // 背景图（opacity 0.5 清晰可见）
    h('image', {
      staticStyle: S('as-bg-img'),
      attrs: { src: 'file:///userdisk/SenrenBanka/bg/title_bg.png' }
    }),

    // 轻微压暗层，保证亮背景上的标题仍可读
    h('div', { staticStyle: S('as-bg-shade') }),

    // 顶部导航栏
    h('div', { staticStyle: S('as-header') }, [
      h('div', { staticStyle: S('as-title-box') }, [
        h('text', { staticStyle: S('as-title-text') }, '◆ 日后谈 AFTER STORY ◆'),
        h('text', { staticStyle: S('as-subtitle') }, '6 位女主角专属追加物语 · 轻触按键播放播报语音')
      ]),
      h('div', {
        staticStyle: S('as-btn-back'),
        on: { click: function () { vm.returnToTitleFromAs(); } }
      }, [
        h('text', { staticStyle: S('as-btn-back-text') }, '返回标题')
      ])
    ]),

    // 滑动画廊视口
    h('div', {
      staticStyle: S('as-viewport'),
      on: {
        touchstart: function (e) { vm.onAsTouchStart(e); },
        touchmove: function (e) { vm.onAsTouchMove(e); },
        touchend: function () { vm.onAsTouchEnd(); }
      }
    }, [
      h('div', {
        staticStyle: S('as-card-list', {
          left: (vm.afterPanX || 0) + 'px',
          width: AS_CONTENT_WIDTH + 'px',
          height: AS_VIEWPORT_HEIGHT + 'px'
        })
      }, cards)
    ])
  ]);
}
