import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

test('표지에 숫자 3개와 메타 4행이 있다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-num]')).toHaveCount(3);
  await expect(page.locator('[data-meta-row]')).toHaveCount(4);
});

// 작업 3(여백 주석)에서 되살린다
test.fixme('핫스팟 호버가 데이터 좌표와 맞는다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  // locator.hover() 는 요소를 화면으로 스크롤한 뒤 한 번 더 스크롤해서, mouseenter 직후 mouseleave 가 와
  // 하이라이트가 꺼지곤 했다(I5). 먼저 s06 정거장(판 위 − 64)에 서고, 실제 마우스를 항목 가운데로 옮긴다.
  await scrollToY(page, await page.evaluate(() =>
    document.getElementById('s06')!.getBoundingClientRect().top + window.scrollY - 64));
  let spot = await page.locator('[data-spot="1"]').boundingBox();
  const vh = page.viewportSize()!.height;
  if (!spot || spot.y < 0 || spot.y + spot.height > vh) {
    // 폰: 판이 길어 목록이 첫 화면 밖이다 — 목록이 화면 가운데 오게 한 번 더 옮긴다
    await scrollToY(page, await page.evaluate(() =>
      document.querySelector('[data-spot="1"]')!.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2));
    spot = await page.locator('[data-spot="1"]').boundingBox();
  }
  await page.mouse.move(spot!.x + spot!.width / 2, spot!.y + spot!.height / 2);
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

// 작업 3(여백 주석)에서 되살린다
test.fixme('핫스팟 키보드 포커스가 하이라이트를 보여준다', async ({ page }) => {
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
