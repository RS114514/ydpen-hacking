// game_pelican.js —— 鹈鹕骑自行车 (Pelican on a Bicycle)
export function initPelican(vm) {
  if (vm.g_pelican_timer) {
    clearInterval(vm.g_pelican_timer);
    vm.g_pelican_timer = null;
  }

  vm.g_pelican = {
    posX: 40,
    speed: 0,
    pedalPower: 0,
    tiltAngle: 0, // 俯仰平衡角度 -30 ~ +30
    distance: 0,
    fishCaught: 0,
    fishes: [
      { x: 180, y: 130, taken: false },
      { x: 340, y: 110, taken: false },
      { x: 500, y: 125, taken: false }
    ],
    state: 'playing' // 'playing' | 'crashed'
  };

  startPelicanLoop(vm);
}

export function handlePelicanAction(vm, act) {
  var p = vm.g_pelican;
  if (!p) return;
  if (p.state !== 'playing') {
    initPelican(vm);
    return;
  }

  if (act === 'pedal') {
    p.speed += 1.8;
    if (p.speed > 8) p.speed = 8;
  } else if (act === 'lean_back') {
    p.tiltAngle -= 5;
  } else if (act === 'lean_forward') {
    p.tiltAngle += 5;
  }
}

function startPelicanLoop(vm) {
  if (vm.g_pelican_timer) clearInterval(vm.g_pelican_timer);
  vm.g_pelican_timer = setInterval(function() {
    var p = vm.g_pelican;
    if (!p || p.state !== 'playing') {
      if (vm.g_pelican_timer) clearInterval(vm.g_pelican_timer);
      return;
    }

    // 速度与阻力
    p.distance += Math.floor(p.speed);
    p.speed *= 0.94; // 空气阻力

    // 自动轻微前倾自然物理
    if (p.speed > 2) {
      p.tiltAngle += (Math.random() * 1.5 - 0.7);
    }

    // 翻车判定 (角度过大)
    if (p.tiltAngle > 28 || p.tiltAngle < -28) {
      p.state = 'crashed';
      clearInterval(vm.g_pelican_timer);
      vm.g_pelican_timer = null;
      if (vm.$forceUpdate) vm.$forceUpdate();
      return;
    }

    // 小鱼捕捉与向前推移
    for (var i = 0; i < p.fishes.length; i++) {
      var f = p.fishes[i];
      f.x -= p.speed;
      if (!f.taken && f.x < 70 && f.x > 30) {
        f.taken = true;
        p.fishCaught++;
      }
      if (f.x < -30) {
        f.x = 280 + Math.floor(Math.random() * 160);
        f.taken = false;
        f.y = 115 + Math.floor(Math.random() * 25);
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 45);
}

export function renderPelican(vm, h) {
  var p = vm.g_pelican;
  if (!p) return h('div');

  var elements = [];

  // 沿海公路地平线 (海蓝天与柏油路)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '168px', width: '280px', height: '42px',
      backgroundColor: '#334155', borderTopWidth: '4px', borderColor: '#e2e8f0'
    }
  }));

  // 公路虚线
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '186px', width: '280px', height: '3px',
      backgroundColor: '#facc15'
    }
  }));

  // 待抓取的小鱼 🐟
  for (var i = 0; i < p.fishes.length; i++) {
    var f = p.fishes[i];
    if (!f.taken) {
      elements.push(h('div', {
        staticStyle: {
          position: 'absolute', left: Math.floor(f.x) + 'px', top: f.y + 'px',
          width: '20px', height: '16px', justifyContent: 'center', alignItems: 'center'
        }
      }, [
        h('text', { staticStyle: { fontSize: '15px' } }, '🐟')
      ]));
    }
  }

  // 鹈鹕骑自行车主角 (大嘴鸟 🦢/🦤 + 单车 🚲)
  var tiltDeg = Math.floor(p.tiltAngle);
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '46px', top: '128px',
      width: '42px', height: '42px', justifyContent: 'center', alignItems: 'center'
    }
  }, [
    h('text', { staticStyle: { fontSize: '20px', position: 'absolute', top: '-10px', left: '6px' } }, p.state === 'crashed' ? '😵' : '🦆'),
    h('text', { staticStyle: { fontSize: '24px' } }, '🚲')
  ]));

  if (p.state === 'crashed') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '280px', height: '210px',
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px', color: '#ef4444', fontWeight: 'bold' } }, '翻车啦！失去了平衡'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '骑行里程: ' + p.distance + 'm  吃到小鱼: ' + p.fishCaught + '条'),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '8px' } }, '轻触重新蹬车 🚴')
    ]));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 舞台 (280x210)
    h('div', {
      staticStyle: {
        width: '280px', height: '210px', backgroundColor: '#0ea5e9',
        borderRadius: '6px', overflow: 'hidden', position: 'relative'
      }
    }, elements),

    // 控制面板
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '鹈鹕骑自行车'),
      h('text', { staticStyle: { fontSize: '13px', color: '#facc15', marginTop: '6px' } }, '里程: ' + p.distance + ' m  小鱼: ' + p.fishCaught),
      h('text', { staticStyle: { fontSize: '11px', color: '#e2e8f0', marginTop: '2px' } }, '车身平衡倾角: ' + tiltDeg + '°'),

      // 控制按钮: 后仰 / 蹬踏加速 / 前倾
      h('div', { staticStyle: { flexDirection: 'row', marginTop: '12px' } }, [
        h('div', {
          staticStyle: { width: '40px', height: '36px', backgroundColor: '#334155', borderRadius: '8px', justifyContent: 'center', alignItems: 'center', marginRight: '6px' },
          on: { click: function() { handlePelicanAction(vm, 'lean_back'); } }
        }, [h('text', { staticStyle: { fontSize: '12px', color: '#ffffff' } }, '压车')]),
        h('div', {
          staticStyle: { width: '48px', height: '36px', backgroundColor: '#10b981', borderRadius: '8px', justifyContent: 'center', alignItems: 'center', marginRight: '6px' },
          on: { click: function() { handlePelicanAction(vm, 'pedal'); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, '蹬踏')]),
        h('div', {
          staticStyle: { width: '40px', height: '36px', backgroundColor: '#334155', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' },
          on: { click: function() { handlePelicanAction(vm, 'lean_forward'); } }
        }, [h('text', { staticStyle: { fontSize: '12px', color: '#ffffff' } }, '前倾')])
      ]),

      h('div', {
        staticStyle: { width: '80px', height: '26px', backgroundColor: '#475569', borderRadius: '13px', justifyContent: 'center', alignItems: 'center', marginTop: '10px' },
        on: { click: function() { initPelican(vm); } }
      }, [h('text', { staticStyle: { fontSize: '12px', color: '#ffffff' } }, '重置')])
    ])
  ]);
}
