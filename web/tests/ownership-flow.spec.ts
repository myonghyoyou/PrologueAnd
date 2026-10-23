import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** 권한 점검 화면 — 외부 공개 조회는 고정 응답으로 바꿔 끼운다(실제 서비스에 기대지 않는다) */

const FX = (f: string) => readFileSync(join(__dirname, 'fixtures', 'ownership', f), 'utf8');
type Rule = { match: string; status?: number; file?: string; body?: string; hang?: boolean };
const LOOKUP_HOST = /(^|\.)(rdap\.[\w.-]+|cloudflare-dns\.com|dns\.google|pubapi\.registry\.google)$/;
export const DEFAULT: Rule[] = [
  { match: 'rdap.verisign.com', file: 'rdap-com.json' },
  { match: 'type=NS', file: 'doh-ns.json' }, { match: 'type=MX', file: 'doh-mx.json' },
  { match: 'type=A&', file: 'doh-a.json' }, { match: 'type=CNAME', file: 'doh-cname.json' },
];

/** 다른 출처 요청이라 브라우저가 CORS 를 검사한다 — 고정 응답에도 허용 헤더를 붙인다 */
export async function routeLookups(page: Page, rules: Rule[], hold?: { release: Promise<void> }) {
  await page.route((u) => LOOKUP_HOST.test(u.hostname), async (route) => {
    const url = route.request().url();
    const r = rules.find((x) => url.includes(x.match));
    if (r?.hang) return;                                           // 응답하지 않는다
    if (hold && url.includes('aaa-test.com')) await hold.release;
    await route.fulfill({
      status: r?.status ?? (r ? 200 : 404),
      headers: { 'access-control-allow-origin': '*', 'content-type': url.includes('rdap') ? 'application/rdap+json' : 'application/json' },
      body: r?.body ?? (r?.file ? FX(r.file) : '{}'),
    });
  });
}

export async function start(page: Page, domain: string, path = '/tools/ownership') {
  await page.clock.setFixedTime(new Date('2026-10-23T10:00:00+09:00'));
  await page.goto(path);
  await expect(page.locator('[data-own] h1')).toBeVisible();
  await page.locator('[data-own-input]').fill(domain);
  await page.locator('[data-own-submit]').click();
}

/** 질문마다 첫 선택지를 고르고 다음 — 결과가 나올 때까지 */
export async function answerAllFirst(page: Page) {
  for (let i = 0; i < 20; i++) {
    if (await page.locator('[data-own-result]').isVisible()) return;
    await page.locator('[data-own-q] [data-choice]').first().click();
    await page.locator('[data-own-next]').click();
  }
  throw new Error('결과에 닿지 못함');
}

