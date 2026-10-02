import { test, expect, type Page } from '@playwright/test';

const coverEnd = (p: Page) => p.evaluate(() => document.querySelector('[data-cover]')!.getBoundingClientRect().bottom + scrollY);
const to = async (p: Page, y: number) => { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(350); };

test.describe('폰 문의', () => {
  test.skip(({ isMobile }) => !isMobile, '폰 전용');

  test('사례: 표지 위에는 바 없음, 지나면 있음, 끝 문의 영역이 보이면 없음', async ({ page }) => {
    await page.goto('/projects/shift-board');
    const dock = page.locator('[data-dock]');
    await expect(dock).not.toHaveAttribute('data-on', '');
    await to(page, (await coverEnd(page)) + 200);
    await expect(dock).toHaveAttribute('data-on', '');
    await page.locator('[data-closing]').scrollIntoViewIfNeeded(); await page.waitForTimeout(350);
    await expect(dock).not.toHaveAttribute('data-on', '');
  });

  test('목록: 처음부터 바가 있다, 홈에는 바가 없다', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('[data-dock]')).toHaveAttribute('data-on', '');
    await page.goto('/');
    await expect(page.locator('[data-dock]')).toHaveCount(0);
  });

  test('바를 누르면 커진 뒤 서랍이 아래 시트로 열리고, 바는 숨는다', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-dock]');
    const drawer = page.locator('[data-drawer]');
    await expect(drawer).toBeVisible();
    const b = (await drawer.boundingBox())!;
    expect(Math.abs(b.y + b.height - 844)).toBeLessThanOrEqual(2);   // 화면 아래에 붙음
    expect(b.height).toBeGreaterThan(844 * 0.8);
    expect(b.x).toBe(0);
    await expect(page.locator('[data-dock]')).toBeHidden();
    expect(await drawer.getAttribute('data-lenis-prevent')).not.toBeNull();
  });

  test('시트의 닫기 단추는 44px', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-dock]');
    await expect(page.locator('[data-drawer]')).toBeVisible();
    const b = (await page.locator('[data-drawer] button[aria-label="닫기"]').boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  });

  test('폰 입력칸 글자 16px 이상', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-dock]');
    for (const f of await page.locator('[data-drawer] textarea, [data-drawer] input:not([type=radio]):not([type=hidden]):not([tabindex="-1"])').all()) {
      expect(parseFloat(await f.evaluate((e) => getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
    }
  });

  test('손잡이로 끌어 닫기 · 뒤로가기로 닫기, 닫힌 뒤 hidden 이고 바가 돌아온다', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-dock]');
    await expect(page.locator('[data-drawer]')).toBeVisible();
    await page.waitForTimeout(100);
    const g = (await page.locator('[data-drawer-grab]').boundingBox())!;
    await page.mouse.move(g.x + g.width / 2, g.y + 5); await page.mouse.down();
    await page.mouse.move(g.x + g.width / 2, g.y + 125, { steps: 6 }); await page.mouse.up();
    await page.waitForTimeout(450);
    await expect(page.locator('[data-drawer]')).toBeHidden();
    await expect(page.locator('[data-dock]')).toBeVisible();
    await page.click('[data-dock]');
    await expect(page.locator('[data-drawer]')).toBeVisible();
    await page.goBack();
    await page.waitForTimeout(450);
    await expect(page.locator('[data-drawer]')).toBeHidden();
    expect(page.url()).toMatch(/\/projects$/);
  });

  test('키보드가 올라오면(visualViewport 축소) 시트가 그 위로 올라간다', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-dock]');
    await expect(page.locator('[data-drawer]')).toBeVisible();
    await page.evaluate(() => {
      const vv = window.visualViewport!;
      Object.defineProperty(vv, 'height', { configurable: true, get: () => 500 });
      vv.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(100);
    const b = (await page.locator('[data-drawer]').boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(502);
  });
});

test('데스크톱 서랍은 오른쪽 패널 그대로, 닫히면 hidden(Review Focus 3)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/projects');
  await expect(page.locator('[data-dock]')).toBeHidden();
  await page.click('header [data-open-drawer]');
  await page.waitForTimeout(450);   // 오른쪽에서 미끄러져 들어오는 .35s 뒤에 잰다
  const b = (await page.locator('[data-drawer]').boundingBox())!;
  expect(b.x + b.width).toBe(1440);
  expect(b.height).toBe(900);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  await expect(page.locator('[data-drawer]')).toBeHidden();
  await ctx.close();
});
