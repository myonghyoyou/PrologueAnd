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
    await expect(page.locator('[data-step="3"] p').first()).toHaveText('오픈 후 석 달 동안은 쓰면서 생긴 불편을 무상으로 고칩니다. 한 달쯤 지나면 제가 먼저 연락해 불편한 점을 여쭙니다. 제가 만든 오류는 기간과 상관없이 고칩니다.');
  });

  test('할 수 있는 일: 네 줄이 같은 구조, 관련 작업이 없으면 문의 단추, 관련 작업 링크는 이 페이지의 작업이나 새 탭의 실제 사이트로', async ({ page }) => {
    await expect(page.locator('[data-can]')).toHaveCount(4);
    await expect(page.locator('[data-can] h3')).toHaveText(['업무 화면 개선', '업무 웹 전환', '맞춤 웹서비스 개발', '홈페이지 제작']);
    for (const row of await page.locator('[data-can]').all()) expect(await row.locator('a, button').count()).toBeGreaterThan(0);
    await page.locator('#s-make').getByRole('button', { name: /이런 작업 문의하기/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-drawer-open', '');
    await page.keyboard.press('Escape');
    const site = page.locator('#s-site a');
    await expect(site).toHaveAttribute('href', 'https://www.aroma-roastery.com');
    await expect(site).toHaveAttribute('target', '_blank');
    for (const href of await page.locator('[data-can] a:not([target])').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
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
    // 작업 판 끝의 「모든 작업」 구간은 없다(목록은 머리줄 Projects 로 간다)
    await expect(page.locator('[data-sec="work"]').getByRole('link', { name: /Projects 보기/ })).toHaveCount(0);
    await expect(page.locator('header').getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
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


  test('작업: 병원은 전·후 비교 위에 짚은 자리 둘과 그 설명, 교대 근무표는 글이 그림보다 먼저(폰은 위, 넓은 화면은 왼쪽), 확대 하나, 요청 처리는 확대 없음', async ({ page, isMobile }) => {
    const pair = page.locator('[data-layout="pair"]');
    await expect(pair.locator('[data-ba] [class*="baMark"]')).toHaveCount(2);
    await expect(pair.locator('[data-compare] li')).toHaveCount(3);
    await expect(pair.locator('[data-compare] a')).toHaveAttribute('href', '/projects/hospital-ux');
    await expect(pair.locator('[data-detail]')).toHaveCount(0);
    const full = page.locator('[data-layout="full"]');
    const t = (await full.locator('h3').boundingBox())!, img = (await full.locator('img').first().boundingBox())!;
    if (isMobile) expect(t.y).toBeLessThan(img.y); else expect(t.x + t.width).toBeLessThan(img.x);
    await expect(full.locator('[data-detail]')).toHaveCount(1);
    await expect(page.locator('[data-layout="wide"] [data-detail]')).toHaveCount(0);
    // 작업마다 문제 → 설계 판단 → 바꾼 것(요청 처리·병원·근무표는 바꾼 것을 이름 옆에 크게 따로)
    for (const w of await page.locator('[data-work]').all()) {
      const dts = await w.locator('dt').allInnerTexts();
      expect(dts.slice(0, 2)).toEqual(['문제', '설계 판단']);
      if (dts.length < 3) await expect(w.locator('[class*="result"]')).toHaveCount(1);
    }
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

  /** 장면 꼭대기에서 붙는 길이의 k 배만큼 내려간 자리(1440×900 기준 설계) */
  const into = async (page: import('@playwright/test').Page, key: string, k: number) => {
    await page.waitForLoadState('load'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);   // 글꼴·그림이 들어와 장면 길이가 정해진 뒤
    const y = await page.evaluate(([key, k]) => { const e = document.querySelector('[data-scene="' + key + '"]')!; const r = e.getBoundingClientRect(); return r.top + scrollY + (r.height - innerHeight) * (k as number); }, [key, k] as const);
    await scrollToY(page, y); await page.waitForTimeout(700);
  };
  /** 지금 그려진 선 끝(가장 뒤에 그려지고 있는 장면 선의 끝) — 화면 좌표 */
  const head = (page: import('@playwright/test').Page) => page.evaluate(() => {
    const inks = [...document.querySelectorAll<SVGPathElement>('[data-thread] path[class*="threadInk"]')];
    let p: SVGPathElement | null = null, len = 0;
    for (const e of inks) { const d = parseFloat(e.style.strokeDasharray) || 0; if (d > 1) { p = e; len = d; } }
    if (!p) return null;
    const m = p.getScreenCTM()!, q = p.getPointAtLength(len);
    return { x: q.x * m.a + m.e, y: q.y * m.d + m.f };
  });

  /** 선이 그림 뒤로 지나는 상자들(그 장면 SVG 의 가림 상자) — 화면 좌표 */
  const hidden = (page: import('@playwright/test').Page, key: string) => page.evaluate((key) =>
    [...document.querySelectorAll('[data-scene="' + key + '"] [data-thread] mask rect[fill="#000"]')].map((r) => { const m = (r as SVGRectElement).ownerSVGElement!.querySelector<SVGPathElement>('path[class*="threadInk"]')!.getScreenCTM()!, g = (k: string) => +r.getAttribute(k)!, x = g('x') * m.a + m.e, y = g('y') * m.d + m.f; return { l: x, t: y, r: x + g('width') * m.a, b: y + g('height') * m.d }; }), key);
  /** 그 장면 선에서 지금 보이는 점들(그려진 길이 안, 가림 상자 밖) */
  const shown = (page: import('@playwright/test').Page, key: string) => page.evaluate((key) => {
    const p = document.querySelector<SVGPathElement>('[data-scene="' + key + '"] [data-thread] path[class*="threadInk"]')!, m = p.getScreenCTM()!, len = parseFloat(p.style.strokeDasharray) || 0;
    const boxes = [...p.ownerSVGElement!.querySelectorAll('mask rect[fill="#000"]')].map((r) => { const g = (k: string) => +r.getAttribute(k)!, x = g('x') * m.a + m.e, y = g('y') * m.d + m.f; return { left: x, top: y, right: x + g('width') * m.a, bottom: y + g('height') * m.d }; });
    const out: { x: number; y: number }[] = [];
    for (let l = 0; l <= len; l += 3) { const q = p.getPointAtLength(l), x = q.x * m.a + m.e, y = q.y * m.d + m.f; if (!boxes.some((b) => x > b.left && x < b.right && y > b.top && y < b.bottom)) out.push({ x, y }); }
    return out;
  }, key);

  test('큰 글자: 문장은 무대 세로 가운데, 「불편한지」 밑(28px 띄워)을 지나는 동안 초점이 잡히고, 짧게 머문 뒤 아래에서 문제 파악이 올라온다', async ({ page }) => {
    await page.goto('/');
    const vp = page.viewportSize()!;
    const h1 = await page.locator('#home-h1').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    const big = page.locator('[data-mark="find"]');
    expect(await big.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(h1 * 1.4);
    const v = (n: string) => page.locator('[data-focus]').evaluate((e, n) => parseFloat((e as HTMLElement).style.getPropertyValue(n) || '0'), n);
    await into(page, 'focus', -0.45);
    expect(await v('--e')).toBeLessThan(0.6);
    let mid = false;
    for (const k of [0.2, 0.3, 0.4, 0.5, 0.6]) {
      await into(page, 'focus', k);
      const f = await v('--f');
      if (f > 0.15 && f < 0.85) {
        const b = (await big.boundingBox())!, h = (await head(page))!;
        expect(Math.abs(h.y - (b.y + b.height + 28))).toBeLessThan(4);   // 글자에 붙지 않는다
        expect(Math.abs(h.x - (b.x + b.width - f * b.width))).toBeLessThan(b.width * 0.18);
        mid = true; break;
      }
    }
    expect(mid).toBe(true);
    await into(page, 'focus', 0.85);
    expect(await v('--f')).toBe(1);
    expect(await page.locator('[data-focus] [data-dim]').first().evaluate((e) => +getComputedStyle(e).opacity)).toBeLessThan(0.35);
    expect(await big.evaluate((e) => getComputedStyle(e).color)).toMatch(/rgb\(31, 36, 71\)|srgb 0\.12156\d* 0\.14117\d* 0\.27843/);
    // 위아래 여백이 고르다(문장 묶음의 가운데가 화면 가운데 근처)
    const hb = (await page.locator('[data-focus]').boundingBox())!;
    expect(Math.abs(hb.y + hb.height / 2 - vp.height / 2)).toBeLessThan(vp.height * 0.15);
    // 큰 글자 장면이 풀리면 바로 아래에서 문제 파악(제목·설명)이 올라온다
    await page.evaluate(() => { const e = document.querySelector('[data-scene="focus"]')!.getBoundingClientRect(); (window as unknown as { __lenis: { scrollTo: (y: number, o: object) => void } }).__lenis.scrollTo(e.bottom + scrollY - innerHeight * 0.55, { immediate: true }); });
    await page.waitForTimeout(800);
    const s1 = (await page.locator('[data-step="1"] h3').boundingBox())!, p1 = (await page.locator('[data-step="1"] p').boundingBox())!, bb = (await big.boundingBox())!;
    expect(s1.y).toBeLessThan(vp.height - 20); expect(p1.y).toBeLessThan(vp.height + 120);   // 제목이 들어오기 시작했다(낮은 화면에서는 설명이 곧 따라 들어온다)
    expect(bb.y + bb.height).toBeGreaterThan(0);   // 큰 낱말이 아직 화면에 있는 동안
  });

  test('세 단계: 지금 단계의 제목과 설명이 화면 가운데에 함께 서고, 다음 단계 제목이 아래에 흐리게 기다린다 — 선 끝은 지금 번호에', async ({ page }) => {
    await page.goto('/');
    const vp = page.viewportSize()!;
    const st = () => page.locator('[data-step]').evaluateAll((es) => es.map((e) => (e as HTMLElement).dataset.st));
    const one = async (i: number, want: string[]) => {
      expect(await st()).toEqual(want);
      await page.waitForTimeout(800);
      const h = (await page.locator('[data-step="' + i + '"] h3').boundingBox())!, p = (await page.locator('[data-step="' + i + '"] p').boundingBox())!;
      expect(await page.locator('[data-step="' + i + '"] p').evaluate((e) => +getComputedStyle(e.closest('[class*="stepBody"]')!).opacity)).toBeGreaterThan(0.95);
      expect(await page.locator('[data-step="' + i + '"] p').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
      expect(p.y - (h.y + h.height)).toBeLessThan(40);                       // 제목과 설명이 한 덩어리
      expect(h.y).toBeGreaterThan(vp.height * 0.2); expect(p.y + p.height).toBeLessThan(vp.height * 0.8);
      const n = (await page.locator('[data-tn="' + i + '"]').boundingBox())!, hd = (await head(page))!;
      expect(Math.abs(hd.y - (n.y + n.height / 2))).toBeLessThan(8);         // 선 끝은 지금 번호 옆
      if (i < 3) {                                                            // 다음 단계 제목이 아래에 흐리게
        const nx = page.locator('[data-step="' + (i + 1) + '"] h3');
        const op = await nx.evaluate((e) => +getComputedStyle(e.closest('[data-step]')!).opacity);
        expect(op).toBeGreaterThan(0.08); expect(op).toBeLessThan(0.3);       // 방향은 읽히되 시선을 빼앗지 않게
        expect((await nx.boundingBox())!.y).toBeGreaterThan(p.y + p.height);
      }
    };
    await into(page, 'steps', 0.12); await one(1, ['on', 'next', 'later']);
    await into(page, 'steps', 0.6); await one(2, ['past', 'on', 'next']);
    await into(page, 'steps', 0.95); await one(3, ['past', 'past', 'on']);
    // 단계 사이에는 줄 구분선이 없다
    expect(await page.locator('[data-step]').evaluateAll((es) => es.filter((e) => parseFloat(getComputedStyle(e).borderTopWidth) > 0).length)).toBe(0);
  });

  test('명암 전환: 남색은 선 끝 높이까지만 덮고, 제목·건수·설명은 남색이 다 지나간 뒤 통째로 나타난다 — 다른 작업 그림은 끼우지 않는다', async ({ page }) => {
    await page.goto('/');
    const vp = page.viewportSize()!;
    const stage = page.locator('[data-scene="dark"] [data-stage]');
    const edge = () => stage.evaluate((e) => parseFloat((e as HTMLElement).style.getPropertyValue('--edge')));
    const seen = async () => {   // 제목이 보이면(불투명) 그 아래 끝은 남색 경계 위에 있다 — 경계에 잘리지 않는다
      const e1 = await edge(), stTop = await stage.evaluate((e) => e.getBoundingClientRect().top), wt = (await page.locator('[data-scene="dark"] h2').boundingBox())!;
      const op = await page.locator('[data-scene="dark"] h2').evaluate((e) => +getComputedStyle(e).opacity);
      if (op > 0.05) expect(wt.y + wt.height).toBeLessThan(stTop + e1);
      return op;
    };
    await into(page, 'dark', 0.12);
    const e1 = await edge(), h = (await head(page))!, stTop = await stage.evaluate((e) => e.getBoundingClientRect().top);
    expect(e1).toBeGreaterThan(80); expect(e1).toBeLessThanOrEqual(vp.height);
    expect(Math.abs(h.y - (stTop + e1))).toBeLessThan(3);
    for (const k of [-0.3, -0.15, 0, 0.1, 0.3]) { await into(page, 'dark', k); await seen(); }
    await into(page, 'dark', 0.85);
    expect(await edge()).toBeGreaterThanOrEqual(vp.height);
    expect(await seen()).toBe(1);
    await expect(page.locator('html')).toHaveAttribute('data-hdr-dark', '');
    await expect(page.locator('[data-scene="dark"] img')).toHaveCount(0);   // 소개 장면에 작업 그림을 끼우지 않는다
  });

  test('첫 작업: 그림이 글 옆으로 커지고(글은 그림 바로 옆), 그동안 선은 그림 바깥 가장자리에서 멈춰 그림 뒤에 있다', async ({ page }) => {
    await page.goto('/');
    const vp = page.viewportSize()!;
    const frame = page.locator('[data-scene="grow"] [data-grow] [class*="frame"]');
    await into(page, 'grow', -0.3);
    const a = (await frame.boundingBox())!;
    await into(page, 'grow', 0.75);
    const b = (await frame.boundingBox())!;
    expect(a.width).toBeGreaterThan(b.width * 0.95);                          // 들어오는 첫 순간부터 거의 다 큰 크기
    if (vp.width === 1440) expect(b.width).toBeGreaterThan(vp.width * 0.55);   // 글을 그림 옆에 붙인 배치(1440×900) — 빈 여백을 잘라 낸 그림이라 넓이 대신 폭으로
    expect(b.y + b.height).toBeLessThan(vp.height);
    expect(await page.locator('[data-scene="grow"] [data-grow]').evaluate((e) => getComputedStyle(e).transform)).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
    const side = (await page.locator('[data-scene="grow"] [class*="side"]').boundingBox())!;
    expect(side.x - (b.x + b.width)).toBeLessThan(80);                         // 글은 그림 바로 옆
    expect(side.x).toBeGreaterThan(b.x + b.width);
    // 보이는 선은 그림 상자 밖에만 있고, 그림과 40px 가까이 띄운다(가장자리를 따라 그리지 않는다)
    const box = (await hidden(page, 'grow'))[0], pts = await shown(page, 'grow');
    for (const q of pts) expect(q.x < box.l - 1 || q.x > box.r + 1 || q.y < box.t - 1 || q.y > box.b + 1).toBe(true);
    expect(pts.filter((q) => q.y > box.t && q.y < box.b && Math.abs(q.x - box.r) < 30).length).toBe(0);
  });

  test('병원: 스크롤이 전·후 비교의 가운데 선을 옮기는 동안 잇는 선은 비교 뒤에 있다 — 손으로 옮기면 그때부터는 손이 정한다', async ({ page }) => {
    await page.goto('/');
    const ba = page.locator('[data-scene="sweep"] [data-ba]');
    const x = () => ba.evaluate((e) => parseFloat((e as HTMLElement).style.getPropertyValue('--x')));
    await into(page, 'sweep', 0.08);
    const x0 = await x();
    await into(page, 'sweep', 0.5);
    const x1 = await x();
    expect(x0).toBeGreaterThan(x1 + 25);
    const b = (await ba.boundingBox())!, pts = await shown(page, 'sweep');
    expect(pts.filter((q) => q.x > b.x && q.x < b.x + b.width && q.y > b.y && q.y < b.y + b.height).length).toBe(0);
    await ba.locator('input').focus(); await page.keyboard.press('ArrowRight');
    const xm = await x();
    await into(page, 'sweep', 0.6);
    expect(await x()).toBe(xm);
  });

  test('근무표: 표시줄 자리가 그림 위로 크게 열리는 동안 선은 그림 뒤에 있다 — 두 번째 화면으로 바꾸면 확대는 숨는다', async ({ page }) => {
    await page.goto('/');
    const fd = page.locator('[data-scene="zoom"] [data-zoomed]');
    await into(page, 'zoom', 0.05);
    expect(await fd.evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
    await into(page, 'zoom', 0.8);
    await expect(fd).toHaveAttribute('data-open', '');
    const img = (await page.locator('[data-scene="zoom"] [data-zoomed] img').boundingBox())!, src = (await page.locator('[data-scene="zoom"] [data-two] [class*="frame"]').boundingBox())!;
    expect(img.width).toBeGreaterThan(src.width * 0.396 * 1.8);
    const pts = await shown(page, 'zoom');
    expect(pts.filter((q) => q.x > src.x && q.x < src.x + src.width && q.y > src.y && q.y < src.y + src.height).length).toBe(0);
    const side = (await page.locator('[data-scene="zoom"] [class*="side"]').boundingBox())!;
    expect(src.x - (side.x + side.width)).toBeLessThan(80);                    // 글은 그림 바로 옆
    await page.locator('[data-work="shift-board"]').getByRole('button', { name: '내려받기 전 확인' }).click();
    await expect.poll(() => fd.evaluate((e) => getComputedStyle(e).visibility)).toBe('hidden');
  });

  test('가로선 정리: 작업 사이·서비스 목록 위 선은 없고, 근무표와 문의 장 사이에는 글 폭의 흐린 선 하나', async ({ page }) => {
    await page.goto('/');
    const bw = (sel: string) => page.locator(sel).evaluateAll((es) => es.map((e) => parseFloat(getComputedStyle(e).borderTopWidth)));
    expect(await bw('[data-sec="contact"]')).toEqual([0]);   // 화면 끝까지 차는 선은 없다
    const sh = await page.locator('[data-sec="contact"] [class*="__sh"]').first().evaluate((e) => { const r = e.getBoundingClientRect(), w = e.closest('[class*="__wrap"]')!, c = getComputedStyle(w); return { bw: parseFloat(getComputedStyle(e).borderTopWidth), color: getComputedStyle(e).borderTopColor, w: r.width, inner: w.clientWidth - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight) }; });
    expect(sh.bw).toBe(1); expect(sh.color).toBe('rgba(250, 249, 246, 0.16)');
    expect(Math.abs(sh.w - sh.inner)).toBeLessThan(1);           // 글 폭
    expect(sh.w).toBeLessThan(page.viewportSize()!.width - 20);
    expect((await bw('[data-work]')).every((w) => w === 0)).toBe(true);
    expect(await page.locator('[data-can]').first().evaluate((e) => parseFloat(getComputedStyle(e.parentElement!).borderTopWidth))).toBe(0);
  });

  test('스크롤 프레임에서는 위치를 읽지 않는다 — 프로젝트 장면을 휠로 내리고 올리는 동안 위치 읽기·경로 길이 재기가 없다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
    const [y0, y1] = await page.evaluate(() => { const a = document.querySelector('[data-work="por-favor-harry"]')!.getBoundingClientRect(), b = document.querySelector('[data-work="shift-board"]')!.getBoundingClientRect(); return [a.top + scrollY - innerHeight * 0.3, b.bottom + scrollY - innerHeight * 0.5]; });
    await scrollToY(page, y0); await page.waitForTimeout(500);
    await page.evaluate(() => {
      const w = window as unknown as { __reads: number }; w.__reads = 0;
      for (const [o, k] of [[Element.prototype, 'getBoundingClientRect'], [SVGGeometryElement.prototype, 'getTotalLength'], [SVGGeometryElement.prototype, 'getPointAtLength']] as const) {
        const f = (o as unknown as Record<string, (...a: unknown[]) => unknown>)[k];
        (o as unknown as Record<string, unknown>)[k] = function (this: unknown, ...a: unknown[]) { w.__reads++; return f.apply(this, a); };
      }
    });
    await page.mouse.move(600, 400);
    for (let y = y0; y < y1; y += 150) { await page.mouse.wheel(0, 150); await page.waitForTimeout(40); }
    for (let y = y1; y > y0; y -= 600) { await page.mouse.wheel(0, -600); await page.waitForTimeout(40); }
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => (window as unknown as { __reads: number }).__reads)).toBe(0);
  });

  test('작업 판에서는 선 끝 점(흰 점)이 켜지지 않는다 — 선이 그림에서 멈췄다 나와도 깜빡이지 않게', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const [y0, y1] = await page.evaluate(() => { const w = document.querySelector('[data-sec="work"]')!.getBoundingClientRect(); return [w.top + scrollY - innerHeight * 0.5, w.bottom + scrollY - innerHeight]; });
    await page.evaluate(() => { const w = window as unknown as { __tips: number }; w.__tips = 0;
      const f = () => { w.__tips += document.querySelectorAll('[data-sec="work"] [data-thread] circle[data-on]').length; requestAnimationFrame(f); }; requestAnimationFrame(f); });
    for (let y = y0; y < y1; y += 220) { await scrollToY(page, y); await page.waitForTimeout(60); }
    expect(await page.evaluate(() => (window as unknown as { __tips: number }).__tips)).toBe(0);
  });

  test('머리글 낱말: 화면에 닿기 전엔 흐리고, 지나면 채워진다', async ({ page }) => {
    await page.goto('/');
    const lead = page.locator('[data-sec="can"] [data-fill]').first();
    await expect(lead.locator('[data-w][data-on]')).toHaveCount(0);
    await lead.evaluate((e) => { const y = e.getBoundingClientRect().top + scrollY - 120; const l = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis; if (l) l.scrollTo(y, { immediate: true }); else scrollTo(0, y); });
    await expect.poll(async () => (await lead.locator('[data-w]').count()) - (await lead.locator('[data-w][data-on]').count())).toBe(0);
  });

  test('빠르게 오가도 장면은 그 자리 상태 — 천천히 와서 본 것과 같다', async ({ page }) => {
    await page.goto('/');
    const state = () => page.evaluate(() => ({
      st: [...document.querySelectorAll<HTMLElement>('[data-step]')].map((e) => e.dataset.st),
      f: (+(document.querySelector('[data-focus]') as HTMLElement).style.getPropertyValue('--f')).toFixed(1),
      edge: (document.querySelector('[data-scene="dark"] [data-stage]') as HTMLElement).style.getPropertyValue('--edge'),
      x: (document.querySelector('[data-ba]') as HTMLElement).style.getPropertyValue('--x'),
    }));
    const target = await page.evaluate(() => { const e = document.querySelector('[data-scene="steps"]')!.getBoundingClientRect(); return e.top + scrollY + (e.height - innerHeight) * 0.5; });
    for (let y = 0; y <= target; y += 300) await page.evaluate((y) => scrollTo(0, y), y);
    await scrollToY(page, target); await page.waitForTimeout(900);
    const slow = await state();
    for (const y of [1e6, 0, 1e6 / 2, 4000, 0]) await scrollToY(page, y);
    await scrollToY(page, target); await page.waitForTimeout(900);
    expect(await state()).toEqual(slow);
  });

  test('헤더 메뉴는 Projects 와 문의 둘뿐이다(「할 수 있는 일」 링크 없음)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header a[href="#can"]')).toHaveCount(0);
    await expect(page.locator('header nav').getByRole('link')).toHaveText(['Projects']);
    await expect(page.locator('header nav').getByRole('button')).toHaveText(['문의']);
  });

  test('첫 화면이 창 한 장 안에 든다(단추까지)', async ({ page }) => {
    await page.goto('/');
    const b = (await page.locator('[data-sec="hero"]').getByRole('button', { name: /프로젝트 문의/ }).boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  });
});

test.describe('홈 — 폰', () => {
  test.skip(({ isMobile }) => !isMobile, '폰 전용');

  test('큰 글자(폰): 「불편한지」가 제목보다 크고, 밑줄을 지난 뒤 초점이 잡힌다 — 「듣습니다.」는 밑줄 아래 줄', async ({ page }) => {
    await page.goto('/');
    const h1 = await page.locator('#home-h1').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    const big = page.locator('[data-mark="find"]');
    expect(await big.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(h1 * 1.4);
    const y = await page.evaluate(() => { const e = document.querySelector('[data-scene="focus"]')!.getBoundingClientRect(); return e.top + scrollY + (e.height - innerHeight) * 0.62; });
    await scrollToY(page, y); await page.waitForTimeout(700);
    expect(await page.locator('[data-focus]').evaluate((e) => (e as HTMLElement).style.getPropertyValue('--f'))).toBe('1.000');
    const b = (await big.boundingBox())!, far = (await page.locator('[data-focus] [data-dim]').last().boundingBox())!;
    expect(far.y).toBeGreaterThan(b.y + b.height + 12);
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
    const v0 = Number(await range.inputValue());
    for (let i = 0; i < 10; i++) await page.keyboard.press(v0 > 50 ? 'ArrowLeft' : 'ArrowRight');
    await expect.poll(() => ba.evaluate((e) => e.style.getPropertyValue('--x'))).toBe(String(v0 > 50 ? v0 - 10 : v0 + 10) + '%');
    await range.fill('20');
    await expect.poll(() => ba.evaluate((e) => e.style.getPropertyValue('--x'))).toBe('20%');
    const r = await ba.evaluate((e) => { const c = e.querySelector<HTMLElement>('[class*="baBefore"]')!; return getComputedStyle(c).clipPath; });
    expect(r).toContain('inset');
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

  test('두 화면 전환의 첫 캡처는 틀을 가득 채운다(병원 비교처럼) — 틀 안에 빈 띠가 없다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    for (const slug of ['por-favor-harry', 'shift-board']) {
      const im0 = page.locator('[data-work="' + slug + '"] [data-two] [data-on] img');
      await im0.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
      await expect.poll(() => im0.evaluate((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
      const r = await im0.evaluate((img) => {
        const i = img.getBoundingClientRect(), fr = img.closest('[class*="frame"]')!, f = fr.getBoundingClientRect(), b = fr.clientLeft;
        const im = img as HTMLImageElement, k = Math.min(i.width / im.naturalWidth, i.height / im.naturalHeight);
        return { dw: f.width - 2 * b - im.naturalWidth * k, dh: f.height - 2 * b - im.naturalHeight * k, tol: Math.max(2, f.width * 0.003) };   // 큰 화면의 비율 반올림(0.3%)까지
      });
      expect(Math.abs(r.dw), slug).toBeLessThan(r.tol); expect(Math.abs(r.dh), slug).toBeLessThan(r.tol);
    }
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

  test('남색 구간(작업·문의) 위에서는 헤더가 남색, 위로 돌아가면 원래대로', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-hdr-dark', '');
    const top = await page.locator('[data-work="problem-bank"]').evaluate((e) => e.getBoundingClientRect().top + scrollY);
    await scrollToY(page, top + 100);
    await expect(page.locator('html')).toHaveAttribute('data-hdr-dark', '');
    await scrollToY(page, 1e6);
    await expect(page.locator('html')).toHaveAttribute('data-hdr-dark', '');
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

test('잇는 선은 글자 위를 지나지 않는다(머리글도) — 움직임 없는 배치에서 장면 선 전부', async ({ browser, isMobile }, info) => {
  const vp = info.project.use.viewport!;
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: vp, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '');
  const r = await page.evaluate(() => {
    const pts: { x: number; y: number }[] = [];
    for (const p of document.querySelectorAll<SVGPathElement>('[data-thread] path[class*="threadInk"]')) {
      const m = p.getScreenCTM()!, L = p.getTotalLength();
      // 그림 뒤로 지나는 구간(가림 상자 안)은 보이지 않으니 빼고 센다
      const boxes = [...p.ownerSVGElement!.querySelectorAll('mask rect[fill="#000"]')].map((r) => { const g = (k: string) => +r.getAttribute(k)!, x = g('x') * m.a + m.e, y = g('y') * m.d + m.f; return { left: x, top: y, right: x + g('width') * m.a, bottom: y + g('height') * m.d }; });
      for (let i = 0; i <= Math.ceil(L / 3); i++) { const q = p.getPointAtLength(Math.min(L, i * 3)), x = q.x * m.a + m.e, y = q.y * m.d + m.f; if (!boxes.some((b) => x > b.left && x < b.right && y > b.top && y < b.bottom)) pts.push({ x, y }); }
    }
    const rects: { r: DOMRect; t: string }[] = [];
    const tw = document.createTreeWalker(document.querySelector('[data-home]')!, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.textContent?.trim() || n.parentElement?.closest('svg,[aria-hidden="true"],[data-ba],[data-mark]')) continue;   // [data-mark]: 선이 밑줄을 긋는 낱말
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) rects.push({ r, t: n.textContent.trim().slice(0, 20) });
    }
    const hit = new Set<string>();
    for (const q of pts) for (const { r, t } of rects) if (q.x > r.left + 2 && q.x < r.right - 2 && q.y > r.top + 2 && q.y < r.bottom - 2) hit.add(t);
    return [...hit];
  });
  expect(r).toEqual([]);
  await ctx.close();
});

test.describe('홈 — 기준 SVG & 와 잇는 선의 출구·입구', () => {
  /** & 안의 점(보기 상자 왼쪽 위 기준) → 화면 좌표 */
  const at = (which: 'hero' | 'contact', p: { x: number; y: number }) => `(() => { const m = document.querySelector('[data-amp="${which}"]').getScreenCTM(); return { x: ${p.x + AMP_VB[0]} * m.a + m.e, y: ${p.y + AMP_VB[1]} * m.d + m.f }; })()`;
  const ink = `document.querySelector('[data-thread] path[class*="threadInk"]:not([class*="threadLight"])')`;
  /** 마지막 장면(문의) 선 */
  const last = `[...document.querySelectorAll('[data-thread] path[class*="threadInk"]')].at(-1)`;

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
    const gap = () => page.evaluate(`(() => { const t = ${at('contact', AMP_TIP)}; const p = ${last}, m = p.getScreenCTM();
      const e = p.getPointAtLength(p.getTotalLength()); return Math.hypot(e.x * m.a + m.e - t.x, e.y * m.d + m.f - t.y); })()`) as Promise<number>;
    await expect.poll(gap, { timeout: 5000 }).toBeLessThanOrEqual(0.6);
    const r = await page.evaluate(`(() => { const t = ${at('contact', AMP_TIP)}; const p = ${last}, L = p.getTotalLength();
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

  test('역방향: 끝까지 내렸다가 맨 위로 돌아오면 & 와 장면이 처음 상태로 돌아간다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await scrollToY(page, 1e6); await page.waitForTimeout(300); await scrollToY(page, 1e6);
    await expect(page.locator('[data-amp="contact"]')).toHaveAttribute('data-drawn', '', { timeout: 5000 });
    await scrollToY(page, 0);
    await expect(page.locator('[data-amp="contact"]')).not.toHaveAttribute('data-drawn', '', { timeout: 5000 });
    await expect.poll(() => page.locator('[data-step]').evaluateAll((es) => es.map((e) => (e as HTMLElement).dataset.st)), { timeout: 5000 }).toEqual(['next', 'later', 'later']);
    await expect.poll(() => page.locator('[data-scene="dark"] [data-stage]').evaluate((e) => parseFloat((e as HTMLElement).style.getPropertyValue('--edge'))), { timeout: 5000 }).toBe(0);
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

  test('내부 링크로 중간(#work)에 들어와도 지난 장면은 이미 지난 상태로 바로 보인다', async ({ page }) => {
    await page.goto('/#work');
    await page.waitForTimeout(600);
    await expect.poll(() => page.locator('[data-step]').evaluateAll((es) => es.map((e) => (e as HTMLElement).dataset.st)), { timeout: 4000 }).toEqual(['past', 'past', 'on']);
    expect(await page.locator('[data-focus]').evaluate((e) => (e as HTMLElement).style.getPropertyValue('--f'))).toBe('1.000');
  });
});
