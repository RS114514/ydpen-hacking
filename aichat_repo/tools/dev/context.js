/*
 * 在二进制里定位关键字，并把它周围的字符串按顺序打印出来——用来还原 JS 代码片段。
 *   node tools/dev/context.js <file> <关键字> [--win 4000]
 */
'use strict';

const fs = require('fs');

const argv = process.argv.slice(2);
const file = argv[0];
const kw = argv[1];
const wi = argv.indexOf('--win');
const WIN = wi >= 0 ? Number(argv[wi + 1]) : 3000;

if (!file || !kw) {
  console.error('用法: node tools/dev/context.js <file> <关键字> [--win N]');
  process.exit(2);
}

const buf = fs.readFileSync(file);
const needle = Buffer.from(kw, 'utf8');

// 提取可打印串（带偏移）
function strings(b, from, to) {
  const out = [];
  let cur = '';
  let start = from;
  for (let i = from; i < to; i++) {
    const c = b[i];
    if (c >= 0x20 && c < 0x7f) {
      if (!cur) start = i;
      cur += String.fromCharCode(c);
    } else {
      if (cur.length >= 3) out.push({ off: start, s: cur });
      cur = '';
    }
  }
  if (cur.length >= 3) out.push({ off: start, s: cur });
  return out;
}

let hits = 0;
let idx = 0;
while ((idx = buf.indexOf(needle, idx)) >= 0) {
  hits++;
  const from = Math.max(0, idx - WIN);
  const to = Math.min(buf.length, idx + WIN);
  console.log('\n===== 命中 ' + hits + ' @ offset ' + idx + ' (窗口 ' + (idx - from) + '..' + (to - idx) + ') =====');
  strings(buf, from, to).forEach((s) => {
    const mark = s.off <= idx && s.off + s.s.length >= idx ? ' <<< ' : '  ';
    console.log(mark + s.s);
  });
  idx += needle.length;
  if (hits >= 3) break;
}
if (!hits) console.log('未找到: ' + kw);
