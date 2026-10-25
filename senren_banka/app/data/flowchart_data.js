// flowchart_data.js —— 官方《千恋＊万花》流程图完整拓扑结构
// 包含 204 个全图节点、9 个核心选择支、分支走向与女主线解锁条件
export var flowchart_data = {
  "routes": [
    "共通",
    "芳乃",
    "茉子",
    "ムラサメ",
    "レナ",
    "サブ"
  ],
  "nodes": [
    {
      "id": "chapter_1_1",
      "type": "chapter",
      "route": "共通",
      "chapter": "",
      "title": "CHAPTER 1",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s001*com_part_1",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 1-1",
      "title": "[ CHAPTER 1-1 ]",
      "storage": "001・アーサー王ver1.07.ks",
      "target": "*com_part_1",
      "targetLine": 0,
      "next": "s001*com_part_1_sel"
    },
    {
      "id": "s001*com_part_1_sel",
      "type": "select",
      "route": "共通",
      "chapter": "CHAPTER 1-1",
      "title": "一目倾心…",
      "storage": "001・アーサー王ver1.07.ks",
      "target": "*com_part_1_sel",
      "targetLine": 107,
      "next": [
        "s001*001_01A",
        "s001*001_01B"
      ]
    },
    {
      "id": "s001*001_01A",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 1-1",
      "title": "说实话",
      "storage": "001・アーサー王ver1.07.ks",
      "target": "*001_01A",
      "targetLine": 107,
      "next": "s001*001_01com"
    },
    {
      "id": "s001*001_01B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 1-1",
      "title": "敷衍过去",
      "storage": "001・アーサー王ver1.07.ks",
      "target": "*001_01B",
      "targetLine": 112,
      "next": "s001*001_01com"
    },
    {
      "id": "s001*001_01com",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 1-1",
      "title": "拜访玄十郎",
      "storage": "001・アーサー王ver1.07.ks",
      "target": "*001_01com",
      "targetLine": 121,
      "next": "s002*com_part_2"
    },
    {
      "id": "s002*com_part_2",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 1-2",
      "title": "[ CHAPTER 1-2 ]",
      "storage": "002・祟り神ver1.08.ks",
      "target": "*com_part_2",
      "targetLine": 807,
      "next": "s003*com_part_3"
    },
    {
      "id": "s003*com_part_3",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 1-3",
      "title": "[ CHAPTER 1-3 ]",
      "storage": "003・巫女の秘密ver1.11.ks",
      "target": "*com_part_3",
      "targetLine": 1363,
      "next": "s004*com_part_4"
    },
    {
      "id": "chapter_1_2",
      "type": "chapter",
      "route": "共通",
      "chapter": "CHAPTER 1-3",
      "title": "CHAPTER 2",
      "storage": null,
      "target": null,
      "targetLine": 1363,
      "next": null
    },
    {
      "id": "s004*com_part_4",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-1",
      "title": "[ CHAPTER 2-1 ]",
      "storage": "004・学院初日ver1.04.ks",
      "target": "*com_part_4",
      "targetLine": 2316,
      "next": "s004*chapter2-2"
    },
    {
      "id": "s004*chapter2-2",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-2",
      "title": "踏入新校园",
      "storage": "004・学院初日ver1.04.ks",
      "target": "*chapter2-2",
      "targetLine": 2429,
      "next": "s005*com_part_5"
    },
    {
      "id": "s005*com_part_5",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-3",
      "title": "[ CHAPTER 2-3 ]",
      "storage": "005・鍛錬ver1.04.ks",
      "target": "*com_part_5",
      "targetLine": 2805,
      "next": "s005*chapter2-4"
    },
    {
      "id": "s005*chapter2-4",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-4",
      "title": "行迹可疑",
      "storage": "005・鍛錬ver1.04.ks",
      "target": "*chapter2-4",
      "targetLine": 2985,
      "next": "s006*com_part_6"
    },
    {
      "id": "s006*com_part_6",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-5",
      "title": "[ CHAPTER 2-5 ]",
      "storage": "006・レナ登場ver1.03.ks",
      "target": "*com_part_6",
      "targetLine": 3111,
      "next": "s006*com_part_6_sel"
    },
    {
      "id": "s006*com_part_6_sel",
      "type": "select",
      "route": "共通",
      "chapter": "CHAPTER 2-5",
      "title": "穗织和大城市，你选哪里？",
      "storage": "006・レナ登場ver1.03.ks",
      "target": "*com_part_6_sel",
      "targetLine": 3458,
      "next": [
        "s006*006_01A",
        "s006*006_01B"
      ]
    },
    {
      "id": "s006*006_01A",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-5",
      "title": "还是觉得城市好",
      "storage": "006・レナ登場ver1.03.ks",
      "target": "*006_01A",
      "targetLine": 3458,
      "next": "s006*006_01com"
    },
    {
      "id": "s006*006_01B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-5",
      "title": "不好说",
      "storage": "006・レナ登場ver1.03.ks",
      "target": "*006_01B",
      "targetLine": 3461,
      "next": "s006*006_01com"
    },
    {
      "id": "s006*006_01com",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-5",
      "title": "留学生登场",
      "storage": "006・レナ登場ver1.03.ks",
      "target": "*006_01com",
      "targetLine": 3469,
      "next": "s007*com_part_7"
    },
    {
      "id": "s007*com_part_7",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-6",
      "title": "[ CHAPTER 2-6 ]",
      "storage": "007・レナ転入ver1.03.ks",
      "target": "*com_part_7",
      "targetLine": 3738,
      "next": "s008*com_part_8"
    },
    {
      "id": "s008*com_part_8",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 2-7",
      "title": "[ CHAPTER 2-7 ]",
      "storage": "008・仕切り直しver1.02.ks",
      "target": "*com_part_8",
      "targetLine": 4318,
      "next": "s009*com_part_9"
    },
    {
      "id": "chapter_1_3",
      "type": "chapter",
      "route": "共通",
      "chapter": "CHAPTER 2-7",
      "title": "CHAPTER 3",
      "storage": null,
      "target": null,
      "targetLine": 4318,
      "next": null
    },
    {
      "id": "s009*com_part_9",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-1",
      "title": "[ CHAPTER 3-1 ]",
      "storage": "009・謎の欠片ver1.03.ks",
      "target": "*com_part_9",
      "targetLine": 4511,
      "next": "s010*com_part_10"
    },
    {
      "id": "s010*com_part_10",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "[ CHAPTER 3-2 ]",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*com_part_10",
      "targetLine": 5288,
      "next": "s010*com_part_10_sel"
    },
    {
      "id": "s010*com_part_10_sel",
      "type": "select",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "有没有哪里奇怪？",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*com_part_10_sel",
      "targetLine": 5489,
      "next": [
        "s010*010_01A",
        "s010*010_01B"
      ]
    },
    {
      "id": "s010*010_01A",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "我觉得很可爱",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_01A",
      "targetLine": 5489,
      "next": "s010*010_01com"
    },
    {
      "id": "s010*010_01B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "看着不奇怪",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_01B",
      "targetLine": 5492,
      "next": "s010*010_01com"
    },
    {
      "id": "s010*010_01com",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "游山玩水，放松心情",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_01com",
      "targetLine": 5495,
      "next": "s010*010_01com_sel"
    },
    {
      "id": "s010*010_01com_sel",
      "type": "select",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "接下来干什么？",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_01com_sel",
      "targetLine": 5896,
      "next": [
        "s010*010_02A",
        "s010*010_02B",
        "s010*010_02C"
      ]
    },
    {
      "id": "s010*010_02A",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "钓鱼",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_02A",
      "targetLine": 5896,
      "next": "s010*010_02A_sel"
    },
    {
      "id": "s010*010_02B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "挖野菜",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_02B",
      "targetLine": 6113,
      "next": "s010*010_02com"
    },
    {
      "id": "s010*010_02C",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "单独行动",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_02C",
      "targetLine": 6264,
      "next": "s010*010_02com"
    },
    {
      "id": "s010*010_02A_sel",
      "type": "select",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "是否交给廉太郎？",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_02A_sel",
      "targetLine": 5909,
      "next": [
        "s010*010_03A",
        "s010*010_03B"
      ]
    },
    {
      "id": "s010*010_03A",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "不行",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_03A",
      "targetLine": 5909,
      "next": "s010*010_03com"
    },
    {
      "id": "s010*010_03B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "好吧",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_03B",
      "targetLine": 6012,
      "next": "s010*010_03com"
    },
    {
      "id": "s010*010_03com",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "继续",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_03com",
      "targetLine": 6304,
      "next": "s010*010_02com"
    },
    {
      "id": "s010*010_02com",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "回到房间",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_02com",
      "targetLine": 6307,
      "next": "s010*010_02com_sel"
    },
    {
      "id": "s010*010_02com_sel",
      "type": "select",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "感谢丛雨",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_02com_sel",
      "targetLine": 6372,
      "next": [
        "s010*010_06A",
        "s010*010_06B"
      ]
    },
    {
      "id": "s010*010_06A",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "用语言感谢",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_06A",
      "targetLine": 6372,
      "next": "s010*010_05com"
    },
    {
      "id": "s010*010_06B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "摸头",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_06B",
      "targetLine": 6375,
      "next": "s010*010_06B_jmp"
    },
    {
      "id": "s010*010_06B_jmp",
      "type": "branch",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "s010*010_06B_jmp",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_06B_jmp",
      "targetLine": 6393,
      "next": [
        "s010*010_05com",
        "s010*010_06C"
      ]
    },
    {
      "id": "s010*010_06C",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "再摸一摸",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_06C",
      "targetLine": 6393,
      "next": "s010*010_05com"
    },
    {
      "id": "s010*010_05com",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-2",
      "title": "美津叶的新发现",
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_05com",
      "targetLine": 6486,
      "next": "s011*com_part_11"
    },
    {
      "id": "s011*com_part_11",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-3",
      "title": "[ CHAPTER 3-3 ]",
      "storage": "011・襲来ver1.04.ks",
      "target": "*com_part_11",
      "targetLine": 6498,
      "next": "s012*com_part_12"
    },
    {
      "id": "s012*com_part_12",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-4",
      "title": "[ CHAPTER 3-4 ]",
      "storage": "012・病床ver1.06.ks",
      "target": "*com_part_12",
      "targetLine": 6930,
      "next": "s012*com_part_12_sel"
    },
    {
      "id": "s012*com_part_12_sel",
      "type": "select",
      "route": "共通",
      "chapter": "CHAPTER 3-4",
      "title": "小春的料理…",
      "storage": "012・病床ver1.06.ks",
      "target": "*com_part_12_sel",
      "targetLine": 7316,
      "next": [
        "s012*012_01A",
        "s012*012_01B"
      ]
    },
    {
      "id": "s012*012_01A",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-4",
      "title": "有点担心",
      "storage": "012・病床ver1.06.ks",
      "target": "*012_01A",
      "targetLine": 7316,
      "next": "s012*012_01com"
    },
    {
      "id": "s012*012_01B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-4",
      "title": "相信小春",
      "storage": "012・病床ver1.06.ks",
      "target": "*012_01B",
      "targetLine": 7319,
      "next": "s012*012_01com"
    },
    {
      "id": "s012*012_01com",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-4",
      "title": "蕾娜的秘密",
      "storage": "012・病床ver1.06.ks",
      "target": "*012_01com",
      "targetLine": 7322,
      "next": "s013*com_part_13"
    },
    {
      "id": "s013*com_part_13",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-5",
      "title": "[ CHAPTER 3-5 ]",
      "storage": "013・欠片集めver1.06.ks",
      "target": "*com_part_13",
      "targetLine": 7702,
      "next": "s013*com_part_13_jmp"
    },
    {
      "id": "s013*com_part_13_jmp",
      "type": "branch",
      "route": "共通",
      "chapter": "CHAPTER 3-5",
      "title": "s013*com_part_13_jmp",
      "storage": "013・欠片集めver1.06.ks",
      "target": "*com_part_13_jmp",
      "targetLine": 7791,
      "next": [
        "s013*mak_com013_1",
        "s013*mak_com013_2"
      ]
    },
    {
      "id": "s013*mak_com013_1",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-5",
      "title": "茉子和猫",
      "storage": "013・欠片集めver1.06.ks",
      "target": "*mak_com013_1",
      "targetLine": 7791,
      "next": "s013*mak_com013_2"
    },
    {
      "id": "s013*mak_com013_2",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-5",
      "title": "两人祓禊",
      "storage": "013・欠片集めver1.06.ks",
      "target": "*mak_com013_2",
      "targetLine": 7955,
      "next": "s014*com_part_14"
    },
    {
      "id": "s014*com_part_14",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "[ CHAPTER 3-6 ]",
      "storage": "014・合体編ver1.03.ks",
      "target": "*com_part_14",
      "targetLine": 8212,
      "next": "s014*com_part_14_sel"
    },
    {
      "id": "s014*com_part_14_sel",
      "type": "select",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "朝武看上去很担心…",
      "storage": "014・合体編ver1.03.ks",
      "target": "*com_part_14_sel",
      "targetLine": 8394,
      "next": [
        "s014*014_01A",
        "s014*014_01B"
      ]
    },
    {
      "id": "s014*014_01A",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "让她放心",
      "storage": "014・合体編ver1.03.ks",
      "target": "*014_01A",
      "targetLine": 8394,
      "next": "s014*014_01com"
    },
    {
      "id": "s014*014_01B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "少说两句",
      "storage": "014・合体編ver1.03.ks",
      "target": "*014_01B",
      "targetLine": 8399,
      "next": "s014*014_01com"
    },
    {
      "id": "s014*014_01com",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "睡不着的芳乃",
      "storage": "014・合体編ver1.03.ks",
      "target": "*014_01com",
      "targetLine": 8402,
      "next": "s014*014_01jmp"
    },
    {
      "id": "s014*014_01jmp",
      "type": "branch",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "s014*014_01jmp",
      "storage": "014・合体編ver1.03.ks",
      "target": "*014_01jmp",
      "targetLine": 8436,
      "next": [
        "s014*com_part_len",
        "s014*014_02"
      ]
    },
    {
      "id": "s014*com_part_len",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "s014*com_part_len",
      "storage": "014・合体編ver1.03.ks",
      "target": "*com_part_len",
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "warp_1_1",
      "type": "warp",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "warp_1_1",
      "storage": null,
      "target": null,
      "targetLine": 8212,
      "next": null
    },
    {
      "id": "s014*014_02",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-6",
      "title": "上山",
      "storage": "014・合体編ver1.03.ks",
      "target": "*014_02",
      "targetLine": 8436,
      "next": "s015*com_part_15"
    },
    {
      "id": "s015*com_part_15",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "[ CHAPTER 3-7 ]",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*com_part_15",
      "targetLine": 8861,
      "next": "s015*com_part_15_jmp1"
    },
    {
      "id": "s015*com_part_15_jmp1",
      "type": "branch",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "s015*com_part_15_jmp1",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*com_part_15_jmp1",
      "targetLine": 8861,
      "next": [
        "s015*com_part_yos",
        "s015*com_part_mak",
        "s015*015_01B"
      ]
    },
    {
      "id": "s015*com_part_yos",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "s015*com_part_yos",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*com_part_yos",
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "s015*com_part_mak",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "s015*com_part_mak",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*com_part_mak",
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "warp_1_2",
      "type": "warp",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "warp_1_2",
      "storage": null,
      "target": null,
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "warp_1_3",
      "type": "warp",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "warp_1_3",
      "storage": null,
      "target": null,
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "s015*015_01B",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "今后的打算",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*015_01B",
      "targetLine": 8861,
      "next": "s015*com_part_15_jmp2"
    },
    {
      "id": "s015*com_part_15_jmp2",
      "type": "branch",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "s015*com_part_15_jmp2",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*com_part_15_jmp2",
      "targetLine": 8861,
      "next": [
        "s015*com_part_mur",
        "s015*com_part_sub",
        "s015*com_part_end"
      ]
    },
    {
      "id": "s015*com_part_mur",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "s015*com_part_mur",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*com_part_mur",
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "s015*com_part_sub",
      "type": "section",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "s015*com_part_sub",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*com_part_sub",
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "warp_1_4",
      "type": "warp",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "warp_1_4",
      "storage": null,
      "target": null,
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "warp_1_5",
      "type": "warp",
      "route": "共通",
      "chapter": "CHAPTER 3-7",
      "title": "warp_1_5",
      "storage": null,
      "target": null,
      "targetLine": 8861,
      "next": null
    },
    {
      "id": "s015*com_part_end",
      "type": "section",
      "route": "共通",
      "chapter": "END",
      "title": "我们的战斗才刚以下略",
      "storage": "015・ノーマルENDver1.01.ks",
      "target": "*com_part_end",
      "targetLine": null,
      "next": null
    },
    {
      "id": "chapter_2_1",
      "type": "chapter",
      "route": "芳乃",
      "chapter": "",
      "title": "CHAPTER 3",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s100*yos_part_0",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 3-8",
      "title": "[ CHAPTER 3-8 ]",
      "storage": "100・芳乃－語らいver1.01.ks",
      "target": "*yos_part_0",
      "targetLine": null,
      "next": "s101*yos_part_1"
    },
    {
      "id": "chapter_2_2",
      "type": "chapter",
      "route": "芳乃",
      "chapter": "CHAPTER 3-8",
      "title": "CHAPTER 4",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s101*yos_part_1",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 4-1",
      "title": "[ CHAPTER 4-1 ]",
      "storage": "101・芳乃－弁当ver1.02.ks",
      "target": "*yos_part_1",
      "targetLine": null,
      "next": "s102*yos_part_2"
    },
    {
      "id": "s102*yos_part_2",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 4-2",
      "title": "[ CHAPTER 4-2 ]",
      "storage": "102・芳乃－告白ver1.03.ks",
      "target": "*yos_part_2",
      "targetLine": null,
      "next": "s103*yos_part_3"
    },
    {
      "id": "s103*yos_part_3",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 4-3",
      "title": "[ CHAPTER 4-3 ]",
      "storage": "103・芳乃－氷解ver1.04.ks",
      "target": "*yos_part_3",
      "targetLine": null,
      "next": "s104*yos_part_4"
    },
    {
      "id": "chapter_2_3",
      "type": "chapter",
      "route": "芳乃",
      "chapter": "CHAPTER 4-3",
      "title": "CHAPTER 5",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s104*yos_part_4",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 5-1",
      "title": "[ CHAPTER 5-1 ]",
      "storage": "104・芳乃－記者会見ver1.05.ks",
      "target": "*yos_part_4",
      "targetLine": null,
      "next": "s105*yos_part_5"
    },
    {
      "id": "s105*yos_part_5",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 5-2",
      "title": "[ CHAPTER 5-2 ]",
      "storage": "105・芳乃－少女漫画ver1.01.ks",
      "target": "*yos_part_5",
      "targetLine": null,
      "next": "s106*yos_part_6"
    },
    {
      "id": "s106*yos_part_6",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 5-3",
      "title": "[ CHAPTER 5-3 ]",
      "storage": "106・芳乃－キスver1.01.ks",
      "target": "*yos_part_6",
      "targetLine": null,
      "next": "s107*yos_part_7"
    },
    {
      "id": "s107*yos_part_7",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 5-3",
      "title": "[ CHAPTER 5-3 ]",
      "storage": "107・芳乃－獣耳ver1.02.ks",
      "target": "*yos_part_7",
      "targetLine": null,
      "next": "s107*chapter54yos"
    },
    {
      "id": "s107*chapter54yos",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 5-4",
      "title": "暗中模索",
      "storage": "107・芳乃－獣耳ver1.02.ks",
      "target": "*chapter54yos",
      "targetLine": null,
      "next": "s107*chapter55yos"
    },
    {
      "id": "s107*chapter55yos",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 5-5",
      "title": "失控的将臣",
      "storage": "107・芳乃－獣耳ver1.02.ks",
      "target": "*chapter55yos",
      "targetLine": null,
      "next": "s108*yos_part_8"
    },
    {
      "id": "s108*yos_part_8",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 5-5",
      "title": "[ CHAPTER 5-5 ]",
      "storage": "108・芳乃－解呪ver1.01.ks",
      "target": "*yos_part_8",
      "targetLine": null,
      "next": "s109*yos_part_9"
    },
    {
      "id": "chapter_2_4",
      "type": "chapter",
      "route": "芳乃",
      "chapter": "CHAPTER 5-5",
      "title": "CHAPTER 6",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s109*yos_part_9",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 6-1",
      "title": "[ CHAPTER 6-1 ]",
      "storage": "109・芳乃－平穏ver1.01.ks",
      "target": "*yos_part_9",
      "targetLine": null,
      "next": "s110*yos_part_10"
    },
    {
      "id": "s110*yos_part_10",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 6-2",
      "title": "[ CHAPTER 6-2 ]",
      "storage": "110・芳乃－初体験ver1.01.ks",
      "target": "*yos_part_10",
      "targetLine": null,
      "next": "s111*yos_part_11"
    },
    {
      "id": "chapter_2_5",
      "type": "chapter",
      "route": "芳乃",
      "chapter": "CHAPTER 6-2",
      "title": "CHAPTER 7",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s111*yos_part_11",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 7-1",
      "title": "[ CHAPTER 7-1 ]",
      "storage": "111・芳乃－その後ver1.01.ks",
      "target": "*yos_part_11",
      "targetLine": null,
      "next": "s112*yos_part_12"
    },
    {
      "id": "s112*yos_part_12",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 7-2",
      "title": "[ CHAPTER 7-2 ]",
      "storage": "112・芳乃－２回目ver1.01.ks",
      "target": "*yos_part_12",
      "targetLine": null,
      "next": "s113*yos_part_13"
    },
    {
      "id": "s113*yos_part_13",
      "type": "section",
      "route": "芳乃",
      "chapter": "CHAPTER 7-3",
      "title": "[ CHAPTER 7-3 ]",
      "storage": "113・芳乃－母上様ver1.01.ks",
      "target": "*yos_part_13",
      "targetLine": null,
      "next": "s114*yos_part_14"
    },
    {
      "id": "chapter_2_6",
      "type": "chapter",
      "route": "芳乃",
      "chapter": "CHAPTER 7-3",
      "title": "EPILOGUE",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s114*yos_part_14",
      "type": "section",
      "route": "芳乃",
      "chapter": "EPILOGUE",
      "title": "[ 尾声 ]",
      "storage": "114・芳乃－ＥＰver1.01.ks",
      "target": "*yos_part_14",
      "targetLine": null,
      "next": null
    },
    {
      "id": "chapter_3_1",
      "type": "chapter",
      "route": "茉子",
      "chapter": "",
      "title": "CHAPTER 3",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s200*mak_part_0",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 3-8",
      "title": "[ CHAPTER 3-8 ]",
      "storage": "200・茉子－語らいver1.00.ks",
      "target": "*mak_part_0",
      "targetLine": null,
      "next": "s201*mak_part_1"
    },
    {
      "id": "chapter_3_2",
      "type": "chapter",
      "route": "茉子",
      "chapter": "CHAPTER 3-8",
      "title": "CHAPTER 4",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s201*mak_part_1",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 4-1",
      "title": "[ CHAPTER 4-1 ]",
      "storage": "201・茉子－婚約解消ver1.01.ks",
      "target": "*mak_part_1",
      "targetLine": null,
      "next": "s202*mak_part_2"
    },
    {
      "id": "s202*mak_part_2",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 4-2",
      "title": "[ CHAPTER 4-2 ]",
      "storage": "202・茉子－実家ver1.01.ks",
      "target": "*mak_part_2",
      "targetLine": null,
      "next": "s202*chapter43mak"
    },
    {
      "id": "s202*chapter43mak",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 4-3",
      "title": "茉子的休息日",
      "storage": "202・茉子－実家ver1.01.ks",
      "target": "*chapter43mak",
      "targetLine": null,
      "next": "s203*mak_part_3"
    },
    {
      "id": "chapter_3_3",
      "type": "chapter",
      "route": "茉子",
      "chapter": "CHAPTER 4-3",
      "title": "CHAPTER 5",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s203*mak_part_3",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 5-1",
      "title": "[ CHAPTER 5-1 ]",
      "storage": "203・茉子－子犬ver1.01.ks",
      "target": "*mak_part_3",
      "targetLine": null,
      "next": "s204*mak_part_4"
    },
    {
      "id": "s204*mak_part_4",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 5-2",
      "title": "[ CHAPTER 5-2 ]",
      "storage": "204・茉子－気持ちver1.00.ks",
      "target": "*mak_part_4",
      "targetLine": null,
      "next": "s205*mak_part_5"
    },
    {
      "id": "s205*mak_part_5",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 5-3",
      "title": "[ CHAPTER 5-3 ]",
      "storage": "205・茉子－デートver1.00.ks",
      "target": "*mak_part_5",
      "targetLine": null,
      "next": "s206*mak_part_6"
    },
    {
      "id": "chapter_3_4",
      "type": "chapter",
      "route": "茉子",
      "chapter": "CHAPTER 5-3",
      "title": "CHAPTER 6",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s206*mak_part_6",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 6-1",
      "title": "[ CHAPTER 6-1 ]",
      "storage": "206・茉子－オナニーver1.00.ks",
      "target": "*mak_part_6",
      "targetLine": null,
      "next": "s206*chapter62mak"
    },
    {
      "id": "s206*chapter62mak",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 6-2",
      "title": "交易",
      "storage": "206・茉子－オナニーver1.00.ks",
      "target": "*chapter62mak",
      "targetLine": null,
      "next": "s206*chapter63mak"
    },
    {
      "id": "s206*chapter63mak",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 6-3",
      "title": "兽灵的目的",
      "storage": "206・茉子－オナニーver1.00.ks",
      "target": "*chapter63mak",
      "targetLine": null,
      "next": "s207*mak_part_7"
    },
    {
      "id": "s207*mak_part_7",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 6-4",
      "title": "[ CHAPTER 6-4 ]",
      "storage": "207・茉子－初体験ver1.00.ks",
      "target": "*mak_part_7",
      "targetLine": null,
      "next": "s207*chapter65mak"
    },
    {
      "id": "s207*chapter65mak",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 6-5",
      "title": "恋人约会",
      "storage": "207・茉子－初体験ver1.00.ks",
      "target": "*chapter65mak",
      "targetLine": null,
      "next": "s208*mak_part_8"
    },
    {
      "id": "chapter_3_5",
      "type": "chapter",
      "route": "茉子",
      "chapter": "CHAPTER 6-5",
      "title": "CHAPTER 7",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s208*mak_part_8",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 7-1",
      "title": "[ CHAPTER 7-1 ]",
      "storage": "208・茉子－いちゃラヴver1.00.ks",
      "target": "*mak_part_8",
      "targetLine": null,
      "next": "s209*mak_part_9"
    },
    {
      "id": "s209*mak_part_9",
      "type": "section",
      "route": "茉子",
      "chapter": "CHAPTER 7-2",
      "title": "[ CHAPTER 7-2 ]",
      "storage": "209・茉子－暴走改編ver1.01.ks",
      "target": "*mak_part_9",
      "targetLine": null,
      "next": "s210*mak_part_10"
    },
    {
      "id": "chapter_3_6",
      "type": "chapter",
      "route": "茉子",
      "chapter": "CHAPTER 7-2",
      "title": "EPILOGUE",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s210*mak_part_10",
      "type": "section",
      "route": "茉子",
      "chapter": "EPILOGUE",
      "title": "[ 尾声 ]",
      "storage": "210・茉子－エピローグver1.00.ks",
      "target": "*mak_part_10",
      "targetLine": null,
      "next": null
    },
    {
      "id": "chapter_4_1",
      "type": "chapter",
      "route": "ムラサメ",
      "chapter": "",
      "title": "CHAPTER 4",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s301*mur_part_01",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 4-1",
      "title": "[ CHAPTER 4-1 ]",
      "storage": "301・ムラサメちゃんルート０１ver1.3.ks",
      "target": "*mur_part_01",
      "targetLine": null,
      "next": "s302*mur_part_02"
    },
    {
      "id": "s302*mur_part_02",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 4-2",
      "title": "[ CHAPTER 4-2 ]",
      "storage": "302・ムラサメちゃんルート０２ver1.3.ks",
      "target": "*mur_part_02",
      "targetLine": null,
      "next": "s302*chapter43mur"
    },
    {
      "id": "s302*chapter43mur",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 4-3",
      "title": "准备",
      "storage": "302・ムラサメちゃんルート０２ver1.3.ks",
      "target": "*chapter43mur",
      "targetLine": null,
      "next": "s303*mur_part_03"
    },
    {
      "id": "s303*mur_part_03",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 4-4",
      "title": "[ CHAPTER 4-4 ]",
      "storage": "303・ムラサメちゃんルート０３ver1.2.ks",
      "target": "*mur_part_03",
      "targetLine": null,
      "next": "s304*mur_part_04"
    },
    {
      "id": "chapter_4_2",
      "type": "chapter",
      "route": "ムラサメ",
      "chapter": "CHAPTER 4-4",
      "title": "CHAPTER 5",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s304*mur_part_04",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 5-1",
      "title": "[ CHAPTER 5-1 ]",
      "storage": "304・ムラサメちゃんルート０４ver1.2.ks",
      "target": "*mur_part_04",
      "targetLine": null,
      "next": "s305*mur_part_05"
    },
    {
      "id": "s305*mur_part_05",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 5-2",
      "title": "[ CHAPTER 5-2 ]",
      "storage": "305・ムラサメちゃんルート０５ver1.2.ks",
      "target": "*mur_part_05",
      "targetLine": null,
      "next": "s305*chapter53mur"
    },
    {
      "id": "s305*chapter53mur",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 5-3",
      "title": "怎么振兴？",
      "storage": "305・ムラサメちゃんルート０５ver1.2.ks",
      "target": "*chapter53mur",
      "targetLine": null,
      "next": "s306*mur_part_06"
    },
    {
      "id": "s306*mur_part_06",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 5-4",
      "title": "[ CHAPTER 5-4 ]",
      "storage": "306・ムラサメちゃんルート０６ver1.3.ks",
      "target": "*mur_part_06",
      "targetLine": null,
      "next": "s307*mur_part_07"
    },
    {
      "id": "chapter_4_3",
      "type": "chapter",
      "route": "ムラサメ",
      "chapter": "CHAPTER 5-4",
      "title": "CHAPTER 6",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s307*mur_part_07",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 6-1",
      "title": "[ CHAPTER 6-1 ]",
      "storage": "307・ムラサメちゃんルート０７ver1.2.ks",
      "target": "*mur_part_07",
      "targetLine": null,
      "next": "s308*mur_part_08"
    },
    {
      "id": "s308*mur_part_08",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 6-2",
      "title": "[ CHAPTER 6-2 ]",
      "storage": "308・ムラサメちゃんルート０８ver1.2.ks",
      "target": "*mur_part_08",
      "targetLine": null,
      "next": "s308*chapter63mur"
    },
    {
      "id": "s308*chapter63mur",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 6-3",
      "title": "将臣就爱照顾人",
      "storage": "308・ムラサメちゃんルート０８ver1.2.ks",
      "target": "*chapter63mur",
      "targetLine": null,
      "next": "s309*mur_part_09"
    },
    {
      "id": "s309*mur_part_09",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 6-4",
      "title": "[ CHAPTER 6-4 ]",
      "storage": "309・ムラサメちゃんルート０９ver1.3.ks",
      "target": "*mur_part_09",
      "targetLine": null,
      "next": "s310*mur_part_10"
    },
    {
      "id": "chapter_4_4",
      "type": "chapter",
      "route": "ムラサメ",
      "chapter": "CHAPTER 6-4",
      "title": "CHAPTER 7",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s310*mur_part_10",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 7-1",
      "title": "[ CHAPTER 7-1 ]",
      "storage": "310・ムラサメちゃんルート１０ver1.2.ks",
      "target": "*mur_part_10",
      "targetLine": null,
      "next": "s310*chapter72mur"
    },
    {
      "id": "s310*chapter72mur",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 7-2",
      "title": "将臣的决心",
      "storage": "310・ムラサメちゃんルート１０ver1.2.ks",
      "target": "*chapter72mur",
      "targetLine": null,
      "next": "s310*chapter73mur"
    },
    {
      "id": "s310*chapter73mur",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 7-3",
      "title": "小雨的过去",
      "storage": "310・ムラサメちゃんルート１０ver1.2.ks",
      "target": "*chapter73mur",
      "targetLine": null,
      "next": "s311*mur_part_11"
    },
    {
      "id": "chapter_4_5",
      "type": "chapter",
      "route": "ムラサメ",
      "chapter": "CHAPTER 7-3",
      "title": "CHAPTER 8",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s311*mur_part_11",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 8-1",
      "title": "[ CHAPTER 8-1 ]",
      "storage": "311・ムラサメちゃんルート１１ver1.2.ks",
      "target": "*mur_part_11",
      "targetLine": null,
      "next": "s312*mur_part_12"
    },
    {
      "id": "s312*mur_part_12",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 8-2",
      "title": "[ CHAPTER 8-2 ]",
      "storage": "312・ムラサメちゃんルート１２ver1.2.ks",
      "target": "*mur_part_12",
      "targetLine": null,
      "next": "s313*mur_part_13"
    },
    {
      "id": "s313*mur_part_13",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 8-3",
      "title": "[ CHAPTER 8-3 ]",
      "storage": "313・ムラサメちゃんルート１３ver1.2.ks",
      "target": "*mur_part_13",
      "targetLine": null,
      "next": "s313*chapter84mur"
    },
    {
      "id": "s313*chapter84mur",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 8-4",
      "title": "开幕在即",
      "storage": "313・ムラサメちゃんルート１３ver1.2.ks",
      "target": "*chapter84mur",
      "targetLine": null,
      "next": "s314*mur_part_14"
    },
    {
      "id": "s314*mur_part_14",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 8-5",
      "title": "[ CHAPTER 8-5 ]",
      "storage": "314・ムラサメちゃんルート１４ver1.3.ks",
      "target": "*mur_part_14",
      "targetLine": null,
      "next": "s315*mur_part_15"
    },
    {
      "id": "chapter_4_6",
      "type": "chapter",
      "route": "ムラサメ",
      "chapter": "CHAPTER 8-5",
      "title": "CHAPTER 9",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s315*mur_part_15",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 9-1",
      "title": "[ CHAPTER 9-1 ]",
      "storage": "315・ムラサメちゃんルート１５ver1.3.ks",
      "target": "*mur_part_15",
      "targetLine": null,
      "next": "s315*chapter92mur"
    },
    {
      "id": "s315*chapter92mur",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "CHAPTER 9-2",
      "title": "幸せな２人",
      "storage": "315・ムラサメちゃんルート１５ver1.3.ks",
      "target": "*chapter92mur",
      "targetLine": null,
      "next": "s316*mur_part_16"
    },
    {
      "id": "chapter_4_7",
      "type": "chapter",
      "route": "ムラサメ",
      "chapter": "CHAPTER 9-2",
      "title": "EPILOGUE",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s316*mur_part_16",
      "type": "section",
      "route": "ムラサメ",
      "chapter": "EPILOGUE",
      "title": "[ 尾声 ]",
      "storage": "316・ムラサメちゃんルート１６ver1.2.ks",
      "target": "*mur_part_16",
      "targetLine": null,
      "next": null
    },
    {
      "id": "chapter_5_1",
      "type": "chapter",
      "route": "レナ",
      "chapter": "",
      "title": "CHAPTER 3",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s414*len_part_0",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 3-6",
      "title": "[ CHAPTER 3-6 ]",
      "storage": "414レナ・イザナウ.ks",
      "target": "*len_part_0",
      "targetLine": 8212,
      "next": "s415*len_part_1"
    },
    {
      "id": "chapter_5_2",
      "type": "chapter",
      "route": "レナ",
      "chapter": "CHAPTER 3-6",
      "title": "CHAPTER 4",
      "storage": null,
      "target": null,
      "targetLine": 8212,
      "next": null
    },
    {
      "id": "s415*len_part_1",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 4-1",
      "title": "[ CHAPTER 4-1 ]",
      "storage": "415レナ・欠片吸収.ks",
      "target": "*len_part_1",
      "targetLine": null,
      "next": "s416*len_part_2"
    },
    {
      "id": "s416*len_part_2",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 4-2",
      "title": "[ CHAPTER 4-2 ]",
      "storage": "416レナ・クレイジーファイト.ks",
      "target": "*len_part_2",
      "targetLine": null,
      "next": "s417*len_part_3"
    },
    {
      "id": "chapter_5_3",
      "type": "chapter",
      "route": "レナ",
      "chapter": "CHAPTER 4-2",
      "title": "CHAPTER 5",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s417*len_part_3",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 5-1",
      "title": "[ CHAPTER 5-1 ]",
      "storage": "417レナ・エニシ.ks",
      "target": "*len_part_3",
      "targetLine": null,
      "next": "s418*len_part_4"
    },
    {
      "id": "s418*len_part_4",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 5-2",
      "title": "[ CHAPTER 5-2 ]",
      "storage": "418レナ・馴染む.ks",
      "target": "*len_part_4",
      "targetLine": null,
      "next": "s419*len_part_5"
    },
    {
      "id": "s419*len_part_5",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 5-3",
      "title": "[ CHAPTER 5-3 ]",
      "storage": "419レナ・ラップランドの味覚.ks",
      "target": "*len_part_5",
      "targetLine": null,
      "next": "s420*len_part_6"
    },
    {
      "id": "s420*len_part_6",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 5-4",
      "title": "[ CHAPTER 5-4 ]",
      "storage": "420レナ・お泊まり会.ks",
      "target": "*len_part_6",
      "targetLine": null,
      "next": "s421*len_part_7"
    },
    {
      "id": "chapter_5_4",
      "type": "chapter",
      "route": "レナ",
      "chapter": "CHAPTER 5-4",
      "title": "CHAPTER 6",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s421*len_part_7",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 6-1",
      "title": "[ CHAPTER 6-1 ]",
      "storage": "421レナ・玉石の女神.ks",
      "target": "*len_part_7",
      "targetLine": null,
      "next": "s422*len_part_8"
    },
    {
      "id": "s422*len_part_8",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 6-2",
      "title": "[ CHAPTER 6-2 ]",
      "storage": "422レナ・日常デート.ks",
      "target": "*len_part_8",
      "targetLine": null,
      "next": "s423*len_part_9"
    },
    {
      "id": "chapter_5_5",
      "type": "chapter",
      "route": "レナ",
      "chapter": "CHAPTER 6-2",
      "title": "CHAPTER 7",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s423*len_part_9",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 7-1",
      "title": "[ CHAPTER 7-1 ]",
      "storage": "423レナ・叢雲より生じたる.ks",
      "target": "*len_part_9",
      "targetLine": null,
      "next": "s424*len_part_10"
    },
    {
      "id": "s424*len_part_10",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 7-2",
      "title": "[ CHAPTER 7-2 ]",
      "storage": "424レナ・トモダチ.ks",
      "target": "*len_part_10",
      "targetLine": null,
      "next": "s425*len_part_11"
    },
    {
      "id": "s425*len_part_11",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 7-3",
      "title": "[ CHAPTER 7-3 ]",
      "storage": "425レナ・呪いの真実.ks",
      "target": "*len_part_11",
      "targetLine": null,
      "next": "s426*len_part_12"
    },
    {
      "id": "chapter_5_6",
      "type": "chapter",
      "route": "レナ",
      "chapter": "CHAPTER 7-3",
      "title": "CHAPTER 8",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s426*len_part_12",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 8-1",
      "title": "[ CHAPTER 8-1 ]",
      "storage": "426レナ・前夜.ks",
      "target": "*len_part_12",
      "targetLine": null,
      "next": "s427*len_part_13"
    },
    {
      "id": "s427*len_part_13",
      "type": "section",
      "route": "レナ",
      "chapter": "CHAPTER 8-2",
      "title": "[ CHAPTER 8-2 ]",
      "storage": "427レナ・古の祝詞.ks",
      "target": "*len_part_13",
      "targetLine": null,
      "next": "s428*len_part_14"
    },
    {
      "id": "chapter_5_7",
      "type": "chapter",
      "route": "レナ",
      "chapter": "CHAPTER 8-2",
      "title": "EPILOGUE",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s428*len_part_14",
      "type": "section",
      "route": "レナ",
      "chapter": "EPILOGUE",
      "title": "[ 尾声 ]",
      "storage": "428レナ・未来への祭祀.ks",
      "target": "*len_part_14",
      "targetLine": null,
      "next": null
    },
    {
      "id": "chapter_6_1",
      "type": "chapter",
      "route": "サブ",
      "chapter": "",
      "title": "CHAPTER 4",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s501*sub_part_1",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 4-1",
      "title": "[ CHAPTER 4-1 ]",
      "storage": "501・サブ－新たな日々ver1.00.ks",
      "target": "*sub_part_1",
      "targetLine": null,
      "next": "s502*sub_part_2"
    },
    {
      "id": "s502*sub_part_2",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 4-2",
      "title": "[ CHAPTER 4-2 ]",
      "storage": "502・サブ－アルバイトver1.00.ks",
      "target": "*sub_part_2",
      "targetLine": null,
      "next": "s503*sub_part_3"
    },
    {
      "id": "s503*sub_part_3",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 4-3",
      "title": "[ CHAPTER 4-3 ]",
      "storage": "503・サブ－小春の目覚めver1.00.ks",
      "target": "*sub_part_3",
      "targetLine": null,
      "next": "s504*sub_part_4"
    },
    {
      "id": "s504*sub_part_4",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 4-4",
      "title": "[ CHAPTER 4-4 ]",
      "storage": "504・サブ－芦花の目覚めver1.00.ks",
      "target": "*sub_part_4",
      "targetLine": null,
      "next": "s504*chapter45sub"
    },
    {
      "id": "s504*chapter45sub",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 4-5",
      "title": "前进了一小步",
      "storage": "504・サブ－芦花の目覚めver1.00.ks",
      "target": "*chapter45sub",
      "targetLine": null,
      "next": "s505*sub_part_5"
    },
    {
      "id": "chapter_6_2",
      "type": "chapter",
      "route": "サブ",
      "chapter": "CHAPTER 4-5",
      "title": "CHAPTER 5",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s505*sub_part_5",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 5-1",
      "title": "[ CHAPTER 5-1 ]",
      "storage": "505・サブ－ピンとくる２人ver1.00.ks",
      "target": "*sub_part_5",
      "targetLine": null,
      "next": "s506*sub_part_6"
    },
    {
      "id": "s506*sub_part_6",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 5-2",
      "title": "[ CHAPTER 5-2 ]",
      "storage": "506・サブ－恋愛協定ver1.00.ks",
      "target": "*sub_part_6",
      "targetLine": null,
      "next": "s507*sub_part_7"
    },
    {
      "id": "chapter_6_3",
      "type": "chapter",
      "route": "サブ",
      "chapter": "CHAPTER 5-2",
      "title": "CHAPTER 6",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s507*sub_part_7",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 6-1",
      "title": "[ CHAPTER 6-1 ]",
      "storage": "507・サブ－選択肢ver1.00.ks",
      "target": "*sub_part_7",
      "targetLine": null,
      "next": "s507*chapter62sub"
    },
    {
      "id": "s507*chapter62sub",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 6-2",
      "title": "互不相让",
      "storage": "507・サブ－選択肢ver1.00.ks",
      "target": "*chapter62sub",
      "targetLine": null,
      "next": "s507*chapter63sub"
    },
    {
      "id": "s507*chapter63sub",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 6-3",
      "title": "将臣的心意",
      "storage": "507・サブ－選択肢ver1.00.ks",
      "target": "*chapter63sub",
      "targetLine": null,
      "next": "s507*sub_part_7_sel"
    },
    {
      "id": "s507*sub_part_7_sel",
      "type": "select",
      "route": "サブ",
      "chapter": "CHAPTER 6-3",
      "title": "我更想看到……",
      "storage": "507・サブ－選択肢ver1.00.ks",
      "target": "*sub_part_7_sel",
      "targetLine": null,
      "next": [
        "s507*507_01A",
        "s507*507_01B"
      ]
    },
    {
      "id": "s507*507_01A",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 6-3",
      "title": "小春的笑容",
      "storage": "507・サブ－選択肢ver1.00.ks",
      "target": "*507_01A",
      "targetLine": null,
      "next": "s508a*sub_part_8a"
    },
    {
      "id": "s507*507_01B",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 6-3",
      "title": "芦花姐的笑容",
      "storage": "507・サブ－選択肢ver1.00.ks",
      "target": "*507_01B",
      "targetLine": null,
      "next": "s508b*sub_part_8b"
    },
    {
      "id": "s508a*sub_part_8a",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 6-4",
      "title": "[ CHAPTER 6-4 ]",
      "storage": "508a・サブ－こはるんver1.00.ks",
      "target": "*sub_part_8a",
      "targetLine": null,
      "next": "s509*sub_part_9"
    },
    {
      "id": "s508b*sub_part_8b",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 6-4",
      "title": "[ CHAPTER 6-4 ]",
      "storage": "508b・サブ－芦花姉ver1.00.ks",
      "target": "*sub_part_8b",
      "targetLine": null,
      "next": "s508b*chapter65rok"
    },
    {
      "id": "s508b*chapter65rok",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 6-5",
      "title": "一觉醒来，不知所措",
      "storage": "508b・サブ－芦花姉ver1.00.ks",
      "target": "*chapter65rok",
      "targetLine": null,
      "next": "s509*sub_part_9"
    },
    {
      "id": "chapter_6_4",
      "type": "chapter",
      "route": "サブ",
      "chapter": "CHAPTER 6-5",
      "title": "CHAPTER 7",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s509*sub_part_9",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 7-1",
      "title": "[ CHAPTER 7-1 ]",
      "storage": "509・サブ－分岐ver1.00.ks",
      "target": "*sub_part_9",
      "targetLine": null,
      "next": "s509*sub_part_9_jmp"
    },
    {
      "id": "s509*sub_part_9_jmp",
      "type": "branch",
      "route": "サブ",
      "chapter": "CHAPTER 7-1",
      "title": "s509*sub_part_9_jmp",
      "storage": "509・サブ－分岐ver1.00.ks",
      "target": "*sub_part_9_jmp",
      "targetLine": null,
      "next": [
        "s509*509_koh",
        "s509*509_rok"
      ]
    },
    {
      "id": "s509*509_koh",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 7-1",
      "title": "我喜欢小春",
      "storage": "509・サブ－分岐ver1.00.ks",
      "target": "*509_koh",
      "targetLine": null,
      "next": "s511*koh_part_1"
    },
    {
      "id": "s509*509_rok",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 7-1",
      "title": "我喜欢芦花姐",
      "storage": "509・サブ－分岐ver1.00.ks",
      "target": "*509_rok",
      "targetLine": null,
      "next": "s521*rok_part_1"
    },
    {
      "id": "chapter_6_5",
      "type": "chapter",
      "route": "サブ",
      "chapter": "CHAPTER 7-1",
      "title": "CHAPTER 8",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    },
    {
      "id": "s511*koh_part_1",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 8-1",
      "title": "[ CHAPTER 8-1 ]",
      "storage": "511・サブ－小春（初体験）ver1.00.ks",
      "target": "*koh_part_1",
      "targetLine": null,
      "next": "s511*chapter82koh"
    },
    {
      "id": "s511*chapter82koh",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 8-2",
      "title": "突然独处……",
      "storage": "511・サブ－小春（初体験）ver1.00.ks",
      "target": "*chapter82koh",
      "targetLine": null,
      "next": "s512*koh_part_2"
    },
    {
      "id": "s512*koh_part_2",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 8-3",
      "title": "[ CHAPTER 8-3 ]",
      "storage": "512・サブ－小春（その後）ver1.00.ks",
      "target": "*koh_part_2",
      "targetLine": null,
      "next": "s512*chapter84koh"
    },
    {
      "id": "s512*chapter84koh",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 8-4",
      "title": "该坦白了！",
      "storage": "512・サブ－小春（その後）ver1.00.ks",
      "target": "*chapter84koh",
      "targetLine": null,
      "next": "s512*chapterEPkoh"
    },
    {
      "id": "s512*chapterEPkoh",
      "type": "section",
      "route": "サブ",
      "chapter": "EPILOGUE",
      "title": "尾声",
      "storage": "512・サブ－小春（その後）ver1.00.ks",
      "target": "*chapterEPkoh",
      "targetLine": null,
      "next": null
    },
    {
      "id": "s521*rok_part_1",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 8-1",
      "title": "[ CHAPTER 8-1 ]",
      "storage": "521・サブ－芦花（初体験）ver1.00.ks",
      "target": "*rok_part_1",
      "targetLine": null,
      "next": "s522*rok_part_2"
    },
    {
      "id": "s522*rok_part_2",
      "type": "section",
      "route": "サブ",
      "chapter": "CHAPTER 8-2",
      "title": "[ CHAPTER 8-2 ]",
      "storage": "522・サブ－芦花（その後）ver1.00.ks",
      "target": "*rok_part_2",
      "targetLine": null,
      "next": "s522*chapterEProk"
    },
    {
      "id": "s522*chapterEProk",
      "type": "section",
      "route": "サブ",
      "chapter": "EPILOGUE",
      "title": "尾声",
      "storage": "522・サブ－芦花（その後）ver1.00.ks",
      "target": "*chapterEProk",
      "targetLine": null,
      "next": null
    },
    {
      "id": "chapter_6_6",
      "type": "chapter",
      "route": "サブ",
      "chapter": "EPILOGUE",
      "title": "chapter_6_6",
      "storage": null,
      "target": null,
      "targetLine": null,
      "next": null
    }
  ],
  "choices": [
    {
      "id": "s001*com_part_1_sel",
      "chapter": "CHAPTER 1-1",
      "route": "共通",
      "prompt": "【芦花】「还是说我脸上沾了什么东西？」",
      "options": [
        {
          "index": 1,
          "text": "说实话",
          "targetNode": "s001*001_01A",
          "flagGain": {
            "flag": "sub",
            "points": 1
          }
        },
        {
          "index": 2,
          "text": "敷衍过去",
          "targetNode": "s001*001_01B",
          "flagGain": null
        }
      ],
      "storage": "001・アーサー王ver1.07.ks",
      "target": "*com_part_1_sel",
      "targetLine": 107
    },
    {
      "id": "s006*com_part_6_sel",
      "chapter": "CHAPTER 2-5",
      "route": "共通",
      "prompt": "【茉子】「那我想问下，如果让你在穗织和大城市之间做选择，你怎么选？选大城市吗？」",
      "options": [
        {
          "index": 1,
          "text": "还是觉得城市好",
          "targetNode": "s006*006_01A",
          "flagGain": null
        },
        {
          "index": 2,
          "text": "不好说",
          "targetNode": "s006*006_01B",
          "flagGain": {
            "flag": "mak",
            "points": 1
          }
        }
      ],
      "storage": "006・レナ登場ver1.03.ks",
      "target": "*com_part_6_sel",
      "targetLine": 3458
    },
    {
      "id": "s010*com_part_10_sel",
      "chapter": "CHAPTER 3-2",
      "route": "共通",
      "prompt": "【蕾娜】「怎么样呀，将臣。有没有哪里奇怪？」",
      "options": [
        {
          "index": 1,
          "text": "我觉得很可爱",
          "targetNode": "s010*010_01A",
          "flagGain": {
            "flag": "len",
            "points": 1
          }
        },
        {
          "index": 2,
          "text": "看着不奇怪",
          "targetNode": "s010*010_01B",
          "flagGain": null
        }
      ],
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*com_part_10_sel",
      "targetLine": 5489
    },
    {
      "id": "s010*010_01com_sel",
      "chapter": "CHAPTER 3-2",
      "route": "共通",
      "prompt": "【廉太郎】「你准备去哪边？」",
      "options": [
        {
          "index": 1,
          "text": "钓鱼",
          "targetNode": "s010*010_02A",
          "flagGain": null
        },
        {
          "index": 2,
          "text": "挖野菜",
          "targetNode": "s010*010_02B",
          "flagGain": {
            "flag": "mak",
            "points": 1
          }
        },
        {
          "index": 3,
          "text": "单独行动",
          "targetNode": "s010*010_02C",
          "flagGain": {
            "flag": "mur",
            "points": 1
          }
        }
      ],
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_01com_sel",
      "targetLine": 5896
    },
    {
      "id": "s010*010_02A_sel",
      "chapter": "CHAPTER 3-2",
      "route": "共通",
      "prompt": "【廉太郎】「话说，可以让我去教巫女大人吗？」",
      "options": [
        {
          "index": 1,
          "text": "不行",
          "targetNode": "s010*010_03A",
          "flagGain": {
            "flag": "yos",
            "points": 1
          }
        },
        {
          "index": 2,
          "text": "好吧",
          "targetNode": "s010*010_03B",
          "flagGain": {
            "flag": "len",
            "points": 1
          }
        }
      ],
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_02A_sel",
      "targetLine": 5909
    },
    {
      "id": "s010*010_02com_sel",
      "chapter": "CHAPTER 3-2",
      "route": "共通",
      "prompt": "不过，那么大一座山，竟然都让她给找到了……",
      "options": [
        {
          "index": 1,
          "text": "用语言感谢",
          "targetNode": "s010*010_06A",
          "flagGain": null
        },
        {
          "index": 2,
          "text": "摸头",
          "targetNode": "s010*010_06B",
          "flagGain": {
            "flag": "mur",
            "points": 1
          }
        }
      ],
      "storage": "010・リフレッシュver1.04.ks",
      "target": "*010_02com_sel",
      "targetLine": 6372
    },
    {
      "id": "s012*com_part_12_sel",
      "chapter": "CHAPTER 3-4",
      "route": "共通",
      "prompt": "【小春】「和以前相比肯定更能帮上忙了」",
      "options": [
        {
          "index": 1,
          "text": "有点担心",
          "targetNode": "s012*012_01A",
          "flagGain": null
        },
        {
          "index": 2,
          "text": "相信小春",
          "targetNode": "s012*012_01B",
          "flagGain": {
            "flag": "sub",
            "points": 1
          }
        }
      ],
      "storage": "012・病床ver1.06.ks",
      "target": "*com_part_12_sel",
      "targetLine": 7316
    },
    {
      "id": "s014*com_part_14_sel",
      "chapter": "CHAPTER 3-6",
      "route": "共通",
      "prompt": "【芳乃】「您怎么越说越不确定，不要吓我啊。说得我都越来越担心了……」",
      "options": [
        {
          "index": 1,
          "text": "让她放心",
          "targetNode": "s014*014_01A",
          "flagGain": {
            "flag": "yos",
            "points": 1
          }
        },
        {
          "index": 2,
          "text": "少说两句",
          "targetNode": "s014*014_01B",
          "flagGain": null
        }
      ],
      "storage": "014・合体編ver1.03.ks",
      "target": "*com_part_14_sel",
      "targetLine": 8394
    },
    {
      "id": "s507*sub_part_7_sel",
      "chapter": "CHAPTER 6-3",
      "route": "サブ",
      "prompt": "",
      "options": [
        {
          "index": 1,
          "text": "小春的笑容",
          "targetNode": "s507*507_01A",
          "flagGain": {
            "flag": "koh",
            "points": 1
          }
        },
        {
          "index": 2,
          "text": "芦花姐的笑容",
          "targetNode": "s507*507_01B",
          "flagGain": {
            "flag": "rok",
            "points": 1
          }
        }
      ],
      "storage": "507・サブ－選択肢ver1.00.ks",
      "target": "*sub_part_7_sel",
      "targetLine": null
    }
  ],
  "branches": [
    {
      "route": "芳乃",
      "condition": "yos == 1",
      "desc": "芳乃线判定：朝武芳乃好感度满足"
    },
    {
      "route": "蕾娜",
      "condition": "len == 2",
      "desc": "蕾娜线判定：蕾娜好感度达到 2 点"
    },
    {
      "route": "茉子",
      "condition": "mak == 2",
      "desc": "茉子线判定：常陆茉子好感度达到 2 点"
    },
    {
      "route": "丛雨",
      "condition": "mur == 2",
      "desc": "丛雨线判定：丛雨好感度达到 2 点"
    },
    {
      "route": "小春/芦花 (支线)",
      "condition": "sub == 1",
      "desc": "支线判定：选择进入鞍马小春或马场芦花分支"
    },
    {
      "route": "普通结局 (NORMAL END)",
      "condition": "else",
      "desc": "未进入任何角色线路时的结局"
    }
  ],
  "flags": {
    "koh": [
      [
        "s507*sub_part_7_sel",
        1,
        1
      ]
    ],
    "len": [
      [
        "s010*com_part_10_sel",
        1,
        1
      ],
      [
        "s010*010_02A_sel",
        2,
        1
      ]
    ],
    "mak": [
      [
        "s006*com_part_6_sel",
        2,
        1
      ],
      [
        "s010*010_01com_sel",
        2,
        1
      ]
    ],
    "mur": [
      [
        "s010*010_01com_sel",
        3,
        1
      ],
      [
        "s010*010_02com_sel",
        2,
        1
      ]
    ],
    "rok": [
      [
        "s507*sub_part_7_sel",
        2,
        1
      ]
    ],
    "sub": [
      [
        "s001*com_part_1_sel",
        1,
        1
      ],
      [
        "s012*com_part_12_sel",
        2,
        1
      ]
    ],
    "yos": [
      [
        "s010*010_02A_sel",
        1,
        1
      ],
      [
        "s014*com_part_14_sel",
        1,
        1
      ]
    ]
  },
  "chain": {
    "s001*001_01A": "s001*001_01com",
    "s001*001_01B": "s001*001_01com",
    "s001*001_01com": "s002*com_part_2",
    "s001*com_part_1": "s001*com_part_1_sel",
    "s001*com_part_1_sel": [
      "s001*001_01A",
      "s001*001_01B"
    ],
    "s001*com_part_1_sel:s001*001_01A": [
      "select",
      1
    ],
    "s001*com_part_1_sel:s001*001_01B": [
      "select",
      2
    ],
    "s002*com_part_2": "s003*com_part_3",
    "s003*com_part_3": "s004*com_part_4",
    "s004*chapter2-2": "s005*com_part_5",
    "s004*com_part_4": "s004*chapter2-2",
    "s005*chapter2-4": "s006*com_part_6",
    "s005*com_part_5": "s005*chapter2-4",
    "s006*006_01A": "s006*006_01com",
    "s006*006_01B": "s006*006_01com",
    "s006*006_01com": "s007*com_part_7",
    "s006*com_part_6": "s006*com_part_6_sel",
    "s006*com_part_6_sel": [
      "s006*006_01A",
      "s006*006_01B"
    ],
    "s006*com_part_6_sel:s006*006_01A": [
      "select",
      1
    ],
    "s006*com_part_6_sel:s006*006_01B": [
      "select",
      2
    ],
    "s007*com_part_7": "s008*com_part_8",
    "s008*com_part_8": "s009*com_part_9",
    "s009*com_part_9": "s010*com_part_10",
    "s010*010_01A": "s010*010_01com",
    "s010*010_01B": "s010*010_01com",
    "s010*010_01com": "s010*010_01com_sel",
    "s010*010_01com_sel": [
      "s010*010_02A",
      "s010*010_02B",
      "s010*010_02C"
    ],
    "s010*010_01com_sel:s010*010_02A": [
      "select",
      1
    ],
    "s010*010_01com_sel:s010*010_02B": [
      "select",
      2
    ],
    "s010*010_01com_sel:s010*010_02C": [
      "select",
      3
    ],
    "s010*010_02A": "s010*010_02A_sel",
    "s010*010_02A_sel": [
      "s010*010_03A",
      "s010*010_03B"
    ],
    "s010*010_02A_sel:s010*010_03A": [
      "select",
      1
    ],
    "s010*010_02A_sel:s010*010_03B": [
      "select",
      2
    ],
    "s010*010_02B": "s010*010_02com",
    "s010*010_02C": "s010*010_02com",
    "s010*010_02com": "s010*010_02com_sel",
    "s010*010_02com_sel": [
      "s010*010_06A",
      "s010*010_06B"
    ],
    "s010*010_02com_sel:s010*010_06A": [
      "select",
      1
    ],
    "s010*010_02com_sel:s010*010_06B": [
      "select",
      2
    ],
    "s010*010_03A": "s010*010_03com",
    "s010*010_03B": "s010*010_03com",
    "s010*010_03com": "s010*010_02com",
    "s010*010_05com": "s011*com_part_11",
    "s010*010_06A": "s010*010_05com",
    "s010*010_06B": "s010*010_06B_jmp",
    "s010*010_06B_jmp": [
      "s010*010_05com",
      "s010*010_06C"
    ],
    "s010*010_06B_jmp:s010*010_05com": [
      "branch",
      "mur != 2"
    ],
    "s010*010_06B_jmp:s010*010_06C": [
      "branch",
      null
    ],
    "s010*010_06C": "s010*010_05com",
    "s010*com_part_10": "s010*com_part_10_sel",
    "s010*com_part_10_sel": [
      "s010*010_01A",
      "s010*010_01B"
    ],
    "s010*com_part_10_sel:s010*010_01A": [
      "select",
      1
    ],
    "s010*com_part_10_sel:s010*010_01B": [
      "select",
      2
    ],
    "s011*com_part_11": "s012*com_part_12",
    "s012*012_01A": "s012*012_01com",
    "s012*012_01B": "s012*012_01com",
    "s012*012_01com": "s013*com_part_13",
    "s012*com_part_12": "s012*com_part_12_sel",
    "s012*com_part_12_sel": [
      "s012*012_01A",
      "s012*012_01B"
    ],
    "s012*com_part_12_sel:s012*012_01A": [
      "select",
      1
    ],
    "s012*com_part_12_sel:s012*012_01B": [
      "select",
      2
    ],
    "s013*com_part_13": "s013*com_part_13_jmp",
    "s013*com_part_13_jmp": [
      "s013*mak_com013_1",
      "s013*mak_com013_2"
    ],
    "s013*com_part_13_jmp:s013*mak_com013_1": [
      "branch",
      "mak == 2"
    ],
    "s013*com_part_13_jmp:s013*mak_com013_2": [
      "branch",
      null
    ],
    "s013*mak_com013_1": "s013*mak_com013_2",
    "s013*mak_com013_2": "s014*com_part_14",
    "s014*014_01A": "s014*014_01com",
    "s014*014_01B": "s014*014_01com",
    "s014*014_01com": "s014*014_01jmp",
    "s014*014_01jmp": [
      "s014*com_part_len",
      "s014*014_02"
    ],
    "s014*014_01jmp:s014*014_02": [
      "branch",
      null
    ],
    "s014*014_01jmp:s014*com_part_len": [
      "branch",
      "len == 2"
    ],
    "s014*014_02": "s015*com_part_15",
    "s014*com_part_14": "s014*com_part_14_sel",
    "s014*com_part_14_sel": [
      "s014*014_01A",
      "s014*014_01B"
    ],
    "s014*com_part_14_sel:s014*014_01A": [
      "select",
      1
    ],
    "s014*com_part_14_sel:s014*014_01B": [
      "select",
      2
    ],
    "s015*015_01B": "s015*com_part_15_jmp2",
    "s015*com_part_15": "s015*com_part_15_jmp1",
    "s015*com_part_15_jmp1": [
      "s015*com_part_yos",
      "s015*com_part_mak",
      "s015*015_01B"
    ],
    "s015*com_part_15_jmp1:s015*015_01B": [
      "branch",
      null
    ],
    "s015*com_part_15_jmp1:s015*com_part_mak": [
      "branch",
      "mak == 2"
    ],
    "s015*com_part_15_jmp1:s015*com_part_yos": [
      "branch",
      "yos == 2"
    ],
    "s015*com_part_15_jmp2": [
      "s015*com_part_mur",
      "s015*com_part_sub",
      "s015*com_part_end"
    ],
    "s015*com_part_15_jmp2:s015*com_part_end": [
      "branch",
      null
    ],
    "s015*com_part_15_jmp2:s015*com_part_mur": [
      "branch",
      "mur == 2"
    ],
    "s015*com_part_15_jmp2:s015*com_part_sub": [
      "branch",
      "sub == 2 && .checkAnyClear"
    ],
    "s100*yos_part_0": "s101*yos_part_1",
    "s101*yos_part_1": "s102*yos_part_2",
    "s102*yos_part_2": "s103*yos_part_3",
    "s103*yos_part_3": "s104*yos_part_4",
    "s104*yos_part_4": "s105*yos_part_5",
    "s105*yos_part_5": "s106*yos_part_6",
    "s106*yos_part_6": "s107*yos_part_7",
    "s107*chapter54yos": "s107*chapter55yos",
    "s107*chapter55yos": "s108*yos_part_8",
    "s107*yos_part_7": "s107*chapter54yos",
    "s108*yos_part_8": "s109*yos_part_9",
    "s109*yos_part_9": "s110*yos_part_10",
    "s110*yos_part_10": "s111*yos_part_11",
    "s111*yos_part_11": "s112*yos_part_12",
    "s112*yos_part_12": "s113*yos_part_13",
    "s113*yos_part_13": "s114*yos_part_14",
    "s200*mak_part_0": "s201*mak_part_1",
    "s201*mak_part_1": "s202*mak_part_2",
    "s202*chapter43mak": "s203*mak_part_3",
    "s202*mak_part_2": "s202*chapter43mak",
    "s203*mak_part_3": "s204*mak_part_4",
    "s204*mak_part_4": "s205*mak_part_5",
    "s205*mak_part_5": "s206*mak_part_6",
    "s206*chapter62mak": "s206*chapter63mak",
    "s206*chapter63mak": "s207*mak_part_7",
    "s206*mak_part_6": "s206*chapter62mak",
    "s207*chapter65mak": "s208*mak_part_8",
    "s207*mak_part_7": "s207*chapter65mak",
    "s208*mak_part_8": "s209*mak_part_9",
    "s209*mak_part_9": "s210*mak_part_10",
    "s301*mur_part_01": "s302*mur_part_02",
    "s302*chapter43mur": "s303*mur_part_03",
    "s302*mur_part_02": "s302*chapter43mur",
    "s303*mur_part_03": "s304*mur_part_04",
    "s304*mur_part_04": "s305*mur_part_05",
    "s305*chapter53mur": "s306*mur_part_06",
    "s305*mur_part_05": "s305*chapter53mur",
    "s306*mur_part_06": "s307*mur_part_07",
    "s307*mur_part_07": "s308*mur_part_08",
    "s308*chapter63mur": "s309*mur_part_09",
    "s308*mur_part_08": "s308*chapter63mur",
    "s309*mur_part_09": "s310*mur_part_10",
    "s310*chapter72mur": "s310*chapter73mur",
    "s310*chapter73mur": "s311*mur_part_11",
    "s310*mur_part_10": "s310*chapter72mur",
    "s311*mur_part_11": "s312*mur_part_12",
    "s312*mur_part_12": "s313*mur_part_13",
    "s313*chapter84mur": "s314*mur_part_14",
    "s313*mur_part_13": "s313*chapter84mur",
    "s314*mur_part_14": "s315*mur_part_15",
    "s315*chapter92mur": "s316*mur_part_16",
    "s315*mur_part_15": "s315*chapter92mur",
    "s414*len_part_0": "s415*len_part_1",
    "s415*len_part_1": "s416*len_part_2",
    "s416*len_part_2": "s417*len_part_3",
    "s417*len_part_3": "s418*len_part_4",
    "s418*len_part_4": "s419*len_part_5",
    "s419*len_part_5": "s420*len_part_6",
    "s420*len_part_6": "s421*len_part_7",
    "s421*len_part_7": "s422*len_part_8",
    "s422*len_part_8": "s423*len_part_9",
    "s423*len_part_9": "s424*len_part_10",
    "s424*len_part_10": "s425*len_part_11",
    "s425*len_part_11": "s426*len_part_12",
    "s426*len_part_12": "s427*len_part_13",
    "s427*len_part_13": "s428*len_part_14",
    "s501*sub_part_1": "s502*sub_part_2",
    "s502*sub_part_2": "s503*sub_part_3",
    "s503*sub_part_3": "s504*sub_part_4",
    "s504*chapter45sub": "s505*sub_part_5",
    "s504*sub_part_4": "s504*chapter45sub",
    "s505*sub_part_5": "s506*sub_part_6",
    "s506*sub_part_6": "s507*sub_part_7",
    "s507*507_01A": "s508a*sub_part_8a",
    "s507*507_01B": "s508b*sub_part_8b",
    "s507*chapter62sub": "s507*chapter63sub",
    "s507*chapter63sub": "s507*sub_part_7_sel",
    "s507*sub_part_7": "s507*chapter62sub",
    "s507*sub_part_7_sel": [
      "s507*507_01A",
      "s507*507_01B"
    ],
    "s507*sub_part_7_sel:s507*507_01A": [
      "select",
      1
    ],
    "s507*sub_part_7_sel:s507*507_01B": [
      "select",
      2
    ],
    "s508a*sub_part_8a": "s509*sub_part_9",
    "s508b*chapter65rok": "s509*sub_part_9",
    "s508b*sub_part_8b": "s508b*chapter65rok",
    "s509*509_koh": "s511*koh_part_1",
    "s509*509_rok": "s521*rok_part_1",
    "s509*sub_part_9": "s509*sub_part_9_jmp",
    "s509*sub_part_9_jmp": [
      "s509*509_koh",
      "s509*509_rok"
    ],
    "s509*sub_part_9_jmp:s509*509_koh": [
      "branch",
      "koh == 1"
    ],
    "s509*sub_part_9_jmp:s509*509_rok": [
      "branch",
      "rok == 1"
    ],
    "s511*chapter82koh": "s512*koh_part_2",
    "s511*koh_part_1": "s511*chapter82koh",
    "s512*chapter84koh": "s512*chapterEPkoh",
    "s512*koh_part_2": "s512*chapter84koh",
    "s521*rok_part_1": "s522*rok_part_2",
    "s522*rok_part_2": "s522*chapterEProk"
  }
};
export var routes = ["共通", "芳乃", "茉子", "ムラサメ", "レナ", "サブ"];
export var choices = [
  {
    "id": "s001*com_part_1_sel",
    "chapter": "CHAPTER 1-1",
    "route": "共通",
    "prompt": "【芦花】「还是说我脸上沾了什么东西？」",
    "options": [
      {
        "index": 1,
        "text": "说实话",
        "targetNode": "s001*001_01A",
        "flagGain": {
          "flag": "sub",
          "points": 1
        }
      },
      {
        "index": 2,
        "text": "敷衍过去",
        "targetNode": "s001*001_01B",
        "flagGain": null
      }
    ],
    "storage": "001・アーサー王ver1.07.ks",
    "target": "*com_part_1_sel",
    "targetLine": 107
  },
  {
    "id": "s006*com_part_6_sel",
    "chapter": "CHAPTER 2-5",
    "route": "共通",
    "prompt": "【茉子】「那我想问下，如果让你在穗织和大城市之间做选择，你怎么选？选大城市吗？」",
    "options": [
      {
        "index": 1,
        "text": "还是觉得城市好",
        "targetNode": "s006*006_01A",
        "flagGain": null
      },
      {
        "index": 2,
        "text": "不好说",
        "targetNode": "s006*006_01B",
        "flagGain": {
          "flag": "mak",
          "points": 1
        }
      }
    ],
    "storage": "006・レナ登場ver1.03.ks",
    "target": "*com_part_6_sel",
    "targetLine": 3458
  },
  {
    "id": "s010*com_part_10_sel",
    "chapter": "CHAPTER 3-2",
    "route": "共通",
    "prompt": "【蕾娜】「怎么样呀，将臣。有没有哪里奇怪？」",
    "options": [
      {
        "index": 1,
        "text": "我觉得很可爱",
        "targetNode": "s010*010_01A",
        "flagGain": {
          "flag": "len",
          "points": 1
        }
      },
      {
        "index": 2,
        "text": "看着不奇怪",
        "targetNode": "s010*010_01B",
        "flagGain": null
      }
    ],
    "storage": "010・リフレッシュver1.04.ks",
    "target": "*com_part_10_sel",
    "targetLine": 5489
  },
  {
    "id": "s010*010_01com_sel",
    "chapter": "CHAPTER 3-2",
    "route": "共通",
    "prompt": "【廉太郎】「你准备去哪边？」",
    "options": [
      {
        "index": 1,
        "text": "钓鱼",
        "targetNode": "s010*010_02A",
        "flagGain": null
      },
      {
        "index": 2,
        "text": "挖野菜",
        "targetNode": "s010*010_02B",
        "flagGain": {
          "flag": "mak",
          "points": 1
        }
      },
      {
        "index": 3,
        "text": "单独行动",
        "targetNode": "s010*010_02C",
        "flagGain": {
          "flag": "mur",
          "points": 1
        }
      }
    ],
    "storage": "010・リフレッシュver1.04.ks",
    "target": "*010_01com_sel",
    "targetLine": 5896
  },
  {
    "id": "s010*010_02A_sel",
    "chapter": "CHAPTER 3-2",
    "route": "共通",
    "prompt": "【廉太郎】「话说，可以让我去教巫女大人吗？」",
    "options": [
      {
        "index": 1,
        "text": "不行",
        "targetNode": "s010*010_03A",
        "flagGain": {
          "flag": "yos",
          "points": 1
        }
      },
      {
        "index": 2,
        "text": "好吧",
        "targetNode": "s010*010_03B",
        "flagGain": {
          "flag": "len",
          "points": 1
        }
      }
    ],
    "storage": "010・リフレッシュver1.04.ks",
    "target": "*010_02A_sel",
    "targetLine": 5909
  },
  {
    "id": "s010*010_02com_sel",
    "chapter": "CHAPTER 3-2",
    "route": "共通",
    "prompt": "不过，那么大一座山，竟然都让她给找到了……",
    "options": [
      {
        "index": 1,
        "text": "用语言感谢",
        "targetNode": "s010*010_06A",
        "flagGain": null
      },
      {
        "index": 2,
        "text": "摸头",
        "targetNode": "s010*010_06B",
        "flagGain": {
          "flag": "mur",
          "points": 1
        }
      }
    ],
    "storage": "010・リフレッシュver1.04.ks",
    "target": "*010_02com_sel",
    "targetLine": 6372
  },
  {
    "id": "s012*com_part_12_sel",
    "chapter": "CHAPTER 3-4",
    "route": "共通",
    "prompt": "【小春】「和以前相比肯定更能帮上忙了」",
    "options": [
      {
        "index": 1,
        "text": "有点担心",
        "targetNode": "s012*012_01A",
        "flagGain": null
      },
      {
        "index": 2,
        "text": "相信小春",
        "targetNode": "s012*012_01B",
        "flagGain": {
          "flag": "sub",
          "points": 1
        }
      }
    ],
    "storage": "012・病床ver1.06.ks",
    "target": "*com_part_12_sel",
    "targetLine": 7316
  },
  {
    "id": "s014*com_part_14_sel",
    "chapter": "CHAPTER 3-6",
    "route": "共通",
    "prompt": "【芳乃】「您怎么越说越不确定，不要吓我啊。说得我都越来越担心了……」",
    "options": [
      {
        "index": 1,
        "text": "让她放心",
        "targetNode": "s014*014_01A",
        "flagGain": {
          "flag": "yos",
          "points": 1
        }
      },
      {
        "index": 2,
        "text": "少说两句",
        "targetNode": "s014*014_01B",
        "flagGain": null
      }
    ],
    "storage": "014・合体編ver1.03.ks",
    "target": "*com_part_14_sel",
    "targetLine": 8394
  },
  {
    "id": "s507*sub_part_7_sel",
    "chapter": "CHAPTER 6-3",
    "route": "サブ",
    "prompt": "",
    "options": [
      {
        "index": 1,
        "text": "小春的笑容",
        "targetNode": "s507*507_01A",
        "flagGain": {
          "flag": "koh",
          "points": 1
        }
      },
      {
        "index": 2,
        "text": "芦花姐的笑容",
        "targetNode": "s507*507_01B",
        "flagGain": {
          "flag": "rok",
          "points": 1
        }
      }
    ],
    "storage": "507・サブ－選択肢ver1.00.ks",
    "target": "*sub_part_7_sel",
    "targetLine": null
  }
];
export var branches = [
  {
    "route": "芳乃",
    "condition": "yos == 1",
    "desc": "芳乃线判定：朝武芳乃好感度满足"
  },
  {
    "route": "蕾娜",
    "condition": "len == 2",
    "desc": "蕾娜线判定：蕾娜好感度达到 2 点"
  },
  {
    "route": "茉子",
    "condition": "mak == 2",
    "desc": "茉子线判定：常陆茉子好感度达到 2 点"
  },
  {
    "route": "丛雨",
    "condition": "mur == 2",
    "desc": "丛雨线判定：丛雨好感度达到 2 点"
  },
  {
    "route": "小春/芦花 (支线)",
    "condition": "sub == 1",
    "desc": "支线判定：选择进入鞍马小春或马场芦花分支"
  },
  {
    "route": "普通结局 (NORMAL END)",
    "condition": "else",
    "desc": "未进入任何角色线路时的结局"
  }
];
export default flowchart_data;
