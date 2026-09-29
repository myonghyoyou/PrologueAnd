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

  // 첫 단계 점은 합쳐진 선의 시작점에, 나머지 점은 끝점까지 같은 간격으로. 마지막 단계도 점이다(끝이라 속이 찬다)
  const steps = await page.evaluate(() => [...document.querySelectorAll('#flow [data-flow] [data-step]')]
    .map((c) => Number(c.getAttribute('cx'))));
  expect(steps[0]).toBe(40);
  const gaps = steps.slice(1).map((x, i) => x - steps[i]);
  expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.01);
  const ends = await page.evaluate(() => {
    const cs = [...document.querySelectorAll<SVGCircleElement>('#flow [data-flow] [data-step]')];
    return { n: cs.length, r: cs.map((c) => Number(c.getAttribute('r'))), lastFill: cs[cs.length - 1].getAttribute('fill') };
  });
  expect(ends.n).toBe(5);
  expect(ends.r.every((r) => r === 5)).toBe(true);           // 끝점까지 다 자랐다
  expect(ends.lastFill).toBe('var(--navy-800)');
  // 앞 그림(다시 정리 → 멈춤)은 보이지 않는다 — 글자는 투명하게 남는다(그림 글자 전체는 위 '문구는 데이터에서'가 읽는다)
  const gone = await page.evaluate(() => [...document.querySelectorAll('#flow [data-flow] svg text')]
    .filter((x) => x.textContent === '담당자가 다시 정리' || x.textContent === '업무 효율 저하')
    .map((x) => { let o = 1; for (let e: Element | null = x; e && e.tagName !== 'svg'; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; }));
  expect(gone).toEqual([0, 0]);
});

test('02 중간: 한 번에 하나씩 — 전·후가 겹치는 순간이 없다', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱에서 붙은 트랙으로 진행률을 맞춘다');
  const at = async (k: number) => {
    await scrollToY(page, await trackY(page, k));
    return page.evaluate(() => {
      const svg = document.querySelector('#flow [data-flow] svg')!;
      const op = (el: Element | null) => (el ? Number(getComputedStyle(el).opacity) : 0);
      const steps = [...svg.querySelectorAll('[data-step]')].map((c) => op(c.parentElement));
      const labels = [...svg.querySelectorAll('[data-src-label]')].map(op);
      return { t: Number(svg.closest<HTMLElement>('[data-flow]')!.dataset.t), steps: Math.max(...steps), labels: Math.max(...labels), stop: svg.textContent!.includes('업무 효율 저하') && op([...svg.querySelectorAll('text')].find((x) => x.textContent === '업무 효율 저하')!.parentElement) > 0 };
    });
  };
  const a = await at(0.25);   // ① 잘라내는 중: 새 흐름은 아직 없다
  expect(a.steps).toBe(0);
  const b = await at(0.45);   // ② 모으는 중: 멈춤 표시는 이미 없고, 새 흐름도 아직 없다
  expect(b.stop).toBe(false);
  expect(b.steps).toBe(0);
  const c = await at(0.75);   // ③ 긋는 중: 갈래 이름표는 이미 사라졌다
  expect(c.labels).toBe(0);
  expect(c.steps).toBeGreaterThan(0);
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

/** 그림 안에서 보이는 것(투명도 > 0) 전체를 감싸는 상자의 가운데가 그림 가운데에서 얼마나 벗어났는지(그림 폭 대비) */
const offCenter = (page: import('@playwright/test').Page, sel: string) => page.evaluate((sel) => {
  const svg = document.querySelector<SVGSVGElement>(`${sel} [data-flow] svg`)!, sr = svg.getBoundingClientRect();
  const vis = (e: Element) => { for (let x: Element | null = e; x && x !== svg; x = x.parentElement) if (Number(getComputedStyle(x).opacity) === 0) return false; return true; };
  const rs = [...svg.querySelectorAll('text, circle, path')].filter(vis).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
  const l = Math.min(...rs.map((r) => r.left)), r = Math.max(...rs.map((r) => r.right));
  return ((l + r) / 2 - (sr.left + sr.width / 2)) / sr.width;
}, sel);

test('전 그림: 갈래마다 시작점이 있고, 끝은 X 가 아니라 흐린 빈 점, 그림은 가운데', async ({ page }) => {
  const r = await page.evaluate(() => {
    const svg = document.querySelector('#problem [data-flow] svg')!;
    return {
      dots: svg.querySelectorAll('[data-src-dot]').length,
      x: [...svg.querySelectorAll('path')].some((p) => /l12 12/.test(p.getAttribute('d') ?? '')),
      stop: !!svg.querySelector('[data-stop]'),
      tail: svg.querySelector('[data-tail]')?.getAttribute('stroke-dasharray'),
    };
  });
  expect(r.dots).toBe(4);
  expect(r.x).toBe(false);
  expect(r.stop).toBe(true);
  expect(r.tail).toBeTruthy();
  expect(Math.abs(await offCenter(page, '#problem'))).toBeLessThan(0.03);
});

test('새 흐름(t=1)도 그림 가운데', async ({ page, isMobile }) => {
  await scrollToY(page, isMobile ? (await passY(page, 1)) + 20 : (await trackY(page, 1)) + 20);
  await page.waitForTimeout(100);
  expect(Math.abs(await offCenter(page, '#flow'))).toBeLessThan(0.03);
});
