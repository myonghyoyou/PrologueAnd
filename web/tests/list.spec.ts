import { test, expect } from '@playwright/test';

test('목록은 6행, 공개된 것만 링크', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('[data-row]')).toHaveCount(6);
  await expect(page.locator('a[data-row]')).toHaveCount(1);
  await expect(page.locator('[data-row]:not(a)').first()).toContainText('준비 중');
});

test('행마다 연도는 2026, 대표 표시·문제 유형 문구는 없다', async ({ page }) => {
  await page.goto('/projects');
  const metas = await page.locator('[data-row]').evaluateAll((rows) => rows.map((r) => (r.querySelector('[data-title]')!.nextElementSibling as HTMLElement).innerText));
  expect(metas).toHaveLength(6);
  for (const m of metas) {
    expect(m).toContain('2026');
    for (const w of ['대표', '흩어진 요청', '불편한 기존 시스템', '종이·수작업', '제품이 필요한 아이디어']) expect(m).not.toContain(w);
  }
});

test('목록은 가운데 읽기 폭이고 가로 스크롤이 없다', async ({ page }) => {
  await page.goto('/projects');
  const r = await page.locator('main').boundingBox();
  const vw = page.viewportSize()!.width;
  expect(Math.abs(r!.x - (vw - r!.x - r!.width))).toBeLessThanOrEqual(1);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(0);
});

test('목록 행이 화면 밖으로 삐져나오지 않는다 (폰에서 레이아웃 뷰포트가 넓어지면 뷰 전환이 중단된다)', async ({ page }) => {
  await page.goto('/projects');
  const vw = page.viewportSize()!.width;
  // 폰 에뮬레이션에서는 넘친 만큼 innerWidth 자체가 넓어져 scrollWidth 비교로는 잡히지 않는다 — 설정한 폭과 직접 비교한다
  expect(await page.evaluate(() => window.innerWidth)).toBe(vw);
  const right = await page.evaluate(() =>
    Math.max(...[...document.querySelectorAll('[data-row]')].map((r) => r.getBoundingClientRect().right)));
  expect(right).toBeLessThanOrEqual(vw);
});

test('마지막 행에는 아래 선이 없고, 바닥글 상단 선이 그 자리에 같은 폭으로 선다', async ({ page }) => {
  await page.goto('/projects');
  const r = await page.evaluate(() => {
    const rows = [...document.querySelectorAll<HTMLElement>('[data-row]')], last = rows[rows.length - 1];
    const ft = document.querySelector<HTMLElement>('[data-footer]')!;
    const lb = last.getBoundingClientRect(), fb = ft.getBoundingClientRect(), pb = rows[0].getBoundingClientRect();
    return { lastBorder: getComputedStyle(last).borderBottomWidth, prevBorder: getComputedStyle(rows[0]).borderBottomWidth,
      ftBorder: getComputedStyle(ft).borderTopWidth, gap: fb.top - lb.bottom, dl: fb.left - pb.left, dr: fb.right - pb.right };
  });
  expect(r.lastBorder).toBe('0px');
  expect(r.prevBorder).toBe('1px');
  expect(r.ftBorder).toBe('1px');
  expect(Math.round(r.gap)).toBe(0);
  expect(Math.abs(r.dl)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(r.dr)).toBeLessThanOrEqual(0.5);
});

test('헤더의 Projects 는 지금 있는 곳 — 버튼 모양 그대로 색만 반전', async ({ page }) => {
  await page.goto('/projects');
  const cur = page.locator('header [data-nav-current]');
  await expect(cur).toHaveText('Projects');
  await expect(cur).toHaveAttribute('aria-current', 'page');
  const [a, b] = await Promise.all([cur, page.locator('header button[data-open-drawer]')].map((l) => l.evaluate((el) => {
    const c = getComputedStyle(el); return { h: el.getBoundingClientRect().height, bw: c.borderTopWidth, bg: c.backgroundColor, fg: c.color };
  })));
  expect(Math.round(a.h)).toBe(Math.round(b.h));      // 문의 버튼과 같은 높이·테두리
  expect(a.bw).toBe(b.bw);
  expect(a.bg).toBe('rgb(28, 27, 24)');                // bone-900
  expect(a.fg).toBe('rgb(250, 249, 246)');             // bone-50
});
