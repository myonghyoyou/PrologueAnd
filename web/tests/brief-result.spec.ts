import { test, expect, type Page } from '@playwright/test';

/** 질문을 다 거쳐 결과까지 — 예약(네이버)·소개 글 작성을 맡긴 카페 */
async function finish(page: Page) {
  const pick = (n: string) => page.getByRole('radio', { name: n, exact: true }).check({ force: true });
  const next = () => page.locator('[data-brief-next]').click();
  await page.goto('/tools/brief');
  await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
  await pick('새로 만들기'); await next();
  await pick('가게(식당·카페 등)'); await page.locator('[data-brief-name]').fill('가람 로스터리'); await next();
  await pick('찾아오기'); await next();
  await next(); await next();
  await page.locator('[data-feature="예약 받기"] [data-seg="must"]').click(); await pick('네이버 예약 연결'); await next();
  await next();
  await pick('써 주길 원함'); await next();
  for (let i = 0; i < 6; i++) await next();
  await expect(page.locator('[data-brief-result]')).toBeVisible();
}

test.describe('결과', () => {
  test('요청서·영향·질문·비교표·안내가 순서대로', async ({ page }) => {
    await finish(page);
    await expect(page.locator('[data-brief-doc] h1')).toHaveText('홈페이지 제작 요청서 · 가람 로스터리');
    await expect(page.locator('[data-brief-impact] li')).toHaveCount(2);
    await expect(page.locator('[data-brief-vendor] li').first()).toHaveText('수정은 몇 번까지 포함인가요?');
    await expect(page.locator('[data-brief-compare] tbody tr')).toHaveCount(7);
    await expect(page.locator('[data-brief-privacy]')).toContainText('이 기기에만 저장돼요');
    const order = await page.locator('[data-brief-result] > [data-part]').evaluateAll((els) => els.map((e) => e.getAttribute('data-part')));
    expect(order).toEqual(['impact', 'doc', 'vendor', 'compare', 'export', 'privacy', 'prologue']);   // 견적가 영향을 먼저 본다
  });

  test('처음부터 결과까지 서버로 나가는 요청이 없다', async ({ page }) => {
    const sent: string[] = [];
    page.on('request', (r) => { if (r.resourceType() === 'fetch' || r.resourceType() === 'xhr' || r.method() === 'POST' || r.url().includes('/api/')) sent.push(r.url()); });
    await finish(page);
    await page.locator('[data-brief-compare] input').first().fill('180만 원');
    expect(sent.filter((u) => !u.includes('_next/') && !u.includes('?_rsc'))).toEqual([]);
  });

  test('글자로 복사: 단원 포함, Prologue& 없음', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'w1440');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await finish(page);
    await page.locator('[data-brief-copy]').click();
    await expect(page.locator('[data-brief-copied]')).toHaveText('복사했어요');
    const t = await page.evaluate(() => navigator.clipboard.readText());
    expect(t).toMatch(/\d+\. 기능\r?\n/);   // Windows 클립보드는 줄바꿈을 \r\n 으로 바꾼다
    expect(t).not.toContain('Prologue');
  });

  test('복사가 막히면 글상자로 펼쳐 길게 눌러 복사 안내', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { get: () => undefined }); });
    await finish(page);
    await page.locator('[data-brief-copy]').click();
    await expect(page.locator('[data-brief-copybox]')).toBeVisible();
    await expect(page.locator('[data-brief-copybox-help]')).toHaveText('길게 눌러 복사해 주세요');
  });

  test('인쇄: 단추·비교표·영향·Prologue&·머리글이 안 보이고 요청서·질문은 보인다', async ({ page }) => {
    await finish(page);
    await page.emulateMedia({ media: 'print' });
    for (const sel of ['[data-brief-export]', '[data-brief-compare]', '[data-brief-impact]', '[data-brief-prologue]', 'header', '[data-brief-privacy]'])
      await expect(page.locator(sel).first()).toBeHidden();
    await expect(page.locator('[data-brief-doc]')).toBeVisible();
    await expect(page.locator('[data-brief-vendor]')).toBeVisible();
    await expect(page.locator('[data-brief-vendor] [data-print-only]')).toBeVisible();
    const top = await page.locator('[data-brief-doc] h1').evaluate((h) => h.getBoundingClientRect().top);
    expect(top).toBeLessThan(80);
  });

  test('답 고치기 → 그 질문 → 결과로 돌아가기', async ({ page }) => {
    await finish(page);
    await page.locator('[data-edit="features"]').click();
    await expect(page.locator('h1')).toHaveText('홈페이지에 어떤 기능이 필요하세요?');
    await page.locator('[data-brief-next]').click();
    await expect(page.locator('[data-brief-result]')).toBeVisible();
  });

  test('모두 지우기: 확인 후 시작 화면, 저장 비움', async ({ page }) => {
    await finish(page);
    page.once('dialog', (d) => d.accept());
    await page.locator('[data-brief-reset]').click();
    await expect(page.locator('h1')).toHaveText('홈페이지 요청서 만들기');
    // 시작 화면에서는 저장하지 않으므로 두 키 모두 비어 있다
    expect(await page.evaluate(() => [localStorage.getItem('prologue.brief.v1'), localStorage.getItem('prologue.brief.compare.v1')])).toEqual([null, null]);
  });

  test('비교표는 새로고침해도 남고 요청서에는 없다', async ({ page }) => {
    await finish(page);
    await page.locator('[data-brief-compare] input').first().fill('180만 원');
    await page.reload();
    await expect(page.locator('[data-brief-compare] input').first()).toHaveValue('180만 원');
    await expect(page.locator('[data-brief-doc]')).not.toContainText('180만 원');
  });

  test('폰: 결과 화면 가로 스크롤 없음(표 상자 안은 예외)', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone');
    await finish(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe('최종 검토 보완 — 결과', () => {
  async function seedDone(page: Page) {
    await page.goto('/tools/brief');
    await expect(page.locator('[data-brief] h1')).toBeVisible();
    await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: true })));
    await page.reload();
  }
  test('인쇄 쪽 여백 0 — 브라우저가 머리글·바닥글(제목·주소)을 찍지 않게', async ({ page }) => {
    await seedDone(page);
    const m = await page.evaluate(() => { for (const sh of Array.from(document.styleSheets)) { try { for (const r of Array.from(sh.cssRules)) { const inner = r instanceof CSSMediaRule ? Array.from(r.cssRules) : [r]; for (const x of inner) if (x instanceof CSSPageRule) return x.style.margin; } } catch { /* 다른 출처 */ } } return null; });
    expect(m).toBe('0px');
  });
  test('복사 글상자가 뜬 뒤에도 비교표에 글을 칠 수 있다', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { get: () => undefined }); });
    await seedDone(page);
    await page.locator('[data-brief-copy]').click();
    await expect(page.locator('[data-brief-copybox]')).toBeVisible();
    const cell = page.locator('[data-brief-compare] input').nth(3);
    await cell.click();
    await page.keyboard.type('180만');
    await expect(cell).toHaveValue('180만');
  });
  test('두 번 보내도 서랍에 요약은 하나', async ({ page }) => {
    await seedDone(page);
    await page.locator('[data-brief-send]').click();
    await expect(page.locator('textarea[name="pain"]')).toHaveValue(/\[요청서 만들기\]/);
    await page.locator('[data-drawer] button[aria-label="닫기"]').click();
    await page.locator('[data-brief-send]').click();
    await expect(page.locator('textarea[name="pain"]')).toBeVisible();
    await page.waitForTimeout(300);   // 서랍은 다음 그림 때 칸을 채운다 — 채운 뒤에 읽는다
    const v = await page.locator('textarea[name="pain"]').inputValue();
    expect(v.split('[요청서 만들기]').length - 1).toBe(1);
  });
});

