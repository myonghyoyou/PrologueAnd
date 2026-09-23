import { test, expect } from '@playwright/test';

test('판은 화면 높이이고 넘치지 않는다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  const over = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-pan]')]
      .filter((p) => p.scrollHeight > p.clientHeight + 1).map((p) => p.id));
  expect(over).toEqual([]);
  const hs = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(hs).toBeLessThanOrEqual(0);
});

test('비공개 프로젝트는 목록으로', async ({ page }) => {
  await page.goto('/projects/custom-commerce');
  await expect(page).toHaveURL(/\/projects$/);
});
