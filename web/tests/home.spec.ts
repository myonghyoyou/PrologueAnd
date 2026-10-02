import { test, expect, type Page } from '@playwright/test';

// 홈 = 경로형 대시보드(시안 v6). 데스크톱은 고정 무대 위 카메라가 선을 따라 장면 아홉 개를 지나고, 폰은 HomePhone(엉킨 선 → 세로 선)
type Dash = { go: (i: number, immediate?: boolean) => void; state: () => { pos: number; target: number; active: boolean; scene: number; T: number[] } };
const dash = (page: Page) => page.evaluate(() => (window as unknown as { __dash: Dash }).__dash.state());
const go = async (page: Page, i: number) => {
  await page.evaluate((i) => (window as unknown as { __dash: Dash }).__dash.go(i, true), i);
  await page.waitForTimeout(450);   // 판이 뜨는 전환(.35s)
};
const settle = (page: Page, scene: number) =>
  expect.poll(async () => { const s = await dash(page); return s.active ? -1 : s.scene; }, { timeout: 4000 }).toBe(scene);

test.describe('홈 — 데스크톱', () => {
  test.skip(({ isMobile }) => !!isMobile, '데스크톱 전용');
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window as unknown as { __dash?: unknown }).__dash);
  });

  test('첫 장면: 헤드라인·진행 지도 9칸, 첫 칸이 켜져 있고 문서는 스크롤되지 않는다', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('단순한 제품');
    await expect(page.locator('[data-pmap] button')).toHaveCount(9);
    await expect(page.locator('[data-pmap] button').first()).toHaveAttribute('aria-current', 'step');
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(0);
  });

  test('→ 키로 다음 장면, ← 키로 돌아온다. 주소의 해시가 따라간다', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await settle(page, 1);
    await expect(page.locator('#p01')).toHaveAttribute('data-show', '');
    await expect(page).toHaveURL(/#p01$/);
    await page.keyboard.press('ArrowLeft');
    await settle(page, 0);
    await expect(page.locator('#p01')).not.toHaveAttribute('data-show', '');
    expect(new URL(page.url()).hash).toBe('');
  });

  test('휠 한 번에 한 장면', async ({ page }) => {
    await page.mouse.move(700, 500);
    await page.mouse.wheel(0, 120);
    await settle(page, 1);
  });

  test('진행 지도 칸을 누르면 그 장면으로 — Projects 장면은 공개 편수와 목록 링크', async ({ page }) => {
    await page.locator('[data-pmap] button').nth(6).click();
    await settle(page, 6);
    await expect(page.locator('#p06 [data-published]')).toHaveText('4');
    await expect(page.locator('#p06').getByRole('link', { name: /Projects 보기/ })).toHaveAttribute('href', '/projects');
  });

  test('「작업 보기」는 Projects 장면으로 옮겨 간다', async ({ page }) => {
    await page.locator('#p00').getByRole('link', { name: /작업 보기/ }).click();
    await settle(page, 6);
  });

  test('End 키: 끝 장면에 닿으면 Prologue 아래 & 가 떠오른다', async ({ page }) => {
    await page.keyboard.press('End');
    await settle(page, 8);
    await expect(page.locator('#p08')).toHaveAttribute('data-arrive', '');
  });

  test('주소에 장면이 있으면 그 자리에서 시작한다', async ({ page }) => {
    await page.goto('/projects');   // 같은 문서의 해시 이동이 아니라 새로 불러오기
    await page.goto('/#p06');
    await page.waitForFunction(() => !!(window as unknown as { __dash?: unknown }).__dash);
    expect((await dash(page)).scene).toBe(6);
    await expect(page.locator('#p06')).toHaveAttribute('data-show', '');
  });

  test('해시만 바뀌면(뒤로 가기 등) 그 장면으로 옮겨 간다', async ({ page }) => {
    await page.evaluate(() => { location.hash = '#p03'; });
    await settle(page, 3);
  });

  test('숨은 판은 키보드 초점을 받지 않는다', async ({ page }) => {
    expect(await page.locator('#p07').evaluate((n) => (n as HTMLElement).inert)).toBe(true);
    await go(page, 7);
    expect(await page.locator('#p07').evaluate((n) => (n as HTMLElement).inert)).toBe(false);
  });

  test('문의 장면의 버튼이 서랍을 열고, 서랍 안의 스페이스·화살표는 카메라를 움직이지 않는다', async ({ page }) => {
    await go(page, 7);
    await page.locator('#p07').getByRole('button', { name: /프로젝트 문의하기/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-drawer-open', '');
    const before = (await dash(page)).target;
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    expect((await dash(page)).target).toBe(before);
  });

  test('모든 판의 글이 창 안, 헤더 아래에 선다', async ({ page }) => {
    const vw = page.viewportSize()!.width, vh = page.viewportSize()!.height;
    for (const i of [1, 2, 3, 4, 5, 6, 7]) {
      await go(page, i);
      // 글·버튼(도형 제외)을 모두 감싸는 상자
      const r = await page.locator(`#p0${i}`).evaluate((n) => {
        const bs = [...n.querySelectorAll('h2, p, a, button')].map((e) => e.getBoundingClientRect());
        return { l: Math.min(...bs.map((b) => b.left)), r: Math.max(...bs.map((b) => b.right)), t: Math.min(...bs.map((b) => b.top)), b: Math.max(...bs.map((b) => b.bottom)) };
      });
      expect(r.l, `p0${i} 왼쪽`).toBeGreaterThanOrEqual(0);
      expect(r.r, `p0${i} 오른쪽`).toBeLessThanOrEqual(vw);
      expect(r.t, `p0${i} 위`).toBeGreaterThanOrEqual(64);
      expect(r.b, `p0${i} 아래`).toBeLessThanOrEqual(vh);
    }
  });

  test('헤더 Projects 로 목록에 간다', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects');
  });
});

