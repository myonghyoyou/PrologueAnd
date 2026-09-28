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

const PIN = 80;   // pinned.module.css .stage top
/** 데스크톱: 02 장 트랙 윗변이 PIN 에서 k 화면만큼 지난 스크롤 위치 */
const trackY = (page: import('@playwright/test').Page, k: number) => page.evaluate(([k, pin]) => {
  const tr = document.querySelector<HTMLElement>('#flow [data-pin-track]')!;
  return tr.getBoundingClientRect().top + window.scrollY - pin + window.innerHeight * k;
}, [k, PIN] as const);
/** 폰: 그림 윗변이 화면 85% → 가운데가 40% 사이의 k 지점 */
const passY = (page: import('@playwright/test').Page, k: number) => page.evaluate((k) => {
  const f = document.querySelector<HTMLElement>('#flow [data-flow]')!;
  const r = f.getBoundingClientRect(), top = r.top + window.scrollY, vh = window.innerHeight;
  const s0 = top - 0.85 * vh, s1 = top + r.height / 2 - 0.4 * vh;
  return s0 + (s1 - s0) * k;
}, k);

test('02 데스크톱: 제목과 함께 헤더 아래에 붙은 채 0 → 1', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — 폰은 붙지 않는다');
  await scrollToY(page, (await trackY(page, 0)) - 20);
  expect(await t(page, '#flow')).toBe(0);
  await scrollToY(page, await trackY(page, 0.5));
  const mid = await t(page, '#flow');
  expect(mid).toBeGreaterThan(0.4);
  expect(mid).toBeLessThan(0.6);
  const r = await page.evaluate(() => {
    const st = document.querySelector<HTMLElement>('#flow [data-pin-stage]')!;
    const h2 = document.querySelector<HTMLElement>('#flow h2')!.getBoundingClientRect();
    const fig = document.querySelector<HTMLElement>('#flow [data-flow]')!.getBoundingClientRect();
    return { top: st.getBoundingClientRect().top, h2Top: h2.top, figBottom: fig.bottom };
  });
  expect(Math.abs(r.top - PIN)).toBeLessThanOrEqual(2);
  expect(r.h2Top).toBeGreaterThanOrEqual(64);                              // 제목이 보인다
  expect(r.figBottom).toBeLessThanOrEqual(page.viewportSize()!.height);    // 그림도 화면 안에
  await scrollToY(page, (await trackY(page, 1)) + 20);
  expect(await t(page, '#flow')).toBe(1);
});

test('02 폰: 붙지 않고 지나가며 0 → 1', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await scrollToY(page, (await passY(page, 0)) - 20);
  expect(await t(page, '#flow')).toBe(0);
  await scrollToY(page, (await passY(page, 1)) + 20);
  expect(await t(page, '#flow')).toBe(1);
});

test('02 끝(t=1): 네 갈래는 한 줄로 합쳐지고 갈래 이름은 사라진다', async ({ page, isMobile }) => {
  await scrollToY(page, isMobile ? (await passY(page, 1)) + 20 : (await trackY(page, 1)) + 20);
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
  expect(r.text).toContain('진행 상황 모니터링');
  expect(r.role).toBe('img');
  expect(r.label).toContain('하나의 순서');
});

test('색은 토큰만', async ({ page }) => {
  expect(await page.evaluate(() => document.querySelector('#flow [data-flow] svg')!.innerHTML.includes('#8A96C2'))).toBe(false);
});
