// game_watermelon.js —— 合成大西瓜
export var FRUITS = [
  { name: '葡萄', size: 20, color: '#a855f7', border: '#c084fc', score: 2 },
  { name: '樱桃', size: 24, color: '#ef4444', border: '#f87171', score: 4 },
  { name: '橘子', size: 28, color: '#f97316', border: '#fb923c', score: 8 },
  { name: '柠檬', size: 32, color: '#eab308', border: '#fde047', score: 16 },
  { name: '猕猴桃', size: 36, color: '#84cc16', border: '#a3e635', score: 32 },
  { name: '番茄', size: 42, color: '#dc2626', border: '#ef4444', score: 64 },
  { name: '桃子', size: 48, color: '#f43f5e', border: '#fb7185', score: 128 },
  { name: '菠萝', size: 54, color: '#d97706', border: '#f59e0b', score: 256 },
  { name: '椰子', size: 60, color: '#78350f', border: '#92400e', score: 512 },
  { name: '西瓜', size: 66, color: '#16a34a', border: '#4ade80', score: 1024 }
];

export function initWatermelon(vm) {
  vm.g_wm = {
    fruits: [],
    nextLevel: Math.floor(Math.random() * 3),
    dropX: 120,
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
  if (x < 6) x = 6;
  if (x > 230 - fMeta.size) x = 230 - fMeta.size;

  var newFruit = {
    id: Date.now() + Math.random(),
    level: lvl,
    x: x,
    y: 20,
    vy: 0
  };

  m.fruits.push(newFruit);
  m.nextLevel = Math.floor(Math.random() * 3);

  runPhysics(vm);
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function runPhysics(vm) {
  var m = vm.g_wm;
  if (!m) return;

  // 物理沉底与碰撞合并循环
  for (var step = 0; step < 24; step++) {
    for (var i = 0; i < m.fruits.length; i++) {
      var f = m.fruits[i];
      f.vy += 1.2;
      f.y += f.vy;

      var r = FRUITS[f.level].size;
      // 触底
      if (f.y >= 180 - r) {
        f.y = 180 - r;
        f.vy = 0;
      }
    }

    // 两两碰撞与合成
    for (var i = 0; i < m.fruits.length; i++) {
      for (var j = i + 1; j < m.fruits.length; j++) {
        var f1 = m.fruits[i], f2 = m.fruits[j];
        var r1 = FRUITS[f1.level].size, r2 = FRUITS[f2.level].size;
        var cx1 = f1.x + r1 / 2, cy1 = f1.y + r1 / 2;
        var cx2 = f2.x + r2 / 2, cy2 = f2.y + r2 / 2;
        var dx = cx1 - cx2, dy = cy1 - cy2;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minDist = (r1 + r2) / 2;

        if (dist < minDist && dist > 0.001) {
          // 相同等级合并
          if (f1.level === f2.level && f1.level < FRUITS.length - 1) {
            f1.level++;
            m.score += FRUITS[f1.level].score;
            m.fruits.splice(j, 1);
            j--;
            continue;
          }

          // 物理排斥分离
          var overlap = (minDist - dist) / 2;
          var nx = dx / dist, ny = dy / dist;
          f1.x += nx * overlap; f1.y += ny * overlap;
          f2.x -= nx * overlap; f2.y -= ny * overlap;
        }
      }
    }
  }

  // 触顶溢出判定
  for (var i = 0; i < m.fruits.length; i++) {
    if (m.fruits[i].y < 24 && m.fruits[i].vy === 0) {
      m.gameOver = true;
      break;
    }
  }
}

export function renderWatermelon(vm, h) {
  var m = vm.g_wm;
  if (!m) return h('div');

  var elements = [];

  // 顶部警戒红虚线
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '26px', width: '240px', height: '1.5px',
      backgroundColor: '#ef4444'
    }
  }));

  // 箱中水果
  for (var i = 0; i < m.fruits.length; i++) {
    var f = m.fruits[i];
    var meta = FRUITS[f.level];
    (function(fruit, itemMeta) {
      elements.push(h('div', {
        staticStyle: {
          position: 'absolute',
          left: Math.floor(fruit.x) + 'px', top: Math.floor(fruit.y) + 'px',
          width: itemMeta.size + 'px', height: itemMeta.size + 'px',
          backgroundColor: itemMeta.color,
          borderRadius: Math.floor(itemMeta.size / 2) + 'px',
          borderWidth: '1.5px', borderColor: itemMeta.border,
          justifyContent: 'center', alignItems: 'center'
        }
      }, [
        h('text', {
          staticStyle: {
            fontSize: (itemMeta.size < 28 ? '9px' : '11px'),
            color: '#ffffff', fontWeight: 'bold'
          }
        }, itemMeta.name)
      ]));
    })(f, meta);
  }

  if (m.gameOver) {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '240px', height: '186px',
        backgroundColor: 'rgba(9, 13, 22, 0.75)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } }, '× 水果满溢 ×'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '最终得分: ' + m.score)
    ]));
  }

  var nextMeta = FRUITS[m.nextLevel];

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 20px'
    }
  }, [
    // 透明玻璃水果箱 (240x188)
    h('div', {
      staticStyle: {
        width: '244px', height: '188px', backgroundColor: '#090d16',
        borderRadius: '8px', borderWidth: '2px', borderColor: '#334155',
        overflow: 'hidden', position: 'relative', marginRight: '30px'
      },
      on: {
        click: function(e) {
          handleWatermelonDrop(vm, 120);
        }
      }
    }, elements),

    // 信息与下落投掷控制区
    h('div', { staticStyle: { flex: 1, flexDirection: 'column', justifyContent: 'center' } }, [
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#10b981', marginRight: '8px' }
        }),
        h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '合成大西瓜')
      ]),
      h('text', { staticStyle: { fontSize: '13px', color: '#94a3b8', marginTop: '6px' } }, '当前得分: ' + m.score),

      // 下一个待落水果预览
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center', marginTop: '10px' } }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#cbd5e1', marginRight: '10px' } }, '即将下落:'),
        h('div', {
          staticStyle: {
            paddingHorizontal: '12px', height: '28px', backgroundColor: nextMeta.color,
            borderRadius: '14px', borderWidth: '1.5px', borderColor: nextMeta.border,
            justifyContent: 'center', alignItems: 'center'
          }
        }, [
          h('text', { staticStyle: { fontSize: '12px', color: '#ffffff', fontWeight: 'bold' } }, nextMeta.name)
        ])
      ]),

      // 投掷按钮组 (左中右三列精准投放)
      h('div', { staticStyle: { flexDirection: 'row', marginTop: '14px' } }, [
        h('div', {
          staticStyle: {
            width: '80px', height: '42px', backgroundColor: '#1e293b', borderRadius: '8px',
            borderWidth: '1px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginRight: '10px'
          },
          on: { click: function() { handleWatermelonDrop(vm, 50); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' } }, '左侧下落')]),
        h('div', {
          staticStyle: {
            width: '80px', height: '42px', backgroundColor: '#1e293b', borderRadius: '8px',
            borderWidth: '1px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginRight: '10px'
          },
          on: { click: function() { handleWatermelonDrop(vm, 120); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' } }, '居中下落')]),
        h('div', {
          staticStyle: {
            width: '80px', height: '42px', backgroundColor: '#1e293b', borderRadius: '8px',
            borderWidth: '1px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleWatermelonDrop(vm, 190); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' } }, '右侧下落')])
      ]),

      h('div', {
        staticStyle: {
          width: '120px', height: '30px', backgroundColor: '#334155', borderRadius: '15px',
          justifyContent: 'center', alignItems: 'center', marginTop: '12px'
        },
        on: { click: function() { initWatermelon(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#f8fafc' } }, '重置新开局')
      ])
    ])
  ]);
}
