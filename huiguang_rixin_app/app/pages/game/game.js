// ── 自由行动事件：36 章 × 1，条件=本章线索数，消耗精力，写 flags 与属性 ──
var FREE_EVENTS = {
  ch01: [{ id: 'ev_ch01_a', label: '擦黑板槽', cost: 1, need: 0, result: '把槽里的梧桐絮拢成一撮，倒进花坛。', effects: {"truth": 1}, flags: [] }],
  ch02: [{ id: 'ev_ch02_a', label: '让出队首', cost: 1, need: 0, result: '你退到队尾，把位置让给抱着饭盒的。', effects: {"bond": 1}, flags: [] }],
  ch03: [{ id: 'ev_ch03_a', label: '帮阿婆扣盒', cost: 2, need: 0, result: '你把最后一摞盒盖扣紧，阿婆往你手里塞了两个。', effects: {"bond": 2}, flags: [] }],
  ch04: [{ id: 'ev_ch04_a', label: '撬铁柜底簧', cost: 3, need: 1, result: '簧片弹了一下，柜门只松开半寸——里面还有一层。', effects: {"truth": 3}, flags: [] }],
  ch05: [{ id: 'ev_ch05_a', label: '吊麦归位', cost: 1, need: 0, result: '吊麦歪着，你踮脚把它拨回中轴。', effects: {"beauty": 1}, flags: [] }],
  ch06: [{ id: 'ev_ch06_a', label: '补刻工尺谱', cost: 2, need: 0, result: '你没补。缺的那一格，比补上更像它本来的样子。', effects: {"truth": 2}, flags: [] }],
  ch07: [{ id: 'ev_ch07_a', label: '帮拉大幕', cost: 1, need: 0, result: '幕绳吃手。你拉到一半，手心红了。', effects: {"body": 1}, flags: [] }],
  ch08: [{ id: 'ev_ch08_a', label: '扫出一字楼', cost: 2, need: 0, result: '粉笔头滚进桌缝，一九三四年的字还在。', effects: {"truth": 2}, flags: ["chalk_1934"] }],
  ch09: [{ id: 'ev_ch09_a', label: '记下光位', cost: 1, need: 0, result: '你把六盏灯的位置抄在袖口。', effects: {"truth": 1}, flags: [] }],
  ch10: [{ id: 'ev_ch10_a', label: '留两个空座', cost: 1, need: 0, result: '末排两把椅子空着。有人问，你说是留给站着的。', effects: {"beauty": 2}, flags: [] }],
  ch11: [{ id: 'ev_ch11_a', label: '门房前堆雪人', cost: 2, need: 0, result: '雪太散。堆到一半，成了个雪墩。', effects: {"beauty": 2}, flags: [] }],
  ch12: [{ id: 'ev_ch12_a', label: '水仙换水', cost: 1, need: 0, result: '盘里的水浑了。你换过，球茎歪着但活着。', effects: {"beauty": 1}, flags: [] }],
  ch13: [{ id: 'ev_ch13_a', label: '抄半联', cost: 1, need: 0, result: '上联清楚，下联缺两字。你只抄上联。', effects: {"truth": 1}, flags: [] }],
  ch14: [{ id: 'ev_ch14_a', label: '收拾残卷', cost: 2, need: 0, result: '纸脆。你按页码排好，没敢翻第二遍。', effects: {"truth": 2}, flags: [] }],
  ch15: [{ id: 'ev_ch15_a', label: '寄一封信', cost: 1, need: 0, result: '邮票是借的。信封上地址写得很慢。', effects: {"bond": 1}, flags: [] }],
  ch16: [{ id: 'ev_ch16_a', label: '台风夜巡机房', cost: 3, need: 1, result: '你摸黑把排水口的落叶掏干净，机器没停。', effects: {"body": 2, "truth": 1}, flags: [] }],
  ch17: [{ id: 'ev_ch17_a', label: '拓断口', cost: 2, need: 0, result: '拓包太小。断口的锯齿拓了三遍才全。', effects: {"truth": 2}, flags: [] }],
  ch18: [{ id: 'ev_ch18_a', label: '多冲一张', cost: 1, need: 0, result: '相纸贵。你多冲的那张，拍的是空椅子。', effects: {"beauty": 1}, flags: [] }],
  ch19: [{ id: 'ev_ch19_a', label: '关最后三盏灯', cost: 1, need: 0, result: '走廊尽头还亮着。你走过去，一盏一盏关。', effects: {"beauty": 1}, flags: [] }],
  ch20: [{ id: 'ev_ch20_a', label: '分汤圆', cost: 1, need: 0, result: '碗不够。你用搪瓷缸装了六个。', effects: {"bond": 1}, flags: [] }],
  ch21: [{ id: 'ev_ch21_a', label: '捞纸船', cost: 1, need: 0, result: '纸船沉了一半。你把它折角翻开，晾在石上。', effects: {"truth": 1}, flags: [] }],
  ch22: [{ id: 'ev_ch22_a', label: '替曲院关窗', cost: 2, need: 0, result: '最后一扇窗卡住，你用手掌顶了三下才合上。', effects: {"beauty": 2}, flags: [] }],
  ch23: [{ id: 'ev_ch23_a', label: '临半页帖', cost: 2, need: 0, result: '笔不顺。你临到第三行就停了。', effects: {"beauty": 2}, flags: [] }],
  ch24: [{ id: 'ev_ch24_a', label: '纠正标签', cost: 1, need: 0, result: '年代错了。你写了张便签，没动原牌。', effects: {"truth": 1}, flags: [] }],
  ch25: [{ id: 'ev_ch25_a', label: '修藤椅', cost: 1, need: 0, result: '藤条断了三根。你用铜丝绞紧了两根。', effects: {"body": 1}, flags: [] }],
  ch26: [{ id: 'ev_ch26_a', label: '抚平折角', cost: 1, need: 0, result: '笔记页折成三角。你一页页压平。', effects: {"beauty": 1}, flags: [] }],
  ch27: [{ id: 'ev_ch27_a', label: '摆一支白菊', cost: 1, need: 0, result: '花是路上摘的。你摆正，退了半步。', effects: {"bond": 1}, flags: [] }],
  ch28: [{ id: 'ev_ch28_a', label: '撕掉重画', cost: 2, need: 0, result: '第三格不对。你撕了，画第二版。', effects: {"truth": 2}, flags: [] }],
  ch29: [{ id: 'ev_ch29_a', label: '下水试桨', cost: 3, need: 1, result: '水凉得刺骨。你只划了五十米，就明白陈伯说的看浪。', effects: {"body": 3}, flags: [] }],
  ch30: [{ id: 'ev_ch30_a', label: '再校一次', cost: 1, need: 0, result: '游标差半格。你校到第三遍才肯写数。', effects: {"body": 1}, flags: [] }],
  ch31: [{ id: 'ev_ch31_a', label: '给下一班留灯', cost: 1, need: 0, result: '你把台灯留在图纸摊开的地方。', effects: {"beauty": 1}, flags: [] }],
  ch32: [{ id: 'ev_ch32_a', label: '对齐刻痕', cost: 2, need: 0, result: '两个刻痕错位半指。你对齐了才拍。', effects: {"truth": 2}, flags: [] }],
  ch33: [{ id: 'ev_ch33_a', label: '删最得意的一段', cost: 3, need: 0, result: '剪掉的那段你存了一份，没给任何人看。', effects: {"truth": 3}, flags: ["kept_cut"] }],
  ch34: [{ id: 'ev_ch34_a', label: '递话筒', cost: 1, need: 0, result: '话筒线不够长。你半蹲着递过去。', effects: {"bond": 1}, flags: [] }],
  ch35: [{ id: 'ev_ch35_a', label: '数星星等风', cost: 1, need: 0, result: '你数到第四十颗，风来了。', effects: {"body": 1}, flags: [] }],
  ch36: [{ id: 'ev_ch36_a', label: '把名字写在石后', cost: 2, need: 0, result: '你没写正面。石头背面有一小块空白，够写三个字。', effects: {"bond": 2, "truth": 1}, flags: [] }],
};



