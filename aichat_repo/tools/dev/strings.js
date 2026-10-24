/*
 * 从二进制/字节码里抽取可打印字符串并做关键字检索。
 * 用途：逆向词典笔的 JSAPI、D-Bus 接口名、事件名。
 *
 *   node tools/dev/strings.js <file> [关键字...] [--min 4] [--utf16]
 *
 * 例：
 *   node tools/dev/strings.js docs/dev/libjsapi_export.so jsapi ocr scan
 */
'use strict';

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const minIdx = argv.indexOf('--min');
const MIN = minIdx >= 0 ? Number(argv[minIdx + 1]) : 4;
const wantUtf16 = argv.indexOf('--utf16') >= 0;
const positional = argv.filter((a, i) => {
  if (a.startsWith('--')) return false;
  if (i > 0 && argv[i - 1] === '--min') return false;
  return true;
});
const file = positional[0];
const keys = positional.slice(1).map((k) => k.toLowerCase());

if (!file) {
  console.error('用法: node tools/dev/strings.js <file> [关键字...] [--min N] [--utf16]');
  process.exit(2);
}

const buf = fs.readFileSync(file);

function extract(buf, wide) {
  const out = [];
  let cur = '';
  const step = wide ? 2 : 1;
  for (let i = 0; i + step <= buf.length; i += step) {
    const c = buf[i];
    const c2 = wide ? buf[i + 1] : 0;
    const printable = c >= 0x20 && c < 0x7f && (!wide || c2 === 0);
    if (printable) {
      cur += String.fromCharCode(c);
    } else {
      if (cur.length >= MIN) out.push({ s: cur, off: i - cur.length * step });
      cur = '';
    }
  }
  if (cur.length >= MIN) out.push({ s: cur, off: buf.length - cur.length * step });
  return out;
}

let strings = extract(buf, false);
if (wantUtf16) strings = strings.concat(extract(buf, true));

// 去重
const seen = new Set();
const uniq = [];
strings.forEach((s) => {
  const k = s.s;
  if (seen.has(k)) return;
  seen.add(k);
  uniq.push(s);
});

console.log('[strings] ' + path.basename(file) + '  ' + buf.length + ' 字节, 提取 ' + uniq.length + ' 条字符串 (min=' + MIN + ')');

if (keys.length === 0) {
  uniq.slice(0, 300).forEach((s) => console.log('  ' + s.s));
  process.exit(0);
}

let hits = 0;
uniq.forEach((s) => {
  const low = s.s.toLowerCase();
  if (keys.some((k) => low.indexOf(k) >= 0)) {
    console.log('  ' + s.s);
    hits++;
  }
});
console.log('[strings] 命中 ' + hits + ' 条');
