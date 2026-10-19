import { test, expect, type Page } from '@playwright/test';

/** 오픈 희망일 — react-datepicker 달력(공통 부품 components/ui/date-field) */

async function seedWhen(page: Page) {
  await page.goto('/tools/brief');
  await expect(page.locator('[data-brief] h1')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: false })));
  await page.reload();
  await expect(page.locator('h1')).toHaveText('일정과 예산, 결정하실 분을 알려 주세요');
}
const cal = (page: Page) => page.locator('.react-datepicker');
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('prologue.brief.v1')!).answers.openDate as string);

test('누르면 한국어 달력이 펼쳐지고, 고른 날은 한국어로 보이며 날짜 형식으로 저장된다', async ({ page }) => {
  await seedWhen(page);
  const field = page.locator('[data-date-field] button');
  await expect(field).toContainText('날짜를 골라 주세요');
  await field.click();
  await expect(cal(page)).toBeVisible();
  const now = new Date();
  await expect(cal(page).locator('[data-cal-title]')).toHaveText(`${now.getFullYear()}년 ${now.getMonth() + 1}월`);
  await expect(cal(page).locator('.react-datepicker__day-name').first()).toHaveText(/일$/);   // 화면 낭독기용 「일요일」이 함께 들어 있다
  await cal(page).getByRole('button', { name: '다음 달' }).click();
  await cal(page).locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)', { hasText: /^15$/ }).click();
  await expect(cal(page)).toBeHidden();
  const nx = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  await expect(field).toContainText(`${nx.getFullYear()}년 ${nx.getMonth() + 1}월 15일`);
  await expect.poll(() => saved(page)).toBe(`${nx.getFullYear()}-${String(nx.getMonth() + 1).padStart(2, '0')}-15`);
  await expect(page.getByText('선택한 날짜에 꼭 오픈되어야 하나요?')).toBeVisible();
});

test('지난 날짜·지난 달은 고를 수 없고, Esc 로 닫힌다', async ({ page }) => {
  await seedWhen(page);
  await page.locator('[data-date-field] button').click();
  // 지난 달로는 넘어갈 수 없고, 이번 달의 지난 날은 막혀 있다
  await expect(cal(page).getByRole('button', { name: '이전 달' })).toBeDisabled();
  if (new Date().getDate() > 1) await expect(cal(page).locator('.react-datepicker__day--disabled:not(.react-datepicker__day--outside-month)').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(cal(page)).toBeHidden();
});

test('아직 모르겠어요를 고르면 날짜가 지워진다', async ({ page }) => {
  await seedWhen(page);
  await page.locator('[data-date-field] button').click();
  await cal(page).getByRole('button', { name: '다음 달' }).click();
  await cal(page).locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)', { hasText: /^10$/ }).click();
  await expect.poll(() => saved(page)).not.toBe('');
  await page.locator('[data-choice]', { hasText: '아직 모르겠어요' }).click();
  await expect.poll(() => saved(page)).toBe('');
  await expect(page.locator('[data-date-field] button')).toContainText('날짜를 골라 주세요');
});

test('달력: 모서리 2px 이하, 화면 밖으로 넘치지 않는다', async ({ page }) => {
  await seedWhen(page);
  await page.locator('[data-date-field] button').click();
  await expect(cal(page)).toBeVisible();
  const round = await cal(page).evaluate((root) => [root, ...root.querySelectorAll<HTMLElement>('*')]
    .filter((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius) > 2).map((e) => e.className));
  expect(round).toEqual([]);
  const b = (await cal(page).boundingBox())!;
  const vw = await page.evaluate(() => innerWidth);
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(vw);
});

test('넓은 화면: 입력칸과 달력의 양 끝이 맞는다, 폰: 입력칸은 꽉 찬다', async ({ page }, info) => {
  await seedWhen(page);
  const btn = page.locator('[data-date-field] button');
  await btn.click();
  await expect(cal(page)).toBeVisible();
  const f = (await btn.boundingBox())!, c = (await cal(page).boundingBox())!;
  if (info.project.name === 'phone') {
    const h1 = (await page.locator('h1').boundingBox())!;
    expect(Math.abs(f.width - h1.width)).toBeLessThanOrEqual(2);
  } else {
    expect(Math.abs(f.x - c.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(f.x + f.width - (c.x + c.width))).toBeLessThanOrEqual(1);
  }
});
