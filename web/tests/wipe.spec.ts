import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

test('07 와이프: 경계선이 0% → 100%로 이동', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  const at = async (k: number) => {
    const y = await page.evaluate((r) => {
      const d = document.querySelector('[data-dwell="2"]') as HTMLElement;
      const pan = d.querySelector('[data-pan]') as HTMLElement;
      return d.getBoundingClientRect().top + window.scrollY - 64 + (d.offsetHeight - pan.offsetHeight) * r;
    }, k);
    await scrollToY(page, y);
    return page.evaluate(() => (document.querySelector('[data-wipe-after]') as HTMLElement).style.clipPath);
  };
  expect(await at(0)).toContain('100%');
  expect(await at(1)).toContain('0%');
});

test('콜라주와 화면의 크기가 같다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  const [a, b] = await page.evaluate(() => {
    const before = document.querySelector('[data-wipe-before]') as HTMLElement;
    const after = document.querySelector('[data-wipe-after]') as HTMLElement;
    const r1 = before.getBoundingClientRect(), r2 = after.getBoundingClientRect();
    return [Math.round(r1.width), Math.round(r2.width)];
  });
  expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
});
