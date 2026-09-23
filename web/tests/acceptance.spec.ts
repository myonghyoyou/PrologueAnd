import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

test.describe('상세 수용 기준', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/por-favor-harry');
    await page.waitForTimeout(700);
  });

  test('V1 판 넘침 0', async ({ page }) => {
    const over = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-pan]')].filter((p) => p.scrollHeight > p.clientHeight + 1).map((p) => p.id));
    expect(over).toEqual([]);
  });

  test('V2-a 정거장 개수가 판 구성과 맞는다', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 전용');
    // 판 13장 중 s03 머무름(3) + s07 머무름(2) → 11 + 3 + 2 = 16
    const n = await page.evaluate(() => {
      const plain = document.querySelectorAll('[data-pan]:not([data-dwell] [data-pan])').length;
      const d3 = document.querySelectorAll('[data-dwell="3"]').length * 3;
      const d2 = document.querySelectorAll('[data-dwell="2"]').length * 2;
      return plain + d3 + d2;
    });
    expect(n).toBe(16);
  });

  test('V2-b 휠 한 칸에 정거장 하나', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 전용');
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeGreaterThan(before);
    const panTop = await page.evaluate(() => {
      const t = [...document.querySelectorAll<HTMLElement>('[data-pan]')]
        .map((e) => Math.round(e.getBoundingClientRect().top)).find((v) => v > -10 && v < 200);
      return t ?? -999;
    });
    expect(Math.abs(panTop - 64)).toBeLessThanOrEqual(6);
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

test('V9 모션 줄이기에서 즉시 최종 상태', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/projects/por-favor-harry');
  const y = await page.evaluate(() => {
    const d = document.querySelector('[data-dwell="3"]') as HTMLElement;
    const pan = d.querySelector('[data-pan]') as HTMLElement;
    return d.getBoundingClientRect().top + window.scrollY - 64 + (d.offsetHeight - pan.offsetHeight) * 0.7;
  });
  await scrollToY(page, y);
  const t = await page.evaluate(() => Number((document.querySelector('[data-dwell="3"]') as HTMLElement).dataset.t));
  expect([0, 1]).toContain(Math.round(t));
  await ctx.close();
});
