import { test, expect } from '@playwright/test';
import { bannedWords } from './banned';

// 홈 = 편집형 세로 페이지(P1). 첫 화면 → 일하는 방식 → 할 수 있는 일 → 작업 → 문의. 움직임 없음
test.describe('홈', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('제목 하나, 섹션 순서, 가로 스크롤 없음', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('업무 시스템과홈페이지를만듭니다.');
    expect(await page.locator('[data-sec]').evaluateAll((ns) => ns.map((n) => n.getAttribute('data-sec')))).toEqual(['hero', 'how', 'can', 'work', 'contact']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test('첫 화면: 하는 일 넷에 홈페이지 제작이 있고, 단추가 서랍과 작업으로 간다', async ({ page }) => {
    const hero = page.locator('[data-sec="hero"]');
    await expect(hero.locator('ul li')).toHaveText(['업무 화면 개선', '업무 웹 전환', '맞춤 웹서비스 개발', '홈페이지 제작']);
    // 하는 일 이름은 「할 수 있는 일」 줄로 이어진다
    for (const href of await hero.locator('ul a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) await expect(page.locator(href)).toHaveCount(1);
    await expect(hero.getByRole('link', { name: /작업 보기/ })).toHaveAttribute('href', '#work');
    await hero.getByRole('button', { name: /프로젝트 문의/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-drawer-open', '');
  });

  test('일하는 방식: 세 단계', async ({ page }) => {
    await expect(page.locator('[data-step] h3')).toHaveText(['01문제 파악', '02설계와 개발', '03오픈 후 수정']);
  });

  test('할 수 있는 일: 네 줄이 같은 구조, 관련 작업이 없으면 문의 단추, 관련 작업 링크는 이 페이지의 작업으로', async ({ page }) => {
    await expect(page.locator('[data-can]')).toHaveCount(4);
    await expect(page.locator('[data-can] h3')).toHaveText(['업무 화면 개선', '업무 웹 전환', '맞춤 웹서비스 개발', '홈페이지 제작']);
    for (const row of await page.locator('[data-can]').all()) expect(await row.locator('a, button').count()).toBeGreaterThan(0);
    await page.locator('#s-site').getByRole('button', { name: /이런 작업 문의하기/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-drawer-open', '');
    await page.keyboard.press('Escape');
    for (const href of await page.locator('[data-can] a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
      expect(href).toMatch(/^#w-/);
      await expect(page.locator(href)).toHaveCount(1);
    }
  });

  test('작업: 공개 편 수만큼, 배치가 서로 다르고, 그림마다 설명과 상세 링크가 있다', async ({ page }) => {
    const works = page.locator('[data-work]');
    const n = Number(await page.locator('[data-published]').innerText());
    expect(n).toBeGreaterThan(0);
    await expect(works).toHaveCount(n);
    const layouts = await works.evaluateAll((ws) => ws.map((w) => w.getAttribute('data-layout')));
    expect(new Set(layouts).size).toBe(layouts.length);
    for (const w of await works.all()) {
      const slug = await w.getAttribute('data-work');
      await expect(w.getByRole('link', { name: /자세히 보기/ })).toHaveAttribute('href', `/projects/${slug}`);
      for (const alt of await w.locator('img').evaluateAll((is) => is.map((i) => i.getAttribute('alt') ?? ''))) expect(alt.length).toBeGreaterThan(10);
    }
    await expect(page.locator('[data-sec="work"]').getByRole('link', { name: /Projects 보기/ })).toHaveAttribute('href', '/projects');
  });

  test('문의: 단추가 서랍을 열고, 바닥글에 목록·요청서·메일', async ({ page }) => {
    const c = page.locator('[data-sec="contact"]');
    await c.getByRole('button', { name: /프로젝트 문의하기/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-drawer-open', '');
    await page.keyboard.press('Escape');
    await expect(c.locator('a[href="mailto:hello@prologueand.com"]')).toHaveCount(1);
    await expect(c.locator('[data-footer] a[href="/projects"]')).toHaveCount(1);
    await expect(c.locator('[data-footer] a[href="/tools/brief"]')).toHaveCount(1);
  });

  test('걷어낸 문구와 공개하지 않는 낱말이 없다', async ({ page }) => {
    const text = await page.locator('main').innerText();
    for (const w of ['단순한 제품', '한 팀', '알리기', '쓰면서 고치기', '처음과 끝을 함께', '몰라도 괜찮습니다', 'Digital Transformation', '—', '나머지도 정리되는 대로', 'SELECTED WORK', '시작부터, 그다음까지', '혁신']) expect(text, w).not.toContain(w);
    for (const w of bannedWords() ?? []) expect(text, w).not.toContain(w);
  });


  test('작업: 병원은 같은 자리를 전/후로 자른 비교 셋, 교대 근무표는 글이 그림보다 먼저, 확대 셋', async ({ page }) => {
    const h = page.locator('[data-layout="pair"] [data-compare]');
    await expect(h.locator('[data-detail]')).toHaveCount(6);
    const full = page.locator('[data-layout="full"]');
    const t = (await full.locator('h3').boundingBox())!, img = (await full.locator('img').first().boundingBox())!;
    expect(t.y).toBeLessThan(img.y);
    await expect(full.locator('[data-detail]')).toHaveCount(3);
  });

  test('문제 은행은 테스트 중이라고 적는다', async ({ page }) => {
    await expect(page.locator('[data-work="problem-bank"]')).toContainText('테스트 중');
  });

  test('자른 그림은 틀 안에서 원본의 그 자리만 보인다', async ({ page }) => {
    await page.locator('[data-layout="pair"] [data-compare]').scrollIntoViewIfNeeded();
    const bad = await page.locator('[data-detail]').evaluateAll((fs) => fs.filter((f) => {
      const w = f.querySelector('div > div')!.getBoundingClientRect();
      return w.height < 20 || w.width < 20;
    }).length);
    expect(bad).toBe(0);
  });

  test('헤더 Projects 로 목록에 간다', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });
});

test.describe('홈 — 데스크톱', () => {
  test.skip(({ isMobile }) => !!isMobile, '데스크톱 전용');

  test('계단 선이 첫 점에서 시작해 마지막 점에서 끝난다', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-sec="how"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-step-line] path')).toHaveCount(1);
    const d = await page.evaluate(() => {
      const p = document.querySelector<SVGPathElement>('[data-step-line] path')!, m = p.getScreenCTM()!;
      const at = (l: number) => { const q = p.getPointAtLength(l); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; };
      const dots = [...document.querySelectorAll<HTMLElement>('[data-step-dot]')].map((e) => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
      const a = at(0), z = at(p.getTotalLength()), f = dots[0], l = dots[dots.length - 1];
      return Math.max(Math.hypot(a.x - f.x, a.y - f.y), Math.hypot(z.x - l.x, z.y - l.y));
    });
    expect(d).toBeLessThanOrEqual(2);
  });

  test('헤더 「할 수 있는 일」이 서비스 줄로 간다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header a[href="#can"]')).toBeVisible();
  });

  test('첫 화면이 창 한 장 안에 든다(단추까지)', async ({ page }) => {
    await page.goto('/');
    const b = (await page.locator('[data-sec="hero"]').getByRole('button', { name: /프로젝트 문의/ }).boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  });
});

test.describe('홈 — 폰', () => {
  test.skip(({ isMobile }) => !isMobile, '폰 전용');

  test('계단 선은 숨고, 작업은 그림이 글보다 먼저, 글자가 화면 밖으로 나가지 않는다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-step-line]')).toBeHidden();
    const w = page.locator('[data-layout="phones"]');
    const img = (await w.locator('img').first().boundingBox())!, h = (await w.locator('h3').boundingBox())!;
    expect(img.y).toBeLessThan(h.y);
    const over = await page.locator('main').evaluate((m) => [...m.querySelectorAll('h1,h2,h3,p,li,a,button')]
      .filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5).map((e) => e.textContent));
    expect(over).toEqual([]);
  });
});
