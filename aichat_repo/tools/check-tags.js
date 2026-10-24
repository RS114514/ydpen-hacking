/*
 * 标签嵌套检查：模拟 Vue 模板解析器的开栈/闭栈规则，逐个报出**第一个**不匹配处。
 * 比 vue 编译器的报错更早、更精确（编译器只会说 "tag X has no matching end tag"，
 * 不告诉你哪一行开始错的）。
 *
 *   node tools/check-tags.js [file.vue ...]
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Vue / HTML 里不需要闭合的标签
const VOID_TAGS = {
  area: 1, base: 1, br: 1, col: 1, command: 1, embed: 1, frame: 1, hr: 1, img: 1,
  input: 1, isindex: 1, keygen: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1
};

function extractTemplate(src) {
  const start = src.indexOf('<template>');
  const end = src.lastIndexOf('</template>');
  if (start < 0 || end < 0) return '';
  return src.slice(start + '<template>'.length, end);
}

function check(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const tpl = extractTemplate(raw);
  // 行号偏移：模板内的第 1 行 = 文件里 <template> 之后那行
  const offset = raw.slice(0, raw.indexOf('<template>')).split('\n').length;
  const lines = tpl.split('\n');

  const stack = [];
  const problems = [];
  // 去掉注释后再扫（注释里出现的 <template v-if> 之类不应参与配对）
  let cleaned = tpl.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  const clines = cleaned.split('\n');

  const tagRe = /<(\/?)([A-Za-z][A-Za-z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

  clines.forEach((line, li) => {
    let m;
    tagRe.lastIndex = 0;
    while ((m = tagRe.exec(line)) !== null) {
      const closing = m[1] === '/';
      const name = m[2];
      const selfClosed = m[4] === '/';
      const lineNo = offset + li;
      if (VOID_TAGS[name] || selfClosed) {
        if (selfClosed && !VOID_TAGS[name]) {
          problems.push('第 ' + lineNo + ' 行：<' + name + ' ... /> 自闭合 —— Vue 模板不支持，' +
            '解析器会当成未闭合的开始标签（这是 models 页黑屏的真凶）');
        }
        continue;
      }
      if (!closing) {
        stack.push({ name: name, line: lineNo });
      } else {
        if (stack.length === 0) {
          problems.push('第 ' + lineNo + ' 行：</' + name + '> 多余（栈已空）');
          continue;
        }
        const top = stack[stack.length - 1];
        if (top.name === name) {
          stack.pop();
        } else {
          problems.push(
            '第 ' + lineNo + ' 行：</' + name + '> 与栈顶不匹配 —— 栈顶是 <' + top.name +
              '>（第 ' + top.line + ' 行开始，从未闭合）'
          );
          // 模拟解析器的错误恢复：往上找同名的开标签并弹出
          let found = -1;
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].name === name) { found = i; break; }
          }
          if (found >= 0) stack.length = found;
        }
      }
    }
  });

  stack.forEach((s) => problems.push('第 ' + s.line + ' 行：<' + s.name + '> 从未闭合'));

  const tag = path.basename(file);
  if (problems.length === 0) {
    console.log('  OK   ' + tag);
    return true;
  }
  console.log('  失败 ' + tag);
  problems.forEach((p) => console.log('        ' + p));
  return false;
}

const targets = process.argv.slice(2);
let files = [];
if (targets.length) files = targets;
else {
  const pagesDir = path.join(__dirname, '..', 'src', 'pages');
  fs.readdirSync(pagesDir).forEach((d) => {
    const f = path.join(pagesDir, d, d + '.vue');
    if (fs.existsSync(f)) files.push(f);
  });
}

console.log('\n模板标签嵌套检查\n');
let ok = true;
files.forEach((f) => {
  if (!check(f)) ok = false;
});
console.log('');
process.exit(ok ? 0 : 1);
