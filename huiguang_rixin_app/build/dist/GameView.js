// pages/game/game.js —— 《晖光日新》正统文字冒险游戏主引擎 (动态载入全四卷数据)

import { playSound, playBgm } from './Common.js';
import { saveSlotRecord, loadSlotRecord } from './Storage.js';
import { STORY_DATA } from './StoryData.js';

var IMG = 'assets/images/';

// 左栏场景卡（208×140）：12 张历史卡片按“画面实际内容”分配，不按文件名。
//  白色新楼 card_white_building     ｜ 赭黄老校舍 card_corridor_playground
//  大礼堂   card_grand_auditorium   ｜ 新逸夫楼公示卡 card_new_yifu_hall
//  白马湖   card_lakeside_campus    ｜ 校园鸟瞰 card_baimahu_aerial
//  彩色航拍 card_fengzikai_comic    ｜ 黑白旧影 card_panorama_1920s
//  彩色全景 card_panorama_2025      ｜ 题字拓片 card_inscription_huiguang
//  《送别》 card_songbie_sheet      ｜ 纪念经亨颐 card_youziyin_sheet
var BG_IMAGE_MAP = {
  // ── 第一卷 · 金秋篇 ch01–ch10 ──
  "yangshan_new_morning": IMG + "card_white_building.png",        // 仰山新楼白墙与连廊
  "yifu_hall_3f": IMG + "card_new_yifu_hall.png",                 // 新逸夫楼（工程公示）
  "canteen_quadrant4": IMG + "card_white_building.png",           // 学苑食堂现代楼群
  "bowenguan_dusty": IMG + "card_inscription_huiguang.png",       // 博文馆旧藏与题字
  "yifu_hall_dusk": IMG + "card_white_building.png",              // 报告厅3F落地窗
  "yangshan_attic_bell": IMG + "card_panorama_1920s.png",         // 仰山楼老铜钟
  "grand_auditorium_1934": IMG + "card_grand_auditorium.png",     // 1934 雷雨首演
  "yizilou_autumn_cat": IMG + "card_corridor_playground.png",     // 一字楼夹层
  "auditorium_stage_lights": IMG + "card_grand_auditorium.png",   // 舞台灯位
  "auditorium_curtain_up": IMG + "card_grand_auditorium.png",     // 12.2 大幕

  // ── 第二卷 · 凛冬篇 ch11–ch20（vol2 占位键）──
  "vol2_ch11_01": IMG + "card_white_building.png",                // 象山初雪白楼
  "vol2_ch12_01": IMG + "card_corridor_playground.png",           // 平屋小后轩
  "vol2_ch13_01": IMG + "card_inscription_huiguang.png",          // 晚晴山房残墨
  "vol2_ch14_01": IMG + "card_panorama_1920s.png",                // 泰岳寺风雪路
  "vol2_ch15_01": IMG + "card_panorama_1920s.png",                // 上海租界旧影
  "vol2_ch16_01": IMG + "card_baimahu_aerial.png",                // 台风过境全景
  "vol2_ch17_01": IMG + "card_inscription_huiguang.png",          // 断碑拓片
  "vol2_ch18_01": IMG + "card_white_building.png",                // 暗房洗印
  "vol2_ch19_01": IMG + "card_white_building.png",                // 学考夜自习
  "vol2_ch20_01": IMG + "card_songbie_sheet.png",                 // 冬至《送别》

  // ── 旧大纲遗留键（保留，避免回退到同图）──
  "yangshan_snow_morning": IMG + "card_white_building.png",
  "pingwu_snow_dusk": IMG + "card_corridor_playground.png",
  "wanqing_studio_snow": IMG + "card_inscription_huiguang.png",
  "taiping_temple_snow": IMG + "card_panorama_1920s.png",

  // ── 第三卷 · 鸣春篇 ch21–ch28 ──
  "baimahu_spring_morning": IMG + "card_lakeside_campus.png",     // 春水初生
  "quyuan_courtyard_spring": IMG + "card_corridor_playground.png", // 曲院老院
  "xiaoyangliu_studio_1924": IMG + "card_youziyin_sheet.png",     // 1929 寒之友雅集
  "art_museum_hall": IMG + "card_inscription_huiguang.png",       // 美术馆印谱展柜
  "old_teacher_home": IMG + "card_corridor_playground.png",       // 陈老师家老屋
  "jinghengyi_tomb_spring": IMG + "card_panorama_1920s.png",      // 清明墓园旧影

  // ── 第四卷 · 盛夏篇 ch29–ch36 ──
  "rowing_dock_dawn": IMG + "card_baimahu_aerial.png",            // 赛艇码头破晓
  "physics_lab_bridge": IMG + "card_white_building.png",          // 轻木桥实验室
  "yifu_hall_night_glow": IMG + "card_new_yifu_hall.png",         // 双实验主楼通宵
  "opening_ceremony_1922": IMG + "card_panorama_1920s.png",       // 1922 开校
  "auditorium_grand_show": IMG + "card_grand_auditorium.png",     // 百廿首映
  "baimahu_summer_night": IMG + "card_fengzikai_comic.png",       // 夏夜湖湾
  "yifu_rooftop_sunset": IMG + "card_panorama_2025.png"           // 象山成人礼全景
};

