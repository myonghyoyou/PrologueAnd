import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

test.describe('상세 수용 기준', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/por-favor-harry');
    await page.waitForTimeout(700);
  });

  test('V1 판 넘침 0', async ({ page }) => {
    const over = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-pan]')].filter((p) => p.scrollHeight > p.clientHeight + 1).map((p) => p.id));
    expect(over).toEqual([]);
  });

  test('V1-b 머무름 판도 단계마다 넘침 0 (05 의 흐름 줄이 붙어도)', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 전용 — 폰은 판 높이가 내용대로다');
    const at = async (sel: string, k: number) => {
      const y = await page.evaluate(([s, r]) => {
        const d = document.querySelector(s as string) as HTMLElement;
        const pan = d.querySelector('[data-pan]') as HTMLElement;
        return d.getBoundingClientRect().top + window.scrollY - 64 + (d.offsetHeight - pan.offsetHeight) * (r as number);
      }, [sel, k] as const);
      await scrollToY(page, y);
      return page.evaluate((s) => {
        const pan = document.querySelector(`${s} [data-pan]`) as HTMLElement;
        return { over: pan.scrollHeight - pan.clientHeight, t: (document.querySelector(s) as HTMLElement).dataset.t };
      }, sel);
    };
    for (const [sel, k] of [['[data-dwell="3"]', 0], ['[data-dwell="3"]', 0.5], ['[data-dwell="3"]', 1],
                            ['[data-dwell="2"]', 0], ['[data-dwell="2"]', 1]] as const) {
      const r = await at(sel, k);
      expect(r.over, `${sel} k=${k} t=${r.t}`).toBeLessThanOrEqual(1);
    }
  });

  test('V2-a 정거장 개수가 판 구성과 맞는다', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 전용');
    // 판 13장 중 s03 머무름(3) + s07 머무름(2) → 11 + 3 + 2 = 16
    const n = await page.evaluate(() => {
      const plain = document.querySelectorAll('[data-pan]:not([data-dwell] [data-pan])').length;
      const d3 = document.querySelectorAll('[data-dwell="3"]').length * 3;
      const d2 = document.querySelectorAll('[data-dwell="2"]').length * 2;
      return plain + d3 + d2;
    });
    expect(n).toBe(16);
  });

  test('V2-b 휠 한 칸에 정거장 하나', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 전용');
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeGreaterThan(before);
    const panTop = await page.evaluate(() => {
      const t = [...document.querySelectorAll<HTMLElement>('[data-pan]')]
        .map((e) => Math.round(e.getBoundingClientRect().top)).find((v) => v > -10 && v < 200);
      return t ?? -999;
    });
    expect(Math.abs(panTop - 64)).toBeLessThanOrEqual(6);
  });

  test('V5 가로 스크롤 없음, 헤더 왼쪽선 = 표지 왼쪽선', async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const brand = await page.locator('[data-brand]').boundingBox();
    const cover = await page.locator('[data-cover-title]').boundingBox();
    expect(Math.abs(brand!.x - cover!.x)).toBeLessThanOrEqual(2);
  });

  test('V7 비공개는 목록으로', async ({ page }) => {
    await page.goto('/projects/quote-sheet');
    await expect(page).toHaveURL(/\/projects$/);
  });
});

test('V9 모션 줄이기에서 즉시 최종 상태 (중간 프레임 없음)', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/projects/por-favor-harry');

  const dwellY = (sel: string, k: number) =>
    page.evaluate(([s, r]) => {
      const d = document.querySelector(s as string) as HTMLElement;
      const pan = d.querySelector('[data-pan]') as HTMLElement;
      return d.getBoundingClientRect().top + window.scrollY - 64 + (d.offsetHeight - pan.offsetHeight) * (r as number);
    }, [sel, k] as const);

  const readT = (sel: string) =>
    page.evaluate((s) => Number((document.querySelector(s) as HTMLElement).dataset.t), sel);

  // 감속(reduced motion)에서는 use-dwell.ts가 중간 프레임 없이 구간 절반을 기준으로
  // 0 또는 1로 스냅한다(raw >= 0.5 ? 1 : 0) — 그 정확한 이산 값을 검사한다.
  for (const [k, expected] of [[0.1, 0], [0.3, 0], [0.7, 1], [0.95, 1]] as const) {
    await scrollToY(page, await dwellY('[data-dwell="3"]', k));
    expect(await readT('[data-dwell="3"]')).toBe(expected);
  }

  // 07 와이프 구간도 같은 방식 — 절반을 넘긴 지점에서는 t=1이고, After가 가려짐 없이
  // 완전히 드러나 있어야 한다(오른쪽 인셋 0%).
  await scrollToY(page, await dwellY('[data-dwell="2"]', 0.95));
  expect(await readT('[data-dwell="2"]')).toBe(1);
  const rightPct = await page.evaluate(() => {
    const clip = (document.querySelector('[data-wipe-after]') as HTMLElement).style.clipPath;
    return Number(clip.match(/inset\(0px\s+([\d.]+)%/)?.[1] ?? NaN);
  });
  expect(rightPct).toBe(0);

  await ctx.close();
});
