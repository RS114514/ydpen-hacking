// 面板视图意图：对话页点「模型/参数/自检」时先记下要进哪个区块，再 navTo('panel')。
//
// 为什么不用 navTo 的参数传值：平台侧 `$falcon.navTo(name)` 的第二个参数语义没有验证过
// （样例也都是一参调用）。用模块级变量最稳：同一个 QuickJS 实例内，navTo 之前写、
// panel 的 created 里读，时序是确定的。
//
// 顺带落一份存储，这样下次进面板还能回到上次那个区块。
import { KEYS, getJson, setJson } from './storage.js';

let panelView = 'models';

export function getPanelView() {
  return panelView;
}

export function setPanelView(v) {
  if (!v) return panelView;
  panelView = v;
  try {
    setJson(KEYS.panelView, v);
  } catch (e) {
    /* 存储失败不影响切换 */
  }
  return panelView;
}

// 冷启动直接进面板时（正常流程不会，桌面总是先进对话页）用存储里的值补一下
export async function loadPanelView() {
  try {
    const v = await getJson(KEYS.panelView, null);
    if (typeof v === 'string' && v) panelView = v;
  } catch (e) {
    /* 读不到就用默认值 */
  }
  return panelView;
}
