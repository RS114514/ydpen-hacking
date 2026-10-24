// 统一资源回收的页面基类（与 youdao-x5-fw3.4.6 真机验证过的实现一致）：
// 跟踪 $falcon.on token、timeout、interval，在 onUnload 的 finally 中释放。
// 页面生命周期钩子（onShow/onHide/onUnload）写在 .vue 的 methods 里，
// 由本基类转发到 $root（见下方 onShow/onHide/onUnload）。
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

  sleep(delay) {
    return new Promise((resolve) => this.setTimeout(resolve, delay));
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

export class BasePage extends ResourcePage {
  onLoad(options) {
    super.onLoad(options);
    this.options = options || {};
  }

  onNewOptions(options) {
    super.onNewOptions(options);
    this.options = options || {};
  }

  onShow() {
    super.onShow();
    if (this.$root && this.$root.onShow) this.$root.onShow();
  }

  onHide() {
    super.onHide();
    if (this.$root && this.$root.onHide) this.$root.onHide();
  }

  onUnload() {
    try {
      super.onUnload();
      if (this.$root && this.$root.onUnload) this.$root.onUnload();
    } finally {
      this.release();
    }
  }

  beforeVueInstantiate(Vue) {
    if (super.beforeVueInstantiate) super.beforeVueInstantiate(Vue);
    Vue.prototype.$workspace = globalThis.$workspace;
    Vue.prototype.$appid = globalThis.$appid;

    // 渲染/生命周期里的异常在笔端的表现是「整页黑」，而且没有任何提示——
    // 排查只能靠日志。这里挂全局错误钩子，把 阶段 + 组件名 + 报错 + 栈 写进设备日志
    // （笔端只落 console.warn/error，console.log 不落盘）。
    if (Vue && Vue.config && !Vue.config.__apcErrorHooked) {
      Vue.config.__apcErrorHooked = true;
      Vue.config.errorHandler = function (err, vm, info) {
        try {
          const name = (vm && vm.$options && vm.$options.name) || '?';
          const msg = (err && err.message) || String(err);
          const stack = (err && err.stack) || '';
          console.error('[vue] ' + info + ' @ ' + name + ' :: ' + msg + (stack ? '\n' + stack : ''));
        } catch (e) {
          /* 忽略 */
        }
      };
    }
  }
}
