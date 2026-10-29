// game_flappy.js —— 像素飞鸟 (Flappy Bird)
export function initFlappy(vm) {
  if (vm.g_flappy_timer) {
    clearInterval(vm.g_flappy_timer);
    vm.g_flappy_timer = null;
  }

  var best = vm.g_flappy ? (vm.g_flappy.bestScore || 0) : 0;

  vm.g_flappy = {
    birdY: 80,
    velocity: 0,
    pipes: [
      { x: 340, topH: 50, gap: 75, passed: false },
      { x: 520, topH: 80, gap: 75, passed: false },
      { x: 700, topH: 60, gap: 75, passed: false }
    ],
    score: 0,
    bestScore: best,
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
    f.velocity = -6.2;
  } else if (f.state === 'dead') {
    initFlappy(vm);
    f.state = 'playing';
    startFlappyLoop(vm);
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
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
    f.velocity += 0.72;
    f.birdY += f.velocity;

    // 触地或撞顶
    if (f.birdY >= 160) {
      f.birdY = 160;
      f.state = 'dead';
      if (f.score > f.bestScore) f.bestScore = f.score;
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

      // 鸟的位置在 x=70, 宽 20, 高 18
      // 管道宽 44
      if (p.x < 90 && p.x + 44 > 70) {
        var topEnd = p.topH;
        var bottomStart = p.topH + p.gap;
        if (f.birdY < topEnd || f.birdY + 18 > bottomStart) {
          f.state = 'dead';
          if (f.score > f.bestScore) f.bestScore = f.score;
          clearInterval(vm.g_flappy_timer);
          vm.g_flappy_timer = null;
          if (vm.$forceUpdate) vm.$forceUpdate();
          return;
        }
      }

      // 通过得分
      if (!p.passed && p.x + 44 < 70) {
        p.passed = true;
        f.score++;
        if (f.score > f.bestScore) f.bestScore = f.score;
      }

      // 移出屏幕重置循环
      if (p.x < -50) {
        p.x = 520;
        p.topH = 25 + Math.floor(Math.random() * 75);
        p.gap = 72;
        p.passed = false;
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 45);
}

export function renderFlappy(vm, h) {
  var f = vm.g_flappy;
  if (!f) return h('div');

  var elements = [];

  // 草地与地基 (高 16px)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '176px', width: '530px', height: '12px',
      backgroundColor: '#15803d', borderTopWidth: '3px', borderColor: '#86efac'
    }
  }));

  // 绘制三组管道
  for (var i = 0; i < f.pipes.length; i++) {
    var p = f.pipes[i];
    // 上管道
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: p.x + 'px', top: '0px', width: '42px', height: p.topH + 'px',
        backgroundColor: '#22c55e', borderBottomWidth: '5px', borderColor: '#166534',
        borderLeftWidth: '1.5px', borderRightWidth: '1.5px', borderStyle: 'solid'
      }
    }));
    // 下管道
    var bH = 188 - (p.topH + p.gap);
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: p.x + 'px', top: (p.topH + p.gap) + 'px', width: '42px', height: bH + 'px',
        backgroundColor: '#22c55e', borderTopWidth: '5px', borderColor: '#166534',
        borderLeftWidth: '1.5px', borderRightWidth: '1.5px', borderStyle: 'solid'
      }
    }));
  }

  // 小鸟 (几何像素萌鸟)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '70px', top: Math.floor(f.birdY) + 'px',
      width: '22px', height: '18px', backgroundColor: '#facc15', borderRadius: '9px',
      borderWidth: '2px', borderColor: '#ca8a04', justifyContent: 'center', alignItems: 'center'
    }
  }, [
    // 眼睛
    h('div', {
      staticStyle: {
        width: '5px', height: '5px', borderRadius: '2.5px', backgroundColor: '#090d16',
        position: 'absolute', right: '4px', top: '3px'
      }
    }),
    // 鸟嘴
    h('div', {
      staticStyle: {
        width: '7px', height: '5px', backgroundColor: '#f97316', borderRadius: '2px',
        position: 'absolute', right: '-5px', top: '7px'
      }
    })
  ]));

  // 状态蒙层
  if (f.state === 'ready') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '530px', height: '188px',
        backgroundColor: 'rgba(9, 13, 22, 0.4)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ffffff', fontWeight: 'bold' } }, '轻触屏幕或右侧按钮起飞')
    ]));
  } else if (f.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '530px', height: '188px',
        backgroundColor: 'rgba(9, 13, 22, 0.7)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } }, '× 撞击坠落 ×'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '本次得分: ' + f.score + ' | 历史纪录: ' + f.bestScore),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '6px' } }, '轻触屏幕立即重玩')
    ]));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 1. 宽幅 530px 蓝天舞台
    h('div', {
      staticStyle: {
        width: '530px', height: '188px', backgroundColor: '#0284c7',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#0369a1', marginRight: '20px'
      },
      on: { click: function() { handleFlappyJump(vm); } }
    }, elements),

    // 2. 侧边控制与分数
    h('div', {
      staticStyle: {
        flex: 1, height: '188px', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center' } }, [
        h('text', { staticStyle: { fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' } }, '像素飞鸟'),
        h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' } }, '当前得分:'),
        h('text', { staticStyle: { fontSize: '24px', color: '#facc15', fontWeight: 'bold' } }, '' + f.score),
        h('text', { staticStyle: { fontSize: '10px', color: '#64748b' } }, '历史最高: ' + f.bestScore)
      ]),

      // 巨型起飞按钮
      h('div', {
        staticStyle: {
          width: '180px', height: '56px', backgroundColor: '#f59e0b', borderRadius: '14px',
          borderWidth: '2px', borderColor: '#fbbf24', justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { handleFlappyJump(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '18px', color: '#ffffff', fontWeight: 'bold' } }, '▲ 起跳 (FLAP)')
      ])
    ])
  ]);
}
