/*
 * 词典笔 adb shell 认证助手。
 *
 * 背景：笔端把 `adb shell` 包了一层门禁 —— 未认证时任何命令都只回
 * "login with adb shell auth to continue."，只有 `auth` 放行，而 `auth` 是
 * 交互式读密码（shell 里 `read -p`）。所以想自动化就得把密码送进 adb 的 stdin。
 *
 * ⚠️ 已实测的限制（youdao-x5-fw3.4.6）：本机固件的 `auth` 绑定在 **pty** 上，
 *    从管道写入的密码到不了它手里（表现为提示符打印出来、脚本却一直不回话）。
 *    因此**首次认证必须由人在自己的终端里手动执行一次**：
 *        adb shell auth          # 输入密码，看到 success.
 *    认证成功后笔上会留下 /tmp/.adb_auth_verified（重启前有效），
 *    之后的 `adb shell ...` 全部畅通，本脚本与 tools/deploy.ps1 才有意义。
 *
 * 保留本脚本的原因：换成把密码走 stdin 的固件/机型时，它就是一行命令的自动化入口；
 * 而且它会把「提示出来了但没回应」这个典型现象打印清楚，便于判断是不是踩了上述限制。
 *
 * 用法（密码走环境变量，不落进命令行历史）：
 *   set APC_PEN_PW=xxxx && node tools/pen-auth.js
 *   set APC_PEN_PW=xxxx && node tools/pen-auth.js "C:\path\to\adb.exe"
 * 退出码：0 认证成功 / 1 密码错误或未成功 / 3 超时（多半是本文件顶部那条限制）/ 4 启动失败
 */
'use strict';

const { spawn } = require('child_process');

const password = process.env.APC_PEN_PW || '';
const adb = process.argv[2] || process.env.APC_ADB || 'adb';

if (!password) {
  console.error('[pen-auth] 请用环境变量 APC_PEN_PW 提供密码');
  process.exit(2);
}

const child = spawn(adb, ['shell', 'auth'], { stdio: ['pipe', 'pipe', 'pipe'] });

let out = '';
let err = '';
let sent = false;

// 关键：等设备端真正打印出 "password:" 提示后再写。
// 而且行结束符送 CRLF —— 笔端是把 auth 挂在 pty 上的，裸模式下 `read` 认的是 CR 结尾，
// 只写 \n 会出现「提示出来了但脚本一直不回话」的现象（本机实测）。
function sendPassword() {
  if (sent) return;
  sent = true;
  child.stdin.write(password + '\r\n');
  setTimeout(() => {
    try {
      child.stdin.end();
    } catch (e) {
      /* 忽略 */
    }
  }, 1200);
}

child.stdout.on('data', (d) => {
  const s = d.toString();
  out += s;
  process.stdout.write(s.replace(/\r/g, ''));
  if (/password\s*:/i.test(out)) sendPassword();
});
child.stderr.on('data', (d) => {
  err += d.toString();
});

// 兜底：2.5s 内没看到提示也把密码发出去
setTimeout(sendPassword, 2500);

const killer = setTimeout(() => {
  console.error('[pen-auth] 超时（25s）：无 success 响应');
  console.error('  已发送密码: ' + sent);
  try {
    child.kill();
  } catch (e) {
    /* 忽略 */
  }
  process.exit(3);
}, 25000);

child.on('close', (code) => {
  clearTimeout(killer);
  const ok = /success/i.test(out);
  console.log('[pen-auth] exit=' + code + ' success=' + ok);
  if (!ok && /incorrect/i.test(out)) console.log('  → 密码不正确');
  if (err.trim()) console.log('  stderr: ' + err.trim().replace(/\n/g, ' | '));
  process.exit(ok ? 0 : 1);
});

child.on('error', (e) => {
  clearTimeout(killer);
  console.error('[pen-auth] 启动 adb 失败: ' + e.message);
  process.exit(4);
});
