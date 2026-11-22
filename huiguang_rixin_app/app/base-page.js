// base-page.js —— 页面基类（真机验证过的写法）
// 跟踪 $falcon.on / timeout / interval，在 onUnload 里释放；生命周期转发给 $root（Vue 实例）。
import Component from './root.js';

class ResourcePage extends $falcon.Page {
  constructor() {
    super();
    this.falconOnTokens = [];
    this.timeoutTokens = [];
    this.intervalTokens = [];
  }

  on(name, callback) {
    var token = $falcon.on(name, callback);
    this.falconOnTokens.push([token, name]);
    return token;
  }

  off(name, token) {
    try { $falcon.off(name, token); } catch (e) {}
    var keep = [];
    for (var i = 0; i < this.falconOnTokens.length; i++) {
      if (this.falconOnTokens[i][0] !== token) keep.push(this.falconOnTokens[i]);
    }
    this.falconOnTokens = keep;
  }

  release() {
    for (var i = 0; i < this.falconOnTokens.length; i++) {
      try { $falcon.off(this.falconOnTokens[i][1], this.falconOnTokens[i][0]); } catch (e) {}
    }
    this.falconOnTokens = [];
    for (var j = 0; j < this.timeoutTokens.length; j++) { try { clearTimeout(this.timeoutTokens[j]); } catch (e) {} }
    for (var k = 0; k < this.intervalTokens.length; k++) { try { clearInterval(this.intervalTokens[k]); } catch (e) {} }
    this.timeoutTokens = [];
    this.intervalTokens = [];
  }
}

function attachRoot(page) {
  try { console.warn('[huiguang-ui] attachRoot, 有 setRootComponentOptions=' + (page && typeof page.setRootComponentOptions)); } catch (e0) {}
  try { console.warn('[huiguang-ui] attachRoot, 有 setRootComponentOptions=' + (page && typeof page.setRootComponentOptions)); } catch (e0) {}
  try {
    if (page && typeof page.setRootComponentOptions === 'function') {
      page.setRootComponentOptions(Component);
      if (page.$root) page.$root.$page = page;
      return true;
    }
  } catch (e) { try { console.warn('[huiguang-ui] setRootComponentOptions 抛错 ' + e); } catch (e2) {} }
  try {
    if (page && typeof page.setRootComponent === 'function') {
      page.setRootComponent(Component);
      if (page.$root) page.$root.$page = page;
      return true;
    }
  } catch (e) { try { console.warn('[huiguang-ui] setRootComponent 抛错 ' + e); } catch (e2) {} }
  return false;
}

export class BasePage extends ResourcePage {
  onLoad(options) {
    try { console.warn('[huiguang-ui] BasePage.onLoad'); } catch (e0) {}
    try { super.onLoad(options); } catch (e) { try { console.warn('[BasePage] onLoad super 抛错 ' + e); } catch (e2) {} }
    this.options = options || {};
    attachRoot(this);
    if (this.$root) this.$root.$page = this;
  }

  onNewOptions(options) {
    try { super.onNewOptions(options); } catch (e) {}
    this.options = options || {};
    attachRoot(this);
    if (this.$root) this.$root.$page = this;
  }

  onShow() {
    try { super.onShow(); } catch (e) {}
    if (this.$root) {
      this.$root.$page = this;
      if (this.$root.onShow) this.$root.onShow();
    }
  }

  onHide() {
    try { super.onHide(); } catch (e) {}
    if (this.$root && this.$root.onHide) this.$root.onHide();
  }

  onUnload() {
    try {
      try { super.onUnload(); } catch (e) {}
      if (this.$root && this.$root.onUnload) this.$root.onUnload();
    } finally {
      this.release();
    }
  }

  finish() {
    try {
      if (typeof super.finish === 'function') { super.finish(); return; }
    } catch (e) {}
    try {
      if (typeof $falcon !== 'undefined' && typeof $falcon.closeApp === 'function') { $falcon.closeApp(); return; }
    } catch (e) {}
  }

  beforeVueInstantiate(Vue) {
    if (super.beforeVueInstantiate) super.beforeVueInstantiate(Vue);
    Vue.prototype.$workspace = globalThis.$workspace;
    Vue.prototype.$appid = globalThis.$appid;
    Vue.prototype.$page = this;
  }
}

export default BasePage;
