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

test('V9 모션 줄이기: 02 흐름은 완성(t=1), 와이프는 After 전부', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => Number(document.querySelector<HTMLElement>('#flow [data-flow]')!.dataset.t))).toBe(1);
  const right = await page.evaluate(() =>
    Number((document.querySelector('[data-wipe-after]') as HTMLElement).style.clipPath.match(/inset\(0px\s+([\d.]+)%/)?.[1] ?? NaN));
  expect(right).toBe(0);
  await ctx.close();
});
