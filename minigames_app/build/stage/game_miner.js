// game_miner.js —— 黄金矿工 (Gold Miner)
export function initMiner(vm) {
  if (vm.g_miner_timer) {
    clearInterval(vm.g_miner_timer);
    vm.g_miner_timer = null;
  }

  // 矿物分布
  var items = [
    { x: 120, y: 110, r: 16, type: 'gold', val: 100, color: '#facc15', label: '金' },
    { x: 220, y: 150, r: 24, type: 'gold', val: 250, color: '#eab308', label: '金' },
    { x: 330, y: 120, r: 12, type: 'diamond', val: 500, color: '#38bdf8', label: '钻' },
    { x: 420, y: 140, r: 20, type: 'rock', val: 20, color: '#64748b', label: '石' },
    { x: 480, y: 90, r: 14, type: 'gold', val: 100, color: '#facc15', label: '金' }
  ];

  vm.g_miner = {
    originX: 265, // 顶部矿工绳索起点
    originY: 15,
    angle: 0, // -60 ~ 60 度
    angleDir: 1.5,
    state: 'swing', // 'swing' | 'extending' | 'retracting'
    hookLen: 20,
    hookSpeed: 5,
    caughtItem: null,
    score: 0,
    timeLeft: 60,
    items: items
  };

  startMinerLoop(vm);
}

export function handleMinerDrop(vm) {
  var m = vm.g_miner;
  if (!m || m.state !== 'swing') return;
  m.state = 'extending';
  m.hookSpeed = 6;
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function startMinerLoop(vm) {
  if (vm.g_miner_timer) clearInterval(vm.g_miner_timer);
  vm.g_miner_timer = setInterval(function() {
    var m = vm.g_miner;
    if (!m) {
      if (vm.g_miner_timer) clearInterval(vm.g_miner_timer);
      return;
    }

    if (m.state === 'swing') {
      m.angle += m.angleDir;
      if (m.angle > 55 || m.angle < -55) m.angleDir = -m.angleDir;
    } else if (m.state === 'extending') {
      m.hookLen += m.hookSpeed;
      var rad = (m.angle * Math.PI) / 180;
      var hx = m.originX + Math.sin(rad) * m.hookLen;
      var hy = m.originY + Math.cos(rad) * m.hookLen;

      // 抓取碰撞检测
      for (var i = 0; i < m.items.length; i++) {
        var it = m.items[i];
        if (it.caught) continue;
        var dx = hx - it.x, dy = hy - it.y;
        if (Math.sqrt(dx * dx + dy * dy) < it.r + 6) {
          it.caught = true;
          m.caughtItem = it;
          m.state = 'retracting';
          m.hookSpeed = it.type === 'rock' ? 2 : (it.type === 'gold' ? 3.5 : 5);
          break;
        }
      }

      // 触及边界回拉
      if (hx < 10 || hx > 520 || hy > 175) {
        m.state = 'retracting';
        m.hookSpeed = 5;
      }
    } else if (m.state === 'retracting') {
      m.hookLen -= m.hookSpeed;
      if (m.hookLen <= 20) {
        m.hookLen = 20;
        m.state = 'swing';
        if (m.caughtItem) {
          m.score += m.caughtItem.val;
          // 从矿场中移除
          for (var i = 0; i < m.items.length; i++) {
            if (m.items[i] === m.caughtItem) {
              m.items.splice(i, 1);
              break;
            }
          }
          m.caughtItem = null;
        }
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 40);
}

export function renderMiner(vm, h) {
  var m = vm.g_miner;
  if (!m) return h('div');

  var elements = [];

  // 矿井顶棚
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '0px', width: '530px', height: '18px',
      backgroundColor: '#451a03', borderBottomWidth: '2px', borderColor: '#78350f'
    }
  }));

  // 矿石分布
  for (var i = 0; i < m.items.length; i++) {
    var it = m.items[i];
    var ix = it.caught ? (m.originX + Math.sin((m.angle * Math.PI) / 180) * m.hookLen) : it.x;
    var iy = it.caught ? (m.originY + Math.cos((m.angle * Math.PI) / 180) * m.hookLen) : it.y;

    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: Math.floor(ix - it.r) + 'px', top: Math.floor(iy - it.r) + 'px',
        width: (it.r * 2) + 'px', height: (it.r * 2) + 'px',
        backgroundColor: it.color, borderRadius: it.r + 'px',
        borderWidth: '1.5px', borderColor: '#ffffff',
        justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: (it.r < 15 ? '10px' : '12px'), color: '#090d16', fontWeight: 'bold' } }, it.label)
    ]));
  }

  // 飞爪与绳索
  var rad = (m.angle * Math.PI) / 180;
  var hx = m.originX + Math.sin(rad) * m.hookLen;
  var hy = m.originY + Math.cos(rad) * m.hookLen;

  // 爪头
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: Math.floor(hx - 6) + 'px', top: Math.floor(hy - 6) + 'px',
      width: '12px', height: '12px', backgroundColor: '#f97316', borderRadius: '6px',
      borderWidth: '2px', borderColor: '#ffffff'
    }
  }));

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 宽幅矿场舞台 (530x188)
    h('div', {
      staticStyle: {
        width: '530px', height: '188px', backgroundColor: '#1c1917',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#44403c', marginRight: '20px'
      },
      on: { click: function() { handleMinerDrop(vm); } }
    }, elements),

    // 右侧得分与下爪拉杆
    h('div', {
      staticStyle: {
        flex: 1, height: '188px', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center' } }, [
        h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '黄金矿工'),
        h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' } }, '累计收益:'),
        h('text', { staticStyle: { fontSize: '24px', color: '#facc15', fontWeight: 'bold' } }, '$' + m.score)
      ]),

      // 释放飞爪按钮
      h('div', {
        staticStyle: {
          width: '180px', height: '56px', backgroundColor: m.state === 'swing' ? '#d97706' : '#78350f',
          borderRadius: '14px', borderWidth: '2px', borderColor: '#fde047',
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { handleMinerDrop(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '18px', color: '#ffffff', fontWeight: 'bold' } },
          m.state === 'swing' ? '▼ 释放飞爪 (GRAB)' : '收爪拉回中...'
        )
      ]),

      h('div', {
        staticStyle: {
          width: '120px', height: '28px', backgroundColor: '#334155', borderRadius: '14px',
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { initMiner(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '11px', color: '#f8fafc' } }, '重置矿场')
      ])
    ])
  ]);
}