// pages/game/game.js
// pages/game/game.js —— 《晖光日新》正统文字冒险游戏主引擎 (动态载入全四卷数据)
// pages/game/game.js 
import { readAllSaves, writeAllSaves } from './storage.js';

import { playSound, playBgm } from '../../common.js';
import { saveSlotRecord, loadSlotRecord } from '../../storage.js';
import { STORY_DATA } from '../../data/story_data.js';

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
  // 真实校史照片（Synology 共享空间【春晖建筑】159 张 + 2T 档案，均裁 220×196）
  "ch01": IMG + "real4_autumn_1.png",       // 仰山楼正面
  "ch02": IMG + "real2_yifu.png",           // 新逸夫楼
  "ch03": IMG + "real2_avenue.png",         // 春晖大道
  "ch04": IMG + "real2_library.png",        // 白马湖图书馆
  "ch05": IMG + "real2_yifu.png",           // 报告厅3F
  "ch06": IMG + "real_panorama_2018.png",   // 老校园全景
  "ch07": IMG + "real2_auditorium_in.png",     // 大礼堂
  "ch08": IMG + "real2_yizilou.png",        // 一字楼
  "ch09": IMG + "real2_auditorium_in.png",     // 舞台灯位
  "ch10": IMG + "real2_auditorium_in.png",     // 12.2 大幕
  "ch11": IMG + "real3_snow_1.png",       // 象山初雪
  "ch12": IMG + "real_pingwu_1.png",        // 平屋匾额
  "ch13": IMG + "real_pingwu_1.png",        // 晚晴山房
  "ch14": IMG + "real_panorama_2018.png",   // 泰岳寺风雪
  "ch15": IMG + "real_panorama_2018.png",   // 上海租界旧影
  "ch16": IMG + "real4_sport_1.png",           // 台风过境
  "ch17": IMG + "real_panorama_2018.png",   // 断碑
  "ch18": IMG + "real2_yangshan.png",       // 暗房
  "ch19": IMG + "real2_yangshan.png",       // 夜自习
  "ch20": IMG + "real3_snow_2.png",         // 冬至暖阳
  "ch21": IMG + "real4_spring_2.png",    // 春水初生
  "ch22": IMG + "real2_quyuan2.png",         // 曲院
  "ch23": IMG + "real_pingwu_1.png",        // 1929 雅集
  "ch24": IMG + "real_archive_1.png",       // 美术馆展柜
  "ch25": IMG + "real2_quyuan.png",         // 陈老师家
  "ch26": IMG + "real2_yifu.png",           // 新逸夫楼3F
  "ch27": IMG + "real_panorama_2018.png",   // 清明墓园
  "ch28": IMG + "real4_spring_1.png",         // 春潮分镜
  "ch29": IMG + "real4_summer_1.png",           // 赛艇码头
  "ch30": IMG + "real2_yifu.png",           // 轻木桁架实验室
  "ch31": IMG + "real3_snow_3.png",           // 双实验主楼
  "ch32": IMG + "real_panorama_2018.png",   // 1922 开校
  "ch33": IMG + "real2_library.png",        // 终剪
  "ch34": IMG + "real4_gala_1.png",     // 百廿首映
  "ch35": IMG + "real4_summer_2.png",           // 白马湖夏夜
  "ch36": IMG + "real4_stone_1.png"            // 校门成人礼
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
    if (this.actionOpen === undefined) this.actionOpen = false;
    if (this.actionPage === undefined) this.actionPage = 0;
    if (this.actionLog === undefined) this.actionLog = '';
    if (this.cluesFound === undefined) this.cluesFound = [];
    if (this.flags === undefined) this.flags = {};
    if (this.flags === undefined) this.flags = {};
  },
  

