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

test.describe('2A 캡처 확대 뷰어', () => {
  test('캡처마다 「⤢ 크게 보기」가 왼쪽 위에 있다', async ({ page }) => {
    await page.goto(URL);
    const tags = page.locator('[data-zoom-tag]');
    expect(await tags.count()).toBeGreaterThan(5);
    const r = await tags.first().evaluate((t) => { const b = t.getBoundingClientRect(), f = t.closest('[data-zoom]')!.getBoundingClientRect(); return { dx: b.left - f.left, dy: b.top - f.top }; });
    expect(r.dx).toBeLessThan(20); expect(r.dy).toBeLessThan(20);
  });

  test('표지 캡처를 누르면 원본이 열리고 번호 단추 = 표지 번호 수, ×로 닫히면 hidden·스크롤 그대로', async ({ page }) => {
    await page.goto(URL);
    const pins = await page.locator('[data-pin]').count();
    const before = await page.evaluate(() => scrollY);
    await page.locator('[data-hero-pinned] [data-zoom]').click();
    const v = page.locator('[data-zoom-viewer]');
    await expect(v).toBeVisible();
    await expect(page.locator('[data-zoom-img]')).toHaveAttribute('src', '/screens/shift/excel-cover.png');
    await expect(page.locator('[data-zoom-pin]')).toHaveCount(pins);
    expect(await v.getAttribute('data-lenis-prevent')).not.toBeNull();
    await page.click('[data-zoom-close]');
    await expect(v).toBeHidden();
    expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThanOrEqual(2);
  });

  test('두 번 누르면 확대, 다시 두 번 누르면 원래 크기', async ({ page }) => {
    await page.goto(URL);
    await page.locator('[data-hero-pinned] [data-zoom]').click();
    const w = () => page.locator('[data-zoom-img]').evaluate((i) => i.getBoundingClientRect().width);
    const w0 = await w();
    await page.locator('[data-zoom-img]').dblclick();
    await page.waitForTimeout(350);
    expect(await w()).toBeGreaterThan(w0 * 2);
    await page.locator('[data-zoom-img]').dblclick();
    await page.waitForTimeout(350);
    expect(Math.abs((await w()) - w0)).toBeLessThanOrEqual(2);
  });

  test('번호 단추를 누르면 확대되고 그 자리가 화면 가운데 근처로 온다', async ({ page }) => {
    await page.goto(URL);
    await page.locator('[data-hero-pinned] [data-zoom]').click();
    await page.locator('[data-zoom-pin]').first().click();
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const st = document.querySelector<HTMLElement>('[data-zoom-stage]')!, img = document.querySelector<HTMLElement>('[data-zoom-img]')!;
      const p = JSON.parse(document.querySelector<HTMLElement>('[data-hero-pinned] [data-zoom]')!.dataset.zoomPins!)[0];
      const ib = img.getBoundingClientRect(), sb = st.getBoundingClientRect();
      return { x: ib.left + ib.width * p.x / 100 - (sb.left + sb.width / 2), w: ib.width, sw: sb.width };
    });
    expect(r.w).toBeGreaterThan(r.sw * 2);
    expect(Math.abs(r.x)).toBeLessThan(60);
  });

  test('처음 안내는 그림 위에서 읽히게 어두운 바탕 · 한 줄', async ({ page }) => {
    await page.goto(URL);
    await page.locator('[data-hero-pinned] [data-zoom]').click();
    const tip = page.locator('[data-zoom-viewer] p', { hasText: '두 손가락으로 벌리거나, 두 번 누르세요' });
    await expect(tip).toBeVisible();
    const r = await tip.evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, h: e.getBoundingClientRect().height }));
    const [, , , a] = r.bg.match(/[\d.]+/g)!.map(Number);
    expect(a).toBeGreaterThanOrEqual(0.7);
    expect(r.h).toBeLessThan(40);
  });

  test('번호 단추는 서로 겹치지 않고, 글이 단추 안에서 말줄임된다', async ({ page }) => {
    await page.goto(URL);
    await page.locator('[data-hero-pinned] [data-zoom]').click();
    const r = await page.locator('[data-zoom-pin]').evaluateAll((bs) => bs.map((b) => {
      const o = b.getBoundingClientRect(), t = b.querySelector('span')!.getBoundingClientRect();
      return { l: o.left, r: o.right, tr: t.right };
    }));
    for (let i = 0; i < r.length; i++) {
      expect(r[i].tr).toBeLessThanOrEqual(r[i].r);
      if (i) expect(r[i].l).toBeGreaterThanOrEqual(r[i - 1].r);
    }
  });

  test('뒤로가기로 닫히고 주소 그대로, 위 줄을 끌어 내려도 닫힌다', async ({ page }) => {
    await page.goto(URL);
    await page.locator('[data-hero-pinned] [data-zoom]').click();
    await page.goBack();
    await expect(page.locator('[data-zoom-viewer]')).toBeHidden();
    expect(page.url()).toMatch(/\/projects\/shift-board$/);
    await page.locator('[data-hero-pinned] [data-zoom]').click();
    const t = (await page.locator('[data-zoom-top]').boundingBox())!;
    await page.mouse.move(t.x + 40, t.y + t.height / 2); await page.mouse.down();
    await page.mouse.move(t.x + 40, t.y + t.height / 2 + 160, { steps: 8 }); await page.mouse.up();
    await expect(page.locator('[data-zoom-viewer]')).toBeHidden();
  });

  test('핫스팟 목록 행이나 전환 단추를 눌러도 뷰어가 열리지 않는다', async ({ page }) => {
    await page.goto(URL);
    await page.locator('[data-side-toggle] button').first().click();
    await expect(page.locator('[data-zoom-viewer]')).toBeHidden();
  });
});

