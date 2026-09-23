import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

test('07 와이프: 경계선이 0% → 100%로 이동', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — use-dwell.ts는 1024px 미만에서 핀 고정을 하지 않음');
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
  // clipPath는 "inset(0px XX% 0px 0px)" 형태 — 오른쪽 인셋 퍼센트를 수치로 비교한다.
  // w2560처럼 서브픽셀 스크롤에서 100%가 99.99%로 반올림될 수 있어 문자열 포함 대신 임계값으로 비교.
  const rightPct = (clip: string) => Number(clip.match(/inset\(0px\s+([\d.]+)%/)?.[1] ?? NaN);
  expect(rightPct(await at(0))).toBeGreaterThanOrEqual(99);
  expect(rightPct(await at(1))).toBeLessThanOrEqual(1);
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

test('폰: 07 은 Before 위, After 아래로 둘 다 보인다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용 — 데스크톱은 와이프');
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  await expect(page.locator('[data-wipe-before]')).toBeVisible();
  await expect(page.locator('[data-wipe-after]')).toBeVisible();
  const r = await page.evaluate(() => {
    const b = (document.querySelector('[data-wipe-before]') as HTMLElement).getBoundingClientRect();
    const a = document.querySelector('[data-wipe-after]') as HTMLElement;
    const ar = a.getBoundingClientRect();
    const edge = document.querySelector('[data-wipe-edge]') as HTMLElement | null;
    return { bh: b.height, ah: ar.height, bBottom: b.bottom, aTop: ar.top, clip: getComputedStyle(a).clipPath,
             edge: edge ? getComputedStyle(edge).display : 'none' };
  });
  expect(r.bh).toBeGreaterThan(0);
  expect(r.ah).toBeGreaterThan(0);
  expect(r.aTop).toBeGreaterThanOrEqual(r.bBottom);
  expect(r.clip).toBe('none');
  expect(r.edge).toBe('none');
});
