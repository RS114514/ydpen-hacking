import hl from 'hl';

export default {
  name: 'halflife',
  data() {
    return {
      statusText: '正在载入黑山基地...',
      exiting: false
    };
  },
  methods: {
    launchGame() {
      try {
        if (hl && typeof hl.start === 'function') {
          // 原生插件将自动检测是否存在 quick.sav：
          // 若存在则自动执行 +load quick 恢复进度，若首次游玩则启动 c0a0 战役
          hl.start({ basedir: '/userdisk/halflife' });
          this.statusText = '战役进行中';
        }
      } catch (e) {
        this.statusText = '启动异常: ' + e;
      }
    },
    handleBack() {
      if (this.exiting) return;
      this.exiting = true;
      this.statusText = '正在自动存档并退出...';

      try {
        var result = hl.stop();
        if (!result || !result.ok) {
          this.exiting = false;
          this.statusText = '未能确认存档并退出，请重试或在游戏菜单中保存';
          return;
        }
        if (this.$page && typeof this.$page.finish === 'function') {
          this.$page.finish();
        }
      } catch (e) {
        this.exiting = false;
        this.statusText = '存档失败: ' + e;
      }
    },
    onShow() {
      try {
        var self = this;
        this._backpressed = function() {
          self.handleBack();
        };
        if (this.$page && this.$page.$npage) {
          // 接管实体返回键，按下时自动保存并返回系统桌面
          this.$page.$npage.setSupportBack(false);
          this.$page.$npage.on('backpressed', this._backpressed);
        }
      } catch (e) {}

      // 自动启动游戏
      this.launchGame();
    },
    onHide() {
      try {
        if (this.$page && this.$page.$npage) {
          this.$page.$npage.setSupportBack(true);
          if (this._backpressed) {
            this.$page.$npage.off('backpressed', this._backpressed);
          }
        }
      } catch (e) {}

      // 息屏/切后台保护：自动触发快速保存
      try {
        if (!this.exiting && hl && typeof hl.save === 'function') {
          hl.save();
        }
      } catch (e) {}
    },
    onUnload() {
      if (this._heartbeat) {
        clearInterval(this._heartbeat);
        this._heartbeat = null;
      }
      try {
        if (!this.exiting && hl && typeof hl.isRunning === 'function' && hl.isRunning()) {
          hl.stop();
        }
      } catch (e) {}
    }
  },
  mounted() {
    this.onShow();
    var self = this;
    this._heartbeat = setInterval(function() {
      try {
        if (!self.exiting && hl && typeof hl.isRunning === 'function' && !hl.isRunning()) {
          self.launchGame();
        }
      } catch (e) {}
    }, 1000);
  },
  render(h) {
    var self = this;
    return h('div', {
      staticStyle: {
        width: '960px',
        height: '266px',
        backgroundColor: '#000000',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: '20px'
      }
    }, [
      h('div', {
        staticStyle: {
          width: '320px',
          height: '42px',
          backgroundColor: '#f57e00',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '4px',
          marginBottom: '10px'
        }
      }, [
        h('text', {
          staticStyle: {
            color: '#000000',
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '2px'
          }
        }, 'HALF-LIFE')
      ]),
      h('text', {
        staticStyle: {
          color: '#8899aa',
          fontSize: '13px',
          letterSpacing: '1px',
          marginBottom: '12px'
        }
      }, 'BLACK MESA RESEARCH FACILITY'),
      h('text', {
        staticStyle: {
          color: '#cbd5e1',
          fontSize: '14px'
        }
      }, self.statusText)
    ]);
  }
};
