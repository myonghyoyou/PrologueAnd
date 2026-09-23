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

test('핫스팟 키보드 포커스가 하이라이트를 보여준다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.locator('[data-spot="1"]').focus();
  // focus → React state 커밋은 CDP 왕복과 비동기라, 하이라이트가 보일 때까지 기다린 뒤 좌표를 읽는다
  // (같은 이유로 transition.spec.ts의 복귀 테스트도 MutationObserver로 기다린다)
  await page.waitForFunction(() => {
    const hl = document.querySelector('[data-spot-hl]') as HTMLElement | null;
    return !!hl && getComputedStyle(hl).opacity === '1';
  });
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
