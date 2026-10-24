#!/usr/bin/env python3
"""构建「投屏」和「文件互传」两个带启动/停止按钮的 miniapp（.amr）。

两个 app 共用同一份界面模板，区别只在配置（名称、端口、启动/停止命令、进程名）。
通过自带的 libjsapi_term.so（取自 PenTerm）使用 term.execSync 在笔上执行命令。
"""
import os
import struct
import sys
import zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_amr_offline import compile_js_to_bin, pack_amr  # noqa: E402

ROOT = os.path.dirname(os.path.abspath(__file__))
TERM_SO = os.path.join(ROOT, "screen_cast_app", "libs", "libjsapi_term.so")
OUT_DIR = os.path.join(ROOT, "ydpen-toolkit", "app_on_pen", "amr")

APPS = [
    {
        "dir": os.path.join(ROOT, "screen_cast_app"),
        "appid": "8002026102400001",
        "name": "投屏",
        "version": "1.0.0",
        "out": "screen-cast-1.0.0.amr",
        "cfg": {
            "title": "投屏",
            "subtitle": "电脑浏览器远程查看并操作词典笔",
            "port": "8088",
            "hint": "同一 WiFi 下，在电脑浏览器打开：",
            "tip": "支持鼠标点击、拖动滑动、返回与电源键",
            "ready": "投屏服务运行中",
            "stopped": "投屏服务未开启",
            "start_cmd": "/userdisk/bin/screen_on",
            "stop_cmd": "/userdisk/bin/screen_off",
            "grep": "[y]dpen_screensrv",
            "icon_color": (37, 99, 235),
        },
    },
    {
        "dir": os.path.join(ROOT, "file_transfer_app"),
        "appid": "8002026102300005",
        "name": "文件互传",
        "version": "1.1.0",
        "out": "file-transfer-1.1.0.amr",
        "cfg": {
            "title": "文件互传",
            "subtitle": "电脑浏览器上传下载词典笔里的文件",
            "port": "8080",
            "hint": "同一 WiFi 下，在电脑浏览器打开：",
            "tip": "保存位置：/userdisk/Favorite，支持拖拽上传",
            "ready": "文件互传服务运行中",
            "stopped": "文件互传服务未开启",
            "start_cmd": "/sbin/start-stop-daemon -S -b -x /userdisk/fssrv -- 8080 /userdisk/Favorite",
            "stop_cmd": "/sbin/start-stop-daemon -K -q -x /userdisk/fssrv; pkill -f '/userdisk/fssrv' 2>/dev/null",
            "grep": "[f]ssrv",
            "icon_color": (22, 163, 74),
        },
    },
]

COMPONENT_TEMPLATE = r"""import term from 'term';

var CFG = __CFG__;

function sh(cmd, timeout) {
  try {
    var r = term.execSync(cmd, timeout || 6000);
    return r && typeof r.out === 'string' ? r.out : '';
  } catch (e) {
    return '';
  }
}

export default {
  name: 'index',
  data: function () {
    return {
      ip: '获取中…',
      running: false,
      busy: false,
      statusMsg: '正在检测状态…'
    };
  },
  mounted: function () {
    var self = this;
    self.refresh();
    self._timer = setInterval(function () {
      if (!self.busy) self.refresh();
    }, 3000);
  },
  onShow: function () {
    this.refresh();
  },
  destroyed: function () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },
  methods: {
    refresh: function () {
      var ipOut = sh("ip -4 addr show wlan0 2>/dev/null | grep -o 'inet [0-9.]*' | awk '{print $2}' | head -n 1", 3000).trim();
      this.ip = ipOut || '未连接 WiFi';
      var cnt = parseInt(sh("ps | grep -c '" + CFG.grep + "'", 3000).trim(), 10);
      this.running = cnt > 0;
      this.statusMsg = this.running ? CFG.ready : CFG.stopped;
      this.busy = false;
    },
    onStart: function () {
      var self = this;
      if (self.busy) return;
      self.busy = true;
      self.statusMsg = '正在启动…';
      sh(CFG.start_cmd, 8000);
      setTimeout(function () { self.refresh(); }, 1200);
    },
    onStop: function () {
      var self = this;
      if (self.busy) return;
      self.busy = true;
      self.statusMsg = '正在停止…';
      sh(CFG.stop_cmd, 8000);
      setTimeout(function () { self.refresh(); }, 800);
    }
  },
  render: function (h) {
    var self = this;
    var url = self.running ? ('http://' + self.ip + ':' + CFG.port + '/') : '服务未开启';
    function btn(label, bg, enabled, handler) {
      return h('div', {
        staticStyle: {
          backgroundColor: enabled ? bg : '#334155',
          borderRadius: '8px',
          width: '170px',
          height: '40px',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: '12px'
        },
        on: { click: handler }
      }, [
        h('text', { staticStyle: { color: enabled ? '#ffffff' : '#64748b', fontSize: '16px', fontWeight: 'bold' } }, label)
      ]);
    }
    return h('div', {
      staticStyle: {
        width: '800px',
        height: '220px',
        backgroundColor: '#0f172a',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingTop: '12px',
        paddingBottom: '12px',
        overflow: 'hidden'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: '32px' } }, [
        h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
          h('text', { staticStyle: { color: '#f8fafc', fontSize: '22px', fontWeight: 'bold', marginRight: '12px' } }, CFG.title),
          h('div', {
            staticStyle: {
              backgroundColor: self.running ? '#166534' : '#7f1d1d',
              borderRadius: '4px',
              paddingLeft: '8px',
              paddingRight: '8px',
              height: '22px',
              justifyContent: 'center',
              alignItems: 'center'
            }
          }, [
            h('text', { staticStyle: { color: self.running ? '#86efac' : '#fca5a5', fontSize: '13px', fontWeight: 'bold' } }, self.statusMsg)
          ])
        ]),
        h('text', { staticStyle: { color: '#64748b', fontSize: '13px' } }, CFG.subtitle)
      ]),
      h('div', {
        staticStyle: {
          backgroundColor: '#1e293b',
          borderRadius: '10px',
          borderWidth: '1px',
          borderColor: '#334155',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '90px',
          paddingLeft: '16px',
          paddingRight: '16px'
        }
      }, [
        h('text', { staticStyle: { color: '#94a3b8', fontSize: '14px', marginBottom: '6px' } }, CFG.hint),
        h('text', { staticStyle: { color: self.running ? '#38bdf8' : '#64748b', fontSize: '30px', fontWeight: 'bold' } }, url),
        h('text', { staticStyle: { color: '#64748b', fontSize: '12px', marginTop: '4px' } }, CFG.tip)
      ]),
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center', height: '40px' } }, [
        btn('启动', '#16a34a', !self.running && !self.busy, self.onStart),
        btn('停止', '#dc2626', self.running && !self.busy, self.onStop),
        btn('刷新状态', '#2563eb', !self.busy, self.refresh)
      ])
    ]);
  }
};
"""


