// game_minesweeper.js —— 扫雷 (8x8, 10颗雷)
export function initMinesweeper(vm) {
  var rows = 8, cols = 8, minesCount = 10;
  var grid = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      row.push({
        mine: false,
        revealed: false,
        flagged: false,
        count: 0
      });
    }
    grid.push(row);
  }

  // 随机布雷
  var planted = 0;
  while (planted < minesCount) {
    var rr = Math.floor(Math.random() * rows);
    var cc = Math.floor(Math.random() * cols);
    if (!grid[rr][cc].mine) {
      grid[rr][cc].mine = true;
      planted++;
    }
  }

  // 计算周围雷数
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      if (grid[r][c].mine) continue;
      var cnt = 0;
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          var nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) {
            cnt++;
          }
        }
      }
      grid[r][c].count = cnt;
    }
  }

  vm.g_mine = {
    grid: grid,
    rows: rows,
    cols: cols,
    state: 'playing', // 'playing' | 'won' | 'lost'
    flagMode: false,
    remainMines: minesCount
  };
}

export function handleMineClick(vm, r, c) {
  var m = vm.g_mine;
  if (!m || m.state !== 'playing') return;
  var cell = m.grid[r][c];

  if (m.flagMode) {
    if (!cell.revealed) {
      cell.flagged = !cell.flagged;
      m.remainMines += (cell.flagged ? -1 : 1);
    }
    return;
  }

  if (cell.flagged || cell.revealed) return;

  if (cell.mine) {
    // 踩雷
    cell.revealed = true;
    m.state = 'lost';
    revealAll(m);
    return;
  }

  // 泛洪展开
  reveal(m, r, c);

  // 判定胜利
  if (checkMineWin(m)) {
    m.state = 'won';
  }
}

function reveal(m, r, c) {
  if (r < 0 || r >= m.rows || c < 0 || c >= m.cols) return;
  var cell = m.grid[r][c];
  if (cell.revealed || cell.flagged || cell.mine) return;

  cell.revealed = true;
  if (cell.count === 0) {
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) reveal(m, r + dr, c + dc);
      }
    }
  }
}

function revealAll(m) {
  for (var r = 0; r < m.rows; r++) {
    for (var c = 0; c < m.cols; c++) {
      if (m.grid[r][c].mine) m.grid[r][c].revealed = true;
    }
  }
}

function checkMineWin(m) {
  for (var r = 0; r < m.rows; r++) {
    for (var c = 0; c < m.cols; c++) {
      var cell = m.grid[r][c];
      if (!cell.mine && !cell.revealed) return false;
    }
  }
  return true;
}

export function renderMinesweeper(vm, h) {
  var m = vm.g_mine;
  if (!m) return h('div');

  var statusText = '剩余雷数: ' + m.remainMines;
  if (m.state === 'won') statusText = '恭喜扫雷成功！🏆';
  else if (m.state === 'lost') statusText = '踩雷了，再试一次！💥';

  var numColors = ['#94a3b8', '#38bdf8', '#4ade80', '#f87171', '#818cf8', '#fb923c', '#2dd4bf', '#f43f5e', '#a855f7'];

  var rows = [];
  for (var r = 0; r < m.rows; r++) {
    var cols = [];
    for (var c = 0; c < m.cols; c++) {
      var cell = m.grid[r][c];
      var bg = cell.revealed ? (cell.mine ? '#ef4444' : '#1e293b') : '#334155';
      var text = '';
      var textColor = '#ffffff';

      if (cell.revealed) {
        if (cell.mine) text = '💣';
        else if (cell.count > 0) {
          text = '' + cell.count;
          textColor = numColors[cell.count] || '#ffffff';
        }
      } else if (cell.flagged) {
        text = '🚩';
        textColor = '#facc15';
      }

      (function(row, col) {
        cols.push(h('div', {
          staticStyle: {
            width: '24px', height: '24px', backgroundColor: bg,
            margin: '1px', borderRadius: '3px',
            justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleMineClick(vm, row, col); } }
        }, [
          h('text', { staticStyle: { fontSize: '13px', fontWeight: 'bold', color: textColor } }, text)
        ]));
      })(r, c);
    }
    rows.push(h('div', { staticStyle: { flexDirection: 'row' } }, cols));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 棋盘
    h('div', {
      staticStyle: {
        width: '210px', height: '210px', backgroundColor: '#0f172a',
        padding: '2px', borderRadius: '6px', justifyContent: 'center', alignItems: 'center'
      }
    }, rows),
    // 侧边操作栏
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '经典扫雷 (8×8)'),
      h('text', { staticStyle: { fontSize: '12px', color: '#94a3b8', marginTop: '6px' } }, statusText),
      // 模式切换
      h('div', {
        staticStyle: {
          width: '110px', height: '32px',
          backgroundColor: m.flagMode ? '#f59e0b' : '#3b82f6',
          borderRadius: '16px', justifyContent: 'center', alignItems: 'center',
          marginTop: '12px'
        },
        on: { click: function() { m.flagMode = !m.flagMode; } }
      }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#ffffff', fontWeight: 'bold' } }, m.flagMode ? '🚩 标记模式' : '⛏️ 翻开模式')
      ]),
      // 重新开始
      h('div', {
        staticStyle: {
          width: '90px', height: '28px', backgroundColor: '#475569',
          borderRadius: '14px', justifyContent: 'center', alignItems: 'center',
          marginTop: '10px'
        },
        on: { click: function() { initMinesweeper(vm); } }
      }, [
        h('text', { staticStyle: { fontSize: '12px', color: '#f1f5f9' } }, '重置棋局')
      ])
    ])
  ]);
}
