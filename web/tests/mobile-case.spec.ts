import { test, expect, type Page } from '@playwright/test';
test.skip(({ isMobile }) => !isMobile, '폰 전용');

const URL = '/projects/shift-board';
const coverEnd = (p: Page) => p.evaluate(() => document.querySelector('[data-cover]')!.getBoundingClientRect().bottom + scrollY);
const to = async (p: Page, y: number) => { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(350); };

test.describe('1A 장 진행 바', () => {
  test('표지 위에는 없고, 지나 내리면 바가 붙고 헤더가 숨는다. 위로 올리면 반대', async ({ page }) => {
    await page.goto(URL);
    const bar = page.locator('[data-chapter-bar]');
    await expect(bar).not.toHaveAttribute('data-on', '');
    const y = await coverEnd(page);
    await to(page, y + 200); await to(page, y + 400);
    await expect(bar).toHaveAttribute('data-on', '');
    expect(await page.locator('header').first().evaluate((h) => h.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
    await to(page, y + 360);
    await expect(bar).not.toHaveAttribute('data-on', '');
    expect(await page.locator('header').first().evaluate((h) => h.getBoundingClientRect().top)).toBe(0);
  });

  test('손가락 떨림(3px 위로)에는 바가 유지된다(Review Focus 4)', async ({ page }) => {
    await page.goto(URL);
    const y = await coverEnd(page);
    await to(page, y + 200); await to(page, y + 400); await to(page, y + 397);
    await expect(page.locator('[data-chapter-bar]')).toHaveAttribute('data-on', '');
  });

  test('지금 장 이름·번호가 맞고 한 줄, 장 목록에서 고르면 그 장 도입이 바 아래에 온다', async ({ page }) => {
    await page.goto(URL);
    const y = await coverEnd(page);
    await to(page, y + 100); await to(page, y + 300);
    await expect(page.locator('[data-chapter-num]')).toHaveText('01 / 03');
    await expect(page.locator('[data-chapter-name]')).toHaveText('문제');
    expect(await page.locator('[data-chapter-name]').evaluate((e) => e.getBoundingClientRect().height)).toBeLessThan(30);
    await page.click('[data-chapter-toc]');
    await expect(page.locator('[data-chapter-go]')).toHaveText([/^01문제/, /^02편성 순서/, /^03화면/]);
    await page.locator('[data-chapter-go]').nth(2).click();
    await page.waitForTimeout(1200);
    const top = await page.locator('#screens').evaluate((e) => e.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(40); expect(top).toBeLessThanOrEqual(120);
    await expect(page.locator('[data-bottom-sheet]')).toBeHidden();
  });

  test('장 목록: 뒤로가기로 닫히고 주소·스크롤 그대로, 시트는 data-lenis-prevent(Review Focus 1·2)', async ({ page }) => {
    await page.goto(URL);
    const y = await coverEnd(page);
    await to(page, y + 100); await to(page, y + 300);
    await page.click('[data-chapter-toc]');
    expect(await page.locator('[data-sheet]').getAttribute('data-lenis-prevent')).not.toBeNull();
    await page.evaluate(() => { (window as unknown as { __mark: number }).__mark = 1; });
    const before = await page.evaluate(() => scrollY);
    await page.goBack();
    await expect(page.locator('[data-bottom-sheet]')).toBeHidden();
    expect(page.url()).toMatch(/\/projects\/shift-board$/);
    expect(await page.evaluate(() => (window as unknown as { __mark?: number }).__mark)).toBe(1);
    expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThanOrEqual(2);
  });

  test('장 목록 손잡이를 120px 끌면 닫힌다, Esc 로도 닫힌다', async ({ page }) => {
    await page.goto(URL);
    const y = await coverEnd(page); await to(page, y + 100); await to(page, y + 300);
    await page.click('[data-chapter-toc]');
    await page.waitForTimeout(400);   // 시트가 다 올라온 뒤에 손잡이 위치를 잰다
    const g = (await page.locator('[data-grab]').boundingBox())!;
    await page.mouse.move(g.x + g.width / 2, g.y + 5); await page.mouse.down();
    await page.mouse.move(g.x + g.width / 2, g.y + 125, { steps: 6 }); await page.mouse.up();
    await expect(page.locator('[data-bottom-sheet]')).toBeHidden();
    await page.click('[data-chapter-toc]'); await page.keyboard.press('Escape');
    await expect(page.locator('[data-bottom-sheet]')).toBeHidden();
  });
});

test('데스크톱에는 장 진행 바가 보이지 않는다', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  await expect(page.locator('[data-chapter-bar]')).toBeHidden();
  await ctx.close();
});