test.describe('권한 점검 흐름(한국어)', () => {
  test('주소 → 조회 결과 → 질문 → 결과', async ({ page }) => {
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com');
    const lk = page.locator('[data-own-lookup]');
    await expect(lk).toBeVisible();
    for (const r of ['expiry', 'registrar', 'dns', 'mail']) await expect(lk.locator(`[data-own-lookup-row="${r}"]`)).toBeVisible();
    await expect(lk.locator('[data-own-lookup-row="registrant"]')).toHaveCount(0);
    await expect(lk.locator('[data-own-lookup-row="registrar"]')).toContainText('Name.com');
    await expect(lk.locator('[data-own-lookup-row="mail"]')).toContainText('Google Workspace');
    await page.locator('[data-own-next]').click();
    await expect(page.locator('[data-own-q="registrarLogin"] h1')).toContainText('Name.com');
    await answerAllFirst(page);
    await expect(page.locator('[data-own-headline]')).toHaveText('업체와 연락이 끊겨도 직접 운영할 수 있어요');
    await expect(page.locator('[data-own-item][data-state="risk"]')).toHaveCount(0);
  });

  test('하위 주소를 넣으면 잘라서 점검한다고 알린다', async ({ page }) => {
    await routeLookups(page, DEFAULT);
    await start(page, 'blog.prologueand.com');
    await expect(page.locator('[data-own-trimmed]')).toContainText('prologueand.com 기준으로 점검해요');
  });

  test('네임서버가 대행자와 같은 회사면 DNS 질문이 없다', async ({ page }) => {
    const ns = JSON.stringify({ Status: 0, Answer: [{ name: 'prologueand.com', type: 2, data: 'ns1.name.com.' }] });
    await routeLookups(page, [{ match: 'type=NS', body: ns }, ...DEFAULT]);
    await start(page, 'prologueand.com');
    await page.locator('[data-own-next]').click();
    await answerAllFirst(page);
    await page.locator('[data-own-edit]').click();
    await expect(page.locator('[data-own-q="dnsLogin"]')).toHaveCount(0);
  });

  test('RDAP 404면 입력 화면에 머문다', async ({ page }) => {
    await routeLookups(page, [{ match: 'rdap.verisign.com', status: 404 }, ...DEFAULT]);
    await start(page, 'nothere-test.com');
    await expect(page.locator('[data-own-error]')).toHaveText('등록된 도메인이 아니에요. 주소를 다시 확인해 주세요');
    await expect(page.locator('[data-own-lookup]')).toHaveCount(0);
  });

  test('조회가 모두 응답하지 않아도 7초 안에 질문으로 넘어갈 수 있다', async ({ page }) => {
    test.setTimeout(30_000);
    await routeLookups(page, [{ match: 'http', hang: true }]);
    await start(page, 'prologueand.com');
    await expect(page.locator('[data-own-lookup]')).toContainText('일부는 자동으로 확인하지 못했어요', { timeout: 7_500 });
    await page.locator('[data-own-next]').click();
    await expect(page.locator('[data-own-q="registrarLogin"] h1')).toHaveText('도메인을 산 곳(등록대행자) 사이트에 직접 로그인할 수 있나요?');
  });

  test('다시 조회: 실패 뒤 응답이 돌아오면 결과가 채워진다', async ({ page }) => {
    let fail = true;
    await page.route((u) => LOOKUP_HOST.test(u.hostname), async (route) => {
      const url = route.request().url();
      if (fail) return route.fulfill({ status: 500, headers: { 'access-control-allow-origin': '*' }, body: '' });
      const r = DEFAULT.find((x) => url.includes(x.match));
      await route.fulfill({ status: r ? 200 : 404, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: r?.file ? FX(r.file) : '{}' });
    });
    await start(page, 'prologueand.com');
    await expect(page.locator('[data-own-retry]')).toBeVisible();
    await expect(page.locator('[data-own-lookup-row="expiry"]')).toHaveCount(0);
    fail = false;
    await page.locator('[data-own-retry]').click();
    await expect(page.locator('[data-own-lookup-row="expiry"]')).toBeVisible();
  });

  test('늦게 온 옛 조회 결과는 버린다', async ({ page }) => {
    let release!: () => void;
    const hold = { release: new Promise<void>((r) => { release = r; }) };
    await routeLookups(page, [{ match: 'rdap.verisign.com/com/v1/domain/aaa-test.com', file: 'rdap-com.json' }, ...DEFAULT], hold);
    await start(page, 'aaa-test.com');
    await page.locator('[data-own-input]').fill('prologueand.com');
    await page.locator('[data-own-submit]').click();
    await expect(page.locator('[data-own-lookup]')).toContainText('prologueand.com');
    release();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-own-lookup]')).toContainText('prologueand.com');
    await expect(page.locator('[data-own-lookup]')).not.toContainText('aaa-test.com');
  });

  test('새로고침 뒤 같은 단계·답 복원, 이전으로 가도 답 유지', async ({ page }) => {
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com');
    await page.locator('[data-own-next]').click();
    await page.locator('[data-own-q] [data-choice]').nth(1).click();          // 등록대행자: 아니요
    await page.locator('[data-own-next]').click();
    await expect(page.locator('[data-own-q="dnsLogin"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-own-q="dnsLogin"]')).toBeVisible();
    await page.locator('[data-own-prev]').click();
    await expect(page.locator('[data-own-q="registrarLogin"] input').nth(1)).toBeChecked();
  });

  test('전송 감시: 사이트로 가는 요청 0건, 외부는 조회 주소만, 답이 실리지 않음', async ({ page }) => {
    const site: string[] = [], ext: { url: string; post: string | null }[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.host === '127.0.0.1:3110' || u.host === '127.0.0.1:3100') {
        if ((r.resourceType() === 'fetch' || r.resourceType() === 'xhr' || r.method() === 'POST') && !u.pathname.startsWith('/_next/') && !u.search.includes('_rsc')) site.push(r.url());
        if (u.pathname.startsWith('/api/')) site.push(r.url());
      } else ext.push({ url: r.url(), post: r.postData() });
    });
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com');
    await page.locator('[data-own-next]').click();
    await answerAllFirst(page);
    expect(site).toEqual([]);
    expect(ext.length).toBeGreaterThan(0);
    for (const e of ext) {
      expect(new URL(e.url).hostname).toMatch(LOOKUP_HOST);
      expect(e.post).toBeNull();
      expect(e.url).not.toMatch(/registrarLogin|mine|vendor|answers/);
    }
  });

  test('저장이 막혀도 끝까지 되고 안내가 보인다', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com');
    await expect(page.locator('[data-own-nostore]')).toBeVisible();
    await page.locator('[data-own-next]').click();
    await answerAllFirst(page);
    await expect(page.locator('[data-own-headline]')).toBeVisible();
  });

  test('모두 지우기', async ({ page }) => {
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com');
    await page.locator('[data-own-next]').click();
    await answerAllFirst(page);
    page.once('dialog', (d) => d.accept());
    await page.locator('[data-own-reset]').click();
    await expect(page.locator('[data-own-input]')).toHaveValue('');
    expect(await page.evaluate(() => localStorage.getItem('prologue.ownership.v1'))).toBeNull();
  });

  test('폰 390: 가로 스크롤 없음, 하단 단추가 마지막 선택지를 가리지 않음', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone');
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com');
    await page.locator('[data-own-next]').click();
    await page.locator('[data-own-q] [data-choice]').first().click();
    await page.locator('[data-own-next]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const last = page.locator('[data-own-q] [data-choice]').last();
    await last.scrollIntoViewIfNeeded();
    const lb = (await last.boundingBox())!, bar = (await page.locator('[data-own-bar]').boundingBox())!;
    expect(lb.y + lb.height).toBeLessThanOrEqual(bar.y + 1);
  });
});

