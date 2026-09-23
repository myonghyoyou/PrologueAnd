import { test, expect } from '@playwright/test';

const ok = { pain: '요청이 네 갈래로 들어옵니다', email: 'a@b.com', tools: ['엑셀', '카톡'], elapsed: 9000 };

test('필수 두 칸이 비면 400', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { pain: '', email: '', elapsed: 9000 } });
  expect(res.status()).toBe(400);
});

test('보기에 없는 값은 400', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, people: '천 명' } });
  expect(res.status()).toBe(400);
});

test('허니팟이 채워지면 200이지만 보내지 않는다', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, website: 'bot' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).sent).toBe(false);
});

test('5초 미만 제출은 거른다', async ({ request }) => {
  const res = await request.post('/api/inquiry', { data: { ...ok, elapsed: 1200 } });
  expect((await res.json()).sent).toBe(false);
});
