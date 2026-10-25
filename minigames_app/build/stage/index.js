import { BasePage } from './BasePage.js';
import Component from './Component.js';

function attach(page, comp) {
  try {
    if (page && typeof page.setRootComponentOptions === 'function') {
      page.setRootComponentOptions(comp);
      return;
    }
  } catch (e) {}
  try {
    if (page && typeof page.setRootComponent === 'function') {
      page.setRootComponent(comp);
    }
  } catch (e) {}
}

class PageMinigames extends BasePage {
  onLoad(options) {
    super.onLoad(options);
    attach(this, Component);
  }
  onNewOptions(options) {
    super.onNewOptions(options);
    attach(this, Component);
  }
}

export default PageMinigames;
