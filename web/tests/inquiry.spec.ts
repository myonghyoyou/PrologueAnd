import { test, expect } from '@playwright/test';

const ok = { need: '쓰던 시스템을 고치고 싶어요', pain: '요청이 네 갈래로 들어옵니다', email: 'a@b.com', people: '팀 (2~20명)', elapsed: 9000 };

test('필수 두 칸이 비면 400', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { pain: '', email: '', elapsed: 9000 } });
  expect(res.status()).toBe(400);
});

test('보기에 없는 값은 400', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, people: '천 명' } });
  expect(res.status()).toBe(400);
});

test('허니팟이 채워지면 200이지만 보내지 않는다', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, hp_note: 'bot' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).sent).toBe(false);
});

test('허니팟 칸은 브라우저가 자동 완성하지 않는 이름이고 탭 순서에서 빠져 있다', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('input[name="website"]')).toHaveCount(0);
  const hp = page.locator('input[name="hp_note"]');
  await expect(hp).toHaveCount(1);
  await expect(hp).toHaveAttribute('autocomplete', 'off');
  await expect(hp).toHaveAttribute('tabindex', '-1');
});

test('무엇이 필요한지는 보기 넷 중 하나, 필수 칸이 없으면 한국어 오류', async ({ request }) => {
  expect((await request.post('/api/inquiry', { data: { ...ok, need: '아무거나' } })).status()).toBe(400);
  const res = await request.post('/api/inquiry', { data: { email: 'a@b.com', elapsed: 9000 } });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toBe('지금 상황을 적어주세요');
});

test('발송 설정 확인은 값 없이 들어 있는지만 알려 준다', async ({ request }) => {
  const res = await request.get('/api/inquiry');
  expect(res.status()).toBe(200);
  const j = await res.json();
  expect(Object.keys(j).sort()).toEqual(['pass', 'passLength16', 'to', 'user']);
  expect(Object.values(j).every((v) => typeof v === 'boolean')).toBe(true);
});

test('설정이 없으면 502 와 이유 config', async ({ request }) => {
  // 테스트 서버에는 메일 환경변수가 없다
  const res = await request.post('/api/inquiry', { data: ok });
  expect(res.status()).toBe(502);
  expect((await res.json()).reason).toBe('config');
});

test('5초 미만 제출은 거른다', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, elapsed: 1200 } });
  expect(res.status()).toBe(200);
  expect((await res.json()).sent).toBe(false);
});

test('헤더 문의 버튼을 누르면 서랍이 열리고 첫 질문(무엇이 필요하세요)으로 포커스가 간다', async ({ page }) => {
  await page.goto('/projects');
  await page.click('header [data-open-drawer]');
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-drawer-open'))).toBe(true);
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  const vw = page.viewportSize()?.width ?? 1440;
  // 서랍은 .35s 동안 오른쪽에서 밀려 들어온다(translateX(100%) → none). 클릭 직후 한 번만 재면 전환 중간 값이 잡혀
  // 가끔 실패했다 — 다 들어올 때까지 기다린 뒤, 오른쪽 끝이 화면 끝에 붙고 왼쪽 끝이 화면 안에 있는지 본다
  await expect.poll(async () => {
    const b = await dialog.boundingBox();
    return b ? Math.round(b.x + b.width) : -1;
  }).toBe(vw);
  const box = await dialog.boundingBox();
  expect(box!.x).toBeLessThan(vw - 10);
  await expect(page.locator('input[name="need"]').first()).toBeFocused();
});

test('지금 상황이 비어 있으면 다음을 눌러도 1단계에 머물고 한국어 오류가 뜬다', async ({ page }) => {
  await page.goto('/projects');
  await page.click('header [data-open-drawer]');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.locator('[role="dialog"] [role="alert"]')).toContainText('지금 상황을 한두 줄로 적어주세요.');
  await expect(page.locator('textarea[name="pain"]')).toBeVisible();
});

test('불편한 점을 적고 Escape로 닫으면 포커스가 문의 버튼으로 돌아가고, 다시 열면 값이 남아 있다', async ({ page }) => {
  await page.goto('/projects');
  const trigger = page.locator('header [data-open-drawer]');
  await trigger.click();
  await page.fill('textarea[name="pain"]', '요청이 네 갈래로 들어옵니다');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-drawer-open'))).toBe(false);
  expect(await page.locator('[role="dialog"]').evaluate((el) => (el as HTMLElement & { inert: boolean }).inert)).toBe(true);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.locator('textarea[name="pain"]')).toHaveValue('요청이 네 갈래로 들어옵니다');
});

