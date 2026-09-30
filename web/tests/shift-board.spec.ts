import { test, expect } from '@playwright/test';
import { bannedWords } from './banned';

// 교대 근무표 상세 (명세 docs/superpowers/specs/2026-09-30-shift-board-case-design.md)
const URL = '/projects/shift-board';
const BANNED = ['지금 운영', '도입 후', '절감', ...(bannedWords() ?? [])];
const note = (page: import('@playwright/test').Page, i: number) => page.locator('#screens [data-block="note"]').nth(i);

test('표지 제목·소개가 명세 문구다', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('[data-cover-title] h1')).toHaveText('엑셀로 따로 짜서 합친 뒤공지하던 근무표');
  await expect(page.locator('[data-summary]')).toHaveText([
    '순번은 지난달 파일을 열어 마지막 근무자를 찾고, 그다음 사람부터 한 칸씩 세어 적었습니다.',
    '잘못 센 칸이나 퇴사한 분의 이름은 공지가 나간 뒤에야 드러났습니다.',
  ]);
  await expect(page.locator('[data-pin-note]')).toHaveText([
    '1담당자 한 명의 파일이 늦으면, 합친 파일에서 그 담당의 세로줄이 통째로 비었습니다.',
    '2정민준 님이 3월 2일과 5일, 한 주에 두 번 들어가 있습니다. 눈으로 찾기 전에는 알 수 없었습니다.',
    '3문민준 님은 이미 퇴사한 분입니다. 지난달 파일을 복사해 쓰다 보니 이름이 그대로 남았습니다.',
  ]);
});

test('표지: 번호 셋이 틀 안, 서로 원 지름의 세 배 이상(폰 포함)', async ({ page }) => {
  await page.goto(URL);
  const r = await page.evaluate(() => {
    const f = document.querySelector<HTMLElement>('[data-hero-pinned] [data-frame]')!.getBoundingClientRect();
    const pins = [...document.querySelectorAll<HTMLElement>('[data-hero-pinned] [data-pin]')].map((p) => p.getBoundingClientRect());
    const c = pins.map((p) => ({ x: p.left + p.width / 2, y: p.top + p.height / 2, d: p.width }));
    let min = Infinity;
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) min = Math.min(min, Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y));
    return { n: pins.length, inside: pins.every((p) => p.left >= f.left && p.right <= f.right && p.top >= f.top && p.bottom <= f.bottom), gap: min / c[0].d };
  });
  expect(r.n).toBe(3);
  expect(r.inside).toBe(true);
  expect(r.gap).toBeGreaterThanOrEqual(3);
});

test('폰: 표지 제목은 두 줄', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto(URL);
  const lines = await page.locator('[data-cover-title] h1').evaluate((h) => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)));
  expect(lines).toBe(2);
});

test('장 순서: 문제 · 짜는 순서 · 화면', async ({ page }) => {
  await page.goto(URL);
  expect(await page.locator('[data-chapter]').evaluateAll((cs) => cs.map((c) => c.id))).toEqual(['problem', 'order', 'screens']);
});

test('01: 흐름 세 갈래, 표 6행 3열, 인용 하나', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#problem [data-src-label]')).toHaveText(['A권역', 'B권역', '대기 조']);
  const t = page.locator('#problem [data-table]');
  await expect(t.locator('tbody tr')).toHaveCount(6);
  await expect(t.locator('thead th')).toHaveText(['구분', '전에는', '이 화면에서는']);
  await expect(page.locator('#problem blockquote')).toHaveCount(1);
});

test('01 흐름: 이름표가 상자 안(Review Focus 4)', async ({ page }) => {
  await page.goto(URL);
  const out = await page.evaluate(() => {
    const box = document.querySelector<HTMLElement>('#problem [data-flow]')!.getBoundingClientRect();
    return [...document.querySelectorAll<SVGTextElement>('#problem [data-flow] text')].some((t) => {
      const r = t.getBoundingClientRect();
      return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1);
    });
  });
  expect(out).toBe(false);
});

