// game_dino.js —— 谷歌小恐龙 (Chrome Dino Runner)
export function initDino(vm) {
  if (vm.g_dino_timer) {
    clearInterval(vm.g_dino_timer);
    vm.g_dino_timer = null;
  }

  var best = vm.g_dino ? (vm.g_dino.bestScore || 0) : 0;

  vm.g_dino = {
    dinoY: 136, // 地面线 y=136
    vy: 0,
    isJumping: false,
    frame: 0,
    cacti: [
      { x: 380, w: 18, h: 32 },
      { x: 620, w: 26, h: 36 }
    ],
    birds: [
      { x: 800, y: 92, w: 24, h: 16 }
    ],
    score: 0,
    bestScore: best,
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
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function startDinoLoop(vm) {
  if (vm.g_dino_timer) clearInterval(vm.g_dino_timer);
  vm.g_dino_timer = setInterval(function() {
    var d = vm.g_dino;
    if (!d || d.state !== 'playing') {
      if (vm.g_dino_timer) clearInterval(vm.g_dino_timer);
      return;
    }

    d.frame++;
    d.score++;
    if (d.score > d.bestScore) d.bestScore = d.score;

    // 渐进加速
    if (d.score % 200 === 0 && d.speed < 10) {
      d.speed += 0.5;
    }

    // 重力
    if (d.isJumping) {
      d.vy += 0.95;
      d.dinoY += d.vy;
      if (d.dinoY >= 136) {
        d.dinoY = 136;
        d.vy = 0;
        d.isJumping = false;
      }
    }

    // 仙人掌移动与碰撞
    for (var i = 0; i < d.cacti.length; i++) {
      var c = d.cacti[i];
      c.x -= d.speed;

      // 恐龙位置 x=60, 宽 26, 高 32
      if (c.x < 84 && c.x + c.w > 64) {
        if (d.dinoY + 30 > 168 - c.h) {
          d.state = 'dead';
          clearInterval(vm.g_dino_timer);
          vm.g_dino_timer = null;
          if (vm.$forceUpdate) vm.$forceUpdate();
          return;
        }
      }

      if (c.x < -40) {
        c.x = 520 + Math.floor(Math.random() * 200);
        c.h = 28 + Math.floor(Math.random() * 14);
      }
    }

    // 翼龙移动与碰撞
    for (var i = 0; i < d.birds.length; i++) {
      var b = d.birds[i];
      b.x -= (d.speed + 1.5);

      if (b.x < 84 && b.x + b.w > 64) {
        if (d.dinoY < b.y + b.h && d.dinoY + 30 > b.y) {
          d.state = 'dead';
          clearInterval(vm.g_dino_timer);
          vm.g_dino_timer = null;
          if (vm.$forceUpdate) vm.$forceUpdate();
          return;
        }
      }

      if (b.x < -60) {
        b.x = 680 + Math.floor(Math.random() * 260);
        b.y = 80 + Math.floor(Math.random() * 35);
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 40);
}

export function renderDino(vm, h) {
  var d = vm.g_dino;
  if (!d) return h('div');

  var elements = [];

  // 沙漠地面线
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '168px', width: '530px', height: '3px',
      backgroundColor: '#64748b'
    }
  }));

  // 地面碎石动效
  var offset = (d.frame * d.speed) % 100;
  for (var p = 0; p < 6; p++) {
    var px = (p * 90 - offset + 540) % 530;
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: px + 'px', top: '172px', width: '8px', height: '2px',
        backgroundColor: '#475569'
      }
    }));
  }

  // 恐龙主角 (16-bit 像素霸王龙，双腿交替迈步动画)
  var dinoSprite = (d.isJumping || d.frame % 4 < 2) ? 'assets/dino_run1.png' : 'assets/dino_run2.png';
  elements.push(h('image', {
    staticStyle: {
      position: 'absolute', left: '56px', top: Math.floor(d.dinoY - 4) + 'px',
      width: '32px', height: '36px'
    },
    attrs: { src: dinoSprite }
  }));

  // 仙人掌 (像素仙人掌)
  for (var i = 0; i < d.cacti.length; i++) {
    var c = d.cacti[i];
    elements.push(h('image', {
      staticStyle: {
        position: 'absolute', left: Math.floor(c.x) + 'px', top: (168 - 34) + 'px',
        width: '24px', height: '34px'
      },
      attrs: { src: 'assets/dino_cactus.png' }
    }));
  }

  // 翼龙 (像素飞翼翼龙)
  for (var i = 0; i < d.birds.length; i++) {
    var b = d.birds[i];
    elements.push(h('image', {
      staticStyle: {
        position: 'absolute', left: Math.floor(b.x) + 'px', top: b.y + 'px',
        width: '32px', height: '24px'
      },
      attrs: { src: 'assets/dino_pterodactyl.png' }
    }));
  }

  // 死亡结算
  if (d.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '530px', height: '188px',
        backgroundColor: 'rgba(9, 13, 22, 0.75)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } }, '× 奔跑终结 GAME OVER ×'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '奔跑里程: ' + d.score + ' 米 | 历史纪录: ' + d.bestScore + ' 米'),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '6px' } }, '轻触屏幕或右侧按钮重新起跑')
    ]));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 宽幅沙丘舞台 (530x188)
    h('div', {
      staticStyle: {
        width: '530px', height: '188px', backgroundColor: '#090d16',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#334155', marginRight: '20px'
      },
      on: { click: function() { handleDinoJump(vm); } }
    }, elements),

    // 右侧分数与大触控按键
    h('div', {
      staticStyle: {
        flex: 1, height: '188px', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center' } }, [
        h('text', { staticStyle: { fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' } }, '谷歌小恐龙'),
        h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' } }, '当前里程:'),
        h('text', { staticStyle: { fontSize: '24px', color: '#10b981', fontWeight: 'bold' } }, d.score + ' m'),
        h('text', { staticStyle: { fontSize: '10px', color: '#64748b' } }, '历史最高: ' + d.bestScore + ' m')
      ]),

      // 巨型起跳大按钮
      h('div', {
        staticStyle: {
          width: '180px', height: '56px', backgroundColor: '#059669', borderRadius: '14px',
          borderWidth: '2px', borderColor: '#34d399', justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { handleDinoJump(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '18px', color: '#ffffff', fontWeight: 'bold' } }, '▲ 起跳 (JUMP)')
      ])
    ])
  ]);
}
