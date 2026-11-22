// storage.js —— 持久化（真机 API 为异步 setStorage/getStorage；启动时 hydrate 到内存）
var SAVE_KEY = 'huiguang_rixin_saves';
var SET_KEY = 'huiguang_rixin_settings';
var MEM = { saves: {}, settings: { bgmVolume: 0.8, textSpeed: 30 } };
var HYDRATED = false;

export function hydrateStorage() {
  try {
    var st = $falcon.jsapi.storage;
    Promise.all([st.getStorage(SAVE_KEY), st.getStorage(SET_KEY)])
      .then(function (rs) {
        try { MEM.saves = rs[0] ? JSON.parse(rs[0]) : {}; } catch (e1) {}
        try { MEM.settings = rs[1] ? JSON.parse(rs[1]) : MEM.settings; } catch (e2) {}
        HYDRATED = true;
        console.warn('[huiguang] storage hydrated, slots=' + Object.keys(MEM.saves).length);
      })
      .catch(function (e) { console.warn('[huiguang] storage hydrate fail: ' + e); });
  } catch (e) { console.warn('[huiguang] hydrate throw ' + e); }
}

export function isHydrated() { return HYDRATED; }

function persist() {
  try {
    var st = $falcon.jsapi.storage;
    st.setStorage(SAVE_KEY, JSON.stringify(MEM.saves));
    st.setStorage(SET_KEY, JSON.stringify(MEM.settings));
  } catch (e) { console.warn('[huiguang] persist fail ' + e); }
}

export function readAllSaves() { return MEM.saves; }
export function writeAllSaves(x) { MEM.saves = x || {}; persist(); return true; }
export function saveSlotRecord(slotId, record) {
  MEM.saves[slotId] = Object.assign({}, record, { saveTime: new Date().toISOString().replace('T', ' ').substring(0, 19) });
  persist(); return true;
}
export function loadSlotRecord(slotId) { return MEM.saves[slotId] || null; }
export function readSettings() { return MEM.settings; }
export function writeSettings(d) { MEM.settings = d || MEM.settings; persist(); return true; }
export function clearAllData() { MEM.saves = {}; persist(); return true; }
