// game_sokoban.js —— 经典推箱子 (Sokoban, 8x8 网格地图)
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
    if (s.board[by][bx] === 0 || s.board[by][bx] === 3) {
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

  // 胜利检测
  var won = true;
  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      if (s.board[r][c] === 2) { won = false; break; }
    }
  }
  s.won = won;
  if (vm.$forceUpdate) vm.$forceUpdate();
}

export function renderSokoban(vm, h) {
  var s = vm.g_sokoban;
  if (!s) return h('div');

  var cellSize = 22; // 8x22 = 176px
  var elements = [];

  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      var val = s.board[r][c];
      var isPlayer = (s.playerX === c && s.playerY === r);

      var isPlayer = (s.playerR === r && s.playerC === c);

      if (isPlayer) {
        elements.push(h('image', {
          staticStyle: {
            position: 'absolute',
            left: (c * cellSize) + 'px', top: (r * cellSize) + 'px',
            width: cellSize + 'px', height: cellSize + 'px'
          },
          attrs: { src: 'assets/soko_worker.png' }
        }));
      } else if (val === 2) {
        elements.push(h('image', {
          staticStyle: {
            position: 'absolute',
            left: (c * cellSize) + 'px', top: (r * cellSize) + 'px',
            width: cellSize + 'px', height: cellSize + 'px'
          },
          attrs: { src: 'assets/soko_crate.png' }
        }));
      } else if (val === 3) {
        elements.push(h('image', {
          staticStyle: {
            position: 'absolute',
            left: (c * cellSize) + 'px', top: (r * cellSize) + 'px',
            width: cellSize + 'px', height: cellSize + 'px'
          },
          attrs: { src: 'assets/soko_goal.png' }
        }));
      } else if (val === 4) {
        elements.push(h('image', {
          staticStyle: {
            position: 'absolute',
            left: (c * cellSize) + 'px', top: (r * cellSize) + 'px',
            width: cellSize + 'px', height: cellSize + 'px'
          },
          attrs: { src: 'assets/soko_crate_goal.png' }
        }));
      } else if (val === 1) {
        elements.push(h('div', {
          staticStyle: {
            position: 'absolute',
            left: (c * cellSize) + 'px', top: (r * cellSize) + 'px',
            width: cellSize + 'px', height: cellSize + 'px',
            backgroundColor: '#334155', borderWidth: '1px', borderColor: '#475569',
            borderRadius: '3px'
          }
        }));
      }
    }
  }

  if (s.won) {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '176px', height: '176px',
        backgroundColor: 'rgba(9, 13, 22, 0.8)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#4ade80', fontWeight: 'bold' } }, '★ 成功归位 ★'),
      h('text', { staticStyle: { fontSize: '11px', color: '#f8fafc', marginTop: '4px' } }, '总步数: ' + s.stepCount)
    ]));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 20px'
    }
  }, [
    // 仓库迷宫 (176x176)
    h('div', {
      staticStyle: {
        width: '178px', height: '178px', backgroundColor: '#090d16',
        borderRadius: '8px', position: 'relative', borderWidth: '2px', borderColor: '#475569',
        marginRight: '24px'
      }
    }, elements),

    // 信息与大十字方向按键
    h('div', { staticStyle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } }, [
      h('div', { staticStyle: { flexDirection: 'column' } }, [
        h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
          h('div', {
            staticStyle: { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#b45309', marginRight: '8px' }
          }),
          h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '经典推箱子')
        ]),
        h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', marginTop: '6px' } }, '当前步数: ' + s.stepCount),
        h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' } }, '控制工友推动木箱精准归位'),
        h('div', {
          staticStyle: {
            width: '100px', height: '28px', backgroundColor: '#334155', borderRadius: '14px',
            justifyContent: 'center', alignItems: 'center', marginTop: '10px'
          },
          on: { click: function() { initSokoban(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
        }, [
          h('text', { staticStyle: { fontSize: '11px', color: '#f8fafc' } }, '重新开始')
        ])
      ]),

      // 宽大十字方向盘
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center', marginRight: '20px' } }, [
        h('div', {
          staticStyle: {
            width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginBottom: '6px'
          },
          on: { click: function() { handleSokobanMove(vm, 0, -1); } }
        }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▲')]),
        h('div', { staticStyle: { flexDirection: 'row' } }, [
          h('div', {
            staticStyle: {
              width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
              borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginRight: '36px'
            },
            on: { click: function() { handleSokobanMove(vm, -1, 0); } }
          }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '◀')]),
          h('div', {
            staticStyle: {
              width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
              borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center'
            },
            on: { click: function() { handleSokobanMove(vm, 1, 0); } }
          }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▶')])
        ]),
        h('div', {
          staticStyle: {
            width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginTop: '6px'
          },
          on: { click: function() { handleSokobanMove(vm, 0, 1); } }
        }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▼')])
      ])
    ])
  ]);
}
