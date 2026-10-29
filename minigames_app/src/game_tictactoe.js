// game_tictactoe.js —— 井字棋 (Tic-Tac-Toe)
export function initTicTacToe(vm) {
  vm.g_ttt = {
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0], // 0: 空, 1: 玩家(O), 2: AI(X)
    winner: 0, // 0: 进行中, 1: 玩家胜, 2: AI胜, 3: 平局
    playerWins: vm.g_ttt ? (vm.g_ttt.playerWins || 0) : 0,
    aiWins: vm.g_ttt ? (vm.g_ttt.aiWins || 0) : 0
  };
}

export function handleTttClick(vm, idx) {
  var t = vm.g_ttt;
  if (!t || t.winner !== 0 || t.board[idx] !== 0) return;

  t.board[idx] = 1;
  var w = checkTttWin(t.board);
  if (w !== 0) {
    t.winner = w;
    if (w === 1) t.playerWins++;
    if (vm.$forceUpdate) vm.$forceUpdate();
    return;
  }

  // AI 快速落子
  setTimeout(function() {
    aiTttMove(vm);
  }, 100);
}

var WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkTttWin(b) {
  for (var i = 0; i < WINS.length; i++) {
    var line = WINS[i];
    if (b[line[0]] !== 0 && b[line[0]] === b[line[1]] && b[line[1]] === b[line[2]]) {
      return b[line[0]];
    }
  }
  for (var i = 0; i < 9; i++) {
    if (b[i] === 0) return 0;
  }
  return 3; // 平局
}

function aiTttMove(vm) {
  var t = vm.g_ttt;
  if (!t || t.winner !== 0) return;

  // 1. 尝试自胜
  for (var i = 0; i < 9; i++) {
    if (t.board[i] === 0) {
      t.board[i] = 2;
      if (checkTttWin(t.board) === 2) {
        t.winner = 2;
        t.aiWins++;
        if (vm.$forceUpdate) vm.$forceUpdate();
        return;
      }
      t.board[i] = 0;
    }
  }

  // 2. 拦堵玩家
  for (var i = 0; i < 9; i++) {
    if (t.board[i] === 0) {
      t.board[i] = 1;
      if (checkTttWin(t.board) === 1) {
        t.board[i] = 2;
        var w2 = checkTttWin(t.board);
        if (w2 !== 0) {
          t.winner = w2;
          if (w2 === 2) t.aiWins++;
        }
        if (vm.$forceUpdate) vm.$forceUpdate();
        return;
      }
      t.board[i] = 0;
    }
  }

  // 3. 抢中心
  if (t.board[4] === 0) {
    t.board[4] = 2;
  } else {
    // 随机占空
    var empties = [];
    for (var i = 0; i < 9; i++) {
      if (t.board[i] === 0) empties.push(i);
    }
    if (empties.length > 0) {
      var pick = empties[Math.floor(Math.random() * empties.length)];
      t.board[pick] = 2;
    }
  }

  var w = checkTttWin(t.board);
  if (w !== 0) {
    t.winner = w;
    if (w === 2) t.aiWins++;
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
}

export function renderTicTacToe(vm, h) {
  var t = vm.g_ttt;
  if (!t) return h('div');

  var statusText = '轮到你下子 (蓝圈 O)';
  var statusColor = '#38bdf8';
  if (t.winner === 1) {
    statusText = '★ 恭喜你获得胜利！';
    statusColor = '#4ade80';
  } else if (t.winner === 2) {
    statusText = '× AI 获胜，再来一局！';
    statusColor = '#f87171';
  } else if (t.winner === 3) {
    statusText = '＝ 双方握手言和 (平局)';
    statusColor = '#facc15';
  }

  var cells = [];
  for (var i = 0; i < 9; i++) {
    var val = t.board[i];
    var symbol = val === 1 ? 'O' : (val === 2 ? 'X' : '');
    var col = val === 1 ? '#38bdf8' : '#ef4444';

    (function(idx, cellVal) {
      var childEl = null;
      if (cellVal === 1) {
        childEl = h('image', {
          staticStyle: { width: '40px', height: '40px' },
          attrs: { src: 'assets/ttt_o.png' }
        });
      } else if (cellVal === 2) {
        childEl = h('image', {
          staticStyle: { width: '40px', height: '40px' },
          attrs: { src: 'assets/ttt_x.png' }
        });
      }

      cells.push(h('div', {
        staticStyle: {
          width: '54px', height: '54px', backgroundColor: '#131d31', margin: '3px',
          borderRadius: '8px', borderWidth: '1.5px', borderColor: '#334155',
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { handleTttClick(vm, idx); } }
      }, childEl ? [childEl] : []));
    })(i, val);
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 20px'
    }
  }, [
    // 3x3 棋盘 (180x180)
    h('div', {
      staticStyle: {
        width: '180px', height: '180px', backgroundColor: '#090d16',
        borderRadius: '10px', padding: '2px', borderWidth: '2px', borderColor: '#1e293b',
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
        marginRight: '30px'
      }
    }, cells),

    // 信息与战绩
    h('div', { staticStyle: { flex: 1, flexDirection: 'column', justifyContent: 'center' } }, [
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#3b82f6', marginRight: '8px' }
        }),
        h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '经典井字棋 (人机对弈)')
      ]),
      h('text', { staticStyle: { fontSize: '14px', color: statusColor, marginTop: '8px', fontWeight: 'bold' } }, statusText),
      h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8', marginTop: '6px' } },
        '当前比分：玩家 ' + t.playerWins + ' 胜  |  AI ' + t.aiWins + ' 胜'
      ),

      h('div', {
        staticStyle: {
          width: '160px', height: '40px', backgroundColor: '#2563eb',
          borderRadius: '20px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { initTicTacToe(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '14px', color: '#ffffff', fontWeight: 'bold' } }, '下一局对决')
      ])
    ])
  ]);
}
