// pages/index/index.js —— 视频媒体库（列表页）视图（构建后为 ListView.js.bin）
// 数据源 /userdisk/Favorite/movies.json：[{name, path, size, duration?}]
import { S, fmtTime, getPlayer, parseNative, log } from '../../common.js';

var MOVIES_JSON = '/userdisk/Favorite/movies.json';
var MOVIES_DIR = '/userdisk/Favorite/Movies/';

function baseName(p) {
  var s = String(p || '');
  var i = s.lastIndexOf('/');
  return i >= 0 ? s.slice(i + 1) : s;
}

export var listMethods = {
  loadMovies: function () {
    var P = getPlayer();
    var txt = null;
    this.items = [];
    this.listError = '';
    try { txt = P && P.readText ? P.readText(MOVIES_JSON) : null; } catch (e) { txt = null; }
    if (!txt) { this.listLoaded = true; return; }
    try {
      var arr = JSON.parse(txt);
      var out = [];
      var needSave = false;
      if (Array.isArray(arr)) {
        for (var i = 0; i < arr.length; i++) {
          var it = arr[i] || {};
          if (!it.path) continue;
          var durMs = it.durationMs || (typeof it.duration === 'number' ? it.duration * 1000 : 0);
          var w = it.width || 0;
          var h = it.height || 0;

          // 若缺少时长或分辨率，调用原生 probe 快速探测
          if ((durMs <= 0 || w <= 0) && P && typeof P.probe === 'function') {
            try {
              var pinfo = parseNative(P.probe(it.path));
              if (pinfo && pinfo.ok) {
                if (durMs <= 0 && pinfo.durationMs > 0) { durMs = pinfo.durationMs; needSave = true; }
                if (w <= 0 && pinfo.width > 0) { w = pinfo.width; h = pinfo.height; needSave = true; }
              }
            } catch (err) { /* 忽略单个探测错误 */ }
          }

          var dText = durMs > 0 ? fmtTime(durMs) : (typeof it.duration === 'string' && it.duration ? it.duration : '--:--');
          out.push({
            name: String(it.name || baseName(it.path)),
            path: String(it.path),
            size: it.size ? String(it.size) : '',
            durText: dText,
            durationMs: durMs,
            width: w,
            height: h,
          });
        }

        // 若探测到新元数据，写回 movies.json 缓存
        if (needSave && P && typeof P.writeText === 'function') {
          try {
            var saveList = [];
            for (var j = 0; j < out.length; j++) {
              saveList.push({
                name: out[j].name,
                path: out[j].path,
                size: out[j].size,
                width: out[j].width,
                height: out[j].height,
                durationMs: out[j].durationMs,
              });
            }
            P.writeText(MOVIES_JSON, JSON.stringify(saveList, null, 2));
          } catch (e) { /* 忽略写入异常 */ }
        }
      }
      this.items = out;
    } catch (e) {
      this.listError = 'movies.json 解析失败';
      log('movies.json parse error ' + e);
    }
    this.listLoaded = true;
    log('loaded ' + this.items.length + ' movies');
  },
};

export function renderList(vm, h) {
  var body;
  if (vm.items.length === 0) {
    body = h('div', { staticStyle: S('empty-wrap') }, [
      h('text', { staticStyle: S('empty-title') }, vm.listError || (vm.listLoaded ? '还没有本地视频' : '正在读取媒体库…')),
      h('text', { staticStyle: S('empty-hint') }, '请把视频文件放入'),
      h('text', { staticStyle: S('empty-path') }, MOVIES_DIR),
    ]);
  } else {
    var cards = vm.items.map(function (it, i) {
      return h('div', {
        key: 'm' + i,
        staticStyle: S('movie-card'),
        on: { click: function () { vm.openItem(it); } },
      }, [
        h('div', { staticStyle: S('movie-badge') }, [
          h('text', { staticStyle: S('movie-badge-text') }, '▶'),
        ]),
        h('text', { staticStyle: S('movie-name') }, it.name),
        h('text', { staticStyle: S('movie-duration') }, it.durText),
        h('text', { staticStyle: S('movie-size') }, it.size),
      ]);
    });
    cards.push(h('div', { key: 'pad', staticStyle: S('list-pad') }));
    body = h('scroller', { staticStyle: S('lib-scroller') }, cards);
  }

  return h('div', { staticStyle: S('list-root') }, [
    h('div', { staticStyle: S('lib-header') }, [
      h('text', { staticStyle: S('lib-title') }, '视频播放器'),
      h('text', { staticStyle: S('lib-count') }, vm.items.length + ' 个视频'),
      h('div', { staticStyle: S('btn-refresh'), on: { click: function () { vm.loadMovies(); } } }, [
        h('text', { staticStyle: S('btn-refresh-text') }, '刷新'),
      ]),
    ]),
    body,
  ]);
}
