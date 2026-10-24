package main

const IndexHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>有道词典笔 · 远程控制与文件互传</title>
<style>
  :root {
    --bg-base: #10131c;
    --card-bg: #181d2a;
    --card-border: #262e42;
    --card-hover: #1f2536;
    --accent: #3a86ff;
    --accent-hover: #2563eb;
    --accent-glow: rgba(58, 134, 255, 0.25);
    --success: #10b981;
    --warning: #f59e0b;
    --text-primary: #f3f5f9;
    --text-secondary: #8b93a7;
    --text-muted: #5a6275;
    --pen-shell-bg: linear-gradient(145deg, #242938, #151822);
    --pen-bezel: #0b0d13;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 24px 36px 24px;
    user-select: none;
    -webkit-user-select: none;
  }

  /* 顶栏 */
  header {
    width: 100%;
    max-width: 1140px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    padding: 4px 8px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .brand-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #3a86ff, #00b4d8);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 12px var(--accent-glow);
  }
  .brand-title {
    font-size: 19px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.3px;
  }
  .brand-subtitle {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 1px;
  }

  .nav-tabs {
    display: flex;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 3px;
    gap: 4px;
  }
  .tab-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 7px 16px;
    font-size: 13.5px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tab-btn:hover {
    color: var(--text-primary);
  }
  .tab-btn.active {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
    box-shadow: 0 2px 8px var(--accent-glow);
  }

  .device-quick-badges {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 20px;
    font-size: 12.5px;
    color: var(--text-secondary);
  }
  .badge .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 8px var(--success);
  }

  /* 主容器与选项卡页 */
  main {
    width: 100%;
    max-width: 1140px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .tab-pane {
    display: none;
    flex-direction: column;
    gap: 18px;
    animation: fadeIn 0.2s ease-in-out;
  }
  .tab-pane.active {
    display: flex;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* 仿词典笔真实外壳卡片 */
  .pen-device-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 18px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    position: relative;
    overflow: hidden;
  }

  /* 词典笔外壳外框 */
  .pen-chassis {
    position: relative;
    background: var(--pen-shell-bg);
    border-radius: 46px;
    padding: 18px 24px 18px 36px;
    box-shadow:
      inset 0 2px 4px rgba(255,255,255,0.08),
      inset 0 -3px 6px rgba(0,0,0,0.6),
      0 12px 36px rgba(0,0,0,0.55),
      0 0 0 1px rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 100%;
    transition: transform 0.3s ease;
  }

  /* 词典笔笔尖扫描头造型 (左侧) */
  .pen-tip {
    width: 18px;
    height: 120px;
    background: linear-gradient(90deg, #181b24, #2a3040);
    border-radius: 8px 3px 3px 8px;
    border: 1px solid rgba(255,255,255,0.08);
    position: relative;
    box-shadow: inset 0 0 6px rgba(0,0,0,0.6);
    flex-shrink: 0;
  }
  .pen-tip::after {
    content: "";
    position: absolute;
    left: 2px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 38px;
    background: #00d2ff;
    box-shadow: 0 0 10px #00d2ff;
    border-radius: 2px;
    opacity: 0.75;
  }

  /* 词典笔屏幕视窗 */
  .pen-screen-window {
    background: var(--pen-bezel);
    padding: 10px 12px;
    border-radius: 14px;
    box-shadow:
      inset 0 3px 8px rgba(0,0,0,0.9),
      0 1px 2px rgba(255,255,255,0.05);
    border: 1px solid #1c2130;
    position: relative;
    overflow: hidden;
  }

  .screen-viewport {
    position: relative;
    width: 960px;
    height: 266px;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    cursor: crosshair;
  }
  .screen-viewport img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: fill;
    image-rendering: -webkit-optimize-contrast;
  }

  /* 触摸光圈指示器 */
  .touch-dot {
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(58, 134, 255, 0.45);
    border: 2px solid #fff;
    box-shadow: 0 0 12px var(--accent);
    transform: translate(-50%, -50%) scale(0);
    pointer-events: none;
    transition: transform 0.08s ease-out, opacity 0.15s ease-out;
    opacity: 0;
    z-index: 10;
  }
  .touch-dot.active {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }

  /* 物理电源按键造型 */
  .pen-power-btn-physical {
    position: absolute;
    top: -6px;
    right: 180px;
    width: 46px;
    height: 6px;
    background: #47526a;
    border-radius: 4px 4px 0 0;
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);
    cursor: pointer;
    transition: all 0.1s ease;
  }
  .pen-power-btn-physical:hover {
    background: #3a86ff;
    box-shadow: 0 0 8px #3a86ff;
  }
  .pen-power-btn-physical:active {
    transform: translateY(2px);
  }

  /* 交互控制卡片 */
  .control-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
  }
  .control-group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .btn {
    background: #252c3f;
    color: var(--text-primary);
    border: 1px solid var(--card-border);
    border-radius: 9px;
    padding: 8px 16px;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: all 0.15s ease;
  }
  .btn:hover {
    background: #2e374e;
    border-color: #3b4662;
    color: #fff;
    transform: translateY(-1px);
  }
  .btn:active {
    transform: translateY(1px);
  }
  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    font-weight: 600;
    box-shadow: 0 3px 10px var(--accent-glow);
  }
  .btn.primary:hover {
    background: var(--accent-hover);
  }

  .brightness-box {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
  }
  .brightness-box input[type=range] {
    -webkit-appearance: none;
    width: 100px;
    height: 5px;
    border-radius: 4px;
    background: #2a3145;
    outline: none;
  }
  .brightness-box input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    box-shadow: 0 0 6px var(--accent);
  }

  /* 快捷键指南提示条 */
  .hint-bar {
    background: rgba(24, 29, 42, 0.7);
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: 10px 18px;
    font-size: 12.5px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  kbd {
    background: #2a3248;
    border: 1px solid #3c4664;
    border-radius: 5px;
    padding: 2px 7px;
    font-size: 11.5px;
    color: #e0e5f2;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }

  /* 文件互传卡片 (与原版风格完全一致) */
  .file-transfer-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .ft-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .ft-title-box h2 {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .ft-root-path {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 3px;
  }
  .drop-zone {
    border: 2px dashed var(--accent);
    border-radius: 14px;
    padding: 34px 20px;
    text-align: center;
    background: #151a26;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .drop-zone.hover {
    background: #1d2538;
    border-color: #60a5fa;
    transform: scale(1.005);
  }
  .drop-zone b {
    color: var(--accent);
  }
  .upload-progress-bar {
    height: 7px;
    background: #23293a;
    border-radius: 4px;
    overflow: hidden;
    display: none;
    margin-top: 8px;
  }
  .upload-progress-bar-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #3a86ff, #00b4d8);
    transition: width 0.15s ease;
  }
  .upload-log {
    font-size: 12.5px;
    color: var(--text-secondary);
    min-height: 18px;
  }

  /* 文件表格 */
  .table-box {
    background: #141824;
    border: 1px solid var(--card-border);
    border-radius: 12px;
    overflow: hidden;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }
  th, td {
    padding: 11px 16px;
    text-align: left;
    border-bottom: 1px solid #1f2536;
  }
  th {
    background: #171c29;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 12.5px;
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: rgba(255,255,255,0.02);
  }
  .col-name a {
    color: #7cb2ff;
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .col-name a:hover {
    text-decoration: underline;
  }
  .col-size {
    text-align: right;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
  .col-time {
    color: var(--text-muted);
    font-size: 12px;
  }
  .col-action {
    text-align: right;
  }
  .action-link {
    color: #ef4444;
    cursor: pointer;
    font-size: 12px;
    text-decoration: none;
    margin-left: 10px;
  }
  .action-link:hover {
    text-decoration: underline;
  }
  .is-dir-icon {
    color: #f59e0b;
    font-weight: bold;
  }

  /* 状态监控卡片 */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .stat-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .stat-title {
    font-size: 12.5px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .stat-val {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.5px;
  }
  .stat-sub {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* 响应式缩放 */
  @media (max-width: 1040px) {
    .pen-chassis {
      transform: scale(0.85);
      transform-origin: center top;
      margin-bottom: -40px;
    }
  }
  @media (max-width: 860px) {
    .pen-chassis {
      transform: scale(0.68);
      transform-origin: center top;
      margin-bottom: -80px;
    }
  }
</style>
</head>
<body>

<header>
  <div class="brand">
    <div class="brand-icon">🖊️</div>
    <div>
      <div class="brand-title">有道词典笔 · 远程操作台</div>
      <div class="brand-subtitle" id="dev-subtitle">Rockchip RK3562 / PenOS 4.x 原生服务</div>
    </div>
  </div>

  <div class="nav-tabs">
    <button class="tab-btn active" onclick="switchTab('screen')">📱 屏幕控制台</button>
    <button class="tab-btn" onclick="switchTab('files')">📁 文件互传</button>
    <button class="tab-btn" onclick="switchTab('stats')">📊 硬件监控</button>
  </div>

  <div class="device-quick-badges">
    <div class="badge">
      <div class="dot"></div>
      <span id="badge-fps">15.0 FPS</span>
    </div>
    <div class="badge" id="badge-battery">🔋 100%</div>
    <div class="badge" id="badge-ip">IP: 加载中...</div>
  </div>
</header>

<main>
  <!-- Tab 1: 屏幕控制台 -->
  <div class="tab-pane active" id="pane-screen">
    <!-- 仿词典笔真实外壳 -->
    <div class="pen-device-card">
      <div class="pen-chassis" id="pen-chassis">
        <div class="pen-power-btn-physical" onclick="sendKey('power')" title="物理电源键 (点击亮屏/息屏)"></div>
        <div class="pen-tip" title="光学扫描测距头"></div>
        <div class="pen-screen-window">
          <div class="screen-viewport" id="viewport">
            <img id="stream-img" src="/stream" alt="词典笔实时画面" draggable="false">
            <div class="touch-dot" id="touch-dot"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制工具栏 -->
    <div class="control-card">
      <div class="control-group">
        <button class="btn primary" onclick="sendKey('power')">⚡ 唤醒 / 息屏</button>
        <button class="btn" onclick="sendKey('back')">◀ 返回</button>
        <button class="btn" onclick="sendKey('home')">🏠 主界面</button>
        <button class="btn" onclick="takeScreenshot()">📸 截屏下载</button>
      </div>

      <div class="control-group">
        <button class="btn" onclick="toggleRotation()">🔄 旋转 180°</button>
        <div class="brightness-box">
          <span>☀️ 亮度</span>
          <input type="range" id="brightness-slider" min="0" max="255" value="200" onchange="setBrightness(this.value)">
          <span id="brightness-val">200</span>
        </div>
      </div>
    </div>

    <!-- 快捷键指南 -->
    <div class="hint-bar">
      <div>
        💡 <b>操作小提示：</b>支持鼠标直接点击、拖拽滑动词典笔画面，手势与真机触控正向实时匹配。
      </div>
      <div>
        <kbd>Space</kbd> 唤醒/息屏 &nbsp;
        <kbd>Esc</kbd> / <kbd>Backspace</kbd> 返回 &nbsp;
        <kbd>H</kbd> 主屏幕 &nbsp;
        <kbd>S</kbd> 截屏
      </div>
    </div>
  </div>

  <!-- Tab 2: 文件互传 (与原有文件互传风格完全融合) -->
  <div class="tab-pane" id="pane-files">
    <div class="file-transfer-card">
      <div class="ft-header">
        <div class="ft-title-box">
          <h2>文件互传</h2>
          <div class="ft-root-path" id="ft-path-display">共享目录：/userdisk/Favorite</div>
        </div>
        <div class="control-group">
          <button class="btn primary" onclick="document.getElementById('file-input').click()">选择文件上传</button>
          <button class="btn" onclick="promptMkdir()">新建文件夹</button>
          <button class="btn" onclick="loadFileList()">刷新列表</button>
          <input type="file" id="file-input" multiple style="display:none" onchange="handleFileSelect(this.files)">
        </div>
      </div>

      <div class="drop-zone" id="drop-zone">
        把电脑文件拖拽到这里，或<b>点击选择文件</b>（支持多选、断点大文件流式直传）
      </div>
      <div class="upload-progress-bar" id="upload-bar">
        <div class="upload-progress-bar-fill" id="upload-bar-fill"></div>
      </div>
      <div class="upload-log" id="upload-log"></div>

      <div class="table-box">
        <table>
          <thead>
            <tr>
              <th>文件 / 目录名称</th>
              <th class="col-size">大小</th>
              <th class="col-time">修改时间</th>
              <th class="col-action">操作</th>
            </tr>
          </thead>
          <tbody id="file-table-body">
            <tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:24px;">正在载入文件列表...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Tab 3: 系统硬件监控 -->
  <div class="tab-pane" id="pane-stats">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">设备型号 / 芯片架构 <span>RK3562</span></div>
        <div class="stat-val" id="stat-model">有道词典笔 X6 Pro</div>
        <div class="stat-sub" id="stat-kernel">PenOS 4.x / Linux 5.10 aarch64</div>
      </div>

      <div class="stat-card">
        <div class="stat-title">屏幕显示与 KMS 控制器 <span>Direct DRI</span></div>
        <div class="stat-val">960 × 266</div>
        <div class="stat-sub">/dev/dri/card0 · KMS 硬件帧捕获</div>
      </div>

      <div class="stat-card">
        <div class="stat-title">当前局域网 IP 地址 <span>Wi-Fi</span></div>
        <div class="stat-val" id="stat-ip">--</div>
        <div class="stat-sub" id="stat-ips">全部绑定网卡信息</div>
      </div>

      <div class="stat-card">
        <div class="stat-title">电池状态 <span>Power Supply</span></div>
        <div class="stat-val" id="stat-battery">--%</div>
        <div class="stat-sub" id="stat-battery-sub">正在读取供电状态...</div>
      </div>

      <div class="stat-card">
        <div class="stat-title">系统内存使用率 <span>RAM</span></div>
        <div class="stat-val" id="stat-mem">--</div>
        <div class="stat-sub" id="stat-mem-sub">总内存 / 可用</div>
      </div>

      <div class="stat-card">
        <div class="stat-title">系统连续运行时间 <span>Uptime</span></div>
        <div class="stat-val" id="stat-uptime">--</div>
        <div class="stat-sub" id="stat-time">当前笔端时间</div>
      </div>
    </div>
  </div>
</main>

<script>
// 全局状态
let isRotated = false;
let currentPath = '';
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragMoved = false;

// 切换选项卡
function switchTab(name) {
  document.querySelectorAll('.nav-tabs .tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (name === 'screen' && i === 0) || (name === 'files' && i === 1) || (name === 'stats' && i === 2));
  });
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('pane-' + name).classList.add('active');
  if (name === 'files') {
    loadFileList();
  } else if (name === 'stats') {
    fetchStatus();
  }
}

// 触控与坐标转换
const viewport = document.getElementById('viewport');
const touchDot = document.getElementById('touch-dot');

function getLogicalCoords(e) {
  const rect = viewport.getBoundingClientRect();
  const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  
  let x = (clientX - rect.left) / rect.width * 960;
  let y = (clientY - rect.top) / rect.height * 266;

  if (isRotated) {
    x = 960 - x;
    y = 266 - y;
  }

  x = Math.max(0, Math.min(959, Math.round(x)));
  y = Math.max(0, Math.min(265, Math.round(y)));
  return { x, y, clientX: clientX - rect.left, clientY: clientY - rect.top };
}

viewport.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = true;
  dragMoved = false;
  const p = getLogicalCoords(e);
  dragStartX = p.x;
  dragStartY = p.y;
  
  touchDot.style.left = p.clientX + 'px';
  touchDot.style.top = p.clientY + 'px';
  touchDot.classList.add('active');

  postJSON('/api/touch', { type: 'down', x: p.x, y: p.y });
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const p = getLogicalCoords(e);
  if (Math.abs(p.x - dragStartX) > 4 || Math.abs(p.y - dragStartY) > 4) {
    dragMoved = true;
  }
  touchDot.style.left = p.clientX + 'px';
  touchDot.style.top = p.clientY + 'px';
  postJSON('/api/touch', { type: 'move', x: p.x, y: p.y });
});

window.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  touchDot.classList.remove('active');
  postJSON('/api/touch', { type: 'up' });
});

function postJSON(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(() => {});
}

// 按键事件
function sendKey(name) {
  postJSON('/api/key', { key: name });
}

// 截屏
function takeScreenshot() {
  window.location.href = '/api/screenshot';
}

// 旋转 180°
function toggleRotation() {
  isRotated = !isRotated;
  const chassis = document.getElementById('pen-chassis');
  const img = document.getElementById('stream-img');
  if (isRotated) {
    img.style.transform = 'rotate(180deg)';
  } else {
    img.style.transform = 'none';
  }
}

// 设置亮度
function setBrightness(val) {
  document.getElementById('brightness-val').textContent = val;
  postJSON('/api/brightness', { val: parseInt(val) });
}

// 快捷键绑定
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') {
    e.preventDefault();
    sendKey('power');
  } else if (e.code === 'Escape' || e.code === 'Backspace') {
    e.preventDefault();
    sendKey('back');
  } else if (e.key === 'h' || e.key === 'H') {
    sendKey('home');
  } else if (e.key === 's' || e.key === 'S') {
    takeScreenshot();
  }
});

