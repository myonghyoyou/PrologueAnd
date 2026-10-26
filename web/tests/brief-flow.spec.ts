import { test, expect } from '@playwright/test';
import { fromKo, seedBrief } from './brief-ko';

test('요청서 페이지: 제목·대표 주소·머리글(브랜드+문의만)·바닥글 없음', async ({ page }) => {
  await page.goto('/tools/brief');
  await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
  expect(await page.title()).toBe('홈페이지 요청서 만들기 · Prologue&');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.prologueand.com/tools/brief');
  await expect(page.locator('header [data-brand]')).toBeVisible();
  await expect(page.locator('header [data-open-drawer]')).toBeVisible();
  await expect(page.locator('header a[href="/projects"]')).toHaveCount(0);
  await expect(page.locator('[data-footer]')).toHaveCount(0);
  await expect(page.locator('[data-brief]')).toHaveCount(1);
});

test('기존 머리글 형태는 그대로', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header a[href="/projects"]')).toHaveCount(1);
  await page.goto('/projects');
  await expect(page.locator('header [data-nav-current]')).toHaveText('Projects');
});

import type { Page } from '@playwright/test';
import type { StepId } from '../lib/brief/types';

async function next(page: Page) { await page.locator('[data-brief-next]').click(); }
async function pick(page: Page, name: string) { await page.getByRole('radio', { name, exact: true }).check({ force: true }); }

test.describe('질문 흐름', () => {
  test('필수(어떤 곳·주 목적)를 비우면 넘어가지 않고 한 줄 오류', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
    await pick(page, '새로 만들기'); await next(page);
    await expect(page.locator('h1')).toHaveText('어떤 업종인가요?');
    await next(page);
    await expect(page.locator('[data-brief-error]')).toHaveText('하나를 골라 주세요');
    await expect(page.locator('h1')).toHaveText('어떤 업종인가요?');
  });

  test('리뉴얼이면 기존 홈페이지 단계가 나오고, 새로 만들기면 안 나온다', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
    await pick(page, '기존 홈페이지 리뉴얼'); await next(page);
    await expect(page.locator('h1')).toHaveText('기존 홈페이지 정보를 알려 주세요');
    await expect(page.locator('[data-brief-progress]')).toContainText('어떤 홈페이지 · 4단계 중 1단계');
    await page.locator('[data-brief-prev]').click();
    await pick(page, '새로 만들기'); await next(page);
    await expect(page.locator('[data-brief-progress]')).toContainText('어떤 홈페이지 · 4단계 중 1단계');
  });

  test('예약을 고르면 이어 질문, 「견적에 크게 영향」을 누르면 이유가 펼쳐진다', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
    await pick(page, '새로 만들기'); await next(page);
    await pick(page, '가게(식당·카페 등)'); await next(page);
    await pick(page, '예약'); await next(page);
    await next(page); await next(page);                       // 누가 보나요, 페이지
    await expect(page.locator('h1')).toHaveText('홈페이지에 어떤 기능이 필요하세요?');
    await page.locator('[data-feature="booking"] [data-seg="must"]').click();
    await expect(page.getByText('예약은 어떻게 받으실 건가요?')).toBeVisible();
    // 누르지 않아도 이유가 펼쳐져 있다 — 읽지 않고 넘어가 나중에 견적가에 놀라지 않게
    await expect(page.locator('[data-feature="booking"] [data-impact-why]')).toBeVisible();
  });

  test('새로고침해도 단계와 답이 그대로, 이전으로 가도 답 유지', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
    await pick(page, '새로 만들기'); await next(page);
    await pick(page, '회사·사무실'); await page.locator('[data-brief-name]').fill('테스트 상사'); await next(page);
    await page.reload();
    await expect(page.locator('h1')).toHaveText('홈페이지의 가장 중요한 목적은 무엇인가요?');
    await page.locator('[data-brief-prev]').click();
    await expect(page.getByRole('radio', { name: '회사·사무실', exact: true })).toBeChecked();
    await expect(page.locator('[data-brief-name]')).toHaveValue('테스트 상사');
  });

  test('긴 질문 아래까지 내린 뒤 다음을 누르면 새 질문 제목이 화면 위에 보인다', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
    await pick(page, '새로 만들기'); await next(page);
    await pick(page, '가게(식당·카페 등)'); await next(page);
    await pick(page, '예약'); await next(page); await next(page); await next(page);
    await page.locator('[data-brief-next]').scrollIntoViewIfNeeded();
    await next(page);
    const top = await page.locator('h1').evaluate((h) => h.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(260);
  });

  test('저장이 막힌 브라우저: 안내 한 줄, 흐름은 동작', async ({ browser }) => {
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError'); } });
    });
    const page = await ctx.newPage();
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
    await expect(page.locator('[data-brief-nostore]')).toContainText('새로고침하면 답이 사라져요');
    await pick(page, '새로 만들기'); await next(page);
    await expect(page.locator('h1')).toHaveText('어떤 업종인가요?');
    await ctx.close();
  });

  test('폰: 가로 스크롤 없음, 하단 단추가 마지막 선택지를 가리지 않는다', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone');
    await page.goto('/tools/brief');
    await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await pick(page, '새로 만들기'); await next(page);
    const last = page.getByRole('radio', { name: '직접 입력', exact: true }).locator('xpath=..');
    await last.scrollIntoViewIfNeeded();
    const lb = (await last.boundingBox())!, bar = (await page.locator('[data-brief-bar]').boundingBox())!;
    expect(lb.y + lb.height).toBeLessThanOrEqual(bar.y + 1);
  });
});

