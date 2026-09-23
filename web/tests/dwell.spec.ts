import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

const dwellY = (page: import('@playwright/test').Page, sel: string, k: number) =>
  page.evaluate(([s, r]) => {
    const d = document.querySelector(s as string) as HTMLElement;
    const pan = d.querySelector('[data-pan]') as HTMLElement;
    return d.getBoundingClientRect().top + window.scrollY - 64 + (d.offsetHeight - pan.offsetHeight) * (r as number);
  }, [sel, k] as const);

test('03~05 머무름: 구간을 지나며 t가 0 → 1', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — use-dwell.ts는 1024px 미만에서 t=1 고정');
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

test('머무름 동안 판이 상단 64에 붙어 있다', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — use-dwell.ts는 1024px 미만에서 핀 고정을 하지 않음');
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  await scrollToY(page, await dwellY(page, '[data-dwell="3"]', 0.5));
  const top = await page.evaluate(() =>
    Math.round((document.querySelector('[data-dwell="3"] [data-pan]') as HTMLElement).getBoundingClientRect().top));
  expect(top).toBeGreaterThanOrEqual(62);
  expect(top).toBeLessThanOrEqual(66);
});

test('폰: 머무름 구간이 빈 여백(120vh)을 남기지 않는다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용 — 데스크톱은 120vh 구간 안에서 판을 붙인다');
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  const gaps = await page.evaluate(() => {
    const r = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    return { after03: Math.round(r('#s06').top - r('#s03').bottom), after07: Math.round(r('#s09').top - r('#s07').bottom) };
  });
  expect(gaps.after03).toBeLessThan(120);
  expect(gaps.after07).toBeLessThan(120);
});