test('02 순서 비교: 두 줄 다섯 칸, 마지막 칸 같은 글자, 데스크톱은 같은 순번 칸이 세로로 맞는다', async ({ page, isMobile }) => {
  await page.goto(URL);
  const rows = page.locator('#order [data-steps-row]');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).locator('[data-step]')).toHaveText(['지난달 순번 찾기', '한 칸씩 세어 적기', '휴일·구역 맞추기', '세 파일 합치기', '결재·공지']);
  await expect(rows.nth(1).locator('[data-step]')).toHaveText(['자동 편성', '손으로 조정', '편성 확정', '점검 후 내려받기', '결재·공지']);
  test.skip(!!isMobile, '정렬 비교는 데스크톱');
  const d = await rows.evaluateAll((rs) => {
    const L = rs.map((r) => [...r.querySelectorAll<HTMLElement>('[data-step]')].map((s) => s.getBoundingClientRect().left));
    return Math.max(...L[0].map((x, i) => Math.abs(x - L[1][i])));
  });
  expect(d).toBeLessThanOrEqual(1);
});

for (const w of [390, 700, 1023, 1024]) {
  test(`창 폭 ${w}: 순서 비교 칸이 겹치지 않고 가로 스크롤 없음`, async ({ page }) => {
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

test('03: 여백 주석 여섯, 모두 "전에는", 휴대폰 칸 없음', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#screens [data-block="note"]')).toHaveCount(6);
  await expect(page.locator('#screens [data-was]')).toHaveCount(6);
  await expect(page.locator('#screens [data-block="phones"]')).toHaveCount(0);
});

test.describe('03 전환 주석 둘', () => {
  test.beforeEach(async ({ page }) => { await page.goto(URL); });

  test('3번 "날짜 맞바꾸기 · 다른 분으로", 4번 "내려받기 전 · 미편성 미리보기", 글 칸 안, 기본은 첫 칸', async ({ page }) => {
    for (const [i, names] of [[2, ['날짜 맞바꾸기', '다른 분으로']], [3, ['내려받기 전', '미편성 미리보기']]] as const) {
      const tg = note(page, i).locator('[data-note-text] [data-side-toggle]');
      await expect(tg.locator('button')).toHaveText([...names]);
      await expect(note(page, i).locator('button[data-side="after"]')).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('전환 두 주석은 서로 상태를 나누지 않는다(Review Focus 1)', async ({ page }) => {
    await note(page, 2).locator('button[data-side="before"]').click();
    await expect(note(page, 2).locator('[data-swap]')).toHaveAttribute('data-side', 'before');
    await expect(note(page, 3).locator('[data-swap]')).toHaveAttribute('data-side', 'after');
    await note(page, 3).locator('button[data-side="before"]').click();
    await note(page, 2).locator('button[data-side="after"]').click();
    await expect(note(page, 2).locator('[data-swap]')).toHaveAttribute('data-side', 'after');
    await expect(note(page, 3).locator('[data-swap]')).toHaveAttribute('data-side', 'before');
  });

  test('전환 두 그림은 화면에서 같은 크기(틀이 흔들리지 않는다)', async ({ page }) => {
    for (const i of [2, 3]) {
      const d = await note(page, i).evaluate((n) => {
        const a = n.querySelector('[data-swap] img')!.getBoundingClientRect();
        const b = n.querySelector('[data-before] img')!.getBoundingClientRect();
        return Math.max(Math.abs(a.width - b.width), Math.abs(a.height - b.height));
      });
      expect(d).toBeLessThanOrEqual(1);
    }
  });

  test('데스크톱: 전환 주석 그림의 윗변이 이웃 주석처럼 글 칸 윗변과 같은 높이', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱');
    const off = await page.locator('#screens [data-block="note"]').evaluateAll((ns) => ns.map((n) =>
      n.querySelector('[data-frame]')!.getBoundingClientRect().top - n.querySelector('[data-note-text]')!.getBoundingClientRect().top));
    for (const o of off) expect(Math.abs(o - off[0])).toBeLessThanOrEqual(1);
  });

  for (const w of [1023, 1024]) {
    test(`창 폭 ${w}: 단추가 글·그림과 겹치지 않는다`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(URL);
      for (const i of [2, 3]) {
        const hit = await note(page, i).evaluate((el) => {
          const t = el.querySelector('[data-side-toggle]')!.getBoundingClientRect();
          const f = el.querySelector('[data-frame]')!.getBoundingClientRect();
          const p = [...el.querySelectorAll('[data-note-text] p')].map((x) => x.getBoundingClientRect());
          const ov = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
          return ov(t, f) || p.some((x) => ov(t, x));
        });
        expect(hit).toBe(false);
      }
    });
  }
});

test('모션 줄이기: 전환은 즉시', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  for (const d of await page.locator('#screens [data-before]').evaluateAll((es) => es.map((e) => getComputedStyle(e).transitionDuration))) expect(d).toBe('0s');
  await ctx.close();
});

test('03 5번 핫스팟: 목록에 초점을 주면 강조 상자가 그림 틀 안에 뜬다', async ({ page }) => {
  await page.goto(URL);
  // 강조 상자(data-spot-hl)는 고른 항목이 없으면 크기 0 — 목록 항목(data-spot)에 초점을 줘서 켠다
  await note(page, 4).locator('[data-spot="0"]').focus();
  await expect.poll(() => note(page, 4).locator('[data-spot-hl]').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  const r = await note(page, 4).evaluate((n) => {
    const f = n.querySelector('[data-frame]')!.getBoundingClientRect();
    const s = n.querySelector('[data-spot-hl]')!.getBoundingClientRect();
    return { area: s.width * s.height, inside: s.left >= f.left - 1 && s.right <= f.right + 1 && s.top >= f.top - 1 && s.bottom <= f.bottom + 1 };
  });
  expect(r.area).toBeGreaterThan(0);
  expect(r.inside).toBe(true);
});

test('폰: 가로 스크롤 없음', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용');
  await page.goto(URL);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('본문·alt: 운영·효과 주장과 공개하지 않는 낱말이 없고, "전에는" 문장이 겹치지 않는다', async ({ page }) => {
  await page.goto(URL);
  const text = await page.evaluate(() => document.querySelector('main')!.innerText + ' ' + [...document.querySelectorAll('main img')].map((i) => i.getAttribute('alt') ?? '').join(' '));
  for (const w of BANNED) expect(text, w).not.toContain(w);
  const was = await page.locator('#screens [data-was]').allInnerTexts();
  expect(new Set(was).size).toBe(was.length);
  // "공지가 나간 뒤에야"는 표지 소개 한 곳만(명세 5-1 같은 사실은 한 번)
  expect((text.match(/공지가 나간 뒤에야/g) ?? []).length).toBe(1);
});

test('확인 목록 문구: 같은 틀·같은 사실을 되풀이하지 않는다', async ({ page }) => {
  await page.goto(URL);
  const main = await page.evaluate(() => document.querySelector('main')!.innerText);
  // "칸을 다 채우면 그대로 결재로 넘어갔다"(02)와 같은 틀의 "결재는 그대로 올라갔다"를 03 에서 되풀이하지 않는다
  expect(main).not.toContain('결재는 그대로 올라갔습니다');
  // 편성 횟수를 다시 센다는 말은 표와 5번 "전에는" 두 곳만
  expect(main).not.toContain('처음부터 다시 세어야');
  // 03 도입은 2번 주석 제목("내 담당만 고치고")과 같은 말을 하지 않는다
  expect(main).not.toContain('맡은 조만 짜고 고칩니다');
});

test('데스크톱: 01 표 칸이 줄을 넘기면 마지막 줄에 한두 글자만 남지 않는다', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 — 폰은 표가 가로로 밀린다(기존 동작)');
  await page.goto(URL);
  const short = await page.locator('#problem [data-table] td').evaluateAll((tds) => tds.flatMap((td) => {
    const r = document.createRange(); r.selectNodeContents(td);
    const lines = [...r.getClientRects()].filter((x) => x.width > 0);
    const last = lines[lines.length - 1];
    return lines.length > 1 && last.width < 40 ? [td.textContent] : [];
  }));
  expect(short).toEqual([]);
});

test('03 주석 제목: "한 달치" · "두 번" · "몇 번"이 줄 사이에서 갈라지지 않는다', async ({ page }) => {
  await page.goto(URL);
  const split = await page.locator('#screens [data-note-text] h3').evaluateAll((hs) => hs.flatMap((h) => {
    const node = h.firstChild as Text; const t = node.textContent ?? '';
    return ['한 달치', '두 번', '몇 번'].flatMap((w) => {
      const i = t.replace(/\u00a0/g, ' ').indexOf(w);
      if (i < 0) return [];
      const top = (k: number) => { const r = document.createRange(); r.setStart(node, k); r.setEnd(node, k + 1); return r.getBoundingClientRect().top; };
      return Math.abs(top(i) - top(i + w.length - 1)) > 2 ? [w] : [];
    });
  }));
  expect(split).toEqual([]);
});
