// storage.js —— 持久化存档与全局状态管理 (存至 /userdisk)

var STORAGE_KEY = 'huiguang_rixin_saves';
var SETTINGS_KEY = 'huiguang_rixin_settings';

export function readSettings() {
  try {
    if (typeof $falcon !== 'undefined' && $falcon.jsapi && $falcon.jsapi.storage) {
      var val = $falcon.jsapi.storage.get(SETTINGS_KEY);
      return val ? JSON.parse(val) : {};
    }
  } catch (e) {
    console.log('readSettings err: ' + e);
  }
  return { bgmVolume: 0.8, textSpeed: 30 };
}

export function writeSettings(data) {
  try {
    if (typeof $falcon !== 'undefined' && $falcon.jsapi && $falcon.jsapi.storage) {
      $falcon.jsapi.storage.set(SETTINGS_KEY, JSON.stringify(data));
      return true;
    }
  } catch (e) {
    console.log('writeSettings err: ' + e);
  }
  return false;
}

export function readAllSaves() {
  try {
    if (typeof $falcon !== 'undefined' && $falcon.jsapi && $falcon.jsapi.storage) {
      var val = $falcon.jsapi.storage.get(STORAGE_KEY);
      return val ? JSON.parse(val) : {};
    }
  } catch (e) {
    console.log('readAllSaves err: ' + e);
  }
  return {};
}

export function writeAllSaves(saves) {
  try {
    if (typeof $falcon !== 'undefined' && $falcon.jsapi && $falcon.jsapi.storage) {
      $falcon.jsapi.storage.set(STORAGE_KEY, JSON.stringify(saves));
      return true;
    }
  } catch (e) {
    console.log('writeAllSaves err: ' + e);
  }
  return false;
}

export function saveSlotRecord(slotId, record) {
  var all = readAllSaves();
  all[slotId] = Object.assign({}, record, {
    saveTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
  });
  return writeAllSaves(all);
}

export function loadSlotRecord(slotId) {
  var all = readAllSaves();
  return all[slotId] || null;
}
