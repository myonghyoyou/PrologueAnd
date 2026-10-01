import { test, expect } from '@playwright/test';

// 장 도입 리드 문단 폭 — 42rem(672px)까지는 본문 칸을 꽉 채워 제목·그림·표와 오른쪽 끝을 맞추고,
// 그보다 넓은 창에서는 672 에서 멈춘다(한 줄 60자 넘는 긴 줄 방지). 2026-10-01 사용자 결정
const SLUGS = ['por-favor-harry', 'problem-bank', 'hospital-ux', 'shift-board'];

for (const slug of SLUGS) {
  test(`리드 폭: ${slug}`, async ({ page, isMobile }) => {
    await page.goto(`/projects/${slug}`);
    const r = await page.evaluate(() => [...document.querySelectorAll('[data-chapter] h2 ~ p')].map((p) => {
      const col = p.parentElement!.getBoundingClientRect(), lead = p.getBoundingClientRect();
      return { lead: lead.width, col: col.width };
    }));
    expect(r.length).toBeGreaterThan(0);
    for (const x of r) {
      if (isMobile || x.col <= 672) expect(Math.abs(x.lead - x.col)).toBeLessThanOrEqual(1);
      else expect(Math.abs(x.lead - 672)).toBeLessThanOrEqual(1);
    }
  });
}
