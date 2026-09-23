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

test('V6 상세 표지 제목이 공유 이름을 갖는다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  const n = await page.evaluate(() => getComputedStyle(document.querySelector('[data-title]')!).viewTransitionName);
  expect(n).toBe('pj-title');
});

/** document.startViewTransition 을 감싸 ready 의 성패, update 콜백 소요 시간, update 가 끝난 순간의 경로·DOM,
 *  ready 시점에 떠 있는 전환 의사 요소를 기록한다 (C1: update 안의 rAF 가 4초 타임아웃으로 멈추던 문제) */
type VtRec = { update?: number; ready?: string; path?: string; cover?: boolean; rows?: number; groups?: string[] };
async function recordTransitions(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: unknown[] };
    w.__vt = [];
    const proto = Document.prototype as unknown as { startViewTransition?: (a: unknown) => { ready: Promise<void> } };
    const orig = proto.startViewTransition;
    if (!orig) return;
    proto.startViewTransition = function (this: Document, arg: unknown) {
      const rec: Record<string, unknown> = {};
      w.__vt.push(rec);
      const wrap = (fn?: () => unknown) => async () => {
        const t0 = performance.now();
        try { await fn?.(); } finally {
          rec.update = performance.now() - t0;
          rec.path = location.pathname;
          rec.cover = !!document.querySelector('[data-cover-title]');
          rec.rows = document.querySelectorAll('[data-row]').length;
        }
      };
      const a = typeof arg === 'function' ? wrap(arg as () => unknown)
        : arg && typeof arg === 'object' ? { ...(arg as object), update: wrap((arg as { update?: () => unknown }).update) }
        : arg;
      const vt = orig.call(this, a);
      vt.ready.then(
        () => {
          rec.ready = 'resolved';
          rec.groups = document.getAnimations()
            .map((x) => (x.effect as KeyframeEffect | null)?.pseudoElement ?? '').filter(Boolean);
        },
        (e: Error) => { rec.ready = `rejected: ${e.name} ${e.message}`; });
      return vt;
    };
  });
}
const lastVt = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const v = (window as unknown as { __vt: unknown[] }).__vt; return v[v.length - 1] ?? null; }) as Promise<VtRec | null>;

/** 목록 → 상세(행 클릭) → 목록(헤더 뒤로) 을 한 바퀴 돌고 두 전환의 기록을 돌려준다 */
async function roundTrip(page: import('@playwright/test').Page) {
  // 개발 서버의 첫 컴파일이 측정을 흐리지 않도록 두 경로를 한 번씩 미리 연다
  await page.goto('/projects/por-favor-harry');
  await recordTransitions(page);
  await page.goto('/projects');
  const settled = (n: number) => page.waitForFunction(
    (k) => (window as unknown as { __vt: { ready?: string }[] }).__vt[k]?.ready !== undefined, n, { timeout: 8000 });

  await page.locator('a[data-row]').click();
  await page.waitForURL('**/projects/por-favor-harry');
  await settled(0);
  const go = await lastVt(page);

  await page.waitForTimeout(600);   // 전환이 끝나고 이름 정리까지
  await page.locator('[data-back]').click();
  await page.waitForURL(/\/projects$/);
  await settled(1);
  const back = await lastVt(page);
  return { go, back };
}

test('C1 목록 → 상세 → 목록: 전환이 멈추지 않는다 (ready 성공, update 1초 미만)', async ({ page }) => {
  const { go, back } = await roundTrip(page);
  expect(go?.ready).toBe('resolved');
  expect(go!.update!).toBeLessThan(1000);
  // update 가 끝날 때 새 화면이 이미 커밋돼 있어야 스냅샷이 새 화면을 찍는다
  expect(go?.path).toBe('/projects/por-favor-harry');
  expect(go?.cover).toBe(true);
  expect(go?.groups).toContain('::view-transition-group(pj-title)');

  expect(back?.ready).toBe('resolved');
  expect(back!.update!).toBeLessThan(1000);
  expect(back?.path).toBe('/projects');
  expect(back?.rows).toBe(6);
});
