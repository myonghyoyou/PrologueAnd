import { test, expect } from '@playwright/test';
import { SITE, shouldIndex } from '../lib/site';
import { publishedProjects, allProjects } from '../content';

// 검색 노출 — 대표 주소는 www.prologueand.com(맨 주소는 Vercel 이 www 로 넘긴다). 이름은 "Prologue&", 한글로 "프롤로그엔"

test('대표 주소는 www.prologueand.com', () => {
  expect(SITE).toBe('https://www.prologueand.com');
});

test('검색 허용: 미리보기 배포만 막고, 실제 배포·로컬은 연다', () => {
  expect(shouldIndex('production')).toBe(true);
  expect(shouldIndex(undefined)).toBe(true);
  expect(shouldIndex('preview')).toBe(false);
  expect(shouldIndex('development')).toBe(false);
});

test('robots.txt: 모두 허용하고 sitemap 주소를 알린다', async ({ request }) => {
  const t = await (await request.get('/robots.txt')).text();
  expect(t).toMatch(/User-Agent: \*/i);
  expect(t).toContain('Allow: /');
  expect(t).not.toMatch(/Disallow: \/\s*$/m);
  expect(t).toContain('Sitemap: https://www.prologueand.com/sitemap.xml');
});

test('sitemap.xml: 홈·목록·공개 편만', async ({ request }) => {
  const t = await (await request.get('/sitemap.xml')).text();
  const locs = [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toContain('https://www.prologueand.com');
  expect(locs).toContain('https://www.prologueand.com/projects');
  for (const p of publishedProjects()) expect(locs).toContain(`https://www.prologueand.com/projects/${p.slug}`);
  for (const p of allProjects().filter((x) => !x.published)) expect(locs).not.toContain(`https://www.prologueand.com/projects/${p.slug}`);
});

test('홈 머리: 제목에 Prologue& 와 프롤로그엔, 대표 주소, 공유 미리보기, 검색 제외 없음', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(title).toContain('Prologue&');
  expect(title).toContain('프롤로그엔');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.prologueand.com');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /프롤로그엔/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://www.prologueand.com');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'ko_KR');
  const img = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(img).toMatch(/^https:\/\/www\.prologueand\.com\/opengraph-image/);
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toContain('프롤로그엔');
});

test('홈 구조화 데이터: 이름 Prologue&, 다른 이름 프롤로그엔', async ({ page }) => {
  await page.goto('/');
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(json!) as { '@graph': { '@type': string; name?: string; alternateName?: string[]; url?: string }[] };
  const site = data['@graph'].find((n) => n['@type'] === 'WebSite')!;
  expect(site.name).toBe('Prologue&');
  expect(site.alternateName).toContain('프롤로그엔');
  expect(site.url).toBe('https://www.prologueand.com');
  const org = data['@graph'].find((n) => n['@type'] === 'Organization')!;
  expect(org.alternateName).toContain('프롤로그엔');
});

test('공유 이미지: 1200×630 PNG', async ({ request }) => {
  const r = await request.get('/opengraph-image.png');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toContain('image/png');
  const b = await r.body();
  expect(b.readUInt32BE(16)).toBe(1200);
  expect(b.readUInt32BE(20)).toBe(630);
});

test('상세 머리: 편 제목 · Prologue&, 대표 주소는 그 편', async ({ page }) => {
  const p = publishedProjects()[0];
  await page.goto(`/projects/${p.slug}`);
  expect(await page.title()).toBe(`${p.title} · Prologue&`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.prologueand.com/projects/${p.slug}`);
});

test('바닥글에 한글 이름도 보인다', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('[data-footer]')).toContainText('Prologue& (프롤로그엔)');
});

test('네이버 서치어드바이저 소유 확인 태그', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="naver-site-verification"]')).toHaveAttribute('content', '6e881aee19f6745a7ae49b7038afd67475cf2bf5');
});

test('연락 메일은 hello@prologueand.com — 바닥글 링크와 구조화 데이터', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('[data-footer] a[href^="mailto:"]')).toHaveAttribute('href', 'mailto:hello@prologueand.com');
  await page.goto('/');
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const org = (JSON.parse(json!) as { '@graph': { '@type': string; email?: string }[] })['@graph'].find((n) => n['@type'] === 'Organization')!;
  expect(org.email).toBe('hello@prologueand.com');
  expect(await page.content()).not.toContain('myonghyoyou@gmail.com');
});

test('사이트맵에 요청서 만들기가 있다', async ({ request }) => {
  const t = await (await request.get('/sitemap.xml')).text();
  expect(t).toContain('<loc>https://www.prologueand.com/tools/brief</loc>');
});

test.describe('요청서 영어판 SEO', () => {
  const KO = 'https://www.prologueand.com/tools/brief', EN = 'https://www.prologueand.com/en/tools/brief';
  test('영어 머리: 대표 주소·언어 짝·og 영어·공유 그림·한글 없음·본문 lang="en"', async ({ page }) => {
    await page.goto('/en/tools/brief');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', EN);
    await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute('href', KO);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', EN);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', EN);
    // Next 가 그림 주소 뒤에 해시를 붙인다
    expect(await page.locator('meta[property="og:image"]').first().getAttribute('content')).toContain('/en/tools/brief/opengraph-image');
    const heads = await page.locator('meta[property^="og:"], meta[name^="twitter:"]').evaluateAll((els) => els.map((e) => `${e.getAttribute('property') ?? e.getAttribute('name')}=${e.getAttribute('content')}`));
    expect(heads.length).toBeGreaterThan(5);
    expect(heads.filter((h) => /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(h))).toEqual([]);
    await expect(page.locator('main[lang="en"]')).toHaveCount(1);
  });
  test('한국어 요청서도 언어 짝을 알린다', async ({ page }) => {
    await page.goto('/tools/brief');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', KO);
    await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute('href', KO);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', EN);
  });
  test('영어 공유 그림: 1200×630 PNG', async ({ page, request }) => {
    await page.goto('/en/tools/brief');
    const img = new URL((await page.locator('meta[property="og:image"]').first().getAttribute('content'))!);
    const r = await request.get(img.pathname + img.search);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('image/png');
    const b = await r.body();
    expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([1200, 630]);
  });
  test('사이트맵: 두 주소와 각각의 언어 짝(xhtml:link)', async ({ request }) => {
    const t = await (await request.get('/sitemap.xml')).text();
    for (const loc of [KO, EN]) {
      const url = [...t.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]).find((u) => u.includes(`<loc>${loc}</loc>`));
      expect(url, loc).toBeTruthy();
      expect(url).toContain(`<xhtml:link rel="alternate" hreflang="ko" href="${KO}"`);
      expect(url).toContain(`<xhtml:link rel="alternate" hreflang="en" href="${EN}"`);
    }
  });
});
