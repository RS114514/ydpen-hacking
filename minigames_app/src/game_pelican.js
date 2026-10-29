// game_pelican.js —— 鹈鹕骑自行车 (Pelican on a Bicycle)
export function initPelican(vm) {
  if (vm.g_pelican_timer) {
    clearInterval(vm.g_pelican_timer);
    vm.g_pelican_timer = null;
  }

  var best = vm.g_pelican ? (vm.g_pelican.bestScore || 0) : 0;

  vm.g_pelican = {
    posX: 60,
    speed: 0,
    tiltAngle: 0, // 俯仰平衡角度 -30 ~ +30
    distance: 0,
    fishCaught: 0,
    bestScore: best,
    frame: 0,
    fishes: [
      { x: 300, y: 120, taken: false },
      { x: 520, y: 105, taken: false },
      { x: 740, y: 115, taken: false }
    ],
    state: 'playing' // 'playing' | 'crashed'
  };

  startPelicanLoop(vm);
}

export function handlePelicanAction(vm, act) {
  var p = vm.g_pelican;
  if (!p) return;
  if (p.state !== 'playing') {
    initPelican(vm);
    return;
  }

  if (act === 'pedal') {
    p.speed += 2.0;
    if (p.speed > 9) p.speed = 9;
  } else if (act === 'lean_back') {
    p.tiltAngle -= 5;
  } else if (act === 'lean_forward') {
    p.tiltAngle += 5;
  }
  if (vm.$forceUpdate) vm.$forceUpdate();
}

function startPelicanLoop(vm) {
  if (vm.g_pelican_timer) clearInterval(vm.g_pelican_timer);
  vm.g_pelican_timer = setInterval(function() {
    var p = vm.g_pelican;
    if (!p || p.state !== 'playing') {
      if (vm.g_pelican_timer) clearInterval(vm.g_pelican_timer);
      return;
    }

    p.frame++;
    p.distance += Math.floor(p.speed);
    if (p.distance > p.bestScore) p.bestScore = p.distance;
    p.speed *= 0.94; // 摩擦阻力

    // 骑速较快时自然微晃
    if (p.speed > 2) {
      p.tiltAngle += (Math.random() * 1.6 - 0.8);
    }

    // 翻车判定
    if (p.tiltAngle > 28 || p.tiltAngle < -28) {
      p.state = 'crashed';
      clearInterval(vm.g_pelican_timer);
      vm.g_pelican_timer = null;
      if (vm.$forceUpdate) vm.$forceUpdate();
      return;
    }

    // 小鱼向左移动与捕捉
    for (var i = 0; i < p.fishes.length; i++) {
      var f = p.fishes[i];
      f.x -= p.speed;
      if (!f.taken && f.x < 90 && f.x > 45) {
        f.taken = true;
        p.fishCaught++;
      }
      if (f.x < -30) {
        f.x = 540 + Math.floor(Math.random() * 220);
        f.taken = false;
        f.y = 100 + Math.floor(Math.random() * 30);
      }
    }

    if (vm.$forceUpdate) vm.$forceUpdate();
  }, 45);
}

