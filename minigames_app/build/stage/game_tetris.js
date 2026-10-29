// game_tetris.js —— 俄罗斯方块 (Tetris, 10列 x 16行)
var SHAPES = [
  [[1, 1, 1, 1]], // I (青)
  [[1, 1], [1, 1]], // O (黄)
  [[0, 1, 0], [1, 1, 1]], // T (紫)
  [[1, 0, 0], [1, 1, 1]], // L (橙)
  [[0, 0, 1], [1, 1, 1]], // J (蓝)
  [[0, 1, 1], [1, 1, 0]], // S (绿)
  [[1, 1, 0], [0, 1, 1]]  // Z (红)
];

var COLORS = ['#38bdf8', '#facc15', '#a855f7', '#fb923c', '#3b82f6', '#4ade80', '#ef4444'];
var COLOR_BORDERS = ['#0284c7', '#ca8a04', '#7e22ce', '#c2410c', '#1d4ed8', '#15803d', '#b91c1c'];

export function initTetris(vm) {
  if (vm.g_tetris_timer) {
    clearInterval(vm.g_tetris_timer);
    vm.g_tetris_timer = null;
  }

  var board = [];
  for (var r = 0; r < 16; r++) {
    var row = [];
    for (var c = 0; c < 10; c++) row.push(0);
    board.push(row);
  }

  vm.g_tetris = {
    board: board,
    curShapeIdx: 0,
    curShape: [],
    nextShapeIdx: Math.floor(Math.random() * SHAPES.length),
    curX: 3,
    curY: 0,
    score: 0,
    lines: 0,
    gameOver: false
  };

  spawnTetrisPiece(vm.g_tetris);
  startTetrisLoop(vm);
}

function spawnTetrisPiece(t) {
  t.curShapeIdx = t.nextShapeIdx;
  t.curShape = cloneShape(SHAPES[t.curShapeIdx]);
  t.nextShapeIdx = Math.floor(Math.random() * SHAPES.length);
  t.curX = 3;
  t.curY = 0;
  if (!canPlace(t.board, t.curShape, t.curX, t.curY)) {
    t.gameOver = true;
  }
}

function cloneShape(s) {
  var res = [];
  for (var r = 0; r < s.length; r++) {
    var row = [];
    for (var c = 0; c < s[r].length; c++) row.push(s[r][c]);
    res.push(row);
  }
  return res;
}

function canPlace(b, shape, x, y) {
  for (var r = 0; r < shape.length; r++) {
    for (var c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        var nx = x + c;
        var ny = y + r;
        if (nx < 0 || nx >= 10 || ny >= 16) return false;
        if (ny >= 0 && b[ny][nx] !== 0) return false;
      }
    }
  }
  return true;
}

