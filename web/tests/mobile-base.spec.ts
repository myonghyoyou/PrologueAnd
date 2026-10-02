import { test, expect } from '@playwright/test';
import { isIOS, lenisOptions } from '../lib/device';

test('iOS 판별: iPhone · iPad · 데스크톱 모드 iPad 는 참, 안드로이드 · 맥은 거짓', () => {
  expect(isIOS('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5)).toBe(true);
  expect(isIOS('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 'iPad', 5)).toBe(true);
  expect(isIOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5)).toBe(true);   // 데스크톱 모드 iPad
  expect(isIOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0)).toBe(false);  // 맥
  expect(isIOS('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 'Linux armv8l', 5)).toBe(false);
});

test('Lenis 설정: iOS 는 손가락 스크롤 기본, 안드로이드는 약하게 부드럽게, 데스크톱은 그대로', () => {
  expect(lenisOptions({ ios: true, touch: true })).toMatchObject({ syncTouch: false, lerp: 0.1 });
  expect(lenisOptions({ ios: false, touch: true })).toMatchObject({ syncTouch: true, lerp: 0.075, syncTouchLerp: 0.075 });
  expect(lenisOptions({ ios: false, touch: false })).toMatchObject({ syncTouch: false, lerp: 0.1, smoothWheel: true });
});

for (const [name, ua, platform, sync] of [
  ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', 'iPhone', false],
  ['Android', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36', 'Linux armv8l', true],
] as const) {
  test(`${name}: 실제 Lenis 의 syncTouch = ${sync}`, async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: ua, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript((pf) => Object.defineProperty(navigator, 'platform', { get: () => pf }), platform);
    const page = await ctx.newPage();
    await page.goto('/projects');
    await page.waitForFunction(() => !!(window as unknown as { __lenis?: unknown }).__lenis);
    expect(await page.evaluate(() => (window as unknown as { __lenis: { options: { syncTouch: boolean } } }).__lenis.options.syncTouch)).toBe(sync);
    await ctx.close();
  });
}

test.describe('폰 공통', () => {
  test.skip(({ isMobile }) => !isMobile, '폰 전용');
  test('viewport-fit=cover, html·body 배경 bone-50, 헤더 단색', async ({ page }) => {
    await page.goto('/projects');
    expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toContain('viewport-fit=cover');
    const bg = await page.evaluate(() => [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor]);
    expect(bg).toEqual(['rgb(250, 249, 246)', 'rgb(250, 249, 246)']);
    expect(await page.locator('header').first().evaluate((h) => getComputedStyle(h).backgroundImage)).toBe('none');
  });
  test('html 에 data-hdr-hide 가 붙으면 헤더가 화면 위로 숨는다', async ({ page }) => {
    await page.goto('/projects');
    await page.evaluate(() => document.documentElement.setAttribute('data-hdr-hide', ''));
    await page.waitForTimeout(400);
    expect(await page.locator('header').first().evaluate((h) => h.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
  });
});
