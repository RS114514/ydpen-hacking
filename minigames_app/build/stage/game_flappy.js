// game_flappy.js —— 像素小鸟 (Flappy Bird)
export function initFlappy(vm) {
  if (vm.g_flappy_timer) {
    clearInterval(vm.g_flappy_timer);
    vm.g_flappy_timer = null;
  }

  vm.g_flappy = {
    birdY: 100, // 0~200
    velocity: 0,
    pipes: [
      { x: 260, topH: 60, gap: 70 },
      { x: 420, topH: 90, gap: 70 }
    ],
    score: 0,
    bestScore: vm.g_flappy ? (vm.g_flappy.bestScore || 0) : 0,
    state: 'ready' // 'ready' | 'playing' | 'dead'
  };
}

export function handleFlappyJump(vm) {
  var f = vm.g_flappy;
  if (!f) return;

  if (f.state === 'ready') {
    f.state = 'playing';
    startFlappyLoop(vm);
  }

  if (f.state === 'playing') {
    f.velocity = -6.5; // 向上冲力
  } else if (f.state === 'dead') {
    initFlappy(vm);
    f.state = 'playing';
    startFlappyLoop(vm);
  }
}

function startFlappyLoop(vm) {
  if (vm.g_flappy_timer) clearInterval(vm.g_flappy_timer);
  vm.g_flappy_timer = setInterval(function() {
    var f = vm.g_flappy;
    if (!f || f.state !== 'playing') {
      if (vm.g_flappy_timer) clearInterval(vm.g_flappy_timer);
      return;
    }

    // 重力
    f.velocity += 0.8;
    f.birdY += f.velocity;

    // 落地碰撞
    if (f.birdY >= 180) {
      f.birdY = 180;
      f.state = 'dead';
      clearInterval(vm.g_flappy_timer);
      vm.g_flappy_timer = null;
      if (vm.$forceUpdate) vm.$forceUpdate();
      return;
    }
    if (f.birdY < 0) f.birdY = 0;

    // 管道移动与碰撞
    for (var i = 0; i < f.pipes.length; i++) {
      var p = f.pipes[i];
      p.x -= 4;

      // 鸟的位置恒定在 x=60, 宽 16, 高 16
      // 管道宽 36
      if (p.x < 76 && p.x + 36 > 60) {
        // 在管道横向范围内，检测纵向是否撞击
        var topEnd = p.topH;
        var bottomStart = p.topH + p.gap;
        if (f.birdY < topEnd || f.birdY + 16 > bottomStart) {
          f.state = 'dead';
          clearInterval(vm.g_flappy_timer);
          vm.g_flappy_timer = null;
          if (vm.$forceUpdate) vm.$forceUpdate();
          return;
        }
      }

      // 通过得分
      if (p.x === 56) {
        f.score++;
        if (f.score > f.bestScore) f.bestScore = f.score;
      }

      // 移出屏幕重置
      if (p.x < -40) {
        p.x = 280;
        p.topH = 30 + Math.floor(Math.random() * 80);
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 50);
}

export function renderFlappy(vm, h) {
  var f = vm.g_flappy;
  if (!f) return h('div');

  var elements = [];

  // 天空与地面
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '196px', width: '280px', height: '14px',
      backgroundColor: '#15803d'
    }
  }));

  // 绘制管道
  for (var i = 0; i < f.pipes.length; i++) {
    var p = f.pipes[i];
    // 上管道
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: p.x + 'px', top: '0px', width: '36px', height: p.topH + 'px',
        backgroundColor: '#22c55e', borderBottomWidth: '4px', borderColor: '#166534',
        borderRadius: '2px'
      }
    }));
    // 下管道
    var bH = 200 - (p.topH + p.gap);
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: p.x + 'px', top: (p.topH + p.gap) + 'px', width: '36px', height: bH + 'px',
        backgroundColor: '#22c55e', borderTopWidth: '4px', borderColor: '#166534',
        borderRadius: '2px'
      }
    }));
  }

  // 小鸟 (金色小鸟)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '60px', top: Math.floor(f.birdY) + 'px', width: '18px', height: '18px',
      backgroundColor: '#fbbf24', borderRadius: '9px', borderWidth: '2px', borderColor: '#d97706',
      justifyContent: 'center', alignItems: 'center'
    }
  }, [
    h('div', {
      staticStyle: {
        width: '4px', height: '4px', borderRadius: '2px', backgroundColor: '#1e293b',
        position: 'absolute', right: '3px', top: '3px'
      }
    }),
    h('div', {
      staticStyle: {
        width: '6px', height: '4px', backgroundColor: '#f97316',
        position: 'absolute', right: '-4px', top: '7px', borderRadius: '1px'
      }
    })
  ]));

  // 状态蒙层
  if (f.state === 'ready') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '280px', height: '210px',
        backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#ffffff', fontWeight: 'bold' } }, '点击屏幕任意处起跳')
    ]));
  } else if (f.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '280px', height: '210px',
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px', color: '#ef4444', fontWeight: 'bold' } }, '游戏结束!'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '最终得分: ' + f.score),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '8px' } }, '点击屏幕重新起飞 🚀')
    ]));
  }

  return h('div', {
    staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' },
    on: { click: function() { handleFlappyJump(vm); } }
  }, [
    // 游戏舞台 (280x210)
    h('div', {
      staticStyle: {
        width: '280px', height: '210px', backgroundColor: '#0284c7',
        borderRadius: '6px', overflow: 'hidden', position: 'relative'
      }
    }, elements),
    // 右侧分数栏
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, 'Flappy Bird 飞鸟'),
      h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', marginTop: '10px' } }, '当前得分: ' + f.score),
      h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8', marginTop: '6px' } }, '历史最高: ' + f.bestScore),
      h('div', {
        staticStyle: {
          width: '90px', height: '30px', backgroundColor: '#0284c7',
          borderRadius: '15px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { handleFlappyJump(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, '起跳')
      ])
    ])
  ]);
}
