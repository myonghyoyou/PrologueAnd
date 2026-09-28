import { test, expect, type Page } from '@playwright/test';
import { scrollToY } from './helpers';

// 03 화면 첫 여백 주석(요청 작성): 데스크톱은 HTML 로 다시 그린 양식이 붙은 채 스크롤로 채워진다(초점만 — 네모·여백 선 없음).
// 폰·모션 줄이기는 캡처 + 핫스팟 그대로.
const PIN = 80, STEPS = 2.4;
const trackY = (page: Page, k: number) => page.evaluate(([k, pin, steps]) => {
  const tr = document.querySelector('[data-note-live]')!.closest('[data-pin-track]')!;
  return tr.getBoundingClientRect().top + window.scrollY - pin + window.innerHeight * steps * k;
}, [k, PIN, STEPS] as const);
const k = (page: Page, key: string) => page.locator(`[data-form-demo] [data-k="${key}"]`);
const filterOf = (page: Page, key: string) => k(page, key).evaluate((n) => (n as HTMLElement).style.filter);

test.describe('요청 양식 재현 — 데스크톱', () => {
  test.skip(({ isMobile }) => !!isMobile, '데스크톱 전용 — 폰은 캡처 + 핫스팟');
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/por-favor-harry');
    await page.waitForTimeout(600);
  });

  test('캡처 대신 재현 양식이 보이고, 겹쳐 그리는 네모·여백 선이 없다', async ({ page }) => {
    await expect(page.locator('[data-form-demo]')).toBeVisible();
    await expect(page.locator('[data-block="note"] [data-spot]').first()).toBeHidden();
    await expect(page.locator('[data-note-live] [data-spot-hl]')).toHaveCount(0);
    await expect(page.locator('[data-note-live] [data-seg], [data-note-live] [data-trk]')).toHaveCount(0);
  });

  test('① 구간: 유형이 눌리고 제목이 입력되며, ① 구역만 선명하다', async ({ page }) => {
    await scrollToY(page, await trackY(page, 0.2));
    await page.waitForTimeout(2500);   // 타이핑은 시간으로 재생된다(초당 약 20자)
    const stage = await page.locator('[data-note-live]').evaluate((n) => Math.round(n.closest('[data-pin-stage]')!.getBoundingClientRect().top));
    expect(stage).toBe(PIN);
    await expect(k(page, 'title')).toHaveText("거래처 단가표 양식에 '적용 시작일' 열 추가");
    expect(await k(page, 'type').evaluate((n) => getComputedStyle(n).backgroundColor)).toBe('rgb(15, 107, 84)');
    expect(await filterOf(page, 'title')).toBe('');
    expect(await filterOf(page, 'screen')).toContain('opacity');
    await expect(page.locator('[data-demo-spot="0"]')).toHaveClass(/./);
    await expect(page.locator('[data-demo-spot="1"]')).not.toHaveClass(/./);
  });

  test('② 구간: 날짜·화면·내용이 채워지고 내용 칸도 ② 구역으로 선명하다', async ({ page }) => {
    await scrollToY(page, await trackY(page, 0.62));
    await page.waitForTimeout(3500);
    await expect(k(page, 'screen')).toHaveText('거래처 단가표');
    await expect(k(page, 'body')).toContainText('3분기에만 4건.');
    expect(await filterOf(page, 'body')).toBe('');
    expect(await filterOf(page, 'title')).toContain('opacity');
    await expect(page.locator('[data-demo-spot="1"]')).toHaveClass(/./);
  });

  test('끝: 파일 두 개가 붙고 「요청하기」가 켜진다. 되돌리면 되감긴다', async ({ page }) => {
    await scrollToY(page, await trackY(page, 0.97));
    await page.waitForTimeout(4000);
    expect(await k(page, 'a2').evaluate((n) => (n as HTMLElement).style.opacity)).toBe('1');
    expect(await k(page, 'send').evaluate((n) => (n.querySelector('[data-fill]') as HTMLElement).style.width)).toBe('100%');
    await scrollToY(page, await trackY(page, 0.02));
    await page.waitForTimeout(3000);
    await expect(k(page, 'title')).toHaveText('');
    await expect(k(page, 'body')).toHaveText('');
  });
});

test('모션 줄이기(데스크톱): 재현 양식 대신 캡처 + 핫스팟, 붙지 않는다', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-form-demo]')).toBeHidden();
  await expect(page.locator('[data-block="note"] [data-spot]').first()).toBeVisible();
  await ctx.close();
});

test('폰: 캡처 + 핫스팟이 보이고 재현 양식은 없다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-form-demo]')).toBeHidden();
  await expect(page.locator('[data-block="note"] [data-spot]').first()).toBeVisible();
});
