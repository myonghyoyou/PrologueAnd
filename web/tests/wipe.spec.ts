import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

const PIN = 88;   // wipe.module.css .stage top
const trackY = (page: import('@playwright/test').Page, k: number) => page.evaluate(([k, pin]) => {
  const tr = document.querySelector<HTMLElement>('[data-wipe-track]')!;
  return tr.getBoundingClientRect().top + window.scrollY - pin + window.innerHeight * k;
}, [k, PIN] as const);
const right = (page: import('@playwright/test').Page) => page.evaluate(() =>
  Number((document.querySelector('[data-wipe-after]') as HTMLElement).style.clipPath.match(/inset\(0px\s+([\d.]+)%/)?.[1] ?? NaN));

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
});

test('와이프: 무대가 붙은 채 경계선이 0% → 100%', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — 폰은 붙이지 않고 쌓는다');
  await scrollToY(page, await trackY(page, 0));
  expect(await right(page)).toBeGreaterThanOrEqual(99);
  await scrollToY(page, await trackY(page, 0.5));
  expect(await right(page)).toBeGreaterThan(40);
  expect(await right(page)).toBeLessThan(60);
  const top = await page.evaluate(() => document.querySelector<HTMLElement>('[data-wipe-stage]')!.getBoundingClientRect().top);
  expect(Math.abs(top - PIN)).toBeLessThanOrEqual(2);
  await scrollToY(page, await trackY(page, 1));
  expect(await right(page)).toBeLessThanOrEqual(1);
});

test('와이프 무대가 화면 안에 다 들어온다', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용');
  await scrollToY(page, await trackY(page, 0.5));
  const bottom = await page.evaluate(() => document.querySelector<HTMLElement>('[data-wipe-stage]')!.getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test('콜라주와 화면의 크기가 같다', async ({ page }) => {
  const [a, b] = await page.evaluate(() => {
    const r1 = (document.querySelector('[data-wipe-before]') as HTMLElement).getBoundingClientRect();
    const r2 = (document.querySelector('[data-wipe-after]') as HTMLElement).getBoundingClientRect();
    return [Math.round(r1.width), Math.round(r2.width)];
  });
  expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
});

test('폰: Before 위, After 아래로 둘 다 보인다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용 — 데스크톱은 와이프');
  await expect(page.locator('[data-wipe-before]')).toBeVisible();
  await expect(page.locator('[data-wipe-after]')).toBeVisible();
  const r = await page.evaluate(() => {
    const b = (document.querySelector('[data-wipe-before]') as HTMLElement).getBoundingClientRect();
    const a = document.querySelector('[data-wipe-after]') as HTMLElement;
    const edge = document.querySelector('[data-wipe-edge]') as HTMLElement | null;
    return { bh: b.height, ah: a.getBoundingClientRect().height, bBottom: b.bottom, aTop: a.getBoundingClientRect().top,
             clip: getComputedStyle(a).clipPath, edge: edge ? getComputedStyle(edge).display : 'none' };
  });
  expect(r.bh).toBeGreaterThan(0);
  expect(r.ah).toBeGreaterThan(0);
  expect(r.aTop).toBeGreaterThanOrEqual(r.bBottom);
  expect(r.clip).toBe('none');
  expect(r.edge).toBe('none');
});
