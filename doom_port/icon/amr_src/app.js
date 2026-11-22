import PageIndex from './index.js';
import Component from './Component.js';
import { BasePage } from './BasePage.js';

function __loadModuleDefault(m) { return (m && typeof m === 'object' && m.default !== undefined) ? m.default : m; }
globalThis.__loadModuleDefault = __loadModuleDefault;
function dlog(m) { try { console.warn('[doom] App ' + m); } catch (e) {} }
var __pages = { index: Component };
class App extends $falcon.App {
  constructor() { super(); dlog('ctor'); }
  onLaunch(o) { super.onLaunch(o || {}); this.setViewPort(960); $falcon.useDefaultBasePageClass(BasePage); dlog('onLaunch ok'); }
  onShow() { super.onShow(); dlog('onShow'); }
  onHide() { super.onHide(); dlog('onHide'); }
  onDestroy() { super.onDestroy(); dlog('onDestroy'); }
}
App.meta = {
  name: 'DOOM', version: '1.0.1', isSingleJsBundle: false,
  pages: { index: 'index' }, options: {}
};
$falcon.__pages = __pages;
$falcon.__loadModuleDefault = __loadModuleDefault;
$falcon.__KEYFRAMES = $falcon.__KEYFRAMES || {};
$falcon.__AppClazz = App;
dlog('registered');
export default App;