test('모션 줄이기(데스크톱): 미끄러지지 않고 바로 다음 장면에 선다', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForFunction(() => !!(window as unknown as { __dash?: unknown }).__dash);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const s = await dash(page);
  expect(s.active).toBe(false);
  expect(s.scene).toBe(1);
  await ctx.close();
});

test('판 문구: 데스크톱 무대와 폰 화면이 같다 · 바뀐 두 판', async ({ page }) => {
  await page.goto('/');
  const desk = await page.locator('[data-dash] [data-pan] h2').allTextContents();
  const phone = await page.locator('[data-home-phone] [data-panel] h2').allTextContents();
  // 폰은 데스크톱의 p01~p07 과 같은 순서(작업 판 제목의 숫자 포함)
  expect(phone).toEqual(desk);
  expect(desk).toContain('설계부터 개발까지한 팀이 진행합니다.');
  expect(desk).toContain('어떤 일이필요하신가요?');
  const text = await page.evaluate(() => document.body.textContent ?? '');
  expect(text).not.toContain('시작하는 자리가 다릅니다');
  expect(text).not.toContain('설계한 사람이');
  expect(text).toContain('중간에 다른 곳으로 넘기지 않습니다');
});

test.describe('홈 — 폰(H1)', () => {
  test.skip(({ isMobile }) => !isMobile, '폰 전용');

  test('데스크톱 무대는 숨고 폰 화면만 보인다, 가로 스크롤 없음', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-dash]')).toBeHidden();
    await expect(page.locator('[data-home-phone]')).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __dash?: unknown }).__dash)).toBeUndefined();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test('첫 화면: 높이 = 화면, 글자 없이 선 하나, 2.2초 뒤 안내 · 내리면 사라짐', async ({ page }) => {
    await page.goto('/');
    const intro = page.locator('[data-intro]');
    expect(Math.abs((await intro.boundingBox())!.height - 844)).toBeLessThanOrEqual(1);
    expect((await intro.innerText()).replace('아래로 내려 보세요', '').replace('↓', '').trim()).toBe('');
    await expect(page.locator('[data-home-line]')).toHaveCount(1);
    await page.waitForTimeout(2300);
    await expect(page.locator('[data-home-hint]')).toHaveAttribute('data-on', '');
    await page.evaluate(() => window.scrollTo(0, 40));
    await expect(page.locator('[data-home-hint]')).not.toHaveAttribute('data-on', '');
  });

  test('선 끝 = 첫 판의 점 가운데, 세로 선 = 첫 점 ~ 마지막 점, 판 글은 선 오른쪽', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const p = document.querySelector<SVGPathElement>('[data-home-line]')!;
      const end = p.getPointAtLength(p.getTotalLength());
      const m = p.getScreenCTM()!; const ex = end.x * m.a + m.e, ey = end.y * m.d + m.f;
      const dots = [...document.querySelectorAll<HTMLElement>('[data-home-phone] [data-dot]')].map((d) => d.getBoundingClientRect());
      const c = (b: DOMRect) => ({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
      const rail = document.querySelector<HTMLElement>('[data-rail]')!.getBoundingClientRect();
      const texts = [...document.querySelectorAll<HTMLElement>('[data-panel] h1, [data-panel] h2, [data-panel] p')].map((t) => t.getBoundingClientRect().left);
      return { dx: ex - c(dots[0]).x, dy: ey - c(dots[0]).y, railTop: rail.top - c(dots[0]).y, railBottom: rail.bottom - c(dots[dots.length - 1]).y,
        railRight: rail.right, minText: Math.min(...texts) };
    });
    expect(Math.abs(r.dx)).toBeLessThanOrEqual(2);
    expect(Math.abs(r.dy)).toBeLessThanOrEqual(2);
    expect(Math.abs(r.railTop)).toBeLessThanOrEqual(2);
    expect(Math.abs(r.railBottom)).toBeLessThanOrEqual(2);
    expect(r.minText).toBeGreaterThan(r.railRight + 12);
  });

  test('폭이 430 으로 바뀌어도 선 끝이 첫 판의 점에 붙는다', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 430, height: 932 });
    await page.waitForTimeout(400);
    const d = await page.evaluate(() => {
      const p = document.querySelector<SVGPathElement>('[data-home-line]')!; const end = p.getPointAtLength(p.getTotalLength()); const m = p.getScreenCTM()!;
      const b = document.querySelector<HTMLElement>('[data-home-phone] [data-dot]')!.getBoundingClientRect();
      return Math.hypot(end.x * m.a + m.e - (b.left + b.width / 2), end.y * m.d + m.f - (b.top + b.height / 2));
    });
    expect(d).toBeLessThanOrEqual(2);
  });

  test('도형·판 번호·맺음 로고 없음, 갈래 목록은 링크가 아니고 화살표 없음, 프로젝트 행 수 = 공개 편 수', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-home-phone]');
    expect(await root.locator('svg').count()).toBe(1);   // 선 하나뿐
    const text = await root.innerText();
    expect(text).not.toMatch(/(^|\s)0\d(\s|$)/);
    expect(text).not.toContain('Prologue');
    const paths = root.locator('[data-path]');
    await expect(paths).toHaveCount(3);
    expect(await paths.locator('a').count()).toBe(0);
    for (const t of await paths.allInnerTexts()) expect(t).not.toContain('→');
    const n = Number(await root.locator('[data-published]').innerText());
    expect(n).toBeGreaterThan(0);
    await expect(root.locator('[data-work]')).toHaveCount(n);
  });

  test('판이 화면 72% 선을 넘으면 점이 채워진다', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('[data-panel]').first();
    await expect(first).not.toHaveAttribute('data-in', '');
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveAttribute('data-in', '');
  });
});

test('모션 줄이기(폰): 선은 그려진 상태, 판은 모두 또렷', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForTimeout(200);
  expect(await page.locator('[data-home-line]').evaluate((p) => getComputedStyle(p).strokeDashoffset)).toMatch(/^0(px)?$/);
  for (const p of await page.locator('[data-panel]').all()) await expect(p).toHaveAttribute('data-in', '');
  await ctx.close();
});
