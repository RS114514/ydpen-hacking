// game_hub.js —— 游戏主菜单与大厅网格
export var GAME_LIST = [
  { id: 'minesweeper', title: '经典扫雷', sub: 'MINES', icon: '💣', color: '#0284c7' },
  { id: 'flappy', title: '像素飞鸟', sub: 'FLAPPY', icon: '🐥', color: '#f59e0b' },
  { id: 'watermelon', title: '合成大西瓜', sub: 'MELON', icon: '🍉', color: '#16a34a' },
  { id: 'tictactoe', title: '井字棋', sub: 'TIC-TAC', icon: '⭕', color: '#3b82f6' },
  { id: 'match3', title: '趣味消消乐', sub: 'MATCH 3', icon: '🍓', color: '#ec4899' },
  { id: 'miner', title: '黄金矿工', sub: 'MINER', icon: '⛏️', color: '#d97706' },
  { id: 'runner', title: '极速跑酷', sub: 'RUNNER', icon: '🏃', color: '#6366f1' },
  { id: 'tetris', title: '俄罗斯方块', sub: 'TETRIS', icon: '🧱', color: '#06b6d4' },
  { id: 'snake', title: '经典贪吃蛇', sub: 'SNAKE', icon: '🐍', color: '#10b981' },
  { id: 'jump', title: '跳一跳', sub: 'JUMP', icon: '🦘', color: '#8b5cf6' },
  { id: 'klotski', title: '三国华容道', sub: 'KLOTSKI', icon: '👑', color: '#ef4444' },
  { id: 'sokoban', title: '经典推箱子', sub: 'SOKOBAN', icon: '📦', color: '#b45309' },
  { id: 'gomoku', title: '五子棋', sub: 'GOMOKU', icon: '⚫', color: '#475569' },
  { id: 'dino', title: '谷歌小恐龙', sub: 'DINO', icon: '🦖', color: '#64748b' },
  { id: 'mario', title: '马里奥冲关', sub: 'MARIO', icon: '🍄', color: '#dc2626' },
  { id: 'pelican', title: '鹈鹕骑单车', sub: 'PELICAN', icon: '🚴', color: '#0ea5e9' }
];

export function renderHub(vm, h) {
  var page = vm.hubPage || 0; // 每页展示 8 个卡片 (2行 x 4列)，两页展示全部 16 款
  var pageSize = 8;
  var start = page * pageSize;
  var currentSlice = GAME_LIST.slice(start, start + pageSize);

  var cardEls = [];
  for (var i = 0; i < currentSlice.length; i++) {
    var g = currentSlice[i];
    (function(item) {
      cardEls.push(h('div', {
        staticStyle: {
          width: '122px', height: '82px',
          backgroundColor: '#1e293b', margin: '4px', borderRadius: '10px',
          borderLeftWidth: '4px', borderColor: item.color,
          padding: '6px 8px', justifyContent: 'center'
        },
        on: {
          click: function() {
            vm.openGame(item.id);
          }
        }
      }, [
        h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
          h('text', { staticStyle: { fontSize: '20px', marginRight: '6px' } }, item.icon),
          h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', fontWeight: 'bold' } }, item.title)
        ]),
        h('text', { staticStyle: { fontSize: '10px', color: '#94a3b8', marginTop: '3px' } }, item.sub)
      ]));
    })(g);
  }

  return h('div', { staticStyle: { flex: 1, padding: '4px 8px' } }, [
    // 顶部标题与翻页切换栏
    h('div', { staticStyle: { height: '32px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: '8px' } }, [
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('text', { staticStyle: { fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' } }, '🎮 小游戏全集'),
        h('text', { staticStyle: { fontSize: '11px', color: '#38bdf8', marginLeft: '10px' } }, '共 16 款精选游戏 · 全独立GUI')
      ]),
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: {
            paddingHorizontal: '12px', height: '26px', backgroundColor: page === 0 ? '#3b82f6' : '#334155',
            borderRadius: '13px', justifyContent: 'center', alignItems: 'center', marginRight: '8px'
          },
          on: { click: function() { vm.hubPage = 0; } }
        }, [
          h('text', { staticStyle: { fontSize: '11px', color: '#ffffff' } }, '第 1 页 (1-8)')
        ]),
        h('div', {
          staticStyle: {
            paddingHorizontal: '12px', height: '26px', backgroundColor: page === 1 ? '#3b82f6' : '#334155',
            borderRadius: '13px', justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { vm.hubPage = 1; } }
        }, [
          h('text', { staticStyle: { fontSize: '11px', color: '#ffffff' } }, '第 2 页 (9-16)')
        ])
      ])
    ]),

    // 2行 x 4列 宫格卡片展示区 (高度 180px)
    h('div', {
      staticStyle: {
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
        marginTop: '2px'
      }
    }, cardEls)
  ]);
}
