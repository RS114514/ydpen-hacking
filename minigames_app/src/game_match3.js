// game_match3.js —— 消消乐 (6x6 矩阵，相邻交换三消与掉落消除)
// 宝石种类: 0:草莓🍓, 1:蓝莓🫐, 2:葡萄🍇, 3:橙子🍊, 4:奇异果🥝
export var GEMS = [
  { emoji: '🍓', bg: '#ef4444' },
  { emoji: '🫐', bg: '#3b82f6' },
  { emoji: '🍇', bg: '#a855f7' },
  { emoji: '🍊', bg: '#f97316' },
  { emoji: '🥝', bg: '#84cc16' }
];

export function initMatch3(vm) {
  var rows = 6, cols = 6;
  var board = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      row.push(Math.floor(Math.random() * 5));
    }
    board.push(row);
  }

  // 初始消除连带三连
  eliminateInitialMatches(board);

  vm.g_m3 = {
    board: board,
    rows: rows,
    cols: cols,
    selected: null, // { r, c }
    score: 0,
    moves: 20
  };
}

function eliminateInitialMatches(b) {
  for (var r = 0; r < 6; r++) {
    for (var c = 0; c < 6; c++) {
      while (
        (c >= 2 && b[r][c] === b[r][c - 1] && b[r][c] === b[r][c - 2]) ||
        (r >= 2 && b[r][c] === b[r - 1][c] && b[r][c] === b[r - 2][c])
      ) {
        b[r][c] = Math.floor(Math.random() * 5);
      }
    }
  }
}

export function handleMatch3Click(vm, r, c) {
  var m = vm.g_m3;
  if (!m || m.moves <= 0) return;

  if (!m.selected) {
    m.selected = { r: r, c: c };
    return;
  }

  var r1 = m.selected.r, c1 = m.selected.c;
  var r2 = r, c2 = c;
  m.selected = null;

  // 仅相邻可交换
  var isAdjacent = (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1);
  if (!isAdjacent) {
    if (r1 !== r2 || c1 !== c2) m.selected = { r: r, c: c };
    return;
  }

  // 尝试交换
  var tmp = m.board[r1][c1];
  m.board[r1][c1] = m.board[r2][c2];
  m.board[r2][c2] = tmp;

  // 判定是否产生三消
  var matched = findMatches(m.board);
  if (matched.length > 0) {
    m.moves--;
    processMatches(m, matched);
  } else {
    // 无法消除，回弹
    m.board[r2][c2] = m.board[r1][c1];
    m.board[r1][c1] = tmp;
  }
}

function findMatches(b) {
  var matched = [];
  var mark = [];
  for (var r = 0; r < 6; r++) {
    mark.push([false, false, false, false, false, false]);
  }

  // 横向三连
  for (var r = 0; r < 6; r++) {
    for (var c = 0; c < 4; c++) {
      var val = b[r][c];
      if (val !== -1 && val === b[r][c + 1] && val === b[r][c + 2]) {
        mark[r][c] = true; mark[r][c + 1] = true; mark[r][c + 2] = true;
      }
    }
  }

  // 纵向三连
  for (var c = 0; c < 6; c++) {
    for (var r = 0; r < 4; r++) {
      var val = b[r][c];
      if (val !== -1 && val === b[r + 1][c] && val === b[r + 2][c]) {
        mark[r][c] = true; mark[r + 1][c] = true; mark[r + 2][c] = true;
      }
    }
  }

  for (var r = 0; r < 6; r++) {
    for (var c = 0; c < 6; c++) {
      if (mark[r][c]) matched.push({ r: r, c: c });
    }
  }
  return matched;
}

function processMatches(m, matched) {
  m.score += matched.length * 10;
  for (var i = 0; i < matched.length; i++) {
    m.board[matched[i].r][matched[i].c] = -1;
  }

  // 下落补齐
  for (var c = 0; c < 6; c++) {
    var emptyRow = 5;
    for (var r = 5; r >= 0; r--) {
      if (m.board[r][c] !== -1) {
        if (emptyRow !== r) {
          m.board[emptyRow][c] = m.board[r][c];
          m.board[r][c] = -1;
        }
        emptyRow--;
      }
    }
    // 补新宝石
    while (emptyRow >= 0) {
      m.board[emptyRow][c] = Math.floor(Math.random() * 5);
      emptyRow--;
    }
  }

  // 连击连消检查
  var nextMatch = findMatches(m.board);
  if (nextMatch.length > 0) {
    processMatches(m, nextMatch);
  }
}

export function renderMatch3(vm, h) {
  var m = vm.g_m3;
  if (!m) return h('div');

  var rows = [];
  for (var r = 0; r < m.rows; r++) {
    var cols = [];
    for (var c = 0; c < m.cols; c++) {
      var gemVal = m.board[r][c];
      var isSel = m.selected && m.selected.r === r && m.selected.c === c;
      var gem = GEMS[gemVal] || { emoji: '❓', bg: '#475569' };

      (function(row, col) {
        cols.push(h('div', {
          staticStyle: {
            width: '32px', height: '32px', backgroundColor: gem.bg,
            margin: '1.5px', borderRadius: '8px',
            borderWidth: isSel ? '2.5px' : '0px', borderColor: '#ffffff',
            justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleMatch3Click(vm, row, col); } }
        }, [
          h('text', { staticStyle: { fontSize: '18px' } }, gem.emoji)
        ]));
      })(r, c);
    }
    rows.push(h('div', { staticStyle: { flexDirection: 'row' } }, cols));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 6x6 矩阵
    h('div', {
      staticStyle: {
        width: '215px', height: '215px', backgroundColor: '#0f172a',
        padding: '2px', borderRadius: '10px', justifyContent: 'center', alignItems: 'center'
      }
    }, rows),
    // 右侧分数栏
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '趣味消消乐'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f59e0b', marginTop: '8px' } }, '当前得分: ' + m.score),
      h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8', marginTop: '6px' } }, '剩余步数: ' + m.moves),
      h('div', {
        staticStyle: {
          width: '90px', height: '30px', backgroundColor: '#3b82f6',
          borderRadius: '15px', justifyContent: 'center', alignItems: 'center',
          marginTop: '16px'
        },
        on: { click: function() { initMatch3(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#ffffff' } }, '重新开始')
      ])
    ])
  ]);
}
