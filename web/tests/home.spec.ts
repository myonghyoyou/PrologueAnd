import { test, expect } from '@playwright/test';
import { bannedWords } from './banned';
import { scrollToY } from './helpers';

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


  test('작업: 병원은 전·후 비교 위에 짚은 자리 둘과 그 설명, 교대 근무표는 글이 그림보다 먼저, 확대 하나, 요청 처리는 확대 없음', async ({ page }) => {
    const pair = page.locator('[data-layout="pair"]');
    await expect(pair.locator('[data-ba] [class*="baMark"]')).toHaveCount(2);
    await expect(pair.locator('[data-compare] li')).toHaveCount(3);
    await expect(pair.locator('[data-compare] a')).toHaveAttribute('href', '/projects/hospital-ux');
    await expect(pair.locator('[data-detail]')).toHaveCount(0);
    const full = page.locator('[data-layout="full"]');
    const t = (await full.locator('h3').boundingBox())!, img = (await full.locator('img').first().boundingBox())!;
    expect(t.y).toBeLessThan(img.y);
    await expect(full.locator('[data-detail]')).toHaveCount(1);
    await expect(page.locator('[data-layout="wide"] [data-detail]')).toHaveCount(0);
    // 작업마다 문제 → 설계 판단 → 바꾼 것
    for (const w of await page.locator('[data-work]').all()) await expect(w.locator('dt')).toHaveText(['문제', '설계 판단', '바꾼 것']);
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

  test('잇는 선: 장면마다 맞닿는다 — 낱말 고리, 화면 틀, 밑줄, 서비스 괄호, 작업 그림 넷, 끝까지 내리면 문의 & 가 그려진다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-thread] path').nth(1)).toBeAttached();
    const r = await page.evaluate(() => {
      const p = document.querySelectorAll<SVGPathElement>('[data-thread] path')[1], m = p.getScreenCTM()!, L = p.getTotalLength();   // [0] 은 가늘어지는 시작 획
      const pts = Array.from({ length: 8000 }, (_, i) => { const q = p.getPointAtLength((L * i) / 7999); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
      const near = (x: number, y: number) => Math.min(...pts.map((q) => Math.hypot(q.x - x, q.y - y)));
      const box = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
      const w = box('[data-mark="find"]'), f2 = box('[data-step="2"]'), fix = [...document.querySelector('[data-mark="fix"]')!.getClientRects()].at(-1)!;
      const rows = [...document.querySelectorAll('[data-can]')].map((e) => e.getBoundingClientRect());
      const inside = (b: DOMRect) => pts.some((q) => q.x > b.left + 2 && q.x < b.right - 2 && q.y > b.top + 2 && q.y < b.bottom - 2);
      return {
        loop: [near(w.left - 12, w.top + w.height / 2), near(w.right + 12, w.top + w.height / 2)],
        frame: [near(f2.left, f2.top), near(f2.right, f2.top), near(f2.right, f2.bottom), near(f2.left, f2.bottom)],
        under: near(fix.left + fix.width / 2, fix.bottom + 3),
        brace: pts.filter((q) => q.x < rows[0].left - 10 && q.y > rows[0].top && q.y < rows[3].bottom).length,
        works: ['wide', 'phones', 'pair', 'full'].map((l) => [...document.querySelectorAll(`[data-layout="${l}"] [data-under]`)].every((e) => inside(e.getBoundingClientRect()))),
      };
    });
    for (const d of r.loop) expect(d).toBeLessThanOrEqual(14);          // 「불편한지」 양옆을 지나는 고리
    for (const d of r.frame) expect(d).toBeLessThanOrEqual(1.5);        // 설계와 개발 네 모서리
    expect(r.under).toBeLessThanOrEqual(2);                             // 「확인해서 고칩니다」 밑줄
    expect(r.brace).toBeGreaterThan(100);                               // 서비스 줄 왼쪽 괄호
    expect(r.works).toEqual([true, true, true, true]);                  // 작업 그림마다 뒤로 지나간다
    await expect(page.locator('[data-amp="contact"]')).not.toHaveAttribute('data-drawn', '');
    await scrollToY(page, 1e6);
    await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '', { timeout: 5000 });
  });

  test('머리글 낱말: 화면에 닿기 전엔 흐리고, 지나면 채워진다', async ({ page }) => {
    await page.goto('/');
    const lead = page.locator('[data-sec="how"] [data-fill]');
    await expect(lead.locator('[data-w][data-on]')).toHaveCount(0);
    await lead.evaluate((e) => { const y = e.getBoundingClientRect().top + scrollY - 120; const l = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis; if (l) l.scrollTo(y, { immediate: true }); else scrollTo(0, y); });
    await expect.poll(async () => (await lead.locator('[data-w]').count()) - (await lead.locator('[data-w][data-on]').count())).toBe(0);
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
    await expect(page.locator('[data-thread] path').first()).toBeAttached();
    const w = page.locator('[data-layout="phones"]');
    const img = (await w.locator('img').first().boundingBox())!, h = (await w.locator('h3').boundingBox())!;
    expect(img.y).toBeLessThan(h.y);
    const over = await page.locator('main').evaluate((m) => [...m.querySelectorAll('h1,h2,h3,p,li,a,button')]
      .filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5).map((e) => e.textContent));
    expect(over).toEqual([]);
  });
});

