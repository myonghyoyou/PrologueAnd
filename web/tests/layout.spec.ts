import { test, expect } from '@playwright/test';

test.describe('상세 — 문서형 뼈대', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/por-favor-harry');
    await page.waitForTimeout(600);
  });

  test('장 네 개가 순서대로, 번호 01~04', async ({ page }) => {
    const chs = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-chapter]')].map((c) => ({
      id: c.id, lab: (c.querySelector('[data-chapter-label]')!.textContent ?? '').replace(/\s+/g, ' ').trim(),
    })));
    expect(chs.map((c) => c.id)).toEqual(['problem', 'flow', 'screens', 'before-after']);
    expect(chs.map((c) => c.lab.slice(0, 2))).toEqual(['01', '02', '03', '04']);
  });

  test('판 구조가 남아 있지 않다', async ({ page }) => {
    expect(await page.locator('[data-pan], [data-dwell]').count()).toBe(0);
  });

  test('그림은 원본 픽셀보다 크게 그려지지 않는다', async ({ page }) => {
    const over = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-frame]')]
      .filter((f) => f.querySelector('img')!.getBoundingClientRect().width > Number(f.dataset.w) + 1)
      .map((f) => f.dataset.w));
    expect(over).toEqual([]);
  });

  test('가로 스크롤이 없다', async ({ page }) => {
    const vw = page.viewportSize()!.width;
    expect(await page.evaluate(() => window.innerWidth)).toBe(vw);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test('끝: 문의 버튼과 다음 이야기', async ({ page }) => {
    await expect(page.locator('[data-cta]')).toBeVisible();
    await expect(page.locator('[data-teaser]')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('WHAT I LEARNED');
  });

  test('여백 주석의 한 장 그림은 모두 같은 폭', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 — 폰은 모두 전폭');
    const ws = await page.evaluate(() => [...document.querySelectorAll('[data-block="note"]')]
      .map((n) => [...n.querySelectorAll<HTMLElement>('[data-frame]')])
      .filter((fs) => fs.length === 1)
      .map((fs) => Math.round(fs[0].getBoundingClientRect().width)));
    expect(ws.length).toBe(5);
    expect(Math.max(...ws) - Math.min(...ws)).toBeLessThanOrEqual(1);
  });

  test('두 장 한 줄은 높이가 같고 칸을 넘지 않는다', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 — 폰은 세로로 쌓는다');
    const r = await page.evaluate(() => {
      const n = [...document.querySelectorAll('[data-block="note"]')].find((x) => x.querySelectorAll('[data-frame]').length === 2)!;
      const boxes = [...n.querySelectorAll<HTMLElement>('[data-frame] > div')].map((b) => b.getBoundingClientRect());
      const col = n.querySelector<HTMLElement>('[data-row-figs]')!.parentElement!.getBoundingClientRect();
      return { h: boxes.map((b) => b.height), right: Math.max(...boxes.map((b) => b.right)), colRight: col.right };
    });
    expect(Math.abs(r.h[0] - r.h[1])).toBeLessThanOrEqual(1);
    expect(r.right).toBeLessThanOrEqual(r.colRight + 1);
  });

  test('여백 주석 글은 그림 왼쪽 칸에 있다', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 — 폰은 글이 그림 위');
    const r = await page.evaluate(() => {
      const n = document.querySelectorAll('[data-block="note"]')[1];
      const text = n.querySelector<HTMLElement>('[data-note-text]')!.getBoundingClientRect();
      const fig = n.querySelector<HTMLElement>('[data-frame]')!.getBoundingClientRect();
      return { textRight: text.right, figLeft: fig.left, top: Math.abs(text.top - fig.top) };
    });
    expect(r.textRight).toBeLessThanOrEqual(r.figLeft);
    expect(r.top).toBeLessThanOrEqual(24);
  });

  test('폰: 여백 주석은 글이 위, 두 장은 세로로 쌓인다', async ({ page, isMobile }) => {
    test.skip(!isMobile, '폰 전용');
    const r = await page.evaluate(() => {
      const n = [...document.querySelectorAll('[data-block="note"]')].find((x) => x.querySelectorAll('[data-frame]').length === 2)!;
      const text = n.querySelector<HTMLElement>('[data-note-text]')!.getBoundingClientRect();
      const [a, b] = [...n.querySelectorAll<HTMLElement>('[data-frame]')].map((f) => f.getBoundingClientRect());
      return { textBottom: text.bottom, aTop: a.top, aBottom: a.bottom, bTop: b.top, aw: a.width, bw: b.width };
    });
    expect(r.aTop).toBeGreaterThanOrEqual(r.textBottom);
    expect(r.bTop).toBeGreaterThanOrEqual(r.aBottom);
    expect(Math.abs(r.aw - r.bw)).toBeLessThanOrEqual(1);
  });

  test('폰 칸: 창 없이 원래 비율, 높이 640 이하', async ({ page }) => {
    const r = await page.evaluate(() => {
      const box = document.querySelector<HTMLElement>('[data-block="phones"] [data-frame] > div')!;
      const b = box.getBoundingClientRect();
      return { w: b.width, h: b.height, sh: box.scrollHeight, ch: box.clientHeight };
    });
    expect(r.h).toBeLessThanOrEqual(641);
    expect(Math.abs(r.w / r.h - (390 + 12) / (844 + 12))).toBeLessThan(0.02);
    expect(r.sh).toBeLessThanOrEqual(r.ch + 1);   // 안에서 스크롤하지 않는다
  });

  test('폰: 폰 칸 한 장은 띠 폭의 60%', async ({ page, isMobile }) => {
    test.skip(!isMobile, '폰 전용');
    const r = await page.evaluate(() => {
      const band = document.querySelector<HTMLElement>('[data-phones-band]')!;
      const cs = getComputedStyle(band);
      const inner = band.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return document.querySelector<HTMLElement>('[data-block="phones"] [data-frame]')!.getBoundingClientRect().width / inner;
    });
    expect(r).toBeGreaterThan(0.57);
    expect(r).toBeLessThan(0.63);
  });

  test('통찰 한 문장이 01 장 안에 있다', async ({ page }) => {
    await expect(page.locator('#problem [data-block="quote"] blockquote')).toContainText('요청이 들어오는 길의 문제였습니다');
  });
});