// 状态定时拉取
function fetchStatus() {
  fetch('/api/status')
    .then(r => r.json())
    .then(st => {
      document.getElementById('badge-fps').textContent = st.fps.toFixed(1) + ' FPS';
      document.getElementById('badge-battery').textContent = '🔋 ' + st.battery + '% (' + st.battery_status + ')';
      document.getElementById('badge-ip').textContent = 'IP: ' + st.ip;

      // 状态面板同步
      document.getElementById('stat-model').textContent = st.model;
      document.getElementById('stat-kernel').textContent = st.kernel;
      document.getElementById('stat-ip').textContent = st.ip;
      document.getElementById('stat-ips').textContent = st.all_ips.join(' , ');
      document.getElementById('stat-battery').textContent = st.battery + '%';
      document.getElementById('stat-battery-sub').textContent = '状态: ' + st.battery_status;
      
      const usedMem = ((st.mem_total_kb - st.mem_avail_kb) / 1024).toFixed(0);
      const totMem = (st.mem_total_kb / 1024).toFixed(0);
      document.getElementById('stat-mem').textContent = usedMem + ' MB / ' + totMem + ' MB';
      document.getElementById('stat-mem-sub').textContent = '可用: ' + (st.mem_avail_kb / 1024).toFixed(0) + ' MB';

      const h = Math.floor(st.uptime_sec / 3600);
      const m = Math.floor((st.uptime_sec % 3600) / 60);
      document.getElementById('stat-uptime').textContent = h + ' 小时 ' + m + ' 分钟';
      document.getElementById('stat-time').textContent = st.time;
    })
    .catch(() => {});
}
setInterval(fetchStatus, 2000);
fetchStatus();

