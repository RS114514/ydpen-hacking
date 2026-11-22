# -*- coding: utf-8 -*-
import json

v4_path = '/Volumes/500GB/Ydpen/data/script_vol4_summer.json'
with open(v4_path, 'r', encoding='utf-8') as f:
    v4 = json.load(f)

# 8个章节对应的专属选择分支、现场调查、风物图鉴与章末小测
vol4_extras = {
  "ch29": {
    "quiz": {
      "id": "quiz_ch29",
      "question": "赛艇运动在八人单桨划行中，影响提速最关键的物理力学因素是什么？",
      "options": [
        {"text": "全员入水相位与力矩输出的高度同步", "correct": True},
        {"text": "桨手单人手臂绝对力量的最大化", "correct": False},
        {"text": "尽可能提高桨叶在空中的挥动频率", "correct": False}
      ],
      "explanation": "赛艇讲究合力效率。八人单桨的相位同步能最小化艇身颠簸俯仰，减少水阻损失。"
    },
    "choiceNodes": [
      {
        "id": "ch29_c1",
        "prompt": "池雨曦问及晨航拍摄视角，如何决断？",
        "options": [
          {"text": "低空贴水侧逆光，抓水花质感", "effects": {"beauty": 5, "bond": 4}, "reply": "池雨曦点头：“水花和晨曦的光影对比，画面张力很足。”"},
          {"text": "垂直俯拍全艇划桨韵律几何", "effects": {"truth": 4, "beauty": 3}, "reply": "她记录道：“从上往下看，八支桨像机械钟表的齿轮一样精密。”"},
          {"text": "只在岸边用长焦跟拍特写", "effects": {"bond": 1}, "reply": "她若有所思：“稳妥是稳妥，不过少了些水上破浪的临场感。”"}
        ]
      }
    ],
    "investigations": [
      {
        "id": "ch29_inv_dock",
        "name": "白马湖赛艇码头浮桥",
        "place": "赛艇基地水上平台",
        "lines": [
          {"speaker": "", "text": "晨雾尚未散尽，浮桥随着湖浪轻微起伏，防滑木板上凝结着细密的露珠。"},
          {"speaker": "我", "text": "碳纤维赛艇平稳地架在下水导轨上，艇身修长如梭。"}
        ]
      }
    ],
    "codex": [
      {
        "id": "codex_baimahu_rowing",
        "title": "白马湖水上赛艇传统",
        "category": "风物体育",
        "lines": [
          {"speaker": "", "text": "白马湖水域开阔风平浪静，为浙江省著名的赛艇与皮划艇水上训练基地。"},
          {"speaker": "", "text": "春晖学子常年在湖面进行晨训，将力学知识与竞技体育深度交融。"}
        ]
      }
    ]
  },
  "ch30": {
    "quiz": {
      "id": "quiz_ch30",
      "question": "轻木桁架承重结构中，为何三角桁架比四边形结构具有更强的承载稳定性？",
      "options": [
        {"text": "三角形边长确定后形状唯一，具有几何不变性", "correct": True},
        {"text": "三角形使用的木料面积比四边形大", "correct": False},
        {"text": "三角形节点处不需要涂抹任何胶水", "correct": False}
      ],
      "explanation": "在结构力学中，三角形是唯一的几何不可变图形，能有效将弯矩转化为轴向拉压应力。"
    },
    "choiceNodes": [
      {
        "id": "ch30_c1",
        "prompt": "模型加载到了14公斤临界点，如何排查异响？",
        "options": [
          {"text": "轻触上弦杆检测微应变振动", "effects": {"truth": 5, "body": 2}, "reply": "指尖感知到应力传导平稳，木纤维尚未达到剪切极限。"},
          {"text": "减慢砝码递增速率，观察跨中挠度", "effects": {"truth": 4, "bond": 3}, "reply": "池雨曦端着游标卡尺快速读数：“下垂仅1.2毫米，结构依然安全！”"},
          {"text": "立刻终止加载避免模型崩解", "effects": {"bond": -2}, "reply": "周老师笑道：“做实验要有探底的勇气，春晖人不惧破纪录。”"}
        ]
      }
    ],
    "investigations": [
      {
        "id": "ch30_inv_truss",
        "name": "35克轻木桥极限受压测试台",
        "place": "物理工程实验室",
        "lines": [
          {"speaker": "", "text": "精密电子拉压试验机屏幕上，实时荷载曲线正以斜率极大的直线稳步上升。"},
          {"speaker": "池雨曦", "text": "仅凭三十五克轻木与白乳胶，竟然稳稳扛住了超越自重四百倍的荷载。"}
        ]
      }
    ],
    "codex": [
      {
        "id": "codex_luban_truss",
        "title": "春晖木构力学传统",
        "category": "科学实验",
        "lines": [
          {"speaker": "", "text": "承袭近代工程教育先驱的知行合一理念，春晖物理社每年举办木结构极限承重竞赛。"},
          {"speaker": "", "text": "致敬老校区百年前大礼堂与一字楼巧夺天工的榫卯木构体系。"}
        ]
      }
    ]
  },
  "ch31": {
    "quiz": {
      "id": "quiz_ch31",
      "question": "微电影后期混音工程中，为何要单独为环境底噪（Ambience）保留独立音轨？",
      "options": [
        {"text": "避免剪辑切口处出现声场突变撕裂感，维持时空连续性", "correct": True},
        {"text": "让导出的音频文件体积翻倍增加", "correct": False},
        {"text": "盖过对白中演员发音不标准的杂音", "correct": False}
      ],
      "explanation": "底噪轨（Room Tone）是声音设计的胶水，能平滑对白剪辑点，构建身临其境的真实空间感。"
    },
    "choiceNodes": [
      {
        "id": "ch31_c1",
        "prompt": "通宵机房里，最棘手的一段白马湖风声底噪如何处理？",
        "options": [
          {"text": "保留原始风声与松针沙沙作响的微弱细节", "effects": {"beauty": 5, "bond": 4}, "reply": "池雨曦摘下监听耳机：“这就是夜晚真实的湖畔，一点也不刺耳。”"},
          {"text": "使用AI算法彻底消除所有环境杂音", "effects": {"truth": -3}, "reply": "声音变得像真空一样干瘪，失去了自然的生命力。"},
          {"text": "在风声底下垫入极轻柔的钢琴独奏", "effects": {"beauty": 4}, "reply": "琴键如雨水滴落湖面，与呼啸的风声产生出动人的和弦。"}
        ]
      }
    ]
  },
  "ch32": {
    "quiz": {
      "id": "quiz_ch32",
      "question": "1922年12月2日春晖中学举行开学典礼时，全校师生共同齐唱的校歌原曲出自哪位大师之手？",
      "options": [
        {"text": "李叔同（弘一法师）", "correct": True},
        {"text": "丰子恺", "correct": False},
        {"text": "夏丏尊", "correct": False}
      ],
      "explanation": "李叔同先生将孟郊《游子吟》谱曲，旋律温厚深沉，成为春晖百年开校的精神元音。"
    },
    "choiceNodes": [
      {
        "id": "ch32_c1",
        "prompt": "【历史大副本】操控经亨颐校长步上草堂讲台，第一句话如何开篇？",
        "options": [
          {"text": "‘诸君，今日白马湖之水，开百代未有之清流！’", "effects": {"truth": 6, "courage": 5}, "reply": "台下数百名首届学子神情肃穆，湖风拂动讲台四周的松枝素幡。"},
          {"text": "宣读宁波与上虞各界捐资筑校之艰辛账册", "effects": {"truth": 4}, "reply": "账目分厘不爽，经公治校求真笃实之风骨令满座动容。"},
          {"text": "邀夏丏尊与丰子恺先生同登讲台齐诵", "effects": {"beauty": 5, "bond": 4}, "reply": "先生们并肩而立，白马湖畔自此汇聚了整整一个时代的文学星芒。"}
        ]
      }
    ]
  },
  "ch33": {
    "quiz": {
      "id": "quiz_ch33",
      "question": "在纪录片蒙太奇剪辑中，连接1922年老照片与2026年航拍镜头最考究的视听转场方式是？",
      "options": [
        {"text": "基于象山山脊轮廓与白马湖水岸线的位置匹配剪辑", "correct": True},
        {"text": "炫目的三维旋转与像素破碎马赛克特效", "correct": False},
        {"text": "直接粗暴硬切黑屏五秒钟", "correct": False}
      ],
      "explanation": "匹配剪辑（Match Cut）通过形状、构图或动作的一致性跨越百年时空，具有极高的电影美学品质。"
    },
    "choiceNodes": [
      {
        "id": "ch33_c1",
        "prompt": "定稿渲染导出的最后一刻，片尾署名顺序如何敲定？",
        "options": [
          {"text": "‘谨将此片献给白马湖畔走过的一百二十代春晖人’", "effects": {"beauty": 5, "bond": 5}, "reply": "池雨曦长舒一口气：“不需要凸显个人名字，这就是最好的落款。”"},
          {"text": "按社团成员与指导老师名单标准排序", "effects": {"truth": 3}, "reply": "名单齐备工整，严谨细致记录了每一位参与者的付出。"},
          {"text": "以夏丏尊手泽‘晖光与日月日新’作为终画", "effects": {"beauty": 6, "truth": 4}, "reply": "墨宝缓缓浮现，历史与当下在此刻完成永恒的锁合。"}
        ]
      }
    ]
  },
  "ch34": {
    "quiz": {
      "id": "quiz_ch34",
      "question": "大礼堂终极大首映中，老校友们听到哪一声历史音效时全体肃立？",
      "options": [
        {"text": "老校舍顶层百年古铜钟的双锤两短一长韵律", "correct": True},
        {"text": "现代广播室的标准电子下课音乐", "correct": False},
        {"text": "运动场上的电动发令枪声", "correct": False}
      ],
      "explanation": "1922年老校钟特有的双锤击打声律承载了烽火西迁与复员回响，是春晖学子永恒的精神图腾。"
    },
    "choiceNodes": [
      {
        "id": "ch34_c1",
        "prompt": "大幕降下掌声雷动，池雨曦在侧幕问你此时感受？",
        "options": [
          {"text": "‘我们没有把历史演成戏，历史自己走了出来。’", "effects": {"truth": 6, "bond": 5}, "reply": "池雨曦眼中微光闪动：“是的，真诚是唯一的答案。”"},
          {"text": "‘终于可以好好回宿舍睡上整整两天了。’", "effects": {"body": 5}, "reply": "她忍不住笑出声：“西雨楼陈师傅早就在门口备好热水了。”"},
          {"text": "‘微电影虽然结束了，但高二才刚刚过半呢。’", "effects": {"truth": 4}, "reply": "她望向窗外璀璨的校园灯火：“前路还很长，我们继续走。”"}
        ]
      }
    ]
  },
  "ch35": {
    "quiz": {
      "id": "quiz_ch35",
      "question": "春戊掌上终端在白马湖畔完成全部数据归档后，最终显示的核心文脉算子是？",
      "options": [
        {"text": "与时俱进 · 知行合一", "correct": True},
        {"text": "墨守成规 · 照本宣科", "correct": False},
        {"text": "孤芳自赏 · 独善其身", "correct": False}
      ],
      "explanation": "经亨颐先生为春晖确立的立校基石正是‘与时俱进’，与白马湖先贤的实干求真精神一脉相承。"
    },
    "choiceNodes": [
      {
        "id": "ch35_c1",
        "prompt": "湖畔木栈道上，终端跳出最终时空波谱，是否封存归档？",
        "options": [
          {"text": "将百廿全部数据注入校史数字方舟永久存续", "effects": {"truth": 6, "beauty": 5}, "reply": "终端蓝光流转，化作一颗温润的数据晶石融入校史馆云端。"},
          {"text": "保留本地离线副本随身携带", "effects": {"truth": 4}, "reply": "数据紧凑存入随身芯片，成为青春最厚重的底片。"}
        ]
      }
    ]
  },
  "ch36": {
    "quiz": {
      "id": "quiz_ch36",
      "question": "春晖中学高二结业成人礼面向象山宣誓，其象征意义在于？",
      "options": [
        {"text": "立足象山笃实之地，眼望白马湖开阔之境，承担家国使命", "correct": True},
        {"text": "单纯为了在山前留下一张班级大合影", "correct": False},
        {"text": "测试学生登山长跑体能达标情况", "correct": False}
      ],
      "explanation": "‘仰山’‘望湖’是春晖的地理意象，更是学子立身笃实、胸襟宏阔的人格象征。"
    },
    "choiceNodes": [
      {
        "id": "ch36_c1",
        "prompt": "报告厅顶层露台上面对象山晚霞，全篇收官一语由谁道出？",
        "options": [
          {"text": "两人并肩同声：‘晖光日新，生生不息！’", "effects": {"bond": 8, "beauty": 6, "truth": 6}, "reply": "晚风拂动衣角，象山的苍翠与落日的金辉将两道年轻的身影映在白马湖上。"},
          {"text": "池雨曦面向镜头，留下全剧唯一一次正面微笑", "effects": {"bond": 6, "beauty": 8}, "reply": "纯粹而明亮，没有一丝刻意雕琢的痕迹。"},
          {"text": "默默按下快门，记录下整座校园沐浴在夕阳中的全景", "effects": {"beauty": 7, "truth": 5}, "reply": "白马湖水光潋滟，百年光阴在这一刻化作永恒的诗篇。"}
        ]
      }
    ]
  }
}

for ch in v4['chapters']:
    cid = ch['id']
    ex = vol4_extras.get(cid, {})
    if ex.get('quiz') and not ch.get('quiz'):
        ch['quiz'] = ex['quiz']
    if ex.get('choiceNodes'):
        ch['choiceNodes'] = ex['choiceNodes']
        # 确保 flow 中包含 choiceNode
        has_choice = any(x.get('type') == 'choice' for x in ch.get('flow', []))
        if not has_choice:
            cn = ex['choiceNodes'][0]
            ch.setdefault('flow', []).append({
                'type': 'choice',
                'id': cn['id'],
                'prompt': cn['prompt'],
                'options': cn['options']
            })
    if ex.get('investigations'):
        for inv in ex['investigations']:
            ch.setdefault('investigations', []).append(inv)
    if ex.get('codex'):
        for cx in ex['codex']:
            ch.setdefault('codex', []).append(cx)

with open(v4_path, 'w', encoding='utf-8') as f:
    json.dump(v4, f, ensure_ascii=False, indent=2)

print("Vol 4 enriched successfully with quizzes and choiceNodes.")