// 同一 bg 键、不同章节语境时按章号微调（避免“一间机房演四季”）
var CHAPTER_BG_MAP = {
  "ch26": IMG + "card_white_building.png",     // 新逸夫楼3F读笔记本
  "ch33": IMG + "card_inscription_huiguang.png" // 片名题字定稿
};

// 分卷兜底：新增章节若忘登记 bg，也落在本卷语义最接近的一张，而非全部回退
var VOLUME_DEFAULT_BG = {
  "vol1_autumn": IMG + "card_white_building.png",
  "vol2_winter": IMG + "card_corridor_playground.png",
  "vol3_spring": IMG + "card_lakeside_campus.png",
  "vol4_summer": IMG + "card_baimahu_aerial.png"
};

// 卷键 -> HUD 显示名（此前直接把 vol1_autumn 打在顶栏上）
var VOLUME_NAME = {
  "vol1_autumn": "第一卷·金秋",
  "vol2_winter": "第二卷·凛冬",
  "vol3_spring": "第三卷·鸣春",
  "vol4_summer": "第四卷·盛夏"
};

function volumeName(key) {
  return VOLUME_NAME[key] || "春晖";
}

function resolveBgImage(chap, volumeKey) {
  if (chap && chap.id && CHAPTER_BG_MAP[chap.id]) return CHAPTER_BG_MAP[chap.id];
  if (chap && chap.bg && BG_IMAGE_MAP[chap.bg]) return BG_IMAGE_MAP[chap.bg];
  if (volumeKey && VOLUME_DEFAULT_BG[volumeKey]) return VOLUME_DEFAULT_BG[volumeKey];
  return IMG + "card_corridor_playground.png";
}

