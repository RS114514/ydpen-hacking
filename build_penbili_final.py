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
    target1 = "左侧：暂停/开始 · ±".encode("utf-16le")
    target2 = "     下载\n    ".encode("utf-16le")
    replacement = "下载\n         ".encode("utf-16le")
    for t in [target1, target2]:
        pos = data.find(t)
        if pos != -1:
            data = data[:pos] + replacement + data[pos+len(t):]
            with open(index_bin_path, "wb") as f:
                f.write(data)
            print("Patched atom in index.js.bin at offset:", pos)
            break

js_source = r'''
import shell from "shell";
import player from "player";

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
    Vue.prototype.$player = player;

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

        if (!opt.computed) opt.computed = {};
        var origCurrentItems = opt.computed.currentItems;
        opt.computed.currentItems = function() {
          if (this.tab === "cache") {
            return this._cachedMoviesAsCards || [];
          }
          if (origCurrentItems) return origCurrentItems.call(this);
          return [];
        };

        opt.computed.infoTitle = function() {
          if (this._isCachePlaying && this._localItem) {
            return this._localItem.title || "本地缓存";
          }
          if (this.play && this.play.session && this.play.session.title) {
            return this.play.session.title;
          }
          if (this._lastOnlineItem && this._lastOnlineItem.title) {
            return this._lastOnlineItem.title;
          }
          if (this.current && this.current.title) {
            return this.current.title;
          }
          return "";
        };

        opt.computed.infoUp = function() {
          if (this._isCachePlaying && this._localItem) {
            return this._localItem.up || "哔哩哔哩离线缓存";
          }
          if (this.play && this.play.session && this.play.session.up) {
            return this.play.session.up;
          }
          if (this._lastOnlineItem) {
            return (this._lastOnlineItem.owner && this._lastOnlineItem.owner.name) || this._lastOnlineItem.up || "";
          }
          if (this.current) {
            return (this.current.owner && this.current.owner.name) || this.current.up || "";
          }
          return "";
        };

        if (opt.style) {
          if (opt.style["info-spacer"]) {
            opt.style["info-spacer"].flex = 0;
            opt.style["info-spacer"].height = "0px";
            opt.style["info-spacer"].width = "0px";
            opt.style["info-spacer"].opacity = 0;
          }
          opt.style["info-state"] = {
            height: "0px",
            width: "0px",
            opacity: 0,
            marginTop: "0px",
            marginBottom: "0px"
          };
          if (opt.style["info-ctrl"]) {
            opt.style["info-hint"] = Object.assign({}, opt.style["info-ctrl"], {
              marginTop: "6px",
              color: "#38bdf8",
              backgroundColor: "#162338",
              textAlign: "center",
              lineHeight: opt.style["info-ctrl"].height || "34px",
              lines: 1,
              maxLines: 1,
              overflow: "hidden"
            });
          } else {
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
              lines: 1,
              maxLines: 1,
              overflow: "hidden"
            };
          }
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
            opt.style.tab.height = "32px";
            opt.style.tab.marginTop = "2px";
            opt.style.tab.marginBottom = "2px";
          }
          if (opt.style["tab-text"]) {
            opt.style["tab-text"].fontSize = "12px";
            opt.style["tab-text"].lineHeight = "32px";
          }
          if (opt.style["tab-on"]) {
            opt.style["tab-on"].height = "32px";
          }
          if (opt.style.bar) {
            opt.style.bar.paddingTop = "2px";
            opt.style.bar.paddingBottom = "2px";
          }
        }

        if (opt.render && !opt._renderWrapped) {
          opt._renderWrapped = true;
          var origRender = opt.render;
          opt.render = function(h) {
            var comp = this;

            // Ensure play.session exists ONLY IF _isCachePlaying is true
            if (comp.mode === "play" && comp._isCachePlaying) {
              if (!comp.play || typeof comp.play !== "object") {
                comp.play = {
                  state: "playing",
                  session: { live: false, version: 1, buvid3: "", buvid4: "", login: false },
                  positionMs: comp.posMs || 0,
                  frames: 100,
                  note: ""
                };
              } else if (!comp.play.session || typeof comp.play.session !== "object") {
                comp.play.session = { live: false, version: 1, buvid3: "", buvid4: "", login: false };
              }
              if (!comp.session || typeof comp.session !== "object") {
                comp.session = { live: false, version: 1, buvid3: "", buvid4: "", updatedAt: 0, login: false };
              }
              if (!comp.live || typeof comp.live !== "object") {
                comp.live = { version: 1, addr: "", bufMs: 0, res: "", bv: "", trans: "", resolvedAddr: "", resolvedAt: 0 };
              }
            }

            var vnode = null;
            try {
              vnode = origRender.call(comp, h);
            } catch (eR) {
              console.warn("[ORIG_RENDER_ERR] " + eR);
              if (comp._lastGoodVNode) vnode = comp._lastGoodVNode;
            }
            if (vnode) comp._lastGoodVNode = vnode;

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

                // 2. Play mode modifications
                if (comp.mode === "play") {
                  // If playing cached video, clean up any idle/error text in play-col
                  if (comp._isCachePlaying) {
                    var playCol = findNodeByClass(vnode, "play-col");
                    if (playCol) {
                      var idleNode = findNodeByClass(playCol, "play-idle-text");
                      if (idleNode) {
                        idleNode.children = [];
                        idleNode.text = "";
                      }
                      var idleBox = findNodeByClass(playCol, "play-idle");
                      if (idleBox && idleBox.data) {
                        idleBox.data.style = { opacity: 0, height: "0px", width: "0px" };
                      }
                    }

                    // Update left status text (hide error, show playing)
                    var ctrlMain = findNodeByClass(vnode, "ctrl-main");
                    if (ctrlMain) {
                      var timeNodes = ctrlMain.children || [];
                      for (var tn = 0; tn < timeNodes.length; tn++) {
                        var nodeX = timeNodes[tn];
                        if (nodeX && nodeX.data && JSON.stringify(nodeX.data.class || "").indexOf("ctrl-text") !== -1) {
                          if (nodeX.text && (nodeX.text.indexOf("出错") !== -1 || nodeX.text.indexOf("起播") !== -1)) {
                            nodeX.text = comp._localPaused ? "已暂停" : "播放中";
                          }
                        }
                      }
                    }
                  }

                  // Customize right-hand info-col (title, UP author, download button and comments)
                  var infoCol = findNodeByClass(vnode, "info-col");
                  if (infoCol && infoCol.children) {
                    try {
                      var isCachePlaying = comp._isCachePlaying;

                      // 1. Determine current video title and UP author
                      var curTitle = "";
                      var curUp = "";
                      if (isCachePlaying && comp._localItem) {
                        curTitle = comp._localItem.title || "本地缓存";
                        curUp = comp._localItem.up || "哔哩哔哩离线缓存";
                      } else {
                        if (comp.play && comp.play.session) {
                          if (comp.play.session.title) curTitle = comp.play.session.title;
                          if (comp.play.session.up) curUp = comp.play.session.up;
                        }
                        if (!curTitle && comp._lastOnlineItem) curTitle = comp._lastOnlineItem.title;
                        if (!curUp && comp._lastOnlineItem) {
                          curUp = (comp._lastOnlineItem.owner && comp._lastOnlineItem.owner.name) || comp._lastOnlineItem.up || "";
                        }
                        if (!curTitle && comp.current) curTitle = comp.current.title;
                        if (!curUp && comp.current) {
                          curUp = (comp.current.owner && comp.current.owner.name) || comp.current.up || "";
                        }
                      }

                      var titleNode = null;
                      var upNode = null;
                      var ctrlNode = null;
                      var hintNode = null;
                      var stateNode = null;
                      var spacerNode = null;

                      var chDump = [];
                      for (var cidx = 0; cidx < infoCol.children.length; cidx++) {
                        var ch = infoCol.children[cidx];
                        var chCls = (ch.data && (ch.data.staticClass || ch.data.class)) || "";
                        var sCls = JSON.stringify(chCls);
                        if (sCls.indexOf("info-title") !== -1 || cidx === 0) titleNode = ch;
                        if (sCls.indexOf("info-up") !== -1 || cidx === 1) upNode = ch;
                        if (sCls.indexOf("info-ctrl") !== -1 || cidx === 2) ctrlNode = ch;
                        if (sCls.indexOf("info-spacer") !== -1 || cidx === 3) spacerNode = ch;
                        if (sCls.indexOf("info-state") !== -1 || cidx === 4) stateNode = ch;
                        if (sCls.indexOf("info-hint") !== -1 || cidx === 5) hintNode = ch;
                        chDump.push(cidx + ":" + (ch.tag || "t") + "." + chCls + " data=" + JSON.stringify(ch.data));
                      }
                      console.warn("[INFO_COL_DUMP] curTitle=" + curTitle + " curUp=" + curUp + " || " + chDump.join(" | "));

                      // Ensure titleNode displays the exact current title
                      if (titleNode && curTitle) {
                        titleNode.text = curTitle;
                        if (!titleNode.data) titleNode.data = {};
                        if (!titleNode.data.attrs) titleNode.data.attrs = {};
                        titleNode.data.attrs.value = curTitle;
                        if (comp._v) titleNode.children = [ comp._v(curTitle) ];
                        if (!titleNode.data.style) titleNode.data.style = {};
                        titleNode.data.style.opacity = 1;
                        titleNode.data.style.lines = 2;
                        titleNode.data.style.maxLines = 2;
                        titleNode.data.style.fontSize = "13px";
                        titleNode.data.style.color = "#ffffff";
                      }

                      // Ensure upNode displays the exact UP author
                      if (upNode && curUp) {
                        upNode.text = curUp;
                        if (!upNode.data) upNode.data = {};
                        if (!upNode.data.attrs) upNode.data.attrs = {};
                        upNode.data.attrs.value = curUp;
                        if (comp._v) upNode.children = [ comp._v(curUp) ];
                        if (!upNode.data.style) upNode.data.style = {};
                        upNode.data.style.opacity = 1;
                        upNode.data.style.lines = 1;
                        upNode.data.style.maxLines = 1;
                        upNode.data.style.fontSize = "11px";
                        upNode.data.style.color = "#8d99a6";
                      }

                      if (spacerNode && spacerNode.data) {
                        spacerNode.data.style = { height: "0px", flex: 0 };
                      }
                      if (stateNode && stateNode.data) {
                        stateNode.data.style = { height: "0px", width: "0px", opacity: 0 };
                      }

                      var curDlText = isCachePlaying ? "\u5df2\u7f13\u5b58" : (comp.dlBtnText || "\u4e0b\u8f7d");
                      var curDlBg = isCachePlaying ? "#1e293b" : (comp._isDownloading ? "#0284c7" : "#162338");
                      var curDlColor = isCachePlaying ? "#94a3b8" : (comp._isDownloading ? "#ffffff" : "#38bdf8");

                      var ctrlWidth = "158px";
                      if (ctrlNode && ctrlNode.data && ctrlNode.data.style && ctrlNode.data.style.width) {
                        ctrlWidth = ctrlNode.data.style.width;
                      } else if (opt.style && opt.style["info-ctrl"] && opt.style["info-ctrl"].width) {
                        ctrlWidth = opt.style["info-ctrl"].width;
                      }

                      if (hintNode) {
                        if (!hintNode.data) hintNode.data = {};
                        hintNode.data.style = {
                          width: ctrlWidth,
                          height: "34px",
                          marginTop: "6px",
                          borderRadius: "6px",
                          backgroundColor: curDlBg,
                          color: curDlColor,
                          fontSize: "13px",
                          textAlign: "center",
                          lineHeight: "34px",
                          justifyContent: "center",
                          alignItems: "center",
                          alignSelf: "center",
                          opacity: 1
                        };
                        if (comp._v) {
                          hintNode.children = [ comp._v(curDlText) ];
                        }
                        hintNode.data.on = {
                          click: function() {
                            if (isCachePlaying) return;
                            console.warn("[DOWNLOAD_TRIGGERED]");
                            comp._isDownloading = true;
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
                                comp._isDownloading = false;
                                comp.dlBtnText = "\u4e0b\u8f7d";
                                if (comp.$forceUpdate) comp.$forceUpdate();
                              }, 3000);
                            }, 1500);
                          }
                        };
                      }
                    } catch (eC) {
                      console.warn("[COMP_C_ERR] " + eC);
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
        this._isCachePlaying = false;
        this._origRcmdItems = null;
        this._cachedMoviesAsCards = [];
        this.dlBtnText = "\u4e0b\u8f7d";

        Object.defineProperty(this, "infoTitle", {
          get: function() {
            if (this._isCachePlaying && this._localItem) {
              return this._localItem.title || "本地缓存";
            }
            if (this.play && this.play.session && this.play.session.title) {
              return this.play.session.title;
            }
            if (this._lastOnlineItem && this._lastOnlineItem.title) {
              return this._lastOnlineItem.title;
            }
            if (this.current && this.current.title) {
              return this.current.title;
            }
            return "";
          },
          configurable: true,
          enumerable: true
        });

        Object.defineProperty(this, "infoUp", {
          get: function() {
            if (this._isCachePlaying && this._localItem) {
              return this._localItem.up || "哔哩哔哩离线缓存";
            }
            if (this.play && this.play.session && this.play.session.up) {
              return this.play.session.up;
            }
            if (this._lastOnlineItem) {
              return (this._lastOnlineItem.owner && this._lastOnlineItem.owner.name) || this._lastOnlineItem.up || "";
            }
            if (this.current) {
              return (this.current.owner && this.current.owner.name) || this.current.up || "";
            }
            return "";
          },
          configurable: true,
          enumerable: true
        });

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
                  cid: 1,
                  title: fname,
                  cover: coverUrl,
                  pic: coverUrl,
                  duration: "\u672c\u5730\u7f13\u5b58",
                  durationSec: 100,
                  up: "\u54d4\u54e9\u54d4\u54e9\u79bb\u7ebf\u7f13\u5b58",
                  owner: { name: "\u54d4\u54e9\u54d4\u54e9\u79bb\u7ebf\u7f13\u5b58" },
                  view: "\u5df2\u5c31\u7eea",
                  stat: { view: "\u5df2\u5c31\u7eea" },
                  kind: "video",
                  source: "cache",
                  path: p,
                  live: false,
                  article: { live: false },
                  video: { live: false }
                });
              }
              vm._cachedMoviesAsCards = cards;
              if (vm._isCacheTab && vm.$forceUpdate) {
                vm.$forceUpdate();
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
            if (this._isCachePlaying) {
              this._isCachePlaying = false;
              this._localItem = null;
              this.article = null;
              delete this.title;
              delete this.up;
              if (this._localProgressTimer) {
                clearInterval(this._localProgressTimer);
                this._localProgressTimer = null;
              }
              try {
                if (player && typeof player.stop === "function") player.stop();
              } catch (eS) {}
            }
            if (tabId === "cache") {
              this._isCacheTab = true;
              this.tab = "cache";
              this.loading = false;
              this.statusText = "";
              this._scanCache();
              if (this.$forceUpdate) this.$forceUpdate();
              return;
            }
            this._isCacheTab = false;
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

        // Hook onPlayItem to handle local vs online
        if (this.onPlayItem) {
          var origOnPlayItem = this.onPlayItem;
          this.onPlayItem = function(item) {
            console.warn("[ON_PLAY_ITEM] " + (item ? item.title : "null"));
            if (item && item.bvid && item.bvid.indexOf("local:") === 0) {
              var self = this;
              self._isCachePlaying = true;
              self._localItem = item;
              self._localPaused = false;

              // Setup full Vue state matching network playback
              self.mode = "play";
              self.current = {
                bvid: item.bvid,
                title: item.title,
                up: item.up || "\u54d4\u54e9\u54d4\u54e9\u79bb\u7ebf\u7f13\u5b58",
                owner: { name: item.up || "\u54d4\u54e9\u54d4\u54e9\u79bb\u7ebf\u7f13\u5b58" }
              };
              self.detail = self.current;
              self.video = self.current;
              self.article = null;
              self.meta = { live: false };
              self.play = {
                state: "playing",
                session: {
                  kind: "video",
                  live: false,
                  version: 1,
                  buvid3: "",
                  buvid4: "",
                  login: false,
                  bvid: item.bvid,
                  title: item.title,
                  up: item.up || "\u54d4\u54e9\u54d4\u54e9\u79bb\u7ebf\u7f13\u5b58"
                },
                positionMs: 0,
                frames: 100,
                note: ""
              };
              self.session = { live: false, version: 1, buvid3: "", buvid4: "", updatedAt: 0, login: false };
              self.live = { version: 1, addr: "", bufMs: 0, res: "", bv: "", trans: "", resolvedAddr: "", resolvedAt: 0 };
              self.commentsOpen = false;
              self.replyCount = 0;
              self.replyStatus = "";
              self.replyLoading = false;
              self.replyNoMore = true;
              self.replies = [];
              self.holeVisible = true;
              self.stateLabel = "播放中";
              self.idleText = "";
              self.btnText = "…";
              delete self.title;
              delete self.up;
              self.timeText = " / 00:00";
              self.statusText = "";
              self.error = "";
              self.profileStatus = "";
              self.playing = true;
              self.paused = false;
              self.posMs = 0;
              self.timeStr = "00:00 / 00:00";

              if (self.$forceUpdate) self.$forceUpdate();

              var p = item.path || item.bvid.substring(6);
              var fname = p.split("/").pop();
              var localUrl = "http://127.0.0.1:8080/files/Bilibili/" + encodeURIComponent(fname);
              console.warn("[LOCAL_START_PLAY] path=" + p + " localUrl=" + localUrl);

              try {
                if (player && typeof player.open === "function") {
                  console.warn("[CALLING_PLAYER_OPEN] uri=" + localUrl);
                  var openRes = player.open(localUrl, 76, 6, 452, 254, 24);
                  console.warn("[CALLING_PLAYER_OPEN_OK] res=" + JSON.stringify(openRes));
                } else {
                  console.warn("[PLAYER_OPEN_NOT_AVAILABLE] fallback to gstreamer shell");
                  if (shell && shell.Shell && shell.Shell.exec) {
                    shell.Shell.exec("export XDG_RUNTIME_DIR=/var/run; export WAYLAND_DISPLAY=wayland-0; pkill -9 -f 'gst-launch-1.0' 2>/dev/null; gst-launch-1.0 playbin uri='file://" + p + "' video-sink='videoscale add-borders=true ! waylandsink' audio-sink=alsasink &");
                  }
                }
              } catch (ePlay) {
                console.warn("[PLAYER_LAUNCH_ERR] " + ePlay);
              }

              // Progress poll timer
              if (self._localProgressTimer) clearInterval(self._localProgressTimer);
              self._localProgressTimer = setInterval(function() {
                if (!self._isCachePlaying || self.mode !== "play") {
                  clearInterval(self._localProgressTimer);
                  return;
                }
                try {
                  if (player && typeof player.status === "function") {
                    var st = player.status();
                    if (st && st.posMs !== undefined) {
                      self.posMs = st.posMs;
                      self.positionMs = st.posMs;
                      self.durationMs = st.durationMs || self.durationMs || 100000;
                      var curSec = Math.floor(st.posMs / 1000);
                      var curM = Math.floor(curSec / 60);
                      var curS = curSec % 60;
                      var durSec = Math.floor(self.durationMs / 1000);
                      var durM = Math.floor(durSec / 60);
                      var durS = durSec % 60;
                      self.timeStr = (curM < 10 ? "0" + curM : curM) + ":" + (curS < 10 ? "0" + curS : curS) + " / " + (durM < 10 ? "0" + durM : durM) + ":" + (durS < 10 ? "0" + durS : durS);
                      self.timeText = " / " + (durM < 10 ? "0" + durM : durM) + ":" + (durS < 10 ? "0" + durS : durS);
                      if (self.play) {
                        self.play.positionMs = st.posMs;
                        self.play.frames = st.frames || 100;
                      }
                      if (self.$forceUpdate) self.$forceUpdate();
                    }
                  }
                } catch (ePoll) {}
              }, 500);

              return;
            }
            this._isCachePlaying = false;
            this._localItem = null;
            this._lastOnlineItem = item;
            this.dlBtnText = "\u4e0b\u8f7d";
            this._isDownloading = false;
            this.article = null;
            delete this.title;
            delete this.up;
            if (this._localProgressTimer) {
              clearInterval(this._localProgressTimer);
              this._localProgressTimer = null;
            }
            try {
              if (player && typeof player.stop === "function") player.stop();
            } catch (eStop) {}
            origOnPlayItem.call(this, item);
          };
        }

        // Hook onTogglePlay (play/pause)
        if (this.onTogglePlay) {
          var origOnTogglePlay = this.onTogglePlay;
          this.onTogglePlay = function() {
            if (this._isCachePlaying) {
              console.warn("[LOCAL_TOGGLE_PLAY]");
              try {
                if (player) {
                  if (this._localPaused) {
                    player.resume();
                    this._localPaused = false;
                    this.paused = false;
                    if (this.play) this.play.state = "playing";
                  } else {
                    player.pause();
                    this._localPaused = true;
                    this.paused = true;
                    if (this.play) this.play.state = "paused";
                  }
                  if (this.$forceUpdate) this.$forceUpdate();
                }
              } catch (eT) {
                console.warn("[TOGGLE_PLAY_ERR] " + eT);
              }
              return;
            }
            origOnTogglePlay.call(this);
          };
        }

        // Hook onSeek / seek (fast-forward / rewind)
        var hookSeekFn = function(compInstance, origFn) {
          return function(delta) {
            if (compInstance._isCachePlaying) {
              console.warn("[LOCAL_SEEK] delta=" + delta);
              var deltaMs = 20000;
              if (delta === "-" || delta === -1 || delta === "seek-") deltaMs = -20000;
              else if (typeof delta === "number") deltaMs = delta * 1000;
              var cur = compInstance.posMs || compInstance.positionMs || 0;
              var target = cur + deltaMs;
              if (target < 0) target = 0;
              if (compInstance.durationMs && target > compInstance.durationMs) target = compInstance.durationMs;
              try {
                if (player && typeof player.seek === "function") {
                  player.seek(target);
                }
              } catch (eSeek) {}
              return;
            }
            if (origFn) origFn.call(compInstance, delta);
          };
        };

        if (this.onSeek) {
          this.onSeek = hookSeekFn(this, this.onSeek);
        }
        if (this.seek) {
          this.seek = hookSeekFn(this, this.seek);
        }

        // Hook onBack (return to browse)
        if (this.onBack) {
          var origOnBack = this.onBack;
          this.onBack = function() {
            console.warn("[ON_BACK_CALLED] isCachePlaying=" + this._isCachePlaying);
            if (this._isCachePlaying) {
              this._isCachePlaying = false;
              this._localItem = null;
              this.article = null;
              delete this.title;
              delete this.up;
              if (this._localProgressTimer) {
                clearInterval(this._localProgressTimer);
                this._localProgressTimer = null;
              }
              try {
                if (player && typeof player.stop === "function") {
                  player.stop();
                }
              } catch (eS) {}
              if (shell && shell.Shell && shell.Shell.exec) {
                shell.Shell.exec("pkill -9 -f 'gst-launch-1.0' 2>/dev/null");
              }
              this.mode = "browse";
              if (this.$forceUpdate) this.$forceUpdate();
              return;
            }
            origOnBack.call(this);
          };
        }

        // Timer to monitor download status
        this._dlTimer = setInterval(function() {
          if (shell && shell.Shell && shell.Shell.exec) {
            shell.Shell.exec("cat /tmp/bili_dl_status 2>/dev/null").then(function(out) {
              var st = (out || "").trim();
              if (st && st !== vm._lastDlStatus) {
                vm._lastDlStatus = st;
                vm.statusText = st;
                if (vm.$forceUpdate) vm.$forceUpdate();
              }
            });
          }
        }, 800);

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
compile_ok = compile_js_to_bin(js_file, bin_file, is_module=True, ext_modules=["shell", "player"])
if not compile_ok:
    print("Compilation failed!")
    sys.exit(1)

out_amr = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/PenBili-cached-3.5.2.amr"
pack_amr(clean_dir, out_amr, "8002026091900004", "PenBili", "3.5.2")
print("AMR packaged successfully at:", out_amr)
