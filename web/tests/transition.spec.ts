import { test, expect } from '@playwright/test';

test('클릭한 행에만 공유 이름이 붙는다', async ({ page }) => {
  await page.goto('/projects');
  const before = await page.evaluate(() =>
    [...document.querySelectorAll('[data-title]')].filter((e) => getComputedStyle(e).viewTransitionName === 'pj-title').length);
  expect(before).toBe(0);
  await page.evaluate(() => {
    const a = document.querySelector('a[data-row]') as HTMLElement;
    a.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  });
  const named = await page.evaluate(() =>
    [...document.querySelectorAll('[data-title]')].filter((e) => getComputedStyle(e).viewTransitionName === 'pj-title').length);
  expect(named).toBe(1);
});

test('복귀: 클라이언트 내비게이션으로 /projects 에 도착하면 vt-slug 가 가리키는 행에 이름이 붙는다', async ({ page }) => {
  // style.viewTransitionName 이 'pj-title' 이 되는 순간은 한두 프레임 뒤 곧 지워지므로,
  // 이동 전에 옵저버를 심어 두고 "붙는 순간이 있었는가"를 감시한다 — 한 번 스냅샷을 찍어 읽는 방식은
  // 양쪽으로 레이스(아직 안 붙었거나, 이미 지워졌거나)라서 쓰지 않는다.
  await page.addInitScript(() => {
    (window as unknown as { __named?: boolean }).__named = false;
    const check = () => {
      const el = document.querySelector<HTMLElement>('[data-row][data-slug="por-favor-harry"] [data-title]');
      if (el && el.style.viewTransitionName === 'pj-title') (window as unknown as { __named?: boolean }).__named = true;
    };
    const attach = () => {
      new MutationObserver(check).observe(document.documentElement, { attributes: true, attributeFilter: ['style'], subtree: true });
    };
    // addInitScript 는 문서가 생기기 전에도 실행되므로, documentElement 가 아직 없을 수 있다.
    if (document.documentElement) attach();
    else document.addEventListener('DOMContentLoaded', attach);
  });

  await page.goto('/');
  // 페이지 재로드가 아니라 클라이언트 내비게이션임을 증명할 마커 — 하드 리로드라면 사라진다.
  await page.evaluate(() => { (window as unknown as { __navMarker?: boolean }).__navMarker = true; });
  await page.evaluate(() => sessionStorage.setItem('vt-slug', 'por-favor-harry'));

  await page.locator('a[href="/projects"]').click();
  await page.waitForURL('**/projects');

  const survivedClientNav = await page.evaluate(() => (window as unknown as { __navMarker?: boolean }).__navMarker === true);
  expect(survivedClientNav).toBe(true);

  await page.waitForFunction(() => (window as unknown as { __named?: boolean }).__named === true);

  const left = await page.evaluate(() => { try { return sessionStorage.getItem('vt-slug'); } catch { return null; } });
  expect(left).toBeNull();
});