test.describe('영어판', () => {
  test('흐름이 끝까지 되고 한글이 한 글자도 없다', async ({ page }) => {
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com', '/en/tools/ownership');
    await expect(page.locator('[data-own-lookup]')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toMatch(/[가-힣]/);
    await page.locator('[data-own-next]').click();
    await expect(page.locator('[data-own-q="registrarLogin"] h1')).toHaveText('Can you log in to Name.com yourself?');
    expect(await page.locator('body').innerText()).not.toMatch(/[가-힣]/);
    await page.locator('[data-own-q] [data-choice]').nth(1).click();
    await page.locator('[data-own-next]').click();
    await answerAllFirst(page);
    expect(await page.locator('body').innerText()).not.toMatch(/[가-힣]/);
    await expect(page.locator('[data-own-message]')).toContainText('registrar account for prologueand.com');
  });
  test('도구 상자 lang="en", hreflang 두 방향, 머리글에 문의 단추 없음, 공유 미리보기 영어', async ({ page }) => {
    await page.goto('/en/tools/ownership');
    await expect(page.locator('[lang="en"] [data-own]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute('href', /\/tools\/ownership$/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/tools\/ownership$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.prologueand.com/en/tools/ownership');
    await expect(page.locator('header [data-open-drawer]')).toHaveCount(0);
    for (const sel of ['meta[property="og:title"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]', 'meta[name="description"]']) {
      expect(await page.locator(sel).getAttribute('content'), sel).not.toMatch(/[가-힣]/);
    }
    await page.goto('/tools/ownership');
    await expect(page.locator('header [data-open-drawer]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.prologueand.com/tools/ownership');
  });
  test('한국어에서 답한 뒤 영어판을 열면 같은 답이 영어로', async ({ page }) => {
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com');
    await page.locator('[data-own-next]').click();
    await page.locator('[data-own-q] [data-choice]').nth(1).click();
    await page.locator('[data-own-next]').click();
    await page.goto('/en/tools/ownership');
    await page.locator('[data-own-prev]').click();
    await expect(page.locator('[data-own-q="registrarLogin"] input').nth(1)).toBeChecked();
    await expect(page.locator('[data-own-q="registrarLogin"] [data-choice]').nth(1)).toContainText('No, my web company handles it');
  });
  test('영어판에는 요청서 연결 줄이 없다', async ({ page }) => {
    await routeLookups(page, DEFAULT);
    await start(page, 'prologueand.com', '/en/tools/ownership');
    await page.locator('[data-own-next]').click();
    await answerAllFirst(page);
    await expect(page.locator('[data-own-to-brief]')).toHaveCount(0);
  });
  test('지원 안 되는 국가 도메인은 질문만으로', async ({ page }) => {
    const rdap: string[] = [];
    page.on('request', (r) => { if (r.url().includes('rdap')) rdap.push(r.url()); });
    await routeLookups(page, DEFAULT);
    await start(page, 'tienda.es', '/en/tools/ownership');
    await expect(page.locator('[data-own-lookup]')).toContainText("This kind of address can't be checked automatically");
    expect(rdap).toEqual([]);
    await page.locator('[data-own-next]').click();
    await expect(page.locator('[data-own-q="registrarLogin"] h1')).toHaveText('Can you log in to the company where you bought your domain (your registrar)?');
  });
  test('언어 바꾸기 링크', async ({ page }) => {
    await page.goto('/tools/ownership');
    await expect(page.locator('[data-own-lang]')).toHaveAttribute('href', '/en/tools/ownership');
    await page.goto('/en/tools/ownership');
    await expect(page.locator('[data-own-lang]')).toHaveAttribute('href', '/tools/ownership');
  });
});

async function toResultWithRisk(page: Page, path = '/tools/ownership') {
  await routeLookups(page, DEFAULT);
  await start(page, 'prologueand.com', path);
  await page.locator('[data-own-next]').click();
  await page.locator('[data-own-q] [data-choice]').nth(1).click();     // 등록대행자: 아니요 → 위험
  await page.locator('[data-own-next]').click();
  await answerAllFirst(page);
}

test.describe('내보내기', () => {
  test('요청 문구 복사: 위험·확인 필요만, Prologue 없음', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'w1440');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await toResultWithRisk(page);
    await page.locator('[data-own-copy]').click();
    await expect(page.locator('[data-own-copied]')).toContainText('복사했어요');
    const t = await page.evaluate(() => navigator.clipboard.readText());
    expect(t).toMatch(/^안녕하세요\./);
    expect(t).toMatch(/1\. 도메인\(prologueand\.com\) 등록대행자 계정/);
    expect(t).not.toContain('영업시간');                                // 안전 항목은 넣지 않는다
    expect(t).not.toContain('Prologue');
  });
  test('복사가 막히면 글상자', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('no')) } }); });
    await toResultWithRisk(page);
    await page.locator('[data-own-copy]').click();
    await expect(page.locator('[data-own-copybox] textarea')).toHaveValue(/등록대행자 계정/);
  });
  test('정리표 인쇄: 한 쪽, 정리표만, 비밀번호 칸 빈칸, Prologue 없음', async ({ page }, info) => {
    test.skip(info.project.name !== 'w1440');
    await toResultWithRisk(page);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-own-sheet]')).toBeVisible();
    await expect(page.locator('[data-own-headline]')).toBeHidden();
    await expect(page.locator('header')).toBeHidden();
    for (const t of await page.locator('[data-own-sheet] td[data-own-blank]').allInnerTexts()) expect(t.trim()).toBe('');
    expect(await page.locator('[data-own-sheet]').innerText()).not.toContain('Prologue');
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    expect((pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length).toBe(1);
  });
  test('쓰레드 앱 안에서는 사파리·크롬 안내와 주소 복사가 먼저', async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona 450.0.0.31.61' });
    const page = await ctx.newPage();
    await toResultWithRisk(page);
    const note = page.locator('[data-own-inapp]');
    await expect(note).toContainText('사파리나 크롬');
    await expect(page.locator('[data-own-copyurl]')).toBeVisible();
    const a = (await note.boundingBox())!, b = (await page.locator('[data-own-print]').boundingBox())!;
    expect(a.y).toBeLessThan(b.y);
    await ctx.close();
  });
  test('영어판 인쇄에도 한글 없음', async ({ page }, info) => {
    test.skip(info.project.name !== 'w1440');
    await toResultWithRisk(page, '/en/tools/ownership');
    await page.emulateMedia({ media: 'print' });
    expect(await page.locator('[data-own-sheet]').innerText()).not.toMatch(/[가-힣]/);
  });
});
