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

  onUnload() {
    try {
      this.falconOnTokens.forEach(([token]) => {
        $falcon.off(token);
      });
      this.falconOnTokens = [];
      this.timeoutTokens.forEach((token) => {
        clearTimeout(token);
      });
      this.timeoutTokens.clear();
      this.intervalTokens.forEach((token) => {
        clearInterval(token);
      });
      this.intervalTokens.clear();
    } catch (e) {}
  }
}

class BasePage extends ResourcePage {
  onShow() {
    super.onShow();
    if (this.$root && typeof this.$root.onShow === 'function') {
      try { this.$root.onShow(); } catch (e) {}
    }
  }

  onHide() {
    super.onHide();
    if (this.$root && typeof this.$root.onHide === 'function') {
      try { this.$root.onHide(); } catch (e) {}
    }
  }

  onUnload() {
    try {
      if (this.$root && typeof this.$root.onUnload === 'function') {
        try { this.$root.onUnload(); } catch (e) {}
      }
    } finally {
      super.onUnload();
    }
  }
}

export { BasePage };
export default BasePage;
