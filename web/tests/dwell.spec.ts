import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

const dwellY = (page: import('@playwright/test').Page, sel: string, k: number) =>
  page.evaluate(([s, r]) => {
    const d = document.querySelector(s as string) as HTMLElement;
    const pan = d.querySelector('[data-pan]') as HTMLElement;
    return d.getBoundingClientRect().top + window.scrollY - 64 + (d.offsetHeight - pan.offsetHeight) * (r as number);
  }, [sel, k] as const);

test('03~05 머무름: 구간을 지나며 t가 0 → 1', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  const read = async (k: number) => {
    await scrollToY(page, await dwellY(page, '[data-dwell="3"]', k));
    return page.evaluate(() => Number((document.querySelector('[data-dwell="3"]') as HTMLElement).dataset.t));
  };
  expect(await read(0)).toBeCloseTo(0, 1);
  expect(await read(0.5)).toBeCloseTo(0.5, 1);
  expect(await read(1)).toBeCloseTo(1, 1);
});

test('머무름 동안 판이 상단 64에 붙어 있다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  await scrollToY(page, await dwellY(page, '[data-dwell="3"]', 0.5));
  const top = await page.evaluate(() =>
    Math.round((document.querySelector('[data-dwell="3"] [data-pan]') as HTMLElement).getBoundingClientRect().top));
  expect(top).toBeGreaterThanOrEqual(62);
  expect(top).toBeLessThanOrEqual(66);
});
