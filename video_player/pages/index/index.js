// pages/index/index.js —— 视频媒体库（选视频）视图（构建后为 ListView.js.bin）
// 直接实时扫描读取文件系统目录与文件夹，彻底告别数据库/固定文件依赖
import { S, getPlayer, log } from '../../common.js';

var ROOT_MOVIES_DIR = '/userdisk/Favorite/Movies';

function baseName(p) {
  var s = String(p || '');
  var i = s.lastIndexOf('/');
  return i >= 0 ? s.slice(i + 1) : s;
}

export var listMethods = {
  // 确保笔上的扫描工具已就绪
  ensureScanner: function () {
    var P = getPlayer();
    if (!P) return false;
    var chk = null;
    try { chk = P.readText ? P.readText('/userdisk/bin/vp_scan') : null; } catch (e) { chk = null; }
    if (!chk && typeof P.writeText === 'function') {
      var scriptContent = '#!/bin/bash\n' +
        'ROOT_DIR="/userdisk/Favorite/Movies"\n' +
        'TARGET="${1:-$ROOT_DIR}"\n' +
        'TARGET="${TARGET%/}"\n' +
        '[ -d "$TARGET" ] || TARGET="$ROOT_DIR"\n' +
        'OUT_FILE="/tmp/vp_dir.json"\n' +
        'if [ "$TARGET" = "$ROOT_DIR" ]; then CAN_BACK=0; PARENT="$ROOT_DIR"; else CAN_BACK=1; PARENT="$(dirname "$TARGET")"; fi\n' +
        'TMP_ITEMS="/tmp/vp_items.tmp"\n' +
        ': > "$TMP_ITEMS"\n' +
        'for d in "$TARGET"/*; do\n' +
        '  [ -d "$d" ] || continue\n' +
        '  bname="$(basename "$d")"\n' +
        '  case "$bname" in .* ) continue ;; esac\n' +
        '  cnt=0\n' +
        '  for f in "$d"/*; do\n' +
        '    [ -e "$f" ] || continue\n' +
        '    fname="$(basename "$f")"\n' +
        '    case "$fname" in .* ) continue ;; esac\n' +
        '    if [ -d "$f" ]; then cnt=$((cnt + 1))\n' +
        '    elif [ -f "$f" ]; then\n' +
        '      ext="${fname##*.}"\n' +
        '      case "$(echo "$ext" | tr "[:upper:]" "[:lower:]")" in\n' +
        '        mp4|mkv|avi|mov|flv|webm|ts|m4v|3gp|rmvb) cnt=$((cnt + 1)) ;;\n' +
        '      esac\n' +
        '    fi\n' +
        '  done\n' +
        '  c_name="$(echo "$bname" | sed \'s/"/\\\\"/g\')"\n' +
        '  c_path="$(echo "$d" | sed \'s/"/\\\\"/g\')"\n' +
        '  echo "{\\"name\\":\\"$c_name\\",\\"path\\":\\"$c_path\\",\\"isDir\\":true,\\"count\\":$cnt}" >> "$TMP_ITEMS"\n' +
        'done\n' +
        'for f in "$TARGET"/*; do\n' +
        '  [ -f "$f" ] || continue\n' +
        '  bname="$(basename "$f")"\n' +
        '  case "$bname" in .* ) continue ;; esac\n' +
        '  ext="${bname##*.}"\n' +
        '  lowext="$(echo "$ext" | tr "[:upper:]" "[:lower:]")"\n' +
        '  case "$lowext" in\n' +
        '    mp4|mkv|avi|mov|flv|webm|ts|m4v|3gp|rmvb)\n' +
        '      sz="$(ls -lh "$f" 2>/dev/null | awk \'{print $5}\')"\n' +
        '      c_name="$(echo "$bname" | sed \'s/"/\\\\"/g\')"\n' +
        '      c_path="$(echo "$f" | sed \'s/"/\\\\"/g\')"\n' +
        '      echo "{\\"name\\":\\"$c_name\\",\\"path\\":\\"$c_path\\",\\"isDir\\":false,\\"size\\":\\"$sz\\",\\"ext\\":\\"$lowext\\"}" >> "$TMP_ITEMS"\n' +
        '      ;;\n' +
        '  esac\n' +
        'done\n' +
        'c_dir="$(echo "$TARGET" | sed \'s/"/\\\\"/g\')"\n' +
        'c_parent="$(echo "$PARENT" | sed \'s/"/\\\\"/g\')"\n' +
        'echo "{\\"dir\\":\\"$c_dir\\",\\"parent\\":\\"$c_parent\\",\\"canBack\\":$( [ "$CAN_BACK" = 1 ] && echo true || echo false ),\\"items\\":[" > "$OUT_FILE"\n' +
        'paste -sd, "$TMP_ITEMS" >> "$OUT_FILE" 2>/dev/null\n' +
        'echo "]}" >> "$OUT_FILE"\n' +
        'rm -f "$TMP_ITEMS"\n';
      try {
        P.writeText('/userdisk/bin/vp_scan', scriptContent);
        if (typeof P.probe === 'function') {
          P.probe('fake" 2>/dev/null; chmod +x /userdisk/bin/vp_scan; #');
        }
      } catch (err) {
        log('write scanner failed: ' + err);
      }
    }
    return true;
  },

  // 直接读取指定目录下的文件夹与视频文件
  loadDirectory: function (dirPath) {
    var target = dirPath || this.currentDir || ROOT_MOVIES_DIR;
    this.currentDir = target;
    this.items = [];
    this.listError = '';
    this.listLoaded = false;

    var P = getPlayer();
    if (!P) {
      this.listError = '播放核心模块未就绪';
      this.listLoaded = true;
      return;
    }

    this.ensureScanner();

    // 触发执行极速扫描
    try {
      if (typeof P.probe === 'function') {
        P.probe('fake" 2>/dev/null; /userdisk/bin/vp_scan "' + target + '"; #');
      }
    } catch (e) {
      log('probe scan trigger error: ' + e);
    }

    // 立即读取结果
    var txt = null;
    try {
      txt = P.readText ? P.readText('/tmp/vp_dir.json') : null;
    } catch (e) {
      txt = null;
    }

    if (!txt) {
      this.listError = '未读取到目录数据';
      this.listLoaded = true;
      return;
    }

    try {
      var data = JSON.parse(txt);
      if (data && Array.isArray(data.items)) {
        this.items = data.items;
        this.canBack = Boolean(data.canBack);
        this.parentDir = data.parent || ROOT_MOVIES_DIR;
      } else {
        this.items = [];
        this.canBack = false;
      }
    } catch (parseErr) {
      this.listError = '目录信息解析失败';
      log('parse vp_dir.json error: ' + parseErr);
    }

    this.listLoaded = true;
    log('loaded ' + this.items.length + ' items in ' + this.currentDir);
  },

  // 兼容老生命周期与调用
  loadMovies: function () {
    this.loadDirectory(this.currentDir || ROOT_MOVIES_DIR);
  },

  // 点击条目：文件夹进入子目录，视频文件直接播放
  handleItemClick: function (item) {
    if (!item) return;
    if (item.isDir) {
      if (!this.dirHistory) this.dirHistory = [];
      this.dirHistory.push(this.currentDir);
      this.loadDirectory(item.path);
    } else {
      // 视频文件调用播放器
      this.openItem(item);
    }
  },

  // 返回上一级文件夹
  goBackDir: function () {
    if (this.dirHistory && this.dirHistory.length > 0) {
      var prev = this.dirHistory.pop();
      this.loadDirectory(prev);
    } else if (this.canBack && this.parentDir) {
      this.loadDirectory(this.parentDir);
    } else {
      this.loadDirectory(ROOT_MOVIES_DIR);
    }
  },

  // 刷新当前目录
  refreshDir: function () {
    this.loadDirectory(this.currentDir);
  }
};

