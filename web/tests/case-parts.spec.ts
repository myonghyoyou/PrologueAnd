import { test, expect } from '@playwright/test';

test('표지에 숫자 3개와 메타 4행이 있다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-num]')).toHaveCount(3);
  await expect(page.locator('[data-meta-row]')).toHaveCount(4);
});

test('핫스팟 호버가 데이터 좌표와 맞는다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.locator('[data-spot="1"]').hover();
  const box = await page.evaluate(() => {
    const hl = document.querySelector('[data-spot-hl]') as HTMLElement;
    const sh = hl.parentElement as HTMLElement;
    const r = hl.getBoundingClientRect(), s = sh.getBoundingClientRect();
    return { x: Math.round(((r.left - s.left - 6) / (s.width - 12)) * 100), y: Math.round(((r.top - s.top - 6) / (s.height - 12)) * 100) };
  });
  expect(box).toEqual({ x: 15, y: 16 });
});

test('마지막 판에 문의 버튼과 다음 이야기가 있다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-cta]')).toBeVisible();
  await expect(page.locator('[data-teaser]')).toBeVisible();
});
