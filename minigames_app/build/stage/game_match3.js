// game_match3.js —— 趣味消消乐 (6x6 网格宝石三消)
export var GEMS = [
  { name: '红宝', asset: 'assets/gem_ruby.png' },
  { name: '蓝钻', asset: 'assets/gem_sapphire.png' },
  { name: '绿翡', asset: 'assets/gem_emerald.png' },
  { name: '黄玉', asset: 'assets/gem_topaz.png' },
  { name: '紫晶', asset: 'assets/gem_amethyst.png' }
];

export function initMatch3(vm) {
  var grid = [];
  for (var r = 0; r < 6; r++) {
    var row = [];
    for (var c = 0; c < 6; c++) {
      row.push(Math.floor(Math.random() * GEMS.length));
    }
    grid.push(row);
  }

  vm.g_m3 = {
    grid: grid,
    selected: null, // { r, c }
    score: 0,
    combos: 0
  };

  // 消除初始可能连在一起的三消
  eliminateMatches(vm.g_m3);
}

export function handleMatch3Click(vm, r, c) {
  var m = vm.g_m3;
  if (!m) return;

  if (!m.selected) {
    m.selected = { r: r, c: c };
    if (vm.$forceUpdate) vm.$forceUpdate();
    return;
  }

  var sel = m.selected;
  // 点击自身取消选择
  if (sel.r === r && sel.c === c) {
    m.selected = null;
    if (vm.$forceUpdate) vm.$forceUpdate();
    return;
  }

  // 判定是否相邻
  var dist = Math.abs(sel.r - r) + Math.abs(sel.c - c);
  if (dist === 1) {
    // 互换
    var tmp = m.grid[sel.r][sel.c];
    m.grid[sel.r][sel.c] = m.grid[r][c];
    m.grid[r][c] = tmp;

    // 检查是否有消除
    var matchCount = eliminateMatches(m);
    if (matchCount > 0) {
      m.score += matchCount * 30;
      m.combos++;
    } else {
      // 无法消除则换回
      var t2 = m.grid[sel.r][sel.c];
      m.grid[sel.r][sel.c] = m.grid[r][c];
      m.grid[r][c] = t2;
    }
    m.selected = null;
  } else {
    // 点击不相邻处直接改选
    m.selected = { r: r, c: c };
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function eliminateMatches(m) {
  var marked = [];
  for (var r = 0; r < 6; r++) {
    var row = [];
    for (var c = 0; c < 6; c++) row.push(false);
    marked.push(row);
  }

  var found = false;

  // 横向三连检测
  for (var r = 0; r < 6; r++) {
    for (var c = 0; c < 4; c++) {
      var val = m.grid[r][c];
      if (val !== -1 && val === m.grid[r][c + 1] && val === m.grid[r][c + 2]) {
        marked[r][c] = true; marked[r][c + 1] = true; marked[r][c + 2] = true;
        found = true;
      }
    }
  }

  // 纵向三连检测
  for (var c = 0; c < 6; c++) {
    for (var r = 0; r < 4; r++) {
      var val = m.grid[r][c];
      if (val !== -1 && val === m.grid[r + 1][c] && val === m.grid[r + 2][c]) {
        marked[r][c] = true; marked[r + 1][c] = true; marked[r + 2][c] = true;
        found = true;
      }
    }
  }

  if (!found) return 0;

  var count = 0;
  for (var r = 0; r < 6; r++) {
    for (var c = 0; c < 6; c++) {
      if (marked[r][c]) {
        m.grid[r][c] = Math.floor(Math.random() * GEMS.length);
        count++;
      }
    }
  }
  return count;
}

export function renderMatch3(vm, h) {
  var m = vm.g_m3;
  if (!m) return h('div');

  var rows = [];
  for (var r = 0; r < 6; r++) {
    var cols = [];
    for (var c = 0; c < 6; c++) {
      var gemVal = m.grid[r][c];
      var gem = GEMS[gemVal] || { asset: 'assets/gem_ruby.png' };
      var isSel = (m.selected && m.selected.r === r && m.selected.c === c);

      (function(row, col, item, selected) {
        cols.push(h('div', {
          staticStyle: {
            width: '27px', height: '27px', margin: '1px',
            backgroundColor: selected ? 'rgba(250, 204, 21, 0.3)' : 'transparent',
            borderRadius: '6px',
            borderWidth: selected ? '2px' : '0px',
            borderColor: '#facc15',
            justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handleMatch3Click(vm, row, col); } }
        }, [
          h('image', {
            staticStyle: { width: '25px', height: '25px' },
            attrs: { src: item.asset }
          })
        ]));
      })(r, c, gem, isSel);
    }
    rows.push(h('div', { staticStyle: { flexDirection: 'row' } }, cols));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 20px'
    }
  }, [
    // 6x6 宝石棋盘 (178x178)
    h('div', {
      staticStyle: {
        width: '180px', height: '180px', backgroundColor: '#090d16',
        borderRadius: '8px', padding: '2px', borderWidth: '2px', borderColor: '#334155',
        justifyContent: 'center', alignItems: 'center', marginRight: '30px'
      }
    }, rows),

    // 侧边得分与规则栏
    h('div', { staticStyle: { flex: 1, flexDirection: 'column', justifyContent: 'center' } }, [
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#ec4899', marginRight: '8px' }
        }),
        h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '趣味消消乐')
      ]),
      h('text', { staticStyle: { fontSize: '13px', color: '#94a3b8', marginTop: '6px' } }, '当前得分:'),
      h('text', { staticStyle: { fontSize: '24px', color: '#ec4899', fontWeight: 'bold' } }, '' + m.score),
      h('text', { staticStyle: { fontSize: '11px', color: '#38bdf8', marginTop: '4px' } },
        m.selected ? '已选中宝石，请点击相邻宝石互换！' : '点击宝石选中，再点击相邻格三连消除'
      ),

      h('div', {
        staticStyle: {
          width: '140px', height: '36px', backgroundColor: '#334155', borderRadius: '18px',
          justifyContent: 'center', alignItems: 'center', marginTop: '14px'
        },
        on: { click: function() { initMatch3(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc' } }, '重置棋局')
      ])
    ])
  ]);
}
