// 轻量 Markdown → 可渲染块。
//
// 为什么不直接渲染 Markdown：笔端屏幕只有 800x254 逻辑像素，且 Falcon 的 <text>
// 嵌套富文本行为未在真机上验证过；这里把模型输出的 Markdown **降级成带类型的纯文本块**，
// 每块一个 <text> 节点，既能保持结构（代码/列表/标题/引用），又不依赖嵌套富文本。
//
// 块类型：p 段落 / h 标题 / li 列表项 / code 代码块 / quote 引用 / hr 分隔线

// 行内标记清理：**粗体** __粗体__ *斜体* _斜体_ `代码` ~~删除~~ ![图](u) [文字](链接)
export function stripInline(s) {
  if (!s) return '';
  let t = String(s);
  t = t.replace(/`([^`]*)`/g, '$1');
  t = t.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/__([^_]+)__/g, '$1');
  t = t.replace(/\*([^*\n]+)\*/g, '$1');
  t = t.replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, '$1$2');
  t = t.replace(/~~([^~]+)~~/g, '$1');
  // 图片必须在链接**之前**处理：![alt](url) 里含 [alt](url)，
  // 先跑链接规则会把 alt 变成「alt（url）」并留下一个孤立的 !（实测踩到过）。
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, (m, alt) => '[图片' + (alt ? ' ' + alt : '') + ']');
  // [文字](链接) → 文字（链接）
  t = t.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (m, label, url) => {
    if (!label) return url;
    if (label === url) return url;
    return label + '（' + url + '）';
  });
  // 转义字符还原
  t = t.replace(/\\([\\`*_{}[\]()#+\-.!>])/g, '$1');
  return t;
}

// 表格行 | a | b | → a ｜ b
function tableRowToText(line) {
  const cells = line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => stripInline(c.trim()))
    .filter((c) => c.length > 0);
  return cells.join(' ｜ ');
}

function isTableSeparator(line) {
  return /^\s*\|?[\s:-]*-[\s|:-]*\|?\s*$/.test(line) && line.indexOf('-') >= 0;
}

export function mdToBlocks(src) {
  const blocks = [];
  if (!src) return blocks;
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  let para = [];
  let code = null; // { lang, lines }

  const flushPara = () => {
    if (para.length === 0) return;
    blocks.push({ t: 'p', text: para.join('\n') });
    para = [];
  };
  const flushCode = () => {
    if (!code) return;
    blocks.push({ t: 'code', lang: code.lang, text: code.lines.join('\n') });
    code = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 代码围栏
    const fence = line.match(/^\s*(```+|~~~+)\s*([A-Za-z0-9+#._-]*)\s*$/);
    if (fence) {
      if (code) flushCode();
      else {
        flushPara();
        code = { lang: fence[2] || '', lines: [] };
      }
      continue;
    }
    if (code) {
      code.lines.push(line);
      continue;
    }

    // 空行 → 段落分隔
    if (/^\s*$/.test(line)) {
      flushPara();
      continue;
    }

    // 分隔线
    if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) {
      flushPara();
      blocks.push({ t: 'hr', text: '' });
      continue;
    }

    // 标题
    const h = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      blocks.push({ t: 'h', level: h[1].length, text: stripInline(h[2].trim()) });
      continue;
    }

    // 引用
    const q = line.match(/^\s{0,3}>\s?(.*)$/);
    if (q) {
      flushPara();
      const prev = blocks.length > 0 ? blocks[blocks.length - 1] : null;
      const text = stripInline(q[1]);
      if (prev && prev.t === 'quote') prev.text += '\n' + text;
      else blocks.push({ t: 'quote', text: text });
      continue;
    }

    // 表格分隔行（丢弃）
    if (isTableSeparator(line) && line.indexOf('|') >= 0) {
      flushPara();
      continue;
    }
    if (line.indexOf('|') >= 0 && /^\s*\|.*\|\s*$/.test(line)) {
      flushPara();
      const text = tableRowToText(line);
      // 连续表格行合成一个块（否则一张表会变成一堆独立小段，既费节点也难读）
      const prev = blocks.length > 0 ? blocks[blocks.length - 1] : null;
      if (prev && prev.t === 'p' && prev.table) prev.text += '\n' + text;
      else blocks.push({ t: 'p', text: text, table: true });
      continue;
    }

    // 列表（含任务列表 - [ ] / - [x]）
    const li = line.match(/^\s*([-*+]|\d{1,3}[.)])\s+(.*)$/);
    if (li) {
      flushPara();
      const raw = li[2];
      const indent = Math.min(Math.floor(line.match(/^\s*/)[0].length / 2), 3);
      const task = raw.match(/^\[([ xX])\]\s*(.*)$/);
      const marker = task ? (task[1].toLowerCase() === 'x' ? '☑ ' : '☐ ') : '· ';
      const body = stripInline(task ? task[2] : raw);
      const prev = blocks.length > 0 ? blocks[blocks.length - 1] : null;
      const text = marker + body;
      if (prev && prev.t === 'li' && prev.indent === indent) prev.text += '\n' + text;
      else blocks.push({ t: 'li', text: text, indent: indent });
      continue;
    }

    para.push(stripInline(line));
  }
  flushCode();
  flushPara();
  return blocks;
}

// 纯文本（复制/摘要/送进下一次上下文时用）
export function mdToPlain(src) {
  return mdToBlocks(src)
    .map((b) => b.text)
    .join('\n')
    .trim();
}

// 粗略 token 估算：CJK 约 1 字 1 token，拉丁约 4 字符 1 token。
// 只用于给用户一个「上下文用了多少」的量级感，不参与计费。
export function estimateTokens(text) {
  if (!text) return 0;
  const s = String(text);
  let cjk = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0x2e80 && c <= 0x9fff) cjk++;
    else if (c >= 0x3000 && c <= 0x303f) cjk++;
    else if (c >= 0xff00 && c <= 0xffef) cjk++;
  }
  const rest = s.length - cjk;
  return Math.ceil(cjk + rest / 4);
}

export function estimateMessagesTokens(messages) {
  let n = 0;
  for (let i = 0; i < messages.length; i++) {
    n += estimateTokens(messages[i].content) + 4; // 每条消息的角色/分隔开销
  }
  return n;
}
