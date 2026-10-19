import { test, expect, type Page } from '@playwright/test';

/** 레퍼런스 조사 뒤 보강(명세 §11) */
const pick = (page: Page, n: string) => page.getByRole('radio', { name: n, exact: true }).check({ force: true });
const next = (page: Page) => page.locator('[data-brief-next]').click();

async function seedDone(page: Page, extra: object = {}) {
  await page.goto('/tools/brief');
  await expect(page.locator('[data-brief] h1')).toBeVisible();
  await page.evaluate((x) => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기', ...x }, step: 'when', done: true })), extra);
  await page.reload();
  await expect(page.locator('[data-brief-result]')).toBeVisible();
}

test.describe('시작 화면', () => {
  test('처음 오면 약속 세 가지·중립 선언·견본, 시작하기로 첫 질문', async ({ page }) => {
    await page.goto('/tools/brief');
    const intro = page.locator('[data-brief-intro]');
    await expect(intro.locator('h1')).toHaveText('홈페이지 요청서 만들기');
    await expect(intro.locator('[data-brief-promise] li')).toHaveText(['5분 안팎', '가입·연락처 없이', '답은 이 기기에만 저장']);
    await expect(intro).toContainText('특정 업체를 추천하거나 연결하지 않아요');
    await expect(intro.locator('[data-brief-sample]')).toContainText('홈페이지 제작 요청서');
    await page.locator('[data-brief-start]').click();
    await expect(page.locator('h1')).toHaveText('새로 만드시나요, 지금 홈페이지를 고치시나요?');
  });
  test('시작한 뒤 새로고침하면 시작 화면 없이 이어진다', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();
    await pick(page, '새로 만들기'); await next(page);
    await page.reload();
    await expect(page.locator('[data-brief-intro]')).toHaveCount(0);
    await expect(page.locator('h1')).toHaveText('어떤 곳의 홈페이지인가요?');
  });
  test('모두 지우면 시작 화면으로', async ({ page }) => {
    await seedDone(page);
    page.once('dialog', (d) => d.accept());
    await page.locator('[data-brief-reset]').click();
    await expect(page.locator('[data-brief-intro]')).toBeVisible();
  });
});

test('진행 표시는 묶음 이름과 네 칸 — 고치기를 골라도 바뀌지 않는다', async ({ page }) => {
  await page.goto('/tools/brief');
  await page.locator('[data-brief-start]').click();
  const pr = page.locator('[data-brief-progress]');
  await expect(pr).toContainText('어떤 홈페이지 · 4단계 중 1단계');
  await pick(page, '지금 홈페이지 고치기'); await next(page);
  await expect(pr).toContainText('어떤 홈페이지 · 4단계 중 1단계');
  await expect(pr.locator('[data-numeral]')).toHaveText('01');
});

test.describe('카톡·문자로 보내기', () => {
  test('공유 기능이 있으면 단추가 있고 요청서 글을 넘긴다', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __shared: unknown }).__shared = null;
      Object.defineProperty(navigator, 'share', { value: (d: unknown) => { (window as unknown as { __shared: unknown }).__shared = d; return Promise.resolve(); } });
    });
    await seedDone(page);
    await page.locator('[data-brief-share]').click();
    const d = await page.evaluate(() => (window as unknown as { __shared: { text: string } }).__shared);
    expect(d.text).toContain('■ 무엇을 위한 홈페이지인가요');
    expect(d.text).not.toContain('Prologue');
  });
  test('공유 기능이 없으면 단추가 없다', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: undefined }); });
    await seedDone(page);
    await expect(page.locator('[data-brief-share]')).toHaveCount(0);
  });
});

test('PDF: 업체 질문마다 답 적을 줄, 화면에서는 안 보임, 저장 불가 안내는 인쇄에서 숨김', async ({ page }) => {
  await seedDone(page);
  const n = await page.locator('[data-brief-vendor] li').count();
  await expect(page.locator('[data-answer-line]').first()).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-answer-line]:visible')).toHaveCount(n);
  const avoid = await page.locator('[data-brief-doc] section').first().evaluate((e) => getComputedStyle(e).breakInside);
  expect(avoid).toBe('avoid');
});

test('비교표: 예/아니오 칸은 눌러서 바꾼다', async ({ page }) => {
  await seedDone(page);
  const b = page.locator('[data-brief-compare] [data-yn]').first();
  await expect(b).toHaveText('—');
  await b.click(); await expect(b).toHaveText('예');
  await b.click(); await expect(b).toHaveText('아니오');
  await b.click(); await expect(b).toHaveText('—');
  await expect(page.locator('[data-brief-compare] [data-yn]')).toHaveCount(9);
});

test.describe('답하는 동안 요청서 미리보기', () => {
  test('넓은 화면: 질문 옆에 늘 보이고 답을 따라 바뀐다', async ({ page }, info) => {
    test.skip(info.project.name !== 'w1440');
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();
    const pv = page.locator('[data-brief-preview]');
    await expect(pv).toBeVisible();
    await pick(page, '새로 만들기'); await next(page);
    await pick(page, '회사·사무실'); await page.locator('[data-brief-name]').fill('테스트 상사');
    await expect(pv).toContainText('홈페이지 제작 요청서 · 테스트 상사');
    await expect(pv.locator('[data-current]')).toContainText('무엇을 위한 홈페이지인가요');
    // 아직 묻지 않은 질문까지 「업체 제안 받기」로 보이면 안 된다 — 그 단원은 결과에서만
    await expect(pv).not.toContainText('업체 제안을 받고 싶은 것');
    const q = (await page.locator('h1').boundingBox())!, p = (await pv.boundingBox())!;
    expect(p.x).toBeGreaterThan(q.x + q.width - 1);
  });
  test('폰: 단추로 아래 시트를 열고 닫는다, 가로 스크롤 없음', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone');
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();
    await expect(page.locator('[data-brief-preview]')).toBeHidden();
    await page.locator('[data-brief-preview-open]').click();
    await expect(page.locator('[role="dialog"][aria-label="요청서 미리보기"]')).toBeVisible();
    await expect(page.locator('[role="dialog"][aria-label="요청서 미리보기"]')).toContainText('홈페이지 제작 요청서');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
