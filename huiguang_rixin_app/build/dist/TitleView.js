// pages/title/title.js —— 《晖光日新》主标题界面

import { loadSlotRecord } from './Storage.js';

export var titleMethods = {
  initTitle: function () {
    console.log('[Title] Initialized');
    var rec = loadSlotRecord('AUTO');
    if (rec && rec.chapter) {
      this.hasAutoSave = true;
      this.autoSaveText = (rec.location || '春晖校园') + ' (' + (rec.saveTime || '').slice(5, 16) + ')';
    } else {
      this.hasAutoSave = false;
      this.autoSaveText = '';
    }
  },
  loadAutoSave: function () {
    var rec = loadSlotRecord('AUTO');
    if (rec && rec.chapter) {
      this.currentVolume = rec.volume || 'vol1_autumn';
      this.currentChapterId = rec.chapter || 'ch01';
      this.currentLineIndex = rec.line || 0;
      this.currentLocation = rec.location || '仰山新楼 2F 走廊';
      if (rec.stats) {
        this.playerStats = Object.assign({}, this.playerStats, rec.stats);
      }
      return true;
    }
    return false;
  },
  onStartNewGame: function () {
    console.log('[Title] Start New Game');
    this.ngPlus = false;
    this.currentVolume = 'vol1_autumn';
    this.currentChapterId = 'ch01';
    this.currentLineIndex = 0;
    this.view = 'game';
  },
  onStartNgPlus: function () {
    console.log('[Title] Start NG+');
    this.ngPlus = true;
    this.currentVolume = 'vol1_autumn';
    this.currentChapterId = 'ch01';
    this.currentLineIndex = 0;
    this.view = 'game';
  },
  onContinueGame: function () {
    console.log('[Title] Continue Game');
    if (this.loadAutoSave()) {
      this.view = 'game';
    } else {
      this.onStartNewGame();
    }
  },
  onOpenCaseboard: function () {
    console.log('[Title] Open Caseboard');
    this.view = 'caseboard';
  }
};

export function renderTitle(h, ctx) {
  var continueLabel = ctx.hasAutoSave ? ('▶ 继续：' + ctx.autoSaveText) : '▶ 继续上次进度';
  var ngPlusClass = ctx.ngPlus ? 'title-time tab-active' : 'title-time';

  return h('div', { class: 'title-container' }, [
    h('div', { class: 'title-header' }, [
      h('text', { class: 'title-brand' }, '1922 - 2026 浙江省春晖中学 · 百年文脉正统文字冒险'),
      h('text', { class: 'title-time' }, '高二年级 · 仰山新楼篇'),
      h('text', { class: ngPlusClass, on: { click: ctx.onStartNgPlus } }, ctx.ngPlus ? '● 二周目 (逆溯中)' : '○ 开启二周目')
    ]),
    h('div', { class: 'title-body' }, [
      h('div', { class: 'title-art-box' }, [
        h('image', { class: 'title-art-img', src: 'assets/images/card_inscription_huiguang.png' }),
        h('text', { class: 'title-motto' }, '刚健笃实 · 晖光日新')
      ]),
      h('div', { class: 'title-center-info' }, [
        h('text', { class: 'title-main-text' }, '晖 光 日 新'),
        h('text', { class: 'title-sub-text' }, ctx.ngPlus ? '【二周目】重巡白马湖的隐秘物证与岁月回响' : '白马湖畔的双时空历史回响与校园探案')
      ]),
      h('div', { class: 'title-actions' }, [
        h('div', { class: 'btn-action btn-continue', on: { click: ctx.onContinueGame } }, [
          h('text', { class: 'btn-action-text' }, continueLabel)
        ]),
        h('div', { class: 'btn-action btn-new', on: { click: ctx.onStartNewGame } }, [
          h('text', { class: 'btn-action-text' }, '◆ 开启崭新旅程')
        ]),
        h('div', { class: 'btn-action btn-cases', on: { click: ctx.onOpenCaseboard } }, [
          h('text', { class: 'btn-action-text' }, '■ 百廿文脉案卷白板')
        ])
      ])
    ])
  ]);
}