test.describe('홈 — 움직임(P2)', () => {
  test('전·후 비교: 키보드와 값으로 가운데 선이 움직이고, 전 화면은 선 왼쪽만 보인다', async ({ page }) => {
    await page.goto('/');
    const ba = page.locator('[data-ba]'), range = ba.locator('input[type="range"]');
    await expect(range).toHaveAccessibleName(/전·후 비교 위치/);
    await range.focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await expect.poll(() => ba.evaluate((e) => e.style.getPropertyValue('--x'))).toBe('60%');
    await range.fill('20');
    await expect.poll(() => ba.evaluate((e) => e.style.getPropertyValue('--x'))).toBe('20%');
    const r = await ba.evaluate((e) => { const b = e.getBoundingClientRect(), c = e.querySelector<HTMLElement>('[class*="baBefore"]')!; return { w: b.width, clip: getComputedStyle(c).clipPath }; });
    expect(r.clip).toContain('inset');
  });

  test('인트로(?intro): 손대지 않으면 4초 안에 & 로 모이고 제목이 올라오며, 30일 동안 다시 나오지 않는다', async ({ page }) => {
    await page.goto('/?intro');
    const layer = page.locator('[data-intro-layer]');
    await expect(layer).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'on');
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'done', { timeout: 4000 });
    await expect(layer).toHaveCount(0);
    await expect(page.locator('h1 span span').first()).toHaveCSS('transform', /none|matrix\(1, 0, 0, 1, 0, 0\)/, { timeout: 2000 });
    const t = Number(await page.evaluate(() => localStorage.getItem('prologue.intro')));
    expect(Date.now() - t).toBeLessThan(60_000);
  });

  test('인트로: 스크롤(폰은 누르기)이 오면 그 자리에서 끝나고 첫 화면이 바로 완성된다, 페이지는 움직이지 않는다', async ({ page, isMobile }) => {
    await page.goto('/?intro');
    await expect(page.locator('[data-intro-layer]')).toBeVisible();
    await page.waitForTimeout(300);
    if (isMobile) await page.touchscreen.tap(200, 400);
    else { await page.mouse.move(600, 400); await page.mouse.wheel(0, 400); }
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'skip', { timeout: 1000 });
    await expect(page.locator('[data-intro-layer]')).toHaveCount(0);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    // 기다림 없이 완성: 제목 줄이 제자리, 아래 묶음이 보인다
    expect(await page.locator('h1 span span').first().evaluate((e) => getComputedStyle(e).transform)).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
    expect(await page.locator('[data-sec="hero"] [class*="heroFoot"]').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  });

  test('인트로: 건너뛰기를 누르면 바로 끝난다', async ({ page }) => {
    await page.goto('/?intro');
    await page.getByRole('button', { name: '건너뛰기' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'skip');
    await expect(page.locator('[data-intro-layer]')).toHaveCount(0);
    await page.locator('[data-sec="hero"]').getByRole('button', { name: /프로젝트 문의/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-drawer-open', '');
  });

  test('두 화면 전환: 요청 처리와 근무표가 실제 두 화면을 단추로 바꿔 보이고, 캡션이 따라 바뀐다', async ({ page }) => {
    await page.goto('/');
    for (const [slug, second] of [['por-favor-harry', '요청한 사람 · 진행 상황'], ['shift-board', '내려받기 전 확인']] as const) {
      const w = page.locator(`[data-work="${slug}"] [data-two]`);
      const btns = w.getByRole('button');
      await expect(btns).toHaveCount(2);
      await expect(btns.first()).toHaveAttribute('aria-pressed', 'true');
      const cap0 = await w.locator('figcaption').innerText();
      await w.getByRole('button', { name: second }).click();
      await expect(w.getByRole('button', { name: second })).toHaveAttribute('aria-pressed', 'true');
      await expect(w.locator('figcaption')).not.toHaveText(cap0);
      await expect(w.locator('[data-on] img')).toBeVisible();
    }
  });

  test('문의 장 위에서는 헤더가 남색, 위로 돌아가면 원래대로', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-hdr-dark', '');
    const top = await page.locator('[data-sec="contact"]').evaluate((e) => e.getBoundingClientRect().top + scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await scrollToY(page, Math.min(top + 4, max));
    // 큰 화면(2560)은 끝까지 내려도 문의 장 꼭대기가 헤더 밑까지 오지 않을 수 있다 — 그때 헤더는 밝은 바탕 위라 그대로가 맞다
    const under = await page.evaluate(() => document.querySelector('[data-sec="contact"]')!.getBoundingClientRect().top <= document.querySelector('header')!.getBoundingClientRect().height / 2);
    if (under) await expect(page.locator('html')).toHaveAttribute('data-hdr-dark', '');
    else await expect(page.locator('html')).not.toHaveAttribute('data-hdr-dark', '');
    expect(under || top + 4 > max).toBe(true);
    await scrollToY(page, 0);
    await expect(page.locator('html')).not.toHaveAttribute('data-hdr-dark', '');
  });
});

test('모션 줄이기: 인트로 없음, 선과 & 는 다 그려진 상태, 낱말은 모두 진하다', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/?intro');
  await expect(page.locator('[data-intro-layer]')).toHaveCount(0);
  await expect(page.locator('[data-home]')).toHaveAttribute('data-motion', 'still');
  await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '');
  expect(await page.locator('[data-fill] [data-w]:not([data-on])').count()).toBe(0);
  await ctx.close();
});

