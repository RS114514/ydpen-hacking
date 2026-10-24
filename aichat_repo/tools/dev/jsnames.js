/*
 * 从 .so / 字节码里抽取「像 JS 标识符」的字符串（过滤掉 C++ 名字修饰与符号名）。
 * 用于还原 JSAPI 的方法名、信号名。
 *
 *   node tools/dev/jsnames.js <file> [--all]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const file = process.argv[2];
const showAll = process.argv.indexOf('--all') >= 0;
if (!file) {
  console.error('用法: node tools/dev/jsnames.js <file> [--all]');
  process.exit(2);
}

const buf = fs.readFileSync(file);
const MIN = 3;
let cur = '';
const all = [];
for (let i = 0; i < buf.length; i++) {
  const c = buf[i];
  if (c >= 0x20 && c < 0x7f) cur += String.fromCharCode(c);
  else {
    if (cur.length >= MIN) all.push(cur);
    cur = '';
  }
}
if (cur.length >= MIN) all.push(cur);

// JS 标识符：小写字母开头，只含字母数字下划线，长度合理
const idRe = /^[a-z][A-Za-z0-9_]{2,45}$/;
// 排除明显的 C/C++ 符号与常见噪音
const noise = /^(null|true|false|void|int|char|long|float|double|const|static|class|struct|return|else|while|sizeof|unsigned|public|private|protected|virtual|template|typename|namespace|operator|new|delete|this|std|basic|string|vector|map|set|pair|list|size|type|value|data|index|count|error|begin|end|first|second|__.*|glibc.*|lib.*|ld.*|gcc.*|GCC.*|GLIBC.*)$/;

const seen = new Set();
const out = [];
all.forEach((s) => {
  if (!idRe.test(s)) return;
  if (noise.test(s)) return;
  if (seen.has(s)) return;
  seen.add(s);
  out.push(s);
});

out.sort();
console.log('[jsnames] ' + path.basename(file) + ' → ' + out.length + ' 个候选标识符');
if (showAll) out.forEach((s) => console.log('  ' + s));
else {
  // 只打印像 API 的：含大写字母（驼峰）或以 on/query/get/set/add/is 开头
  out.filter((s) => /[A-Z]/.test(s) || /^(on|query|get|set|add|is|do|start|stop|send|open|close|show|hide)/.test(s))
    .forEach((s) => console.log('  ' + s));
}
