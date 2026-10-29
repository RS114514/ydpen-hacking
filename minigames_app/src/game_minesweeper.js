// game_minesweeper.js —— 经典扫雷 (8x8, 10颗雷)
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
    if (vm.$forceUpdate) vm.$forceUpdate();
    return;
  }

  if (cell.flagged || cell.revealed) return;

  if (cell.mine) {
    cell.revealed = true;
    m.state = 'lost';
    revealAll(m);
    if (vm.$forceUpdate) vm.$forceUpdate();
    return;
  }

  // 泛洪展开
  reveal(m, r, c);

  if (checkMineWin(m)) {
    m.state = 'won';
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
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
  var statusColor = '#94a3b8';
  if (m.state === 'won') {
    statusText = '★ 扫雷成功！全部排查！';
    statusColor = '#4ade80';
  } else if (m.state === 'lost') {
    statusText = '× 触雷失败！请重试！';
    statusColor = '#f87171';
  }

  var numColors = ['#94a3b8', '#38bdf8', '#4ade80', '#f87171', '#818cf8', '#fb923c', '#2dd4bf', '#f43f5e', '#a855f7'];

  var rows = [];
  for (var r = 0; r < m.rows; r++) {
    var cols = [];
    for (var c = 0; c < m.cols; c++) {
      var cell = m.grid[r][c];
      var bg = cell.revealed ? (cell.mine ? '#dc2626' : '#1e293b') : '#334155';
      var border = cell.revealed ? '#0f172a' : '#475569';
      var text = '';
      var textColor = '#ffffff';

      if (cell.revealed) {
        if (cell.mine) {
          text = '雷';
          textColor = '#ffffff';
        } else if (cell.count > 0) {
          text = '' + cell.count;
          textColor = numColors[cell.count] || '#ffffff';
        }
      } else if (cell.flagged) {
        text = '旗';
        textColor = '#facc15';
        bg = '#854d0e';
        border = '#eab308';
      }

      (function(row, col) {
        cols.push(h('div', {
          staticStyle: {
            width: '21px', height: '21px', backgroundColor: bg,
            margin: '1px', borderRadius: '3px',
            borderWidth: '1px', borderColor: border,
            justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleMineClick(vm, row, col); } }
        }, [
          h('text', { staticStyle: { fontSize: '11px', fontWeight: 'bold', color: textColor } }, text)
        ]));
      })(r, c);
    }
    rows.push(h('div', { staticStyle: { flexDirection: 'row' } }, cols));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 20px'
    }
  }, [
    // 棋盘主体 (190x190)
    h('div', {
      staticStyle: {
        width: '188px', height: '188px', backgroundColor: '#090d16',
        padding: '2px', borderRadius: '8px', borderWidth: '2px', borderColor: '#334155',
        justifyContent: 'center', alignItems: 'center', marginRight: '30px'
      }
    }, rows),

    // 侧边宽屏操作区
    h('div', { staticStyle: { flex: 1, flexDirection: 'column', justifyContent: 'center' } }, [
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#0ea5e9', marginRight: '8px' }
        }),
        h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '经典扫雷 (8×8 网格)')
      ]),
      h('text', { staticStyle: { fontSize: '14px', color: statusColor, marginTop: '8px', fontWeight: 'bold' } }, statusText),

      // 大触控操作模式切换按钮
      h('div', {
        staticStyle: {
          width: '260px', height: '52px',
          backgroundColor: m.flagMode ? '#d97706' : '#2563eb',
          borderRadius: '12px', borderWidth: '1.5px',
          borderColor: m.flagMode ? '#f59e0b' : '#60a5fa',
          justifyContent: 'center', alignItems: 'center',
          marginTop: '14px'
        },
        on: { click: function() { m.flagMode = !m.flagMode; if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '16px', color: '#ffffff', fontWeight: 'bold' } },
          m.flagMode ? '当前模式: [ 标旗模式 ] (点击切翻开)' : '当前模式: [ 翻开模式 ] (点击切插旗)'
        )
      ]),

      // 重新开始按钮
      h('div', {
        staticStyle: {
          width: '160px', height: '36px', backgroundColor: '#334155',
          borderRadius: '18px', justifyContent: 'center', alignItems: 'center',
          marginTop: '12px'
        },
        on: { click: function() { initMinesweeper(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#f1f5f9' } }, '重置新棋局')
      ])
    ])
  ]);
}
