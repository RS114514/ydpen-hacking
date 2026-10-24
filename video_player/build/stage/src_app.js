// app.js —— 应用入口（构建后为 app.js.bin）。契约见 ydpen-toolkit/reference/07-miniapp-dev-toolchain.md
import PageIndex from './index.js';
import PageShell from './shell.js';
import Component from './Component.js';
import { BasePage } from './BasePage.js';

function __loadModuleDefault(m) { return (m && typeof m === 'object' && m.default !== undefined) ? m.default : m; }
globalThis.__loadModuleDefault = __loadModuleDefault;
function vlog(m) { try { console.warn('[vp] A ' + m); } catch (e) {} }
var __pages = { index: Component, shell: Component };
class App extends $falcon.App {
  constructor() { super(); vlog('ctor'); }
  onLaunch(o) {
    super.onLaunch(o || {});
    this.setViewPort(800);
    $falcon.useDefaultBasePageClass(BasePage);
    vlog('onLaunch ok, viewport=800');
  }
  onShow() { super.onShow(); vlog('onShow'); }
  onHide() { super.onHide(); vlog('onHide'); }
  onDestroy() { super.onDestroy(); vlog('onDestroy'); }
}
App.meta = {
  name: '视频播放器', version: '1.0.0', isSingleJsBundle: false,
  pages: { index: 'pages/index/index.vue', shell: 'pages/index/shell.vue' },
  options: { style: { lessPaths: ['styles'] } },
};
$falcon.__pages = __pages;
$falcon.__loadModuleDefault = __loadModuleDefault;
$falcon.__KEYFRAMES = $falcon.__KEYFRAMES || {};
$falcon.__AppClazz = App;
vlog('registered');
export default App;
