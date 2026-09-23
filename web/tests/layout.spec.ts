import { test, expect } from '@playwright/test';

test.describe('상세 — 문서형 뼈대', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/por-favor-harry');
    await page.waitForTimeout(600);
  });

  test('장 네 개가 순서대로, 번호 01~04', async ({ page }) => {
    const chs = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-chapter]')].map((c) => ({
      id: c.id, lab: (c.querySelector('[data-chapter-label]')!.textContent ?? '').replace(/\s+/g, ' ').trim(),
    })));
    expect(chs.map((c) => c.id)).toEqual(['problem', 'flow', 'screens', 'before-after']);
    expect(chs.map((c) => c.lab.slice(0, 2))).toEqual(['01', '02', '03', '04']);
  });

  test('판 구조가 남아 있지 않다', async ({ page }) => {
    expect(await page.locator('[data-pan], [data-dwell]').count()).toBe(0);
  });

  test('그림은 원본 픽셀보다 크게 그려지지 않는다', async ({ page }) => {
    const over = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-frame]')]
      .filter((f) => f.querySelector('img')!.getBoundingClientRect().width > Number(f.dataset.w) + 1)
      .map((f) => f.dataset.w));
    expect(over).toEqual([]);
  });

  test('가로 스크롤이 없다', async ({ page }) => {
    const vw = page.viewportSize()!.width;
    expect(await page.evaluate(() => window.innerWidth)).toBe(vw);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test('끝: 문의 버튼과 다음 이야기', async ({ page }) => {
    await expect(page.locator('[data-cta]')).toBeVisible();
    await expect(page.locator('[data-teaser]')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('WHAT I LEARNED');
  });
});
