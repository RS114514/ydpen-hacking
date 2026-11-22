// game_mario.js —— 马里奥冲关 (Mario Run)
export function initMario(vm) {
  if (vm.g_mario_timer) {
    clearInterval(vm.g_mario_timer);
    vm.g_mario_timer = null;
  }

  // 宽幅地图砖块与问号箱
  var blocks = [
    { x: 120, y: 100, w: 26, h: 26, type: 'brick', hit: false },
    { x: 156, y: 100, w: 26, h: 26, type: 'coin_box', hit: false },
    { x: 192, y: 100, w: 26, h: 26, type: 'brick', hit: false },
    { x: 260, y: 120, w: 34, h: 50, type: 'pipe' }, // 绿色水管
    { x: 340, y: 100, w: 26, h: 26, type: 'coin_box', hit: false },
    { x: 376, y: 100, w: 26, h: 26, type: 'brick', hit: false }
  ];

  // 巡逻板栗仔
  var enemies = [
    { x: 210, y: 148, w: 22, h: 22, vx: -1.5, alive: true },
    { x: 420, y: 148, w: 22, h: 22, vx: -1.5, alive: true }
  ];

  vm.g_mario = {
    marioX: 40,
    marioY: 144, // 地面线 y=144
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

  if (act === 'left') m.vx = -4.5;
  else if (act === 'right') m.vx = 4.5;
  else if (act === 'jump' && !m.isJumping) {
    m.vy = -11.0;
    m.isJumping = true;
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function startMarioLoop(vm) {
  if (vm.g_mario_timer) clearInterval(vm.g_mario_timer);
  vm.g_mario_timer = setInterval(function() {
    var m = vm.g_mario;
    if (!m || m.state !== 'playing') {
      if (vm.g_mario_timer) clearInterval(vm.g_mario_timer);
      return;
    }

    // 横向位移与摩擦
    m.marioX += m.vx;
    m.vx *= 0.65;
    if (m.marioX < 10) m.marioX = 10;
    if (m.marioX > 480) {
      // 触达终点旗帜
      m.state = 'won';
      m.score += 1000;
      clearInterval(vm.g_mario_timer);
      vm.g_mario_timer = null;
      if (vm.$forceUpdate) vm.$forceUpdate();
      return;
    }

    // 重力
    m.vy += 0.95;
    m.marioY += m.vy;
    if (m.marioY >= 144) {
      m.marioY = 144;
      m.vy = 0;
      m.isJumping = false;
    }

    // 砖块碰撞
    for (var i = 0; i < m.blocks.length; i++) {
      var blk = m.blocks[i];
      if (m.vy < 0 && m.marioX + 20 > blk.x && m.marioX < blk.x + blk.w) {
        if (m.marioY < blk.y + blk.h && m.marioY > blk.y) {
          m.vy = 1.5;
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

    // 敌人巡逻与碰撞
    for (var i = 0; i < m.enemies.length; i++) {
      var en = m.enemies[i];
      if (!en.alive) continue;
      en.x += en.vx;
      if (en.x < 110 || en.x > 450) en.vx = -en.vx;

      if (Math.abs(m.marioX - en.x) < 20) {
        if (m.marioY + 24 > en.y && m.marioY < en.y + en.h) {
          // 下落踩扁
          if (m.vy > 0 && m.marioY < en.y + 6) {
            en.alive = false;
            m.vy = -7.5;
            m.score += 200;
          } else {
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

  // 地面草坪 (绿茵草地 + 砖石基底)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '168px', width: '530px', height: '20px',
      backgroundColor: '#16a34a', borderTopWidth: '4px', borderColor: '#86efac'
    }
  }));

  // 终点旗帜 (位于 x=475, 地面之上)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '484px', top: '50px', width: '4px', height: '118px',
      backgroundColor: '#cbd5e1'
    }
  }));
  elements.push(h('image', {
    staticStyle: {
      position: 'absolute', left: '468px', top: '50px', width: '32px', height: '48px'
    },
    attrs: { src: 'assets/mario_flag.png' }
  }));

  // 砖块与水管
  for (var i = 0; i < m.blocks.length; i++) {
    var b = m.blocks[i];
    if (b.type === 'pipe') {
      // 水管口与水管身
      elements.push(h('image', {
        staticStyle: {
          position: 'absolute', left: (b.x - 3) + 'px', top: b.y + 'px',
          width: (b.w + 6) + 'px', height: '16px'
        },
        attrs: { src: 'assets/mario_pipe_top.png' }
      }));
      elements.push(h('image', {
        staticStyle: {
          position: 'absolute', left: b.x + 'px', top: (b.y + 16) + 'px',
          width: b.w + 'px', height: (b.h - 16) + 'px'
        },
        attrs: { src: 'assets/mario_pipe_body.png' }
      }));
    } else {
      var srcImg = b.hit ? 'assets/mario_block_empty.png' : (b.type === 'coin_box' ? 'assets/mario_block_coin.png' : 'assets/mario_block_brick.png');
      elements.push(h('image', {
        staticStyle: {
          position: 'absolute', left: b.x + 'px', top: b.y + 'px',
          width: b.w + 'px', height: b.h + 'px'
        },
        attrs: { src: srcImg }
      }));
    }
  }

  // 板栗仔敌人
  for (var i = 0; i < m.enemies.length; i++) {
    var en = m.enemies[i];
    if (en.alive) {
      elements.push(h('image', {
        staticStyle: {
          position: 'absolute', left: Math.floor(en.x) + 'px', top: en.y + 'px',
          width: '24px', height: '24px'
        },
        attrs: { src: 'assets/mario_goomba.png' }
      }));
    }
  }

  // 马里奥主角 (根据跳跃与跑动状态切换 16-bit 像素精灵)
  var marioSprite = 'assets/mario_idle.png';
  if (m.isJumping) {
    marioSprite = 'assets/mario_jump.png';
  } else if (Math.abs(m.vx) > 0.8) {
    marioSprite = 'assets/mario_run.png';
  }
  elements.push(h('image', {
    staticStyle: {
      position: 'absolute', left: Math.floor(m.marioX) + 'px', top: Math.floor(m.marioY - 8) + 'px',
      width: '24px', height: '32px'
    },
    attrs: { src: marioSprite }
  }));

  if (m.state === 'won') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '530px', height: '188px',
        backgroundColor: 'rgba(9, 13, 22, 0.7)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '20px', color: '#4ade80', fontWeight: 'bold' } }, '★ 顺利通关 CLEAR! ★'),
      h('text', { staticStyle: { fontSize: '14px', color: '#f8fafc', marginTop: '6px' } }, '金币总计: ' + m.coins + ' | 总得分: ' + m.score)
    ]));
  } else if (m.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '530px', height: '188px',
        backgroundColor: 'rgba(9, 13, 22, 0.75)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } }, '× 遗憾阵亡 GAME OVER ×'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '轻触下方按钮重来')
    ]));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 宽幅马里奥世界 (530x188)
    h('div', {
      staticStyle: {
        width: '530px', height: '188px', backgroundColor: '#38bdf8',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#0284c7', marginRight: '20px'
      }
    }, elements),

    // 控制面板
    h('div', {
      staticStyle: {
        flex: 1, height: '188px', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center' } }, [
        h('text', { staticStyle: { fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' } }, '马里奥冲关'),
        h('text', { staticStyle: { fontSize: '12px', color: '#facc15', marginTop: '3px' } }, '金币: ' + m.coins + ' | 分数: ' + m.score)
      ]),

      // 触控按键：左、跳跃、右
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: {
            width: '60px', height: '52px', backgroundColor: '#1e293b', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center',
            marginRight: '8px'
          },
          on: { click: function() { handleMarioAction(vm, 'left'); } }
        }, [h('text', { staticStyle: { fontSize: '18px', color: '#38bdf8' } }, '◀')]),
        h('div', {
          staticStyle: {
            width: '74px', height: '52px', backgroundColor: '#dc2626', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#f87171', justifyContent: 'center', alignItems: 'center',
            marginRight: '8px'
          },
          on: { click: function() { handleMarioAction(vm, 'jump'); } }
        }, [h('text', { staticStyle: { fontSize: '16px', color: '#ffffff', fontWeight: 'bold' } }, '跳跃')]),
        h('div', {
          staticStyle: {
            width: '60px', height: '52px', backgroundColor: '#1e293b', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleMarioAction(vm, 'right'); } }
        }, [h('text', { staticStyle: { fontSize: '18px', color: '#38bdf8' } }, '▶')])
      ]),

      h('div', {
        staticStyle: {
          width: '120px', height: '28px', backgroundColor: '#334155', borderRadius: '14px',
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { initMario(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '11px', color: '#ffffff' } }, '重新开始')
      ])
    ])
  ]);
}
