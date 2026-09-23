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
