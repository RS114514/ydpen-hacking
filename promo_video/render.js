const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');

const FPS = 30;

(async () => {
  console.log("启动 Chrome 渲染引擎...");
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--allow-file-access-from-files', '--force-device-scale-factor=1', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const indexPath = path.join(__dirname, 'site/index.html');
  await page.goto('file://' + indexPath + '?render', { waitUntil: 'load' });
  
  const dur = await page.evaluate(() => window.DURATION || 62);
  const total = Math.round(dur * FPS);
  const out = path.join(__dirname, 'output/ydpen_galgame_promo.mp4');
  
  console.log(`视频时长: ${dur}s, 帧率: ${FPS}fps, 总帧数: ${total} 帧`);
  console.log(`目标输出文件: ${out}`);
  
  const bgmPath = path.join(__dirname, 'site/a/bgm.mp3');
  const ffArgs = [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-i', '-',
    '-i', bgmPath,
    '-map', '0:v',
    '-map', '1:a',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '256k',
    '-af', `afade=t=in:d=1,afade=t=out:st=${dur - 2.5}:d=2.5`,
    '-t', String(dur),
    out
  ];
  
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  
  const startTime = Date.now();
  for (let i = 0; i < total; i++) {
    const curTime = i / FPS;
    await page.evaluate(t => window.render(t), curTime);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    
    if (!ff.stdin.write(buf)) {
      await new Promise(r => ff.stdin.once('drain', r));
    }
    
    if (i % 60 === 0 || i === total - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((i / total) * 100).toFixed(1);
      const fps = (i / ((Date.now() - startTime) / 1000) || 1).toFixed(1);
      console.log(`[渲染中] 帧: ${i}/${total} (${pct}%) | 已用时: ${elapsed}s | 渲染速度: ${fps} fps`);
    }
  }
  
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`宣传视频渲染完成！总耗时: ${totalElapsed}s`);
  console.log(`输出文件: ${out}`);
  console.log(`========================================`);
})();
