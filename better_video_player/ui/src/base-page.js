export class BasePage extends $falcon.Page {
  constructor(options) {
    super(options)
    this.falconOnTokens = []
    this.timeoutTokens = new Set()
    this.intervalTokens = new Set()
  }

  on(name, cb) {
    try {
      const token = $falcon.on(name, cb)
      this.falconOnTokens.push({ name, token })
      return token
    } catch (e) {
      console.log('[base-page] on failed ' + name + ' ' + e)
      return null
    }
  }

  setTimeout(fn, ms) {
    const id = setTimeout(() => {
      this.timeoutTokens.delete(id)
      fn()
    }, ms)
    this.timeoutTokens.add(id)
    return id
  }

  setInterval(fn, ms) {
    const id = setInterval(fn, ms)
    this.intervalTokens.add(id)
    return id
  }

  clearTimeout(id) {
    this.timeoutTokens.delete(id)
    clearTimeout(id)
  }

  clearInterval(id) {
    this.intervalTokens.delete(id)
    clearInterval(id)
  }

  sleep(ms) {
    return new Promise(resolve => this.setTimeout(resolve, ms))
  }

  release() {
    for (const { name, token } of this.falconOnTokens) {
      try { $falcon.off(name, token) } catch (e) { console.log('[base-page] off failed ' + name) }
    }
    this.falconOnTokens = []
    for (const id of this.timeoutTokens) clearTimeout(id)
    this.timeoutTokens.clear()
    for (const id of this.intervalTokens) clearInterval(id)
    this.intervalTokens.clear()
  }

  onLoad(options) {
    super.onLoad(options)
    this.options = options || {}
  }

  onUnload() {
    try {
      if (this.$root && typeof this.$root.onUnload === 'function') this.$root.onUnload()
    } catch (e) {
      console.log('[base-page] root onUnload failed ' + e)
    } finally {
      this.release()
    }
  }

  onShow() {
    super.onShow()
    if (this.$root && typeof this.$root.onShow === 'function') this.$root.onShow()
  }

  onHide() {
    super.onHide()
    if (this.$root && typeof this.$root.onHide === 'function') this.$root.onHide()
  }
}
