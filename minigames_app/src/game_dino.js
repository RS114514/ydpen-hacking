// game_dino.js —— 谷歌小恐龙 (Chrome Dino Runner)
export function initDino(vm) {
  if (vm.g_dino_timer) {
    clearInterval(vm.g_dino_timer);
    vm.g_dino_timer = null;
  }

  vm.g_dino = {
    dinoY: 145, // 地面 y=145
    vy: 0,
    isJumping: false,
    cacti: [
      { x: 300, w: 14, h: 28 },
      { x: 480, w: 22, h: 32 }
    ],
    birds: [
      { x: 600, y: 110, w: 20, h: 14 }
    ],
    score: 0,
    speed: 5.5,
    state: 'playing' // 'playing' | 'dead'
  };

  startDinoLoop(vm);
}

export function handleDinoJump(vm) {
  var d = vm.g_dino;
  if (!d) return;
  if (d.state === 'dead') {
    initDino(vm);
    return;
  }
  if (!d.isJumping) {
    d.vy = -10.5;
    d.isJumping = true;
  }
}

function startDinoLoop(vm) {
  if (vm.g_dino_timer) clearInterval(vm.g_dino_timer);
  vm.g_dino_timer = setInterval(function() {
    var d = vm.g_dino;
    if (!d || d.state !== 'playing') {
      if (vm.g_dino_timer) clearInterval(vm.g_dino_timer);
      return;
    }

    d.score++;

    // 恐龙重力
    if (d.isJumping) {
      d.vy += 0.95;
      d.dinoY += d.vy;
      if (d.dinoY >= 145) {
        d.dinoY = 145;
        d.vy = 0;
        d.isJumping = false;
      }
    }

    // 仙人掌移动与碰撞 (恐龙在 x=40, 宽22, 高26)
    for (var i = 0; i < d.cacti.length; i++) {
      var c = d.cacti[i];
      c.x -= d.speed;

      if (c.x < 62 && c.x + c.w > 40) {
        if (d.dinoY + 26 > 171 - c.h + 4) {
          d.state = 'dead';
          clearInterval(vm.g_dino_timer);
          vm.g_dino_timer = null;
          if (vm.$forceUpdate) vm.$forceUpdate();
          return;
        }
      }

      if (c.x < -30) {
        c.x = 280 + Math.floor(Math.random() * 120);
        c.h = 24 + Math.floor(Math.random() * 14);
      }
    }

    // 翼龙移动与碰撞
    for (var i = 0; i < d.birds.length; i++) {
      var b = d.birds[i];
      b.x -= (d.speed + 1.5);
      if (b.x < 62 && b.x + b.w > 40) {
        if (Math.abs(d.dinoY - b.y) < 20) {
          d.state = 'dead';
          clearInterval(vm.g_dino_timer);
          vm.g_dino_timer = null;
          if (vm.$forceUpdate) vm.$forceUpdate();
          return;
        }
      }
      if (b.x < -40) {
        b.x = 450 + Math.floor(Math.random() * 200);
        b.y = 100 + Math.floor(Math.random() * 30);
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 40);
}

export function renderDino(vm, h) {
  var d = vm.g_dino;
  if (!d) return h('div');

  var elements = [];

  // 沙漠地平线 (点画线风格)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '171px', width: '280px', height: '2px',
      backgroundColor: '#94a3b8'
    }
  }));

  // 恐龙 (极简像素小恐龙 🦖)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '40px', top: Math.floor(d.dinoY) + 'px',
      width: '24px', height: '26px', justifyContent: 'center', alignItems: 'center'
    }
  }, [
    h('text', { staticStyle: { fontSize: '20px' } }, d.state === 'dead' ? '😵' : '🦖')
  ]));

  // 仙人掌 🌵
  for (var i = 0; i < d.cacti.length; i++) {
    var c = d.cacti[i];
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: c.x + 'px', top: (171 - c.h) + 'px',
        width: c.w + 'px', height: c.h + 'px', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px' } }, '🌵')
    ]));
  }

  // 翼龙 🦅
  for (var i = 0; i < d.birds.length; i++) {
    var b = d.birds[i];
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: b.x + 'px', top: b.y + 'px',
        width: b.w + 'px', height: b.h + 'px', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px' } }, '🦅')
    ]));
  }

  if (d.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '280px', height: '210px',
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px', color: '#ef4444', fontWeight: 'bold' } }, 'GAME OVER'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '得分: ' + d.score),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '8px' } }, '点击屏幕重新奔跑 🦖')
    ]));
  }

  return h('div', {
    staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' },
    on: { click: function() { handleDinoJump(vm); } }
  }, [
    // 舞台 (280x210)
    h('div', {
      staticStyle: {
        width: '280px', height: '210px', backgroundColor: '#0f172a',
        borderRadius: '6px', overflow: 'hidden', position: 'relative'
      }
    }, elements),

    // 右侧分数
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '谷歌小恐龙'),
      h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', marginTop: '8px' } }, '里程: ' + d.score + ' m'),
      h('div', {
        staticStyle: {
          width: '90px', height: '34px', backgroundColor: '#475569',
          borderRadius: '17px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { handleDinoJump(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, '起跳 🦖')
      ])
    ])
  ]);
}