export var gameMethods = {
  initGame: function () {
    console.log('[Game] Game Initialized with STORY_DATA');
    this.ensureExpState();
    this.ensureQuizState();
    var chap = this.getCurrentChapter();
    if (chap && (this.currentLineIndex || 0) === 0 && this.introShownFor !== chap.id) {
      this.chapterIntro = true;
    }
    this.refreshCurrentLine();
  },
  ensureQuizState: function () {
    if (this.quizActive === undefined) this.quizActive = false;
    if (this.quizChoice === undefined) this.quizChoice = -1;
    if (this.quizAnswered === undefined) this.quizAnswered = false;
    if (this.quizDone === undefined) this.quizDone = false;
    if (this.postscriptActive === undefined) this.postscriptActive = false;
    if (this.postscriptIndex === undefined) this.postscriptIndex = 0;
    if (this.postscriptDone === undefined) this.postscriptDone = false;
  },
  onQuizOption: function (index) {
    this.ensureQuizState();
    var chap = this.getCurrentChapter();
    var quiz = chap && chap.quiz;
    if (!quiz || !quiz.options || !quiz.options[index]) return;
    this.quizChoice = index;
    this.quizAnswered = true;
    if (quiz.options[index].correct) {
      this.playerStats.truth = (this.playerStats.truth || 0) + 2;
      playSound('se_bell_single');
    } else {
      playSound('se_page');
    }
  },
  getCurrentChapter: function () {
    var vol = STORY_DATA.volumes[this.currentVolume || 'vol1_autumn'];
    if (!vol || !vol.chapters) return null;
    for (var i = 0; i < vol.chapters.length; i++) {
      if (vol.chapters[i].id === this.currentChapterId) {
        return vol.chapters[i];
      }
    }
    return vol.chapters[0];
  },
  ensureExpState: function () {
    if (this.expMode === undefined) this.expMode = 'story';
    if (this.investigationIndex === undefined) this.investigationIndex = 0;
    if (this.investigationLineIndex === undefined) this.investigationLineIndex = 0;
    if (this.codexIndex === undefined) this.codexIndex = 0;
    if (this.partnerIndex === undefined) this.partnerIndex = 0;
    if (this.documentIndex === undefined) this.documentIndex = 0;
    if (this.documentLineIndex === undefined) this.documentLineIndex = 0;
    if (this.currentDoc === undefined) this.currentDoc = null;
    if (this.choiceActive === undefined) this.choiceActive = false;
    if (this.choiceAnswered === undefined) this.choiceAnswered = false;
    if (this.choiceReply === undefined) this.choiceReply = '';
    if (this.currentChoice === undefined) this.currentChoice = null;
    if (this.choiceCodaActive === undefined) this.choiceCodaActive = false;
    if (this.choiceCodaIndex === undefined) this.choiceCodaIndex = 0;
    if (this.choiceCodaPlayed === undefined) this.choiceCodaPlayed = false;
    if (this.choiceCodaQueue === undefined) this.choiceCodaQueue = [];
    if (this.choiceCodaIncluded === undefined) this.choiceCodaIncluded = false;
    if (this.chapterIntro === undefined) this.chapterIntro = false;
    if (this.introShownFor === undefined) this.introShownFor = '';
  },
  exitExpMode: function () {
    this.expMode = 'story';
    this.actionMessage = null;
    this.refreshCurrentLine();
  },
  showCodex: function () {
    this.ensureExpState();
    if (this.choiceActive || this.choiceAnswered) return;
    var chap = this.getCurrentChapter();
    var codex = (chap && chap.codex) || [];
    if (!codex.length) { this.actionMessage = '此处暂无风物图鉴。'; return; }
    this.expMode = 'codex';
    var cx = codex[this.codexIndex % codex.length];
    this.currentSpeaker = '风物图鉴·' + cx.title;
    this.currentText = cx.lines.map(function (l) { return l.text; }).join('');
    this.codexIndex = (this.codexIndex + 1) % codex.length;
    this.actionMessage = null;
    playSound('se_page');
  },
  showDocument: function () {
    this.ensureExpState();
    if (this.quizActive || this.choiceActive || this.choiceAnswered) return;
    var chap = this.getCurrentChapter();
    var docs = (chap && chap.documents) || [];
    if (!docs.length) {
      this.actionMessage = '此处暂无档案原文。行囊中持有：【生铁钟锤残片】、【1924未刊读本残页】。';
      return;
    }
    if (this.expMode !== 'document' || !this.currentDoc) {
      this.expMode = 'document';
      this.documentLineIndex = 0;
      this.currentDoc = docs[this.documentIndex % docs.length];
    }
    var doc = this.currentDoc;
    var line = doc.lines[this.documentLineIndex] || doc.lines[0];
    this.currentSpeaker = '档案·' + doc.title;
    this.currentText = line.text;
    this.documentLineIndex = this.documentLineIndex + 1;
    if (this.documentLineIndex >= doc.lines.length) {
      this.documentLineIndex = 0;
      this.documentIndex = (this.documentIndex + 1) % docs.length;
      this.currentDoc = null;
    }
    this.actionMessage = null;
    playSound('se_page');
  },
  showInvestigation: function () {
    this.ensureExpState();
    if (this.choiceActive || this.choiceAnswered) return;
    var chap = this.getCurrentChapter();
    var invs = (chap && chap.investigations) || [];
    if (!invs.length) { this.actionMessage = '此处没有可调查的细节。'; return; }
    if (this.expMode !== 'investigation') {
      this.expMode = 'investigation';
      this.investigationIndex = 0;
      this.investigationLineIndex = 0;
    }
    var inv = invs[this.investigationIndex % invs.length];
    var line = inv.lines[this.investigationLineIndex] || inv.lines[0];
    this.currentSpeaker = line.speaker || ('调查·' + inv.name);
    this.currentText = line.text;
    this.actionMessage = null;
    this.investigationLineIndex++;
    if (this.investigationLineIndex >= inv.lines.length) {
      this.investigationLineIndex = 0;
      this.investigationIndex = (this.investigationIndex + 1) % invs.length;
    }
    playSound('se_page');
  },
  showPartner: function () {
    this.ensureExpState();
    if (this.choiceActive || this.choiceAnswered) return;
    var chap = this.getCurrentChapter();
    var notes = (chap && chap.partnerNotes) || [];
    if (!notes.length) { this.actionMessage = '池雨曦没有补充。'; return; }
    this.expMode = 'partner';
    var n = notes[this.partnerIndex % notes.length];
    this.currentSpeaker = '池雨曦';
    this.currentText = n.text;
    this.partnerIndex = (this.partnerIndex + 1) % notes.length;
    this.actionMessage = null;
    playSound('se_page');
  },
  showPostscriptLine: function (chap) {
    var ps = (chap && chap.postscript) || [];
    var line = ps[this.postscriptIndex] || {};
    this.currentSpeaker = line.speaker || '';
    this.currentText = line.text || '';
    this.currentLocation = chap.location || '春晖校园';
    this.currentBg = resolveBgImage(chap, this.currentVolume);
    playSound('se_page');
  },
  getFlow: function () {
    var chap = this.getCurrentChapter();
    if (!chap) return [];
    var flow;
    if (chap.flow && chap.flow.length) {
      flow = chap.flow.slice();
    } else if (chap.lines && chap.lines.length) {
      flow = chap.lines.map(function (l) { return { type: 'line', speaker: l.speaker, text: l.text }; });
    } else {
      flow = [];
    }
    if (this.ngPlus && chap.ngPlusChoice) {
      flow.push(chap.ngPlusChoice);
    }
    if (this.ngPlus && chap.ngPlusLines && chap.ngPlusLines.length) {
      for (var i = 0; i < chap.ngPlusLines.length; i++) {
        flow.push({ type: 'line', speaker: chap.ngPlusLines[i].speaker, text: chap.ngPlusLines[i].text });
      }
    }
    return flow;
  },
  refreshCurrentLine: function () {
    var chap = this.getCurrentChapter();
    var flow = this.getFlow();
    if (!chap || !flow.length) return;
    var idx = this.currentLineIndex || 0;
    if (idx >= flow.length) idx = flow.length - 1;
    var item = flow[idx] || {};
    this.currentLocation = chap.location || '春晖校园';
    this.currentBg = resolveBgImage(chap, this.currentVolume);
    if (item.type === 'choice') {
      this.choiceActive = true;
      this.choiceAnswered = false;
      this.choiceReply = '';
      this.currentChoice = item;
      this.currentSpeaker = '选择';
      this.currentText = item.prompt || '请选择';
    } else {
      this.choiceActive = false;
      this.currentChoice = null;
      this.currentSpeaker = item.speaker || (chap.title || '春晖');
      this.currentText = item.text || '';
    }
  },
  onNextLine: function () {
    if (this.quizActive) {
      if (!this.quizAnswered) return;
      this.quizActive = false;
      this.quizDone = true;
      var qchap = this.getCurrentChapter();
      if (qchap && qchap.postscript && qchap.postscript.length && !this.postscriptDone) {
        this.postscriptActive = true;
        this.postscriptIndex = 0;
        this.showPostscriptLine(qchap);
        return;
      }
      this.advanceNextChapter();
      this.refreshCurrentLine();
      return;
    }
    if (this.postscriptActive) {
      var pchap = this.getCurrentChapter();
      var ps = (pchap && pchap.postscript) || [];
      if (this.postscriptIndex + 1 < ps.length) {
        this.postscriptIndex = this.postscriptIndex + 1;
        this.showPostscriptLine(pchap);
        return;
      }
      this.postscriptActive = false;
      this.postscriptDone = true;
      this.advanceNextChapter();
      this.refreshCurrentLine();
      return;
    }
    if (this.expMode && this.expMode !== 'story') { this.exitExpMode(); return; }
    if (this.chapterIntro) {
      this.chapterIntro = false;
      var ichap = this.getCurrentChapter();
      this.introShownFor = ichap ? ichap.id : '';
      this.refreshCurrentLine();
      return;
    }
    var chap = this.getCurrentChapter();
    var flow = this.getFlow();
    if (!chap || !flow.length) return;
    if (this.choiceAnswered) {
      this.choiceAnswered = false;
      this.choiceReply = '';
      if (this.choiceCodaQueue && this.choiceCodaQueue.length && !this.choiceCodaPlayed) {
        this.choiceCodaActive = true;
        this.choiceCodaIndex = 0;
        this.showChoiceCodaLine();
        return;
      }
      this.currentLineIndex = (this.currentLineIndex || 0) + 1;
      this.refreshCurrentLine();
      return;
    }
    if (this.choiceCodaActive) {
      if (this.choiceCodaIndex + 1 < this.choiceCodaQueue.length) {
        this.choiceCodaIndex = this.choiceCodaIndex + 1;
        this.showChoiceCodaLine();
        return;
      }
      this.choiceCodaActive = false;
      if (this.choiceCodaIncluded) this.choiceCodaPlayed = true;
      this.choiceCodaIncluded = false;
      this.currentLineIndex = (this.currentLineIndex || 0) + 1;
      this.refreshCurrentLine();
      return;
    }
    if (this.choiceActive) return;
    if ((this.currentLineIndex || 0) + 1 < flow.length) {
      this.currentLineIndex = (this.currentLineIndex || 0) + 1;
      playSound('se_page');
    } else if (chap.quiz && !this.quizDone) {
      this.quizActive = true;
      this.quizChoice = -1;
      this.quizAnswered = false;
      playSound('se_bell_single');
      return;
    } else {
      this.advanceNextChapter();
    }
    this.refreshCurrentLine();
    saveSlotRecord('AUTO', {
      volume: this.currentVolume,
      chapter: this.currentChapterId,
      line: this.currentLineIndex,
      location: this.currentLocation,
      stats: this.playerStats
    });
  },
  onChoiceOption: function (index) {
    var item = this.currentChoice;
    if (!item || !item.options || !item.options[index]) return;
    var opt = item.options[index];
    var eff = opt.effects || opt.effect || {};
    if (eff.truth) this.playerStats.truth = (this.playerStats.truth || 0) + eff.truth;
    if (eff.beauty) this.playerStats.beauty = (this.playerStats.beauty || 0) + eff.beauty;
    if (eff.body) this.playerStats.body = (this.playerStats.body || 0) + eff.body;
    var bond = eff.bond || eff.bond_yuxi || 0;
    if (bond) this.playerStats.bond_yuxi = (this.playerStats.bond_yuxi || 0) + bond;
    if (eff.energy) this.playerStats.energy = Math.max(0, (this.playerStats.energy || 100) + eff.energy);
    this.choiceActive = false;
    this.choiceAnswered = true;
    this.choiceReply = opt.reply || '';
    this.currentSpeaker = '选择结果';
    this.currentText = this.choiceReply;
    var codaChap = this.getCurrentChapter();
    var q = [];
    if (opt.followUp) q.push({ speaker: '', text: opt.followUp });
    if (codaChap && codaChap.choiceCoda && codaChap.choiceCoda.length && !this.choiceCodaPlayed) {
      q = q.concat(codaChap.choiceCoda);
      this.choiceCodaIncluded = true;
    } else {
      this.choiceCodaIncluded = false;
    }
    this.choiceCodaQueue = q;
    this.choiceCodaIndex = 0;
    playSound('se_page');
  },
  showChoiceCodaLine: function () {
    var line = this.choiceCodaQueue[this.choiceCodaIndex] || {};
    this.currentSpeaker = line.speaker || '';
    this.currentText = line.text || '';
    this.actionMessage = null;
    playSound('se_page');
  },
  advanceNextChapter: function () {
    var order = ['vol1_autumn', 'vol2_winter', 'vol3_spring', 'vol4_summer'];
    var volKey = this.currentVolume || 'vol1_autumn';
    var vol = STORY_DATA.volumes[volKey];
    if (!vol) return;
    var nextVolKey = '', nextChapterId = '';
    for (var i = 0; i < vol.chapters.length; i++) {
      if (vol.chapters[i].id === this.currentChapterId) {
        if (i + 1 < vol.chapters.length) {
          nextVolKey = volKey;
          nextChapterId = vol.chapters[i + 1].id;
        }
        break;
      }
    }
    if (!nextChapterId) {
      // 卷末：自动接到下一卷首章（第四卷末则停在终章，可回标题看二周目）
      var vi = order.indexOf(volKey);
      if (vi >= 0 && vi + 1 < order.length) {
        var nv = STORY_DATA.volumes[order[vi + 1]];
        if (nv && nv.chapters && nv.chapters.length) {
          nextVolKey = order[vi + 1];
          nextChapterId = nv.chapters[0].id;
        }
      }
    }
    if (!nextChapterId) return;
    this.currentVolume = nextVolKey;
    this.currentChapterId = nextChapterId;
    this.currentLineIndex = 0;
    this.quizActive = false;
    this.quizChoice = -1;
    this.quizAnswered = false;
    this.quizDone = false;
    this.choiceActive = false;
    this.choiceAnswered = false;
    this.choiceReply = '';
    this.currentChoice = null;
    this.choiceCodaActive = false;
    this.choiceCodaIndex = 0;
    this.choiceCodaPlayed = false;
    this.choiceCodaQueue = [];
    this.choiceCodaIncluded = false;
    this.postscriptActive = false;
    this.postscriptIndex = 0;
    this.postscriptDone = false;
    this.chapterIntro = true;
    var nchap = this.getCurrentChapter();
    this.currentLocation = (nchap && nchap.location) || '春晖校园';
    this.currentBg = resolveBgImage(nchap, this.currentVolume);
    playSound('se_bell_single');
  },
  onActionLook: function () {
    this.showCodex();
  },
  onActionInvestigate: function () {
    this.showInvestigation();
  },
  onActionTalk: function () {
    this.showPartner();
  },
  onActionInventory: function () {
    this.showDocument();
  },
  onOpenMap: function () {
    this.actionMessage = '地点网络：[仰山新楼] -> [新逸夫楼报告厅3F] -> [学苑食堂] -> [博文馆] -> [平屋] -> [大礼堂]';
  },
  onBackToTitle: function () {
    this.view = 'title';
  }
};

