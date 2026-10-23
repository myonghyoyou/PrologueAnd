import { test, expect } from '@playwright/test';
import { DATE_KO } from '../components/ui/date-field';
import { hasA4 } from './brief-ko';

test('A4 규칙이 한국어 요청서를 떠나면 남지 않는다', async ({ page }) => {
  await page.goto('/tools/brief');
  expect(await hasA4(page)).toBe(true);
  await page.click('header [data-brand]');            // 화면 전환(next/link)으로 홈
  await page.waitForURL('/');
  expect(await hasA4(page)).toBe(false);
});
test('DATE_KO는 지금 달력 글자 그대로', () => {
  expect(DATE_KO).toMatchObject({ locale: 'ko', empty: '날짜를 골라 주세요', none: '고르지 않음', prev: '이전 달', next: '다음 달' });
  expect(DATE_KO.show(new Date(2026, 10, 10))).toBe('2026년 11월 10일 (화)');
  expect(DATE_KO.title(new Date(2026, 10, 10))).toBe('2026년 11월');
});
test('머리글 hideContact: 기본은 문의 단추가 그대로', async ({ page }) => {
  await page.goto('/tools/brief'); await expect(page.locator('header [data-open-drawer]')).toHaveCount(1);
});
