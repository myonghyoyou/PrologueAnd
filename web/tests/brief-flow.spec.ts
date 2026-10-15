import { test, expect } from '@playwright/test';

test('요청서 페이지: 제목·대표 주소·머리글(브랜드+문의만)·바닥글 없음', async ({ page }) => {
  await page.goto('/tools/brief');
  expect(await page.title()).toBe('홈페이지 요청서 만들기 · Prologue&');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.prologueand.com/tools/brief');
  await expect(page.locator('header [data-brand]')).toBeVisible();
  await expect(page.locator('header [data-open-drawer]')).toBeVisible();
  await expect(page.locator('header a[href="/projects"]')).toHaveCount(0);
  await expect(page.locator('[data-footer]')).toHaveCount(0);
  await expect(page.locator('[data-brief]')).toHaveCount(1);
});

test('기존 머리글 형태는 그대로', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header a[href="/projects"]')).toHaveCount(1);
  await page.goto('/projects');
  await expect(page.locator('header [data-nav-current]')).toHaveText('Projects');
});
