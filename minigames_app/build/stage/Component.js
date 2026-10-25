// root.js —— 《小游戏全集》根组件 (Component.js)
import { renderHub, GAME_LIST } from './game_hub.js';

import { initMinesweeper, renderMinesweeper } from './game_minesweeper.js';
import { initFlappy, renderFlappy } from './game_flappy.js';
import { initWatermelon, renderWatermelon } from './game_watermelon.js';
import { initTicTacToe, renderTicTacToe } from './game_tictactoe.js';
import { initMatch3, renderMatch3 } from './game_match3.js';
import { initMiner, renderMiner } from './game_miner.js';
import { initRunner, renderRunner } from './game_runner.js';
import { initTetris, renderTetris } from './game_tetris.js';
import { initSnake, renderSnake } from './game_snake.js';
import { initJump, renderJump } from './game_jump.js';
import { initKlotski, renderKlotski } from './game_klotski.js';
import { initSokoban, renderSokoban } from './game_sokoban.js';
import { initGomoku, renderGomoku } from './game_gomoku.js';
import { initDino, renderDino } from './game_dino.js';
import { initMario, renderMario } from './game_mario.js';
import { initPelican, renderPelican } from './game_pelican.js';

export default {
  name: 'index',
  data: function() {
    return {
      curGame: 'hub', // 'hub' 或具体游戏 id
      hubPage: 0,
      scaleIndex: 0, // 0: 1.0x, 1: 1.1x, 2: 1.2x, 3: 0.9x
      // 游戏数据挂载
      g_mine: null,
      g_flappy: null,
      g_flappy_timer: null,
      g_wm: null,
      g_ttt: null,
      g_m3: null,
      g_miner: null,
      g_miner_timer: null,
      g_runner: null,
      g_runner_timer: null,
      g_tetris: null,
      g_tetris_timer: null,
      g_snake: null,
      g_snake_timer: null,
      g_jump: null,
      g_jump_timer: null,
      g_klotski: null,
      g_sokoban: null,
      g_gomoku: null,
      g_dino: null,
      g_dino_timer: null,
      g_mario: null,
      g_mario_timer: null,
      g_pelican: null,
      g_pelican_timer: null
    };
  },
  methods: {
    openGame: function(gameId) {
      this.clearAllTimers();
      this.curGame = gameId;

      if (gameId === 'minesweeper') initMinesweeper(this);
      else if (gameId === 'flappy') initFlappy(this);
      else if (gameId === 'watermelon') initWatermelon(this);
      else if (gameId === 'tictactoe') initTicTacToe(this);
      else if (gameId === 'match3') initMatch3(this);
      else if (gameId === 'miner') initMiner(this);
      else if (gameId === 'runner') initRunner(this);
      else if (gameId === 'tetris') initTetris(this);
      else if (gameId === 'snake') initSnake(this);
      else if (gameId === 'jump') initJump(this);
      else if (gameId === 'klotski') initKlotski(this);
      else if (gameId === 'sokoban') initSokoban(this);
      else if (gameId === 'gomoku') initGomoku(this);
      else if (gameId === 'dino') initDino(this);
      else if (gameId === 'mario') initMario(this);
      else if (gameId === 'pelican') initPelican(this);
    },
    backToHub: function() {
      this.clearAllTimers();
      this.curGame = 'hub';
    },
    toggleScale: function() {
      var scales = [1.0, 1.15, 1.25, 0.9];
      this.scaleIndex = (this.scaleIndex + 1) % scales.length;
    },
    clearAllTimers: function() {
      if (this.g_flappy_timer) { clearInterval(this.g_flappy_timer); this.g_flappy_timer = null; }
      if (this.g_miner_timer) { clearInterval(this.g_miner_timer); this.g_miner_timer = null; }
      if (this.g_runner_timer) { clearInterval(this.g_runner_timer); this.g_runner_timer = null; }
      if (this.g_tetris_timer) { clearInterval(this.g_tetris_timer); this.g_tetris_timer = null; }
      if (this.g_snake_timer) { clearInterval(this.g_snake_timer); this.g_snake_timer = null; }
      if (this.g_jump_timer) { clearInterval(this.g_jump_timer); this.g_jump_timer = null; }
      if (this.g_dino_timer) { clearInterval(this.g_dino_timer); this.g_dino_timer = null; }
      if (this.g_mario_timer) { clearInterval(this.g_mario_timer); this.g_mario_timer = null; }
      if (this.g_pelican_timer) { clearInterval(this.g_pelican_timer); this.g_pelican_timer = null; }
    },
    onUnload: function() {
      this.clearAllTimers();
    },
    onHide: function() {
      this.clearAllTimers();
    }
  },
  render: function(h) {
    var self = this;
    if (this.curGame === 'hub') {
      return h('div', {
        staticStyle: {
          width: '560px', height: '220px', backgroundColor: '#090d16',
          flexDirection: 'column'
        }
      }, [
        renderHub(this, h)
      ]);
    }

    // 渲染具体子游戏
    var gameNode = null;
    if (this.curGame === 'minesweeper') gameNode = renderMinesweeper(this, h);
    else if (this.curGame === 'flappy') gameNode = renderFlappy(this, h);
    else if (this.curGame === 'watermelon') gameNode = renderWatermelon(this, h);
    else if (this.curGame === 'tictactoe') gameNode = renderTicTacToe(this, h);
    else if (this.curGame === 'match3') gameNode = renderMatch3(this, h);
    else if (this.curGame === 'miner') gameNode = renderMiner(this, h);
    else if (this.curGame === 'runner') gameNode = renderRunner(this, h);
    else if (this.curGame === 'tetris') gameNode = renderTetris(this, h);
    else if (this.curGame === 'snake') gameNode = renderSnake(this, h);
    else if (this.curGame === 'jump') gameNode = renderJump(this, h);
    else if (this.curGame === 'klotski') gameNode = renderKlotski(this, h);
    else if (this.curGame === 'sokoban') gameNode = renderSokoban(this, h);
    else if (this.curGame === 'gomoku') gameNode = renderGomoku(this, h);
    else if (this.curGame === 'dino') gameNode = renderDino(this, h);
    else if (this.curGame === 'mario') gameNode = renderMario(this, h);
    else if (this.curGame === 'pelican') gameNode = renderPelican(this, h);
    else gameNode = h('div');

    var scaleValues = ['1.0x', '1.15x', '1.25x', '0.9x'];
    var currentScaleText = scaleValues[this.scaleIndex || 0];

    // 全局常驻顶部悬浮导航：返回大厅 ⬅️ 与 缩放切换 🔍
    var topBar = h('div', {
      staticStyle: {
        height: '24px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: '8px', backgroundColor: '#0b1324', borderBottomWidth: '1px', borderColor: '#1e293b'
      }
    }, [
      h('div', {
        staticStyle: {
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: '8px', height: '20px',
          backgroundColor: '#1e293b', borderRadius: '10px'
        },
        on: { click: function() { self.backToHub(); } }
      }, [
        h('text', { staticStyle: { fontSize: '11px', color: '#38bdf8' } }, '◀ 游戏大厅')
      ]),
      h('div', {
        staticStyle: {
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: '8px', height: '20px',
          backgroundColor: '#1e293b', borderRadius: '10px'
        },
        on: { click: function() { self.toggleScale(); } }
      }, [
        h('text', { staticStyle: { fontSize: '11px', color: '#94a3b8' } }, '🔍 尺寸: ' + currentScaleText)
      ])
    ]);

    return h('div', {
      staticStyle: {
        width: '560px', height: '220px', backgroundColor: '#090d16',
        flexDirection: 'column'
      }
    }, [
      topBar,
      h('div', { staticStyle: { flex: 1 } }, [gameNode])
    ]);
  }
};
