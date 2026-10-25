// game_mario.js —— 马里奥冲关 (Mario Run)
export function initMario(vm) {
  if (vm.g_mario_timer) {
    clearInterval(vm.g_mario_timer);
    vm.g_mario_timer = null;
  }

  // 地图砖块与问号箱
  var blocks = [
    { x: 100, y: 110, w: 22, h: 22, type: 'brick', hit: false },
    { x: 130, y: 110, w: 22, h: 22, type: 'coin_box', hit: false },
    { x: 160, y: 110, w: 22, h: 22, type: 'brick', hit: false },
    { x: 220, y: 130, w: 26, h: 44, type: 'pipe' } // 绿色水管
  ];

  // 巡逻板栗仔
  var enemies = [
    { x: 200, y: 154, w: 20, h: 20, vx: -1.5, alive: true }
  ];

  vm.g_mario = {
    marioX: 40,
    marioY: 150, // 地面线 y=150
    vy: 0,
    vx: 0,
    isJumping: false,
    coins: 0,
    score: 0,
    blocks: blocks,
    enemies: enemies,
    state: 'playing' // 'playing' | 'dead' | 'won'
  };

  startMarioLoop(vm);
}

export function handleMarioAction(vm, act) {
  var m = vm.g_mario;
  if (!m) return;
  if (m.state !== 'playing') {
    initMario(vm);
    return;
  }

  if (act === 'left') m.vx = -4;
  else if (act === 'right') m.vx = 4;
  else if (act === 'jump' && !m.isJumping) {
    m.vy = -10.5;
    m.isJumping = true;
  }
}

