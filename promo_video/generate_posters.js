const fs = require('fs');
const path = require('path');
const QRCode = require('/Volumes/500GB/Ydpen/promo_video/node_modules/qrcode');
const puppeteer = require('/Volumes/500GB/Ydpen/promo_video/node_modules/puppeteer-core');

async function main() {
  const outDir = '/Volumes/500GB/Ydpen/promo_video/output';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const qr1Path = path.join(outDir, 'qr_bv1.png');
  const qr2Path = path.join(outDir, 'qr_bv2.png');

  console.log("1. 生成二维码 PNG 文件...");
  await QRCode.toFile(qr1Path, "https://www.bilibili.com/video/BV1rnxy6oEMx", {
    width: 300,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" }
  });
  await QRCode.toFile(qr2Path, "https://www.bilibili.com/video/BV1CYxp6uEqJ", {
    width: 300,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" }
  });

  const poster1HtmlPath = path.join(__dirname, 'poster1.html');
  const poster2HtmlPath = path.join(__dirname, 'poster2.html');

  console.log("2. 编写海报 1 HTML...");
  const html1 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; }
  body {
    width: 1080px;
    height: 1920px;
    background: radial-gradient(circle at 50% 12%, #221226 0%, #0d0815 45%, #050308 100%);
    color: #fff;
    position: relative;
    overflow: hidden;
    padding: 75px 65px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .glow-top {
    position: absolute;
    top: -120px;
    left: 80px;
    width: 900px;
    height: 500px;
    background: radial-gradient(circle, rgba(255, 64, 129, 0.28) 0%, transparent 70%);
    pointer-events: none;
  }
  .glow-bottom {
    position: absolute;
    bottom: -100px;
    right: 0px;
    width: 700px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 198, 255, 0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  .header { position: relative; z-index: 2; }
  .badge-bar { display: flex; gap: 14px; margin-bottom: 24px; }
  .badge {
    background: rgba(255, 64, 129, 0.22);
    border: 1px solid rgba(255, 64, 129, 0.65);
    color: #ff6da0;
    font-size: 22px;
    font-weight: 800;
    padding: 8px 24px;
    border-radius: 30px;
    letter-spacing: 1px;
  }
  .badge.secondary {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: #e0e0e0;
  }
  .main-title {
    font-size: 66px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: 1px;
    color: #ffffff;
    margin-bottom: 16px;
    text-shadow: 0 4px 20px rgba(0,0,0,0.8);
  }
  .main-title .highlight {
    background: linear-gradient(135deg, #ff79b0 0%, #ffd54f 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .sub-title {
    font-size: 28px;
    color: #b8b0c2;
    font-weight: 500;
    line-height: 1.4;
  }

  .image-card {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 600px;
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,64,129,0.25);
    border: 2px solid rgba(255,255,255,0.2);
  }
  .image-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .image-tag {
    position: absolute;
    bottom: 24px;
    left: 24px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(12px);
    padding: 10px 24px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.25);
    font-size: 22px;
    font-weight: 700;
    color: #ffd54f;
  }

  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    position: relative;
    z-index: 2;
  }
  .feat-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 22px;
    padding: 22px 26px;
    backdrop-filter: blur(12px);
  }
  .feat-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
  .feat-title {
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 4px;
  }
  .feat-desc {
    font-size: 19px;
    color: #9f96a8;
    line-height: 1.35;
  }

  .footer {
    position: relative;
    z-index: 2;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 28px;
    padding: 28px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(16px);
  }
  .footer-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bili-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .bili-logo {
    background: #fb7299;
    color: #fff;
    font-weight: 900;
    font-size: 20px;
    padding: 6px 14px;
    border-radius: 8px;
  }
  .bili-text {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }
  .bv-tag {
    font-size: 22px;
    font-family: Menlo, Monaco, monospace;
    color: #ffd54f;
    font-weight: 700;
  }
  .footer-tip {
    font-size: 19px;
    color: #a59caa;
  }
  .footer-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .qr-box {
    width: 150px;
    height: 150px;
    background: #fff;
    border-radius: 16px;
    padding: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }
  .qr-box img {
    width: 100%;
    height: 100%;
    display: block;
  }
  .qr-tip {
    font-size: 16px;
    font-weight: 700;
    color: #ffd54f;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="glow-top"></div>
  <div class="glow-bottom"></div>

  <div class="header">
    <div class="badge-bar">
      <div class="badge">实机上手体验篇</div>
      <div class="badge secondary">UP主: RS_TV</div>
      <div class="badge secondary">时长: 09:47 完整实录</div>
    </div>
    <div class="main-title">
      “只要有屏幕<br><span class="highlight">就能推 Gal！</span>”
    </div>
    <div class="sub-title">
      在高中教室里，我把《千恋＊万花》移植进了有道词典笔！
    </div>
  </div>

  <div class="image-card">
    <img src="file:///Users/fuzihao/biliup/covers/pen_gal/cover_01.jpg">
    <div class="image-tag">📷 教室真机双指操作实拍</div>
  </div>

  <div class="features-grid">
    <div class="feat-item">
      <div class="feat-icon">⚡</div>
      <div class="feat-title">物理6倍速狂飙</div>
      <div class="feat-desc">双手并用极速快进，秒跳 9155 句文本</div>
    </div>
    <div class="feat-item">
      <div class="feat-icon">🙈</div>
      <div class="feat-title">求生欲鉴赏现场</div>
      <div class="feat-desc">某些特写环节物理遮挡露个头，刺激拉满</div>
    </div>
    <div class="feat-item">
      <div class="feat-icon">🔔</div>
      <div class="feat-title">下课铃一响保命</div>
      <div class="feat-desc">老师宣布下课，光速熄屏塞进笔袋</div>
    </div>
    <div class="feat-item">
      <div class="feat-icon">📺</div>
      <div class="feat-title">隐藏功能彩蛋</div>
      <div class="feat-desc">不仅能推Gal，居然还能看英配小猪佩奇</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-left">
      <div class="bili-brand">
        <div class="bili-logo">bilibili</div>
        <div class="bili-text">哔哩哔哩 现已发布</div>
      </div>
      <div class="bv-tag">BV1rnxy6oEMx</div>
      <div class="footer-tip">长按识别二维码 · 即可观看完整实操视频</div>
    </div>
    <div class="footer-right">
      <div class="qr-box">
        <img src="file://${qr1Path}">
      </div>
      <div class="qr-tip">扫码直接看视频</div>
    </div>
  </div>
</body>
</html>`;
  fs.writeFileSync(poster1HtmlPath, html1, 'utf8');

  console.log("3. 编写海报 2 HTML...");
  const html2 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; }
  body {
    width: 1080px;
    height: 1920px;
    background: radial-gradient(circle at 50% 15%, #180d24 0%, #0a0612 50%, #030206 100%);
    color: #fff;
    position: relative;
    overflow: hidden;
    padding: 75px 65px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .glow-top {
    position: absolute;
    top: -120px;
    right: 50px;
    width: 850px;
    height: 500px;
    background: radial-gradient(circle, rgba(255, 64, 129, 0.28) 0%, transparent 70%);
    pointer-events: none;
  }
  .glow-mid {
    position: absolute;
    top: 700px;
    left: -150px;
    width: 700px;
    height: 600px;
    background: radial-gradient(circle, rgba(123, 31, 162, 0.25) 0%, transparent 70%);
    pointer-events: none;
  }

  .header { position: relative; z-index: 2; }
  .badge-bar { display: flex; gap: 14px; margin-bottom: 24px; }
  .badge {
    background: linear-gradient(135deg, #ff4081, #e91e63);
    color: #fff;
    font-size: 22px;
    font-weight: 800;
    padding: 8px 24px;
    border-radius: 30px;
    letter-spacing: 1px;
    box-shadow: 0 4px 15px rgba(233,30,99,0.4);
  }
  .badge.tech {
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    box-shadow: 0 4px 15px rgba(0,114,255,0.4);
  }
  .badge.secondary {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #e0e0e0;
  }

  .main-title {
    font-size: 60px;
    font-weight: 900;
    line-height: 1.25;
    letter-spacing: 1px;
    color: #ffffff;
    margin-bottom: 16px;
    text-shadow: 0 4px 25px rgba(0,0,0,0.8);
  }
  .main-title .gold {
    color: #ffd54f;
    text-shadow: 0 0 30px rgba(255,213,79,0.5);
  }
  .sub-title {
    font-size: 27px;
    color: #c7bed1;
    font-weight: 500;
    line-height: 1.4;
  }

  .visual-container {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 520px;
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 50px rgba(255,64,129,0.3);
    border: 2px solid rgba(255,255,255,0.22);
  }
  .visual-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .visual-tag {
    position: absolute;
    top: 24px;
    left: 24px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(12px);
    padding: 10px 24px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.25);
    font-size: 22px;
    font-weight: 800;
    color: #ffd54f;
  }

  .features-card {
    position: relative;
    z-index: 2;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 26px 30px;
    backdrop-filter: blur(14px);
  }
  .card-heading {
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .card-heading::before {
    content: "";
    width: 6px;
    height: 24px;
    background: #ff4081;
    border-radius: 3px;
  }
  .features-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .feat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.04);
    padding: 12px 18px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .feat-row .dot {
    width: 10px;
    height: 10px;
    background: #ffd54f;
    border-radius: 50%;
    box-shadow: 0 0 8px #ffd54f;
    flex-shrink: 0;
  }
  .feat-row .text {
    font-size: 20px;
    font-weight: 600;
    color: #e5e0ec;
  }

  .resource-banner {
    position: relative;
    z-index: 2;
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.22), rgba(33, 150, 243, 0.22));
    border: 1px solid rgba(76, 175, 80, 0.45);
    border-radius: 20px;
    padding: 20px 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .res-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .res-title {
    font-size: 22px;
    font-weight: 800;
    color: #81c784;
  }
  .res-desc {
    font-size: 18px;
    color: #cfd8dc;
  }
  .res-btn {
    background: #4caf50;
    color: #fff;
    font-size: 19px;
    font-weight: 700;
    padding: 10px 20px;
    border-radius: 12px;
  }

  .footer {
    position: relative;
    z-index: 2;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 28px;
    padding: 28px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(16px);
  }
  .footer-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bili-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .bili-logo {
    background: #fb7299;
    color: #fff;
    font-weight: 900;
    font-size: 20px;
    padding: 6px 14px;
    border-radius: 8px;
  }
  .bili-text {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }
  .bv-tag {
    font-size: 22px;
    font-family: Menlo, Monaco, monospace;
    color: #ffd54f;
    font-weight: 700;
  }
  .footer-tip {
    font-size: 19px;
    color: #a59caa;
  }
  .footer-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .qr-box {
    width: 150px;
    height: 150px;
    background: #fff;
    border-radius: 16px;
    padding: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }
  .qr-box img {
    width: 100%;
    height: 100%;
    display: block;
  }
  .qr-tip {
    font-size: 16px;
    font-weight: 700;
    color: #ffd54f;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="glow-top"></div>
  <div class="glow-mid"></div>

  <div class="header">
    <div class="badge-bar">
      <div class="badge">官方特性展示 PV</div>
      <div class="badge tech">RibbonEngine 自研引擎</div>
      <div class="badge secondary">UP主: RS_TV</div>
    </div>
    <div class="main-title">
      不只是能跑，<span class="gold">还要好玩！</span>
    </div>
    <div class="sub-title">
      有道词典笔移植《千恋＊万花》《魔女的夜宴》双作特性演示
    </div>
  </div>

  <div class="visual-container">
    <img src="file:///Volumes/500GB/Ydpen/promo_video/output/snapshots/snap_22s.jpg">
    <div class="visual-tag">🌸 960×266 极限超宽屏实机运行</div>
  </div>

  <div class="features-card">
    <div class="card-heading">四大核心移植架构与功能特性</div>
    <div class="features-list">
      <div class="feat-row">
        <div class="dot"></div>
        <div class="text">千恋万花 & 魔女夜宴双作</div>
      </div>
      <div class="feat-row">
        <div class="dot"></div>
        <div class="text">打字机台词 & 角色语音同步</div>
      </div>
      <div class="feat-row">
        <div class="dot"></div>
        <div class="text">轻触立绘特写缩放交互</div>
      </div>
      <div class="feat-row">
        <div class="dot"></div>
        <div class="text">完整剧情树流程图任意跳转</div>
      </div>
      <div class="feat-row">
        <div class="dot"></div>
        <div class="text">30 槽位快速存档系统</div>
      </div>
      <div class="feat-row">
        <div class="dot"></div>
        <div class="text">BGM / 语音双声道软件混音</div>
      </div>
    </div>
  </div>

  <div class="resource-banner">
    <div class="res-left">
      <div class="res-title">📦 一键安装包 & 全开源代码已发布</div>
      <div class="res-desc">夸克网盘免折腾提取 · GitHub 搜索 RS114514 全开源</div>
    </div>
    <div class="res-btn">免费开源</div>
  </div>

  <div class="footer">
    <div class="footer-left">
      <div class="bili-brand">
        <div class="bili-logo">bilibili</div>
        <div class="bili-text">哔哩哔哩 现已发布</div>
      </div>
      <div class="bv-tag">BV1CYxp6uEqJ</div>
      <div class="footer-tip">长按识别二维码 · 即可在 B站 观看展示PV</div>
    </div>
    <div class="footer-right">
      <div class="qr-box">
        <img src="file://${qr2Path}">
      </div>
      <div class="qr-tip">扫码直接看视频</div>
    </div>
  </div>
</body>
</html>`;
  fs.writeFileSync(poster2HtmlPath, html2, 'utf8');

  console.log("4. 启动 Chrome 截取高清海报图片...");
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--allow-file-access-from-files', '--force-device-scale-factor=1', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });

  const out1 = path.join(outDir, 'poster_01_gameplay.jpg');
  await page.goto('file://' + poster1HtmlPath, { waitUntil: 'load' });
  await page.screenshot({ path: out1, quality: 95, type: 'jpeg' });
  console.log("海报 1 已生成:", out1);

  const out2 = path.join(outDir, 'poster_02_showcase.jpg');
  await page.goto('file://' + poster2HtmlPath, { waitUntil: 'load' });
  await page.screenshot({ path: out2, quality: 95, type: 'jpeg' });
  console.log("海报 2 已生成:", out2);

  await browser.close();
  console.log("所有海报生成完成！");
}

main().catch(e => {
  console.error("生成失败:", e);
  process.exit(1);
});
