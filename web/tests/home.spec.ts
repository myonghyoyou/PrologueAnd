import { test, expect, type Page } from '@playwright/test';

// 홈 = 경로형 대시보드(시안 v6). 데스크톱은 고정 무대 위 카메라가 선을 따라 장면 아홉 개를 지나고, 폰은 세로 스택이다
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

test.describe('홈 — 폰', () => {
  test.skip(({ isMobile }) => !isMobile, '폰 전용');

  test('세로 스택: 장면이 모두 보이고 선·진행 지도는 없으며 가로 스크롤이 없다', async ({ page }) => {
    await page.goto('/');
    for (const id of ['p00', 'p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
      expect(await page.locator(`#${id}`).evaluate((n) => getComputedStyle(n).opacity)).toBe('1');
    }
    await expect(page.locator('[data-pmap]')).toBeHidden();
    await expect(page.locator('[data-dash] svg')).toBeHidden();
    expect(await page.evaluate(() => (window as unknown as { __dash?: unknown }).__dash)).toBeUndefined();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test('장면 순서는 경로 순서 — 무엇을 칩 세 개가 Projects 앞', async ({ page }) => {
    await page.goto('/');
    const ys = await page.evaluate(() => ['p05', 'p06', 'p07', 'p08'].map((id) => document.getElementById(id)!.getBoundingClientRect().top));
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    const chips = await page.locator('[data-node] span').allTextContents();
    expect(chips).toEqual(['고치기', '옮기기', '만들기']);
  });
});
