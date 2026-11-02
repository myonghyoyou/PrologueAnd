import { test, expect } from '@playwright/test';
import { bannedWords } from './banned';
import { scrollToY } from './helpers';
import fs from 'node:fs';
import path from 'node:path';
import { AMP_TIP, AMP_VB, AMP_MASKS } from '../components/home/amp-path';

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

  test('잇는 선: 장면마다 하는 일이 다르다 — 낱말 받침, 설계와 개발은 비워 두기, 예전 경로 고치기, 서비스 나누기, 요청 처리로 들어가기, 확대 자리 짚기', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-thread] path').first()).toBeAttached();
    const r = await page.evaluate(() => {
      const p = document.querySelector<SVGPathElement>('[data-thread] path[class*="threadInk"]:not([class*="threadLight"])')!, m = p.getScreenCTM()!, L = p.getTotalLength();
      const pts = Array.from({ length: 12000 }, (_, i) => { const q = p.getPointAtLength((L * i) / 11999); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
      const near = (x: number, y: number) => Math.min(...pts.map((q) => Math.hypot(q.x - x, q.y - y)));
      const box = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
      const w = box('[data-mark="find"]'), s2 = box('[data-step="2"]');
      const rows = [...document.querySelectorAll('[data-can]')].map((e) => e.getBoundingClientRect());
      const inside = (b: DOMRect) => pts.some((q) => q.x > b.left + 2 && q.x < b.right - 2 && q.y > b.top + 2 && q.y < b.bottom - 2);
      const sm = (e: Element) => { const g = e as SVGGeometryElement, c = g.getScreenCTM()!, n = g.getTotalLength(); return [0, n].map((l) => { const q = g.getPointAtLength(l); return { x: q.x * c.a + c.e, y: q.y * c.d + c.f }; }); };
      const old = document.querySelector('[data-thread] [class*="threadOld"]')!;
      const reqs = [...document.querySelectorAll('[data-thread] path[class*="threadReq"]')].map((e) => sm(e)[1]);
      const pf = box('[data-layout="wide"] [data-under]');
      const zoom = document.querySelector('[data-thread] rect[class*="threadZoom"]')!.getBoundingClientRect(), sf = box('[data-layout="full"] [data-two] [data-under]');
      return {
        // 낱말 밑: 가운데·양 끝이 글자 아래 12px 줄 위에 있다
        cradle: [w.left + 4, w.left + w.width / 2, w.right - 4].map((x) => near(x, w.bottom + 12)),
        step2: pts.filter((q) => q.x > s2.left - 8 && q.x < s2.right + 8 && q.y > s2.top - 8 && q.y < s2.bottom + 8).length,
        old: sm(old).map((q) => near(q.x, q.y)),
        svc: pts.filter((q) => q.x > rows[0].left - 4 && q.x < rows[0].right + 4 && q.y > rows[0].top - 4 && q.y < rows[3].bottom + 4).length,
        // 가로 구분선을 이어받는 구간: 02 머리 선 · 04 머리 선 · 「모든 작업」 선(선의 가운데 높이 ±1)
        rules: ['#how [class*="__sh"]', '#work [class*="__sh"]', '#work [class*="__all"]'].map((sel) => { const b = box(sel); return pts.filter((q) => Math.abs(q.y - (b.top + 0.5)) < 1 && q.x > rows[0].left && q.x < rows[0].right).length * (L / 11999); }),
        braceL: pts.filter((q) => q.x < rows[0].left - 10 && q.y > rows[0].top && q.y < rows[1].bottom - 4).length,
        reqs: reqs.map((q) => ({ dx: Math.abs(q.x - pf.left), y: q.y })),
        zoom: { l: zoom.left - sf.left, t: zoom.top - sf.top, w: zoom.width / sf.width, h: zoom.height / sf.height },
        works: [['[data-layout="wide"] [data-under]', 0], ['[data-layout="phones"] [data-under]', 0], ['[data-layout="pair"] [data-under]', 0], ['[data-layout="full"] [data-under]', 0], ['[data-layout="full"] [data-under]', 1]]
          .map(([sel, i]) => inside(document.querySelectorAll(sel as string)[i as number].getBoundingClientRect())),
      };
    });
    for (const d of r.cradle) expect(d).toBeLessThanOrEqual(2);           // 「불편한지」 밑 받침(글자와 12px)
    expect(r.step2).toBe(0);                                              // 설계와 개발은 선이 감싸지 않는다
    for (const d of r.old) expect(d).toBeLessThanOrEqual(1.5);           // 예전 경로(점선)는 고친 선 위에서 갈라져 다시 만난다
    expect(r.svc).toBe(0);                                                // 서비스 목록 안으로는 들어가지 않는다(감싸지도 않는다)
    expect(r.rules[0]).toBeGreaterThan(600);   // 02 머리 선은 거의 끝에서 끝까지 이어받는다
    expect(r.rules[1]).toBeGreaterThan(200);                              // 04 머리 선은 왼쪽 끝에서 작업 머리 사이까지
    expect(r.rules[2]).toBeGreaterThan(150);                              // 「모든 작업」 선은 확대 그림 아래에서 오른쪽 끝까지
    expect(r.braceL).toBe(0);                                             // 서비스 왼쪽에는 괄호가 없다
    // 네 갈래 요청은 그림 왼쪽 가장자리 서로 다른 자리에 닿는다. 왼쪽 여백에 이름이 들어가지 않는 폭(1280)에서는 통째로 뺀다
    expect(r.reqs).toHaveLength(page.viewportSize()!.width >= 1440 ? 4 : 0);
    for (const q of r.reqs) expect(q.dx).toBeLessThanOrEqual(1);
    const ys = r.reqs.map((q) => q.y).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThan(20);
    expect(r.zoom.l).toBeLessThan(6); expect(r.zoom.t).toBeLessThan(6);  // 근무표 확대 자리 = 원본 왼쪽 위 39.6% × 21%
    expect(Math.abs(r.zoom.w - 0.396)).toBeLessThan(0.02); expect(Math.abs(r.zoom.h - 0.21)).toBeLessThan(0.03);
    expect(r.works).toEqual([true, true, true, true, true]);              // 요청 처리·학습 홈·병원 비교·근무표 원본·확대 뒤로 지나간다
    await expect(page.locator('[data-amp="contact"]')).not.toHaveAttribute('data-drawn', '');
    await scrollToY(page, 1e6);
    await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '', { timeout: 5000 });
  });

  test('근무표: 두 번째 화면으로 바꾸면 확대 자리 테두리가 숨는다', async ({ browser }, info) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: info.project.use.viewport! });
    const page = await ctx.newPage();
    await page.goto('/');
    const z = page.locator('[data-thread] rect[class*="threadZoom"]');
    await expect(z).toBeAttached();
    await expect.poll(() => z.evaluate((e) => getComputedStyle(e).visibility)).not.toBe('hidden');
    await page.locator('[data-work="shift-board"]').getByRole('button', { name: '내려받기 전 확인' }).click();
    await expect.poll(() => z.evaluate((e) => getComputedStyle(e).visibility)).toBe('hidden');
    await ctx.close();
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

  test('잇는 선: 폰에서는 02 머리 선을 이어받다 「불편한지」 오른쪽 위에서 빠져 낱말 끝을 짚고 돌아간다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-thread] path').first()).toBeAttached();
    const d = await page.evaluate(() => {
      const p = document.querySelector<SVGPathElement>('[data-thread] path[class*="threadInk"]:not([class*="threadLight"])')!, m = p.getScreenCTM()!, L = p.getTotalLength(), w = document.querySelector('[data-mark="find"]')!.getBoundingClientRect();
      const pts = Array.from({ length: 12000 }, (_, i) => { const q = p.getPointAtLength((L * i) / 11999); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
      return Math.min(...pts.map((q) => Math.hypot(q.x - (w.right + 18), q.y - (w.top + w.height / 2 - 12))));
    });
    expect(d).toBeLessThanOrEqual(8);
  });

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

  /** 첫 & 가닥마다 보이는 비율(0~1)과 페이지 선이 그려진 길이를 프레임마다 모은다 — 페이지가 열리기 전부터 */
  const sampler = () => {
    const log: Record<string, number | string>[] = []; (window as unknown as { __log: typeof log }).__log = log; const t0 = performance.now();
    const vis = (e: SVGPathElement) => { const st = e.style;
      if (!st.strokeDasharray) return getComputedStyle(e).strokeDasharray.startsWith('0') ? 0 : 1;
      if (st.strokeDasharray === 'none') return 1;
      const d = st.strokeDasharray.split(/[ ,]+/).map(parseFloat);
      return d.length === 4 ? d[2] / (d[3] / 2) : 1 - Math.abs(parseFloat(st.strokeDashoffset || '0')) / d[0]; };
    const f = () => { const h = document.querySelectorAll<SVGPathElement>('[data-amp="hero"] [data-line]');
      if (h.length) { const ink = document.querySelector<SVGPathElement>('[data-thread] path[class*="threadInk"]');
        const o: Record<string, number | string> = { t: performance.now() - t0, on: document.documentElement.dataset.ampIn ?? '', ink: ink ? parseFloat(ink.style.strokeDasharray) || 0 : 0 };
        for (const e of h) o[e.dataset.line!] = vis(e); log.push(o); }
      if (performance.now() - t0 < 5000) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  type Row = Record<string, number | string>;
  const ids = (g: string) => [1, 2, 3, 4, 5, 6].map((n) => g + '-line-' + n);

  test('첫 & 등장(?amp): 제목·주요 정보는 처음부터 보이고, 가닥이 고리 → 내림획·가로획 → 대각선 차례로 경로를 따라 그려진 뒤 주된 가닥 끝에서 선이 이어진다', async ({ page }) => {
    await page.addInitScript(sampler);
    await page.goto('/?amp');
    await expect(page.locator('html')).toHaveAttribute('data-amp-in', 'on');
    // 기다리지 않는다 — 제목·글·단추가 바로 제자리에 보인다
    await expect(page.locator('#home-h1')).toBeVisible();
    expect(await page.locator('[data-sec="hero"] [class*="heroFoot"]').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await expect(page.locator('html')).not.toHaveAttribute('data-amp-in', 'on', { timeout: 3500 });
    await page.waitForTimeout(800);
    const log = await page.evaluate(() => (window as unknown as { __log: Row[] }).__log);
    const first = (id: string) => log.find((o) => (o[id] as number) > 0.02)?.t as number;
    const done = (id: string) => log.find((o) => (o[id] as number) >= 0.999)?.t as number;
    const last = log.at(-1)!;
    // 다 그려진 뒤는 원본 그대로(24줄 모두 끝)
    for (const g of ['loops', 'descender', 'horizontal', 'diagonal']) for (const id of ids(g)) expect(last[id]).toBe(1);
    // 차례: 고리가 먼저, 대각선이 마지막. 같은 무리 안에서는 1 → 6 번이 뒤따른다(동시에 나오지 않는다)
    expect(first('loops-line-1')).toBeLessThan(first('descender-line-1'));
    expect(first('descender-line-1')).toBeLessThanOrEqual(first('horizontal-line-1'));
    expect(first('loops-line-1')).toBeLessThan(first('diagonal-line-1'));
    for (const g of ['loops', 'diagonal']) expect(first(g + '-line-6')).toBeGreaterThan(first(g + '-line-1') + 150);
    // 가닥은 갑자기 나타나지 않는다 — 한 프레임에 보이는 비율이 크게 뛰지 않는다
    for (const id of [...ids('loops'), ...ids('diagonal')]) for (let i = 1; i < log.length; i++) {
      if (log[i].on !== 'on') break;
      expect((log[i][id] as number) - (log[i - 1][id] as number)).toBeLessThan(0.25);
    }
    // 그린 가닥이 도중에 사라지지 않는다
    for (const id of ids('loops')) { const k = log.findIndex((o) => (o[id] as number) >= 0.999); expect(log.slice(k).every((o) => (o[id] as number) >= 0.999)).toBe(true); }
    // 주된 가닥(대각선 6번)이 가장 늦게 끝나고, 페이지 선은 그 뒤에 출발한다
    const mainDone = done('diagonal-line-6');
    for (const g of ['loops', 'descender', 'horizontal', 'diagonal']) for (const id of ids(g)) expect(done(id)).toBeLessThanOrEqual(mainDone);
    expect(log.filter((o) => (o.t as number) < mainDone).every((o) => (o.ink as number) < 0.5)).toBe(true);
    expect(last.ink as number).toBeGreaterThan(10);
    // 전체 등장은 짧게(첫 가닥부터 주된 가닥 끝까지 2초 안)
    expect(mainDone - first('loops-line-1')).toBeLessThan(2000);
  });

  test('첫 & 등장 중 스크롤: 막히지 않고, 남은 & 를 빨리 마친 뒤 선이 끊김 없이 스크롤 자리까지 자란다', async ({ page, isMobile }) => {
    await page.addInitScript(sampler);
    await page.goto('/?amp');
    await expect(page.locator('html')).toHaveAttribute('data-amp-in', 'on');
    await page.waitForTimeout(500);
    if (isMobile) await page.evaluate(() => scrollTo(0, 500)); else { await page.mouse.move(600, 400); await page.mouse.wheel(0, 500); }
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);   // 스크롤이 막히지 않는다
    await expect(page.locator('html')).not.toHaveAttribute('data-amp-in', 'on', { timeout: 1500 });
    await page.waitForTimeout(1500);
    const log = await page.evaluate(() => (window as unknown as { __log: Row[] }).__log);
    // 선은 줄어들지 않고, 한 프레임에 크게 건너뛰지 않는다
    for (let i = 1; i < log.length; i++) {
      expect(log[i].ink as number).toBeGreaterThanOrEqual((log[i - 1].ink as number) - 0.5);
      expect((log[i].ink as number) - (log[i - 1].ink as number)).toBeLessThan(160);
    }
    expect(log.at(-1)!.ink as number).toBeGreaterThan(100);
    for (const id of ids('diagonal')) expect(log.at(-1)![id]).toBe(1);
  });

  test('첫 & 등장: 중간에서 새로고침하면(스크롤 복원) 기다림 없이 완성된 & 로 바로 보인다', async ({ page }) => {
    await page.goto('/?amp');
    await expect(page.locator('html')).not.toHaveAttribute('data-amp-in', 'on', { timeout: 3500 });
    await scrollToY(page, 1600);
    await page.reload();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(800);
    await expect(page.locator('html')).not.toHaveAttribute('data-amp-in', 'on', { timeout: 800 });
    const dashes = await page.locator('[data-amp="hero"] [data-line]').evaluateAll((es) => es.map((e) => (e as SVGPathElement).style.strokeDasharray));
    expect(dashes.every((d) => d === '')).toBe(true);
  });

  test('첫 & 등장: 빠르게 연달아 새로고침해도 매번 처음부터 다시 그려 같은 모양에서 끝난다', async ({ page }) => {
    await page.goto('/?amp');
    await page.waitForTimeout(300);
    await page.reload(); await page.waitForTimeout(250);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-amp-in', 'on');
    await expect(page.locator('html')).not.toHaveAttribute('data-amp-in', 'on', { timeout: 3500 });
    const dashes = await page.locator('[data-amp="hero"] [data-line]').evaluateAll((es) => es.map((e) => (e as SVGPathElement).style.strokeDasharray));
    expect(dashes.every((d) => d === '')).toBe(true);
    expect(await page.locator('[data-amp="hero"] mask path').evaluateAll((es) => es.map((e) => getComputedStyle(e).display))).toEqual(['inline', 'inline']);
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

test('모션 줄이기: 첫 & 는 처음부터 완성(등장 없음), 선과 마지막 & 도 다 그려진 상태, 낱말은 모두 진하다', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/?amp');
  await expect(page.locator('html')).not.toHaveAttribute('data-amp-in', 'on');
  expect(await page.locator('[data-amp="hero"] [data-line]').evaluateAll((es) => es.every((e) => getComputedStyle(e).strokeDasharray === 'none'))).toBe(true);
  await expect(page.locator('[data-home]')).toHaveAttribute('data-motion', 'still');
  await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '');
  expect(await page.locator('[data-fill] [data-w]:not([data-on])').count()).toBe(0);
  await ctx.close();
});

test('잇는 선은 글자 위를 지나지 않고(머리글도), 실제 화면 그림 안에서는 가려진다', async ({ browser, isMobile }, info) => {
  const vp = info.project.use.viewport!;
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: vp, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '');
  const r = await page.evaluate(() => {
    const p = document.querySelector<SVGPathElement>('[data-thread] path[class*="threadInk"]:not([class*="threadLight"])')!, m = p.getScreenCTM()!, L = p.getTotalLength();
    const under = [...document.querySelectorAll('[data-under]')].map((e) => e.getBoundingClientRect());
    const pts = Array.from({ length: 12000 }, (_, i) => { const q = p.getPointAtLength((L * i) / 11999); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; })
      .filter((q) => !under.some((u) => q.x >= u.left && q.x <= u.right && q.y >= u.top && q.y <= u.bottom));
    const rects: { r: DOMRect; t: string }[] = [];
    const tw = document.createTreeWalker(document.querySelector('[data-home]')!, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.textContent?.trim() || n.parentElement?.closest('svg,[data-under],[aria-hidden="true"]')) continue;
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

test.describe('홈 — 기준 SVG & 와 잇는 선의 출구·입구', () => {
  /** & 안의 점(보기 상자 왼쪽 위 기준) → 화면 좌표 */
  const at = (which: 'hero' | 'contact', p: { x: number; y: number }) => `(() => { const m = document.querySelector('[data-amp="${which}"]').getScreenCTM(); return { x: ${p.x + AMP_VB[0]} * m.a + m.e, y: ${p.y + AMP_VB[1]} * m.d + m.f }; })()`;
  const ink = `document.querySelector('[data-thread] path[class*="threadInk"]:not([class*="threadLight"])')`;

  test('출구: 선은 첫 & 오른쪽 아래 맨 아래 가닥 끝에서 그 가닥 방향(오른쪽) 그대로, 같은 굵기로 시작한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-thread] path').first()).toBeAttached();
    const r = await page.evaluate(`(() => { const t = ${at('hero', AMP_TIP)}; const p = ${ink}, m = p.getScreenCTM();
      const a = p.getPointAtLength(0), b = p.getPointAtLength(6);
      const w = getComputedStyle(document.querySelector('[data-amp="hero"] [data-line="diagonal-line-6"]')).strokeWidth;
      return { gap: Math.hypot(a.x * m.a + m.e - t.x, a.y * m.d + m.f - t.y), dir: [b.x - a.x, b.y - a.y], w, iw: getComputedStyle(p).strokeWidth }; })()`) as { gap: number; dir: [number, number]; w: string; iw: string };
    expect(r.gap).toBeLessThanOrEqual(0.6);
    const ang = Math.acos(Math.min(1, (r.dir[0] * AMP_TIP.dx + r.dir[1] * AMP_TIP.dy) / Math.hypot(...r.dir)));
    expect(ang * 180 / Math.PI).toBeLessThan(12);
    expect(r.iw).toBe(r.w);   // 잇는 선과 & 가닥이 같은 화면 굵기
  });

  test('입구: 선의 끝이 마지막 & 의 같은 가닥 끝이고, 그 가닥을 거슬러 가로로 들어온다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-thread] path').first()).toBeAttached();
    // 그림·글꼴이 늦게 들어오면 선을 한 번 더 짠다 — 자리가 잡힌 뒤에 잰다
    const gap = () => page.evaluate(`(() => { const t = ${at('contact', AMP_TIP)}; const p = ${ink}, m = p.getScreenCTM();
      const e = p.getPointAtLength(p.getTotalLength()); return Math.hypot(e.x * m.a + m.e - t.x, e.y * m.d + m.f - t.y); })()`) as Promise<number>;
    await expect.poll(gap, { timeout: 5000 }).toBeLessThanOrEqual(0.6);
    const r = await page.evaluate(`(() => { const t = ${at('contact', AMP_TIP)}; const p = ${ink}, L = p.getTotalLength();
      const a = p.getPointAtLength(L - 6), e = p.getPointAtLength(L);
      const g = document.querySelector('[data-amp="contact"] [data-line="diagonal-line-6"]'), gm = g.getScreenCTM(), q = g.getPointAtLength(g.getTotalLength());
      return { dir: [e.x - a.x, e.y - a.y], g0: Math.hypot(q.x * gm.a + gm.e - t.x, q.y * gm.d + gm.f - t.y) }; })()`) as { dir: [number, number]; g0: number };
    expect(r.g0).toBeLessThanOrEqual(0.6);
    const ang = Math.acos(Math.min(1, -(r.dir[0] * AMP_TIP.dx + r.dir[1] * AMP_TIP.dy) / Math.hypot(...r.dir)));
    expect(ang * 180 / Math.PI).toBeLessThan(15);
  });

  test('큰 & 는 기준 SVG 그대로 — 두 장면 모두 24줄의 경로·가리개가 원본과 같고, 늘이거나 눌리지 않는다', async ({ page }) => {
    await page.goto('/');
    const src = fs.readFileSync(path.join(__dirname, '../public/brand/ampersand_dense_thicker.svg'), 'utf8');
    const want = Object.fromEntries([...src.matchAll(/<path id="([a-z]+-line-\d)" d="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    expect(Object.keys(want)).toHaveLength(24);
    for (const which of ['hero', 'contact']) {
      const sel = `[data-amp="${which}"]`;
      const got = await page.locator(`${sel} [data-line]`).evaluateAll((es) => Object.fromEntries(es.map((e) => [e.getAttribute('data-line'), e.getAttribute('d')])));
      expect(got).toEqual(want);
      const ratio = await page.locator(sel).evaluate((s) => { const r = s.getBoundingClientRect(); return r.width / r.height; });
      expect(Math.abs(ratio - AMP_VB[2] / AMP_VB[3])).toBeLessThan(0.01);
      expect(await page.locator(`${sel} mask path`).evaluateAll((es) => es.map((e) => e.getAttribute('d')))).toEqual([AMP_MASKS.loops.d, AMP_MASKS.desc.d]);
    }
    expect(src).toContain(AMP_MASKS.loops.d); expect(src).toContain(AMP_MASKS.desc.d);
  });

  test('역방향: 끝까지 내렸다가 맨 위로 돌아오면 & 와 보조 획이 처음 상태로 돌아간다', async ({ page }) => {
    await page.goto('/');
    await scrollToY(page, 1e6);
    await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '', { timeout: 5000 });
    await scrollToY(page, 0);
    await expect(page.locator('[data-amp="contact"]')).not.toHaveAttribute('data-drawn', '', { timeout: 5000 });
    await expect.poll(() => page.locator('[data-thread] [data-on]:is([class*="threadAux"],[class*="threadOld"],[class*="threadReq"])').count(), { timeout: 5000 }).toBe(0);
  });

  test('빠르게 앞뒤로 옮겨도 문의 장 & 가닥이 스크롤 자리와 맞고, 접합 자리는 그대로다', async ({ page }) => {
    await page.goto('/');
    const strands = () => page.locator('[data-amp="contact"] [data-line]').evaluateAll((es) => es.map((e) => ({ id: e.getAttribute('data-line'), da: (e as SVGPathElement).style.strokeDasharray, off: parseFloat((e as SVGPathElement).style.strokeDashoffset || '0') })));
    for (const y of [1e6, 0, 1e6, 3000, 1e6]) await scrollToY(page, y);
    await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '', { timeout: 5000 });
    // 끝: 모든 가닥이 점선 없이 원본 그대로
    await expect.poll(async () => (await strands()).filter((s) => s.da !== '').length, { timeout: 5000 }).toBe(0);
    await scrollToY(page, 0);
    // 맨 위: 주된 가닥(사선)은 아직 그리지 않았다 — 끝에서부터 그리므로 dashoffset 이 음수(가닥 길이만큼)
    await expect.poll(async () => (await strands()).find((s) => s.id === 'diagonal-line-6')!.off, { timeout: 5000 }).toBeLessThan(-10);
    const gap = await page.evaluate(() => {
      const ink = document.querySelector<SVGPathElement>('[data-thread] path[class*="threadInk"]:not([class*="threadLight"])')!, m = ink.getScreenCTM()!;
      const g = document.querySelector<SVGPathElement>('[data-amp="hero"] [data-line="diagonal-line-6"]')!, gm = g.getScreenCTM()!, q = g.getPointAtLength(g.getTotalLength()), s = ink.getPointAtLength(0);
      return Math.hypot(s.x * m.a + m.e - (q.x * gm.a + gm.e), s.y * m.d + m.f - (q.y * gm.d + gm.f));
    });
    expect(gap).toBeLessThanOrEqual(0.6);
  });

  test('내부 링크로 중간(#work)에 들어와도 지난 구간은 이미 지난 상태로 바로 보인다', async ({ page }) => {
    await page.goto('/#work');
    await page.waitForTimeout(400);
    expect(await page.locator('[data-thread] [class*="threadOld"][data-on]').count()).toBe(1);   // 오픈 후 수정 옆 예전 경로
  });
});
