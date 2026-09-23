import { test, expect } from '@playwright/test';

const ok = { pain: '요청이 네 갈래로 들어옵니다', email: 'a@b.com', tools: ['엑셀', '카톡'], elapsed: 9000 };

test('필수 두 칸이 비면 400', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { pain: '', email: '', elapsed: 9000 } });
  expect(res.status()).toBe(400);
});

test('보기에 없는 값은 400', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, people: '천 명' } });
  expect(res.status()).toBe(400);
});

test('허니팟이 채워지면 200이지만 보내지 않는다', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, hp_note: 'bot' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).sent).toBe(false);
});

test('허니팟 칸은 브라우저가 자동 완성하지 않는 이름이고 탭 순서에서 빠져 있다', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('input[name="website"]')).toHaveCount(0);
  const hp = page.locator('input[name="hp_note"]');
  await expect(hp).toHaveCount(1);
  await expect(hp).toHaveAttribute('autocomplete', 'off');
  await expect(hp).toHaveAttribute('tabindex', '-1');
});

test('지금 쓰는 것은 6개를 넘으면 400', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, tools: ['엑셀', '종이', '카톡', '이메일', '기존 시스템', '없음', '엑셀'] } });
  expect(res.status()).toBe(400);
});

test('5초 미만 제출은 거른다', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, elapsed: 1200 } });
  expect(res.status()).toBe(200);
  expect((await res.json()).sent).toBe(false);
});

test('헤더 문의 버튼을 누르면 서랍이 열리고 첫 textarea로 포커스가 간다', async ({ page }) => {
  await page.goto('/projects');
  await page.click('header [data-open-drawer]');
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-drawer-open'))).toBe(true);
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box!.x).toBeLessThan((viewport?.width ?? 1440) - 10); // 화면 안으로 슬라이드 인 (translateX(100%) → none)
  await expect(page.locator('textarea[name="work"]')).toBeFocused();
});

test('불편한 점이 비어 있으면 다음을 눌러도 1단계에 머물고 한국어 오류가 뜬다', async ({ page }) => {
  await page.goto('/projects');
  await page.click('header [data-open-drawer]');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.locator('[role="dialog"] [role="alert"]')).toContainText('가장 불편한 점을 한 줄만 적어주세요.');
  await expect(page.locator('textarea[name="pain"]')).toBeVisible();
});

test('불편한 점을 적고 Escape로 닫으면 포커스가 문의 버튼으로 돌아가고, 다시 열면 값이 남아 있다', async ({ page }) => {
  await page.goto('/projects');
  const trigger = page.locator('header [data-open-drawer]');
  await trigger.click();
  await page.fill('textarea[name="pain"]', '요청이 네 갈래로 들어옵니다');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-drawer-open'))).toBe(false);
  expect(await page.locator('[role="dialog"]').evaluate((el) => (el as HTMLElement & { inert: boolean }).inert)).toBe(true);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.locator('textarea[name="pain"]')).toHaveValue('요청이 네 갈래로 들어옵니다');
});

test('2단계에서 닫았다 다시 열면 포커스가 서랍 안 2단계 필드에 있고, Tab을 눌러도 서랍을 벗어나지 않는다', async ({ page }) => {
  await page.goto('/projects');
  const trigger = page.locator('header [data-open-drawer]');
  await trigger.click();
  await page.fill('textarea[name="pain"]', '요청이 네 갈래로 들어옵니다');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.locator('textarea[name="goal"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await trigger.click();

  // 열릴 때(380ms 뒤) 포커스가 서랍 "안"의, 지금 보이는(2단계) 필드에 있어야 한다 — work(1단계, 숨김)가 아니라 goal(2단계)
  await expect(page.locator('textarea[name="goal"]')).toBeFocused();
  const focusedInsideDialogAndVisible = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const active = document.activeElement as HTMLElement | null;
    return !!dialog && !!active && dialog.contains(active) && active.offsetParent !== null;
  });
  expect(focusedInsideDialogAndVisible).toBe(true);

  await page.keyboard.press('Tab');
  const stillInsideDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return !!dialog && dialog.contains(document.activeElement);
  });
  expect(stillInsideDialog).toBe(true);
});

test('상세에서 포커스된 문의 버튼에 Space 를 누르면 서랍이 열리고 페이지는 움직이지 않는다', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — 헤더 문의 버튼 포커스로 확인');
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  await page.locator('header [data-open-drawer]').focus();
  await page.keyboard.press(' ');
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-drawer-open'))).toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