test('잇는 선은 글자 위를 지나지 않고(머리글 고리 제외), 실제 화면 그림 안에서는 가려진다', async ({ browser, isMobile }, info) => {
  const vp = info.project.use.viewport!;
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: vp, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '');
  const r = await page.evaluate(() => {
    const svg = document.querySelector('[data-thread]')!, p = svg.querySelectorAll<SVGPathElement>('path')[1], m = p.getScreenCTM()!, L = p.getTotalLength();
    const under = [...document.querySelectorAll('[data-under]')].map((e) => e.getBoundingClientRect());
    const pts = Array.from({ length: 12000 }, (_, i) => { const q = p.getPointAtLength((L * i) / 11999); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; })
      .filter((q) => !under.some((u) => q.x >= u.left && q.x <= u.right && q.y >= u.top && q.y <= u.bottom));
    const lead = document.querySelector('[data-sec="how"] [data-fill]');
    const rects: { r: DOMRect; t: string }[] = [];
    const tw = document.createTreeWalker(document.querySelector('[data-home]')!, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.textContent?.trim() || lead?.contains(n) || n.parentElement?.closest('svg,[data-under],[aria-hidden="true"]')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) rects.push({ r, t: n.textContent.trim().slice(0, 20) });
    }
    const hit = new Set<string>();
    for (const q of pts) for (const { r, t } of rects) if (q.x > r.left + 2 && q.x < r.right - 2 && q.y > r.top + 2 && q.y < r.bottom - 2) hit.add(t);
    // 가려지는 면은 그림 수만큼, 선에는 그 면이 붙어 있다
    return { hit: [...hit], masked: p.getAttribute('mask'), n: document.querySelectorAll('#thread-under rect').length - 1, under: under.length };
  });
  expect(r.hit).toEqual([]);
  expect(r.masked).toBe('url(#thread-under)');
  expect(r.n).toBe(r.under);
  await ctx.close();
});

