import { test, expect } from '@playwright/test';

// 병원 UI/UX 고도화 상세 (명세 docs/superpowers/specs/2026-09-29-hospital-ux-case-design.md)
const URL = '/projects/hospital-ux';

test('병원 편이 열리고, 표지 제목과 소개가 명세 문구다', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('[data-cover-title] h1')).toHaveText('병원 자산·재고·인사 업무를처리하는 사내 시스템');
  await expect(page.locator('[data-summary]')).toHaveText('기능이 늘 때마다 화면을 따로 만들어, 같은 시스템인데 화면마다 색과 버튼 크기가 달랐습니다.');
});

test('목록에 병원 행이 링크로, 두 편이 서로를 다음 이야기로 가리킨다', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('a[data-row][data-slug="hospital-ux"]')).toHaveAttribute('href', URL);
  await page.goto(URL);
  await expect(page.locator('[data-teaser]')).toContainText('Por favor, Harry');
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-teaser]')).toContainText('병원 UI/UX 고도화');
});

test('04 화면: 여백 주석 여섯, "전에는" 여섯', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#screens [data-block="note"]')).toHaveCount(6);
  await expect(page.locator('#screens [data-was]')).toHaveCount(6);
});
