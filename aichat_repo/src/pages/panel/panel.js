import PanelComponent from './panel.vue';
import { BasePage } from '../../base-page.js';

// 页面必须有自己的 .js 包装（onLoad 里 setRootComponent）：
// app.json 只指向 .vue 时依赖 $falcon.useDefaultBasePageClass()，漏了就黑屏（实测踩过）。
class PagePanel extends BasePage {
  constructor() {
    super();
  }

  onLoad(options) {
    super.onLoad(options);
    this.setRootComponent(PanelComponent);
  }

  onNewOptions(options) {
    super.onNewOptions(options);
  }
}

export default PagePanel;
