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

test('복귀: vt-slug 가 가리키는 행에 이름이 붙는다', async ({ page }) => {
  await page.goto('/projects');
  await page.evaluate(() => sessionStorage.setItem('vt-slug', 'por-favor-harry'));
  await page.reload();
  const named = await page.evaluate(() =>
    document.querySelector<HTMLElement>('[data-row][data-slug="por-favor-harry"] [data-title]')!.style.viewTransitionName);
  expect(named).toBe('pj-title');
  const left = await page.evaluate(() => { try { return sessionStorage.getItem('vt-slug'); } catch { return null; } });
  expect(left).toBeNull();
});
