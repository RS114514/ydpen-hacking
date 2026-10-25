// game_watermelon.js —— 合成大西瓜 (水果进化合并)
// 0:葡萄, 1:樱桃, 2:橘子, 3:柠檬, 4:猕猴桃, 5:西红柿, 6:桃子, 7:菠萝, 8:椰子, 9:西瓜
export var FRUITS = [
  { name: '葡萄', emoji: '🍇', size: 16, color: '#a855f7', score: 2 },
  { name: '樱桃', emoji: '🍒', size: 20, color: '#ef4444', score: 4 },
  { name: '橘子', emoji: '🍊', size: 24, color: '#f97316', score: 8 },
  { name: '柠檬', emoji: '🍋', size: 28, color: '#eab308', score: 16 },
  { name: '猕猴桃', emoji: '🥝', size: 32, color: '#84cc16', score: 32 },
  { name: '番茄', emoji: '🍅', size: 36, color: '#dc2626', score: 64 },
  { name: '桃子', emoji: '🍑', size: 40, color: '#f43f5e', score: 128 },
  { name: '菠萝', emoji: '🍍', size: 46, color: '#eab308', score: 256 },
  { name: '椰子', emoji: '🥥', size: 52, color: '#78350f', score: 512 },
  { name: '大西瓜', emoji: '🍉', size: 60, color: '#16a34a', score: 1024 }
];

export function initWatermelon(vm) {
  vm.g_wm = {
    fruits: [], // 已经在箱子里的水果: { id, level, x, y, vy }
    nextLevel: Math.floor(Math.random() * 3), // 0, 1, 2
    dropX: 110,
    score: 0,
    gameOver: false
  };
}

export function handleWatermelonDrop(vm, clickX) {
  var m = vm.g_wm;
  if (!m || m.gameOver) return;

  var lvl = m.nextLevel;
  var fMeta = FRUITS[lvl];
  var x = clickX - fMeta.size / 2;
  if (x < 4) x = 4;
  if (x > 220 - fMeta.size - 4) x = 220 - fMeta.size - 4;

  var newFruit = {
    id: Date.now() + Math.random(),
    level: lvl,
    x: x,
    y: 20,
    vy: 0
  };

  m.fruits.push(newFruit);
  m.nextLevel = Math.floor(Math.random() * 3);

  // 触发物理下落与碰撞合并模拟
  runPhysics(vm);
}

function runPhysics(vm) {
  var m = vm.g_wm;
  if (!m) return;

  // 简易物理迭代 20 步沉底与碰撞
  for (var step = 0; step < 20; step++) {
    // 重力
    for (var i = 0; i < m.fruits.length; i++) {
      var f = m.fruits[i];
      f.vy += 1.2;
      f.y += f.vy;

      var r = FRUITS[f.level].size;
      // 触底
      if (f.y + r >= 196) {
        f.y = 196 - r;
        f.vy = 0;
      }
    }

    // 水果之间碰撞合并与排斥
    for (var i = 0; i < m.fruits.length; i++) {
      for (var j = i + 1; j < m.fruits.length; j++) {
        var f1 = m.fruits[i];
        var f2 = m.fruits[j];
        if (!f1 || !f2) continue;

        var r1 = FRUITS[f1.level].size / 2;
        var r2 = FRUITS[f2.level].size / 2;
        var cx1 = f1.x + r1, cy1 = f1.y + r1;
        var cx2 = f2.x + r2, cy2 = f2.y + r2;

        var dx = cx2 - cx1;
        var dy = cy2 - cy1;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minDist = r1 + r2;

        if (dist < minDist && dist > 0.01) {
          // 同级碰撞 -> 合成进化！
          if (f1.level === f2.level && f1.level < 9) {
            f1.level++;
            f1.x = (f1.x + f2.x) / 2;
            f1.y = (f1.y + f2.y) / 2;
            f1.vy = -1; // 微微弹跳
            m.score += FRUITS[f1.level].score;
            m.fruits.splice(j, 1);
            j--;
          } else {
            // 排斥分开
            var overlap = (minDist - dist) / 2;
            var nx = dx / dist;
            var ny = dy / dist;
            f1.x -= nx * overlap;
            f1.y -= ny * overlap;
            f2.x += nx * overlap;
            f2.y += ny * overlap;
          }
        }
      }
    }

    // 边界限制
    for (var i = 0; i < m.fruits.length; i++) {
      var f = m.fruits[i];
      var r = FRUITS[f.level].size;
      if (f.x < 4) f.x = 4;
      if (f.x + r > 216) f.x = 216 - r;
      if (f.y + r > 196) f.y = 196 - r;
      if (f.y < 10) m.gameOver = true;
    }
  }

  if (vm.$forceUpdate) vm.$forceUpdate();
}

export function renderWatermelon(vm, h) {
  var m = vm.g_wm;
  if (!m) return h('div');

  var fElements = [];

  // 警示红线
  fElements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '25px', width: '220px', height: '1px',
      backgroundColor: '#ef4444', opacity: 0.6
    }
  }));

  // 所有水果
  for (var i = 0; i < m.fruits.length; i++) {
    var f = m.fruits[i];
    var meta = FRUITS[f.level];
    fElements.push(h('div', {
      staticStyle: {
        position: 'absolute',
        left: Math.floor(f.x) + 'px', top: Math.floor(f.y) + 'px',
        width: meta.size + 'px', height: meta.size + 'px',
        borderRadius: (meta.size / 2) + 'px',
        backgroundColor: meta.color,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: '1.5px', borderColor: '#ffffff', opacity: 0.95
      }
    }, [
      h('text', { staticStyle: { fontSize: Math.floor(meta.size * 0.55) + 'px' } }, meta.emoji)
    ]));
  }

  if (m.gameOver) {
    fElements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '220px', height: '202px',
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#ef4444', fontWeight: 'bold' } }, '水果溢出，游戏结束!'),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '6px' } }, '点击右侧重新挑战 🍉')
    ]));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 沉浸掉落箱子 (220x202)
    h('div', {
      staticStyle: {
        width: '220px', height: '202px', backgroundColor: '#1e293b',
        borderLeftWidth: '3px', borderRightWidth: '3px', borderBottomWidth: '4px',
        borderColor: '#475569', borderRadius: '4px', position: 'relative', overflow: 'hidden'
      },
      on: {
        click: function(e) {
          // 简易触控横坐标检测，支持 3 个掉落列
          var cx = 110;
          if (e && e.position && e.position.x) cx = e.position.x;
          else cx = 30 + Math.random() * 160;
          handleWatermelonDrop(vm, cx);
        }
      }
    }, fElements),

    // 右侧合成状态栏
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '合成大西瓜'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f59e0b', marginTop: '8px' } }, '得分: ' + m.score),
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center', marginTop: '8px' } }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8' } }, '下一个: '),
        h('text', { staticStyle: { fontSize: '18px' } }, FRUITS[m.nextLevel].emoji)
      ]),
      h('div', {
        staticStyle: {
          width: '90px', height: '30px', backgroundColor: '#16a34a',
          borderRadius: '15px', justifyContent: 'center', alignItems: 'center',
          marginTop: '14px'
        },
        on: { click: function() { initWatermelon(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#ffffff', fontWeight: 'bold' } }, '重开一局')
      ])
    ])
  ]);
}
