import { test, expect } from '@playwright/test';

// 문제 은행 상세 (명세 docs/superpowers/specs/2026-09-30-problem-bank-case-design.md)
const URL = '/projects/problem-bank';
const BANNED = ['문제은행', 'PC 에서'];

test('문제 은행 편이 열리고 표지 제목·소개가 명세 문구다', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('[data-cover-title] h1')).toHaveText('휴대폰으로 문제를 푸는사내 학습 앱');
  await expect(page.locator('[data-summary]')).toHaveText([
    '직원 약 200명이 해마다 문제집을 인쇄해 풀고, 한 해가 지나면 버렸습니다.',
    '문제에 오타나 잘못된 곳이 있어도 그해 문제집은 고칠 수 없었습니다.',
  ]);
});

test('표지: 번호 셋이 틀 안, 서로 원 지름의 세 배 이상 떨어진다, 소개 폭 = 틀 폭', async ({ page }) => {
  await page.goto(URL);
  const r = await page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('[data-hero-pinned] [data-frame]')!.getBoundingClientRect();
    const pins = [...document.querySelectorAll<HTMLElement>('[data-hero-pinned] [data-pin]')].map((p) => p.getBoundingClientRect());
    const c = pins.map((p) => ({ x: p.left + p.width / 2, y: p.top + p.height / 2, d: p.width }));
    let min = Infinity;
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) min = Math.min(min, Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y));
    const sum = document.querySelector<HTMLElement>('[data-summary]')!.getBoundingClientRect();
    return { n: pins.length, inside: pins.every((p) => p.left >= f.left && p.right <= f.right && p.top >= f.top && p.bottom <= f.bottom), gap: min / c[0].d, dw: Math.abs(sum.width - f.width) };
  });
  expect(r.n).toBe(3);
  expect(r.inside).toBe(true);
  expect(r.gap).toBeGreaterThanOrEqual(3);
  expect(r.dw).toBeLessThanOrEqual(1);
});

test('01 표: 5행 3열, 캡션', async ({ page }) => {
  await page.goto(URL);
  const t = page.locator('#problem [data-table]');
  await expect(t.locator('tbody tr')).toHaveCount(5);
  await expect(t.locator('thead th')).toHaveCount(3);
  await expect(t.locator('figcaption')).toHaveText('종이 문제집 열의 숫자는 웹으로 옮기기 전에 효과를 따져 보며 정리한 값입니다.');
});

test('03: 여백 주석 다섯, 휴대폰 한 묶음, "전에는" 여섯', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#screens [data-block="note"]')).toHaveCount(5);
  await expect(page.locator('#screens [data-block="phones"]')).toHaveCount(1);
  await expect(page.locator('#screens [data-was]')).toHaveCount(6);
});

test('본문·alt 에 업종 낱말, 회사 이름, 붙여 쓴 이름, "PC 에서" 가 없다', async ({ page }) => {
  await page.goto(URL);
  const text = await page.evaluate(() => document.querySelector('main')!.innerText + ' ' + [...document.querySelectorAll('main img')].map((i) => i.getAttribute('alt') ?? '').join(' '));
  for (const w of BANNED) expect(text, w).not.toContain(w);
});

test('폰: 가로 스크롤 없음', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto(URL);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('장 순서: 문제 · 푸는 순서 · 화면', async ({ page }) => {
  await page.goto(URL);
  expect(await page.locator('[data-chapter]').evaluateAll((cs) => cs.map((c) => c.id))).toEqual(['problem', 'order', 'screens']);
});

test('02 순서 비교: 두 줄 다섯 칸씩, 데스크톱은 같은 순번 칸이 세로로 맞는다', async ({ page, isMobile }) => {
  await page.goto(URL);
  const rows = page.locator('#order [data-steps-row]');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).locator('[data-step]')).toHaveText(['문제', '문제', '문제', '…', '정답표']);
  await expect(rows.nth(1).locator('[data-step]')).toHaveText(['문제', '답', '채점', '해설 · 다시 풀기', '다음 문제']);
  test.skip(!!isMobile, '정렬 비교는 데스크톱');
  const d = await page.locator('#order [data-steps-row]').evaluateAll((rs) => {
    const L = rs.map((r) => [...r.querySelectorAll<HTMLElement>('[data-step]')].map((s) => s.getBoundingClientRect().left));
    return Math.max(...L[0].map((x, i) => Math.abs(x - L[1][i])));
  });
  expect(d).toBeLessThanOrEqual(1);
});

