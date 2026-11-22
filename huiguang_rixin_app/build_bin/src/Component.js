// root.js —— 根组件（管理 title, game, caseboard 三大视图）
// 真机适配三件事：
//   1) Falcon/Weex 不认 CSS class（包里没有编译后的样式表），把 Styles.js 的规则挂成 style 对象
//   2) 点击回调要绑到 Vue 实例上，否则 this 丢失
//   3) 图片/音频放包外 /userdisk/hg_data，src 用 file:// 前缀
import ST from './Styles.js';
import { titleMethods, renderTitle } from './TitleView.js';
import { gameMethods, renderGame } from './GameView.js';
import { caseboardMethods, renderCaseboard } from './CaseboardView.js';

var ASSET_ROOT = 'file:///userdisk/hg_data/';

function assetUrl(src) {
  if (typeof src === 'string' && src.indexOf('assets/') === 0) return ASSET_ROOT + src;
  return src;
}

function styleOf(cls) {
  var out = {};
  if (typeof cls !== 'string') return out;
  var parts = cls.split(/\s+/);
  for (var i = 0; i < parts.length; i++) {
    var rule = ST[parts[i]];
    if (rule) {
      for (var k in rule) out[k] = rule[k];
    }
  }
  return out;
}

function bindHandlers(on, vm) {
  var out = {};
  for (var name in on) {
    var fn = on[name];
    if (typeof fn === 'function') {
      out[name] = (function (f) {
        return function () { return f.apply(vm, arguments); };
      })(fn);
    } else {
      out[name] = fn;
    }
  }
  return out;
}

function withStyle(h, vm) {
  return function (tag, props, children) {
    if (!props) return h(tag, props, children);
    var np = {};
    var key;
    for (key in props) np[key] = props[key];
    if (props.class) {
      delete np.class;
      np.staticStyle = styleOf(props.class);
    }
    if (props.src) {
      delete np.src;
      var attrs = {};
      if (props.attrs) { for (key in props.attrs) attrs[key] = props.attrs[key]; }
      attrs.src = assetUrl(props.src);
      np.attrs = attrs;
    }
    if (props.on) np.on = bindHandlers(props.on, vm);
    return h(tag, np, children);
  };
}

var methods = {
  onShow: function () {
    console.warn('[Root] onShow, view=' + this.view);
    if (this.view === 'title' && typeof this.initTitle === 'function') {
      this.initTitle();
    } else if (this.view === 'game' && typeof this.initGame === 'function') {
      this.initGame();
    } else if (this.view === 'caseboard' && typeof this.initCaseboard === 'function') {
      this.initCaseboard();
    }
  },
  onHide: function () {
    console.warn('[Root] onHide');
  },
  onUnload: function () {
    console.warn('[Root] onUnload');
  }
};

var k;
for (k in titleMethods) methods[k] = titleMethods[k];
for (k in gameMethods) methods[k] = gameMethods[k];
for (k in caseboardMethods) methods[k] = caseboardMethods[k];

export default {
  name: 'index',
  data: function () {
    return {
      view: 'title', // 'title' | 'game' | 'caseboard'
      currentChapterId: 'ch36',
      chapterIntro: false,
      introShownFor: 'ch36',
      ngPlus: false,
      currentVolume: 'vol1_autumn',
      currentChapterId: 'ch01',
      currentLineIndex: 0,
      currentLocation: '仰山新楼 2F 走廊',
      currentSpeaker: '我',
      currentText: '九月的晨风穿过景行路两旁的百年梧桐，落叶在湿润的石板路上打着细碎的旋。高二的第一天，新逸夫楼的报告厅三楼迎来了新媒体社的新大本营。',
      actionMessage: '',
      selectedCaseId: 'case01',
      playerStats: {
        energy: 100,
        truth: 25,
        beauty: 30,
        body: 20,
        bond_yuxi: 85
      }
    };
  },
  methods: methods,
  render: function (h) {
    var hh = withStyle(h, this);
    if (this.view === 'game') {
      return renderGame(hh, this);
    } else if (this.view === 'caseboard') {
      return renderCaseboard(hh, this);
    }
    return renderTitle(hh, this);
  }
};
