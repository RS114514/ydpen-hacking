const puppeteer = require('/Volumes/500GB/Ydpen/promo_video/node_modules/puppeteer-core');
const path = require('path');

(async () => {
  console.log("启动浏览器...");
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--allow-file-access-from-files', '--force-device-scale-factor=1', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });

  console.log("正在渲染海报 1 (实操篇)...");
  await page.goto('file://' + path.resolve(__dirname, 'poster1.html'), { waitUntil: 'load' });
  await page.screenshot({ path: path.resolve(__dirname, '../output/poster_01_gameplay.jpg'), quality: 95 });
  console.log("海报 1 已生成");

  console.log("正在渲染海报 2 (展示篇)...");
  await page.goto('file://' + path.resolve(__dirname, 'poster2.html'), { waitUntil: 'load' });
  await page.screenshot({ path: path.resolve(__dirname, '../output/poster_02_showcase.jpg'), quality: 95 });
  console.log("海报 2 已生成");

  await browser.close();
  console.log("全部海报生成成功！");
})().catch(e => {
  console.error(e);
  process.exit(1);
});
