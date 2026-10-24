/*
 * 校验笔上的配置是否真的写对了。
 * 拉回 preferences.json → 解析双层 JSON → 打印模型/Key/参数，并和预期比对。
 *
 *   node tools/verify-seed.js [--appid 8002026091900010]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
function arg(n, d) {
  const i = argv.indexOf('--' + n);
  if (i < 0) return d;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

const APPID = String(arg('appid', '8002026091900010'));
const ADB = String(arg('adb', process.env.APC_ADB || 'C:\\Users\\PC\\Desktop\\platform-tools\\adb.exe'));
const remote = '/userdisk/miniapp/data/mini_app/pkg/' + APPID + '/data/sharedpreferences/preferences.json';
const local = path.join(__dirname, '.build', 'pulled-preferences.json');

fs.mkdirSync(path.dirname(local), { recursive: true });
const r = spawnSync(ADB, ['pull', remote, local], { encoding: 'utf8' });
if (r.status !== 0) {
  console.error('adb pull 失败: ' + (r.stderr || r.stdout));
  process.exit(1);
}
console.log('[verify] 已拉回 ' + local + '  ' + fs.statSync(local).size + ' 字节');

const text = fs.readFileSync(local, 'utf8');
let outer;
try {
  outer = JSON.parse(text);
} catch (e) {
  console.error('[verify] 外层不是合法 JSON: ' + e.message);
  console.error('         文件开头: ' + text.slice(0, 200));
  process.exit(1);
}

console.log('[verify] 外层 key: ' + Object.keys(outer).join(', '));

const raw = outer.apc_config;
if (typeof raw !== 'string') {
  console.error('[verify] apc_config 不是字符串（类型 ' + typeof raw + '）');
  process.exit(1);
}

let cfg;
try {
  cfg = JSON.parse(raw);
} catch (e) {
  console.error('[verify] 内层 JSON 解析失败: ' + e.message);
  process.exit(1);
}

console.log('\n=== 笔上的实际配置 ===');
console.log('activeId : ' + cfg.activeId);
console.log('params   : think=' + cfg.params.think + ' temperature=' + cfg.params.temperature +
  ' maxTokens=' + cfg.params.maxTokens + ' rounds=' + cfg.params.historyRounds +
  ' timeout=' + cfg.params.timeoutSec + 's');
console.log('models   :');
let keyed = 0;
cfg.models.forEach((m) => {
  const hasKey = typeof m.apiKey === 'string' && m.apiKey.length > 0;
  if (hasKey) keyed++;
  console.log(
    '   · ' + m.label + '\n       model   = ' + m.model +
      '\n       baseUrl = ' + m.baseUrl +
      '\n       apiKey  = ' + (hasKey ? m.apiKey.slice(0, 6) + '…' + m.apiKey.slice(-4) + '  (len ' + m.apiKey.length + ')' : '（未填）') +
      '\n       think   = ' + m.thinkStyle + (m.effortWithThinking ? ' + reasoning_effort(' + m.effortOptions + ')' : '') +
      '\n       active  = ' + (m.id === cfg.activeId ? '是' : '否')
  );
});

// 当前激活的模型是否可用
const active = cfg.models.filter((m) => m.id === cfg.activeId)[0];
console.log('\n=== 判定 ===');
if (!active) {
  console.log('✗ 激活的模型不存在');
  process.exit(1);
}
const problems = [];
if (!active.apiKey) problems.push('激活模型没有 API Key');
if (!active.baseUrl) problems.push('激活模型没有 Base URL');
if (!active.model) problems.push('激活模型没有模型名');
if (keyed === 0) problems.push('没有任何模型带 Key');
if (problems.length) {
  console.log('✗ ' + problems.join('；'));
  process.exit(1);
}
console.log('✓ 配置可用：当前走「' + active.label + '」，Key 已就位');
