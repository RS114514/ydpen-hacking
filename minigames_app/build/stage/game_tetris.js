// game_tetris.js —— 俄罗斯方块 (Tetris, 10列 x 16行)
var SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]]  // Z
];

var COLORS = ['#38bdf8', '#facc15', '#a855f7', '#fb923c', '#3b82f6', '#4ade80', '#ef4444'];

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
  t.curShapeIdx = Math.floor(Math.random() * SHAPES.length);
  t.curShape = cloneShape(SHAPES[t.curShapeIdx]);
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
  if (!t || t.gameOver) return;

  if (action === 'left') {
    if (canPlace(t.board, t.curShape, t.curX - 1, t.curY)) t.curX--;
  } else if (action === 'right') {
    if (canPlace(t.board, t.curShape, t.curX + 1, t.curY)) t.curX++;
  } else if (action === 'rotate') {
    // 顺时针旋转矩阵
    var rows = t.curShape.length, cols = t.curShape[0].length;
    var rotated = [];
    for (var c = 0; c < cols; c++) {
      var row = [];
      for (var r = rows - 1; r >= 0; r--) row.push(t.curShape[r][c]);
      rotated.push(row);
    }
    if (canPlace(t.board, rotated, t.curX, t.curY)) t.curShape = rotated;
  } else if (action === 'drop') {
    while (canPlace(t.board, t.curShape, t.curX, t.curY + 1)) t.curY++;
    lockPiece(vm, t);
  }
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
  }, 500);
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

  // 叠加当前下落中的活动方块
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
      var color = val > 0 ? (COLORS[val - 1] || '#38bdf8') : '#1e293b';
      colsEl.push(h('div', {
        staticStyle: {
          width: '12px', height: '12px', margin: '0.5px',
          backgroundColor: color, borderRadius: '2px'
        }
      }));
    }
    rowsEl.push(h('div', { staticStyle: { flexDirection: 'row' } }, colsEl));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 方块舞台 (132x202)
    h('div', {
      staticStyle: {
        width: '136px', height: '206px', backgroundColor: '#0f172a',
        padding: '2px', borderRadius: '6px', borderWidth: '2px', borderColor: '#334155',
        justifyContent: 'center', alignItems: 'center'
      }
    }, rowsEl),

    // 控制面板与分数
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '俄罗斯方块'),
      h('text', { staticStyle: { fontSize: '13px', color: '#38bdf8', marginTop: '6px' } }, '得分: ' + t.score + ' (消除: ' + t.lines + '行)'),
      // 触控按钮组
      h('div', { staticStyle: { flexDirection: 'row', marginTop: '12px' } }, [
        h('div', {
          staticStyle: { width: '42px', height: '36px', backgroundColor: '#334155', borderRadius: '8px', justifyContent: 'center', alignItems: 'center', marginRight: '6px' },
          on: { click: function() { handleTetrisAction(vm, 'left'); } }
        }, [h('text', { staticStyle: { fontSize: '16px', color: '#ffffff' } }, '◀')]),
        h('div', {
          staticStyle: { width: '42px', height: '36px', backgroundColor: '#3b82f6', borderRadius: '8px', justifyContent: 'center', alignItems: 'center', marginRight: '6px' },
          on: { click: function() { handleTetrisAction(vm, 'rotate'); } }
        }, [h('text', { staticStyle: { fontSize: '14px', color: '#ffffff' } }, '↻')]),
        h('div', {
          staticStyle: { width: '42px', height: '36px', backgroundColor: '#334155', borderRadius: '8px', justifyContent: 'center', alignItems: 'center', marginRight: '6px' },
          on: { click: function() { handleTetrisAction(vm, 'right'); } }
        }, [h('text', { staticStyle: { fontSize: '16px', color: '#ffffff' } }, '▶')]),
        h('div', {
          staticStyle: { width: '42px', height: '36px', backgroundColor: '#ef4444', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' },
          on: { click: function() { handleTetrisAction(vm, 'drop'); } }
        }, [h('text', { staticStyle: { fontSize: '14px', color: '#ffffff' } }, '⏬')])
      ]),
      h('div', {
        staticStyle: { width: '90px', height: '26px', backgroundColor: '#475569', borderRadius: '13px', justifyContent: 'center', alignItems: 'center', marginTop: '12px' },
        on: { click: function() { initTetris(vm); } }
      }, [h('text', { staticStyle: { fontSize: '12px', color: '#ffffff' } }, '重新开始')])
    ])
  ]);
}
