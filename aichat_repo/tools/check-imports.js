/*
 * 相对 import 体检（构建门禁之二）：确认 src 下每个 .vue/.js 里的相对路径 import
 * 都能解析到真实文件。
 *
 * 为什么需要它（真机事故）：把三个页面从 src/pages/<名>/ 搬到 src/components/ 时，
 * 样式里的 @import 改了路径、**脚本里的 '../../services/xxx.js' 忘了改**。
 * 打包器一声不吭就出了包，运行时报
 *     ReferenceError: could not load module filename '../../services/input.js'
 *     TypeError: app parameter not right → __loadPage 崩 → 整页黑屏
 * 也就是说：这类错误不会中断构建，只会在设备上炸。所以放进构建前守门。
 *
 *   node tools/check-imports.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

// 允许不带后缀的 import：按这些后缀依次尝试
const EXTS = ['', '.js', '.vue', '.json', '.less'];
const INDEXES = ['index.js', 'index.vue'];

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.charAt(0) === '.') return;
      walk(p, out);
    } else if (/\.(vue|js)$/.test(e.name)) {
      out.push(p);
    }
  });
  return out;
}

// 抽出所有 import/require 的模块说明符
function specifiers(text) {
  const out = [];
  const push = (s, idx) => out.push({ spec: s, line: text.slice(0, idx).split('\n').length });
  let m;
  const reFrom = /(?:^|\s)(?:import|export)[\s\S]{0,200}?from\s+['"]([^'"]+)['"]/g;
  while ((m = reFrom.exec(text)) !== null) push(m[1], m.index);
  const reBare = /(?:^|\s)import\s+['"]([^'"]+)['"]/g;
  while ((m = reBare.exec(text)) !== null) push(m[1], m.index);
  const reReq = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = reReq.exec(text)) !== null) push(m[1], m.index);
  const reDyn = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = reDyn.exec(text)) !== null) push(m[1], m.index);
  return out;
}

function resolves(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const ext of EXTS) {
    if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return true;
  }
  for (const idx of INDEXES) {
    const p = path.join(base, idx);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  }
  return false;
}

const files = walk(SRC, []);
const problems = [];
let checked = 0;
let relative = 0;

files.forEach((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(path.join(__dirname, '..'), file);
  specifiers(text).forEach(({ spec, line }) => {
    checked++;
    if (spec.charAt(0) !== '.') return; // 只查相对路径；原生模块（httpjson/lookup_word 等）故意不可解析
    relative++;
    if (!resolves(file, spec)) {
      problems.push(rel + ':' + line + '：import "' + spec + '" 解析不到文件');
    }
  });
});

console.log('\n相对 import 体检（' + files.length + ' 个文件，' + checked + ' 条 import，其中相对 ' + relative + ' 条）\n');
if (problems.length) {
  console.log('发现 ' + problems.length + ' 个无法解析的相对 import：');
  problems.forEach((p) => console.log('  ✗ ' + p));
  console.log('\n这类错误打包器不会中断，只会在设备上运行时炸（页面黑屏）。修好再构建。\n');
  process.exit(1);
}
console.log('全部相对 import 均可解析。\n');
process.exit(0);