function renderQuizCenter(h, ctx, chap) {
  var quiz = chap.quiz;
  var quizLines = [h('text', { class: 'dialogue-text' }, quiz.question)];
  for (var i = 0; i < quiz.options.length; i++) {
    if (ctx.quizAnswered && ctx.quizChoice !== i) continue;
    quizLines.push(h('text', {
      class: 'dialogue-text',
      on: { click: function (idx) { return function () { ctx.onQuizOption(idx); }; }(i) }
    }, (i + 1) + '. ' + quiz.options[i].text));
  }
  if (ctx.quizAnswered) {
    var picked = quiz.options[ctx.quizChoice] || {};
    quizLines.push(h('text', { class: 'dialogue-text' }, (picked.correct ? '✓ 答对了。' : '✗ 再想想。') + quiz.explanation));
  }
  return h('div', { class: 'col-center' }, [
    h('div', { class: 'speaker-badge' }, [h('text', { class: 'speaker-text' }, '章末小测')]),
    h('div', { class: 'dialogue-box' }, quizLines),
    h('div', { class: 'dialogue-footer' }, [h('text', { class: 'dialogue-tip' }, ctx.quizAnswered ? '▶ 轻触“继续推进”进入下一章' : '▶ 选择一个答案')])
  ]);
}

function renderChapterIntro(h, ctx, chap) {
  var num = 0;
  var m = /^ch(\d+)$/.exec(chap.id || '');
  if (m) num = parseInt(m[1], 10);
  var meta = (chap.date || '') + ' · ' + (chap.timeSlot || '') + ' · ' + (chap.location || '春晖校园');
  return h('div', { class: 'col-center', on: { click: ctx.onNextLine } }, [
    h('div', { class: 'speaker-badge' }, [h('text', { class: 'speaker-text' }, '第 ' + num + ' 章')]),
    h('div', { class: 'dialogue-box' }, [
      h('text', { class: 'dialogue-text' }, chap.title || ''),
      h('text', { class: 'dialogue-text' }, meta)
    ]),
    h('div', { class: 'dialogue-footer' }, [h('text', { class: 'dialogue-tip' }, '▶ 轻触开幕')])
  ]);
}

