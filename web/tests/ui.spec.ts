import { test, expect, type Page, type Locator } from '@playwright/test';

/** 공통 부품(components/ui) — 사이트 디자인 기준(docs/14 §3.3): 모서리 2px, 카드·채움 없음, 네이비는 획 */

const pick = (page: Page, n: string) => page.getByRole('radio', { name: n, exact: true }).check({ force: true });
const next = (page: Page) => page.locator('[data-brief-next]').click();

/** 영역 안에서 모서리가 2px 보다 둥근 요소 — 원 표시(data-mark)와 아래 시트는 뺀다 */
async function roundOnes(area: Locator) {
  return area.evaluate((root) => [...root.querySelectorAll<HTMLElement>('*')]
    .filter((e) => !e.closest('[data-mark]') && e.getBoundingClientRect().width > 0)
    .filter((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius) > 2)
    .map((e) => `${e.tagName}.${e.className}`));
}
const NAVY = 'rgb(31, 36, 71)';

async function seed(page: Page, answers: object, step: string, done = false) {
  await page.goto('/tools/brief');
  await expect(page.locator('[data-brief] h1')).toBeVisible();
  await page.evaluate(([an, st, dn]) => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, ...(an as object) }, step: st, done: dn })), [answers, step, done] as const);
  await page.reload();
}

test.describe('요청서 질문 화면', () => {
  test('하나 고르기: 괘선 줄, 글자가 질문 제목과 같은 왼쪽 선, 고르면 바탕은 그대로', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();
    await pick(page, '새로 만들기'); await next(page);
    await pick(page, '가게(식당·카페 등)');
    const h1 = (await page.locator('h1').boundingBox())!;
    const row = page.locator('[data-choice]').first();
    const mark = (await row.locator('[data-mark]').boundingBox())!;
    expect(Math.abs(mark.x - h1.x)).toBeLessThanOrEqual(1);
    const bg = await row.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(bg).not.toBe(NAVY);
    await expect(page.locator('[data-choice]:has(input:checked)')).toHaveCount(1);
    expect(await roundOnes(page.locator('[data-brief]'))).toEqual([]);
  });

  test('여러 개 고르기: 각진 칸, 고르면 선·글자만 네이비, 앞에 표시', async ({ page }) => {
    await seed(page, { mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, 'audience');
    const tag = page.locator('[data-tag]').first();
    await tag.click();
    // 테두리 색은 0.15초 동안 바뀐다 — 다 바뀐 뒤에 읽는다
    await expect.poll(() => tag.evaluate((e) => getComputedStyle(e).borderTopColor)).toBe(NAVY);
    const st = await tag.evaluate((e) => { const c = getComputedStyle(e); return [c.backgroundColor, c.borderTopColor, c.borderTopLeftRadius]; });
    expect(st[0]).not.toBe(NAVY);
    expect(parseFloat(st[2])).toBeLessThanOrEqual(2);
    expect(await tag.evaluate((e) => getComputedStyle(e, '::before').content)).toContain('✓');
  });

  test('기능: 배지 대신 캡션, 이어지는 질문은 왼쪽 세로선, 둥근 것 없음', async ({ page }) => {
    await seed(page, { mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, 'features');
    await page.locator('[data-feature="예약 받기"] [data-seg="must"]').click();
    const imp = page.locator('[data-feature="예약 받기"] [data-impact]');
    expect(await imp.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    const follow = page.locator('[data-feature="예약 받기"] [data-follow]');
    expect(await follow.evaluate((e) => getComputedStyle(e).borderLeftColor)).toBe(NAVY);
    expect(await roundOnes(page.locator('[data-brief]'))).toEqual([]);
  });

  test('진행 표시: 디돈 숫자 01 / 04 와 묶음 이름', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();
    const n = page.locator('[data-brief-progress] [data-numeral]');
    await expect(n).toHaveText('01');
    expect(await n.evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/Bodoni/i);
    await expect(page.locator('[data-brief-progress]')).toContainText('어떤 홈페이지');
  });

  test('한글은 낱말 단위로 줄을 바꾼다', async ({ page }) => {
    await page.goto('/tools/brief');
    expect(await page.locator('[data-brief]').evaluate((e) => getComputedStyle(e).wordBreak)).toBe('keep-all');
  });
});

test.describe('요청서 결과', () => {
  test('문서는 상자 없이, 단원마다 디돈 번호가 01부터 차례로', async ({ page }) => {
    await seed(page, { mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기', features: { '예약 받기': 'must' } }, 'when', true);
    const doc = page.locator('[data-brief-doc]');
    expect(await doc.evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe('0px');
    const nums = await doc.locator('[data-numeral]').allTextContents();
    expect(nums).toEqual(nums.map((_, i) => String(i + 1).padStart(2, '0')));
    expect(nums.length).toBeGreaterThan(1);
    expect(await roundOnes(page.locator('[data-brief-result]'))).toEqual([]);
  });

  test('업체 질문의 글자는 문서 항목과 같은 왼쪽 선', async ({ page }, info) => {
    test.skip(info.project.name !== 'w1440');
    await seed(page, { mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, 'when', true);
    const label = (await page.locator('[data-brief-doc] dt').first().boundingBox())!;
    const q = (await page.locator('[data-brief-vendor] li [data-q]').first().boundingBox())!;
    expect(Math.abs(q.x - label.x)).toBeLessThanOrEqual(1);
  });
});

test.describe('문의 서랍', () => {
  test('무엇이 필요하세요: 괘선 줄과 원 표시, 고르면 바탕 그대로, 단계 번호는 디돈', async ({ page }) => {
    await page.goto('/projects');
    await page.click('header [data-open-drawer]');
    const drawer = page.locator('[data-drawer]');
    await expect(drawer.locator('[data-numeral]').first()).toHaveText('01');
    await drawer.locator('[data-choice]', { hasText: '새로 만들고 싶어요' }).click();   // 사람처럼 줄을 누른다
    await expect(drawer.getByRole('radio', { name: '새로 만들고 싶어요' })).toBeChecked();
    const row = drawer.locator('[data-choice]:has(input:checked)');
    await expect(row).toHaveCount(1);
    expect(await row.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(NAVY);
    const shapes = await roundOnes(drawer.locator('form'));
    expect(shapes).toEqual([]);
  });
});
