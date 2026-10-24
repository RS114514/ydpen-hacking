import { BasePage } from './base-page.js';

// 逻辑画布宽度来自设备 profile（profiles/youdao-x5.md）：
// 有道 X5 的 Falcon UI 合成面为横向条带 800x254，物理面板 254x800（direction=270）。
// 因此本项目全部样式用**字面 px**书写，px == 逻辑像素（真机 1:1，不做缩放）。
const DESIGN_WIDTH = 800;

class App extends $falcon.App {
  constructor() {
    super();
  }

  onLaunch(options) {
    super.onLaunch(options);
    this.setViewPort(DESIGN_WIDTH);
    $falcon.useDefaultBasePageClass(BasePage);
  }

  onShow() {
    super.onShow();
  }

  onHide() {
    super.onHide();
  }

  onDestroy() {
    super.onDestroy();
  }
}

// 某些第三方库会探测 window / process（借自 doge-calculator 的写法）。
try {
  globalThis['window'] = {
    requestAnimationFrame,
    cancelAnimationFrame
  };
} catch (err) {
  /* 忽略 */
}

try {
  globalThis['process'] = {
    env: {
      NODE_ENV: 'production'
    }
  };
} catch (err) {
  /* 忽略 */
}

export default App;