test('데스크톱에서는 캡처를 눌러도 뷰어가 없고 「크게 보기」도 보이지 않는다', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/projects/shift-board');
  await expect(page.locator('[data-zoom-tag]').first()).toBeHidden();
  await page.locator('[data-hero-pinned] [data-zoom]').click();
  await expect(page.locator('[data-zoom-viewer]')).toBeHidden();
  await ctx.close();
});

test.describe('표 · 순서 비교', () => {
  test('표: 안내가 있고, 옆으로 넘겨도 첫 열은 제자리, 래퍼는 영역·Lenis 제외', async ({ page }) => {
    await page.goto(URL);
    const sc = page.locator('#problem [data-table-scroll]');
    await expect(page.locator('#problem [data-table-hint]')).toHaveText('옆으로 넘겨 보기 →');
    await expect(sc).toHaveAttribute('role', 'region');
    expect(await sc.getAttribute('data-lenis-prevent')).not.toBeNull();
    const x0 = await page.locator('#problem tbody th').first().evaluate((e) => e.getBoundingClientRect().left);
    await sc.evaluate((e) => { e.scrollLeft = 200; });
    await page.waitForTimeout(100);
    expect(Math.abs((await page.locator('#problem tbody th').first().evaluate((e) => e.getBoundingClientRect().left)) - x0)).toBeLessThanOrEqual(1);
  });

  test('순서 비교: 두 줄이 왼쪽·오른쪽 두 열, 같은 순번 칸의 윗변이 같고 가로 스크롤 없음', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#order [data-steps]')).toHaveAttribute('data-cols', '2');
    const r = await page.locator('#order [data-steps-row]').evaluateAll((rows) => rows.map((row) => [...row.querySelectorAll<HTMLElement>('[data-step]')].map((s) => s.getBoundingClientRect())));
    expect(r[0][0].left).toBeLessThan(r[1][0].left);
    r[0].forEach((b, i) => expect(Math.abs(b.top - r[1][i].top)).toBeLessThanOrEqual(1));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
