// page-entry.js —— 页面模块：default 导出继承 BasePage 的类；onLoad 里把 Vue 组件交给框架
// 注意：普通 Vue options 对象要用 setRootComponentOptions；setRootComponent 是给"Vue 组件类"的。
import { BasePage } from './BasePage.js';
import Component from './Component.js';

try { console.warn('[huiguang-ui] page module evaluated'); } catch (e) {}

function attach(page, comp) {
  try {
    if (page && typeof page.setRootComponentOptions === 'function') {
      page.setRootComponentOptions(comp);
      try { console.warn('[huiguang-ui] setRootComponentOptions 已调用'); } catch (e) {}
      return;
    }
  } catch (e) { try { console.warn('[huiguang-ui] setRootComponentOptions 抛错 ' + e); } catch (e2) {} }
  try {
    if (page && typeof page.setRootComponent === 'function') {
      page.setRootComponent(comp);
      try { console.warn('[huiguang-ui] setRootComponent 已调用(回退)'); } catch (e) {}
    }
  } catch (e) { try { console.warn('[huiguang-ui] setRootComponent 抛错 ' + e); } catch (e2) {} }
}

class PageRoot extends BasePage {
  onLoad(options) {
    super.onLoad(options);
    attach(this, Component);
  }
  onNewOptions(options) {
    super.onNewOptions(options);
    attach(this, Component);
  }
}

export default PageRoot;
