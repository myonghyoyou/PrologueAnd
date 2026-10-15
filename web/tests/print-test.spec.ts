import { test, expect } from '@playwright/test';

test('시험 페이지: 검색 제외, 단추 셋, 저장소 쓰기 결과 표시', async ({ page }) => {
  await page.goto('/tools/print-test');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('button', { name: '인쇄 창 열기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '글 복사' })).toBeVisible();
  await page.getByRole('button', { name: '저장소 쓰기' }).click();
  await expect(page.locator('[data-result="storage"]')).toHaveText(/성공/);
  await expect(page.locator('[data-ua]')).not.toBeEmpty();
});

test('시험 페이지는 사이트맵에 없다', async ({ request }) => {
  const t = await (await request.get('/sitemap.xml')).text();
  expect(t).not.toContain('print-test');
});
