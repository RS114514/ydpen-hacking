// game_sokoban.js —— 经典推箱子 (Sokoban, 8x8 网格地图)
// 0:空地, 1:墙壁, 2:箱子, 3:目标点, 4:目标点上的箱子
var MAP_LEVEL1 = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 2, 3, 1],
  [1, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1, 0, 1, 1],
  [1, 0, 2, 3, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1]
];

export function initSokoban(vm) {
  var b = [];
  for (var r = 0; r < 8; r++) {
    var row = [];
    for (var c = 0; c < 8; c++) row.push(MAP_LEVEL1[r][c]);
    b.push(row);
  }

  vm.g_sokoban = {
    board: b,
    playerX: 1,
    playerY: 1,
    stepCount: 0,
    won: false
  };
}

export function handleSokobanMove(vm, dx, dy) {
  var s = vm.g_sokoban;
  if (!s || s.won) return;

  var px = s.playerX, py = s.playerY;
  var nx = px + dx, ny = py + dy;

  // 碰墙
  if (s.board[ny][nx] === 1) return;

  // 推箱子
  if (s.board[ny][nx] === 2 || s.board[ny][nx] === 4) {
    var bx = nx + dx, by = ny + dy;
    // 箱子前方是空地或目标点
    if (s.board[by][bx] === 0 || s.board[by][bx] === 3) {
      // 移动箱子
      s.board[by][bx] = (s.board[by][bx] === 3 ? 4 : 2);
      s.board[ny][nx] = (s.board[ny][nx] === 4 ? 3 : 0);
      s.playerX = nx;
      s.playerY = ny;
      s.stepCount++;
    }
  } else {
    // 正常走动
    s.playerX = nx;
    s.playerY = ny;
    s.stepCount++;
  }

  // 胜利检测：棋盘上无普通箱子(2)，全为目标点上的箱子(4)
  var won = true;
  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      if (s.board[r][c] === 2) { won = false; break; }
    }
  }
  s.won = won;
}

export function renderSokoban(vm, h) {
  var s = vm.g_sokoban;
  if (!s) return h('div');

  var cellSize = 24;
  var elements = [];

  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      var val = s.board[r][c];
      var isPlayer = (s.playerX === c && s.playerY === r);

      var bg = '#1e293b';
      var content = '';
      if (val === 1) bg = '#475569'; // 墙
      else if (val === 2) content = '📦';
      else if (val === 3) content = '🎯';
      else if (val === 4) content = '✨';

      if (isPlayer) content = '👷';

      elements.push(h('div', {
        staticStyle: {
          position: 'absolute',
          left: (c * cellSize) + 'px', top: (r * cellSize) + 'px',
          width: cellSize + 'px', height: cellSize + 'px',
          backgroundColor: bg, borderWidth: '0.5px', borderColor: '#334155',
          justifyContent: 'center', alignItems: 'center'
        }
      }, [
        h('text', { staticStyle: { fontSize: '14px' } }, content)
      ]));
    }
  }

  if (s.won) {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: (8 * cellSize) + 'px', height: (8 * cellSize) + 'px',
        backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#facc15', fontWeight: 'bold' } }, '推箱子通关! 🏆'),
      h('text', { staticStyle: { fontSize: '12px', color: '#f8fafc', marginTop: '6px' } }, '步数: ' + s.stepCount)
    ]));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 舞台 (196x196)
    h('div', {
      staticStyle: {
        width: (8 * cellSize) + 'px', height: (8 * cellSize) + 'px',
        borderRadius: '6px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#334155'
      }
    }, elements),

    // 控制台
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center', alignItems: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '经典推箱子'),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '4px' } }, '步数: ' + s.stepCount),

      // 方向键
      h('div', { staticStyle: { marginTop: '8px', alignItems: 'center' } }, [
        h('div', {
          staticStyle: { width: '38px', height: '28px', backgroundColor: '#334155', borderRadius: '4px', justifyContent: 'center', alignItems: 'center', marginBottom: '2px' },
          on: { click: function() { handleSokobanMove(vm, 0, -1); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '▲')]),
        h('div', { staticStyle: { flexDirection: 'row' } }, [
          h('div', {
            staticStyle: { width: '38px', height: '28px', backgroundColor: '#334155', borderRadius: '4px', justifyContent: 'center', alignItems: 'center', marginRight: '16px' },
            on: { click: function() { handleSokobanMove(vm, -1, 0); } }
          }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '◀')]),
          h('div', {
            staticStyle: { width: '38px', height: '28px', backgroundColor: '#334155', borderRadius: '4px', justifyContent: 'center', alignItems: 'center' },
            on: { click: function() { handleSokobanMove(vm, 1, 0); } }
          }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '▶')])
        ]),
        h('div', {
          staticStyle: { width: '38px', height: '28px', backgroundColor: '#334155', borderRadius: '4px', justifyContent: 'center', alignItems: 'center', marginTop: '2px' },
          on: { click: function() { handleSokobanMove(vm, 0, 1); } }
        }, [h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '▼')])
      ]),

      h('div', {
        staticStyle: { width: '80px', height: '24px', backgroundColor: '#475569', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', marginTop: '6px' },
        on: { click: function() { initSokoban(vm); } }
      }, [h('text', { staticStyle: { fontSize: '11px', color: '#ffffff' } }, '重置本关')])
    ])
  ]);
}