test.describe('앱 안 브라우저(기기 시험: 인쇄 막힘, 복사·저장 됨)', () => {
  async function seedDone(page: Page) {
    await page.goto('/tools/brief');
    await expect(page.locator('[data-brief] h1')).toBeVisible();
    await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: true })));
    await page.reload();
  }
  test('쓰레드 앱: 인쇄 대신 복사가 주 단추, 다른 브라우저 안내', async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone) AppleWebKit Barcelona 289.0' });
    const page = await ctx.newPage();
    await seedDone(page);
    await expect(page.locator('[data-brief-print]')).toHaveCount(0);
    await expect(page.locator('[data-brief-inapp]')).toContainText('Safari나 Chrome');
    await ctx.close();
  });
  test('목록에 없는 앱에서 인쇄 창이 안 뜨면 안내와 복사 글상자', async ({ page }) => {
    await page.addInitScript(() => { window.print = () => {}; Object.defineProperty(navigator, 'clipboard', { get: () => undefined }); });
    await seedDone(page);
    await page.locator('[data-brief-print]').click();
    await expect(page.locator('[data-brief-print-failed]')).toContainText('Safari나 Chrome');
    await expect(page.locator('[data-brief-copybox]')).toBeVisible();
  });
  test('시험 페이지는 지워졌다', async ({ request }) => {
    expect((await request.get('/tools/print-test')).status()).toBe(404);
  });
});

test('업체 제안 항목의 「고치기」로 그 질문에 갔다가 결과로 돌아온다', async ({ page }) => {
  await page.goto('/tools/brief');
  await expect(page.locator('[data-brief] h1')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: true })));
  await page.reload();
  await expect(page.locator('[data-brief-doc]')).not.toContainText('업체 제안 받기');   // 단원 제목이 말하므로 줄마다 붙이지 않는다
  const row = page.locator('[data-brief-doc] [data-ask-row]', { hasText: '디자인 방식' });
  await row.getByRole('button', { name: '디자인 방식 고치기' }).click();
  await expect(page.locator('h1')).toHaveText('디자인은 어떻게 할까요?');
  await page.locator('[data-choice]', { hasText: '템플릿이어도 괜찮아요' }).click();   // 사람처럼 줄을 누른다
  await page.locator('[data-brief-next]').click();
  await expect(page.locator('[data-brief-result]')).toBeVisible();
  await expect(page.locator('[data-brief-doc] [data-ask-row]', { hasText: '디자인 방식' })).toHaveCount(0);
});
