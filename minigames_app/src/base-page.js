import Component from './Component.js';

class ResourcePage extends $falcon.Page {
  constructor() {
    super();
    this.falconOnTokens = [];
    this.timeoutTokens = new Set();
    this.intervalTokens = new Set();
  }

  on(name, callback) {
    const token = $falcon.on(name, callback);
    this.falconOnTokens.push([token, name]);
    return token;
  }

  off(name, callbackOrToken) {
    $falcon.off(name, callbackOrToken);
    this.falconOnTokens = this.falconOnTokens.filter((item) => item[0] !== callbackOrToken);
  }

  setTimeout(callback, delay) {
    const token = setTimeout(() => {
      this.timeoutTokens.delete(token);
      callback();
    }, delay);
    this.timeoutTokens.add(token);
    return token;
  }

  clearTimeout(token) {
    clearTimeout(token);
    this.timeoutTokens.delete(token);
  }

  setInterval(callback, delay) {
    const token = setInterval(callback, delay);
    this.intervalTokens.add(token);
    return token;
  }

  clearInterval(token) {
    clearInterval(token);
    this.intervalTokens.delete(token);
  }

  release() {
    this.falconOnTokens.forEach((item) => $falcon.off(item[1], item[0]));
    this.falconOnTokens = [];
    this.timeoutTokens.forEach((token) => clearTimeout(token));
    this.intervalTokens.forEach((token) => clearInterval(token));
    this.timeoutTokens.clear();
    this.intervalTokens.clear();
  }
}

function attachRoot(page) {
  try {
    if (page && typeof page.setRootComponentOptions === 'function') {
      page.setRootComponentOptions(Component);
      try { console.warn('[minigames] setRootComponentOptions called'); } catch (e) {}
      return true;
    }
  } catch (e) { try { console.warn('[minigames] setRootComponentOptions error ' + e); } catch (e2) {} }
  try {
    if (page && typeof page.setRootComponent === 'function') {
      page.setRootComponent(Component);
      try { console.warn('[minigames] setRootComponent called'); } catch (e) {}
      return true;
    }
  } catch (e) { try { console.warn('[minigames] setRootComponent error ' + e); } catch (e2) {} }
  return false;
}

export class BasePage extends ResourcePage {
  onLoad(options) {
    try { super.onLoad(options); } catch (e) {}
    this.options = options || {};
    try { console.warn('[minigames] BasePage.onLoad called'); } catch (e) {}
    attachRoot(this);
  }

  onNewOptions(options) {
    try { super.onNewOptions(options); } catch (e) {}
    this.options = options || {};
    attachRoot(this);
  }

  onShow() {
    try { super.onShow(); } catch (e) {}
    if (this.$root && this.$root.onShow) this.$root.onShow();
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

  beforeVueInstantiate(Vue) {
    if (super.beforeVueInstantiate) super.beforeVueInstantiate(Vue);
    Vue.prototype.$workspace = globalThis.$workspace;
    Vue.prototype.$appid = globalThis.$appid;
  }
}

export default BasePage;
