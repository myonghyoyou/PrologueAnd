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
  const res = await request.post('/api/inquiry', { data: { ...ok, website: 'bot' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).sent).toBe(false);
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
