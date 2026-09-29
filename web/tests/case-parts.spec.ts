import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

test('표지: 윗줄은 프로젝트 이름만, 숫자 칸·정보 표(역할·기간·사용자·공개 범위) 없이 소개만', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-cover-title] span').first()).toHaveText('Por favor, Harry');
  await expect(page.locator('[data-num]')).toHaveCount(0);
  await expect(page.locator('[data-cover] table')).toHaveCount(0);
  const cover = await page.locator('[data-cover]').innerText();
  for (const w of ['역할', '기간', '사용자', '공개 범위']) expect(cover).not.toContain(w);
  await expect(page.locator('[data-cover] p').first()).toBeVisible();
});

test('표지 소개 문단은 표지 그림(문제 장면) 틀과 같은 폭', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  const r = await page.evaluate(() => {
    const p = document.querySelector<HTMLElement>('[data-summary]')!.getBoundingClientRect();
    const f = document.querySelector<HTMLElement>('[data-cover] [data-hero-scatter], [data-cover] [data-frame]')!.getBoundingClientRect();
    return { dl: p.left - f.left, dw: p.width - f.width };
  });
  expect(Math.abs(r.dl)).toBeLessThanOrEqual(1);
  expect(Math.abs(r.dw)).toBeLessThanOrEqual(1);
});

// 데스크톱의 요청 작성 주석은 재현 양식(form-demo.spec.ts)이라 캡처 핫스팟은 폰·모션 줄이기에서만 보인다
test('핫스팟 호버가 데이터 좌표와 맞는다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '데스크톱은 재현 양식 — form-demo.spec.ts');
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  // locator.hover() 는 요소를 화면으로 스크롤한 뒤 한 번 더 스크롤해서, mouseenter 직후 mouseleave 가 와
  // 하이라이트가 꺼지곤 했다(I5). 먼저 핫스팟이 있는 여백 주석으로 옮기고, 실제 마우스를 항목 가운데로 옮긴다.
  await scrollToY(page, await page.evaluate(() =>
    document.querySelector('[data-block="note"]:has([data-spot])')!.getBoundingClientRect().top + window.scrollY - 100));
  let spot = await page.locator('[data-spot="1"]').boundingBox();
  const vh = page.viewportSize()!.height;
  if (!spot || spot.y < 0 || spot.y + spot.height > vh) {
    // 폰: 판이 길어 목록이 첫 화면 밖이다 — 목록이 화면 가운데 오게 한 번 더 옮긴다
    await scrollToY(page, await page.evaluate(() =>
      document.querySelector('[data-spot="1"]')!.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2));
    spot = await page.locator('[data-spot="1"]').boundingBox();
  }
  await page.mouse.move(spot!.x + spot!.width / 2, spot!.y + spot!.height / 2);
  await page.waitForFunction(() => {
    const hl = document.querySelector('[data-spot-hl]') as HTMLElement | null;
    return !!hl && getComputedStyle(hl).opacity === '1';
  });
  const box = await page.evaluate(() => {
    const hl = document.querySelector('[data-spot-hl]') as HTMLElement;
    const sh = hl.parentElement as HTMLElement;
    const r = hl.getBoundingClientRect(), s = sh.getBoundingClientRect();
    return { x: Math.round(((r.left - s.left - 6) / (s.width - 12)) * 100), y: Math.round(((r.top - s.top - 6) / (s.height - 12)) * 100) };
  });
  expect(box).toEqual({ x: 15, y: 36 });
});

test('1번 핫스팟은 「어떤 요청인가요」(유형)부터 제목 칸까지 덮는다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '데스크톱은 재현 양식 — form-demo.spec.ts');
  await page.goto('/projects/por-favor-harry');
  await page.locator('[data-spot="0"]').focus();
  await page.waitForFunction(() => {
    const hl = document.querySelector('[data-spot-hl]') as HTMLElement | null;
    return !!hl && getComputedStyle(hl).opacity === '1';
  });
  const r = await page.evaluate(() => {
    const hl = document.querySelector('[data-spot-hl]') as HTMLElement;
    const box = hl.parentElement as HTMLElement;
    const a = hl.getBoundingClientRect(), b = box.getBoundingClientRect();
    const inner = b.top + box.clientTop + 6;              // 테두리 1 + 안쪽 여백 6 안쪽이 그림 윗변
    const px = (box.clientHeight - 12) / Number(box.closest<HTMLElement>('[data-frame]')!.dataset.h);   // 캡처 원본 px 기준으로 환산
    const badge = [...box.querySelectorAll<HTMLElement>('b[aria-hidden]')][0].getBoundingClientRect();
    return { top: (a.top - inner) / px, bottom: (a.bottom - inner) / px, badgeTop: badge.top - (b.top + box.clientTop) };
  });
  expect(r.top).toBeLessThanOrEqual(435);        // 「어떤 요청인가요」 라벨 윗변(form.png 원본 px)
  expect(r.top).toBeGreaterThan(361);            // 위의 「어느 시스템」 줄(업무포털 칩 글자 아래 끝 361)은 넣지 않는다
  expect(r.bottom).toBeGreaterThanOrEqual(741);  // 제목 입력칸 아래 끝
  expect(r.badgeTop).toBeGreaterThanOrEqual(0);  // 번호 뱃지가 틀 밖으로 잘리지 않는다
});

test('핫스팟 키보드 포커스가 하이라이트를 보여준다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '데스크톱은 재현 양식 — form-demo.spec.ts');
  await page.goto('/projects/por-favor-harry');
  await page.locator('[data-spot="1"]').focus();
  // focus → React state 커밋은 CDP 왕복과 비동기라, 하이라이트가 보일 때까지 기다린 뒤 좌표를 읽는다
  // (같은 이유로 transition.spec.ts의 복귀 테스트도 MutationObserver로 기다린다)
  await page.waitForFunction(() => {
    const hl = document.querySelector('[data-spot-hl]') as HTMLElement | null;
    return !!hl && getComputedStyle(hl).opacity === '1';
  });
  const box = await page.evaluate(() => {
    const hl = document.querySelector('[data-spot-hl]') as HTMLElement;
    const sh = hl.parentElement as HTMLElement;
    const r = hl.getBoundingClientRect(), s = sh.getBoundingClientRect();
    return { x: Math.round(((r.left - s.left - 6) / (s.width - 12)) * 100), y: Math.round(((r.top - s.top - 6) / (s.height - 12)) * 100) };
  });
  expect(box).toEqual({ x: 15, y: 36 });
});

test('마지막 판에 문의 버튼과 다음 이야기가 있다', async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await expect(page.locator('[data-cta]')).toBeVisible();
  await expect(page.locator('[data-teaser]')).toBeVisible();
});
