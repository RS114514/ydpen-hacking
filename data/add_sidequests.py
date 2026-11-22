# -*- coding: utf-8 -*-
import json

# 1. 注入第一卷支线委托
v1_path = '/Volumes/500GB/Ydpen/data/script_vol1_autumn.json'
with open(v1_path, 'r', encoding='utf-8') as f:
    v1 = json.load(f)

v1_sq_map = {
    "ch01": {
        "id": "sq_v1_01",
        "name": "支线委托·景行路落叶拓印",
        "place": "西雨楼前石阶",
        "lines": [
            {"speaker": "", "text": "美术社的同学正蹲在石阶旁，小心翼翼地把刚落下的梧桐叶按在宣纸上。"},
            {"speaker": "美术生", "text": "同学，能帮我扶住纸角吗？晨风有点大，墨线容易晕开。"},
            {"speaker": "我", "text": "没问题。用手掌压平叶柄处，叶脉拓出来最清楚。"},
            {"speaker": "池雨曦", "text": "梧桐叶的脉络就像春晖的百年路，一根主干分出万千生机。"}
        ],
        "clue": {"id": "C_SQ1_01", "name": "梧桐叶脉素描", "desc": "晨风中拓印的百年法国梧桐叶脉，线条苍劲舒展。"},
        "effects": {"beauty": 4, "bond": 2}
    },
    "ch02": {
        "id": "sq_v1_02",
        "name": "支线委托·整理老磁带标签",
        "place": "新逸夫楼配套报告厅3F",
        "lines": [
            {"speaker": "", "text": "铁皮柜角落里堆着一箱二十年前的DVCAM广播级磁带，盒盖上的油性笔字迹已有些模糊。"},
            {"speaker": "我", "text": "找来标签纸和无酸胶带，按年份从2004年重新分类贴标归档。"},
            {"speaker": "池雨曦", "text": "每一盘磁带都记录着一段春晖的青春，整理它们是对前人最好的致敬。"}
        ],
        "clue": {"id": "C_SQ1_02", "name": "老磁带手写索引", "desc": "2004-2010年春晖校园新闻与微电影母带手工检索卡。"},
        "effects": {"truth": 4, "energy": -2}
    },
    "ch03": {
        "id": "sq_v1_03",
        "name": "支线委托·第四象限小圆盒配发",
        "place": "学苑食堂后厨窗口",
        "lines": [
            {"speaker": "", "text": "白发老奶奶正在将腌好的冬菜肉丝分装入透明小圆盒，手边叠着厚厚两摞餐盒。"},
            {"speaker": "白发老奶奶", "text": "孩子们，帮我把盖子压紧。午峰快到了，不能让排队的同学等急了。"},
            {"speaker": "我", "text": "奶奶您歇会儿，我们俩几分钟就能扣完这一箱。"},
            {"speaker": "池雨曦", "text": "‘咔哒’一声扣紧，热气和鲜香全锁在盒子里了。"}
        ],
        "clue": {"id": "C_SQ1_03", "name": "老阿婆的竹笊篱", "desc": "在学苑食堂服役三十年的老式竹编笊篱，浸润着老汤的温润香气。"},
        "effects": {"body": 3, "bond": 3}
    },
    "ch04": {
        "id": "sq_v1_04",
        "name": "支线委托·博文馆铁柜暗锁寻秘",
        "place": "老校区博文馆二楼东首",
        "lines": [
            {"speaker": "", "text": "老铁柜底层夹板后面传来极轻微的松动声，似乎有一块暗隔。"},
            {"speaker": "我", "text": "用手电筒细细照进去，夹层深处有一包用桐油黄纸包裹整齐的长条卷轴。"},
            {"speaker": "池雨曦", "text": "戴上手套取出来，封签写着‘民国时期讲义样本’，完好隔绝了湿气与尘土。"}
        ],
        "clue": {"id": "C_SQ1_04", "name": "防潮油纸讲义", "desc": "夏丏尊先生早年在春晖讲授国文时油印的修辞学参考讲义。"},
        "effects": {"truth": 5, "beauty": 3}
    },
    "ch05": {
        "id": "sq_v1_05",
        "name": "支线委托·消音棉校准测试",
        "place": "报告厅3F配音室",
        "lines": [
            {"speaker": "", "text": "专业配音室内有两处墙面的吸音楔形棉略有松动，录音时低频泛音偏重。"},
            {"speaker": "池雨曦", "text": "左上角这个45度角声学陷阱需要重新拧紧固定螺丝。"},
            {"speaker": "我", "text": "拿起十字螺丝刀将其严密复位，拍手试音，回响时间瞬间降到了理想的0.2秒。"}
        ],
        "clue": {"id": "C_SQ1_05", "name": "声学驻波平衡表", "desc": "手绘录音室声场反射测试曲线，字迹工整严密。"},
        "effects": {"truth": 4, "bond": 3}
    },
    "ch06": {
        "id": "sq_v1_06",
        "name": "支线委托·老钟敲击谱的缺失音阶",
        "place": "老校钟阁楼横梁下",
        "lines": [
            {"speaker": "", "text": "老校钟顶部的悬挂横梁上，除了陈宗修老师的粉笔圆，还刻着半行风化的工尺谱。"},
            {"speaker": "我", "text": "合、四、一、上、尺、工……这是当年清晨击钟时的引子唱念。"},
            {"speaker": "池雨曦", "text": "用铅笔将缺失的后半段拓印下来，音律完整了，钟声才有了灵魂。"}
        ],
        "clue": {"id": "C_SQ1_06", "name": "手抄双锤工尺谱", "desc": "1922年春晖校工晨起击钟依循的传统声律拓片。"},
        "effects": {"beauty": 5, "truth": 3}
    },
    "ch08": {
        "id": "sq_v1_08",
        "name": "支线委托·给阿波罗梳毛添水",
        "place": "一字楼回廊阴凉处",
        "lines": [
            {"speaker": "", "text": "大橘猫阿波罗趴在青砖阶上眯着眼，晒得肚皮暖烘烘的。"},
            {"speaker": "池雨曦", "text": "从包里拿出给它准备的硅胶小梳子，轻轻替它梳理脖颈周围的浮毛。"},
            {"speaker": "我", "text": "把白瓷碗冲洗干净，换上清冽甘甜的白马湖深井过滤水。"},
            {"speaker": "", "text": "阿波罗发出舒坦的呼噜声，伸出肉垫按在分镜本上，留下一个可爱的梅花水印。"}
        ],
        "clue": {"id": "C_SQ1_08", "name": "橘色猫毛书签", "desc": "阿波罗梳下的一缕金橘色绒毛，用透明胶带封装成了精致书签。"},
        "effects": {"bond": 5, "body": 2}
    },
    "ch09": {
        "id": "sq_v1_09",
        "name": "支线委托·大礼堂闸刀触点抛光",
        "place": "大礼堂西侧配电间",
        "lines": [
            {"speaker": "", "text": "大礼堂的老电工师傅正对着备用刀闸叹气，铜触头表面因氧化生成了一层薄薄的铜锈。"},
            {"speaker": "老电工", "text": "同学们，用这块0号细水砂纸蘸一点煤油，轻轻顺着刀刃方向擦拭。"},
            {"speaker": "我", "text": "反复擦拭十几下，露出了耀眼纯正的玫瑰金色纯铜质地。"},
            {"speaker": "池雨曦", "text": "合闸试推，接触电阻降至零点零几欧姆，彩排主路供电万无一失。"}
        ],
        "clue": {"id": "C_SQ1_09", "name": "紫铜抛光残屑", "desc": "擦亮民国时期老剧场配电闸刀留下的紫铜碎末，见证了严谨的工匠风骨。"},
        "effects": {"truth": 5, "body": 3}
    }
}

