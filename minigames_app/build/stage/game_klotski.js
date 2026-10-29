// game_klotski.js —— 三国华容道 (Klotski, 经典横刀立马 4x5)
export function initKlotski(vm) {
  vm.g_klotski = {
    blocks: [
      { id: 'caocao', name: '曹操', w: 2, h: 2, x: 1, y: 0, col: '#ef4444', border: '#f87171' },
      { id: 'zhangfei', name: '张飞', w: 1, h: 2, x: 0, y: 0, col: '#f97316', border: '#fb923c' },
      { id: 'zhaoyun', name: '赵云', w: 1, h: 2, x: 3, y: 0, col: '#3b82f6', border: '#60a5fa' },
      { id: 'machao', name: '马超', w: 1, h: 2, x: 0, y: 2, col: '#8b5cf6', border: '#a78bfa' },
      { id: 'huangzhong', name: '黄忠', w: 1, h: 2, x: 3, y: 2, col: '#10b981', border: '#34d399' },
      { id: 'guanyu', name: '关羽', w: 2, h: 1, x: 1, y: 2, col: '#06b6d4', border: '#22d3ee' },
      { id: 'bing1', name: '卒', w: 1, h: 1, x: 1, y: 3, col: '#d97706', border: '#fbbf24' },
      { id: 'bing2', name: '卒', w: 1, h: 1, x: 2, y: 3, col: '#d97706', border: '#fbbf24' },
      { id: 'bing3', name: '卒', w: 1, h: 1, x: 0, y: 4, col: '#d97706', border: '#fbbf24' },
      { id: 'bing4', name: '卒', w: 1, h: 1, x: 3, y: 4, col: '#d97706', border: '#fbbf24' }
    ],
    selectedId: 'caocao',
    stepCount: 0,
    won: false
  };
}

export function handleKlotskiMove(vm, blockId, dx, dy) {
  var k = vm.g_klotski;
  if (!k || k.won) return;

  var blk = null;
  for (var i = 0; i < k.blocks.length; i++) {
    if (k.blocks[i].id === blockId) {
      blk = k.blocks[i];
      break;
    }
  }
  if (!blk) return;

  var targetX = blk.x + dx;
  var targetY = blk.y + dy;

  // 边界判定
  if (targetX < 0 || targetX + blk.w > 4 || targetY < 0 || targetY + blk.h > 5) return;

  // 与其他块重叠检测
  for (var i = 0; i < k.blocks.length; i++) {
    var other = k.blocks[i];
    if (other.id === blk.id) continue;
    var overlapX = (targetX < other.x + other.w) && (targetX + blk.w > other.x);
    var overlapY = (targetY < other.y + other.h) && (targetY + blk.h > other.y);
    if (overlapX && overlapY) return;
  }

  blk.x = targetX;
  blk.y = targetY;
  k.stepCount++;

  // 曹操抵达底端出口 (1, 3) 脱困成功
  if (blk.id === 'caocao' && blk.x === 1 && blk.y === 3) {
    k.won = true;
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
}

export function renderKlotski(vm, h) {
  var k = vm.g_klotski;
  if (!k) return h('div');

  var unit = 36; // 4x5 = 144x180
  var blockEls = [];

  for (var i = 0; i < k.blocks.length; i++) {
    var b = k.blocks[i];
    var isSel = (k.selectedId === b.id);

    (function(curB, selected) {
      blockEls.push(h('div', {
        staticStyle: {
          position: 'absolute',
          left: (curB.x * unit + 2) + 'px', top: (curB.y * unit + 2) + 'px',
          width: (curB.w * unit - 4) + 'px', height: (curB.h * unit - 4) + 'px',
          backgroundColor: curB.col, borderRadius: '6px',
          borderWidth: selected ? '2.5px' : '1px',
          borderColor: selected ? '#fde047' : curB.border,
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { k.selectedId = curB.id; if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', {
          staticStyle: {
            fontSize: (curB.w > 1 && curB.h > 1 ? '16px' : '12px'),
            color: '#ffffff', fontWeight: 'bold'
          }
        }, curB.name)
      ]));
    })(b, isSel);
  }

  // 胜利横幅
  if (k.won) {
    blockEls.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '148px', height: '184px',
        backgroundColor: 'rgba(9, 13, 22, 0.8)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#facc15', fontWeight: 'bold' } }, '★ 曹操脱困 ★'),
      h('text', { staticStyle: { fontSize: '11px', color: '#f8fafc', marginTop: '4px' } }, '总步数: ' + k.stepCount)
    ]));
  }

  var selectedName = '未选择';
  for (var i = 0; i < k.blocks.length; i++) {
    if (k.blocks[i].id === k.selectedId) {
      selectedName = k.blocks[i].name;
      break;
    }
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 20px'
    }
  }, [
    // 华容道木盒棋盘 (148x184)
    h('div', {
      staticStyle: {
        width: '148px', height: '184px', backgroundColor: '#090d16',
        borderRadius: '8px', position: 'relative', borderWidth: '2px', borderColor: '#475569',
        marginRight: '24px'
      }
    }, blockEls),

    // 信息与大十字按键
    h('div', { staticStyle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } }, [
      h('div', { staticStyle: { flexDirection: 'column' } }, [
        h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
          h('div', {
            staticStyle: { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#ef4444', marginRight: '8px' }
          }),
          h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '三国华容道 (横刀立马)')
        ]),
        h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', marginTop: '6px' } }, '已走步数: ' + k.stepCount),
        h('text', { staticStyle: { fontSize: '12px', color: '#facc15', marginTop: '4px' } }, '当前选中: [' + selectedName + ']'),
        h('text', { staticStyle: { fontSize: '10px', color: '#94a3b8', marginTop: '4px' } }, '点棋子选中，按右侧方向键滑动脱困'),
        h('div', {
          staticStyle: {
            width: '100px', height: '28px', backgroundColor: '#334155', borderRadius: '14px',
            justifyContent: 'center', alignItems: 'center', marginTop: '10px'
          },
          on: { click: function() { initKlotski(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
        }, [
          h('text', { staticStyle: { fontSize: '11px', color: '#f8fafc' } }, '重置开局')
        ])
      ]),

      // 宽大十字方向盘
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center', marginRight: '20px' } }, [
        h('div', {
          staticStyle: {
            width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginBottom: '6px'
          },
          on: { click: function() { if (k.selectedId) handleKlotskiMove(vm, k.selectedId, 0, -1); } }
        }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▲')]),
        h('div', { staticStyle: { flexDirection: 'row' } }, [
          h('div', {
            staticStyle: {
              width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
              borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginRight: '36px'
            },
            on: { click: function() { if (k.selectedId) handleKlotskiMove(vm, k.selectedId, -1, 0); } }
          }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '◀')]),
          h('div', {
            staticStyle: {
              width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
              borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center'
            },
            on: { click: function() { if (k.selectedId) handleKlotskiMove(vm, k.selectedId, 1, 0); } }
          }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▶')])
        ]),
        h('div', {
          staticStyle: {
            width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginTop: '6px'
          },
          on: { click: function() { if (k.selectedId) handleKlotskiMove(vm, k.selectedId, 0, 1); } }
        }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▼')])
      ])
    ])
  ]);
}
