// game_runner.js —— 极速跑酷 (Parkour Runner)
export function initRunner(vm) {
  if (vm.g_runner_timer) {
    clearInterval(vm.g_runner_timer);
    vm.g_runner_timer = null;
  }

  vm.g_runner = {
    heroY: 150, // 地面线 y=150
    vy: 0,
    isJumping: false,
    obstacles: [
      { x: 280, w: 18, h: 26, emoji: '🔥' },
      { x: 440, w: 22, h: 32, emoji: '🪨' }
    ],
    coins: [
      { x: 340, y: 120, taken: false },
      { x: 500, y: 100, taken: false }
    ],
    score: 0,
    distance: 0,
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
    r.vy = -10;
    r.isJumping = true;
  }
}

function startRunnerLoop(vm) {
  if (vm.g_runner_timer) clearInterval(vm.g_runner_timer);
  vm.g_runner_timer = setInterval(function() {
    var r = vm.g_runner;
    if (!r || r.state !== 'playing') {
      if (vm.g_runner_timer) clearInterval(vm.g_runner_timer);
      return;
    }

    r.distance += 2;

    // 重力
    if (r.isJumping) {
      r.vy += 0.9;
      r.heroY += r.vy;
      if (r.heroY >= 150) {
        r.heroY = 150;
        r.vy = 0;
        r.isJumping = false;
      }
    }

    // 障碍物左移
    for (var i = 0; i < r.obstacles.length; i++) {
      var ob = r.obstacles[i];
      ob.x -= 5;
      // 碰撞检测 (主角在 x=50, 宽20, 高24)
      if (ob.x < 70 && ob.x + ob.w > 50) {
        if (r.heroY + 24 > 176 - ob.h) {
          // 撞击障碍
          r.state = 'dead';
          clearInterval(vm.g_runner_timer);
          vm.g_runner_timer = null;
          if (vm.$forceUpdate) vm.$forceUpdate();
          return;
        }
      }
      if (ob.x < -30) {
        ob.x = 280 + Math.floor(Math.random() * 80);
      }
    }

    // 金币移动
    for (var i = 0; i < r.coins.length; i++) {
      var cn = r.coins[i];
      cn.x -= 5;
      if (!cn.taken && cn.x < 70 && cn.x + 16 > 50) {
        if (Math.abs(r.heroY - cn.y) < 26) {
          cn.taken = true;
          r.score += 50;
        }
      }
      if (cn.x < -30) {
        cn.x = 300 + Math.floor(Math.random() * 100);
        cn.taken = false;
        cn.y = 90 + Math.floor(Math.random() * 40);
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 45);
}

export function renderRunner(vm, h) {
  var r = vm.g_runner;
  if (!r) return h('div');

  var elements = [];

  // 地面
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '174px', width: '280px', height: '36px',
      backgroundColor: '#1e293b', borderTopWidth: '3px', borderColor: '#3b82f6'
    }
  }));

  // 主角 (奔跑小人 🏃)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '50px', top: Math.floor(r.heroY) + 'px',
      width: '24px', height: '24px', justifyContent: 'center', alignItems: 'center'
    }
  }, [
    h('text', { staticStyle: { fontSize: '20px' } }, r.state === 'dead' ? '💥' : '🏃')
  ]));

  // 障碍物
  for (var i = 0; i < r.obstacles.length; i++) {
    var ob = r.obstacles[i];
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: ob.x + 'px', top: (174 - ob.h) + 'px',
        width: ob.w + 'px', height: ob.h + 'px', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px' } }, ob.emoji)
    ]));
  }

  // 金币
  for (var i = 0; i < r.coins.length; i++) {
    var cn = r.coins[i];
    if (!cn.taken) {
      elements.push(h('div', {
        staticStyle: {
          position: 'absolute', left: cn.x + 'px', top: cn.y + 'px',
          width: '16px', height: '16px', borderRadius: '8px', backgroundColor: '#eab308',
          borderWidth: '1.5px', borderColor: '#fef08a', justifyContent: 'center', alignItems: 'center'
        }
      }, [
        h('text', { staticStyle: { fontSize: '9px', color: '#854d0e', fontWeight: 'bold' } }, '★')
      ]));
    }
  }

  if (r.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '280px', height: '210px',
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px', color: '#ef4444', fontWeight: 'bold' } }, '障碍撞击，游戏结束!'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '奔跑里程: ' + r.distance + 'm  得分: ' + r.score),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '8px' } }, '点击屏幕重新起跑 👟')
    ]));
  }

  return h('div', {
    staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' },
    on: { click: function() { handleRunnerJump(vm); } }
  }, [
    // 跑酷舞台 (280x210)
    h('div', {
      staticStyle: {
        width: '280px', height: '210px', backgroundColor: '#0f172a',
        borderRadius: '6px', overflow: 'hidden', position: 'relative'
      }
    }, elements),
    // 右侧仪表盘
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '极速跑酷'),
      h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', marginTop: '8px' } }, '里程: ' + r.distance + ' m'),
      h('text', { staticStyle: { fontSize: '12px', color: '#f59e0b', marginTop: '6px' } }, '金币得分: ' + r.score),
      h('div', {
        staticStyle: {
          width: '90px', height: '34px', backgroundColor: '#3b82f6',
          borderRadius: '17px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { handleRunnerJump(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, '跳跃 🦘')
      ])
    ])
  ]);
}