for (const w of [1023, 1024]) {
  test(`02 순서 비교: 창 폭 ${w} 에서 칸이 겹치지 않고 가로 스크롤 없음`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(URL);
    const overlap = await page.locator('#order [data-step]').evaluateAll((ss) => {
      const b = ss.map((s) => s.getBoundingClientRect());
      for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++)
        if (b[i].left < b[j].right - 1 && b[j].left < b[i].right - 1 && b[i].top < b[j].bottom - 1 && b[j].top < b[i].bottom - 1) return true;
      return false;
    });
    expect(overlap).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test('폰: 순서 비교는 칸이 위에서 아래로 쌓인다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto(URL);
  const tops = await page.locator('#order [data-steps-row]').first().locator('[data-step]').evaluateAll((ss) => ss.map((s) => s.getBoundingClientRect().top));
  for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
});

test('태블릿(700): 순서 비교는 가로 한 줄 그대로, 같은 순번 칸이 세로로 맞는다', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto(URL);
  const d = await page.locator('#order [data-steps-row]').evaluateAll((rs) => {
    const B = rs.map((r) => [...r.querySelectorAll<HTMLElement>('[data-step]')].map((s) => s.getBoundingClientRect()));
    return { col: Math.max(...B[0].map((b, i) => Math.abs(b.left - B[1][i].left))), row: Math.max(...B[0].map((b) => Math.abs(b.top - B[0][0].top))) };
  });
  expect(d.col).toBeLessThanOrEqual(1);
  expect(d.row).toBeLessThanOrEqual(1);
});

test('01 종이 한 쌍: 라벨 두 개, 글 칸 없음, 캡션, 데스크톱은 같은 높이·표와 같은 왼쪽 선', async ({ page, isMobile }) => {
  await page.goto(URL);
  const r = page.locator('#problem [data-rule]');
  await expect(r.locator('[data-rule-tag]')).toHaveText(['7쪽 · 1번 문제', '14쪽 · 정답표']);
  await expect(r.locator('h3')).toHaveCount(0);
  await expect(r.locator('[data-rule-cap]')).toHaveText('왼쪽 1번 문제의 답은 오른쪽 정답표 첫 줄 "1. 4"입니다.');
  test.skip(!!isMobile, '높이·정렬 비교는 데스크톱');
  const m = await page.evaluate(() => {
    const cs = [...document.querySelectorAll<HTMLElement>('#problem [data-rule] [data-crop]')].map((c) => c.getBoundingClientRect());
    const t = document.querySelector<HTMLElement>('#problem [data-table]')!.getBoundingClientRect();
    return { dh: Math.abs(cs[0].height - cs[1].height), dl: Math.abs(cs[0].left - t.left) };
  });
  expect(m.dh).toBeLessThanOrEqual(1);
  expect(m.dl).toBeLessThanOrEqual(1);
});

test('01 종이 한 쌍: 종이 글자가 읽히는 크기(원본의 33% 이상 — 1280 폭에서 약 36%, 1440 에서 약 41%)', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱');
  await page.goto(URL);
  const k = await page.locator('#problem [data-rule] [data-crop-win]').first().evaluate((w) => w.getBoundingClientRect().width / 1180);
  expect(k).toBeGreaterThanOrEqual(0.33);
});