export function renderPelican(vm, h) {
  var p = vm.g_pelican;
  if (!p) return h('div');

  var elements = [];

  // 海平面公路 (柏油路面)
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '0px', top: '154px', width: '530px', height: '34px',
      backgroundColor: '#334155', borderTopWidth: '3px', borderColor: '#e2e8f0'
    }
  }));

  // 公路分道黄虚线
  var offset = (p.frame * p.speed * 2) % 60;
  for (var k = 0; k < 10; k++) {
    var kx = (k * 60 - offset + 600) % 530;
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: kx + 'px', top: '168px', width: '24px', height: '3px',
        backgroundColor: '#facc15'
      }
    }));
  }

  // 待捕小鱼
  for (var i = 0; i < p.fishes.length; i++) {
    var f = p.fishes[i];
    if (!f.taken) {
      elements.push(h('div', {
        staticStyle: {
          position: 'absolute', left: Math.floor(f.x) + 'px', top: f.y + 'px',
          width: '20px', height: '14px', backgroundColor: '#38bdf8', borderRadius: '7px',
          borderWidth: '1.5px', borderColor: '#ffffff', justifyContent: 'center', alignItems: 'center'
        }
      }, [
        h('text', { staticStyle: { fontSize: '8px', color: '#090d16', fontWeight: 'bold' } }, '鱼')
      ]));
    }
  }

  // 鹈鹕主角与单车
  var tiltDeg = Math.floor(p.tiltAngle);
  elements.push(h('div', {
    staticStyle: {
      position: 'absolute', left: '60px', top: '118px', width: '48px', height: '44px'
    }
  }, [
    // 鹈鹕大头与大黄嘴
    h('div', {
      staticStyle: {
        width: '18px', height: '18px', backgroundColor: '#f8fafc', borderRadius: '9px',
        borderWidth: '1.5px', borderColor: '#cbd5e1', position: 'absolute', left: '14px', top: '0px'
      }
    }, [
      // 眼睛
      h('div', {
        staticStyle: {
          width: '4px', height: '4px', borderRadius: '2px', backgroundColor: '#090d16',
          position: 'absolute', right: '3px', top: '3px'
        }
      })
    ]),
    // 巨大橙黄鱼嘴
    h('div', {
      staticStyle: {
        width: '18px', height: '10px', backgroundColor: '#f97316', borderRadius: '4px',
        position: 'absolute', left: '26px', top: '6px'
      }
    }),
    // 鹈鹕翅膀与身子
    h('div', {
      staticStyle: {
        width: '22px', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '6px',
        position: 'absolute', left: '6px', top: '14px'
      }
    }),
    // 自行车前轮
    h('div', {
      staticStyle: {
        width: '14px', height: '14px', borderRadius: '7px', backgroundColor: '#1e293b',
        borderWidth: '2px', borderColor: '#64748b', position: 'absolute', left: '28px', top: '28px'
      }
    }),
    // 自行车后轮
    h('div', {
      staticStyle: {
        width: '14px', height: '14px', borderRadius: '7px', backgroundColor: '#1e293b',
        borderWidth: '2px', borderColor: '#64748b', position: 'absolute', left: '2px', top: '28px'
      }
    }),
    // 车架横梁
    h('div', {
      staticStyle: {
        width: '20px', height: '2px', backgroundColor: '#ef4444',
        position: 'absolute', left: '12px', top: '34px'
      }
    })
  ]));

  if (p.state === 'crashed') {
    elements.push(h('div', {
      staticStyle: {
        position: 'absolute', left: '0px', top: '0px', width: '530px', height: '188px',
        backgroundColor: 'rgba(9, 13, 22, 0.75)', justifyContent: 'center', alignItems: 'center'
      }
    }, [
      h('text', { staticStyle: { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } }, '× 失去平衡 翻车啦 ×'),
      h('text', { staticStyle: { fontSize: '13px', color: '#f8fafc', marginTop: '6px' } },
        '骑行距离: ' + p.distance + ' m | 吃到小鱼: ' + p.fishCaught + ' 条'
      ),
      h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', marginTop: '6px' } }, '轻触屏幕或右侧重置')
    ]));
  }

  return h('div', {
    staticStyle: {
      width: '800px', height: '196px', flexDirection: 'row', alignItems: 'center', padding: '4px 16px'
    }
  }, [
    // 宽幅海滨公路 (530x188)
    h('div', {
      staticStyle: {
        width: '530px', height: '188px', backgroundColor: '#0ea5e9',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        borderWidth: '2px', borderColor: '#0284c7', marginRight: '20px'
      }
    }, elements),

    // 右侧仪表与大踏板按键
    h('div', {
      staticStyle: {
        flex: 1, height: '188px', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'
      }
    }, [
      h('div', { staticStyle: { flexDirection: 'column', alignItems: 'center' } }, [
        h('text', { staticStyle: { fontSize: '15px', color: '#f8fafc', fontWeight: 'bold' } }, '鹈鹕骑单车'),
        h('text', { staticStyle: { fontSize: '12px', color: '#facc15', marginTop: '3px' } },
          '里程: ' + p.distance + ' m | 捕鱼: ' + p.fishCaught
        ),
        h('text', { staticStyle: { fontSize: '11px', color: '#cbd5e1', marginTop: '2px' } }, '车身倾角: ' + tiltDeg + '°')
      ]),

      // 控速与蹬踏按钮组
      h('div', { staticStyle: { flexDirection: 'row', alignItems: 'center' } }, [
        h('div', {
          staticStyle: {
            width: '54px', height: '52px', backgroundColor: '#1e293b', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginRight: '8px'
          },
          on: { click: function() { handlePelicanAction(vm, 'lean_back'); } }
        }, [h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' } }, '压车')]),
        h('div', {
          staticStyle: {
            width: '86px', height: '52px', backgroundColor: '#10b981', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#4ade80', justifyContent: 'center', alignItems: 'center', marginRight: '8px'
          },
          on: { click: function() { handlePelicanAction(vm, 'pedal'); } }
        }, [h('text', { staticStyle: { fontSize: '15px', color: '#ffffff', fontWeight: 'bold' } }, '蹬踏 ▶')]),
        h('div', {
          staticStyle: {
            width: '54px', height: '52px', backgroundColor: '#1e293b', borderRadius: '12px',
            borderWidth: '1.5px', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center'
          },
          on: { click: function() { handlePelicanAction(vm, 'lean_forward'); } }
        }, [h('text', { staticStyle: { fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' } }, '前倾')])
      ]),

      h('div', {
        staticStyle: {
          width: '120px', height: '26px', backgroundColor: '#334155', borderRadius: '13px',
          justifyContent: 'center', alignItems: 'center'
        },
        on: { click: function() { initPelican(vm); if (vm.$forceUpdate) vm.$forceUpdate(); } }
      }, [
        h('text', { staticStyle: { fontSize: '11px', color: '#ffffff' } }, '重置骑行')
      ])
    ])
  ]);
}
