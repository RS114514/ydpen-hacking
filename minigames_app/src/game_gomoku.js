// game_gomoku.js —— 五子棋
export function initGomoku(vm) {
  var b = [];
  for (var i = 0; i < 11; i++) {
    var row = [];
    for (var j = 0; j < 11; j++) row.push(0);
    b.push(row);
  }
  vm.g_gomoku = {
    board: b,
    turn: 1, // 1: 黑(人), 2: 白(AI)
    winner: 0,
    lastX: -1,
    lastY: -1
  };
}

export function handleGomokuClick(vm, r, c) {
  var g = vm.g_gomoku;
  if (!g || g.winner !== 0 || g.turn !== 1) return;
  if (g.board[r][c] !== 0) return;

  g.board[r][c] = 1;
  g.lastX = r;
  g.lastY = c;

  if (checkWin(g.board, r, c, 1)) {
    g.winner = 1;
    return;
  }

  g.turn = 2;
  // 简易但具进攻/防守意识的启发式五子棋 AI
  setTimeout(function() {
    aiMove(vm);
  }, 100);
}

function checkWin(board, r, c, role) {
  var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (var i = 0; i < dirs.length; i++) {
    var dr = dirs[i][0], dc = dirs[i][1];
    var count = 1;
    var step = 1;
    while (r + dr * step >= 0 && r + dr * step < 11 && c + dc * step >= 0 && c + dc * step < 11 && board[r + dr * step][c + dc * step] === role) {
      count++; step++;
    }
    step = 1;
    while (r - dr * step >= 0 && r - dr * step < 11 && c - dc * step >= 0 && c - dc * step < 11 && board[r - dr * step][c - dc * step] === role) {
      count++; step++;
    }
    if (count >= 5) return true;
  }
  return false;
}

function aiMove(vm) {
  var g = vm.g_gomoku;
  if (!g || g.winner !== 0) return;

  var bestScore = -1;
  var bestR = 5, bestC = 5;

  for (var r = 0; r < 11; r++) {
    for (var c = 0; c < 11; c++) {
      if (g.board[r][c] === 0) {
        var myScore = evaluatePoint(g.board, r, c, 2);
        var opScore = evaluatePoint(g.board, r, c, 1);
        var total = myScore * 1.2 + opScore;
        // 靠近中心微加权
        total += (5 - Math.abs(r - 5)) + (5 - Math.abs(c - 5));
        if (total > bestScore) {
          bestScore = total;
          bestR = r;
          bestC = c;
        }
      }
    }
  }

  g.board[bestR][bestC] = 2;
  g.lastX = bestR;
  g.lastY = bestC;

  if (checkWin(g.board, bestR, bestC, 2)) {
    g.winner = 2;
  } else {
    g.turn = 1;
  }
}

function evaluatePoint(board, r, c, role) {
  var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  var score = 0;
  for (var i = 0; i < dirs.length; i++) {
    var dr = dirs[i][0], dc = dirs[i][1];
    var count = 1;
    var openEnds = 0;

    var step = 1;
    while (r + dr * step >= 0 && r + dr * step < 11 && c + dc * step >= 0 && c + dc * step < 11 && board[r + dr * step][c + dc * step] === role) {
      count++; step++;
    }
    if (r + dr * step >= 0 && r + dr * step < 11 && c + dc * step >= 0 && c + dc * step < 11 && board[r + dr * step][c + dc * step] === 0) openEnds++;

    step = 1;
    while (r - dr * step >= 0 && r - dr * step < 11 && c - dc * step >= 0 && c - dc * step < 11 && board[r - dr * step][c - dc * step] === role) {
      count++; step++;
    }
    if (r - dr * step >= 0 && r - dr * step < 11 && c - dc * step >= 0 && c - dc * step < 11 && board[r - dr * step][c - dc * step] === 0) openEnds++;

    if (count >= 5) score += 100000;
    else if (count === 4) score += (openEnds === 2 ? 10000 : 2000);
    else if (count === 3) score += (openEnds === 2 ? 1000 : 200);
    else if (count === 2) score += (openEnds === 2 ? 100 : 20);
  }
  return score;
}

export function renderGomoku(vm, h) {
  var g = vm.g_gomoku;
  if (!g) return h('div');

  var statusText = '轮到你下棋 (黑子)';
  if (g.winner === 1) statusText = '恭喜你获得胜利！🎉';
  else if (g.winner === 2) statusText = 'AI 获胜，再接再厉！';
  else if (g.turn === 2) statusText = 'AI 思考中...';

  var rows = [];
  for (var r = 0; r < 11; r++) {
    var cols = [];
    for (var c = 0; c < 11; c++) {
      var val = g.board[r][c];
      var isLast = (r === g.lastX && c === g.lastY);

      var pieceEl = null;
      if (val === 1) {
        pieceEl = h('div', {
          staticStyle: {
            width: '14px', height: '14px', borderRadius: '7px',
            backgroundColor: '#111827',
            borderWidth: isLast ? '1.5px' : '0px', borderColor: '#ef4444'
          }
        });
      } else if (val === 2) {
        pieceEl = h('div', {
          staticStyle: {
            width: '14px', height: '14px', borderRadius: '7px',
            backgroundColor: '#f9fafb',
            borderWidth: isLast ? '1.5px' : '0px', borderColor: '#ef4444'
          }
        });
      }

      (function(row, col) {
        cols.push(h('div', {
          staticStyle: {
            width: '18px', height: '18px',
            borderRightWidth: '1px', borderBottomWidth: '1px', borderColor: '#b45309',
            justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleGomokuClick(vm, row, col); } }
        }, pieceEl ? [pieceEl] : []));
      })(r, c);
    }
    rows.push(h('div', { staticStyle: { flexDirection: 'row' } }, cols));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 棋盘区域
    h('div', {
      staticStyle: {
        width: '202px', height: '202px',
        backgroundColor: '#fcd34d',
        borderLeftWidth: '1px', borderTopWidth: '1px', borderColor: '#b45309',
        borderRadius: '4px'
      }
    }, rows),
    // 右侧信息面板
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '五子棋 (人机对弈)'),
      h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8', marginTop: '6px' } }, statusText),
      h('div', {
        staticStyle: {
          width: '90px', height: '30px', backgroundColor: '#3b82f6',
          borderRadius: '15px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { initGomoku(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#ffffff' } }, '重新开始')
      ])
    ])
  ]);
}