test.describe('홈 — 잇는 선의 출구와 입구(P2.6)', () => {
  /** 화면 좌표로 바꾼 점 — SVG 요소 안의 점(x,y)을 그 요소의 CTM 으로 */
  const tipOf = (which: 'hero' | 'contact') => `(() => { const s = document.querySelector('[data-amp="${which}"]'); const m = s.getScreenCTM(); return { x: 729 * m.a + m.e, y: 750.3 * m.d + m.f, h: 19.5 * m.d }; })()`;

  test('출구: 첫 & 받침 획 끝에서 가늘어지는 획이 시작되고, 선은 그 끝에서 틈 없이 이어진다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-thread] path').nth(1)).toBeAttached();
    const r = await page.evaluate(`(() => { const t = ${tipOf('hero')};
      const svg = document.querySelector('[data-thread]'), m = svg.getScreenCTM();
      const [taper, ink] = [...svg.querySelectorAll('path')];
      const L = taper.getTotalLength(); const pts = Array.from({ length: 200 }, (_, i) => taper.getPointAtLength(L * i / 199)).map((q) => ({ x: q.x * m.a + m.e, y: q.y * m.d + m.f }));
      const minX = Math.min(...pts.map((q) => q.x)), maxX = Math.max(...pts.map((q) => q.x));
      const left = pts.filter((q) => q.x < minX + 1.5).map((q) => q.y), right = pts.filter((q) => q.x > maxX - 0.5);
      const s0 = ink.getPointAtLength(0);
      return { tip: t, minX, maxX, leftH: Math.max(...left) - Math.min(...left), rightY: right.reduce((a, q) => a + q.y, 0) / right.length, ink0: { x: s0.x * m.a + m.e, y: s0.y * m.d + m.f } };
    })()`) as { tip: { x: number; y: number; h: number }; minX: number; maxX: number; leftH: number; rightY: number; ink0: { x: number; y: number } };
    expect(Math.abs(r.minX - r.tip.x)).toBeLessThanOrEqual(1.5);          // 가늘어지는 획은 받침 획 끝에서 시작
    expect(Math.abs(r.leftH - r.tip.h)).toBeLessThanOrEqual(1.5);         // 시작 두께 = 받침 획 두께
    expect(Math.abs(r.ink0.x - r.maxX)).toBeLessThanOrEqual(0.6);         // 선은 가는 끝에서 바로
    expect(Math.abs(r.ink0.y - r.tip.y)).toBeLessThanOrEqual(0.6);
    expect(Math.abs(r.rightY - r.tip.y)).toBeLessThanOrEqual(0.6);
  });

  test('입구: 선의 끝이 마지막 & 받침 획 끝이고, & 를 그리는 획이 바로 그 점에서 시작한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-thread] path').nth(1)).toBeAttached();
    // 그림·글꼴이 늦게 들어오면 선을 한 번 더 짠다 — 자리가 잡힌 뒤에 잰다
    const gap = () => page.evaluate(`(() => { const t = ${tipOf('contact')}; const svg = document.querySelector('[data-thread]'), m = svg.getScreenCTM(), ink = svg.querySelectorAll('path')[1];
      const e = ink.getPointAtLength(ink.getTotalLength()); return Math.hypot(e.x * m.a + m.e - t.x, e.y * m.d + m.f - t.y); })()`) as Promise<number>;
    await expect.poll(gap, { timeout: 5000 }).toBeLessThanOrEqual(0.6);
    const r = await page.evaluate(`(() => { const t = ${tipOf('contact')};
      const svg = document.querySelector('[data-thread]'), m = svg.getScreenCTM(), ink = svg.querySelectorAll('path')[1];
      const e = ink.getPointAtLength(ink.getTotalLength());
      const tr = document.querySelector('[data-amp="contact"] [data-trace]'), tm = tr.getScreenCTM(), q = tr.getPointAtLength(0);
      return { tip: t, end: { x: e.x * m.a + m.e, y: e.y * m.d + m.f }, tr0: { x: q.x * tm.a + tm.e, y: q.y * tm.d + tm.f } };
    })()`) as { tip: { x: number; y: number }; end: { x: number; y: number }; tr0: { x: number; y: number } };
    expect(Math.hypot(r.end.x - r.tip.x, r.end.y - r.tip.y)).toBeLessThanOrEqual(0.6);
    expect(Math.hypot(r.tr0.x - r.tip.x, r.tr0.y - r.tip.y)).toBeLessThanOrEqual(0.6);
  });

  test('역방향: 끝까지 내렸다가 맨 위로 돌아오면 & 채움·보조 획이 처음 상태로 돌아간다', async ({ page }) => {
    await page.goto('/');
    await scrollToY(page, 1e6);
    await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '', { timeout: 5000 });
    await scrollToY(page, 0);
    await expect(page.locator('[data-amp="contact"]')).not.toHaveAttribute('data-drawn', '', { timeout: 5000 });
    await expect.poll(() => page.locator('[class*="threadAux"][data-on]').count(), { timeout: 5000 }).toBe(0);
    await expect(page.locator('[class*="threadTaper"]')).toHaveAttribute('data-on', '');
  });

  test('내부 링크로 중간(#work)에 들어와도 지난 구간은 이미 지난 상태로 바로 보인다', async ({ page }) => {
    await page.goto('/#work');
    await page.waitForTimeout(400);
    expect(await page.locator('[data-thread] circle[class*="threadAux"][data-on]').count()).toBe(3);   // 설계와 개발 화면 틀의 점 셋
  });
});
