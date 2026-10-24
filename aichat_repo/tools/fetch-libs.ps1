# 从你自己的词典笔上取回三个原生模块，放进 libs/。
#
# 为什么需要它：本工程**不随仓库分发** libs/ 下的有道二进制（版权不归本项目，
# 见 LICENSE 与 README §7）。它们在每台笔上本来就有，从自己设备取即可。
#
#   libjsapi_httpjson.so   ← JSON POST + 自定义请求头的唯一通道（整个应用依赖它）
#   libjsapi_lookup.so     ← 扫描/OCR 的 JSAPI 模块（导出 LookupWord）
#   libbusiness_lookup.so  ← 上面那个模块的业务实现（缺它模块加载不起来）
#
# 用法（二选一）：
#   pwsh -File tools/fetch-libs.ps1 -PenHost root@172.20.10.4   # 走 SSH（推荐，笔与电脑同网）
#   pwsh -File tools/fetch-libs.ps1 -UseAdb                     # 走 adb（需先在笔上 adb shell auth）
#
# 笔的 IP：在笔上跑 `ifconfig wlan0`，或见 README §2.5。

[CmdletBinding()]
param(
  [string]$PenHost = $env:PEN_HOST,
  [switch]$UseAdb
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$libsDir = Join-Path $repoRoot 'libs'
New-Item -ItemType Directory -Force -Path $libsDir | Out-Null

# 远端命令有两条硬约束（都实测踩过）：
#   1. 必须**单行**：PowerShell 不支持 `cmd < file` 输入重定向，多行字符串在 Windows 上
#      又是 CRLF，远端 sh 会把 \r 当成命令的一部分而报错。
#   2. 里面**不能出现双引号**：Windows PowerShell 5.1 给原生程序传参会吞掉 `"`，
#      引号保护失效 → 裸 `|` 被远端 sh 当成管道 → `syntax error: unexpected "|"`。
#      所以 find 通配用单引号，判空改成 `cp … && echo OK || echo MISS`。
# 单引号 here-string 保证 $T / $a 这些不被 PowerShell 抢先展开。
$remote = @'
PKG=/userdisk/miniapp/data/mini_app/pkg; T=/tmp/aipenchat-libs; rm -rf $T; mkdir -p $T; a=$(find $PKG -name 'libjsapi_httpjson*.so' | head -1); cp $a $T/libjsapi_httpjson.so 2>/dev/null && echo OK_libjsapi_httpjson || echo MISS_libjsapi_httpjson; b=$(find $PKG -name 'libjsapi_lookup*.so' | head -1); cp $b $T/libjsapi_lookup.so 2>/dev/null && echo OK_libjsapi_lookup || echo MISS_libjsapi_lookup; c=$(find $PKG -name 'libbusiness_lookup*.so' | head -1); cp $c $T/libbusiness_lookup.so 2>/dev/null && echo OK_libbusiness_lookup || echo MISS_libbusiness_lookup; cd /tmp && tar czf aipenchat-libs.tgz aipenchat-libs && echo TARBALL_OK
'@
$remote = $remote.Trim() -replace "`r", '' -replace "`n", ' '
if ($remote -match '[\r\n]') { throw '远端命令必须是单行（不应包含换行）' }
if ($remote.Contains('"')) { throw '远端命令里不能有双引号（PowerShell 5.1 传参会吞掉）' }

$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ('apc-libs-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$tgz = Join-Path $tmpDir 'aipenchat-libs.tgz'

if ($UseAdb) {
  Write-Host '[fetch-libs] 通道: adb'
  & adb shell $remote
  if ($LASTEXITCODE -ne 0) { throw 'adb shell 失败（若提示需要认证，先在笔上执行 adb shell auth）' }
  & adb pull /tmp/aipenchat-libs.tgz $tgz | Out-Null
} else {
  if (-not $PenHost) {
    Write-Host '[fetch-libs] 需要笔的 SSH 目标：' -ForegroundColor Yellow
    Write-Host '  pwsh -File tools/fetch-libs.ps1 -PenHost root@172.20.10.4'
    Write-Host '  笔的 IP 用 ifconfig wlan0 查（README §2.5）'
    exit 2
  }
  Write-Host ('[fetch-libs] 通道: ssh {0}' -f $PenHost)
  & ssh -T $PenHost $remote
  if ($LASTEXITCODE -ne 0) { throw ('ssh {0} 失败（检查 IP / 密钥 / 是否同网）' -f $PenHost) }
  & scp ('{0}:/tmp/aipenchat-libs.tgz' -f $PenHost) $tgz
  if ($LASTEXITCODE -ne 0) { throw 'scp 取 tarball 失败' }
}

if (-not (Test-Path $tgz)) { throw "没取到 tarball（$tgz 不存在）" }

# Windows 10+ 自带 bsdtar
& tar -xzf $tgz -C $tmpDir
if ($LASTEXITCODE -ne 0) { throw '解包 tarball 失败' }
$src = Join-Path $tmpDir 'aipenchat-libs'

$want = @('libjsapi_httpjson.so', 'libjsapi_lookup.so', 'libbusiness_lookup.so')
$missing = @()
foreach ($f in $want) {
  $from = Join-Path $src $f
  if (Test-Path $from) {
    Copy-Item $from (Join-Path $libsDir $f) -Force
    Write-Host ('  ✓ {0}  {1:N0} B' -f $f, (Get-Item (Join-Path $libsDir $f)).Length)
  } else {
    $missing += $f
  }
}
Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

if ($missing.Count) {
  Write-Host ''
  Write-Host ('[fetch-libs] 缺 {0}：{1}' -f $missing.Count, ($missing -join ', ')) -ForegroundColor Yellow
  Write-Host '  这几个库随系统应用分发。若笔上确实没有，对应功能会不可用（应用会优雅降级，不会黑屏）。'
  exit 1
}
Write-Host ''
Write-Host '[fetch-libs] 完成，可以 npm run build 了。' -ForegroundColor Green
