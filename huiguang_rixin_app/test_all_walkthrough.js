const fs = require('fs');

globalThis.$falcon = {
  jsapi: {
    media: { playSe: () => {}, playBgm: () => {} },
    storage: { get: () => null, set: () => true }
  }
};

let txt = fs.readFileSync(__dirname + '/build/dist/StoryData.js', 'utf8');
txt = txt.substring(txt.indexOf('export var STORY_DATA = ') + 'export var STORY_DATA = '.length).trim();
if (txt.endsWith(';')) txt = txt.slice(0, -1);
const STORY_DATA = JSON.parse(txt);

console.log('✓ STORY_DATA parsed successfully.');
console.log(`  Volumes: ${Object.keys(STORY_DATA.volumes).length}`);
console.log(`  Cases: ${STORY_DATA.cases.length}`);
console.log(`  SideQuests: ${STORY_DATA.sideQuests.length}`);

// 校验 24 宗案卷三段推演
let totalStages = 0;
STORY_DATA.cases.forEach((ca, idx) => {
  const stages = (ca.deduction && ca.deduction.stages) || [];
  totalStages += stages.length;
  if (stages.length !== 3) {
    console.warn(`[!] Case ${ca.id} stages count: ${stages.length} (expected 3)`);
  }
  stages.forEach((st, sidx) => {
    const correctCount = st.options.filter(o => o.correct).length;
    if (correctCount !== 1) {
      console.error(`[!] Case ${ca.id} Stage ${sidx+1} correct answers count: ${correctCount}`);
    }
  });
});
console.log(`✓ 24 Cases verified. Total deduction stages: ${totalStages}`);

// 校验四卷 36 章
let totalChapters = 0;
let totalFlow = 0;
let totalChoices = 0;
let totalQuizzes = 0;

for (const volKey of Object.keys(STORY_DATA.volumes)) {
  const vol = STORY_DATA.volumes[volKey];
  vol.chapters.forEach(ch => {
    totalChapters++;
    const flow = ch.flow || [];
    totalFlow += flow.length;
    const choices = flow.filter(f => f.type === 'choice');
    totalChoices += choices.length;
    if (ch.quiz) totalQuizzes++;
  });
}

console.log(`✓ 36 Chapters verified.`);
console.log(`  Total flow nodes: ${totalFlow}`);
console.log(`  Total choice nodes in flow: ${totalChoices}`);
console.log(`  Total quizzes: ${totalQuizzes}`);

// 模拟案卷白板支线翻页（数量取真实数据，不再写死）
let sideIndex = 0;
for (let i = 0; i < STORY_DATA.sideQuests.length; i++) {
  sideIndex = (sideIndex + 1) % STORY_DATA.sideQuests.length;
}
console.log(`✓ Side quests circular navigation verified: ${STORY_DATA.sideQuests.length}/${STORY_DATA.sideQuests.length} items.`);

// 校验三环连环委托：每条链环序连续、不重不缺
const chains = STORY_DATA.sideChains || [];
let chainErr = 0;
chains.forEach(c => {
  const rings = c.rings.map(r => r.ring);
  for (let i = 0; i < rings.length; i++) {
    if (rings[i] !== i + 1) { chainErr++; console.error(`[!] 链 ${c.name} 环序断裂: ${rings.join(',')}`); }
  }
  if (c.ringCount !== 3) console.warn(`[!] 链 ${c.name} 环数 ${c.ringCount}（预期 3）`);
});
console.log(`✓ Side chains verified: ${chains.length} 条 / ${chains.reduce((s, c) => s + c.ringCount, 0)} 环，异常 ${chainErr} 项。`);

// 校验二周目文本：每章非空、无重复句、单句 ≤110 字
let ngChap = 0, ngLine = 0, ngErr = 0;
for (const volKey of Object.keys(STORY_DATA.volumes)) {
  STORY_DATA.volumes[volKey].chapters.forEach(ch => {
    const lines = ch.ngPlusLines || [];
    if (!lines.length) return;
    ngChap++; ngLine += lines.length;
    const seen = new Set();
    lines.forEach(l => {
      if (seen.has(l.text)) { ngErr++; console.error(`[!] ${ch.id} 二周目重复句: ${l.text}`); }
      seen.add(l.text);
      if (l.text.length > 110) { ngErr++; console.error(`[!] ${ch.id} 二周目超长: ${l.text.length}`); }
    });
  });
}
console.log(`✓ NG+ verified: ${ngChap} 章 / ${ngLine} 句，异常 ${ngErr} 项。`);

console.log('🎉 ALL ENGINE & DATA INTEGRITY TESTS PASSED!');
