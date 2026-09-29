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
    expect(chs.map((c) => c.id)).toEqual(['problem', 'before-after', 'flow', 'screens']);
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
    // 요청 작성 주석은 데스크톱에서 재현 양식이라 캡처 틀이 숨는다 — 보이는 틀만 센다
    const ws = await page.evaluate(() => [...document.querySelectorAll('[data-block="note"]')]
      .map((n) => [...n.querySelectorAll<HTMLElement>('[data-frame]')].filter((f) => f.getBoundingClientRect().width > 0))
      .filter((fs) => fs.length === 1)
      .map((fs) => Math.round(fs[0].getBoundingClientRect().width)));
    expect(ws.length).toBe(4);
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
    expect(Math.abs(r.w / r.h - (390 + 14) / (844 + 14))).toBeLessThan(0.02);
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
    await expect(page.locator('#problem [data-block="quote"] blockquote')).toContainText('요청이 들어오는 경로가 너무 많은 것이 문제였습니다');
  });

  test('화면 장의 여백 주석에 단계 라벨(들어온다·처리한다·돌려준다·어디서든)이 없다', async ({ page }) => {
    const text = await page.locator('#screens').innerText();
    for (const w of ['들어온다', '처리한다', '돌려준다', '어디서든']) expect(text).not.toContain(w);
  });

  test('장 간격: 앞 내용 → 괘선 88(폰 56), 괘선 → 장 제목 40(폰 28)', async ({ page, isMobile }) => {
    const r = await page.evaluate(() => {
      const ch = document.getElementById('screens')!;   // 붙지 않는 장 — 앞 장(02)의 무대가 끝난 자리부터 잰다
      const intro = ch.querySelector<HTMLElement>('[data-chapter-label]')!.parentElement!;
      const prev = ch.previousElementSibling as HTMLElement;
      return {
        before: intro.getBoundingClientRect().top - prev.getBoundingClientRect().bottom,
        after: parseFloat(getComputedStyle(intro).paddingTop),   // 괘선(border-top) 아래 여백
      };
    });
    expect(Math.round(r.before)).toBe(isMobile ? 56 : 88);
    expect(r.after).toBe(isMobile ? 28 : 40);
  });
});
