/*
 * 打包脚本：用 aiot-vue-cli 把小程序打成可安装的 .amr。
 *
 * 为什么需要它（两个真实坑，都已在本机复现）：
 *  1) aiot-vue-cli@1.0.32 在**模块加载期**就 require 了老的 webpack-dev-server →
 *     spdy → http-deceiver → process.binding('http_parser')，而 Node 12 起已删除该
 *     binding，于是任何 Node >= 12 上直接跑 `node cli.js -q -p` 都会崩在
 *     `Error: No such module: http_parser`。设备打包根本用不到 dev-server，
 *     所以这里用 --require 注入 tools/aiot-preload.js 把该模块垫成惰性桩。
 *  2) 打包器最后一步 qjsc 要 spawn 子进程把 JS 编成 QuickJS 字节码；在受限沙箱里
 *     带管道的子进程创建会被拒（EPERM），需要放开权限或在非沙箱终端里跑。
 *
 * 用法：
 *   node tools/build.js            # 开发构建
 *   node tools/build.js -q -p      # 生产包（QuickJS 字节码 + .amr）
 *   node tools/build.js -c -q -p   # 再开 terser 压缩
 * 可用环境变量 AIOT_CLI 指定 cli.js 路径。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const preload = path.join(__dirname, 'aiot-preload.js');

const CANDIDATES = [
  process.env.AIOT_CLI,
  path.join(projectRoot, 'node_modules', 'aiot-vue-cli', 'src', 'cli.js'),
  path.join(projectRoot, '..', 'env', 'node_modules', 'aiot-vue-cli', 'src', 'cli.js'),
  path.join(projectRoot, '..', '..', 'env', 'node_modules', 'aiot-vue-cli', 'src', 'cli.js'),
  'C:\\Users\\PC\\Desktop\\PenBili-main\\node_modules\\aiot-vue-cli\\src\\cli.js'
].filter(Boolean);

function findCli() {
  for (let i = 0; i < CANDIDATES.length; i++) {
    try {
      if (fs.existsSync(CANDIDATES[i])) return CANDIDATES[i];
    } catch (e) {
      /* 忽略 */
    }
  }
  return '';
}

const cli = findCli();
if (!cli) {
  console.error('[build] 找不到 aiot-vue-cli。请设置环境变量 AIOT_CLI 指向它的 src/cli.js，例如：');
  console.error('        set AIOT_CLI=C:\\path\\to\\node_modules\\aiot-vue-cli\\src\\cli.js');
  process.exit(2);
}

// ---- 守门员：模板体检 ----
// aiot-vue-cli 遇到模板编译错误**只打印提示、照样出包**。真机上这类残包的后果是
// 整页黑屏（models 页踩过一次：属性值里的双引号截断了属性 → </scroller> 被吞 →
// v-if 链断裂）。所以构建前先把模板逐个编译一遍，有问题立即中断。
const checker = path.join(__dirname, 'check-templates.js');
if (fs.existsSync(checker)) {
  const chk = spawnSync(process.execPath, [checker], { cwd: projectRoot, stdio: 'inherit' });
  if (chk.status !== 0) {
    console.error('\n[build] 模板体检未通过，已中断构建（避免打出整页黑屏的包）。');
    console.error('[build] 修好上面的问题后重试；只想看体检结果可单独跑 node tools/check-templates.js');
    process.exit(5);
  }
}

// 相对 import 体检：打包器对「解析不到的相对路径」不报错，只在设备上运行时炸
// （页面黑屏）。真机上踩过一次（组件搬家后忘了改 ../../services 前缀）。
const importer = path.join(__dirname, 'check-imports.js');
if (fs.existsSync(importer)) {
  const chk2 = spawnSync(process.execPath, [importer], { cwd: projectRoot, stdio: 'inherit' });
  if (chk2.status !== 0) {
    console.error('\n[build] 相对 import 体检未通过，已中断构建。');
    process.exit(6);
  }
}

const args = process.argv.slice(2);
console.log('[build] cli    = ' + cli);
console.log('[build] args   = ' + (args.length ? args.join(' ') : '(默认开发构建)'));
console.log('[build] 垫片   = ' + path.basename(preload));
console.log('');

// ---- 保护已经打好的 .amr ----
// 打包器（aiot-vue-cli）在**非打包构建**时会把工程根的旧产物一起清理掉，
// 包括上一次打好的 .amr。于是「先 -p 打包、再 dev 构建看产物」会把刚打好的包弄丢
// （本项目踩过两次，其中一次是交付前）。这里在非打包构建前把现有 .amr 挪进
// .amr-stash/，构建完原样放回。
const isPack =
  args.some(function (a) { return /^-[a-z]*p/i.test(a); }) ||
  args.indexOf('p') >= 0 ||
  args.indexOf('build') >= 0;

const stashDir = path.join(projectRoot, '.amr-stash');
function listAmr() {
  try {
    return fs.readdirSync(projectRoot).filter(function (f) { return /\.amr$/i.test(f); });
  } catch (e) {
    return [];
  }
}
let stashed = [];
if (!isPack) {
  const existing = listAmr();
  if (existing.length) {
    fs.mkdirSync(stashDir, { recursive: true });
    existing.forEach(function (f) {
      try {
        fs.renameSync(path.join(projectRoot, f), path.join(stashDir, f));
        stashed.push(f);
      } catch (e) {
        /* 挪不动就算了，后面会提示 */
      }
    });
    if (stashed.length) {
      console.log('[build] 本次不是打包构建，已把现有 .amr 暂存到 .amr-stash/（构建后放回）：');
      stashed.forEach(function (f) { console.log('        ' + f); });
      console.log('');
    }
  }
}

// stdio: 'inherit' —— 受限沙箱下带管道的子进程会被拒，inherit 是被允许的形态
const ret = spawnSync(process.execPath, ['--require', preload, cli].concat(args), {
  cwd: projectRoot,
  stdio: 'inherit'
});

// 把暂存的 .amr 放回（无论构建成功与否）
if (stashed.length) {
  stashed.forEach(function (f) {
    try {
      fs.renameSync(path.join(stashDir, f), path.join(projectRoot, f));
    } catch (e) {
      console.error('[build] 恢复 ' + f + ' 失败: ' + e.message + '（在 .amr-stash/ 里）');
    }
  });
  try {
    fs.rmdirSync(stashDir);
  } catch (e) {
    /* 目录非空就算了 */
  }
  console.log('\n[build] 已把 ' + stashed.length + ' 个 .amr 放回工程根。');
}

if (ret.error) {
  console.error('[build] 启动失败: ' + ret.error.message);
  if (String(ret.error.message).indexOf('EPERM') >= 0) {
    console.error('[build] 这是沙箱对「带管道的子进程」的限制；请在普通终端里运行，或放开该命令的权限。');
  }
  process.exit(3);
}
process.exit(ret.status === null ? 4 : ret.status);
