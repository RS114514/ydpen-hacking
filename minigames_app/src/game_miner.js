// game_miner.js —— 黄金矿工 (Gold Miner)
export function initMiner(vm) {
  if (vm.g_miner_timer) {
    clearInterval(vm.g_miner_timer);
    vm.g_miner_timer = null;
  }

  // 矿物列表 (x, y, radius, type, value, weight)
  var minerals = [
    { x: 50, y: 110, r: 14, type: 'gold', val: 250, w: 2 },
    { x: 130, y: 150, r: 20, type: 'gold', val: 500, w: 3.5 },
    { x: 210, y: 120, r: 12, type: 'diamond', val: 600, w: 1 },
    { x: 90, y: 160, r: 18, type: 'rock', val: 20, w: 4 },
    { x: 170, y: 100, r: 16, type: 'rock', val: 30, w: 3 }
  ];

  vm.g_miner = {
    angle: 0, // -70度 到 +70度
    angleSpeed: 2.5,
    hookLen: 25,
    hookState: 'swing', // 'swing' | 'extend' | 'retract'
    hookX: 130,
    hookY: 25,
    caughtItem: null,
    score: 0,
    timeRemain: 60,
    minerals: minerals
  };

  startMinerLoop(vm);
}

export function handleMinerDrop(vm) {
  var m = vm.g_miner;
  if (!m || m.hookState !== 'swing') return;
  m.hookState = 'extend';
}

function startMinerLoop(vm) {
  if (vm.g_miner_timer) clearInterval(vm.g_miner_timer);
  vm.g_miner_timer = setInterval(function() {
    var m = vm.g_miner;
    if (!m) {
      if (vm.g_miner_timer) clearInterval(vm.g_miner_timer);
      return;
    }

    var rad = (m.angle * Math.PI) / 180;
    var originX = 130, originY = 25;

    if (m.hookState === 'swing') {
      m.angle += m.angleSpeed;
      if (m.angle > 70 || m.angle < -70) m.angleSpeed = -m.angleSpeed;
      m.hookLen = 25;
      m.hookX = originX + Math.sin(rad) * m.hookLen;
      m.hookY = originY + Math.cos(rad) * m.hookLen;
    } else if (m.hookState === 'extend') {
      m.hookLen += 5;
      m.hookX = originX + Math.sin(rad) * m.hookLen;
      m.hookY = originY + Math.cos(rad) * m.hookLen;

      // 碰撞检测
      for (var i = 0; i < m.minerals.length; i++) {
        var it = m.minerals[i];
        var dx = m.hookX - it.x;
        var dy = m.hookY - it.y;
        if (Math.sqrt(dx * dx + dy * dy) < it.r + 6) {
          // 抓到矿物
          m.caughtItem = it;
          m.minerals.splice(i, 1);
          m.hookState = 'retract';
          break;
        }
      }

      // 触及边界回拉
      if (m.hookX < 10 || m.hookX > 250 || m.hookY > 195) {
        m.hookState = 'retract';
      }
    } else if (m.hookState === 'retract') {
      var retractSpeed = m.caughtItem ? (6 / m.caughtItem.w) : 6;
      m.hookLen -= retractSpeed;
      if (m.hookLen <= 25) {
        m.hookLen = 25;
        if (m.caughtItem) {
          m.score += m.caughtItem.val;
          m.caughtItem = null;
        }
        m.hookState = 'swing';
      }
      m.hookX = originX + Math.sin(rad) * m.hookLen;
      m.hookY = originY + Math.cos(rad) * m.hookLen;
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 45);
}

export function renderMiner(vm, h) {
  var m = vm.g_miner;
  if (!m) return h('div');

  var elements = [];

  // 地面矿区背景
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '35px', width: '260px', height: '170px',
      backgroundColor: '#78350f', opacity: 0.85
    }
  }));

  // 矿工平台
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '115px', top: '10px', width: '30px', height: '22px',
      backgroundColor: '#f59e0b', borderRadius: '4px', justifyContent: 'center', alignItems: 'center'
    }
  }, [
    h('text', { staticStyle: { fontSize: '13px' } }, '🤠')
  ]));

  // 吊绳
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute',
      left: Math.min(130, m.hookX) + 'px',
      top: Math.min(25, m.hookY) + 'px',
      width: Math.max(3, Math.abs(m.hookX - 130)) + 'px',
      height: Math.max(3, Math.abs(m.hookY - 25)) + 'px',
      borderLeftWidth: '2px', borderColor: '#e2e8f0'
    }
  }));

  // 铁钩
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute',
      left: (m.hookX - 6) + 'px', top: (m.hookY - 6) + 'px',
      width: '12px', height: '12px', backgroundColor: '#94a3b8',
      borderRadius: '6px', borderWidth: '2px', borderColor: '#475569'
    }
  }));

  // 渲染所有待抓取矿物
  for (var i = 0; i < m.minerals.length; i++) {
    var it = m.minerals[i];
    var col = it.type === 'gold' ? '#eab308' : (it.type === 'diamond' ? '#38bdf8' : '#64748b');
    var emoji = it.type === 'gold' ? '🪙' : (it.type === 'diamond' ? '💎' : '🪨');
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute',
        left: (it.x - it.r) + 'px', top: (it.y - it.r) + 'px',
        width: (it.r * 2) + 'px', height: (it.r * 2) + 'px',
        borderRadius: it.r + 'px', backgroundColor: col,
        justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: (it.r * 0.9) + 'px' } }, emoji)
    ]));
  }

  // 被抓取的矿物跟随钩子
  if (m.caughtItem) {
    var cit = m.caughtItem;
    var ccol = cit.type === 'gold' ? '#eab308' : (cit.type === 'diamond' ? '#38bdf8' : '#64748b');
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute',
        left: (m.hookX - cit.r) + 'px', top: (m.hookY) + 'px',
        width: (cit.r * 2) + 'px', height: (cit.r * 2) + 'px',
        borderRadius: cit.r + 'px', backgroundColor: ccol,
        justifyContent: 'center', alignItems: 'center'
      }
    }));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 矿区
    h('div', {
      staticStyle: {
        width: '260px', height: '202px', backgroundColor: '#451a03',
        borderRadius: '6px', overflow: 'hidden', position: 'relative'
      },
      on: { click: function() { handleMinerDrop(vm); } }
    }, elements),
    // 控制台
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '黄金矿工'),
      h('text', { staticStyle: { fontSize: '13px', color: '#facc15', marginTop: '8px' } }, '财富: $' + m.score),
      h('div', {
        staticStyle: {
          width: '90px', height: '34px', backgroundColor: '#eab308',
          borderRadius: '17px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { handleMinerDrop(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#1e293b', fontWeight: 'bold' } }, '放钩 🪝')
      ]),
      h('div', {
        staticStyle: {
          width: '90px', height: '26px', backgroundColor: '#334155',
          borderRadius: '13px', justifyContent: 'center', alignItems: 'center',
          marginTop: '10px'
        },
        on: { click: function() { initMiner(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8' } }, '重置矿区')
      ])
    ])
  ]);
}
