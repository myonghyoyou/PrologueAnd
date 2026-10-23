import { test, expect, type Page } from '@playwright/test';
import { fromKo, seedBrief, hasA4, toEnglishText, RICH, MIN, MAX, MID } from './brief-ko';
import { copyFor } from '../content/brief/copy';
import { OWNERSHIP_EN_PATH } from '../content/brief/links';
import { CONTACT_MAIL } from '../lib/contact';

/** 영어 요청서(/en/tools/brief) — 흐름·한글 없음·내보내기·인쇄(A4·Letter)·머리글·메일 끝 줄·예산·언어 바꾸기·폰·앱 안 브라우저(명세 9절) */
const EN = '/en/tools/brief';
const en = copyFor('en');
const en1 = (v1: Record<string, unknown>) => toEnglishText(fromKo(v1));

async function next(page: Page) { await page.locator('[data-brief-next]').click(); }
async function pick(page: Page, name: string) { await page.getByRole('radio', { name, exact: true }).check({ force: true }); }

/** 보이는 화면 글자와 aria-label·placeholder·title·alt 에서 한글이 든 것 — 언어 바꾸기 링크([lang="ko"])와 숨긴 곳(hidden·inert·aria-hidden)은 뺀다.
 *  innerText 대신 글 마디를 하나씩 훑는다: aria-hidden 은 화면에는 보여서 innerText 로는 뺄 수 없다 */
const hangulIn = (page: Page) => page.evaluate(() => {
  const RE = /[가-힣ㄱ-ㅎㅏ-ㅣ]/, OFF = '[hidden],[inert],[aria-hidden="true"],[lang="ko"]';
  // body 안에서만 올라가며 본다 — <html lang="ko">(루트 레이아웃) 때문에 closest 로는 모든 글이 빠진다
  const off = (el: Element) => { for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) if (e.matches(OFF)) return true; return false; };
  const out: string[] = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    if (!el || !RE.test(n.textContent ?? '') || off(el) || el.closest('script,style,template') || !el.checkVisibility()) continue;
    out.push(n.textContent!.trim());
  }
  for (const el of document.body.querySelectorAll('[aria-label],[placeholder],[title],[alt]')) {
    if (off(el)) continue;
    for (const k of ['aria-label', 'placeholder', 'title', 'alt']) { const v = el.getAttribute(k); if (v && RE.test(v)) out.push(`${k}=${v}`); }
  }
  if (RE.test(document.title)) out.push(`title=${document.title}`);
  return out;
});
async function noHangul(page: Page, where: string) { expect(await hangulIn(page), where).toEqual([]); }

