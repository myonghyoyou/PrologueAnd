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

test('장 순서: 문제 · Before & After · 정한 규칙 · 화면', async ({ page }) => {
  await page.goto(URL);
  expect(await page.locator('[data-chapter]').evaluateAll((cs) => cs.map((c) => c.id))).toEqual(['problem', 'before-after', 'rules', 'screens']);
});

test('03 시트: 다섯 행, 행마다 전·후, 자른 캡처가 틀을 넘치지 않는다', async ({ page }) => {
  await page.goto(URL);
  const sheet = page.locator('#rules [data-sheet]');
  await expect(sheet.locator('[data-sheet-row]')).toHaveCount(5);
  await expect(sheet.locator('[data-sheet-cell="before"]')).toHaveCount(5);
  await expect(sheet.locator('[data-sheet-cell="after"]')).toHaveCount(5);
  const over = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#rules [data-crop]')].filter((f) => {
    const w = f.getBoundingClientRect(), win = f.querySelector<HTMLElement>('[data-crop-win]')!.getBoundingClientRect();
    return win.right > w.right + 1 || win.bottom > w.bottom + 1;
  }).length);
  expect(over).toBe(0);
});

test('03 적용 한 쌍: 데스크톱은 나란히 같은 높이, 폰은 위아래', async ({ page, isMobile }) => {
  await page.goto(URL);
  const r = await page.locator('#rules [data-rule] [data-crop]').evaluateAll((fs) => fs.map((f) => f.getBoundingClientRect()).map((b) => ({ top: b.top, h: b.height, left: b.left })));
  expect(r).toHaveLength(2);
  if (isMobile) expect(r[1].top).toBeGreaterThan(r[0].top + r[0].h - 1);
  else { expect(Math.abs(r[0].h - r[1].h)).toBeLessThanOrEqual(1); expect(Math.abs(r[0].top - r[1].top)).toBeLessThanOrEqual(1); }
});

test('폰: 시트는 행마다 전 위 · 후 아래, 가로 스크롤 없음', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto(URL);
  const r = await page.locator('#rules [data-sheet-row]').first().evaluate((row) => {
    const b = row.querySelector('[data-sheet-cell="before"]')!.getBoundingClientRect(), a = row.querySelector('[data-sheet-cell="after"]')!.getBoundingClientRect();
    return a.top >= b.bottom - 1;
  });
  expect(r).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('자른 캡처: 창이 원본의 지정 영역과 같은 비율이다(줄어도 어긋나지 않음)', async ({ page }) => {
  await page.goto(URL);
  const bad = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#rules [data-crop]')].map((f) => {
    const [, , w, h] = f.dataset.crop!.split(',').map(Number);
    const win = f.querySelector<HTMLElement>('[data-crop-win]')!.getBoundingClientRect(), img = f.querySelector('img')!.getBoundingClientRect();
    return { w: Math.abs(win.width - img.width * w / 100), h: Math.abs(win.height - img.height * h / 100) };
  }).filter((d) => d.w > 1.5 || d.h > 1.5).length);
  expect(bad).toBe(0);
});

test.describe('04 전/후 전환', () => {
  test.beforeEach(async ({ page }) => { await page.goto(URL); });

  test('여섯 주석 모두 단추가 있고, 기본은 후', async ({ page }) => {
    await expect(page.locator('#screens [data-side-toggle]')).toHaveCount(6);
    const first = page.locator('#screens [data-block="note"]').first();
    await expect(first.locator('button[data-side="after"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(first.locator('[data-swap]')).toHaveAttribute('data-side', 'after');
  });

  test('전을 누르면 1차 화면이 보이고 핫스팟이 숨는다. 후로 돌아오면 핫스팟이 다시 있다', async ({ page }) => {
    const first = page.locator('#screens [data-block="note"]').first();
    await expect(first.locator('[data-spot]')).toHaveCount(3);
    await first.locator('button[data-side="before"]').click();
    await expect(first.locator('button[data-side="before"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(first.locator('[data-swap]')).toHaveAttribute('data-side', 'before');
    await expect.poll(() => first.locator('[data-before]').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await expect(first.locator('[data-spot]')).toHaveCount(0);
    await expect(first.locator('[data-spot-hl]')).toHaveCount(0);
    await first.locator('button[data-side="after"]').click();
    await expect(first.locator('[data-spot]')).toHaveCount(3);
  });

  test('핫스팟을 가리킨 채 전으로 바꾸면 강조가 남지 않고, 후로 돌아오면 강조 없이 시작한다', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '마우스 가리키기 — 데스크톱');
    const first = page.locator('#screens [data-block="note"]').first();
    await first.locator('[data-spot="1"]').hover();
    await first.locator('button[data-side="before"]').click();
    await expect(first.locator('[data-spot-hl]')).toHaveCount(0);
    await first.locator('button[data-side="after"]').click();
    expect(await first.locator('[data-spot-hl]').evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
  });

  test('키보드: Tab 으로 전 단추에 가서 Enter 로 바꾼다', async ({ page }) => {
    const first = page.locator('#screens [data-block="note"]').first();
    await first.locator('button[data-side="before"]').focus();
    await page.keyboard.press('Enter');
    await expect(first.locator('[data-swap]')).toHaveAttribute('data-side', 'before');
  });
});

test('모션 줄이기: 전/후가 바로 바뀐다(전환 시간 0)', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  const d = await page.locator('#screens [data-before]').first().evaluate((e) => getComputedStyle(e).transitionDuration);
  expect(d).toBe('0s');
  await ctx.close();
});