// ----------------- 文件互传逻辑 -----------------
const dropZone = document.getElementById('drop-zone');
dropZone.onclick = () => document.getElementById('file-input').click();

dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('hover'); };
dropZone.ondragleave = () => dropZone.classList.remove('hover');
dropZone.ondrop = (e) => {
  e.preventDefault();
  dropZone.classList.remove('hover');
  if (e.dataTransfer.files.length) {
    handleFileSelect(e.dataTransfer.files);
  }
};

function handleFileSelect(files) {
  if (!files || !files.length) return;
  const fd = new FormData();
  for (let i = 0; i < files.length; i++) {
    fd.append('files', files[i], files[i].name);
  }

  const bar = document.getElementById('upload-bar');
  const fill = document.getElementById('upload-bar-fill');
  const log = document.getElementById('upload-log');

  bar.style.display = 'block';
  log.textContent = '准备上传中...';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/fs/upload?path=' + encodeURIComponent(currentPath), true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = (e.loaded / e.total * 100).toFixed(1);
      fill.style.width = pct + '%';
      log.textContent = '上传中: ' + (e.loaded / 1048576).toFixed(1) + ' MB / ' + (e.total / 1048576).toFixed(1) + ' MB (' + pct + '%)';
    }
  };

  xhr.onload = () => {
    try {
      const res = JSON.parse(xhr.responseText);
      if (res.ok) {
        log.textContent = '上传成功！共 ' + res.count + ' 个文件';
        setTimeout(() => {
          bar.style.display = 'none';
          fill.style.width = '0%';
          loadFileList();
        }, 800);
      } else {
        log.textContent = '上传失败: ' + xhr.responseText;
      }
    } catch(err) {
      log.textContent = '解析异常: ' + xhr.responseText;
    }
  };
  xhr.onerror = () => { log.textContent = '网络错误，请检查连接'; };
  xhr.send(fd);
}