/** 기존 brief-print.spec.ts 와 같은 방법으로 쪽 수를 센다 */
async function pdfPages(page: Page, format: 'A4' | 'Letter') {
  const pdf = await page.pdf({ format, printBackground: true, preferCSSPageSize: true });
  return (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}

/** 시작 → 새로 만들기 → 회사 → 문의 → 나머지는 다음만 눌러 결과까지 */
async function walkToResult(page: Page) {
  await page.locator('[data-brief-start]').click();
  await pick(page, en.q.mode.opts.new); await next(page);
  await pick(page, en.q.kind.opts.office); await next(page);
  await pick(page, en.q.goal.opts.inquire); await next(page);
  for (let i = 0; i < 20 && !(await page.locator('[data-brief-result]').isVisible()); i++) await next(page);
  await expect(page.locator('[data-brief-result]')).toBeVisible();
}

test('흐름: 처음부터 결과까지(필수 미응답 막힘·새로고침 복원)', async ({ page }) => {
  await page.goto(EN);
  await page.locator('[data-brief-start]').click();
  await pick(page, en.q.mode.opts.new); await next(page);
  await expect(page.locator('h1')).toHaveText(en.q.kind.title);
  await next(page);
  await expect(page.locator('[data-brief-error]')).toBeVisible();
  await expect(page.locator('[data-brief-error]')).toHaveText(en.ui.required);
  await expect(page.locator('h1')).toHaveText(en.q.kind.title);
  await pick(page, en.q.kind.opts.office); await page.locator('[data-brief-name]').fill('Test Studio'); await next(page);
  await expect(page.locator('h1')).toHaveText(en.q.goal.title);
  await pick(page, en.q.goal.opts.inquire); await next(page);
  for (let i = 0; i < 20 && !(await page.locator('[data-brief-result]').isVisible()); i++) await next(page);
  await expect(page.locator('[data-brief-doc] h1')).toHaveText('Website brief · Test Studio');
  await page.reload();
  await expect(page.locator('[data-brief-doc] h1')).toHaveText('Website brief · Test Studio');
  await expect(page.locator('[data-brief-doc]')).toContainText(en.q.kind.opts.office);
});

test('한글 없음: 시작·질문 3개·달력 연 상태·미리보기 시트·결과', async ({ page }, info) => {
  await page.goto(EN);
  await expect(page.locator('[data-brief-intro]')).toBeVisible();
  await noHangul(page, '시작 화면');
  await page.locator('[data-brief-start]').click();
  await expect(page.locator('h1')).toHaveText(en.q.mode.title);
  await noHangul(page, '질문: mode');
  await pick(page, en.q.mode.opts.new); await next(page);
  await next(page);   // 필수를 비워 오류 줄까지 띄운 채로 본다
  await expect(page.locator('[data-brief-error]')).toBeVisible();
  await noHangul(page, '질문: kind(오류 줄)');
  // 기능 단계 — 예약을 고르면 이어 질문과 견적가 영향 안내가 펼쳐진다
  await seedBrief(page, en1({ mode: 'new', kind: '가게(식당·카페 등)', goalMain: '예약하기', audience: ['외국인'] }), 'features', false, EN);
  await page.locator('[data-feature="booking"] [data-seg="must"]').click();
  await expect(page.locator('[data-feature="booking"] [data-impact-why]')).toBeVisible();
  await noHangul(page, '질문: features');
  await seedBrief(page, en1(RICH), 'when', false, EN);
  await page.locator('[data-date-field] button').click();
  await expect(page.locator('.react-datepicker')).toBeVisible();
  await noHangul(page, '질문: when(달력 열림)');
  await page.keyboard.press('Escape');
  await expect(page.locator('.react-datepicker')).toBeHidden();
  if (info.project.name === 'phone') {
    await page.locator('[data-brief-preview-open]').click();
    await expect(page.locator(`[role="dialog"][aria-label="${en.ui.preview}"]`)).toBeVisible();
    await noHangul(page, '미리보기 시트');
  }
  await seedBrief(page, en1(RICH), 'when', true, EN);
  await expect(page.locator('[data-brief-result]')).toBeVisible();
  await noHangul(page, '결과');
});

test('한글 없음: 복사 글·인쇄 미디어', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'w1440');   // 클립보드·인쇄는 화면 크기와 무관 — 한 번만
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await seedBrief(page, en1(MAX), 'when', true, EN);
  await page.locator('[data-brief-copy]').click();
  await expect(page.locator('[data-brief-copied]')).toHaveText(en.result.copied);
  const t = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');   // Windows 클립보드는 줄바꿈을 \r\n 으로 바꾼다
  expect(t).not.toMatch(/[가-힣ㄱ-ㅎㅏ-ㅣ]/);
  expect(t).not.toContain('Prologue');
  expect(t.length).toBeLessThanOrEqual(2000);   // 명세 9-7
  expect(t).toContain('Website brief · Sample Bakery');
  await page.emulateMedia({ media: 'print' });
  await noHangul(page, '인쇄 미디어');
});

