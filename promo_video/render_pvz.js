const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const FPS = 30;

(async () => {
  console.log('启动 Chrome 渲染引擎 [PvZ]...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--allow-file-access-from-files', '--force-device-scale-factor=1', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const indexPath = path.join(__dirname, 'pvz_site/index.html');
  await page.goto('file://' + indexPath + '?render', { waitUntil: 'load' });
  await page.evaluate(() => Promise.all(
    [...document.querySelectorAll('video')].map(v => new Promise(res => {
      if (v.readyState >= 2) { res(); return; }
      const done = () => res();
      v.addEventListener('loadeddata', done, { once: true });
      v.addEventListener('error', done, { once: true });
      setTimeout(done, 15000);
    }))
  ));

  const dur = await page.evaluate(() => window.DURATION || 27.5);
  const total = Math.round(dur * FPS);
  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'ydpen_pvz_promo.mp4');

  const bgmPath = path.join(__dirname, 'pvz_site/a/pvz_bgm.mp3');
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
    '-af', `afade=t=in:d=0.8,afade=t=out:st=${dur - 2.0}:d=2.0`,
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
      console.log(`[PvZ 渲染中] ${i}/${total} (${((i / total) * 100).toFixed(1)}%) | 用时 ${elapsed}s`);
    }
  }

  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on('close', code => code === 0 ? resolve() : reject(new Error('FFmpeg exit ' + code)));
  });
  await browser.close();
  console.log('PvZ 视频渲染完成 -> ' + out);
})();
