// root.js —— 根组件（管理 title, game, caseboard 三大视图）
// 关键：Falcon/Weex 不认 CSS class（包里没有编译后的样式表），必须把 Styles.js 的样式
// 以 style 对象形式挂到每个节点上。这里统一包一层 h，把 class 自动翻成 style。
import ST from './Styles.js';
import { titleMethods, renderTitle } from './TitleView.js';
import { gameMethods, renderGame } from './GameView.js';
import { caseboardMethods, renderCaseboard } from './CaseboardView.js';

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
        return function (ev) { return f.apply(vm, arguments); };
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
    var np = null;
    if (props.class && !props.style) {
      np = {};
      for (var key in props) np[key] = props[key];
      np.style = styleOf(props.class);
    }
    if (props.on) {
      if (!np) { np = {}; for (var k2 in props) np[k2] = props[k2]; }
      np.on = bindHandlers(props.on, vm);
    }
    return h(tag, np || props, children);
  };
}

var methods = {
  onShow: function () {
    console.log('[Root] onShow, current view=' + this.view);
    if (this.view === 'title' && typeof this.initTitle === 'function') {
      this.initTitle();
    } else if (this.view === 'game' && typeof this.initGame === 'function') {
      this.initGame();
    } else if (this.view === 'caseboard' && typeof this.initCaseboard === 'function') {
      this.initCaseboard();
    }
  },
  onHide: function () {
    console.log('[Root] onHide');
  },
  onUnload: function () {
    console.log('[Root] onUnload');
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
