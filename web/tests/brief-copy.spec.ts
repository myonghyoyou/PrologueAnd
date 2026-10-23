import { test, expect } from '@playwright/test';
import { Q } from '../content/brief/questions';
import { OPTS, LANG_OPTS, OWN_DEFAULT, type OptKey } from '../content/brief/rules';
import { copyFor } from '../content/brief/copy';

/** 한국어 문구 파일이 옮기기 전(questions.ts)과 글자 하나 다르지 않은지 — Task 4 에서 questions.ts 를 지울 때 함께 지운다(그 뒤는 고정 파일 비교가 맡는다) */
const k = copyFor('ko').q;
const pick = <K extends OptKey>(key: K, m: Record<string, string>) => (OPTS[key] as readonly string[]).map((id) => m[id]);

test('한국어 선택지 = 지금 Q의 선택지(순서까지)', () => {
  expect(pick('mode', k.mode.opts)).toEqual(Q.mode.opts);
  expect(pick('renewAmount', k.renew.amount)).toEqual(Q.renew.amount.opts);
  expect(pick('kind', k.kind.opts)).toEqual(Q.kind.opts);
  expect(pick('goal', k.goal.opts)).toEqual(Q.goal.opts);
  // Q.audience.opts 에는 「모르겠어요」가 없다(UNKNOWN 을 steps.tsx 가 덧붙인다) — 앞의 넷만 대조하고 unknown 은 Q.dunno 와 비교
  expect(pick('audience', k.audience.opts).slice(0, 4)).toEqual(Q.audience.opts);
  expect(k.audience.opts.unknown).toBe(Q.dunno);
  expect(pick('pages', k.pages.opts)).toEqual(Q.pages.opts);
  expect(pick('features', k.features.opts)).toEqual(Q.features.opts);
  expect(pick('booking', k.features.booking.opts)).toEqual(Q.features.booking.opts);
  expect(pick('shopCount', k.features.shopCount.opts)).toEqual(Q.features.shopCount.opts);
  expect(pick('shopHow', k.features.shopHow.opts)).toEqual(Q.features.shopHow.opts);
  expect(pick('member', k.features.member.opts)).toEqual(Q.features.member.opts);
  expect(pick('links', k.links.opts)).toEqual(Q.links.opts);
  expect(pick('copy', k.content.copy)).toEqual(Q.content.copy.opts);
  expect(pick('photo', k.content.photo)).toEqual(Q.content.photo.opts);
  expect(pick('brand', k.brand.opts)).toEqual(Q.brand.opts);
  expect(pick('design', k.design.opts)).toEqual(Q.design.opts);
  expect(pick('likes', k.design.likes)).toEqual(Q.design.likes);
  expect(pick('ops', k.ops.opts)).toEqual(Q.ops.opts);
  expect(pick('ownDomain', k.own.domain.opts)).toEqual(Q.own.rows[0].opts);
  expect(pick('ownHosting', k.own.hosting.opts)).toEqual(Q.own.rows[1].opts);
  expect(pick('ownAdmin', k.own.admin.opts)).toEqual(Q.own.rows[2].opts);
  expect(pick('ownSource', k.own.source.opts)).toEqual(Q.own.rows[3].opts);
  expect(pick('revisions', k.scope.revisions)).toEqual(Q.scope.revisions.opts);
  expect(pick('care', k.scope.care)).toEqual(Q.scope.care.opts);
  expect(pick('openFixed', k.when.fixed)).toEqual(Q.when.fixed.opts);
  expect(k.when.budget.kind).toBe('range');
  expect(pick('budget', (k.when.budget as { opts: Record<string, string> }).opts)).toEqual(Q.when.budget.opts);
  expect(pick('decider', k.when.decider)).toEqual(Q.when.decider.opts);
  // 모든 선택지 묶음에 빠진 id 가 없는지(undefined 가 섞이면 위 비교가 이미 깨지지만, 이름으로 한 번 더)
  for (const key of Object.keys(OPTS) as OptKey[]) expect(OPTS[key].length).toBeGreaterThan(0);
});

