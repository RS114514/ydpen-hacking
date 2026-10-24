# 部署到有道词典笔 X5（安装 .amr + 真机验证）
#
# 用法（在工程根目录）：
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/deploy.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/deploy.ps1 -SkipCapture
#
# 本文件必须以 **UTF-8 with BOM** 保存：PowerShell 5.1 对无 BOM 的脚本按 GBK 解析，
# 中文注释会把引号/大括号吃掉导致语法错乱（PenBili 真机踩过的坑）。
#
# adb 查找顺序：$env:APC_ADB → PATH → 常见安装位置。

param(
  [string]$Adb = "",
  [switch]$SkipCapture
)

$ErrorActionPreference = "Stop"
$appid = "8002026091900010"
$root  = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Say($m)  { Write-Host "== $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "   OK  $m" -ForegroundColor Green }
function Bad($m)  { Write-Host "   !!  $m" -ForegroundColor Red }
function Info($m) { Write-Host "       $m" -ForegroundColor DarkGray }

# ---------- 1. 找 adb 与设备 ----------
Say "1/7 定位 adb 与设备"
if (-not $Adb) {
  if ($env:APC_ADB) { $Adb = $env:APC_ADB }
  elseif (Get-Command adb -ErrorAction SilentlyContinue) { $Adb = (Get-Command adb).Source }
  else {
    foreach ($c in @("C:\Users\PC\Desktop\platform-tools\adb.exe", "C:\Users\PC\platform-tools\adb.exe")) {
      if (Test-Path $c) { $Adb = $c; break }
    }
  }
}
if (-not $Adb -or -not (Test-Path $Adb)) { Bad "找不到 adb.exe，请设置 `$env:APC_ADB"; exit 1 }
Ok "adb = $Adb"

$devices = & $Adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\tdevice$" }
if (-not $devices) {
  Bad "没有已连接的设备。请插上词典笔（确认 USB 调试已开）后重试。"
  Info (& $Adb devices)
  exit 1
}
Ok ("设备: " + ($devices -join "; "))

# 笔端把 adb shell 锁在交互式认证后面：未认证时任何命令都只回
# "login with "adb shell auth" to continue."。`auth` 从**终端**读密码（管道送不进去），
# 所以第一次必须由人在自己的终端里手动跑一次；认证成功后笔上会留下
# /tmp/.adb_auth_verified，之后的自动化命令就都能用了（笔重启前有效）。
$probe = (& $Adb shell "echo APC_PROBE_OK" 2>&1) -join ' '
if ($probe -notmatch 'APC_PROBE_OK') {
  Bad "笔端 shell 尚未认证（收到：$($probe.Trim())）"
  Info "请先在你自己的终端里执行一次，并输入笔的密码："
  Info "    `"$Adb`" shell auth"
  Info "看到 success. 之后再重新运行本脚本。（认证状态在笔重启前一直有效）"
  exit 1
}
Ok "shell 已认证"

# ---------- 2. 找产物并核对包内货物 ----------
Say "2/7 检查构建产物"
$amr = Get-ChildItem "$root\*.amr" -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $amr) { Bad "没找到 .amr，请先跑 npm run build"; exit 1 }
Ok "$($amr.Name)  $($amr.Length) 字节  $($amr.LastWriteTime)"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($amr.FullName)
$names = @($zip.Entries | ForEach-Object { $_.FullName })
$zip.Dispose()
foreach ($need in @("app.js.bin", "manifest.json", "index.js.bin", "libs/libjsapi_httpjson.so")) {
  if ($names -contains $need) { Ok "包内含 $need" } else { Bad "包内缺少 $need"; exit 1 }
}

# ---------- 3. 推送并安装 ----------
Say "3/7 推送并安装"
& $Adb push $amr.FullName /tmp/apc.amr | Out-Null
$install = & $Adb shell miniapp_cli install /tmp/apc.amr
Info $install
if ($install -notmatch '"ret"\s*:\s*0') { Bad "安装返回非 ret:0，请看上面输出"; exit 1 }
Ok "安装成功"

# ---------- 4. 先回桌面再启动目标页 ----------
# 真机结论：同一页面连续 start 不会重建页面实例（不重读 onLoad options），
# 所以必须先 start 桌面 appid 顶掉当前页，再 start 目标页。
Say "4/7 启动应用（先进桌面以强制重建页面）"
& $Adb shell miniapp_cli start 8080222437664451 | Out-Null
Start-Sleep -Milliseconds 800
$start = & $Adb shell miniapp_cli start $appid index
Info $start
Start-Sleep -Seconds 3
Ok "已请求启动 $appid 的 index 页"

# ---------- 5. 抓日志 ----------
Say "5/7 抓设备日志（本应用只落 console.warn/error）"
$log = & $Adb shell "grep -h '\[net\]\|\[llm\]\|\[chat\]\|\[diag\]\|\[storage\]\|\[input\]' /userdata/applog/DictPen_*.log 2>/dev/null | tail -n 40"
if ($log) { $log | ForEach-Object { Info $_ } } else { Info "（暂无本应用的日志行）" }

# ---------- 6. 截图取证 + 全黑判据 ----------
if (-not $SkipCapture) {
  Say "6/7 截图取证"
  New-Item -ItemType Directory -Force -Path "$root\docs" | Out-Null
  & $Adb shell miniapp_cli capture /tmp/apc.png | Out-Null
  & $Adb pull /tmp/apc.png "$root\docs\device-screen.png" | Out-Null
  if (Test-Path "$root\docs\device-screen.png") { Ok "已存 docs\device-screen.png" } else { Bad "截图拉取失败" }

  $py = "C:\Users\PC\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
  if (-not (Test-Path $py)) { $py = "python" }
  try {
    $stat = & $py "$root\tools\png_stat.py" "$root\docs\device-screen.png"
    Info $stat
    if ($stat -match "nonblack=([0-9.]+)%") {
      if ([double]$Matches[1] -lt 1.0) {
        Bad "截图几乎全黑 —— 典型病因是某个 .vue 缺 <style> 块（样式完全不进 bundle）。"
      } else {
        Ok "画面有内容（非全黑）"
      }
    }
  } catch { Info "（像素统计失败，请人工看图）" }
} else { Say "6/7 跳过截图" }

# ---------- 7. 收尾提示 ----------
Say "7/7 收尾"
Info "应用内「自检」按钮会真实调用一次 API，并把每一步写进设备日志。"
Info "手动复核命令："
Info "  adb shell miniapp_cli memoryApp"
Info "  adb shell grep -h '\[diag\]' /userdata/applog/DictPen_*.log | tail -n 20"
Ok "部署流程结束"
