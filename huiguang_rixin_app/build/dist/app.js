// app.js —— 《晖光日新》应用入口（Falcon 真机契约版）
// 关键：入口只认 app.js.bin；必须设置 __AppClazz / App.meta / __loadModuleDefault / __KEYFRAMES，
// 并在 onLaunch 里 useDefaultBasePageClass。
import PageIndex from './page-entry.js';
import PageShell from './page-entry.js';
import Component from './Component.js';
import { BasePage } from './base-page.js';

function __loadModuleDefault(m) {
  return (m && typeof m === 'object' && m.default !== undefined) ? m.default : m;
}
globalThis.__loadModuleDefault = __loadModuleDefault;

function vlog(m) { try { console.warn('[huiguang] App: ' + m); } catch (e) {} }

var __pages = { title: Component, game: Component, caseboard: Component };

class App extends $falcon.App {
  constructor() { super(); vlog('ctor'); }
  onLaunch(o) {
    super.onLaunch(o || {});
    try { this.setViewPort(800); } catch (e) { vlog('setViewPort 未支持: ' + e); }
    try { $falcon.useDefaultBasePageClass(BasePage); } catch (e) { vlog('基类注册失败: ' + e); }
    vlog('onLaunch ok');
  }
  onShow() { super.onShow(); vlog('onShow'); }
  onHide() { super.onHide(); vlog('onHide'); }
  onDestroy() { super.onDestroy(); vlog('onDestroy'); }
}

App.meta = {
  name: '晖光日新',
  version: '1.0.0',
  isSingleJsBundle: false,
  pages: {
    title: 'pages/title/title.vue',
    game: 'pages/game/game.vue',
    caseboard: 'pages/caseboard/caseboard.vue'
  },
  options: { style: { lessPaths: ['styles'] } }
};

$falcon.__pages = __pages;
$falcon.__loadModuleDefault = __loadModuleDefault;
$falcon.__KEYFRAMES = $falcon.__KEYFRAMES || {};
$falcon.__AppClazz = App;
vlog('registered');

export default App;
