// root.js —— 根组件（构建后为 Component.js.bin）：列表视图 / 播放视图 无缝切换
import { listMethods, renderList } from './ListView.js';
import { playerMethods, renderPlayer } from './PlayerView.js';
import { getPlayer, log } from './Common.js';

try { console.warn('[vp] Component evaluated'); } catch (e) {}

var methods = {
  // 页面生命周期必须写在 methods 里（基类用 $root.onShow() 转发）
  onShow: function () {
    log('onShow view=' + this.view);
    if (this.view === 'list') {
      if (typeof this.loadDirectory === 'function') {
        this.loadDirectory(this.currentDir);
      } else {
        this.loadMovies();
      }
    } else if (this.state === 'paused' && this.cur) {
      /* 从后台回来保持暂停，由用户点播放 */
    }
  },
  onHide: function () {
    // 切到后台：播放中则暂停并停止轮询
    if (this.view === 'player') {
      var P = getPlayer();
      try { if (P && this.state === 'playing') { P.pause(); this.state = 'paused'; } } catch (e) {}
      this.clearHide();
    }
  },
  onUnload: function () {
    this.stopTick();
    this.clearHide();
    var P = getPlayer();
    try { if (P) P.stop(); } catch (e) {}
  },
};
var k;
for (k in listMethods) methods[k] = listMethods[k];
for (k in playerMethods) methods[k] = playerMethods[k];

export default {
  name: 'index',
  data: function () {
    return {
      view: 'list',            // 'list' | 'player'
      items: [],
      listLoaded: false,
      listError: '',
      currentDir: '/userdisk/Favorite/Movies',
      parentDir: '/userdisk/Favorite/Movies',
      canBack: false,
      dirHistory: [],
      cur: null,
      state: 'idle',           // idle|loading|playing|paused|ended|error
      loading: false,
      started: false,
      errText: '',
      posMs: 0,
      durMs: 0,
      scaleIdx: 0,
      controlsVisible: true,
    };
  },
  methods: methods,
  render: function (h) {
    return this.view === 'player' ? renderPlayer(this, h) : renderList(this, h);
  },
};
