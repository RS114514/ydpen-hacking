// game_snake.js —— 贪吃蛇 (Snake, 24列 x 12行)
export function initSnake(vm) {
  if (vm.g_snake_timer) {
    clearInterval(vm.g_snake_timer);
    vm.g_snake_timer = null;
  }

  var best = vm.g_snake ? (vm.g_snake.bestScore || 0) : 0;

  vm.g_snake = {
    cols: 24,
    rows: 12,
    body: [
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 }
    ],
    dir: 'right',
    nextDir: 'right',
    food: { x: 14, y: 6 },
    score: 0,
    bestScore: best,
    dead: false
  };

  spawnFood(vm.g_snake);
  startSnakeLoop(vm);
}

function spawnFood(s) {
  var x, y, collides;
  do {
    collides = false;
    x = Math.floor(Math.random() * s.cols);
    y = Math.floor(Math.random() * s.rows);
    for (var i = 0; i < s.body.length; i++) {
      if (s.body[i].x === x && s.body[i].y === y) {
        collides = true;
        break;
      }
    }
  } while (collides);
  s.food = { x: x, y: y };
}

export function handleSnakeDir(vm, newDir) {
  var s = vm.g_snake;
  if (!s || s.dead) return;

  var opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
  if (opposites[newDir] !== s.dir) {
    s.nextDir = newDir;
  }
}

function startSnakeLoop(vm) {
  if (vm.g_snake_timer) clearInterval(vm.g_snake_timer);
  vm.g_snake_timer = setInterval(function() {
    var s = vm.g_snake;
    if (!s || s.dead) {
      if (vm.g_snake_timer) clearInterval(vm.g_snake_timer);
      return;
    }

    s.dir = s.nextDir;
    var head = s.body[0];
    var dx = 0, dy = 0;
    if (s.dir === 'up') dy = -1;
    else if (s.dir === 'down') dy = 1;
    else if (s.dir === 'left') dx = -1;
    else if (s.dir === 'right') dx = 1;

    var newHead = { x: head.x + dx, y: head.y + dy };

    // 撞墙
    if (newHead.x < 0 || newHead.x >= s.cols || newHead.y < 0 || newHead.y >= s.rows) {
      s.dead = true;
      if (s.score > s.bestScore) s.bestScore = s.score;
      if (vm.$forceUpdate) vm.$forceUpdate();
      return;
    }

    // 撞自身
    for (var i = 0; i < s.body.length; i++) {
      if (s.body[i].x === newHead.x && s.body[i].y === newHead.y) {
        s.dead = true;
        if (s.score > s.bestScore) s.bestScore = s.score;
        if (vm.$forceUpdate) vm.$forceUpdate();
        return;
      }
    }

    s.body.unshift(newHead);

    // 吃到食物
    if (newHead.x === s.food.x && newHead.y === s.food.y) {
      s.score += 10;
      if (s.score > s.bestScore) s.bestScore = s.score;
      spawnFood(s);
    } else {
      s.body.pop();
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 160);
}

export function renderSnake(vm, h) {
  var s = vm.g_snake;
  if (!s) return h('div');

  var cellSize = 14;
  var elements = [];

  // 网格底图
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '0px', width: (s.cols * cellSize) + 'px', height: (s.rows * cellSize) + 'px',
      backgroundColor: '#090d16'
    }
  }));

  // 渲染食物 (16-bit 像素红苹果)
  elements.push(h('image', {
    staticStyle: {
      position: 'absolute',
      left: (s.food.x * cellSize) + 'px', top: (s.food.y * cellSize) + 'px',
      width: cellSize + 'px', height: cellSize + 'px'
    },
    attrs: { src: 'assets/snake_apple.png' }
  }));

  // 渲染蛇身 (像素蛇头与蛇身鳞节)
  for (var i = 0; i < s.body.length; i++) {
    var seg = s.body[i];
    var isHead = (i === 0);
    elements.push(h('image', {
      staticStyle: {
        position: 'absolute',
        left: (seg.x * cellSize) + 'px', top: (seg.y * cellSize) + 'px',
        width: cellSize + 'px', height: cellSize + 'px'
      },
      attrs: { src: isHead ? 'assets/snake_head.png' : 'assets/snake_body.png' }
    }));
  }

  // 结算蒙层
  if (s.dead) {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px',
        width: (s.cols * cellSize) + 'px', height: (s.rows * cellSize) + 'px',
        backgroundColor: 'rgba(9, 13, 22, 0.75)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } }, '× 撞击阵亡 ×'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '最终得分: ' + s.score)
    ]));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 1. 宽视野贪吃蛇舞台 (340x172)
    h('div', {
      staticStyle: {
        width: (s.cols * cellSize + 4) + 'px', height: (s.rows * cellSize + 4) + 'px',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#334155', marginRight: '24px'
      }
    }, elements),

    // 2. 信息与大尺寸方向盘
    h('div', { staticStyle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } }, [
      // 记分牌
      h('div', { staticStyle: { flexDirection: 'column', width: '120px' } }, [
        h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '经典贪吃蛇'),
        h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' } }, '当前得分:'),
        h('text', { staticStyle: { fontSize: '20px', color: '#22c55e', fontWeight: 'bold' } }, '' + s.score),
        h('text', { staticStyle: { fontSize: '10px', color: '#64748b', marginTop: '4px' } }, '历史最高: ' + s.bestScore),
        h('div', {
          staticStyle: {
            width: '90px', height: '30px', backgroundColor: '#334155', borderRadius: '15px',
            justifyContent: 'center', alignItems: 'center', marginTop: '10px'
          },
          on: { click: function() { initSnake(vm); } }
        }, [
          h('text', { staticStyle: { fontSize: '11px', color: '#ffffff' } }, s.dead ? '重玩' : '重新开始')
        ])
      ]),

      // 宽大十字方向盘
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center', marginRight: '16px' } }, [
        h('div', {
          staticStyle: {
            width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
            borderWidth: '1.5px', borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: '6px'
          },
          on: { click: function() { handleSnakeDir(vm, 'up'); } }
        }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▲')]),
        h('div', { staticStyle: { flexDirection: 'row' } }, [
          h('div', {
            staticStyle: {
              width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
              borderWidth: '1.5px', borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: '36px'
            },
            on: { click: function() { handleSnakeDir(vm, 'left'); } }
          }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '◀')]),
          h('div', {
            staticStyle: {
              width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
              borderWidth: '1.5px', borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center'
            },
            on: { click: function() { handleSnakeDir(vm, 'right'); } }
          }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▶')])
        ]),
        h('div', {
          staticStyle: {
            width: '64px', height: '46px', backgroundColor: '#1e293b', borderRadius: '10px',
            borderWidth: '1.5px', borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginTop: '6px'
          },
          on: { click: function() { handleSnakeDir(vm, 'down'); } }
        }, [h('text', { staticStyle: { fontSize: '20px', color: '#38bdf8' } }, '▼')])
      ])
    ])
  ]);
}