function loadFileList() {
  fetch('/api/fs/list?path=' + encodeURIComponent(currentPath))
    .then(r => r.json())
    .then(data => {
      document.getElementById('ft-path-display').textContent = '共享目录：' + data.root + (currentPath ? '/' + currentPath : '');
      const tbody = document.getElementById('file-table-body');
      tbody.innerHTML = '';

      if (currentPath) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td class="col-name"><a href="javascript:void(0)" onclick="navUp()">📁 ../ (返回上级)</a></td><td class="col-size">-</td><td class="col-time">-</td><td></td>';
        tbody.appendChild(tr);
      }

      if (!data.entries || data.entries.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="text-align:center;color:var(--text-secondary);padding:24px;">当前目录为空</td>';
        tbody.appendChild(tr);
        return;
      }

      data.entries.forEach(item => {
        const tr = document.createElement('tr');
        let icon = item.is_dir ? '📁' : '📄';
        let nameHtml = '';
        if (item.is_dir) {
          nameHtml = '<a href="javascript:void(0)" onclick="navTo(\'' + item.path.replace(/'/g, "\\'") + '\')">' + icon + ' ' + item.name + '/</a>';
        } else {
          nameHtml = '<a href="/files/' + encodeURIComponent(item.path) + '" target="_blank">' + icon + ' ' + item.name + '</a>';
        }

        let actionHtml = '<a class="action-link" onclick="deleteItem(\'' + item.path.replace(/'/g, "\\'") + '\')">删除</a>';

        tr.innerHTML = 
          '<td class="col-name">' + nameHtml + '</td>' +
          '<td class="col-size">' + item.size_str + '</td>' +
          '<td class="col-time">' + item.mod_time + '</td>' +
          '<td class="col-action">' + actionHtml + '</td>';
        tbody.appendChild(tr);
      });
    })
    .catch(() => {});
}

function navTo(p) {
  currentPath = p;
  loadFileList();
}

function navUp() {
  const parts = currentPath.split('/');
  parts.pop();
  currentPath = parts.join('/');
  loadFileList();
}

function promptMkdir() {
  const name = prompt('请输入新文件夹名称:');
  if (!name) return;
  fetch('/api/fs/mkdir?path=' + encodeURIComponent(currentPath) + '&name=' + encodeURIComponent(name), { method: 'POST' })
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        loadFileList();
      } else {
        alert('创建失败: ' + res.msg);
      }
    });
}

function deleteItem(p) {
  if (!confirm('确定要删除 ' + p + ' 吗？此操作无法撤销。')) return;
  fetch('/api/fs/delete?path=' + encodeURIComponent(p), { method: 'POST' })
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        loadFileList();
      } else {
        alert('删除失败: ' + res.msg);
      }
    });
}
</script>
</body>
</html>
`
