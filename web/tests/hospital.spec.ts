import { test, expect } from '@playwright/test';

// 병원 UI/UX 고도화 상세 (명세 docs/superpowers/specs/2026-09-29-hospital-ux-case-design.md)
const URL = '/projects/hospital-ux';

test('병원 편이 열리고, 표지 제목과 소개가 명세 문구다', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('[data-cover-title] h1')).toHaveText('병원 자산·재고·인사 업무를처리하는 사내 시스템');
  await expect(page.locator('[data-summary]')).toHaveText('기능이 늘 때마다 화면을 따로 만들어, 같은 시스템인데 화면마다 색과 버튼 크기가 달랐습니다.');
});

test('목록에 병원 행이 링크로, 두 편이 서로를 다음 이야기로 가리킨다', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('a[data-row][data-slug="hospital-ux"]')).toHaveAttribute('href', URL);
  await page.goto(URL);
  await expect(page.locator('[data-teaser]')).toContainText('Por favor, Harry');
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-teaser]')).toContainText('병원 UI/UX 고도화');
});

test('04 화면: 여백 주석 여섯, "전에는" 여섯', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#screens [data-block="note"]')).toHaveCount(6);
  await expect(page.locator('#screens [data-was]')).toHaveCount(6);
});

test('01 표: 여섯 화면과 비교 줄, 네 열, 색 견본 일곱', async ({ page }) => {
  await page.goto(URL);
  const t = page.locator('#problem [data-table]');
  await expect(t.locator('tbody tr')).toHaveCount(6);
  await expect(t.locator('tfoot tr')).toHaveCount(1);
  await expect(t.locator('thead th')).toHaveCount(4);
  await expect(t.locator('[data-swatch]')).toHaveCount(7);
  await expect(t.locator('tfoot')).toContainText('다시 설계한 뒤 (22개 화면 공통)');
});

test('폰: 표가 넘쳐도 페이지는 가로로 스크롤되지 않는다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto(URL);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('표지: 1차 화면 한 장에 번호 셋, 설명 셋, 번호는 캡처 틀 안, 소개 폭 = 틀 폭', async ({ page }) => {
  await page.goto(URL);
  const hero = page.locator('[data-cover] [data-hero-pinned]');
  await expect(hero.locator('[data-pin]')).toHaveCount(3);
  await expect(hero.locator('ol [data-pin-note]')).toHaveCount(3);
  const r = await page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('[data-hero-pinned] [data-frame]')!.getBoundingClientRect();
    const pins = [...document.querySelectorAll<HTMLElement>('[data-hero-pinned] [data-pin]')].map((p) => p.getBoundingClientRect());
    const sum = document.querySelector<HTMLElement>('[data-summary]')!.getBoundingClientRect();
    return { inside: pins.every((p) => p.left >= f.left && p.right <= f.right && p.top >= f.top && p.bottom <= f.bottom), dw: Math.abs(sum.width - f.width) };
  });
  expect(r.inside).toBe(true);
  expect(r.dw).toBeLessThanOrEqual(1);
});

test('폰: 번호 설명은 한 열', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto(URL);
  const xs = await page.locator('[data-pin-note]').evaluateAll((ls) => ls.map((l) => Math.round(l.getBoundingClientRect().left)));
  expect(new Set(xs).size).toBe(1);
});
