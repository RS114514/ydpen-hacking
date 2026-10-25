// game_tictactoe.js —— 井字棋 (Tic-Tac-Toe, 3x3)
export function initTicTacToe(vm) {
  vm.g_ttt = {
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0], // 0:空, 1:X (玩家), 2:O (AI)
    winner: 0, // 0:进行中, 1:玩家胜, 2:AI胜, 3:平局
    turn: 1
  };
}

export function handleTicTacToeClick(vm, index) {
  var t = vm.g_ttt;
  if (!t || t.winner !== 0 || t.turn !== 1) return;
  if (t.board[index] !== 0) return;

  t.board[index] = 1;
  var w = checkTTTWinner(t.board);
  if (w !== 0) {
    t.winner = w;
    return;
  }

  t.turn = 2;
  setTimeout(function() {
    tttAiMove(vm);
  }, 100);
}

function checkTTTWinner(b) {
  var lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (var i = 0; i < lines.length; i++) {
    var a = lines[i][0], c = lines[i][1], d = lines[i][2];
    if (b[a] !== 0 && b[a] === b[c] && b[a] === b[d]) {
      return b[a];
    }
  }
  for (var i = 0; i < 9; i++) {
    if (b[i] === 0) return 0;
  }
  return 3; // 平局
}

function tttAiMove(vm) {
  var t = vm.g_ttt;
  if (!t || t.winner !== 0) return;

  // 1. 寻找能赢的点
  for (var i = 0; i < 9; i++) {
    if (t.board[i] === 0) {
      t.board[i] = 2;
      if (checkTTTWinner(t.board) === 2) {
        t.winner = 2;
        return;
      }
      t.board[i] = 0;
    }
  }

  // 2. 堵截玩家要赢的点
  for (var i = 0; i < 9; i++) {
    if (t.board[i] === 0) {
      t.board[i] = 1;
      if (checkTTTWinner(t.board) === 1) {
        t.board[i] = 2;
        t.turn = 1;
        return;
      }
      t.board[i] = 0;
    }
  }

  // 3. 占中心或空位
  var preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  for (var i = 0; i < preferred.length; i++) {
    var pos = preferred[i];
    if (t.board[pos] === 0) {
      t.board[pos] = 2;
      break;
    }
  }

  var res = checkTTTWinner(t.board);
  if (res !== 0) {
    t.winner = res;
  } else {
    t.turn = 1;
  }
}

export function renderTicTacToe(vm, h) {
  var t = vm.g_ttt;
  if (!t) return h('div');

  var statusText = '你的回合 (X)';
  if (t.winner === 1) statusText = '恭喜你获得胜利！🎉';
  else if (t.winner === 2) statusText = 'AI 获胜，再来一局吧！';
  else if (t.winner === 3) statusText = '双方平局！🤝';
  else if (t.turn === 2) statusText = 'AI 思考中...';

  var cells = [];
  for (var i = 0; i < 9; i++) {
    var val = t.board[i];
    var symbol = '';
    var sColor = '#ffffff';
    if (val === 1) {
      symbol = '✕';
      sColor = '#38bdf8';
    } else if (val === 2) {
      symbol = '◯';
      sColor = '#f43f5e';
    }

    (function(idx) {
      cells.push(h('div', {
        staticStyle: {
          width: '62px', height: '62px', backgroundColor: '#1e293b',
          margin: '2px', borderRadius: '8px', justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { handleTicTacToeClick(vm, idx); } }
      }, [
        h('text', { staticStyle: { fontSize: '28px', fontWeight: 'bold', color: sColor } }, symbol)
      ]));
    })(i);
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 3x3 棋盘 (202x202)
    h('div', {
      staticStyle: {
        width: '202px', height: '202px', backgroundColor: '#0f172a',
        flexDirection: 'row', flexWrap: 'wrap', padding: '2px', borderRadius: '10px'
      }
    }, cells),
    // 右侧提示
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '井字棋 (人机对弈)'),
      h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8', marginTop: '6px' } }, statusText),
      h('div', {
        staticStyle: {
          width: '90px', height: '30px', backgroundColor: '#3b82f6',
          borderRadius: '15px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { initTicTacToe(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#ffffff' } }, '重新开始')
      ])
    ])
  ]);
}
