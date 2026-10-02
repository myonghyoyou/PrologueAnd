import { test, expect } from '@playwright/test';

// 파비콘 — 남색 칸 + 흰 P&(크게). 원본 생성 스크립트 design/case-assets/favicon.py (2026-10-02)
test('머리에 파비콘·아이콘·애플 아이콘이 걸리고, 파일이 그림으로 내려온다', async ({ page, request }) => {
  await page.goto('/');
  const links = await page.evaluate(() => [...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]')]
    .map((l) => ({ rel: l.rel, href: l.getAttribute('href')!, sizes: l.getAttribute('sizes') })));
  const ico = links.find((l) => l.href.startsWith('/favicon.ico'));
  const png = links.find((l) => l.rel === 'icon' && l.href.startsWith('/icon'));
  const apple = links.find((l) => l.rel === 'apple-touch-icon');
  expect(ico).toBeTruthy();
  expect(png?.sizes).toBe('512x512');
  expect(apple?.sizes).toBe('180x180');
  for (const l of [ico!, png!, apple!]) {
    const r = await request.get(l.href);
    expect(r.status(), l.href).toBe(200);
    expect(r.headers()['content-type'], l.href).toMatch(/image\//);
  }
});