for ch in v1['chapters']:
    cid = ch['id']
    if cid in v1_sq_map:
        sq = v1_sq_map[cid]
        # 避免重复
        exists = any(x.get('id') == sq['id'] for x in ch.get('investigations', []))
        if not exists:
            ch.setdefault('investigations', []).append(sq)

with open(v1_path, 'w', encoding='utf-8') as f:
    json.dump(v1, f, ensure_ascii=False, indent=2)

print("Volume 1 side quests injected successfully.")

# 2. 注入第四卷支线委托
v4_path = '/Volumes/500GB/Ydpen/data/script_vol4_summer.json'
with open(v4_path, 'r', encoding='utf-8') as f:
    v4 = json.load(f)

v4_sq_map = {
    "ch30": {
        "id": "sq_v4_30",
        "name": "支线委托·鲁班锁微应变检测",
        "place": "仰山新楼物理实验室",
        "lines": [
          {"speaker": "", "text": "周老师正在调试灵敏的惠斯通电桥应变仪，实验台上摆着四组木桁架榫卯接头。"},
          {"speaker": "周老师", "text": "来帮我校准一下第三通道零点，用无水乙醇擦拭应变片接线端子。"},
          {"speaker": "我", "text": "棉签轻轻抹过，仪表读数瞬间归零，灵敏度达到微应变级。"},
          {"speaker": "池雨曦", "text": "榫卯在微受压时的自锁效应在示波器上展现得淋漓尽致。"}
        ],
        "clue": {"id": "C_SQ4_30", "name": "惠斯通电桥记录卡", "desc": "手工绘制的轻木桥榫卯节点应变受力曲线卡。"},
        "effects": {"truth": 5, "body": 2}
    },
    "ch31": {
        "id": "sq_v4_31",
        "name": "支线委托·通宵机房散热排风",
        "place": "新逸夫楼配套报告厅3F机房",
        "lines": [
          {"speaker": "", "text": "通宵渲染四轨4K微电影工程，剪辑主机的GPU温度升高到了78度。"},
          {"speaker": "我", "text": "从设备间搬来大风量低噪排风管，精准对准机箱侧板抽风口。"},
          {"speaker": "池雨曦", "text": "温度十分钟内下降了整整十二度，渲染时间轴走得更加平稳流畅。"}
        ],
        "clue": {"id": "C_SQ4_31", "name": "机房温湿度巡检表", "desc": "通宵坚守机房记录的设备温度控制手账。"},
        "effects": {"truth": 4, "energy": -2}
    },
    "ch32": {
        "id": "sq_v4_32",
        "name": "支线委托·老开校题名录残页复原",
        "place": "校史文献修复室",
        "lines": [
          {"speaker": "", "text": "案台上摊着一张1922年开校师生签到题名录的微缩胶卷扫描件。"},
          {"speaker": "林致远", "text": "边缘有几处名字因当年折痕重叠难辨，需要对比宁波与上虞县志名册逐一甄别。"},
          {"speaker": "我", "text": "这一行小楷隐约辨出是‘经亨颐’与‘陈布雷’的联排落款。"},
          {"speaker": "池雨曦", "text": "每一笔每一划都在诉说着这所学校诞生之初的波澜壮阔。"}
        ],
        "clue": {"id": "C_SQ4_32", "name": "首届学子毛笔签名影本", "desc": "1922年春晖首届开学典礼名师学子亲笔手泽影印件。"},
        "effects": {"truth": 6, "beauty": 4}
    },
    "ch33": {
        "id": "sq_v4_33",
        "name": "支线委托·终剪音频波形核验",
        "place": "报告厅3F配音机房",
        "lines": [
          {"speaker": "", "text": "最后审定微电影全片的第八十四轨环境声，白马湖晨雾与风声的动态电平需要精准压限。"},
          {"speaker": "池雨曦", "text": "戴上监听耳机，第三分二十秒处有一记轻微的电流声爆音。"},
          {"speaker": "我", "text": "放大到采样点级别，用频谱修复画笔将其完美抹除。"},
          {"speaker": "池雨曦", "text": "声音干净了，留白处的宁静与厚重才真正出得来。"}
        ],
        "clue": {"id": "C_SQ4_33", "name": "48kHz终剪工程波形图", "desc": "记录《晖光日新》终版配音与环境声轨严苛参数的混音图谱。"},
        "effects": {"beauty": 5, "truth": 4}
    },
    "ch35": {
        "id": "sq_v4_35",
        "name": "支线委托·木栈道水生植物标本采集",
        "place": "白马湖亲水木栈道",
        "lines": [
          {"speaker": "", "text": "夏日的白马湖畔，荷叶田田，香蒲与芦苇随湖风摇曳。"},
          {"speaker": "生物社社长", "text": "同学，能帮我们用采样夹捞取湖面浮萍与嫩荷幼芽吗？"},
          {"speaker": "我", "text": "稳稳撑住伸缩采样杆，将完好的带露叶片收进恒温标本盒。"},
          {"speaker": "池雨曦", "text": "百年白马湖水滋养出的草木，不仅是风物，更是生生不息的活化石。"}
        ],
        "clue": {"id": "C_SQ4_35", "name": "白马湖荷叶压花标本", "desc": "盛夏白马湖畔采集并精心压制的一枚小荷叶标本，青碧幽香。"},
        "effects": {"beauty": 5, "body": 3}
    }
}

for ch in v4['chapters']:
    cid = ch['id']
    if cid in v4_sq_map:
        sq = v4_sq_map[cid]
        exists = any(x.get('id') == sq['id'] for x in ch.get('investigations', []))
        if not exists:
            ch.setdefault('investigations', []).append(sq)

with open(v4_path, 'w', encoding='utf-8') as f:
    json.dump(v4, f, ensure_ascii=False, indent=2)

print("Volume 4 side quests injected successfully.")