test('한국어 질문 제목·도움말·이유·이름표 = 지금 Q', () => {
  expect(k.mode.title).toBe(Q.mode.title);
  expect(k.renew).toMatchObject({ title: Q.renew.title, url: Q.renew.url, pain: Q.renew.pain, amountLabel: Q.renew.amount.label, amountWhy: Q.renew.amountWhy });
  expect(k.kind).toMatchObject({ title: Q.kind.title, help: Q.kind.help, name: Q.kind.name, nameHelp: Q.kind.nameHelp });
  expect(k.goal).toMatchObject({ title: Q.goal.title, help: Q.goal.help, more: Q.goal.more });
  expect(k.audience).toMatchObject({ title: Q.audience.title, help: Q.audience.help });
  expect(k.pages).toMatchObject({ title: Q.pages.title, help: Q.pages.help, extra: Q.pages.extra, manyWhy: Q.pages.manyWhy });
  const f = k.features;
  expect(f).toMatchObject({ title: Q.features.title, help: Q.features.help, must: Q.features.must, later: Q.features.later, unknown: Q.features.unknown, extra: Q.features.extra, extraHelp: Q.features.extraHelp });
  expect(f.why.booking).toBe(Q.features.why['예약 받기']);
  expect(f.why.payment).toBe(Q.features.why['상품 결제']);
  expect(f.why.members).toBe(Q.features.why['회원']);
  expect(f.why.multilang).toBe(Q.features.why['외국어 페이지']);
  expect(Object.keys(f.why).sort()).toEqual(['booking', 'members', 'multilang', 'payment']);
  expect([f.booking.label, f.shopCount.label, f.shopHow.label, f.member.label]).toEqual([Q.features.booking.label, Q.features.shopCount.label, Q.features.shopHow.label, Q.features.member.label]);
  expect(f.langs).toEqual({ label: Q.features.langs.label, other: Q.features.langs.other });
  expect(k.links).toMatchObject({ title: Q.links.title, manyWhy: Q.links.manyWhy });
  expect(k.content).toMatchObject({ title: Q.content.title, copyLabel: Q.content.copy.label, photoLabel: Q.content.photo.label, by: Q.content.by, why: Q.content.why });
  expect(k.brand).toMatchObject({ title: Q.brand.title, noneWhy: Q.brand.noneWhy });
  expect(k.design).toMatchObject({ title: Q.design.title, customWhy: Q.design.customWhy, refsLabel: Q.design.refsLabel, memo: Q.design.memo, dislikes: Q.design.dislikes });
  expect(k.ops).toMatchObject({ title: Q.ops.title, help: Q.ops.help });
  expect(k.own).toMatchObject({ title: Q.own.title, help: Q.own.help });
  Q.own.rows.forEach((r) => expect(k.own[r.key]).toMatchObject({ label: r.label, why: r.why }));
  expect(k.scope).toMatchObject({ title: Q.scope.title, revisionsLabel: Q.scope.revisions.label, careLabel: Q.scope.care.label, monthly: Q.scope.monthly });
  expect(k.when).toMatchObject({ title: Q.when.title, date: Q.when.date, dateUnknown: Q.when.dateUnknown, fixedLabel: Q.when.fixed.label, budgetIn: Q.when.budgetIn, budgetHelp: Q.when.budgetHelp, deciderLabel: Q.when.decider.label, rushWhy: Q.when.rushWhy });
  expect(k.when.budget.label).toBe(Q.when.budget.label);
  const ui = copyFor('ko').ui;
  expect([ui.impactBadge, ui.dunno, ui.required]).toEqual([Q.impactBadge, Q.dunno, Q.required]);
});

test('한국어 규칙·바깥 문구', () => {
  const c = copyFor('ko');
  expect(c.locale).toBe('ko');
  expect(c.end.kind).toBe('drawer');
  expect(c.end.toOwnership).toBe('이미 홈페이지가 있다면 → 내 홈페이지 권한 점검');
  expect(c.intro.switchTo).toEqual({ href: '/en/tools/brief', label: 'English', lang: 'en' });
  expect(c.print.lineChars).toBe(26);
  expect(c.result.yn).toEqual({ yes: '예', no: '아니오', unset: '—', unsetAria: '미정' });
  expect(c.ui.previewEmpty).toBe('답하면 여기에 채워져요');
  expect(c.ui.langName('en')).toBe('영어');
  expect(LANG_OPTS.ko.map((code) => c.ui.langName(code))).toEqual(Q.features.langs.opts);
  expect(c.doc.unknown).toHaveProperty('openDate');
  expect(Object.keys(c.doc.unknown)).toHaveLength(17);
  expect(OWN_DEFAULT).toEqual({ domain: 'mine', hosting: 'mine', admin: 'mine', source: 'get' });
});

test('한국어 날짜 글자', () => {
  const c = copyFor('ko');
  expect(c.doc.subtitle('new', new Date(2026, 9, 15))).toBe('새로 제작 · 2026년 10월 15일 작성');
  expect(c.doc.subtitle('renew', new Date(2026, 9, 15))).toBe('기존 홈페이지 개편 · 2026년 10월 15일 작성');
  expect(c.doc.formatDay('2026-11-10')).toBe('2026년 11월 10일(화)');
  expect(c.doc.formatDay('abc')).toBe('abc');
  expect(c.doc.title('봄날')).toBe('홈페이지 제작 요청서 · 봄날');
});
