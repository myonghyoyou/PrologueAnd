// 표지 엑셀 HTML 을 1280×800 · DPR 2 로 찍는다. 사용: web/ 에서 node ../design/case-assets/shoot-excel.cjs
const path = require('node:path');
const { chromium } = require(path.resolve(__dirname, '../../web/node_modules/playwright'));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await p.goto('file:///' + path.resolve(__dirname, 'shift-board-excel.html').replace(/\\/g, '/'));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.resolve(__dirname, '../../web/public/screens/shift/excel-cover.png') });
  console.log(JSON.stringify(await p.evaluate(() => window.PINS)));
  await b.close();
})();