test('기능 아래 이어 질문은 작은 선택지로 한 줄에 놓인다(넓은 화면)', async ({ page }, info) => {
  test.skip(info.project.name !== 'w1440');
  await page.goto('/tools/brief');
  await page.locator('[data-brief-start]').click();   // 시작 화면(명세 §11)
  await pick(page, '새로 만들기'); await next(page);
  await pick(page, '가게(식당·카페 등)'); await next(page);
  await pick(page, '예약'); await next(page); await next(page); await next(page);
  await page.locator('[data-feature="booking"] [data-seg="must"]').click();
  const tops = await page.locator('[data-feature="booking"] input[type="radio"]').evaluateAll((els) => els.map((e) => Math.round(e.parentElement!.getBoundingClientRect().top)));
  expect(tops).toHaveLength(3);
  expect(new Set(tops).size).toBe(1);
});

test.describe('최종 검토 보완 — 질문', () => {
  const seed = (page: Page, answers: Record<string, unknown>, step: StepId, done = false) => seedBrief(page, fromKo(answers), step, done);
  test('모르겠어요를 누르면 그 단계에서 고른 답이 지워진다', async ({ page }) => {
    await seed(page, { mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기', design: '새 디자인을 맞춤으로 만들어 주세요' }, 'design');
    await page.getByRole('button', { name: '모르겠어요', exact: true }).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('prologue.brief.v2')!).answers.design);
    expect(saved).toBe('unknown');   // 모르겠어요의 id
  });
  test('외국인이 본다고 하면 외국어 페이지를 제안한다', async ({ page }) => {
    await seed(page, { mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기', audience: ['외국인'] }, 'features');
    await expect(page.locator('[data-feature="multilang"] [data-suggest]')).toBeVisible();
  });
  test('단원 고치기 중에도 다음 질문으로 갈 수 있다', async ({ page }) => {
    await seed(page, { mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, 'when', true);
    await page.locator('[data-edit="kind"]').click();
    await page.locator('[data-brief-step-next]').click();
    await expect(page.locator('h1')).toHaveText('홈페이지의 가장 중요한 목적은 무엇인가요?');
  });
});
