import term from 'term';

var launched = false;

function launchDoom(vm) {
  if (launched) return;
  launched = true;
  try {
    var r = term.spawn('/userdisk/doom/launch_from_icon.sh', { cols: 120, rows: 12 });
    try { console.warn('[doom-ui] spawn ' + JSON.stringify(r)); } catch (e) {}
    if (vm) {
      setTimeout(function () {
        try {
          if (vm.$page && typeof vm.$page.finish === 'function') vm.$page.finish();
        } catch (e) {}
      }, 1500);
    }
  } catch (e) {
    launched = false;
    try { console.warn('[doom-ui] spawn failed: ' + e); } catch (e2) {}
  }
}

export default {
  name: 'doom',
  methods: {
    onShow() { launchDoom(this); },
    onHide() {},
    onUnload() {}
  },
  mounted() {
    var self = this;
    setTimeout(function () { launchDoom(self); }, 300);
  },
  render(h) {
    return h('div', {
      staticStyle: {
        width: '960px', height: '266px', backgroundColor: '#08080f',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }
    }, [
      h('text', { staticStyle: { color: '#ffb030', fontSize: '48px', fontWeight: 'bold' } }, 'DOOM'),
      h('text', { staticStyle: { color: '#cfd6e4', fontSize: '18px', marginTop: '10px' } }, 'STARTING...')
    ]);
  }
};