// 옮긴 말(대개 더 길다)과 한국어와 같은 글자 수(짧은 영어 답) 두 가지 — 짧은 답일수록 printZoom 이 덜 줄여 Letter 에서 넘치기 쉽다
for (const sameLength of [false, true]) for (const [name, set] of [['RICH', RICH], ['MIN', MIN], ['MAX', MAX], ['MID', MID]] as const) {
  test(`인쇄: A4·Letter 한 쪽 — ${name}${sameLength ? '(같은 글자 수)' : ''}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'w1440');   // PDF 는 화면 크기와 무관 — 한 번만
    await seedBrief(page, toEnglishText(fromKo(set), { sameLength }), 'when', true, EN);
    await expect(page.locator('[data-brief-doc]')).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    for (const sel of ['[data-brief-prologue]', '[data-brief-compare]', '[data-brief-export]']) await expect(page.locator(sel), sel).toBeHidden();
    await expect(page.locator('[data-brief-doc]')).toBeVisible();
    expect(await pdfPages(page, 'A4'), 'A4').toBe(1);
    expect(await pdfPages(page, 'Letter'), 'Letter').toBe(1);
  });
}

test('한국어판에서 화면 전환으로 들어와도 Letter 한 장', async ({ page }, info) => {
  test.skip(info.project.name !== 'w1440');
  await page.goto('/tools/brief');
  expect(await hasA4(page)).toBe(true);   // 한국어판은 A4 — 이 규칙이 영어판까지 따라오면 안 된다
  await page.locator('[data-brief-lang]').click();
  await expect(page).toHaveURL(new RegExp(`${EN}$`));
  await expect(page.locator('[data-brief-intro] h1')).toHaveText(en.intro.title);
  await walkToResult(page);
  expect(await hasA4(page)).toBe(false);
  await page.emulateMedia({ media: 'print' });
  expect(await pdfPages(page, 'Letter')).toBe(1);
});

test('머리글: 문의 단추 없음, 브랜드는 있음', async ({ page }) => {
  await page.goto(EN);
  await expect(page.locator('header [data-open-drawer]')).toHaveCount(0);
  await expect(page.locator('header [data-brand]')).toHaveCount(1);
  await page.goto('/tools/brief');
  await expect(page.locator('header [data-open-drawer]')).toHaveCount(1);   // 한국어판은 그대로
});

test('끝 줄: 메일 앱 열기, 서랍 안 열림, 요청 0건', async ({ page }) => {
  const sent: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    const own = u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost');
    if ((own && (r.resourceType() === 'fetch' || r.resourceType() === 'xhr' || r.method() === 'POST')) || u.includes('/api/')) sent.push(`${r.method()} ${u}`);
  });
  await seedBrief(page, en1(MAX), 'when', true, EN);   // 모든 칸에 긴 글 — 그래도 주소가 1,800자 안
  const mail = page.locator('[data-brief-mail]');
  await expect(mail).toBeVisible();
  const href = (await mail.getAttribute('href'))!;
  expect(href.startsWith(`mailto:${CONTACT_MAIL}?subject=`)).toBe(true);
  expect(href.length).toBeLessThanOrEqual(1800);
  const q = new URLSearchParams(href.slice(href.indexOf('?') + 1).replace(/\+/g, '%2B'));
  expect(q.get('subject')).toMatch(/^Website brief · /);
  const body = q.get('body')!.split('\n');
  expect(body[0]).toBe(en.end.kind === 'mail' ? en.end.attachLine : '');
  expect(body.length).toBeGreaterThan(2);   // 첨부 안내 뒤에 요약
  expect(q.get('body')).not.toMatch(/[가-힣ㄱ-ㅎㅏ-ㅣ]/);
  await expect(page.locator('[data-brief-mail-hint]')).toBeVisible();
  await expect(page.locator('[data-brief-mail-note]')).toHaveText(en.end.kind === 'mail' ? en.end.note : '');
  if (OWNERSHIP_EN_PATH === null) await expect(page.locator('[data-brief-to-ownership]')).toHaveCount(0);
  else await expect(page.locator('[data-brief-to-ownership]')).toHaveAttribute('href', OWNERSHIP_EN_PATH);
  // 화면 없는 Chromium 은 mailto: 를 바깥 프로그램으로 열려다 이동 오류를 낸다 — 링크로 가는 누름만 기록하고 막는다
  await page.evaluate(() => {
    const w = window as unknown as { __mailClicked?: boolean; __inquiry?: boolean };
    document.addEventListener('click', (e) => { if ((e.target as Element).closest('[data-brief-mail]')) { e.preventDefault(); w.__mailClicked = true; } }, true);
    document.addEventListener('inquiry:open', () => { w.__inquiry = true; });
  });
  await mail.click();
  await page.waitForTimeout(300);
  const flags = await page.evaluate(() => { const w = window as unknown as { __mailClicked?: boolean; __inquiry?: boolean }; return [w.__mailClicked ?? false, w.__inquiry ?? false]; });
  expect(flags).toEqual([true, false]);
  expect(new URL(page.url()).pathname).toBe(EN);
  await expect(page.locator('[data-drawer]')).toBeHidden();
  expect(sent.filter((u) => !u.includes('_next/') && !u.includes('?_rsc'))).toEqual([]);
});

test('예산: 글칸, 넣기 켜면 요청서에', async ({ page }) => {
  await seedBrief(page, en1(MIN), 'when', false, EN);
  await page.getByLabel(en.q.when.budget.label).fill('$3,000');
  await page.locator('[data-brief-budget-in]').check({ force: true });
  await next(page);
  await expect(page.locator('[data-brief-doc]')).toContainText('$3,000');
  await page.locator('[data-edit="when"]').first().click();
  await page.locator('[data-brief-budget-in]').uncheck({ force: true });
  await next(page);
  await expect(page.locator('[data-brief-result]')).toBeVisible();
  await expect(page.locator('[data-brief-doc]')).not.toContainText('$3,000');
  // 한국어판에서 고른 구간은 영어 요청서에 나오지 않는다(명세 9-8)
  await seedBrief(page, fromKo({ ...MIN, budget: '300~800만 원', budgetInBrief: true }), 'when', true, EN);
  await expect(page.locator('[data-brief-doc]')).toBeVisible();
  expect(await page.locator('[data-brief-doc] h2').allTextContents()).not.toContain(en.doc.sections.budget);
  await expect(page.locator('[data-brief-doc]')).not.toContainText('만 원');
});

test('언어 바꾸기: 한국어판 답이 영어로', async ({ page }) => {
  const shop = { mode: 'new', kind: '가게(식당·카페 등)', goalMain: '찾아오기', features: { '예약 받기': 'must', '외국어 페이지': 'later' }, booking: '네이버 예약 연결', langs: ['일본어'] };
  await seedBrief(page, fromKo(shop), 'when', true, '/tools/brief');
  await expect(page.locator('[data-brief-doc]')).toContainText('예약 받기');
  await page.goto(EN);
  const doc = page.locator('[data-brief-doc]');
  await expect(doc).toContainText(en.q.features.opts.booking);
  await expect(doc).toContainText('Japanese');
  await expect(doc).toContainText(en.q.kind.opts.shop);
  // 영어판에서 kind 를 바꾸면 한국어판에도 바뀐 kind 가 한국어로
  await page.locator('[data-edit="kind"]').click();
  await pick(page, en.q.kind.opts.office);
  await next(page);
  await expect(doc).toContainText(en.q.kind.opts.office);
  await page.goto('/tools/brief');
  await expect(page.locator('[data-brief-doc]')).toContainText(copyFor('ko').q.kind.opts.office);
  await expect(page.locator('[data-brief-doc]')).not.toContainText(copyFor('ko').q.kind.opts.shop);
});

test('언어 바꾸기: v1 답이 있는 채로 영어판을 먼저 열어도 이어진다', async ({ page }) => {
  await page.goto(EN);
  await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'audience', done: false })));
  await page.reload();
  await expect(page.locator('[data-brief-intro]')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText(en.q.audience.title);
  const keys = await page.evaluate(() => [localStorage.getItem('prologue.brief.v1'), localStorage.getItem('prologue.brief.v2')]);
  expect(keys[0]).toBeNull();
  expect(keys[1]).not.toBeNull();
  await page.locator('[data-brief-prev]').click();
  await expect(page.getByRole('radio', { name: en.q.goal.opts.inquire, exact: true })).toBeChecked();
});

test('비교표 예·아니오가 언어를 따라간다', async ({ page }) => {
  await seedBrief(page, fromKo(MIN), 'when', true, '/tools/brief');
  const ko = page.locator('[data-brief-compare] [data-yn]').first();
  await ko.click(); await expect(ko).toHaveText('예');
  await page.goto(EN);
  await expect(page.locator('[data-brief-compare] [data-yn]').first()).toHaveText(en.result.yn.yes);
});

test('폰 390: 가로 스크롤 없음, 하단 단추가 마지막 선택지를 가리지 않음', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone');
  await page.goto(EN);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.locator('[data-brief-start]').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await pick(page, en.q.mode.opts.new); await next(page);
  const last = page.getByRole('radio', { name: en.q.kind.opts.other, exact: true }).locator('xpath=..');
  await last.scrollIntoViewIfNeeded();
  const lb = (await last.boundingBox())!, bar = (await page.locator('[data-brief-bar]').boundingBox())!;
  expect(lb.y + lb.height).toBeLessThanOrEqual(bar.y + 1);
  await seedBrief(page, en1(MAX), 'when', true, EN);   // 결과 화면도(표 상자 안은 예외)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('앱 안 브라우저(쓰레드 사용자 에이전트)', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone) AppleWebKit Barcelona 289.0' });
  const page = await ctx.newPage();
  await seedBrief(page, en1(MIN), 'when', true, EN);
  await expect(page.locator('[data-brief-print]')).toHaveCount(0);
  await expect(page.locator('[data-brief-export] button').first()).toHaveAttribute('data-brief-copy');
  await expect(page.locator('[data-brief-copy]')).toHaveText(en.result.copy);
  await expect(page.locator('[data-brief-inapp]')).toHaveText(en.result.inAppHint);
  await noHangul(page, '앱 안 브라우저 결과');
  await ctx.close();
});

test('이모지가 40·60자 자리에 걸린 이름이어도 결과 화면이 그려진다', async ({ page }) => {
  for (const name of ['a'.repeat(58) + '\u{1F600}xyz', 'a'.repeat(39) + '\u{1F600}xyz']) {
    await seedBrief(page, { ...fromKo(MIN), name }, 'when', true, EN);
    await expect(page.locator('[data-brief-doc] h1')).toBeVisible();
    expect(await page.locator('[data-brief-mail]').getAttribute('href')).toMatch(/^mailto:/);
  }
});
