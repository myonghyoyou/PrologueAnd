// 공유 미리보기 그림 찍기 — og-image.html 을 1200×630 으로 찍어 web/app/opengraph-image.png 에 둔다.
// 구글 글꼴은 브라우저 대신 node 로 받아 넘긴다(일부 망에서 브라우저 인증서 확인이 막힌다).
// 사용: node design/case-assets/og-image.cjs
const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../../web/node_modules/playwright'));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    const r = await fetch(route.request().url(), { headers: { 'user-agent': route.request().headers()['user-agent'] } });
    await route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? '', 'access-control-allow-origin': '*' }, body: Buffer.from(await r.arrayBuffer()) });
  });
  await p.goto(require('url').pathToFileURL(path.resolve(__dirname, 'og-image.html')).href);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.locator('#og').screenshot({ path: path.resolve(__dirname, '../../web/app/opengraph-image.png') });
  await b.close();
})();
