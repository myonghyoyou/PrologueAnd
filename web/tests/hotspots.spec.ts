import { test, expect } from '@playwright/test';

// 모든 사례의 핫스팟: 한 항목을 강조했을 때 강조 상자가 다른 번호 뱃지와 겹치지 않고, 뱃지끼리도 겹치지 않으며,
// 강조 상자는 그림 틀 안에 있다(2026-10-02 사용자 지적 — 구내전화표에서 시작해 전 편으로)
const SLUGS = ['por-favor-harry', 'problem-bank', 'hospital-ux', 'shift-board'];

for (const slug of SLUGS) {
  test(`핫스팟 겹침 없음: ${slug}`, async ({ page }) => {
    await page.goto(`/projects/${slug}`);
    const notes = page.locator('[data-block="note"]').filter({ has: page.locator('[data-spot]') });
    const n = await notes.count();
    const bad: string[] = [];
    for (let k = 0; k < n; k++) {
      const note = notes.nth(k);
      // 데스크톱의 Por favor, Harry 요청 양식은 재현 화면(상자 없이 초점만)이라 캡처 틀이 숨어 있다 — 보이는 틀만 잰다
      const visible = await note.evaluate((el) => [...el.querySelectorAll<HTMLElement>('[data-frame]')].some((f) => f.getBoundingClientRect().width > 0 && f.querySelector('b')));
      if (!visible) continue;
      await note.scrollIntoViewIfNeeded();
      const items = note.locator('[data-spot]:visible');
      const m = await items.count();
      for (let i = 0; i < m; i++) {
        await items.nth(i).focus();
        await expect.poll(() => note.locator('[data-spot-hl]').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
        const r = await note.evaluate((el, i) => {
          const fig = [...el.querySelectorAll<HTMLElement>('[data-frame]')].find((f) => f.getBoundingClientRect().width > 0 && f.querySelector('b'))!;
          const f = fig.getBoundingClientRect();
          const badges = [...fig.querySelectorAll<HTMLElement>(':scope b')].map((b) => b.getBoundingClientRect());
          const hls = [...fig.querySelectorAll<HTMLElement>('[data-spot-hl], [data-spot-hl-also]')]
            .filter((e) => Number(getComputedStyle(e).opacity) > 0).map((e) => e.getBoundingClientRect());
          const ov = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
          const out: string[] = [];
          badges.forEach((b, j) => { if (j !== i && hls.some((h) => ov(h, b))) out.push(`강조 ${i + 1}이 뱃지 ${j + 1}와 겹침`); });
          for (let a = 0; a < badges.length; a++) for (let c = a + 1; c < badges.length; c++) if (ov(badges[a], badges[c])) out.push(`뱃지 ${a + 1}·${c + 1} 겹침`);
          if (hls.some((h) => h.left < f.left - 1 || h.right > f.right + 1 || h.top < f.top - 1 || h.bottom > f.bottom + 1)) out.push(`강조 ${i + 1}이 틀 밖`);
          return out;
        }, i);
        bad.push(...r.map((x) => `주석 ${k + 1}: ${x}`));
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  });
}
