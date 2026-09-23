import { test, expect } from '@playwright/test';

test('목록은 6행, 공개된 것만 링크', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('[data-row]')).toHaveCount(6);
  await expect(page.locator('a[data-row]')).toHaveCount(1);
  await expect(page.locator('[data-row]:not(a)').first()).toContainText('준비 중');
});

test('목록은 가운데 읽기 폭이고 가로 스크롤이 없다', async ({ page }) => {
  await page.goto('/projects');
  const r = await page.locator('main').boundingBox();
  const vw = page.viewportSize()!.width;
  expect(Math.abs(r!.x - (vw - r!.x - r!.width))).toBeLessThanOrEqual(1);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(0);
});

test('목록 행이 화면 밖으로 삐져나오지 않는다 (폰에서 레이아웃 뷰포트가 넓어지면 뷰 전환이 중단된다)', async ({ page }) => {
  await page.goto('/projects');
  const vw = page.viewportSize()!.width;
  // 폰 에뮬레이션에서는 넘친 만큼 innerWidth 자체가 넓어져 scrollWidth 비교로는 잡히지 않는다 — 설정한 폭과 직접 비교한다
  expect(await page.evaluate(() => window.innerWidth)).toBe(vw);
  const right = await page.evaluate(() =>
    Math.max(...[...document.querySelectorAll('[data-row]')].map((r) => r.getBoundingClientRect().right)));
  expect(right).toBeLessThanOrEqual(vw);
});
