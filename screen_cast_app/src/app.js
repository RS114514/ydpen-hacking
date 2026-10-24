import PageIndex from './index.js';
import PageShell from './shell.js';
import Component from './Component.js';
import { BasePage } from './BasePage.js';

function __loadModuleDefault(m) { return (m && typeof m === 'object' && m.default !== undefined) ? m.default : m; }
globalThis.__loadModuleDefault = __loadModuleDefault;

var __pages = { index: Component, shell: Component };

class App extends $falcon.App {
  constructor() { super(); }
  onLaunch(o) {
    super.onLaunch(o || {});
    this.setViewPort(800);
    $falcon.useDefaultBasePageClass(BasePage);
  }
  onShow() { super.onShow(); }
  onHide() { super.onHide(); }
  onDestroy() { super.onDestroy(); }
}

App.meta = {
  name: '投屏',
  version: '1.0.0',
  isSingleJsBundle: false,
  pages: { index: 'pages/index/index.vue', shell: 'pages/index/shell.vue' },
  options: { style: { lessPaths: ['styles'] } }
};

$falcon.__pages = __pages;
$falcon.__loadModuleDefault = __loadModuleDefault;
$falcon.__KEYFRAMES = $falcon.__KEYFRAMES || {};
$falcon.__AppClazz = App;

export default App;
