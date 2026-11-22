import pvz from 'pvz';

export default {
  name: 'pvz',
  data() {
    return { statusText: '正在载入植物大战僵尸...', exiting: false };
  },
  methods: {
    launchGame() {
      try {
        if (pvz && typeof pvz.start === 'function') {
          pvz.start();
          this.statusText = '游戏进行中';
        }
      } catch (e) {
        this.statusText = '启动异常: ' + e;
      }
    },
    handleBack() {
      if (this.exiting) return;
      this.exiting = true;
      this.statusText = '正在退出...';
      try {
        if (pvz && typeof pvz.stop === 'function') pvz.stop();
        if (this.$page && typeof this.$page.finish === 'function') this.$page.finish();
      } catch (e) {
        this.exiting = false;
        this.statusText = '退出失败: ' + e;
      }
    },
    onShow() {
      try {
        var self = this;
        this._backpressed = function () { self.handleBack(); };
        if (this.$page && this.$page.$npage) {
          this.$page.$npage.setSupportBack(false);
          this.$page.$npage.on('backpressed', this._backpressed);
        }
      } catch (e) {}
      this.launchGame();
    },
    onHide() {
      try {
        if (this.$page && this.$page.$npage) {
          this.$page.$npage.setSupportBack(true);
          if (this._backpressed) this.$page.$npage.off('backpressed', this._backpressed);
        }
      } catch (e) {}
    },
    onUnload() {
      try {
        if (!this.exiting && pvz && typeof pvz.isRunning === 'function' && pvz.isRunning()) pvz.stop();
      } catch (e) {}
    }
  },
  mounted() { this.onShow(); },
  render(h) {
    return h('div', {
      staticStyle: {
        width: '960px', height: '266px', backgroundColor: '#000000',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        boxSizing: 'border-box', padding: '20px'
      }
    }, [
      h('text', { staticStyle: { color: '#7ec850', fontSize: '32px', fontWeight: 'bold' } }, '植物大战僵尸'),
      h('text', { staticStyle: { color: '#8899aa', fontSize: '20px', marginTop: '10px' } }, this.statusText)
    ]);
  }
};