function renderChoiceCenter(h, ctx, item) {
  var choiceLines = [h('text', { class: 'dialogue-text' }, item.prompt || '请选择')];
  for (var i = 0; i < item.options.length; i++) {
    choiceLines.push(h('text', {
      class: 'dialogue-text',
      on: { click: function (idx) { return function () { ctx.onChoiceOption(idx); }; }(i) }
    }, (i + 1) + '. ' + item.options[i].text));
  }
  return h('div', { class: 'col-center' }, [
    h('div', { class: 'speaker-badge' }, [h('text', { class: 'speaker-text' }, '选择')]),
    h('div', { class: 'dialogue-box' }, choiceLines),
    h('div', { class: 'dialogue-footer' }, [h('text', { class: 'dialogue-tip' }, '▶ 点选一个分支')])
  ]);
}

export function renderGame(h, ctx) {
  var speaker = ctx.currentSpeaker || '我';
  var text = ctx.actionMessage ? ('【行动反馈】 ' + ctx.actionMessage) : (ctx.currentText || '');
  var bgImg = ctx.currentBg || 'assets/images/card_corridor_playground.png';

  return h('div', { class: 'game-container' }, [
    // 顶部状态栏
    h('div', { class: 'game-header' }, [
      h('text', { class: 'hud-loc' }, '【' + volumeName(ctx.currentVolume) + '】 ' + (ctx.currentLocation || '春晖校园')),
      h('text', { class: 'hud-stats' }, '精力: ' + ctx.playerStats.energy + '  求真: ' + ctx.playerStats.truth + '  尚美: ' + ctx.playerStats.beauty + '  默契: ' + ctx.playerStats.bond_yuxi),
      h('div', { class: 'hud-btns' }, [
        h('text', { class: 'hud-btn', on: { click: ctx.onBackToTitle } }, '[主菜单]')
      ])
    ]),
    // 三栏主体
    h('div', { class: 'game-body' }, [
      // 左栏：真实历史场景与地标信息
      h('div', { class: 'col-left' }, [
        h('image', { class: 'scene-card-img', src: bgImg }),
        h('div', { class: 'scene-info' }, [
          h('text', { class: 'scene-name' }, ctx.currentLocation || '仰山新楼 2F'),
          h('text', { class: 'scene-exits' }, '动线：报告厅3F | 第四象限 | 平屋')
        ])
      ]),
      // 中栏：正统文字叙事大版面
      (function () {
        var chap = ctx.getCurrentChapter ? ctx.getCurrentChapter() : null;
        if (ctx.chapterIntro && chap) return renderChapterIntro(h, ctx, chap);
        if (ctx.quizActive && chap && chap.quiz) return renderQuizCenter(h, ctx, chap);
        if (ctx.choiceActive && ctx.currentChoice) return renderChoiceCenter(h, ctx, ctx.currentChoice);
        return h('div', { class: 'col-center', on: { click: ctx.onNextLine } }, [
          h('div', { class: 'speaker-badge' }, [
            h('text', { class: 'speaker-text' }, speaker)
          ]),
          h('div', { class: 'dialogue-box' }, [
            h('text', { class: 'dialogue-text' }, text)
          ]),
          h('div', { class: 'dialogue-footer' }, [
            h('text', { class: 'dialogue-tip' }, '▶ 轻触中栏推进对白或阅读下一段')
          ])
        ]);
      })(),
      // 右栏：文字冒险指令操作区
      h('div', { class: 'col-right' }, [
        h('div', { class: 'act-btn act-next', on: { click: ctx.onNextLine } }, [
          h('text', { class: 'act-text-main' }, '▶ 继续推进')
        ]),
        h('div', { class: 'act-grid' }, [
          h('div', { class: 'grid-btn', on: { click: ctx.onActionLook } }, [
            h('text', { class: 'grid-text' }, '观察')
          ]),
          h('div', { class: 'grid-btn', on: { click: ctx.onActionInvestigate } }, [
            h('text', { class: 'grid-text' }, '调查')
          ]),
          h('div', { class: 'grid-btn', on: { click: ctx.onActionTalk } }, [
            h('text', { class: 'grid-text' }, '交谈')
          ]),
          h('div', { class: 'grid-btn', on: { click: ctx.onActionInventory } }, [
            h('text', { class: 'grid-text' }, '档案')
          ])
        ]),
        h('div', { class: 'act-btn act-map', on: { click: ctx.onOpenMap } }, [
          h('text', { class: 'act-text-sub' }, '◆ 校园地图/移动')
        ])
      ])
    ])
  ]);
}
