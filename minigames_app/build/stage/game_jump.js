// game_jump.js —— 跳一跳 (Jump Jump)
export function initJump(vm) {
  if (vm.g_jump_timer) {
    clearInterval(vm.g_jump_timer);
    vm.g_jump_timer = null;
  }

  var best = vm.g_jump ? (vm.g_jump.bestScore || 0) : 0;

  vm.g_jump = {
    platforms: [
      { x: 50, w: 70, col: '#3b82f6' },
      { x: 220, w: 64, col: '#10b981' }
    ],
    playerX: 85,
    playerY: 136, // 站立高度
    score: 0,
    bestScore: best,
    state: 'idle' // 'idle' | 'jumping' | 'dead'
  };
}

export function executeJump(vm, power) {
  var j = vm.g_jump;
  if (!j || j.state !== 'idle') {
    if (j && j.state === 'dead') initJump(vm);
    return;
  }

  j.state = 'jumping';
  var targetDist = power;
  var startX = j.playerX;
  var step = 0;
  var maxSteps = 16;

  if (vm.g_jump_timer) clearInterval(vm.g_jump_timer);
  vm.g_jump_timer = setInterval(function() {
    step++;
    var progress = step / maxSteps;
    j.playerX = startX + targetDist * progress;
    j.playerY = 136 - Math.sin(progress * Math.PI) * 55;

    if (step >= maxSteps) {
      clearInterval(vm.g_jump_timer);
      vm.g_jump_timer = null;
      j.playerY = 136;

      // 判定是否落在第二块板上
      var p2 = j.platforms[1];
      if (j.playerX >= p2.x && j.playerX <= p2.x + p2.w) {
        // 成功着陆
        j.score++;
        if (j.score > j.bestScore) j.bestScore = j.score;
        j.state = 'idle';

        // 视角平移
        var shift = p2.x - 50;
        j.playerX -= shift;
        j.platforms[0] = { x: 50, w: p2.w, col: p2.col };

        var nextW = 50 + Math.floor(Math.random() * 30);
        var nextDist = 110 + Math.floor(Math.random() * 120);
        var cols = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        j.platforms[1] = {
          x: 50 + nextDist,
          w: nextW,
          col: cols[Math.floor(Math.random() * cols.length)]
        };
      } else {
        j.state = 'dead';
      }
    }
    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 35);
}

export function renderJump(vm, h) {
  var j = vm.g_jump;
  if (!j) return h('div');

  var elements = [];

  // 地平线深色底衬
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '154px', width: '530px', height: '34px',
      backgroundColor: '#090d16', borderTopWidth: '2px', borderColor: '#334155'
    }
  }));

  // 渲染两个站立跳跃平台
  for (var i = 0; i < j.platforms.length; i++) {
    var p = j.platforms[i];
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: Math.floor(p.x) + 'px', top: '154px',
        width: p.w + 'px', height: '32px',
        backgroundColor: p.col, borderRadius: '6px',
        borderWidth: '2px', borderColor: '#ffffff'
      }
    }));
  }

  // 渲染跳跃小棋子
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute',
      left: Math.floor(j.playerX - 9) + 'px',
      top: Math.floor(j.playerY - 26) + 'px',
      width: '18px', height: '28px'
    }
  }, [
    // 头部圆球
    h('div', {
      staticStyle: {
        width: '12px', height: '12px', borderRadius: '6px', backgroundColor: '#38bdf8',
        borderWidth: '1.5px', borderColor: '#ffffff', position: 'absolute', left: '3px', top: '0px'
      }
    }),
    // 棋子身躯
    h('div', {
      staticStyle: {
        width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#0284c7',
        borderWidth: '1.5px', borderColor: '#ffffff', position: 'absolute', left: '1px', top: '11px'
      }
    })
  ]));

  if (j.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '530px', height: '188px',
        backgroundColor: 'rgba(9, 13, 22, 0.75)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } }, '× 坠落平台 挑战结束 ×'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '连续跳中: ' + j.score + ' 块平台 | 历史最高: ' + j.bestScore)
    ]));
  }

  // 计算第二块平台距离
  var targetDist = Math.floor(j.platforms[1].x + j.platforms[1].w / 2 - j.playerX);

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 宽幅平台舞台 (530x188)
    h('div', {
      staticStyle: {
        width: '530px', height: '188px', backgroundColor: '#1e293b',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#334155', marginRight: '20px'
      }
    }, elements),

    // 右侧力度跳跃控制台
    h('div', {
      staticStyle: {
        flex: 1, height: '188px', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center' } }, [
        h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '跳一跳'),
        h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' } }, '当前连跳:'),
        h('text', { staticStyle: { fontSize: '22px', color: '#8b5cf6', fontWeight: 'bold' } }, '' + j.score),
        h('text', { staticStyle: { fontSize: '10px', color: '#38bdf8' } }, '目标距离约: ' + targetDist + ' px')
      ]),

      // 三档精准跳跃蓄力键
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center' } }, [
        h('div', { staticStyle: { flexDirection: 'row', marginBottom: '8px' } }, [
          h('div', {
            staticStyle: {
              width: '84px', height: '42px', backgroundColor: '#1e293b', borderRadius: '10px',
              borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginRight: '10px'
            },
            on: { click: function() { executeJump(vm, 100); } }
          }, [h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' } }, '轻跳 (100)')]),
          h('div', {
            staticStyle: {
              width: '84px', height: '42px', backgroundColor: '#2563eb', borderRadius: '10px',
              borderWidth: '1.5px', borderColor: '#60a5fa', justifyContent: 'center', alignItems: 'center'
            },
            on: { click: function() { executeJump(vm, 150); } }
          }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, '中跳 (150)')])
        ]),
        h('div', {
          staticStyle: {
            width: '178px', height: '42px', backgroundColor: '#7c3aed', borderRadius: '10px',
            borderWidth: '1.5px', borderColor: '#c084fc', justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { executeJump(vm, 200); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, '远跳 (200)')])
      ]),

      h('div', {
        staticStyle: {
          width: '120px', height: '24px', backgroundColor: '#334155', borderRadius: '12px',
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { initJump(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '11px', color: '#f8fafc' } }, j.state === 'dead' ? '重新开局' : '重置')
      ])
    ])
  ]);
}
