import bvn from 'bvn';

export default {
  name: 'bvn',
  data() {
    return {
      statusText: '正在启动 死神VS火影...',
      exiting: false
    };
  },
  methods: {
    launchGame() {
      try {
        if (bvn && typeof bvn.start === 'function') {
          bvn.start();
          this.statusText = '死神VS火影 运行中';
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
        if (bvn && typeof bvn.stop === 'function') {
          bvn.stop();
        }
        if (this.$page && typeof this.$page.finish === 'function') {
          this.$page.finish();
        }
      } catch (e) {
        this.exiting = false;
        this.statusText = '退出异常: ' + e;
      }
    },
    onShow() {
      try {
        var self = this;
        this._backpressed = function() {
          self.handleBack();
        };
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
          if (this._backpressed) {
            this.$page.$npage.off('backpressed', this._backpressed);
          }
        }
      } catch (e) {}
    },
    onUnload() {
      try {
        if (!this.exiting && bvn && typeof bvn.isRunning === 'function' && bvn.isRunning()) {
          bvn.stop();
        }
      } catch (e) {}
    }
  },
  mounted() {
    this.onShow();
  },
  render(h) {
    return h('div', {
      staticStyle: {
        width: '960px',
        height: '480px',
        backgroundColor: '#0e1016',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }
    }, [
      h('text', {
        staticStyle: {
          color: '#f59e0b',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '12px'
        }
      }, '死神VS火影 3.3'),
      h('text', {
        staticStyle: {
          color: '#cbd5e1',
          fontSize: '16px'
        }
      }, this.statusText)
    ]);
  }
};
