// game_runner.js —— 极速跑酷 (Parkour Runner)
export function initRunner(vm) {
  if (vm.g_runner_timer) {
    clearInterval(vm.g_runner_timer);
    vm.g_runner_timer = null;
  }

  var best = vm.g_runner ? (vm.g_runner.bestScore || 0) : 0;

  vm.g_runner = {
    heroY: 144, // 地面线 y=144
    vy: 0,
    isJumping: false,
    frame: 0,
    obstacles: [
      { x: 380, w: 20, h: 28, type: 'spike' },
      { x: 620, w: 28, h: 32, type: 'barrier' }
    ],
    coins: [
      { x: 480, y: 100, taken: false },
      { x: 720, y: 90, taken: false }
    ],
    score: 0,
    distance: 0,
    bestScore: best,
    state: 'playing' // 'playing' | 'dead'
  };

  startRunnerLoop(vm);
}

export function handleRunnerJump(vm) {
  var r = vm.g_runner;
  if (!r) return;
  if (r.state === 'dead') {
    initRunner(vm);
    return;
  }
  if (!r.isJumping) {
    r.vy = -10.5;
    r.isJumping = true;
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function startRunnerLoop(vm) {
  if (vm.g_runner_timer) clearInterval(vm.g_runner_timer);
  vm.g_runner_timer = setInterval(function() {
    var r = vm.g_runner;
    if (!r || r.state !== 'playing') {
      if (vm.g_runner_timer) clearInterval(vm.g_runner_timer);
      return;
    }

    r.frame++;
    r.distance += 2;

    // 重力与下落
    if (r.isJumping) {
      r.vy += 0.92;
      r.heroY += r.vy;
      if (r.heroY >= 144) {
        r.heroY = 144;
        r.vy = 0;
        r.isJumping = false;
      }
    }

    // 障碍物位移
    for (var i = 0; i < r.obstacles.length; i++) {
      var ob = r.obstacles[i];
      ob.x -= 5.5;

      // 碰撞检测 (主角在 x=60, 宽22, 高26)
      if (ob.x < 82 && ob.x + ob.w > 60) {
        if (r.heroY + 26 > 170 - ob.h) {
          r.state = 'dead';
          if (r.score + r.distance > r.bestScore) r.bestScore = r.score + r.distance;
          clearInterval(vm.g_runner_timer);
          vm.g_runner_timer = null;
          if (vm.$forceUpdate) vm.$forceUpdate();
          return;
        }
      }

      if (ob.x < -40) {
        ob.x = 520 + Math.floor(Math.random() * 200);
        ob.h = 24 + Math.floor(Math.random() * 14);
      }
    }

    // 金币移动
    for (var i = 0; i < r.coins.length; i++) {
      var cn = r.coins[i];
      cn.x -= 5.5;
      if (!cn.taken && cn.x < 82 && cn.x + 18 > 60) {
        if (Math.abs(r.heroY - cn.y) < 28) {
          cn.taken = true;
          r.score += 100;
        }
      }
      if (cn.x < -30) {
        cn.x = 540 + Math.floor(Math.random() * 220);
        cn.taken = false;
        cn.y = 80 + Math.floor(Math.random() * 45);
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 40);
}

export function renderRunner(vm, h) {
  var r = vm.g_runner;
  if (!r) return h('div');

  var elements = [];

  // 地面道
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '170px', width: '530px', height: '18px',
      backgroundColor: '#1e1b4b', borderTopWidth: '3px', borderColor: '#6366f1'
    }
  }));

  // 地面流动条纹
  var offset = (r.frame * 5.5) % 80;
  for (var p = 0; p < 7; p++) {
    var px = (p * 80 - offset + 540) % 530;
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: px + 'px', top: '176px', width: '12px', height: '2px',
        backgroundColor: '#818cf8'
      }
    }));
  }

  // 主角 (16-bit 像素跑酷主角)
  elements.push(h('image', {
    staticStyle: {
      position: 'absolute', left: '56px', top: Math.floor(r.heroY - 6) + 'px',
      width: '24px', height: '32px'
    },
    attrs: { src: 'assets/runner_player.png' }
  }));

  // 障碍物 (16-bit 像素跨栏路障)
  for (var i = 0; i < r.obstacles.length; i++) {
    var ob = r.obstacles[i];
    elements.push(h('image', {
      staticStyle: {
        position: 'absolute', left: Math.floor(ob.x) + 'px', top: (170 - ob.h) + 'px',
        width: ob.w + 'px', height: ob.h + 'px'
      },
      attrs: { src: 'assets/runner_hurdle.png' }
    }));
  }

  // 金币 (16-bit 像素高光金星)
  for (var i = 0; i < r.coins.length; i++) {
    var cn = r.coins[i];
    if (!cn.taken) {
      elements.push(h('image', {
        staticStyle: {
          position: 'absolute', left: Math.floor(cn.x) + 'px', top: cn.y + 'px',
          width: '20px', height: '20px'
        },
        attrs: { src: 'assets/runner_star.png' }
      }));
    }
  }

  if (r.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '530px', height: '188px',
        backgroundColor: 'rgba(9, 13, 22, 0.75)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } }, '× 撞击障碍 奔跑中止 ×'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } },
        '里程: ' + r.distance + ' m | 金币得分: ' + r.score
      ),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '6px' } }, '轻触屏幕重新起跑')
    ]));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 宽幅跑道 (530x188)
    h('div', {
      staticStyle: {
        width: '530px', height: '188px', backgroundColor: '#090d16',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#334155', marginRight: '20px'
      },
      on: { click: function() { handleRunnerJump(vm); } }
    }, elements),

    // 右侧信息面板
    h('div', {
      staticStyle: {
        flex: 1, height: '188px', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center' } }, [
        h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '极速跑酷'),
        h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' } }, '跑酷里程:'),
        h('text', { staticStyle: { fontSize: '22px', color: '#6366f1', fontWeight: 'bold' } }, r.distance + ' m'),
        h('text', { staticStyle: { fontSize: '11px', color: '#facc15', marginTop: '2px' } }, '金币分: +' + r.score)
      ]),

      // 巨型跳跃按钮
      h('div', {
        staticStyle: {
          width: '180px', height: '56px', backgroundColor: '#4f46e5', borderRadius: '14px',
          borderWidth: '2px', borderColor: '#818cf8', justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { handleRunnerJump(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '18px', color: '#ffffff', fontWeight: 'bold' } }, '▲ 起跳 (JUMP)')
      ])
    ])
  ]);
}
