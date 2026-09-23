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

test('02 끝(t=1): 네 갈래는 한 줄로 합쳐지고 갈래 이름은 사라진다', async ({ page }) => {
  await scrollToY(page, await page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('#flow [data-flow]')!;
    const r = f.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2 - 0.4 * window.innerHeight + 20;
  }));
  await page.waitForTimeout(100);
  expect(await t(page, '#flow')).toBe(1);
  const r = await page.evaluate(() => {
    const svg = document.querySelector('#flow [data-flow] svg')!;
    return {
      starts: [...svg.querySelectorAll('[data-src-path]')].map((p) => p.getAttribute('d')!.match(/^M40 ([\d.]+)/)![1]),
      opacity: [...svg.querySelectorAll<SVGElement>('[data-src-label]')].map((l) => Number(getComputedStyle(l).opacity)),
    };
  });
  expect(new Set(r.starts).size).toBe(1);
  expect(r.opacity.every((o) => o === 0)).toBe(true);

  // 첫 단계(요청 링크) 점은 합쳐진 선의 시작점에, 나머지 점은 화살표까지 같은 간격으로
  const steps = await page.evaluate(() => [...document.querySelectorAll('#flow [data-flow] [data-step]')]
    .map((c) => Number(c.getAttribute('cx'))));
  expect(steps[0]).toBe(40);
  const gaps = steps.slice(1).map((x, i) => x - steps[i]);
  expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.01);
});

test('01 정지 상태는 네 갈래 그대로', async ({ page }) => {
  const r = await page.evaluate(() => {
    const svg = document.querySelector('#problem [data-flow] svg')!;
    return {
      starts: [...svg.querySelectorAll('[data-src-path]')].map((p) => p.getAttribute('d')!.match(/^M40 ([\d.]+)/)![1]),
      opacity: [...svg.querySelectorAll<SVGElement>('[data-src-label]')].map((l) => Number(getComputedStyle(l).opacity)),
    };
  });
  expect(new Set(r.starts).size).toBe(4);
  expect(r.opacity.every((o) => o === 1)).toBe(true);
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
