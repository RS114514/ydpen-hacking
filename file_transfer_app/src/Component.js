import term from 'term';

var CFG = {"title": "文件互传", "subtitle": "电脑浏览器上传下载词典笔里的文件", "port": "8080", "hint": "同一 WiFi 下，在电脑浏览器打开：", "tip": "保存位置：/userdisk/Favorite，支持拖拽上传", "ready": "文件互传服务运行中", "stopped": "文件互传服务未开启", "start_cmd": "/sbin/start-stop-daemon -S -b -x /userdisk/fssrv -- 8080 /userdisk/Favorite", "stop_cmd": "/sbin/start-stop-daemon -K -q -x /userdisk/fssrv; pkill -f '/userdisk/fssrv' 2>/dev/null", "grep": "[f]ssrv", "icon_color": [22, 163, 74]};

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
