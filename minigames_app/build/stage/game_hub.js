// game_hub.js —— 游戏主菜单与大厅网格
export var GAME_LIST = [
  { id: 'minesweeper', title: '经典扫雷', sub: 'MINESWEEPER', tag: '雷', color: '#0ea5e9', bg: '#082f49' },
  { id: 'flappy', title: '像素飞鸟', sub: 'FLAPPY BIRD', tag: '鸟', color: '#f59e0b', bg: '#451a03' },
  { id: 'watermelon', title: '合成大西瓜', sub: 'WATERMELON', tag: '瓜', color: '#10b981', bg: '#064e3b' },
  { id: 'tictactoe', title: '经典井字棋', sub: 'TIC-TAC-TOE', tag: '井', color: '#3b82f6', bg: '#1e3a8a' },
  { id: 'match3', title: '趣味消消乐', sub: 'MATCH 3', tag: '消', color: '#ec4899', bg: '#500724' },
  { id: 'miner', title: '黄金矿工', sub: 'GOLD MINER', tag: '矿', color: '#d97706', bg: '#451a03' },
  { id: 'runner', title: '极速跑酷', sub: 'SPEED RUNNER', tag: '跑', color: '#6366f1', bg: '#1e1b4b' },
  { id: 'tetris', title: '俄罗斯方块', sub: 'TETRIS BRICK', tag: '块', color: '#06b6d4', bg: '#164e63' },
  { id: 'snake', title: '经典贪吃蛇', sub: 'RETRO SNAKE', tag: '蛇', color: '#22c55e', bg: '#14532d' },
  { id: 'jump', title: '跳一跳', sub: 'JUMP JUMP', tag: '跳', color: '#8b5cf6', bg: '#2e1065' },
  { id: 'klotski', title: '三国华容道', sub: 'KLOTSKI', tag: '道', color: '#ef4444', bg: '#450a0a' },
  { id: 'sokoban', title: '经典推箱子', sub: 'SOKOBAN', tag: '箱', color: '#b45309', bg: '#451a03' },
  { id: 'gomoku', title: '五子棋对弈', sub: 'GOMOKU AI', tag: '棋', color: '#64748b', bg: '#1e293b' },
  { id: 'dino', title: '谷歌小恐龙', sub: 'CHROME DINO', tag: '龙', color: '#14b8a6', bg: '#134e4a' },
  { id: 'mario', title: '马里奥冲关', sub: 'SUPER MARIO', tag: '马', color: '#e11d48', bg: '#4c0519' },
  { id: 'pelican', title: '鹈鹕骑单车', sub: 'PELICAN BIKE', tag: '车', color: '#f97316', bg: '#431407' }
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
          width: '184px', height: '80px',
          backgroundColor: '#131d31', margin: '4px', borderRadius: '10px',
          borderLeftWidth: '4px', borderColor: item.color,
          borderWidth: '1px', borderStyle: 'solid',
          padding: '6px 10px', flexDirection: 'row', alignItems: 'center'
        },
        on: {
          click: function() {
            vm.openGame(item.id);
          }
        }
      }, [
        // 游戏专属徽标 Badge (替代 Emoji，避免生字缺字)
        h('div', {
          staticStyle: {
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: item.bg, borderWidth: '1.5px', borderColor: item.color,
            justifyContent: 'center', alignItems: 'center', marginRight: '10px'
          }
        }, [
          h('text', { staticStyle: { fontSize: '16px', color: item.color, fontWeight: 'bold' } }, item.tag)
        ]),
        // 标题与副标题
        h('div', { staticStyle: { flex: 1, flexDirection: 'column' } }, [
          h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', fontWeight: 'bold' } }, item.title),
          h('text', { staticStyle: { fontSize: '9px', color: '#94a3b8', marginTop: '3px' } }, item.sub),
          h('div', {
            staticStyle: {
              width: '46px', height: '16px', backgroundColor: '#1e293b', borderRadius: '8px',
              justifyContent: 'center', alignItems: 'center', marginTop: '4px'
            }
          }, [
            h('text', { staticStyle: { fontSize: '9px', color: item.color } }, '开始 ▶')
          ])
        ])
      ]));
    })(g);
  }

  return h('div', { staticStyle: { width: '800px', height: '220px', padding: '6px 12px', flexDirection: 'column' } }, [
    // 顶部标题与翻页切换栏
    h('div', {
      staticStyle: {
        height: '34px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: '6px', borderBottomWidth: '1px', borderColor: '#1e293b', marginBottom: '4px'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: {
            width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#38bdf8', marginRight: '8px'
          }
        }),
        h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '小游戏大厅'),
        h('text', { staticStyle: { fontSize: '11px', color: '#38bdf8', marginLeft: '10px' } }, '全 16 款原生 GUI 游戏')
      ]),
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: {
            paddingHorizontal: '14px', height: '24px', backgroundColor: page === 0 ? '#2563eb' : '#1e293b',
            borderRadius: '12px', justifyContent: 'center', alignItems: 'center', marginRight: '8px',
            borderWidth: '1px', borderColor: page === 0 ? '#60a5fa' : '#334155'
          },
          on: {
            click: function() {
              vm.hubPage = 0;
              if (vm.$forceUpdate) vm.$forceUpdate();
            }
          }
        }, [
          h('text', { staticStyle: { fontSize: '11px', color: '#ffffff', fontWeight: page === 0 ? 'bold' : 'normal' } }, '第 1 页 (1-8)')
        ]),
        h('div', {
          staticStyle: {
            paddingHorizontal: '14px', height: '24px', backgroundColor: page === 1 ? '#2563eb' : '#1e293b',
            borderRadius: '12px', justifyContent: 'center', alignItems: 'center',
            borderWidth: '1px', borderColor: page === 1 ? '#60a5fa' : '#334155'
          },
          on: {
            click: function() {
              vm.hubPage = 1;
              if (vm.$forceUpdate) vm.$forceUpdate();
            }
          }
        }, [
          h('text', { staticStyle: { fontSize: '11px', color: '#ffffff', fontWeight: page === 1 ? 'bold' : 'normal' } }, '第 2 页 (9-16)')
        ])
      ])
    ]),

    // 2行 x 4列 宫格卡片展示区 (高度 172px, 宽度 776px)
    h('div', {
      staticStyle: {
        width: '776px', height: '172px',
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'flex-start'
      }
    }, cardEls)
  ]);
}
