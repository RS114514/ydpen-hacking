// game_jump.js —— 跳一跳 (Jump Jump)
export function initJump(vm) {
  if (vm.g_jump_timer) {
    clearInterval(vm.g_jump_timer);
    vm.g_jump_timer = null;
  }

  vm.g_jump = {
    platforms: [
      { x: 40, w: 60, col: '#3b82f6' },
      { x: 150, w: 50, col: '#10b981' }
    ],
    playerX: 65,
    playerY: 150, // 站立高度
    playerScaleY: 1.0,
    isCharging: false,
    chargePower: 0,
    score: 0,
    state: 'idle' // 'idle' | 'jumping' | 'dead'
  };
}

export function handleJumpChargeStart(vm) {
  var j = vm.g_jump;
  if (!j || j.state !== 'idle') return;

  j.isCharging = true;
  j.chargePower = 0;
  if (vm.g_jump_timer) clearInterval(vm.g_jump_timer);
  vm.g_jump_timer = setInterval(function() {
    if (!j.isCharging) {
      clearInterval(vm.g_jump_timer);
      return;
    }
    j.chargePower += 3.5;
    if (j.chargePower > 120) j.chargePower = 120;
    j.playerScaleY = Math.max(0.6, 1.0 - (j.chargePower / 240));
    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 30);
}

export function handleJumpChargeRelease(vm) {
  var j = vm.g_jump;
  if (!j || !j.isCharging) return;

  j.isCharging = false;
  if (vm.g_jump_timer) clearInterval(vm.g_jump_timer);
  j.playerScaleY = 1.0;
  j.state = 'jumping';

  // 抛物线起跳
  var targetDist = j.chargePower * 1.6;
  var startX = j.playerX;
  var step = 0;
  var maxSteps = 16;

  vm.g_jump_timer = setInterval(function() {
    step++;
    var progress = step / maxSteps;
    j.playerX = startX + targetDist * progress;
    // 抛物线高度
    j.playerY = 150 - Math.sin(progress * Math.PI) * 50;

    if (step >= maxSteps) {
      clearInterval(vm.g_jump_timer);
      j.playerY = 150;
      // 判定是否落在第二块板上
      var p2 = j.platforms[1];
      if (j.playerX >= p2.x && j.playerX <= p2.x + p2.w) {
        // 成功着陆！
        j.score++;
        j.state = 'idle';
        // 镜头向左平移，生成新方块
        var shift = p2.x - 40;
        j.playerX -= shift;
        j.platforms[0] = { x: 40, w: p2.w, col: p2.col };
        var nextW = 40 + Math.floor(Math.random() * 30);
        var nextDist = 80 + Math.floor(Math.random() * 90);
        var cols = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        j.platforms[1] = {
          x: 40 + nextDist,
          w: nextW,
          col: cols[Math.floor(Math.random() * cols.length)]
        };
      } else {
        // 摔落
        j.state = 'dead';
      }
    }
    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 30);
}

export function renderJump(vm, h) {
  var j = vm.g_jump;
  if (!j) return h('div');

  var elements = [];

  // 地平线底衬
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '166px', width: '280px', height: '44px',
      backgroundColor: '#0f172a'
    }
  }));

  // 渲染两个平台方块
  for (var i = 0; i < j.platforms.length; i++) {
    var p = j.platforms[i];
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: p.x + 'px', top: '166px', width: p.w + 'px', height: '36px',
        backgroundColor: p.col, borderRadius: '4px', borderWidth: '2px', borderColor: '#ffffff'
      }
    }));
  }

  // 渲染跳跃小棋子
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute',
      left: Math.floor(j.playerX - 7) + 'px',
      top: Math.floor(j.playerY - 24) + 'px',
      width: '14px', height: '24px', backgroundColor: '#38bdf8',
      borderRadius: '7px', borderWidth: '2px', borderColor: '#ffffff',
      justifyContent: 'center', alignItems: 'center'
    }
  }, [
    h('div', {
      staticStyle: {
        width: '6px', height: '6px', borderRadius: '3px', backgroundColor: '#ffffff',
        position: 'absolute', top: '4px'
      }
    })
  ]));

  if (j.state === 'dead') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '280px', height: '210px',
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px', color: '#ef4444', fontWeight: 'bold' } }, '掉下去了！'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '连跳得分: ' + j.score)
    ]));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 舞台
    h('div', {
      staticStyle: {
        width: '280px', height: '210px', backgroundColor: '#1e293b',
        borderRadius: '6px', overflow: 'hidden', position: 'relative'
      }
    }, elements),

    // 控制台
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '跳一跳'),
      h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', marginTop: '6px' } }, '连续得分: ' + j.score),
      h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' } }, '蓄力值: ' + Math.floor(j.chargePower)),

      // 蓄力大按钮
      h('div', {
        staticStyle: {
          width: '100px', height: '42px',
          backgroundColor: j.isCharging ? '#ef4444' : '#10b981',
          borderRadius: '21px', justifyContent: 'center', alignItems: 'center',
          marginTop: '12px'
        },
        on: {
          click: function() {
            if (j.state === 'dead') {
              initJump(vm);
            } else if (!j.isCharging) {
              handleJumpChargeStart(vm);
              setTimeout(function() { handleJumpChargeRelease(vm); }, 350);
            }
          }
        }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, j.state === 'dead' ? '重新开始' : '轻触跳跃 🦘')
      ])
    ])
  ]);
}
