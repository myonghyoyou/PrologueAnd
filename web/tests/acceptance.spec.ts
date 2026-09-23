import { test, expect } from '@playwright/test';

test.describe('상세 수용 기준', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/por-favor-harry');
    await page.waitForTimeout(700);
  });

  test('V5 가로 스크롤 없음, 헤더 왼쪽선 = 표지 왼쪽선', async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const brand = await page.locator('[data-brand]').boundingBox();
    const cover = await page.locator('[data-cover-title]').boundingBox();
    expect(Math.abs(brand!.x - cover!.x)).toBeLessThanOrEqual(2);
  });

  test('V7 비공개는 목록으로', async ({ page }) => {
    await page.goto('/projects/quote-sheet');
    await expect(page).toHaveURL(/\/projects$/);
  });
});