buildActions: function (chap) {
    var list = [];
    if (!chap) return list;
    var locs = String(chap.location || '').split(/[→>]/);
    for (var i = 0; i < locs.length; i++) {
      var nm = locs[i].replace(/\s+/g, '');
      if (nm) list.push({ kind: 'move', label: '前往·' + nm, cost: 1, place: nm });
    }
    var invs = chap.investigations || [];
    for (var j = 0; j < invs.length; j++) {
      list.push({ kind: 'investigate', label: '调查·' + invs[j].name.replace('支线委托·', ''), cost: 2, index: j });
    }
    if ((chap.partnerNotes || []).length) list.push({ kind: 'talk', label: '交谈·池雨曦', cost: 1 });
    if ((chap.codex || []).length) list.push({ kind: 'codex', label: '观察·风物图鉴（' + chap.codex.length + '）', cost: 1 });
    if ((chap.documents || []).length) list.push({ kind: 'document', label: '翻检·档案原件（' + chap.documents.length + '）', cost: 0 });
    var evs = FREE_EVENTS[chap.id] || [];
    for (var e = 0; e < evs.length; e++) {
      if (!(this.flags && this.flags['ev_' + evs[e].id]) && this.countChapterClues(chap) >= evs[e].need) {
        list.push({ kind: 'event', label: evs[e].label, cost: evs[e].cost, index: e });
      }
    }
    var done = this.countChapterClues(chap);
    if (done >= 3 && !(this.flags && this.flags['deduce_' + chap.id])) {
      list.push({ kind: 'deduce', label: '推演·把 ' + done + ' 条线索并起来', cost: 3 });
    }
    return list;
  },
  countChapterClues: function (chap) {
    var n = 0;
    if (!chap || !this.flags) return 0;
    var invs = chap.investigations || [];
    for (var i = 0; i < invs.length; i++) {
      if (this.flags['inv_' + chap.id + '_' + i]) n++;
    }
    return n;
  },
  chapterClueNames: function (chap) {
    var out = [];
    var invs = (chap && chap.investigations) || [];
    for (var i = 0; i < invs.length; i++) {
      if (this.flags && this.flags['inv_' + chap.id + '_' + i]) {
        out.push((invs[i].clue && invs[i].clue.name) || invs[i].name);
      }
    }
    return out;
  },
  onOpenActions: function () {
    this.ensureExpState();
    this.actionOpen = true;
    this.actionPage = 0;
    this.expMode = 'story';
    this.actionLog = '';
  },
  onCloseActions: function () {
    this.actionOpen = false;
    this.refreshCurrentLine();
  },
  onActionPage: function (delta) {
    var chap = this.getCurrentChapter();
    var total = this.buildActions(chap).length;
    var pages = Math.max(1, Math.ceil(total / 4));
    this.actionPage = ((this.actionPage || 0) + delta + pages) % pages;
  },
  showInvestigationAt: function (i) {
    var chap = this.getCurrentChapter();
    var invs = (chap && chap.investigations) || [];
    if (!invs[i]) return;
    this.expMode = 'investigation';
    this.investigationIndex = i;
    this.investigationLineIndex = 0;
    this.actionOpen = false;
    this.showInvestigation();
  },
  onRunAction: function (index) {
    var chap = this.getCurrentChapter();
    var list = this.buildActions(chap);
    var a = list[index];
    if (!a) return;
    var energy = this.playerStats.energy || 0;
    if (a.cost > energy) {
      this.actionLog = '精力不足（需 ' + a.cost + ' 点），先推进主线。';
      return;
    }
    this.playerStats.energy = energy - a.cost;
    this.actionLog = '';
    if (a.kind === 'move') {
      this.currentLocation = a.place;
      this.actionLog = '你沿动线走到' + a.place + '。';
      this.actionOpen = false;
      this.currentBg = resolveBgImage(chap, this.currentVolume);
    this.saveAuto();
    } else if (a.kind === 'investigate') {
      var inv = (chap.investigations || [])[a.index] || {};
      this.flags['inv_' + chap.id + '_' + a.index] = true;
      var cid = inv.clue && inv.clue.id;
      if (cid && this.cluesFound.indexOf(cid) < 0) {
        this.cluesFound.push(cid);
        this.playerStats.truth = (this.playerStats.truth || 0) + 1;
      }
      this.actionLog = '记下线索：' + ((inv.clue && inv.clue.name) || inv.name);
      this.showInvestigationAt(a.index);
    } else if (a.kind === 'event') {
      var ev2 = (FREE_EVENTS[chap.id] || [])[a.index];
      if (ev2) {
        this.flags['ev_' + ev2.id] = true;
        for (var ek in ev2.effects) {
          if (ek === 'bond') this.playerStats.bond_yuxi = (this.playerStats.bond_yuxi || 0) + ev2.effects[ek];
          else this.playerStats[ek] = (this.playerStats[ek] || 0) + ev2.effects[ek];
        }
        for (var fi = 0; fi < (ev2.flags || []).length; fi++) this.flags[ev2.flags[fi]] = true;
        this.actionLog = ev2.result;
        this.actionOpen = true;
      }
    } else if (a.kind === 'deduce') {
      var names = this.chapterClueNames(chap);
      this.flags['deduce_' + chap.id] = true;
      this.playerStats.truth = (this.playerStats.truth || 0) + 3;
      this.actionLog = '你把这 ' + names.length + ' 条并起来：' + names.join('、') + '——指向同一件事。';
      this.actionOpen = true;
    } else if (a.kind === 'talk') {
      this.actionOpen = false;
      this.showPartner();
    } else if (a.kind === 'codex') {
      this.actionOpen = false;
      this.showCodex();
    } else if (a.kind === 'document') {
      this.actionOpen = false;
      this.showDocument();
    }
    playSound('se_page');
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
    this.saveAuto();
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
    this.saveAuto();
    this.saveAuto();
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

function renderActionCenter(h, ctx, chap) {
  var list = ctx.buildActions(chap);
  var page = ctx.actionPage || 0;
  var PER = 3;
  var start = page * PER;
  var slice = list.slice(start, start + PER);
  var pages = Math.max(1, Math.ceil(list.length / PER));
  var rows = [];
  for (var i = 0; i < slice.length; i++) {
    var a = slice[i];
    rows.push(h('div', {
      style: { height: '40px', width: '420px', justifyContent: 'center', borderBottomWidth: '1px', borderBottomColor: '#2b2723' },
      on: { click: (function (idx) { return function () { ctx.onRunAction(idx); }; })(start + i) }
    }, [h('text', { class: 'case-hint' }, (start + i + 1) + '. ' + a.label + '（精力-' + a.cost + '）')]));
  }
  if (ctx.actionLog) rows.push(h('text', { class: 'clue-text' }, ctx.actionLog));
  rows.push(h('div', { style: { flexDirection: 'row', justifyContent: 'space-between', width: '360px', marginTop: '4px' } }, [
    h('text', { class: 'case-hint', on: { click: function () { ctx.onActionPage(-1); } } }, '◀ 上页'),
    h('text', { class: 'case-hint', on: { click: function () { ctx.onActionPage(1); } } }, '下页 ▶'),
    h('text', { class: 'case-hint', on: { click: ctx.onCloseActions } }, '返回')
  ]));
  return h('div', { class: 'col-center' }, [
    h('div', { class: 'speaker-badge' }, [h('text', { class: 'speaker-text' }, '行动 ' + (page + 1) + '/' + pages + ' · 精力 ' + ctx.playerStats.energy)]),
    h('div', { class: 'dialogue-box' }, rows)
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
        if (ctx.actionOpen && chap) return renderActionCenter(h, ctx, chap);
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
          h('div', { class: 'grid-btn', on: { click: ctx.onOpenActions } }, [
            h('text', { class: 'grid-text' }, '行动')
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