export function handleTetrisAction(vm, action) {
  var t = vm.g_tetris;
  if (!t) return;
  if (t.gameOver) {
    initTetris(vm);
    return;
  }

  if (action === 'left') {
    if (canPlace(t.board, t.curShape, t.curX - 1, t.curY)) t.curX--;
  } else if (action === 'right') {
    if (canPlace(t.board, t.curShape, t.curX + 1, t.curY)) t.curX++;
  } else if (action === 'rotate') {
    var rows = t.curShape.length, cols = t.curShape[0].length;
    var rotated = [];
    for (var c = 0; c < cols; c++) {
      var row = [];
      for (var r = rows - 1; r >= 0; r--) row.push(t.curShape[r][c]);
      rotated.push(row);
    }
    if (canPlace(t.board, rotated, t.curX, t.curY)) t.curShape = rotated;
  } else if (action === 'down') {
    if (canPlace(t.board, t.curShape, t.curX, t.curY + 1)) {
      t.curY++;
      t.score += 1;
    } else {
      lockPiece(vm, t);
    }
  } else if (action === 'drop') {
    while (canPlace(t.board, t.curShape, t.curX, t.curY + 1)) {
      t.curY++;
      t.score += 2;
    }
    lockPiece(vm, t);
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function lockPiece(vm, t) {
  for (var r = 0; r < t.curShape.length; r++) {
    for (var c = 0; c < t.curShape[r].length; c++) {
      if (t.curShape[r][c]) {
        var ny = t.curY + r;
        var nx = t.curX + c;
        if (ny >= 0 && ny < 16 && nx >= 0 && nx < 10) {
          t.board[ny][nx] = t.curShapeIdx + 1;
        }
      }
    }
  }

  // 消行
  var cleared = 0;
  for (var r = 15; r >= 0; r--) {
    var full = true;
    for (var c = 0; c < 10; c++) {
      if (t.board[r][c] === 0) { full = false; break; }
    }
    if (full) {
      cleared++;
      t.board.splice(r, 1);
      var emptyRow = [];
      for (var c = 0; c < 10; c++) emptyRow.push(0);
      t.board.unshift(emptyRow);
      r++;
    }
  }

  if (cleared > 0) {
    t.lines += cleared;
    t.score += [0, 100, 300, 700, 1500][cleared] || 2000;
  }

  spawnTetrisPiece(t);
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function startTetrisLoop(vm) {
  if (vm.g_tetris_timer) clearInterval(vm.g_tetris_timer);
  vm.g_tetris_timer = setInterval(function() {
    var t = vm.g_tetris;
    if (!t || t.gameOver) {
      if (vm.g_tetris_timer) clearInterval(vm.g_tetris_timer);
      return;
    }

    if (canPlace(t.board, t.curShape, t.curX, t.curY + 1)) {
      t.curY++;
    } else {
      lockPiece(vm, t);
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 450);
}

export function renderTetris(vm, h) {
  var t = vm.g_tetris;
  if (!t) return h('div');

  // 构建临时绘制网格
  var renderGrid = [];
  for (var r = 0; r < 16; r++) {
    var row = [];
    for (var c = 0; c < 10; c++) row.push(t.board[r][c]);
    renderGrid.push(row);
  }

  // 叠加当前下落方块
  if (!t.gameOver && t.curShape) {
    for (var r = 0; r < t.curShape.length; r++) {
      for (var c = 0; c < t.curShape[r].length; c++) {
        if (t.curShape[r][c]) {
          var ny = t.curY + r, nx = t.curX + c;
          if (ny >= 0 && ny < 16 && nx >= 0 && nx < 10) {
            renderGrid[ny][nx] = t.curShapeIdx + 1;
          }
        }
      }
    }
  }

  var rowsEl = [];
  for (var r = 0; r < 16; r++) {
    var colsEl = [];
    for (var c = 0; c < 10; c++) {
      var val = renderGrid[r][c];
      var color = val > 0 ? (COLORS[val - 1] || '#38bdf8') : '#0f172a';
      var border = val > 0 ? (COLOR_BORDERS[val - 1] || '#0284c7') : '#1e293b';
      colsEl.push(h('div', {
        staticStyle: {
          width: '11px', height: '11px', margin: '0.5px',
          backgroundColor: color, borderWidth: '1px', borderColor: border, borderRadius: '2px'
        }
      }));
    }
    rowsEl.push(h('div', { staticStyle: { flexDirection: 'row' } }, colsEl));
  }

  // 下一个方块预览
  var nextShape = SHAPES[t.nextShapeIdx] || [];
  var nextRowsEl = [];
  for (var r = 0; r < 3; r++) {
    var nextColsEl = [];
    for (var c = 0; c < 4; c++) {
      var active = (nextShape[r] && nextShape[r][c]);
      var ncolor = active ? (COLORS[t.nextShapeIdx] || '#38bdf8') : 'transparent';
      nextColsEl.push(h('div', {
        staticStyle: { width: '8px', height: '8px', margin: '1px', backgroundColor: ncolor, borderRadius: '1px' }
      }));
    }
    nextRowsEl.push(h('div', { staticStyle: { flexDirection: 'row' } }, nextColsEl));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 1. 方块主舞台 (126x190)
    h('div', {
      staticStyle: {
        width: '128px', height: '188px', backgroundColor: '#090d16',
        padding: '2px', borderRadius: '8px', borderWidth: '2px', borderColor: '#334155',
        justifyContent: 'center', alignItems: 'center', marginRight: '20px'
      }
    }, rowsEl),

    // 2. 信息面板 (预览 + 分数)
    h('div', {
      staticStyle: {
        width: '140px', height: '188px', flexDirection: 'column', justifyContent: 'space-around', marginRight: '20px'
      }
    }, [
      // 预览箱
      h('div', {
        staticStyle: {
          backgroundColor: '#131d31', padding: '6px 8px', borderRadius: '8px',
          borderWidth: '1px', borderColor: '#1e293b'
        }
      }, [
        h('text', { staticStyle: { fontSize: '10px', color: '#94a3b8', marginBottom: '3px' } }, '下一块:'),
        h('div', { staticStyle: { height: '30px', justifyContent: 'center', alignItems: 'center' } }, nextRowsEl)
      ]),
      // 分数区
      h('div', {
        staticStyle: {
          backgroundColor: '#131d31', padding: '6px 8px', borderRadius: '8px',
          borderWidth: '1px', borderColor: '#1e293b'
        }
      }, [
        h('text', { staticStyle: { fontSize: '10px', color: '#94a3b8' } }, '当前得分:'),
        h('text', { staticStyle: { fontSize: '16px', color: '#38bdf8', fontWeight: 'bold' } }, '' + t.score),
        h('text', { staticStyle: { fontSize: '10px', color: '#94a3b8', marginTop: '3px' } }, '消除行数: ' + t.lines)
      ]),
      // 重新开始按钮
      h('div', {
        staticStyle: {
          height: '28px', backgroundColor: '#334155', borderRadius: '14px',
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { initTetris(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '11px', color: '#f8fafc' } }, t.gameOver ? '游戏结束·重玩' : '重新开始')
      ])
    ]),

    // 3. 超宽大触控操作板 (适合词典笔大拇指触控)
    h('div', {
      staticStyle: {
        flex: 1, height: '188px', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      // 第一排：左移、旋转、右移
      h('div', { staticStyle: { flexDirection: 'row', marginBottom: '10px' } }, [
        h('div', {
          staticStyle: {
            width: '84px', height: '56px', backgroundColor: '#1e293b', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center',
            marginRight: '14px'
          },
          on: { click: function() { handleTetrisAction(vm, 'left'); } }
        }, [
          h('text', { staticStyle: { fontSize: '18px', color: '#38bdf8', fontWeight: 'bold' } }, '◀ 左移')
        ]),
        h('div', {
          staticStyle: {
            width: '96px', height: '56px', backgroundColor: '#2563eb', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#60a5fa', justifyContent: 'center', alignItems: 'center',
            marginRight: '14px'
          },
          on: { click: function() { handleTetrisAction(vm, 'rotate'); } }
        }, [
          h('text', { staticStyle: { fontSize: '18px', color: '#ffffff', fontWeight: 'bold' } }, '旋转')
        ]),
        h('div', {
          staticStyle: {
            width: '84px', height: '56px', backgroundColor: '#1e293b', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleTetrisAction(vm, 'right'); } }
        }, [
          h('text', { staticStyle: { fontSize: '18px', color: '#38bdf8', fontWeight: 'bold' } }, '右移 ▶')
        ])
      ]),
      // 第二排：缓降、直接落底
      h('div', { staticStyle: { flexDirection: 'row' } }, [
        h('div', {
          staticStyle: {
            width: '140px', height: '52px', backgroundColor: '#334155', borderRadius: '12px',
            borderWidth: '1px', borderColor: '#475569', justifyContent: 'center', alignItems: 'center',
            marginRight: '14px'
          },
          on: { click: function() { handleTetrisAction(vm, 'down'); } }
        }, [
          h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '▼ 缓降 (+1)')
        ]),
        h('div', {
          staticStyle: {
            width: '140px', height: '52px', backgroundColor: '#dc2626', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#f87171', justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleTetrisAction(vm, 'drop'); } }
        }, [
          h('text', { staticStyle: { fontSize: '16px', color: '#ffffff', fontWeight: 'bold' } }, '▼▼ 瞬间落底')
        ])
      ])
    ])
  ]);
}