def make_icon(path, rgb):
    """纯 Python 生成 150x150 圆角色块图标（无 PIL 依赖）。"""
    n = 150
    r = 28
    rows = []
    for y in range(n):
        row = bytearray([0])
        for x in range(n):
            dx = max(r - x, 0, x - (n - 1 - r))
            dy = max(r - y, 0, y - (n - 1 - r))
            inside = dx * dx + dy * dy <= r * r
            # 简单的"屏幕"图案：中间一块浅色矩形
            screen = 38 <= x <= 111 and 50 <= y <= 99
            if not inside:
                row += bytes([0, 0, 0, 0])
            elif screen:
                row += bytes([241, 245, 249, 255])
            else:
                row += bytes([rgb[0], rgb[1], rgb[2], 255])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def build(app):
    d = app["dir"]
    src = os.path.join(d, "src")
    pkg = os.path.join(d, "pkg")
    os.makedirs(src, exist_ok=True)
    os.makedirs(pkg, exist_ok=True)

    import json
    comp = COMPONENT_TEMPLATE.replace("__CFG__", json.dumps(app["cfg"], ensure_ascii=False))
    comp = comp.replace("\"icon_color\": [", "\"icon_color\": [")
    with open(os.path.join(src, "Component.js"), "w", encoding="utf-8") as f:
        f.write(comp)

    # app.js：更新名称/版本
    app_js = open(os.path.join(src, "app.js"), encoding="utf-8").read()
    import re
    app_js = re.sub(r"name: '[^']*'", "name: '%s'" % app["name"], app_js, count=1)
    app_js = re.sub(r"version: '[^']*'", "version: '%s'" % app["version"], app_js, count=1)
    with open(os.path.join(src, "app.js"), "w", encoding="utf-8") as f:
        f.write(app_js)

    icon_path = os.path.join(src, "app_icon.png")
    if not os.path.exists(icon_path):
        make_icon(icon_path, app["cfg"]["icon_color"])

    # 清理旧产物
    for root, _, files in os.walk(pkg):
        for fn in files:
            os.remove(os.path.join(root, fn))
    os.makedirs(os.path.join(pkg, "pages", "index"), exist_ok=True)

    for name in ["BasePage", "Component", "app", "index", "shell"]:
        out = os.path.join(pkg, name + ".js.bin")
        if not compile_js_to_bin(os.path.join(src, name + ".js"), out, ext_modules=["term"]):
            raise SystemExit("编译失败: %s" % name)
    # PenTerm 的包结构里 pages/index 下也有页面字节码
    for name in ["index", "shell"]:
        with open(os.path.join(pkg, name + ".js.bin"), "rb") as f:
            data = f.read()
        with open(os.path.join(pkg, "pages", "index", name + ".js.bin"), "wb") as f:
            f.write(data)
    with open(os.path.join(src, "app_icon.png"), "rb") as f:
        icon = f.read()
    with open(os.path.join(pkg, "app_icon.png"), "wb") as f:
        f.write(icon)

    out_amr = os.path.join(OUT_DIR, app["out"])
    pack_amr(
        pkg, out_amr, app["appid"], app["name"], app["version"],
        extra_libs={
            "libs/arm64/libjsapi_term.so": TERM_SO,
            "libs/arm64-orange/libjsapi_term.so": TERM_SO,
        },
    )
    return out_amr


if __name__ == "__main__":
    for a in APPS:
        print("==> 构建", a["name"])
        build(a)
