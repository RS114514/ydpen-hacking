# -*- coding: utf-8 -*-
import json

vol1 = {
  "volume": "vol1_autumn",
  "title": "金秋篇《白马秋风：未刊手稿与大礼堂惊雷》",
  "time_span": "2026-09-01 至 2026-12-02（高二上学期开学至百廿校庆日）",
  "historical_span": "1922-12-02 至 1934-11（春晖创立与大礼堂《雷雨》公演）",
  "schema": "chunhui-avg-v1",
  "schemaNote": "lines/choices 为引擎兼容层；scenes 为完整扩写层；choiceNodes 保留每屏分支语义；含 investigations/codex/partnerNotes/quiz 纯正文字冒险系统。",
  "lead": "我（高二新媒体社摄影兼后期）",
  "partner": "池雨曦（高二12班，口播与画外音搭档）",
  "viewSpec": {
    "maxLinesPerScreen": 4,
    "maxCharsPerLine": 100,
    "choicesPerBranch": "2-3",
    "maxChoiceChars": 16
  },
  "cast": [
    {"id": "me", "name": "我", "role": "高二新媒体社摄影兼后期"},
    {"id": "yuxi", "name": "池雨曦", "role": "高二12班，口播与画外音搭档，严谨求真，边界分明", "portrait": "yuxi_neutral"},
    {"id": "lin", "name": "林致远", "role": "校史馆指导老师兼微电影顾问"},
    {"id": "chen", "name": "陈师傅", "role": "西雨楼宿管师傅"},
    {"id": "granny", "name": "白发老奶奶", "role": "学苑食堂第四象限面点窗口老职工"},
    {"id": "apollo", "name": "阿波罗", "role": "校猫，常年盘踞景行路与一字楼"},
    {"id": "cwu", "name": "春戊终端", "role": "掌上文史数据终端/系统提示"},
    {"id": "huyutang", "name": "胡玉堂", "role": "1934年春晖沐春剧社社长（历史沉浸人物）"},
    {"id": "xia", "name": "夏丏尊", "role": "春晖早期名师，《中学生》主编（历史回响）"},
    {"id": "jing", "name": "经亨颐", "role": "春晖首任校长，“与时俱进”奠基人（历史回响）"}
  ],
  "locations": {
    "westRain": "西雨楼（男生宿舍）",
    "fenghe": "风荷院（女生宿舍）",
    "jingxing": "景行路（梧桐大道）",
    "yangshanNew": "仰山新楼（高二高三教学楼）",
    "wanghu": "望湖楼（高一教学楼）",
    "yifu3f": "新逸夫楼南侧配套报告厅3楼新媒体机房",
    "xueyuan": "学苑食堂（第四象限面点区）",
    "xinxin": "欣欣餐厅（1F铁板饭/2F馄饨）",
    "bowenguan": "博文馆（老图书馆二楼未锁铁柜）",
    "yizilou": "一字楼与老防空洞回廊",
    "auditorium": "春晖大礼堂（1934舞台与侧幕调音台）",
    "chunhuiBridge": "北门外白马湖春晖桥"
  },
  "chapters": [],
  "cases": []
}

print("Base structure initialized.")
