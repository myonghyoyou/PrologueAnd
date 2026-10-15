import { test, expect } from '@playwright/test';

test.describe('Prologue&에도 보내기', () => {
  test('보내기 → 서랍이 열리고 1단계·요약·새로 만들기 선택, 서버 요청 없음', async ({ page }) => {
    const sent: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/api/')) sent.push(r.url()); });
    await page.goto('/tools/brief');
    await expect(page.locator('[data-brief] h1')).toBeVisible();   // 첫 저장(빈 답)이 끝난 뒤에 시드를 넣는다
    await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: true })));
    await page.reload();
    await page.locator('[data-brief-send]').click();
    const pain = page.locator('textarea[name="pain"]');
    await expect(pain).toBeVisible();
    await expect(pain).toHaveValue(/^\[요청서 만들기\]/);
    await expect(page.getByRole('radio', { name: '새로 만들고 싶어요' })).toBeChecked();
    expect(sent).toEqual([]);
  });

  test('서랍 2단계에서 닫은 뒤 보내기로 열면 1단계, 이미 쓴 글은 지우지 않고 덧붙임', async ({ page }) => {
    await page.goto('/tools/brief');
    await expect(page.locator('[data-brief] h1')).toBeVisible();   // 첫 저장(빈 답)이 끝난 뒤에 시드를 넣는다
    await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: true })));
    await page.reload();
    await page.locator('header [data-open-drawer]').click();
    await page.locator('textarea[name="pain"]').fill('제가 먼저 쓴 글');
    await page.getByRole('button', { name: '다음' }).click();
    await page.locator('[data-drawer] button[aria-label="닫기"]').click();
    await page.locator('[data-brief-send]').click();
    const pain = page.locator('textarea[name="pain"]');
    await expect(pain).toBeVisible();
    await expect(pain).toHaveValue(/^제가 먼저 쓴 글\n\n\[요청서 만들기\]/);
  });

  test('이미 900자를 쓴 뒤 보내기 → 합계 1,000자 이하, 기존 글 그대로', async ({ page }) => {
    await page.goto('/tools/brief');
    await expect(page.locator('[data-brief] h1')).toBeVisible();   // 첫 저장(빈 답)이 끝난 뒤에 시드를 넣는다
    await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기', name: '가'.repeat(60) }, step: 'when', done: true })));
    await page.reload();
    await page.locator('header [data-open-drawer]').click();
    await page.locator('textarea[name="pain"]').fill('나'.repeat(900));
    await page.locator('[data-drawer] button[aria-label="닫기"]').click();
    await page.locator('[data-brief-send]').click();
    const v = await page.locator('textarea[name="pain"]').inputValue();
    expect(v.length).toBeLessThanOrEqual(1000);
    expect(v.startsWith('나'.repeat(900))).toBe(true);
  });

  test('미리 채움이 없는 기존 열기는 그대로(이전 단계 유지)', async ({ page }) => {
    await page.goto('/projects');
    await page.click('header [data-open-drawer]');
    await page.locator('textarea[name="pain"]').fill('기존 동작 확인');
    await page.getByRole('button', { name: '다음' }).click();
    await page.locator('[data-drawer] button[aria-label="닫기"]').click();
    await page.click('header [data-open-drawer]');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
