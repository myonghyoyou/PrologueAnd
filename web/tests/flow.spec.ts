import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

const t = (page: import('@playwright/test').Page, sel: string) =>
  page.evaluate((s) => Number(document.querySelector<HTMLElement>(`${s} [data-flow]`)!.dataset.t), sel);

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
});

test('01 은 정지 상태(t=0)', async ({ page }) => {
  await scrollToY(page, await page.evaluate(() => document.getElementById('problem')!.getBoundingClientRect().top + window.scrollY));
  expect(await t(page, '#problem')).toBe(0);
});

test('02 는 지나가며 0 → 1: 윗변이 화면 85% 에서 0, 가운데가 40% 에서 1', async ({ page }) => {
  const y = (k: number) => page.evaluate((k) => {
    const f = document.querySelector<HTMLElement>('#flow [data-flow]')!;
    const r = f.getBoundingClientRect(), top = r.top + window.scrollY, vh = window.innerHeight;
    const s0 = top - 0.85 * vh, s1 = top + r.height / 2 - 0.4 * vh;
    return s0 + (s1 - s0) * k;
  }, k);
  await scrollToY(page, (await y(0)) - 20);
  expect(await t(page, '#flow')).toBe(0);
  await scrollToY(page, await y(0.5));
  const mid = await t(page, '#flow');
  expect(mid).toBeGreaterThan(0.4);
  expect(mid).toBeLessThan(0.6);
  await scrollToY(page, (await y(1)) + 20);
  expect(await t(page, '#flow')).toBe(1);
});

test('문구는 데이터에서, 그림 설명이 붙는다', async ({ page }) => {
  const r = await page.evaluate(() => {
    const svg = document.querySelector('#flow [data-flow] svg')!;
    return { text: svg.textContent, label: svg.getAttribute('aria-label'), role: svg.getAttribute('role') };
  });
  expect(r.text).toContain('직접 방문');
  expect(r.text).toContain('진행 상황 안내');
  expect(r.role).toBe('img');
  expect(r.label).toContain('한 줄 흐름');
});

test('색은 토큰만', async ({ page }) => {
  expect(await page.evaluate(() => document.querySelector('#flow [data-flow] svg')!.innerHTML.includes('#8A96C2'))).toBe(false);
});
