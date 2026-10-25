#!/usr/bin/env python3
import os
import sys
import shutil

sys.path.append("/Users/fuzihao/.gemini/antigravity/scratch/ydpen")
from build_amr_offline import compile_js_to_bin, pack_amr

clean_dir = "/tmp/penbili_clean_aarch64"
os.makedirs(os.path.join(clean_dir, "libs"), exist_ok=True)
shutil.copyfile(
    "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/ydpen-toolkit/assets/plugins/libjsapi_shell.so",
    os.path.join(clean_dir, "libs", "libjsapi_shell.so")
)

# 确保 index.js.bin 中的常量已 patch
index_bin_path = os.path.join(clean_dir, "index.js.bin")
if os.path.exists(index_bin_path):
    with open(index_bin_path, "rb") as f:
        data = f.read()
    target = "左侧：暂停/开始 · ±".encode("utf-16le")
    replacement = "     下载\n    ".encode("utf-16le")
    pos = data.find(target)
    if pos != -1:
        data = data[:pos] + replacement + data[pos+len(target):]
        with open(index_bin_path, "wb") as f:
            f.write(data)
        print("Patched atom in index.js.bin at offset:", pos)

js_source = r'''
import shell from "shell";

class BasePage extends $falcon.Page {
  constructor(options) {
    super(options);
    this.falconOnTokens = [];
    this.timeoutTokens = new Set();
    this.intervalTokens = new Set();
  }

  on(name, cb) {
    var token = $falcon.on(name, cb);
    this.falconOnTokens.push({ name: name, token: token });
    return token;
  }

  off(name, token) {
    $falcon.off(name, token);
    this.falconOnTokens = this.falconOnTokens.filter(function(t) { return t.token !== token; });
  }

  setTimeout(fn, ms) {
    var self = this;
    var id = setTimeout(function() {
      self.timeoutTokens.delete(id);
      fn();
    }, ms);
    this.timeoutTokens.add(id);
    return id;
  }

  clearTimeout(id) {
    this.timeoutTokens.delete(id);
    clearTimeout(id);
  }

  setInterval(fn, ms) {
    var id = setInterval(fn, ms);
    this.intervalTokens.add(id);
    return id;
  }

  clearInterval(id) {
    this.intervalTokens.delete(id);
    clearInterval(id);
  }

  sleep(ms) {
    var self = this;
    return new Promise(function(resolve) { self.setTimeout(resolve, ms); });
  }

  release() {
    this.falconOnTokens.forEach(function(item) {
      try { $falcon.off(item.name, item.token); } catch (e) {}
    });
    this.falconOnTokens = [];
    this.timeoutTokens.forEach(function(t) { clearTimeout(t); });
    this.timeoutTokens.clear();
    this.intervalTokens.forEach(function(i) { clearInterval(i); });
    this.intervalTokens.clear();
  }

  onLoad(options) {
    super.onLoad(options);
    this.options = options || {};
  }

  onNewOptions(options) {
    super.onNewOptions(options);
    this.options = options || {};
  }

  onShow() {
    super.onShow();
    if (this.$root && this.$root.onShow) this.$root.onShow();
  }

  onHide() {
    super.onHide();
    if (this.$root && this.$root.onHide) this.$root.onHide();
  }

  onUnload() {
    try {
      super.onUnload();
      if (this.$root && this.$root.onUnload) this.$root.onUnload();
    } finally {
      this.release();
    }
  }

  beforeVueInstantiate(Vue) {
    if (super.beforeVueInstantiate) super.beforeVueInstantiate(Vue);
    Vue.prototype.$workspace = globalThis.$workspace;
    Vue.prototype.$appid = globalThis.$appid;
    Vue.prototype.$shell = shell && shell.Shell;

    function findNodeByClass(node, targetCls) {
      if (!node) return null;
      var cls = (node.data && (node.data.staticClass || node.data.class)) || "";
      if (JSON.stringify(cls).indexOf(targetCls) !== -1) return node;
      if (node.children) {
        for (var j = 0; j < node.children.length; j++) {
          var r = findNodeByClass(node.children[j], targetCls);
          if (r) return r;
        }
      }
      return null;
    }

    Vue.mixin({
      beforeCreate: function() {
        var opt = this.$options;
        if (!opt || opt.name !== "PageBili") return;

        if (opt.style) {
          if (opt.style["info-spacer"]) {
            opt.style["info-spacer"].flex = 0;
            opt.style["info-spacer"].height = "0px";
          }
          opt.style["info-state"] = {
            height: "0px",
            width: "0px",
            opacity: 0,
            marginTop: "0px",
            marginBottom: "0px"
          };
          opt.style["info-hint"] = {
            width: "158px",
            height: "34px",
            marginTop: "6px",
            borderRadius: "6px",
            backgroundColor: "#162338",
            color: "#38bdf8",
            fontSize: "13px",
            textAlign: "center",
            lineHeight: "34px",
            justifyContent: "center",
            alignItems: "center",
            opacity: 1,
            lines: 1,
            maxLines: 1,
            overflow: "hidden"
          };
          if (opt.style.brand) {
            opt.style.brand.height = "0px";
            opt.style.brand.width = "0px";
            opt.style.brand.marginTop = "0px";
            opt.style.brand.marginBottom = "0px";
            opt.style.brand.paddingTop = "0px";
            opt.style.brand.paddingBottom = "0px";
            opt.style.brand.opacity = 0;
          }
          if (opt.style.tab) {
            opt.style.tab.height = "40px";
            opt.style.tab.marginTop = "5px";
          }
          if (opt.style.bar) {
            opt.style.bar.paddingTop = "6px";
            opt.style.bar.paddingBottom = "6px";
          }
        }

        if (opt.render && !opt._renderWrapped) {
          opt._renderWrapped = true;
          var origRender = opt.render;
          opt.render = function(h) {
            var comp = this;
            var vnode = origRender.call(comp, h);
            var infoCol = findNodeByClass(vnode, "info-col");
            if (infoCol && infoCol.children && infoCol.children[5]) {
              var hNode = infoCol.children[5];
              console.warn('[H_TEXT] text=' + hNode.text + ' c0=' + (hNode.children && hNode.children[0] ? hNode.children[0].text : 'none'));
              try {
                console.warn('[H_JSON] ' + JSON.stringify(hNode));
              } catch(eJ) {
                console.warn('[H_JSON_ERR] ' + eJ);
              }
            }
            console.warn('[PAGE_RENDER] mode=' + comp.mode + ' tab=' + comp.tab);

            try {
              if (vnode) {
                // 1. Process active tab style if cache tab is active
                if (comp._isCacheTab) {
                  var barNode = findNodeByClass(vnode, "bar");
                  if (barNode && barNode.children) {
                    for (var k = 0; k < barNode.children.length; k++) {
                      var itemNode = barNode.children[k];
                      if (!itemNode || !itemNode.data) continue;
                      var itemKey = itemNode.key || (itemNode.data && itemNode.data.key);
                      var itemText = "";
                      try {
                        if (itemNode.children && itemNode.children[0] && itemNode.children[0].text) {
                          itemText = itemNode.children[0].text;
                        }
                      } catch (e) {}

                      // Un-highlight "rcmd"
                      if (itemKey === "rcmd" || itemText === "\u63a8\u8350" || k === 1) {
                        itemNode.data.class = "tab";
                        itemNode.data.staticClass = "tab";
                        itemNode.data.style = { backgroundColor: "transparent" };
                        if (itemNode.data.staticStyle) itemNode.data.staticStyle.backgroundColor = "transparent";
                        if (itemNode.children && itemNode.children[0] && itemNode.children[0].data) {
                          var t0 = itemNode.children[0].data;
                          t0.class = "tab-text";
                          t0.staticClass = "tab-text";
                          t0.style = { color: "#8d99a6" };
                          if (t0.staticStyle) t0.staticStyle.color = "#8d99a6";
                        }
                      }
                      // Highlight "cache"
                      if (itemKey === "cache" || itemText === "\u7f13\u5b58" || k === barNode.children.length - 1) {
                        itemNode.data.class = "tab tab-on";
                        itemNode.data.staticClass = "tab tab-on";
                        itemNode.data.style = { backgroundColor: "#1d4a70" };
                        if (itemNode.data.staticStyle) itemNode.data.staticStyle.backgroundColor = "#1d4a70";
                        if (itemNode.children && itemNode.children[0] && itemNode.children[0].data) {
                          var t4 = itemNode.children[0].data;
                          t4.class = "tab-text tab-text-on";
                          t4.staticClass = "tab-text tab-text-on";
                          t4.style = { color: "#ffffff" };
                          if (t4.staticStyle) t4.staticStyle.color = "#ffffff";
                        }
                      }
                    }
                  }
                }

                // 2. Play mode: create real div button with comp._c
                if (comp.mode === "play") {
                  var infoCol = findNodeByClass(vnode, "info-col");
                  if (infoCol && infoCol.children && infoCol.children.length >= 6) {
                    try {
                      var dlBtn = comp._c("div", {
                        staticClass: "info-ctrl",
                        class: "info-ctrl",
                        style: {
                          width: "158px",
                          height: "34px",
                          marginTop: "6px",
                          borderRadius: "6px",
                          backgroundColor: "#162338",
                          justifyContent: "center",
                          alignItems: "center"
                        },
                        on: {
                          click: function() {
                            console.warn("[DOWNLOAD_TRIGGERED]");
                            comp.dlBtnText = "\u6b63\u5728\u4e0b\u8f7d\u2026";
                            if (comp.$forceUpdate) comp.$forceUpdate();
                            try {
                              if (shell && shell.Shell && shell.Shell.exec) {
                                shell.Shell.exec("/userdisk/bin/bili-download &");
                              }
                            } catch (e) {
                              console.warn("[DL_ERR] " + e);
                            }
                            setTimeout(function() {
                              comp.dlBtnText = "\u5df2\u52a0\u5165\u7f13\u5b58";
                              if (comp.$forceUpdate) comp.$forceUpdate();
                              setTimeout(function() {
                                comp.dlBtnText = "\u4e0b\u8f7d";
                                if (comp.$forceUpdate) comp.$forceUpdate();
                              }, 3000);
                            }, 1500);
                          }
                        }
                      }, [
                        comp._c("text", {
                          staticClass: "info-ctrl-text",
                          class: "info-ctrl-text",
                          style: { color: "#38bdf8", fontSize: "13px" }
                        }, [
                          comp._v(comp.dlBtnText || "\u4e0b\u8f7d")
                        ])
                      ]);
                      console.warn("[CTRL_ON_KEYS] " + (infoCol.children[2].data && infoCol.children[2].data.on ? Object.keys(infoCol.children[2].data.on).join(",") : "none"));
                      infoCol.children[5] = dlBtn;
                    } catch (eC) {
                      console.warn("[COMP_C_ERR] " + eC);
                    }

                    if (infoCol.children[3] && infoCol.children[3].data) {
                      infoCol.children[3].data.style = { height: "0px", flex: 0 };
                    }
                    if (infoCol.children[4] && infoCol.children[4].data) {
                      infoCol.children[4].data.style = { height: "0px", width: "0px", opacity: 0 };
                    }
                  }
                }
              }
            } catch (e) {
              console.warn("[RENDER_HOOK_ERR] " + e);
            }
            return vnode;
          };
        }
      },
      created: function() {
        if (!this.$options || this.$options.name !== "PageBili") return;
        var vm = this;
        this._isCacheTab = false;
        this._origRcmdItems = null;
        this._cachedMoviesAsCards = [];
        this.dlBtnText = "\u4e0b\u8f7d";

        // Append 5th tab: cache
        if (this.tabs && Array.isArray(this.tabs)) {
          var exists = false;
          for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].id === "cache") { exists = true; break; }
          }
          if (!exists) {
            this.tabs.push({ id: "cache", label: "\u7f13\u5b58" });
          }
        }

        this._scanCache = function() {
          console.warn("[CACHE_SCAN] scanning /userdisk/Favorite/Bilibili/*.mp4 ...");
          if (shell && shell.Shell && shell.Shell.exec) {
            shell.Shell.exec("ls -1 /userdisk/Favorite/Bilibili/*.mp4 2>/dev/null").then(function(out) {
              var lines = (out || "").trim().split("\n").filter(function(l) { return l.trim().length > 0; });
              console.warn("[CACHE_SCAN] found " + lines.length + " files");
              var cards = [];
              for (var j = 0; j < lines.length; j++) {
                var p = lines[j].trim();
                var fname = p.split("/").pop().replace(/\.mp4$/i, "");
                var coverUrl = "http://127.0.0.1:8080/files/Bilibili/" + encodeURIComponent(fname) + ".jpg";
                cards.push({
                  key: "cached_" + j,
                  bvid: "local:" + p,
                  title: fname,
                  cover: coverUrl,
                  pic: coverUrl,
                  duration: "\u672c\u5730\u7f13\u5b58",
                  durationSec: 0,
                  up: "\u54d4\u54e9\u54d4\u54e9\u79bb\u7ebf\u7f13\u5b58",
                  owner: { name: "\u54d4\u54e9\u54d4\u54e9\u79bb\u7ebf\u7f13\u5b58" },
                  view: "\u5df2\u5c31\u7eea",
                  stat: { view: "\u5df2\u5c31\u7eea" },
                  kind: "video",
                  path: p
                });
              }
              vm._cachedMoviesAsCards = cards;
              if (vm._isCacheTab) {
                vm.rcmdItems = cards;
                if (vm.$forceUpdate) vm.$forceUpdate();
              }
            }).catch(function(e) {
              console.warn("[CACHE_SCAN_ERR] " + e);
            });
          }
        };

        if (this.selectTab) {
          var origSelectTab = this.selectTab;
          this.selectTab = function(tabId) {
            console.warn("[SELECT_TAB] " + tabId);
            if (tabId === "cache") {
              this._isCacheTab = true;
              if (!this._origRcmdItems && this.rcmdItems) {
                this._origRcmdItems = this.rcmdItems;
              }
              this.tab = "rcmd";
              this.loading = false;
              this.statusText = "";
              this.rcmdItems = this._cachedMoviesAsCards || [];
              this._scanCache();
              if (this.$forceUpdate) this.$forceUpdate();
              return;
            }
            if (this._isCacheTab) {
              this._isCacheTab = false;
              if (this._origRcmdItems) {
                this.rcmdItems = this._origRcmdItems;
              }
              this.tab = "";
            }
            origSelectTab.call(this, tabId);
          };
        }

        if (this.onRefreshTab) {
          var origOnRefreshTab = this.onRefreshTab;
          this.onRefreshTab = function() {
            if (this._isCacheTab) {
              this._scanCache();
              return;
            }
            origOnRefreshTab.call(this);
          };
        }

        if (this.onPlayItem) {
          var origOnPlayItem = this.onPlayItem;
          this.onPlayItem = function(item) {
            if (item && item.bvid && item.bvid.indexOf("local:") === 0) {
              console.warn("[PLAY_LOCAL] " + item.path);
              if (shell && shell.Shell && shell.Shell.exec) {
                shell.Shell.exec("/userdisk/bin/play \"" + item.path + "\" &");
              }
              return;
            }
            origOnPlayItem.call(this, item);
          };
        }

        this._scanCache();
      }
    });
  }
}

export { BasePage as B };
export default BasePage;
'''

js_file = "/tmp/base-page-final-src.js"
with open(js_file, "w", encoding="utf-8") as f:
    f.write(js_source.strip())

bin_file = os.path.join(clean_dir, "base-page-dca68d51.js.bin")
compile_ok = compile_js_to_bin(js_file, bin_file, is_module=True, ext_modules=["shell"])
if not compile_ok:
    print("Compilation failed!")
    sys.exit(1)

out_amr = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/PenBili-cached-3.5.2.amr"
pack_amr(clean_dir, out_amr, "8002026091900004", "PenBili", "3.5.2")
print("AMR packaged successfully at:", out_amr)
