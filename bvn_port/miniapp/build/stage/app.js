import PageIndex from './index.js';
import PageShell from './shell.js';
import Component from './Component.js';
import { BasePage } from './BasePage.js';

function __loadModuleDefault(m) {
  return (m && typeof m === 'object' && m.default !== undefined) ? m.default : m;
}
globalThis.__loadModuleDefault = __loadModuleDefault;

var __pages = { game: Component };

class App extends $falcon.App {
  constructor() {
    super();
  }
  onLaunch(o) {
    super.onLaunch(o || {});
    this.setViewPort(960);
    $falcon.useDefaultBasePageClass(BasePage);
  }
}

App.meta = {
  name: '死神VS火影',
  version: '1.0.0',
  isSingleJsBundle: false,
  pages: { game: 'pages/game/game.vue' },
  options: { style: { lessPaths: ['styles'] } }
};

$falcon.__pages = __pages;
$falcon.__loadModuleDefault = __loadModuleDefault;
$falcon.__KEYFRAMES = $falcon.__KEYFRAMES || {};
$falcon.__AppClazz = App;

export default App;