function startMarioLoop(vm) {
  if (vm.g_mario_timer) clearInterval(vm.g_mario_timer);
  vm.g_mario_timer = setInterval(function() {
    var m = vm.g_mario;
    if (!m || m.state !== 'playing') {
      if (vm.g_mario_timer) clearInterval(vm.g_mario_timer);
      return;
    }

    // 横向移动与边界
    m.marioX += m.vx;
    m.vx *= 0.6; // 摩擦力
    if (m.marioX < 10) m.marioX = 10;
    if (m.marioX > 250) {
      // 成功抵达右侧旗杆通关！
      m.state = 'won';
      if (vm.$forceUpdate) vm.$forceUpdate();
      return;
    }

    // 重力与起跳
    m.vy += 0.95;
    m.marioY += m.vy;
    if (m.marioY >= 150) {
      m.marioY = 150;
      m.vy = 0;
      m.isJumping = false;
    }

    // 砖块顶撞判定 (向上冲时头部碰撞)
    for (var i = 0; i < m.blocks.length; i++) {
      var blk = m.blocks[i];
      if (m.vy < 0 && m.marioX + 16 > blk.x && m.marioX < blk.x + blk.w) {
        if (m.marioY < blk.y + blk.h && m.marioY > blk.y) {
          m.vy = 1; // 撞头下落
          if (!blk.hit) {
            blk.hit = true;
            if (blk.type === 'coin_box') {
              m.coins++;
              m.score += 200;
            } else {
              m.score += 50;
            }
          }
        }
      }
    }

    // 板栗仔巡逻与碰撞判定
    for (var i = 0; i < m.enemies.length; i++) {
      var en = m.enemies[i];
      if (!en.alive) continue;
      en.x += en.vx;
      if (en.x < 80 || en.x > 210) en.vx = -en.vx;

      // 碰撞检测 (马里奥在 marioX, marioY, 宽20, 高24)
      if (Math.abs(m.marioX - en.x) < 18) {
        if (m.marioY + 24 > en.y && m.marioY < en.y + en.h) {
          // 下落踩扁
          if (m.vy > 0 && m.marioY < en.y + 4) {
            en.alive = false;
            m.vy = -6; // 踩中弹跳
            m.score += 100;
          } else {
            // 被小怪击中阵亡
            m.state = 'dead';
            clearInterval(vm.g_mario_timer);
            vm.g_mario_timer = null;
            if (vm.$forceUpdate) vm.$forceUpdate();
            return;
          }
        }
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 40);
}

export function renderMario(vm, h) {
  var m = vm.g_mario;
  if (!m) return h('div');

  var elements = [];

  // 地面 (蓝天背景与草地基座)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '174px', width: '280px', height: '36px',
      backgroundColor: '#16a34a', borderTopWidth: '3px', borderColor: '#86efac'
    }
  }));

  // 终点旗杆 🚩
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '260px', top: '74px', width: '4px', height: '100px',
      backgroundColor: '#f8fafc'
    }
  }));
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '264px', top: '74px', width: '16px', height: '12px',
      backgroundColor: '#ef4444'
    }
  }));

  // 砖块与水管
  for (var i = 0; i < m.blocks.length; i++) {
    var b = m.blocks[i];
    if (b.type === 'pipe') {
      elements.push(h('div', {
        staticStyle: {
          position: 'absolute', left: b.x + 'px', top: b.y + 'px',
          width: b.w + 'px', height: b.h + 'px',
          backgroundColor: '#22c55e', borderWidth: '2px', borderColor: '#166534',
          borderRadius: '3px'
        }
      }));
    } else {
      var bgCol = b.hit ? '#94a3b8' : (b.type === 'coin_box' ? '#f59e0b' : '#b45309');
      var label = b.hit ? '' : (b.type === 'coin_box' ? '?' : '≡');
      elements.push(h('div', {
        staticStyle: {
          position: 'absolute', left: b.x + 'px', top: b.y + 'px',
          width: b.w + 'px', height: b.h + 'px',
          backgroundColor: bgCol, borderWidth: '1.5px', borderColor: '#ffffff',
          borderRadius: '3px', justifyContent: 'center', alignItems: 'center'
        }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, label)
      ]));
    }
  }

  // 敌人板栗仔 🍄
  for (var i = 0; i < m.enemies.length; i++) {
    var en = m.enemies[i];
    if (en.alive) {
      elements.push(h('div', {
        staticStyle: {
          position: 'absolute', left: Math.floor(en.x) + 'px', top: en.y + 'px',
          width: en.w + 'px', height: en.h + 'px', justifyContent: 'center', alignItems: 'center'
        }
      }, [
        h('text', { staticStyle: { fontSize: '16px' } }, '🍄')
      ]));
    }
  }

  // 马里奥主角
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: Math.floor(m.marioX) + 'px', top: Math.floor(m.marioY) + 'px',
      width: '22px', height: '24px', justifyContent: 'center', alignItems: 'center'
    }
  }, [
    h('text', { staticStyle: { fontSize: '18px' } }, m.state === 'dead' ? '💀' : '👨‍🔧')
  ]));

  if (m.state === 'dead' || m.state === 'won') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '280px', height: '210px',
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px', color: m.state === 'won' ? '#facc15' : '#ef4444', fontWeight: 'bold' } }, m.state === 'won' ? '通关大吉! 🏆' : '踩怪失败!'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '总得分: ' + m.score + ' 金币: ' + m.coins),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '8px' } }, '轻触下方按钮重来 🍄')
    ]));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 舞台 (280x210)
    h('div', {
      staticStyle: {
        width: '280px', height: '210px', backgroundColor: '#38bdf8',
        borderRadius: '6px', overflow: 'hidden', position: 'relative'
      }
    }, elements),

    // 控制面板
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '马里奥冲关'),
      h('text', { staticStyle: { fontSize: '13px', color: '#facc15', marginTop: '6px' } }, '金币: ' + m.coins + ' 得分: ' + m.score),

      // 三键控制: 左 / 右 / 跳
      h('div', { staticStyle: { flexDirection: 'row', marginTop: '14px' } }, [
        h('div', {
          staticStyle: { width: '42px', height: '38px', backgroundColor: '#334155', borderRadius: '8px', justifyContent: 'center', alignItems: 'center', marginRight: '8px' },
          on: { click: function() { handleMarioAction(vm, 'left'); } }
        }, [h('text', { staticStyle: { fontSize: '16px', color: '#ffffff' } }, '◀')]),
        h('div', {
          staticStyle: { width: '42px', height: '38px', backgroundColor: '#334155', borderRadius: '8px', justifyContent: 'center', alignItems: 'center', marginRight: '8px' },
          on: { click: function() { handleMarioAction(vm, 'right'); } }
        }, [h('text', { staticStyle: { fontSize: '16px', color: '#ffffff' } }, '▶')]),
        h('div', {
          staticStyle: { width: '48px', height: '38px', backgroundColor: '#ef4444', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' },
          on: { click: function() { handleMarioAction(vm, 'jump'); } }
        }, [h('text', { staticStyle: { fontSize: '14px', color: '#ffffff', fontWeight: 'bold' } }, '跳')])
      ]),

      h('div', {
        staticStyle: { width: '80px', height: '26px', backgroundColor: '#475569', borderRadius: '13px', justifyContent: 'center', alignItems: 'center', marginTop: '12px' },
        on: { click: function() { initMario(vm); } }
      }, [h('text', { staticStyle: { fontSize: '12px', color: '#ffffff' } }, '重置')])
    ])
  ]);
}