test.describe('03 1번 주석 전환', () => {
  test.beforeEach(async ({ page }) => { await page.goto(URL); });

  test('단추 두 칸 "틀렸을 때 · 정답 보기", 글 칸 안, 기본은 첫 칸', async ({ page }) => {
    const n = page.locator('#screens [data-block="note"]').first();
    const tg = n.locator('[data-note-text] [data-side-toggle]');
    await expect(tg).toHaveAttribute('aria-label', '화면 상태');
    await expect(tg.locator('button')).toHaveText(['틀렸을 때', '정답 보기']);
    await expect(n.locator('button[data-side="after"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('정답 보기를 누르면 정답 화면이 보이고, 여러 번 눌러도 마지막 쪽만 남는다', async ({ page }) => {
    const n = page.locator('#screens [data-block="note"]').first();
    await n.locator('button[data-side="before"]').click();
    await n.locator('button[data-side="after"]').click();
    await n.locator('button[data-side="before"]').click();
    await expect(n.locator('[data-swap]')).toHaveAttribute('data-side', 'before');
    await expect.poll(() => n.locator('[data-before]').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  });

  test('데스크톱: 1번 주석 그림의 윗변이 2번 주석처럼 글 칸 윗변과 같은 높이', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱');
    const off = await page.locator('#screens [data-block="note"]').evaluateAll((ns) => ns.slice(0, 2).map((n) =>
      n.querySelector('[data-frame]')!.getBoundingClientRect().top - n.querySelector('[data-note-text]')!.getBoundingClientRect().top));
    expect(Math.abs(off[0] - off[1])).toBeLessThanOrEqual(1);
  });

  for (const w of [1023, 1024]) {
    test(`창 폭 ${w}: 단추가 글·그림과 겹치지 않는다`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(URL);
      const n = page.locator('#screens [data-block="note"]').first();
      const hit = await n.evaluate((el) => {
        const t = el.querySelector('[data-side-toggle]')!.getBoundingClientRect();
        const f = el.querySelector('[data-frame]')!.getBoundingClientRect();
        const p = [...el.querySelectorAll('[data-note-text] p')].map((x) => x.getBoundingClientRect());
        const ov = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
        return ov(t, f) || p.some((x) => ov(t, x));
      });
      expect(hit).toBe(false);
    });
  }
});

test('모션 줄이기: 1번 주석 전환은 즉시', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  const d = await page.locator('#screens [data-before]').first().evaluate((e) => getComputedStyle(e).transitionDuration);
  expect(d).toBe('0s');
  await ctx.close();
});

test('폰: 표지 제목은 두 줄(한 낱말만 따로 떨어진 줄이 없다)', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto(URL);
  const lines = await page.locator('[data-cover-title] h1').evaluate((h) => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)));
  expect(lines).toBe(2);
});

test('검토 반영 문구: 같은 사실을 되풀이하지 않고, 캡처와 어긋나는 말이 없다', async ({ page }) => {
  await page.goto(URL);
  const main = await page.evaluate(() => document.querySelector('main')!.innerText);
  // 다시 도전한 답은 풀이 이력 캡처에 남아 보이므로 "기록에 남기지 않는다"는 쓰지 않는다
  expect(main).not.toContain('기록에 남기지 않습니다');
  // "담당 부서가 해마다 합쳤다"는 표와 엑셀 주석 두 곳까지
  expect((main.match(/담당 부서가 해마다/g) ?? []).length).toBeLessThanOrEqual(2);
  // "바로 채점"은 목록 소개·표·02 제목 밖에서 되풀이하지 않는다
  expect((main.match(/바로 채점/g) ?? []).length).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-pin-note]')).toHaveText([
    '1보기 옆에도, 문제 아래에도 답을 적을 칸이 없습니다.',
    '2이 쪽 문제의 정답은 일곱 쪽 뒤 14쪽에 모여 있습니다.',
    '3문제는 팀별로 나뉘어 있고, 팀 이름 아래에서 번호가 1번부터 다시 시작합니다.',
  ]);
});
