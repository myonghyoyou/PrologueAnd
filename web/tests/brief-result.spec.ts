import { test, expect, type Page } from '@playwright/test';

/** 질문을 다 거쳐 결과까지 — 예약(네이버)·사진 촬영을 고른 카페 */
async function finish(page: Page) {
  const pick = (n: string) => page.getByRole('radio', { name: n, exact: true }).check({ force: true });
  const next = () => page.locator('[data-brief-next]').click();
  await page.goto('/tools/brief');
  await pick('새로 만들기'); await next();
  await pick('가게(식당·카페 등)'); await page.locator('[data-brief-name]').fill('가람 로스터리'); await next();
  await pick('찾아오기'); await next();
  await next(); await next();
  await page.locator('[data-feature="예약 받기"] [data-seg="must"]').click(); await pick('네이버 예약 연결'); await next();
  await next();
  await pick('찍어 주길 원함'); await next();
  for (let i = 0; i < 6; i++) await next();
  await expect(page.locator('[data-brief-result]')).toBeVisible();
}

test.describe('결과', () => {
  test('요청서·영향·질문·비교표·안내가 순서대로', async ({ page }) => {
    await finish(page);
    await expect(page.locator('[data-brief-doc] h1')).toHaveText('홈페이지 제작 요청서 · 가람 로스터리');
    await expect(page.locator('[data-brief-impact] li')).toHaveCount(2);
    await expect(page.locator('[data-brief-vendor] li').first()).toHaveText('도메인과 호스팅은 제 이름으로 사 주시나요?');
    await expect(page.locator('[data-brief-compare] tbody tr')).toHaveCount(7);
    await expect(page.locator('[data-brief-privacy]')).toContainText('이 기기에만 저장돼요');
    const order = await page.locator('[data-brief-result] > [data-part]').evaluateAll((els) => els.map((e) => e.getAttribute('data-part')));
    expect(order).toEqual(['doc', 'impact', 'vendor', 'compare', 'export', 'privacy', 'prologue']);
  });

  test('처음부터 결과까지 서버로 나가는 요청이 없다', async ({ page }) => {
    const sent: string[] = [];
    page.on('request', (r) => { if (r.resourceType() === 'fetch' || r.resourceType() === 'xhr' || r.method() === 'POST' || r.url().includes('/api/')) sent.push(r.url()); });
    await finish(page);
    await page.locator('[data-brief-compare] input').first().fill('180만 원');
    expect(sent.filter((u) => !u.includes('_next/') && !u.includes('?_rsc'))).toEqual([]);
  });

  test('글자로 복사: 단원 포함, Prologue& 없음', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'w1440');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await finish(page);
    await page.locator('[data-brief-copy]').click();
    await expect(page.locator('[data-brief-copied]')).toHaveText('복사했어요');
    const t = await page.evaluate(() => navigator.clipboard.readText());
    expect(t).toContain('■ 기능');
    expect(t).not.toContain('Prologue');
  });

  test('복사가 막히면 글상자로 펼쳐 길게 눌러 복사 안내', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { get: () => undefined }); });
    await finish(page);
    await page.locator('[data-brief-copy]').click();
    await expect(page.locator('[data-brief-copybox]')).toBeVisible();
    await expect(page.locator('[data-brief-copybox-help]')).toHaveText('길게 눌러 복사해 주세요');
  });

  test('인쇄: 단추·비교표·영향·Prologue&·머리글이 안 보이고 요청서·질문은 보인다', async ({ page }) => {
    await finish(page);
    await page.emulateMedia({ media: 'print' });
    for (const sel of ['[data-brief-export]', '[data-brief-compare]', '[data-brief-impact]', '[data-brief-prologue]', 'header', '[data-brief-privacy]'])
      await expect(page.locator(sel).first()).toBeHidden();
    await expect(page.locator('[data-brief-doc]')).toBeVisible();
    await expect(page.locator('[data-brief-vendor]')).toBeVisible();
    await expect(page.locator('[data-brief-vendor] [data-print-only]')).toBeVisible();
    const top = await page.locator('[data-brief-doc] h1').evaluate((h) => h.getBoundingClientRect().top);
    expect(top).toBeLessThan(80);
  });

  test('답 고치기 → 그 질문 → 결과로 돌아가기', async ({ page }) => {
    await finish(page);
    await page.locator('[data-edit="features"]').click();
    await expect(page.locator('h1')).toHaveText('홈페이지에 어떤 기능이 필요하세요?');
    await page.locator('[data-brief-next]').click();
    await expect(page.locator('[data-brief-result]')).toBeVisible();
  });

  test('모두 지우기: 확인 후 첫 질문, 저장 비움', async ({ page }) => {
    await finish(page);
    page.once('dialog', (d) => d.accept());
    await page.locator('[data-brief-reset]').click();
    await expect(page.locator('h1')).toHaveText('새로 만드시나요, 지금 홈페이지를 고치시나요?');
    expect(await page.evaluate(() => [localStorage.getItem('prologue.brief.v1'), localStorage.getItem('prologue.brief.compare.v1')])).toEqual([expect.any(String), null]);
    // 첫 화면 상태가 다시 저장되므로 답 키는 빈 답으로 다시 생긴다 — 이전 답이 없는지 본다
    expect(await page.evaluate(() => localStorage.getItem('prologue.brief.v1'))).not.toContain('가람');
  });

  test('비교표는 새로고침해도 남고 요청서에는 없다', async ({ page }) => {
    await finish(page);
    await page.locator('[data-brief-compare] input').first().fill('180만 원');
    await page.reload();
    await expect(page.locator('[data-brief-compare] input').first()).toHaveValue('180만 원');
    await expect(page.locator('[data-brief-doc]')).not.toContainText('180만 원');
  });

  test('폰: 결과 화면 가로 스크롤 없음(표 상자 안은 예외)', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone');
    await finish(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
