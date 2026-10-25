// pages/afterstory/afterstory.js —— 6位女主专属后日谈物语与系统播报语音
import { S, log, getGal } from '../../common.js';

var HEROINES = [
  {
    key: 'yoshino',
    chapter: '115 · AFTER',
    name: '朝武 芳乃',
    role: '朝武神社巫女 / 神刀契约者',
    quote: '『我和将臣君两个人的故事，还没有结束呢……接下来，请多指教了。』',
    voice: 'yoshino_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/cg/ev112a_hd.png',
    line: 800
  },
  {
    key: 'mako',
    chapter: '211 · AFTER',
    name: '常陆 茉子',
    role: '朝武家护卫 / 忍者少女',
    quote: '『主公大人，今天也由茉子来守护您！无论什么时候都不许离开视线哦。』',
    voice: 'mako_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/cg/ev214a_hd.png',
    line: 400
  },
  {
    key: 'murasame',
    chapter: '317 · AFTER',
    name: '丛 雨',
    role: '丛雨丸之灵 / 幼刀幽灵',
    quote: '『吾之主人哟！五百年的等待终于迎来了最喜欢的日常，快来陪吾玩嘛！』',
    voice: 'murasame_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/cg/ev317a_hd.png',
    line: 560
  },
  {
    key: 'lena',
    chapter: '429 · AFTER',
    name: '蕾 娜',
    role: '芬兰留学生 / 绿茶爱好者',
    quote: '『Moi！将臣，穗织的温泉很棒，但最棒的……果然还是跟你在一起的时光♪』',
    voice: 'lena_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/cg/ev414a_hd.png',
    line: 250
  },
  {
    key: 'koharu',
    chapter: '513 · AFTER',
    name: '鞍马 小春',
    role: '甜品店学徒 / 温柔后辈',
    quote: '『前辈，今天我也做了新的和果子，请先尝一口……然后再告诉我喜不喜欢！』',
    voice: 'koharu_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/cg/ev505a_hd.png',
    line: 600
  },
  {
    key: 'roka',
    chapter: '523 · AFTER',
    name: '马场 芦花',
    role: '志那都庄老板娘 / 青梅竹马',
    quote: '『阿将，今天店里打烊了，来陪姐姐喝一杯吧。不许找借口溜掉哦～』',
    voice: 'roka_after.ogg',
    bg: 'file:///userdisk/SenrenBanka/cg/ev604a_hd.png',
    line: 46
  }
];

export var afterstoryMethods = {
  initAfterStory: function () {
    this.afterPanX = 0;
    this._asStartX = 0;
    this._asStartPanX = 0;
    this._asMoved = false;
    this.selectedAfterHeroine = 'yoshino';
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
      if (newX < -320) newX = -320;
      this.afterPanX = newX;
    }
  },
  onAsTouchEnd: function () {
    var self = this;
    setTimeout(function () {
      self._asMoved = false;
    }, 120);
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
    if (this._asMoved) return;
    log('start heroine story: ' + heroine.name + ', line=' + heroine.line);
    var G = getGal();
    if (G) {
      G.stopVoice();
    }
    this.currentLine = heroine.line || 0;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame();
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
          staticStyle: S('as-card')
        }, [
          // 卡片背景立绘/CG图
          h('image', {
            staticStyle: S('as-card-bg'),
            attrs: { src: heroine.bg }
          }),

          // 卡片内部信息
          h('div', { staticStyle: S('as-card-content') }, [
            // 顶部徽章与章节
            h('div', { staticStyle: S('as-card-top') }, [
              h('div', { staticStyle: S('as-card-badge') }, [
                h('text', { staticStyle: S('as-card-badge-text') }, '日后谈')
              ]),
              h('text', { staticStyle: S('as-card-chapter') }, heroine.chapter)
            ]),

            // 角色名字与身份
            h('div', { staticStyle: S('as-card-name-box') }, [
              h('text', { staticStyle: S('as-card-name') }, heroine.name),
              h('text', { staticStyle: S('as-card-role') }, heroine.role)
            ]),

            // 台词语录
            h('text', { staticStyle: S('as-card-quote') }, heroine.quote),

            // 底部操作区
            h('div', { staticStyle: S('as-card-bottom-actions') }, [
              h('div', {
                staticStyle: S('as-btn-voice'),
                on: { click: function () { vm.playHeroineVoice(heroine.voice); } }
              }, [
                h('text', { staticStyle: S('as-btn-voice-text') }, '♪ 播报语音')
              ]),
              h('div', {
                staticStyle: S('as-btn-play'),
                on: { click: function () { vm.startHeroineStory(heroine); } }
              }, [
                h('text', { staticStyle: S('as-btn-play-text') }, '▶ 开启物语')
              ])
            ])
          ])
        ])
      );
    })(HEROINES[i]);
  }

  return h('div', { staticStyle: S('as-root') }, [
    // 背景图
    h('image', {
      staticStyle: S('as-bg-img'),
      attrs: { src: 'file:///userdisk/SenrenBanka/bg/title_bg.png' }
    }),

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
          width: '1100px'
        })
      }, cards)
    ])
  ]);
}
