// game_klotski.js —— 三国华容道 (Klotski, 经典横刀立马残局 4x5)
// 棋子类型: 0:曹操(2x2), 1-5:五虎将(关羽2x1, 张飞/赵云/马超/黄忠1x2), 6-9:兵(1x1)
export function initKlotski(vm) {
  // 经典横刀立马初始布局
  vm.g_klotski = {
    blocks: [
      { id: 'caocao', name: '曹操', w: 2, h: 2, x: 1, y: 0, col: '#ef4444' },
      { id: 'zhangfei', name: '张飞', w: 1, h: 2, x: 0, y: 0, col: '#f97316' },
      { id: 'zhaoyun', name: '赵云', w: 1, h: 2, x: 3, y: 0, col: '#3b82f6' },
      { id: 'machao', name: '马超', w: 1, h: 2, x: 0, y: 2, col: '#8b5cf6' },
      { id: 'huangzhong', name: '黄忠', w: 1, h: 2, x: 3, y: 2, col: '#10b981' },
      { id: 'guanyu', name: '关羽', w: 2, h: 1, x: 1, y: 2, col: '#06b6d4' },
      { id: 'bing1', name: '卒', w: 1, h: 1, x: 1, y: 3, col: '#eab308' },
      { id: 'bing2', name: '卒', w: 1, h: 1, x: 2, y: 3, col: '#eab308' },
      { id: 'bing3', name: '卒', w: 1, h: 1, x: 0, y: 4, col: '#eab308' },
      { id: 'bing4', name: '卒', w: 1, h: 1, x: 3, y: 4, col: '#eab308' }
    ],
    selectedId: null,
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

  // 边界
  if (targetX < 0 || targetX + blk.w > 4 || targetY < 0 || targetY + blk.h > 5) return;

  // 与其他块重叠检测
  for (var i = 0; i < k.blocks.length; i++) {
    var other = k.blocks[i];
    if (other.id === blk.id) continue;
    var overlapX = (targetX < other.x + other.w) && (targetX + blk.w > other.x);
    var overlapY = (targetY < other.y + other.h) && (targetY + blk.h > other.y);
    if (overlapX && overlapY) return; // 阻挡
  }

  blk.x = targetX;
  blk.y = targetY;
  k.stepCount++;

  // 曹操到达 (1, 3) 视为脱困成功
  if (blk.id === 'caocao' && blk.x === 1 && blk.y === 3) {
    k.won = true;
  }
}

export function renderKlotski(vm, h) {
  var k = vm.g_klotski;
  if (!k) return h('div');

  var unit = 40; // 每个格子 40px, 4x5 = 160x200
  var blockEls = [];

  for (var i = 0; i < k.blocks.length; i++) {
    var b = k.blocks[i];
    var isSel = (k.selectedId === b.id);

    (function(curB) {
      blockEls.push(h('div', {
        staticStyle: {
          position: 'absolute',
          left: (curB.x * unit + 2) + 'px', top: (curB.y * unit + 2) + 'px',
          width: (curB.w * unit - 4) + 'px', height: (curB.h * unit - 4) + 'px',
          backgroundColor: curB.col, borderRadius: '6px',
          borderWidth: isSel ? '2px' : '1px', borderColor: '#ffffff',
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { k.selectedId = curB.id; } }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#ffffff', fontWeight: 'bold' } }, curB.name)
      ]));
    })(b);
  }

  // 胜利提示
  if (k.won) {
    blockEls.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '160px', height: '200px',
        backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px', color: '#facc15', fontWeight: 'bold' } }, '曹操逃出华容道!'),
      h('text', { staticStyle: { fontSize: '12px', color: '#f8fafc', marginTop: '6px' } }, '总步数: ' + k.stepCount)
    ]));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 棋盘 (164x204)
    h('div', {
      staticStyle: {
        width: '164px', height: '204px', backgroundColor: '#0f172a',
        borderRadius: '6px', position: 'relative', borderWidth: '2px', borderColor: '#475569'
      }
    }, blockEls),

    // 控制台
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '三国华容道'),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '4px' } }, '步数: ' + k.stepCount),
      h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' } }, '点击选中棋子，再按方向移动'),

      // 四向移动控制键
      h('div', { staticStyle: { marginTop: '8px', alignItems: 'center' } }, [
        h('div', {
          staticStyle: { width: '38px', height: '28px', backgroundColor: '#334155', borderRadius: '4px', justifyContent: 'center', alignItems: 'center', marginBottom: '2px' },
          on: { click: function() { if (k.selectedId) handleKlotskiMove(vm, k.selectedId, 0, -1); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '▲')]),
        h('div', { staticStyle: { flexDirection: 'row' } }, [
          h('div', {
            staticStyle: { width: '38px', height: '28px', backgroundColor: '#334155', borderRadius: '4px', justifyContent: 'center', alignItems: 'center', marginRight: '16px' },
            on: { click: function() { if (k.selectedId) handleKlotskiMove(vm, k.selectedId, -1, 0); } }
          }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '◀')]),
          h('div', {
            staticStyle: { width: '38px', height: '28px', backgroundColor: '#334155', borderRadius: '4px', justifyContent: 'center', alignItems: 'center' },
            on: { click: function() { if (k.selectedId) handleKlotskiMove(vm, k.selectedId, 1, 0); } }
          }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '▶')])
        ]),
        h('div', {
          staticStyle: { width: '38px', height: '28px', backgroundColor: '#334155', borderRadius: '4px', justifyContent: 'center', alignItems: 'center', marginTop: '2px' },
          on: { click: function() { if (k.selectedId) handleKlotskiMove(vm, k.selectedId, 0, 1); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '▼')])
      ]),

      h('div', {
        staticStyle: { width: '80px', height: '24px', backgroundColor: '#475569', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', marginTop: '6px' },
        on: { click: function() { initKlotski(vm); } }
      }, [h('text', { staticStyle: { fontSize: '11px', color: '#ffffff' } }, '重置棋局')])
    ])
  ]);
}
