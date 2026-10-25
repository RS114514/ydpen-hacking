// game_snake.js —— 贪吃蛇 (Snake, 16x11 网格)
export function initSnake(vm) {
  if (vm.g_snake_timer) {
    clearInterval(vm.g_snake_timer);
    vm.g_snake_timer = null;
  }

  vm.g_snake = {
    cols: 16,
    rows: 11,
    body: [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 }
    ],
    dir: 'right', // 'up' | 'down' | 'left' | 'right'
    nextDir: 'right',
    food: { x: 10, y: 5 },
    score: 0,
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

    // 撞墙判定
    if (newHead.x < 0 || newHead.x >= s.cols || newHead.y < 0 || newHead.y >= s.rows) {
      s.dead = true;
      if (vm.$forceUpdate) vm.$forceUpdate();
      return;
    }

    // 撞自身判定
    for (var i = 0; i < s.body.length; i++) {
      if (s.body[i].x === newHead.x && s.body[i].y === newHead.y) {
        s.dead = true;
        if (vm.$forceUpdate) vm.$forceUpdate();
        return;
      }
    }

    s.body.unshift(newHead);

    // 吃到食物
    if (newHead.x === s.food.x && newHead.y === s.food.y) {
      s.score += 10;
      spawnFood(s);
    } else {
      s.body.pop();
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 220);
}

export function renderSnake(vm, h) {
  var s = vm.g_snake;
  if (!s) return h('div');

  var cellSize = 18;
  var elements = [];

  // 渲染网格背景点位
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '0px', width: (s.cols * cellSize) + 'px', height: (s.rows * cellSize) + 'px',
      backgroundColor: '#0f172a'
    }
  }));

  // 渲染食物
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute',
      left: (s.food.x * cellSize + 2) + 'px', top: (s.food.y * cellSize + 2) + 'px',
      width: (cellSize - 4) + 'px', height: (cellSize - 4) + 'px',
      backgroundColor: '#ef4444', borderRadius: '7px',
      justifyContent: 'center', alignItems: 'center'
    }
  }, [
    h('text', { staticStyle: { fontSize: '11px' } }, '🍎')
  ]));

  // 渲染蛇身
  for (var i = 0; i < s.body.length; i++) {
    var seg = s.body[i];
    var isHead = (i === 0);
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute',
        left: (seg.x * cellSize + 1) + 'px', top: (seg.y * cellSize + 1) + 'px',
        width: (cellSize - 2) + 'px', height: (cellSize - 2) + 'px',
        backgroundColor: isHead ? '#22c55e' : '#15803d',
        borderRadius: isHead ? '6px' : '4px',
        borderWidth: isHead ? '1.5px' : '0px', borderColor: '#86efac'
      }
    }));
  }

  if (s.dead) {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px',
        width: (s.cols * cellSize) + 'px', height: (s.rows * cellSize) + 'px',
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '16px', color: '#ef4444', fontWeight: 'bold' } }, '游戏结束!'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } }, '最终得分: ' + s.score)
    ]));
  }

  return h('div', { staticStyle: { flex: 1, flexDirection: 'row', padding: '6px' } }, [
    // 蛇盘
    h('div', {
      staticStyle: {
        width: (s.cols * cellSize) + 'px', height: (s.rows * cellSize) + 'px',
        borderRadius: '6px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#334155'
      }
    }, elements),

    // 控制十字键与信息
    h('div', { staticStyle: { flex: 1, paddingLeft: '16px', justifyContent: 'center', alignItems: 'center' } }, [
      h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '经典贪吃蛇'),
      h('text', { staticStyle: { fontSize: '13px', color: '#22c55e', marginTop: '4px' } }, '得分: ' + s.score),

      // 经典十字按键
      h('div', { staticStyle: { marginTop: '8px', alignItems: 'center' } }, [
        h('div', {
          staticStyle: { width: '38px', height: '32px', backgroundColor: '#334155', borderRadius: '6px', justifyContent: 'center', alignItems: 'center', marginBottom: '3px' },
          on: { click: function() { handleSnakeDir(vm, 'up'); } }
        }, [h('text', { staticStyle: { fontSize: '14px', color: '#ffffff' } }, '▲')]),
        h('div', { staticStyle: { flexDirection: 'row' } }, [
          h('div', {
            staticStyle: { width: '38px', height: '32px', backgroundColor: '#334155', borderRadius: '6px', justifyContent: 'center', alignItems: 'center', marginRight: '24px' },
            on: { click: function() { handleSnakeDir(vm, 'left'); } }
          }, [h('text', { staticStyle: { fontSize: '14px', color: '#ffffff' } }, '◀')]),
          h('div', {
            staticStyle: { width: '38px', height: '32px', backgroundColor: '#334155', borderRadius: '6px', justifyContent: 'center', alignItems: 'center' },
            on: { click: function() { handleSnakeDir(vm, 'right'); } }
          }, [h('text', { staticStyle: { fontSize: '14px', color: '#ffffff' } }, '▶')])
        ]),
        h('div', {
          staticStyle: { width: '38px', height: '32px', backgroundColor: '#334155', borderRadius: '6px', justifyContent: 'center', alignItems: 'center', marginTop: '3px' },
          on: { click: function() { handleSnakeDir(vm, 'down'); } }
        }, [h('text', { staticStyle: { fontSize: '14px', color: '#ffffff' } }, '▼')])
      ]),

      h('div', {
        staticStyle: { width: '80px', height: '24px', backgroundColor: '#475569', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', marginTop: '8px' },
        on: { click: function() { initSnake(vm); } }
      }, [h('text', { staticStyle: { fontSize: '11px', color: '#ffffff' } }, '重新开始')])
    ])
  ]);
}
