/*
 * 真机预置工具：在本机生成与 App 完全一致的配置，并可直接写进笔的存储。
 *
 * 为什么需要它：API Key 是一长串随机字符，用笔上的系统输入法敲进去非常痛苦。
 *
 * 存储契约（真机实测，2026-10-02）：
 *   文件 /userdisk/miniapp/data/mini_app/pkg/<appid>/data/sharedpreferences/preferences.json
 *   内容是最外层一个 JSON 对象：{ "<key>": "<值的 JSON 字符串>" }
 *   即每个 storage key 的值本身是**被序列化过的字符串**，所以是双层 JSON。
 *   直接整文件替换即可生效（App 冷启动时读），不需要在笔上执行任何脚本。
 *
 * 用法：
 *   node tools/seed.js --key sk-xxxx [选项] [--out 文件] [--push]
 *
 * 选项：
 *   --model <预设key>   把 Key 写进哪条档位（默认 deepseek-flash）
 *                      可选：deepseek-flash / deepseek-v4-pro / 其它见 services/presets.js
 *   --base <url>        Base URL（默认取预设值）
 *   --think on|off      思考开关（默认 on）
 *   --temperature <n>   温度（默认 0.7）
 *   --max <n>           最大输出（默认 1024）
 *   --rounds <n>        携带上下文轮数（默认 4）
 *   --timeout <n>       超时秒数（默认 90）
 *   --appid <id>        小程序 appid（默认 8002026091900010）
 *   --adb <path>        adb 路径
 *   --out <file>        输出 preferences.json（默认写到 tools/.build/preferences.json）
 *   --push              生成后推送并替换笔上的存储文件
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
function arg(name, def) {
  const i = argv.indexOf('--' + name);
  if (i < 0) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}
const has = (n) => argv.indexOf('--' + n) >= 0;

const APPID = String(arg('appid', '8002026091900010'));
const ADB = String(arg('adb', process.env.APC_ADB || 'C:\\Users\\PC\\Desktop\\platform-tools\\adb.exe'));
const KEY = String(arg('key', ''));
const MODEL_KEY = String(arg('model', 'deepseek-flash'));
const BASE = arg('base', '');
const THINK = String(arg('think', 'on')) === 'on' ? 'on' : 'off';
const TEMPERATURE = Number(arg('temperature', '0.7'));
const MAXTOKENS = Number(arg('max', '1024'));
const ROUNDS = Number(arg('rounds', '4'));
const TIMEOUT = Number(arg('timeout', '90'));
const OUT = String(arg('out', path.join(__dirname, '.build', 'preferences.json')));
const PUSH = has('push');

if (!KEY || KEY === true) {
  console.error('缺少 --key。示例：');
  console.error('  node tools/seed.js --key sk-xxxxxxxx --model deepseek-flash --think on --push');
  process.exit(2);
}

// ---------- 用工程自己的 schema 生成配置 ----------
// 把 services 复制到临时目录以 ESM 导入（工程 package.json 不能加 type:module，
// aiot-vue-cli 的构建链要求 CommonJS）。做法与 test/run.mjs 一致。
const svcDir = path.join(__dirname, '..', 'src', 'services');
const tmpDir = path.join(__dirname, '.seedtmp');
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
fs.readdirSync(svcDir).forEach((f) => {
  if (f.endsWith('.js')) fs.copyFileSync(path.join(svcDir, f), path.join(tmpDir, f));
});
const imp = (n) => import('file://' + path.join(tmpDir, n).replace(/\\/g, '/'));

(async () => {
  const config = await imp('config.js');
  const presets = await imp('presets.js');

  const wanted = ['deepseek-flash', 'deepseek-v4-pro'];
  const models = [];
  wanted.forEach((k) => {
    const m = config.modelFromPreset(k);
    if (!m) return;
    if (k === MODEL_KEY) {
      m.apiKey = KEY;
      if (BASE && BASE !== true) m.baseUrl = String(BASE);
    }
    models.push(m);
  });
  if (!models.some((m) => m.key === MODEL_KEY)) {
    console.error('未知的 --model：' + MODEL_KEY + '。可选：');
    presets.allPresetModels().forEach((p) => console.error('   ' + p.model.key));
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(2);
  }
  const active = models.filter((m) => m.key === MODEL_KEY)[0];

  const cfg = config.normalizeConfig({
    models: models,
    activeId: active.id,
    params: {
      temperature: TEMPERATURE,
      maxTokens: MAXTOKENS,
      historyRounds: ROUNDS,
      timeoutSec: TIMEOUT,
      think: THINK,
      thinkEffort: 'high',
      thinkBudget: 1024
    }
  });

  // 双层 JSON：外层是 key → 值的 JSON 字符串
  const inner = JSON.stringify(cfg);
  const fileContent = JSON.stringify({ apc_config: inner });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, fileContent, 'utf8');

  console.log('\n=== 配置摘要 ===');
  console.log('appid    : ' + APPID);
  console.log('当前激活 : ' + active.label + '  (model=' + active.model + ')');
  cfg.models.forEach((m) => {
    console.log(
      '   · ' + m.label + '  key=' +
        (m.apiKey ? m.apiKey.slice(0, 6) + '…' + m.apiKey.slice(-4) : '（未填）') +
        '  base=' + m.baseUrl + '  thinkStyle=' + m.thinkStyle
    );
  });
  console.log(
    '参数     : think=' + cfg.params.think + ' temperature=' + cfg.params.temperature +
      ' maxTokens=' + cfg.params.maxTokens + ' rounds=' + cfg.params.historyRounds +
      ' timeout=' + cfg.params.timeoutSec + 's'
  );
  console.log('输出文件 : ' + OUT + '  (' + fileContent.length + ' 字节)');
  console.log('校验     : 外层 JSON ' + (JSON.parse(fileContent) ? 'OK' : 'BAD') +
    ' / 内层 JSON ' + (JSON.parse(inner) ? 'OK' : 'BAD'));

  if (!PUSH) {
    console.log('\n(未推送。加 --push 才会写进笔上)');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  // ---------- 推送 ----------
  const remoteDir = '/userdisk/miniapp/data/mini_app/pkg/' + APPID + '/data/sharedpreferences';
  const remote = remoteDir + '/preferences.json';
  console.log('\n=== 推送 ===');
  console.log('$ adb push <out> ' + remote);

  // 先备份原文件（万一要回退）
  const backup = '/tmp/apc_preferences.bak';
  spawnSync(ADB, ['shell', 'cp', remote, backup], { stdio: 'inherit' });
  console.log('已备份原文件到 ' + backup);

  let r = spawnSync(ADB, ['push', OUT, remote], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('adb push 失败');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(3);
  }

  // 回读校验（真机写入必须验证，避免“以为写进去了”）
  r = spawnSync(ADB, ['shell', 'wc -c < ' + remote], { encoding: 'utf8' });
  const size = (r.stdout || '').trim();
  console.log('设备上文件大小: ' + size + ' 字节（本机 ' + fileContent.length + '）');

  // App 如果正在前台运行，它的内存缓存还是旧值 → 需要重启应用
  console.log('\n=== 让新配置生效 ===');
  console.log('App 会缓存已读配置，请重启一次：');
  console.log('  adb shell miniapp_cli start 8080222437664451        # 回桌面');
  console.log('  adb shell miniapp_cli start ' + APPID + ' index      # 再进应用');
  console.log('\n然后点「自检」验证 Key 是否生效，或看日志：');
  console.log('  adb shell "grep -h \'\\[llm\\]\\|\\[diag\\]\' /userdata/applog/DictPen_*.log | tail -20"');

  fs.rmSync(tmpDir, { recursive: true, force: true });
})().catch((e) => {
  console.error(e);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(1);
});
