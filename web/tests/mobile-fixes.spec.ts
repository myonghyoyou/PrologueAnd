import { test, expect } from '@playwright/test';
import { lenisOptions } from '../lib/device';

// 브랜치 전체 검토에서 나온 결함 — 고친 뒤 다시 깨지지 않게

test('Lenis(안드로이드): 두 손가락 터치는 Lenis 가 손대지 않는다(페이지 핀치 확대)', () => {
  const vs = lenisOptions({ ios: false, touch: true }).virtualScroll!;
  const ev = (n: number) => ({ event: { touches: { length: n } } as unknown as TouchEvent, deltaX: 0, deltaY: 5 });
  expect(vs(ev(2))).toBe(false);
  expect(vs(ev(1))).toBe(true);
  expect(vs({ event: new Event('wheel') as WheelEvent, deltaX: 0, deltaY: 5 })).toBe(true);
});

test.describe('폰', () => {
  test.skip(({ isMobile }) => !isMobile, '폰 전용');

  test('표: 맺음 줄 첫 칸도 넘겨도 제자리', async ({ page }) => {
    await page.goto('/projects/hospital-ux');
    const t = page.locator('[data-table]').filter({ has: page.locator('tfoot') }).first();
    await t.scrollIntoViewIfNeeded();
    await t.locator('[data-table-scroll]').evaluate((e) => { e.scrollLeft = 200; });
    await page.waitForTimeout(100);
    const [body, foot] = await Promise.all([
      t.locator('tbody th').first().evaluate((e) => e.getBoundingClientRect().left),
      t.locator('tfoot th').first().evaluate((e) => e.getBoundingClientRect().left),
    ]);
    expect(Math.abs(foot - body)).toBeLessThanOrEqual(1);
  });

  test('뷰어: 빠르게 두 번 끌어도 확대·축소되지 않는다', async ({ page }) => {
    await page.goto('/projects/shift-board');
    await page.locator('[data-hero-pinned] [data-zoom]').click();
    const img = page.locator('[data-zoom-img]');
    await img.dblclick();
    await page.waitForTimeout(200);
    const w0 = await img.evaluate((i) => i.getBoundingClientRect().width);
    const s = (await page.locator('[data-zoom-stage]').boundingBox())!;
    for (let k = 0; k < 2; k++) {
      await page.mouse.move(s.x + 200, s.y + 300); await page.mouse.down();
      await page.mouse.move(s.x + 120, s.y + 240, { steps: 4 }); await page.mouse.up();
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(200);
    expect(Math.abs((await img.evaluate((i) => i.getBoundingClientRect().width)) - w0)).toBeLessThanOrEqual(2);
  });

  test('뷰어: 자른 캡처는 자른 자리를 크게 보여 준다', async ({ page }) => {
    await page.goto('/projects/hospital-ux');
    const box = page.locator('[data-crop] [data-zoom]').filter({ visible: true }).first();
    await box.scrollIntoViewIfNeeded();
    const crop = (await box.evaluate((e) => e.closest('[data-crop]')!.getAttribute('data-crop')))!.split(',').map(Number);
    await box.click();
    await page.waitForTimeout(400);
    const r = await page.evaluate(([x, y, w, h]) => {
      const st = document.querySelector<HTMLElement>('[data-zoom-stage]')!.getBoundingClientRect();
      const ib = document.querySelector<HTMLElement>('[data-zoom-img]')!.getBoundingClientRect();
      return { cx: ib.left + ib.width * (x + w / 2) / 100 - (st.left + st.width / 2), cy: ib.top + ib.height * (y + h / 2) / 100 - (st.top + st.height / 2), iw: ib.width, sw: st.width, tall: ib.height > st.height };
    }, crop);
    expect(r.iw).toBeGreaterThan(r.sw * 1.1);
    expect(Math.abs(r.cx)).toBeLessThan(30);
    if (r.tall) expect(Math.abs(r.cy)).toBeLessThan(30);   // 그림이 화면보다 낮으면 세로는 가운데 정렬로 둔다
  });

  test('가로 아이폰: 본문·헤더·문의 바·홈 목록이 좌우 safe-area 를 비켜 선다', async ({ page }) => {
    await page.goto('/projects');
    const css = await page.evaluate(() => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; } }).join('\n'));
    for (const sel of ['.wrap', 'hdr', 'dock', 'list']) {
      const rules = css.split('\n').filter((l) => l.includes(sel) && l.includes('safe-area-inset-left'));
      expect(rules.length, sel).toBeGreaterThan(0);
    }
  });

  test('문의 바에서 연 시트도 닫을 때는 아래로 미끄러진다', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-dock]');
    const d = page.locator('[data-drawer]');
    await expect(d).toBeVisible();
    await page.waitForTimeout(400);
    const y0 = (await d.boundingBox())!.y;
    await page.locator('[data-drawer] button[aria-label="닫기"]').click();
    await page.waitForTimeout(120);
    const b = await d.boundingBox();
    expect(b).not.toBeNull();
    expect(b!.y).toBeGreaterThan(y0 + 20);
    expect(b!.y).toBeLessThan(844);
  });
});
