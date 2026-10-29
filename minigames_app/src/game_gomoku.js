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
    turn: 1, // 1: 黑(玩家), 2: 白(AI)
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
    if (vm.$forceUpdate) vm.$forceUpdate();
    return;
  }

  g.turn = 2;
  if (vm.$forceUpdate) vm.$forceUpdate();

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
  var bestR = -1, bestC = -1;

  for (var r = 0; r < 11; r++) {
    for (var c = 0; c < 11; c++) {
      if (g.board[r][c] === 0) {
        var score = evaluatePoint(g.board, r, c);
        if (score > bestScore) {
          bestScore = score;
          bestR = r;
          bestC = c;
        }
      }
    }
  }

  if (bestR !== -1) {
    g.board[bestR][bestC] = 2;
    g.lastX = bestR;
    g.lastY = bestC;
    if (checkWin(g.board, bestR, bestC, 2)) {
      g.winner = 2;
    } else {
      g.turn = 1;
    }
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function evaluatePoint(b, r, c) {
  var score = 0;
  // 离中心越近越佳
  score += (5 - Math.abs(5 - r)) + (5 - Math.abs(5 - c));

  var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (var i = 0; i < dirs.length; i++) {
    var dr = dirs[i][0], dc = dirs[i][1];
    // 防守权重 (阻断黑棋)
    var pCount = countLine(b, r, c, dr, dc, 1);
    if (pCount >= 4) score += 10000;
    else if (pCount === 3) score += 800;
    else if (pCount === 2) score += 100;

    // 进攻权重 (白棋连子)
    var aiCount = countLine(b, r, c, dr, dc, 2);
    if (aiCount >= 4) score += 20000;
    else if (aiCount === 3) score += 1200;
    else if (aiCount === 2) score += 150;
  }
  return score;
}

function countLine(b, r, c, dr, dc, role) {
  var cnt = 0;
  var step = 1;
  while (r + dr * step >= 0 && r + dr * step < 11 && c + dc * step >= 0 && c + dc * step < 11 && b[r + dr * step][c + dc * step] === role) {
    cnt++; step++;
  }
  step = 1;
  while (r - dr * step >= 0 && r - dr * step < 11 && c - dc * step >= 0 && c - dc * step < 11 && b[r - dr * step][c - dc * step] === role) {
    cnt++; step++;
  }
  return cnt;
}

export function renderGomoku(vm, h) {
  var g = vm.g_gomoku;
  if (!g) return h('div');

  var statusText = '轮到你下棋 (黑子)';
  var statusColor = '#38bdf8';
  if (g.winner === 1) {
    statusText = '★ 恭喜你五子连珠胜利！';
    statusColor = '#4ade80';
  } else if (g.winner === 2) {
    statusText = '× AI 获胜，请重新开局！';
    statusColor = '#f87171';
  } else if (g.turn === 2) {
    statusText = 'AI 思考落子中...';
    statusColor = '#facc15';
  }

  var rows = [];
  for (var r = 0; r < 11; r++) {
    var cols = [];
    for (var c = 0; c < 11; c++) {
      var val = g.board[r][c];
      var isLast = (r === g.lastX && c === g.lastY);

      var pieceEl = null;
      if (val === 1) {
        pieceEl = h('image', {
          staticStyle: {
            width: '14px', height: '14px',
            borderWidth: isLast ? '1.5px' : '0px', borderColor: '#ef4444', borderRadius: '7px'
          },
          attrs: { src: 'assets/gomoku_stone_black.png' }
        });
      } else if (val === 2) {
        pieceEl = h('image', {
          staticStyle: {
            width: '14px', height: '14px',
            borderWidth: isLast ? '1.5px' : '0px', borderColor: '#ef4444', borderRadius: '7px'
          },
          attrs: { src: 'assets/gomoku_stone_white.png' }
        });
      }

      (function(row, col) {
        cols.push(h('div', {
          staticStyle: {
            width: '16px', height: '16px',
            borderRightWidth: '1px', borderBottomWidth: '1px', borderColor: '#b45309',
            justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleGomokuClick(vm, row, col); } }
        }, pieceEl ? [pieceEl] : []));
      })(r, c);
    }
    rows.push(h('div', { staticStyle: { flexDirection: 'row' } }, cols));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 20px'
    }
  }, [
    // 棋盘区域 (木纹黄 180x180)
    h('div', {
      staticStyle: {
        width: '180px', height: '180px',
        backgroundColor: '#fcd34d',
        borderLeftWidth: '1px', borderTopWidth: '1px', borderColor: '#b45309',
        borderRadius: '6px', marginRight: '30px'
      }
    }, rows),

    // 右侧信息面板
    h('div', { staticStyle: { flex: 1, flexDirection: 'column', justifyContent: 'center' } }, [
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#64748b', marginRight: '8px' }
        }),
        h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '五子棋 (人机智能对弈)')
      ]),
      h('text', { staticStyle: { fontSize: '14px', color: statusColor, marginTop: '8px', fontWeight: 'bold' } }, statusText),
      h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '6px' } }, '规则：黑先白后，率先任意方向达成五连子者获胜。'),

      h('div', {
        staticStyle: {
          width: '160px', height: '40px', backgroundColor: '#2563eb',
          borderRadius: '20px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { initGomoku(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '14px', color: '#ffffff', fontWeight: 'bold' } }, '重新开始对局')
      ])
    ])
  ]);
}