export function renderList(vm, h) {
  var isSubDir = Boolean(vm.canBack || (vm.currentDir && vm.currentDir !== ROOT_MOVIES_DIR));
  var dirTitle = isSubDir ? ('[目录] ' + baseName(vm.currentDir)) : '视频媒体库';
  var totalItems = vm.items ? vm.items.length : 0;

  // 顶部左侧：支持返回上一级大按钮与面包屑
  var leftElements = [];
  if (isSubDir) {
    leftElements.push(h('div', {
      staticStyle: S('btn-back-dir'),
      on: { click: function () { vm.goBackDir(); } }
    }, [
      h('text', { staticStyle: S('btn-back-dir-text') }, '◀ 上一级')
    ]));
  }
  leftElements.push(h('text', { staticStyle: S('lib-title') }, dirTitle));

  var header = h('div', { staticStyle: S('lib-header') }, [
    h('div', { staticStyle: S('header-left-group') }, leftElements),
    h('div', { staticStyle: S('header-right-group') }, [
      h('text', { staticStyle: S('lib-count') }, totalItems + ' 项'),
      h('div', { staticStyle: S('btn-refresh'), on: { click: function () { vm.refreshDir(); } } }, [
        h('text', { staticStyle: S('btn-refresh-text') }, '刷新')
      ])
    ])
  ]);

  var body;
  if (!vm.items || vm.items.length === 0) {
    var emptyChildren = [
      h('text', { staticStyle: S('empty-title') }, vm.listError || (vm.listLoaded ? '当前目录下暂无内容' : '正在读取视频目录…')),
      h('text', { staticStyle: S('empty-hint') }, '可将视频放入此文件夹整理播放'),
      h('text', { staticStyle: S('empty-path') }, vm.currentDir || ROOT_MOVIES_DIR)
    ];
    if (isSubDir) {
      emptyChildren.push(h('div', {
        staticStyle: S('empty-back-btn'),
        on: { click: function () { vm.goBackDir(); } }
      }, [
        h('text', { staticStyle: S('empty-back-btn-text') }, '返回上一级')
      ]));
    }
    body = h('div', { staticStyle: S('empty-wrap') }, emptyChildren);
  } else {
    var cards = vm.items.map(function (it, i) {
      if (it.isDir) {
        // 文件夹卡片
        var folderSub = (typeof it.count === 'number') ? (it.count + ' 个项目') : '文件夹';
        return h('div', {
          key: 'f' + i,
          staticStyle: S('folder-card'),
          on: { click: function () { vm.handleItemClick(it); } }
        }, [
          h('div', { staticStyle: S('folder-badge') }, [
            h('text', { staticStyle: S('folder-badge-text') }, '目录')
          ]),
          h('div', { staticStyle: S('item-info-wrap') }, [
            h('text', { staticStyle: S('movie-name') }, it.name),
            h('text', { staticStyle: S('folder-sub-text') }, '文件夹 · ' + folderSub)
          ]),
          h('div', { staticStyle: S('item-right-wrap') }, [
            h('div', { staticStyle: S('btn-folder-action') }, [
              h('text', { staticStyle: S('btn-folder-action-text') }, '进入 ▶')
            ])
          ])
        ]);
      } else {
        // 视频文件卡片
        var extLabel = (it.ext ? it.ext.toUpperCase() : 'VIDEO');
        var szLabel = it.size || '';
        return h('div', {
          key: 'm' + i,
          staticStyle: S('movie-card'),
          on: { click: function () { vm.handleItemClick(it); } }
        }, [
          h('div', { staticStyle: S('movie-badge') }, [
            h('text', { staticStyle: S('movie-badge-text') }, '▶')
          ]),
          h('div', { staticStyle: S('item-info-wrap') }, [
            h('text', { staticStyle: S('movie-name') }, it.name),
            h('text', { staticStyle: S('item-sub-text') }, extLabel + (szLabel ? (' · ' + szLabel) : ''))
          ]),
          h('div', { staticStyle: S('item-right-wrap') }, [
            szLabel ? h('text', { staticStyle: S('movie-size') }, szLabel) : null,
            h('div', { staticStyle: S('btn-play-action') }, [
              h('text', { staticStyle: S('btn-play-action-text') }, '播放 ▶')
            ])
          ])
        ]);
      }
    });

    cards.push(h('div', { key: 'pad', staticStyle: S('list-pad') }));
    body = h('scroller', { staticStyle: S('lib-scroller') }, cards);
  }

  return h('div', { staticStyle: S('list-root') }, [
    header,
    body
  ]);
}
