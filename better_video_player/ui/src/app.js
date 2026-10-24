import { BasePage } from './base-page.js'
import { detectScreen } from './utils/device.js'

class App extends $falcon.App {
  onLaunch(options) {
    super.onLaunch(options)
    try {
      console.log('[bpv] launch env=' + JSON.stringify($falcon.env || {}).slice(0, 200))
    } catch (e) { /* 日志失败不影响启动 */ }
    $falcon.useDefaultBasePageClass(BasePage)
    try { detectScreen() } catch (e) { /* 探测失败时播放页会再取 */ }
  }
  onShow() { super.onShow() }
  onHide() { super.onHide() }
  onDestroy() { super.onDestroy() }
}
export default App
