/*
 * 模板体检（构建前的守门员）：用打包时的真实编译器（falcon-template-compiler）编译
 * 每个页面的 <template>，报告
 *   · 编译错误 / tips            ← 这类错误 aiot-vue-cli 只提示、照样打包，必须自己拦
 *   · 自闭合的非空元素            ← Vue 模板不支持，会吞掉后面的闭合标签
 *   · _e() 空节点数（v-if 无 v-else 的正常产物，仅作参考）
 *
 * 为什么必须有它（真机事故）：models.vue 里一行
 *     <div class="row" @click="editText('extraBody', '如 {"top_k":20}', 300)">
 * 属性值里的**双引号把属性提前截断**，导致该 div 未闭合 → 后面的 </scroller> 被吞 →
 * v-if/v-else-if 链断裂 → 渲染函数残缺 → **整页黑屏**。而打包器只打了一行提示就出了包。
 * 现在 build.js 会先跑本脚本，有问题直接中断构建。
 *
 *   node tools/check-templates.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CLI = process.env.AIOT_CLI_DIR || 'C:\\Users\\PC\\Desktop\\PenBili-main\\node_modules\\aiot-vue-cli';
const compiler = require(path.join(CLI, 'cli-libs', 'index.js'))['falcon-template-compiler'];

const pagesDir = path.join(__dirname, '..', 'src', 'pages');
const compsDir = path.join(__dirname, '..', 'src', 'components');

// 待检文件清单：页面 + 组件。
// 组件也必须体检：panel 页把三个区块拆成了 src/components/*.vue，组件模板一样会
// 因为自闭合/引号陷阱编译出残缺渲染函数 → 整页黑屏，而打包器同样只提示不报错。
function collectTargets() {
  const list = [];
  if (fs.existsSync(pagesDir)) {
    fs.readdirSync(pagesDir).forEach((dir) => {
      const file = path.join(pagesDir, dir, dir + '.vue');
      if (fs.existsSync(file)) list.push({ label: dir, file: file });
    });
  }
  if (fs.existsSync(compsDir)) {
    fs.readdirSync(compsDir).forEach((f) => {
      if (/\.vue$/.test(f)) list.push({ label: 'c:' + f.replace(/\.vue$/, ''), file: path.join(compsDir, f) });
    });
  }
  return list;
}

// HTML 里本就不需要闭合的标签
const VOID_TAGS = {
  area: 1, base: 1, br: 1, col: 1, command: 1, embed: 1, frame: 1, hr: 1, img: 1,
  input: 1, isindex: 1, keygen: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1
};

function extractTemplate(src) {
  const start = src.indexOf('<template>');
  const end = src.lastIndexOf('</template>');
  return start < 0 || end < 0 ? '' : src.slice(start + 10, end);
}

function count(re, s) {
  const hits = s.match(new RegExp(re.source, 'g'));
  return hits ? hits.length : 0;
}

// 自闭合的非空元素（去掉注释后再找，避免注释里的示例代码误报）
function findSelfClosing(tpl) {
  const cleaned = tpl.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  const out = [];
  const re = /<([A-Za-z][A-Za-z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)\/>/g;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    if (!VOID_TAGS[m[1].toLowerCase()]) {
      const line = cleaned.slice(0, m.index).split('\n').length;
      out.push({ tag: m[1], line: line });
    }
  }
  return out;
}

// 属性值里出现裸双引号（把属性提前截断）——models 黑屏的直接成因
function findQuoteTrap(tpl) {
  const out = [];
  const cleaned = tpl.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  cleaned.split('\n').forEach((l, i) => {
    // 形如  @click="foo('a', '含 " 引号', 1)"   → 同一属性里出现 3 个以上的 "
    const re = /([:@][A-Za-z-]+)="([^"\n]*)"/g;
    let m;
    while ((m = re.exec(l)) !== null) {
      const rest = l.slice(m.index + m[0].length);
      if (/^\s*[^\s>]/.test(rest) && rest.indexOf('"') >= 0 && !/^\s*(\/?>|\s)/.test(rest)) {
        out.push({ line: i + 1, attr: m[1] });
      }
    }
  });
  return out;
}

const rows = [];
const problems = [];

collectTargets().forEach((target) => {
  const dir = target.label;
  const content = fs.readFileSync(target.file, 'utf8');
  const tpl = extractTemplate(content);
  const r = compiler.compile(tpl);
  const errs = r.errors || [];
  const selfClosed = findSelfClosing(tpl);
  const quoteTraps = findQuoteTrap(tpl);

  rows.push({
    page: dir,
    errors: errs.length,
    empty: count(/_e\(\)/, r.render),
    nestedArr: count(/\)\?\[/, r.render),
    normalize: count(/,\s*2\)/, r.render),
    len: r.render.length
  });

  errs.forEach((e) => problems.push(dir + '.vue：模板编译错误 —— ' + e));
  selfClosed.forEach((s) =>
    problems.push(
      dir + '.vue:' + s.line + '：<' + s.tag + ' ... /> 自闭合 —— Vue 模板不支持，' +
        '解析器会当成未闭合的开始标签，吞掉后面的闭合标签'
    )
  );
  quoteTraps.forEach((q) =>
    problems.push(dir + '.vue:' + q.line + '：属性 ' + q.attr + ' 的值里有未转义的双引号，会把属性提前截断')
  );
});

console.log('\n模板体检（页面 + 组件；编译器 = falcon-template-compiler，与打包一致）\n');
console.log('  target      errors  _e()空节点  条件数组分支  normalize   render长度');
console.log('  ' + '-'.repeat(72));
rows.forEach((r) => {
  console.log(
    '  ' +
      r.page.padEnd(18) +
      String(r.errors).padEnd(8) +
      String(r.empty).padEnd(12) +
      String(r.nestedArr).padEnd(14) +
      String(r.normalize).padEnd(11) +
      r.len
  );
});

if (problems.length) {
  console.log('\n发现 ' + problems.length + ' 个问题：');
  problems.forEach((p) => console.log('  ✗ ' + p));
  console.log('');
  process.exit(1);
}
console.log('\n全部页面模板编译通过，且无自闭合/引号陷阱。\n');
process.exit(0);