test('2단계에서 닫았다 다시 열면 포커스가 서랍 안 2단계 필드에 있고, Tab을 눌러도 서랍을 벗어나지 않는다', async ({ page }) => {
  await page.goto('/projects');
  const trigger = page.locator('header [data-open-drawer]');
  await trigger.click();
  await page.fill('textarea[name="pain"]', '요청이 네 갈래로 들어옵니다');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.locator('textarea[name="goal"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await trigger.click();

  // 열릴 때(380ms 뒤) 포커스가 서랍 "안"의, 지금 보이는(2단계) 필드에 있어야 한다 — 1단계(숨김)가 아니라 goal(2단계)
  await expect(page.locator('textarea[name="goal"]')).toBeFocused();
  const focusedInsideDialogAndVisible = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const active = document.activeElement as HTMLElement | null;
    return !!dialog && !!active && dialog.contains(active) && active.offsetParent !== null;
  });
  expect(focusedInsideDialogAndVisible).toBe(true);

  await page.keyboard.press('Tab');
  const stillInsideDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return !!dialog && dialog.contains(document.activeElement);
  });
  expect(stillInsideDialog).toBe(true);
});

test('상세에서 포커스된 문의 버튼에 Space 를 누르면 서랍이 열리고 페이지는 움직이지 않는다', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — 헤더 문의 버튼 포커스로 확인');
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  await page.locator('header [data-open-drawer]').focus();
  await page.keyboard.press(' ');
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-drawer-open'))).toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test.describe('고르기 칸', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.click('header [data-open-drawer]');
    await page.waitForTimeout(450);
  });

  test('누르면 목록이 뜨고, 고르면 닫히며 값이 폼에 실린다', async ({ page }) => {
    const sel = page.locator('[data-select="people"]');
    await sel.getByRole('button').click();
    await expect(sel).toHaveAttribute('data-open', '');
    await expect(sel.getByRole('listbox')).toBeVisible();
    await sel.getByRole('option', { name: '팀 (2~20명)' }).click();
    await expect(sel).not.toHaveAttribute('data-open', '');
    await expect(sel.getByRole('button')).toContainText('팀 (2~20명)');
    await expect(sel.locator('input[type="hidden"]')).toHaveValue('팀 (2~20명)');
    await expect(sel.getByRole('option', { name: '팀 (2~20명)' })).toHaveAttribute('aria-selected', 'true');
  });

  test('키보드: ↓ 로 열고 ↓↓ Enter 로 고른다. 초점은 버튼으로 돌아온다', async ({ page }) => {
    const sel = page.locator('[data-select="people"]');
    await sel.getByRole('button').focus();
    await page.keyboard.press('ArrowDown');
    await expect(sel.getByRole('listbox')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(sel.locator('input[type="hidden"]')).toHaveValue('팀 (2~20명)');
    await expect(sel.getByRole('button')).toBeFocused();
  });

  test('목록이 열린 채 Esc 는 목록만 닫고 서랍은 열려 있다', async ({ page }) => {
    const sel = page.locator('[data-select="people"]');
    await sel.getByRole('button').click();
    await page.keyboard.press('Escape');
    await expect(sel).not.toHaveAttribute('data-open', '');
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-drawer-open'))).toBe(true);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-drawer-open'))).toBe(false);
  });

  test('바깥을 누르면 닫힌다', async ({ page }) => {
    const sel = page.locator('[data-select="people"]');
    await sel.getByRole('button').click();
    await page.locator('#inquiry-drawer-heading').click();   // 목록이 위로 열리면 바로 위 칸을 덮는다 — 서랍 제목을 누른다
    await expect(sel).not.toHaveAttribute('data-open', '');
  });

  test('기본 select 는 남아 있지 않다', async ({ page }) => {
    await expect(page.locator('[role="dialog"] select')).toHaveCount(0);
  });
});

test('다음을 누르면 2단계로 넘어가기만 하고, 제출되거나 오류가 뜨지 않는다', async ({ page }) => {
  await page.goto('/projects');
  await page.click('header [data-open-drawer]');
  await page.fill('textarea[name="pain"]', '요청이 네 갈래로 들어옵니다');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.locator('textarea[name="goal"]')).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.locator('[role="dialog"] [role="alert"]')).toHaveCount(0);
});

test('이전·보내기 버튼은 위쪽 선의 양 끝에 붙는다', async ({ page }) => {
  await page.goto('/projects');
  await page.click('header [data-open-drawer]');
  await page.fill('textarea[name="pain"]', '요청이 네 갈래로 들어옵니다');
  await page.getByRole('button', { name: '다음' }).click();
  const r = await page.evaluate(() => {
    const prev = [...document.querySelectorAll<HTMLElement>('[role="dialog"] button')].find((b) => b.textContent === '이전')!;
    const foot = prev.parentElement!, send = foot.querySelector<HTMLElement>('button[type="submit"]')!;
    const f = foot.getBoundingClientRect(), a = prev.getBoundingClientRect(), b = send.getBoundingClientRect();
    return { left: a.left - f.left, right: f.right - b.right };
  });
  expect(Math.round(r.left)).toBe(0);
  expect(Math.round(r.right)).toBe(0);
});
