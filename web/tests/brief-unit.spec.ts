import { test, expect } from '@playwright/test';
import { emptyAnswers } from '../lib/brief/storage';
import { visibleSteps, REQUIRED, isAnswered } from '../lib/brief/steps';

test.describe('단계', () => {
  test('새로 만들기면 renew 단계가 없고 15개 중 14개', () => {
    const a = { ...emptyAnswers(), mode: 'new' as const };
    const s = visibleSteps(a);
    expect(s).not.toContain('renew');
    expect(s[0]).toBe('mode');
    expect(s.at(-1)).toBe('when');
    expect(s).toHaveLength(14);
  });
  test('고치기면 mode 다음이 renew', () => {
    const s = visibleSteps({ ...emptyAnswers(), mode: 'renew' });
    expect(s.slice(0, 2)).toEqual(['mode', 'renew']);
    expect(s).toHaveLength(15);
  });
  test('필수는 kind·goal 둘', () => {
    expect(REQUIRED).toEqual(['kind', 'goal']);
    const a = emptyAnswers();
    expect(isAnswered(a, 'kind')).toBe(false);
    expect(isAnswered({ ...a, kind: '가게(식당·카페 등)' }, 'kind')).toBe(true);
    expect(isAnswered({ ...a, kind: '직접 입력', kindOther: '' }, 'kind')).toBe(false);
    expect(isAnswered({ ...a, goalMain: '예약하기' }, 'goal')).toBe(true);
  });
});

import { buildBrief, impactItems, vendorQuestions, unknownItems, toPlainText, briefSummary } from '../lib/brief/derive';
import type { Answers } from '../lib/brief/types';
import { Q } from '../content/brief/questions';

const D = new Date('2026-10-15T09:00:00+09:00');
const cafe = (): Answers => ({ ...emptyAnswers(), mode: 'new', kind: '가게(식당·카페 등)', name: '가람 로스터리',
  goalMain: '찾아오기', goalMore: ['예약하기'], audience: ['처음 오는 고객', '단골'], pages: ['소개', '메뉴·서비스', '오시는 길', '소식', '문의'],
  features: { '문의 남기기': 'must', '예약 받기': 'must', '직접 글 올리기(공지·소식)': 'later' }, booking: '네이버 예약 연결',
  copy: '써 주길 원함', photo: '모르겠어요', design: '모르겠어요', ops: ['공지·소식'], revisions: '3번(보통)', care: '필요할 때만' });

test.describe('결과 계산', () => {
  test('요청서 제목·부제·단원', () => {
    const b = buildBrief(cafe(), D);
    expect(b.title).toBe('홈페이지 제작 요청서 · 가람 로스터리');
    expect(b.subtitle).toBe('새로 제작 · 2026년 10월 15일 작성');
    const ids = b.sections.map((s) => s.id);
    expect(ids).toEqual(['purpose', 'pages', 'features', 'links', 'content', 'brand', 'design', 'ops', 'own', 'scope', 'when', 'unknown']);
    const f = b.sections.find((s) => s.id === 'features')!;
    expect(f.rows.find((r) => r.label === '예약 받기')).toMatchObject({ tag: 'must', value: '네이버 예약 연결' });
    expect(b.sections.find((s) => s.id === 'ops')!.rows).toContainEqual({ label: '관리자 화면', value: '필요' });
  });
  test('명의 단원 이름에 괄호 설명이 들어가지 않는다', () => {
    const own = buildBrief(cafe(), D).sections.find((s) => s.id === 'own')!;
    expect(own.rows.map((r) => r.label)).toEqual(['도메인', '호스팅 계정', '관리자 계정', '소스·디자인 파일']);
  });
  test('이름이 없으면 「이름 미정」, 고치기면 renew 단원', () => {
    const b = buildBrief({ ...cafe(), name: '', mode: 'renew', renewUrl: 'example.com', renewAmount: '많아요(100개 넘음)' }, D);
    expect(b.title).toBe('홈페이지 제작 요청서 · 이름 미정');
    expect(b.sections[1].id).toBe('renew');
  });
  test('견적 영향: 예약(네이버)·소개 글 작성, 금액 없음', () => {
    const it = impactItems(cafe(), D);
    expect(it.map((i) => i.title)).toEqual(['예약 받기 (오픈 때 꼭)', '소개 글 작성을 맡김']);
    expect(it.every((i) => !/\d+\s*만\s*원/.test(i.reason))).toBe(true);
  });
  test('견적 영향: 직접 예약·우리만의 디자인·외국어 2개·급한 개업', () => {
    const a: Answers = { ...cafe(), booking: '홈페이지 안에서 직접', design: '새 디자인을 맞춤으로 만들어 주세요', features: { ...cafe().features, '외국어 페이지': 'later' },
      langs: ['영어', '일본어'], openDate: '2026-11-01', openFixed: '해당 날짜에 꼭 오픈해주세요' };
    const t = impactItems(a, D).map((i) => i.title);
    expect(t).toContain('맞춤 디자인');
    expect(t).toContain('외국어 페이지 (2개 언어)');
    expect(t).toContain('개업·행사 날짜에 맞춰야 함');
  });
  test('업체 질문: 항상 3개 + 조건 — 명의 단원과 겹치는 질문은 묻지 않는다', () => {
    const q = vendorQuestions(cafe());
    expect(q.slice(0, 3)).toEqual([
      '수정은 몇 번까지 포함인가요?', '오픈 뒤 매달 드는 비용은 무엇이고 얼마인가요?', '오픈 뒤 고칠 게 생기면 어디로 연락하고, 보통 며칠 걸리나요?']);
    expect(q.join('\n')).not.toMatch(/도메인과 호스팅|소스와 디자인 파일/);
    expect(q).toContain('관리자 화면에서 제가 직접 고칠 수 있는 범위는 어디까지인가요?');
    expect(q).toContain('네이버 예약은 어떻게 연결하시나요?');
    expect(q).toContain('글 작성 비용은 견적에 들어 있나요?');
  });
  test('업체 제안 받기 목록', () => {
    expect(unknownItems(cafe())).toEqual(['연결할 서비스', '사진', '디자인 자료', '디자인 방식', '오픈 일정']);
  });
  test('필수 둘만 답한 최소 요청서도 깨지지 않는다', () => {
    const a: Answers = { ...emptyAnswers(), kind: '회사·사무실', goalMain: '문의 남기기' };
    const b = buildBrief(a, D);
    expect(b.sections.find((s) => s.id === 'unknown')!.rows.length).toBeGreaterThanOrEqual(5);
    expect(toPlainText(a, D).length).toBeGreaterThan(50);
  });
  test('예산은 넣기를 켰을 때만', () => {
    const off = { ...cafe(), budget: '100~300만 원' };
    expect(toPlainText(off, D)).not.toContain('100~300만 원');
    expect(buildBrief(off, D).sections.some((s) => s.id === 'budget')).toBe(false);
    expect(toPlainText({ ...off, budgetInBrief: true }, D)).toContain('100~300만 원');
  });
  test('복사 글·요약: 길이 제한과 Prologue& 없음', () => {
    const long = { ...cafe(), name: '가'.repeat(3000), renewPain: '나'.repeat(3000), dislikes: '다'.repeat(3000) };
    expect(toPlainText(long, D).length).toBeLessThanOrEqual(2000);
    expect(briefSummary(long, D).length).toBeLessThanOrEqual(1000);
    expect(toPlainText(cafe(), D)).not.toContain('Prologue');
    expect(briefSummary(cafe(), D).startsWith('[요청서 만들기]')).toBe(true);
  });
});

import { loadSaved, saveSaved, clearBrief, storageOk, emptyCompare, loadCompare, saveCompare } from '../lib/brief/storage';
import { appendSummary } from '../lib/brief/prefill';
import { isInAppBrowser } from '../lib/brief/in-app';

class Mem implements Storage {
  [k: string]: any;   // Storage 인터페이스의 색인 서명 — 없으면 tsc 가 implements 를 거부한다
  m = new Map<string, string>(); get length() { return this.m.size; }
  clear() { this.m.clear(); } getItem(k: string) { return this.m.get(k) ?? null; } key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); } setItem(k: string, v: string) { this.m.set(k, v); }
}
class Broken extends Mem { setItem(): void { throw new Error('QuotaExceeded'); } getItem(): string | null { throw new Error('SecurityError'); } }

test.describe('저장', () => {
  test('저장했다가 다시 읽는다', () => {
    const s = new Mem();
    expect(saveSaved(s, { answers: cafe(), step: 'pages', done: false })).toBe(true);
    expect(loadSaved(s)).toEqual({ answers: cafe(), step: 'pages', done: false });
  });
  test('깨진 값·다른 버전은 무시한다', () => {
    const s = new Mem();
    s.setItem('prologue.brief.v1', '{깨짐');
    expect(loadSaved(s)).toBeNull();
    s.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 2 }, step: 'kind', done: false }));
    expect(loadSaved(s)).toBeNull();
  });
  test('저장이 막히면 false·null, 예외를 던지지 않는다', () => {
    const b = new Broken();
    expect(storageOk(b)).toBe(false);
    expect(saveSaved(b, { answers: cafe(), step: 'kind', done: false })).toBe(false);
    expect(loadSaved(b)).toBeNull();
    expect(() => clearBrief(b)).not.toThrow();
    expect(storageOk(null)).toBe(false);
  });
  test('모두 지우기는 두 키 모두', () => {
    const s = new Mem();
    saveSaved(s, { answers: cafe(), step: 'kind', done: true });
    saveCompare(s, emptyCompare());
    clearBrief(s);
    expect(s.length).toBe(0);
  });
  test('비교표 3곳, 다시 읽기', () => {
    const s = new Mem(); const v = emptyCompare();
    expect(v).toHaveLength(3);
    v[0].price = '180만 원'; saveCompare(s, v);
    expect(loadCompare(s)[0].price).toBe('180만 원');
  });
});

test.describe('서랍 요약 합치기', () => {
  test('빈 칸이면 요약 그대로', () => { expect(appendSummary('', '요약')).toBe('요약'); });
  test('이미 글이 있으면 한 줄 띄워 덧붙임', () => { expect(appendSummary('제 글', '요약')).toBe('제 글\n\n요약'); });
  test('합쳐서 1,000자를 넘지 않고, 기존 글은 그대로', () => {
    const r = appendSummary('가'.repeat(800), '나'.repeat(500));
    expect(r.length).toBeLessThanOrEqual(1000);
    expect(r.startsWith('가'.repeat(800))).toBe(true);
    expect(r.endsWith('…')).toBe(true);
  });
  test('남은 길이가 100자 미만이면 덧붙이지 않음', () => {
    const base = '가'.repeat(950);
    expect(appendSummary(base, '나'.repeat(500))).toBe(base);
  });
});

test('앱 안 브라우저 감지', () => {
  expect(isInAppBrowser('Mozilla/5.0 (iPhone) AppleWebKit Barcelona 289.0')).toBe(true);
  expect(isInAppBrowser('Mozilla/5.0 (iPhone) Instagram 320.0')).toBe(true);
  expect(isInAppBrowser('Mozilla/5.0 (Linux; Android) KAKAOTALK 10')).toBe(true);
  expect(isInAppBrowser('Mozilla/5.0 (iPhone) Version/17.0 Mobile Safari/604.1')).toBe(false);
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { bannedWords } from './banned';

test('문구: 금지 낱말·낫표 없음, 이유 문장에 금액 없음', () => {
  const files = ['content/brief/questions.ts', 'components/brief/result.tsx', 'components/brief/brief-tool.tsx', 'components/brief/steps.tsx', 'components/brief/intro.tsx', 'components/brief/preview.tsx', 'content/brief/sample.ts', 'lib/brief/derive.ts', 'app/tools/brief/page.tsx'];
  // 화면·문서에 나가는 문구만 본다 — 코드 주석은 빼고
  const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const text = files.map((f) => strip(readFileSync(join(__dirname, '..', f), 'utf8'))).join('\n');
  expect(text).not.toMatch(/[「」]/);
  const words = bannedWords();
  if (words) for (const w of words) expect(text, w).not.toContain(w);
  const q = readFileSync(join(__dirname, '..', 'content/brief/questions.ts'), 'utf8');
  const whyLines = q.split('\n').filter((l) => /Why|why:/.test(l));
  for (const l of whyLines) expect(l).not.toMatch(/\d+\s*만\s*원/);
});

test.describe('최종 검토 보완', () => {
  test('건너뛴 항목도 업체 제안 받기에 모인다', () => {
    const a: Answers = { ...emptyAnswers(), kind: '회사·사무실', goalMain: '문의 남기기' };
    const u = unknownItems(a);
    for (const l of ['연결할 서비스', '디자인 자료', '오픈 뒤 운영', '사진', '수정 횟수', '오픈 뒤 관리', '오픈 일정']) expect(u, l).toContain(l);
  });
  test('같은 v1 안에서 형이 틀린 값·없는 단계는 버린다', () => {
    const s = new Mem();
    s.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, features: null, goalMore: null }, step: 'kind', done: true }));
    expect(loadSaved(s)).toBeNull();
    s.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1 }, step: 'nope', done: false }));
    expect(loadSaved(s)).toBeNull();
    s.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, kind: '회사·사무실' }, step: 'goal', done: false }));
    expect(loadSaved(s)?.answers.kind).toBe('회사·사무실');
  });
  test('두 번 보내면 옛 요약을 새 요약으로 바꾼다', () => {
    expect(appendSummary('제 글\n\n[요청서 만들기]\n옛 요약', '[요청서 만들기]\n새 요약')).toBe('제 글\n\n[요청서 만들기]\n새 요약');
    expect(appendSummary('[요청서 만들기]\n옛', '[요청서 만들기]\n새')).toBe('[요청서 만들기]\n새');
  });
});

test.describe('보강 — 진행 묶음', () => {
  test('네 묶음, 고치기 단계는 첫 묶음', async () => {
    const { phaseOf, PHASES } = await import('../lib/brief/steps');
    expect(PHASES.map((p) => p.name)).toEqual(['어떤 홈페이지', '필요한 것', '준비와 디자인', '약속']);
    expect(phaseOf('renew')).toBe(0);
    expect(phaseOf('pages')).toBe(1);
    expect(phaseOf('ops')).toBe(2);
    expect(phaseOf('when')).toBe(3);
  });
});

test('실제 쓰레드 앱(아이폰) 브라우저 문자열을 앱 안 브라우저로 본다 — 기기 시험 2026-10-15', () => {
  expect(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22H352 Barcelona 450.0.0.31.61 (iPhone13,1; iOS 18_7_8; ko_KR; ko; scale=3.00; 1125x2436; IABMV/1; 1082981707)')).toBe(true);
});

test('호칭은 「고객」으로 통일 — 「손님」을 쓰지 않는다', () => {
  const files = ['content/brief/questions.ts', 'content/brief/sample.ts', 'lib/brief/derive.ts', 'components/brief/steps.tsx', 'components/brief/result.tsx', 'components/brief/intro.tsx'];
  for (const f of files) expect(readFileSync(join(__dirname, '..', f), 'utf8'), f).not.toContain('손님');
});

test.describe('그 밖에 필요한 기능', () => {
  test('요청서 기능 단원에 「그 밖에」 줄로 들어가고 요약에도 들어간다', () => {
    const a: Answers = { ...cafe(), featuresExtra: '쿠폰 발급, 대기 번호 안내' };
    const f = buildBrief(a, D).sections.find((s) => s.id === 'features')!;
    expect(f.rows.at(-1)).toEqual({ label: '그 밖에', value: '쿠폰 발급, 대기 번호 안내' });
    expect(briefSummary(a, D)).toContain('그 밖에 필요한 기능: 쿠폰 발급, 대기 번호 안내');
  });
  test('목록에서 안 골라도 적어 두면 「필요한 기능」을 업체 제안으로 넘기지 않는다', () => {
    const a: Answers = { ...emptyAnswers(), kind: '회사·사무실', goalMain: '문의 남기기', featuresExtra: '사내 공지' };
    expect(unknownItems(a)).not.toContain('필요한 기능');
    expect(unknownItems({ ...a, featuresExtra: '' })).toContain('필요한 기능');
  });
  test('아주 길게 적어도 300자에서 자른다', () => {
    const v = buildBrief({ ...cafe(), featuresExtra: '가'.repeat(2000) }, D).sections.find((s) => s.id === 'features')!.rows.at(-1)!.value;
    expect(v.length).toBeLessThanOrEqual(300);
  });
});

test.describe('디자인 방식 선택지', () => {
  test('넷으로 나뉜다: 템플릿 / 맞춤 / 이미 있음 / 모르겠어요', () => {
    expect([...Q.design.opts]).toEqual(['템플릿이어도 괜찮아요', '새 디자인을 맞춤으로 만들어 주세요', '이미 정해진 디자인이 있어요', '모르겠어요']);
  });
  test('이미 정해진 디자인이 있으면 맞춤 견적 영향은 없고, 그대로 따라 주는지 업체에 묻는다', () => {
    const a: Answers = { ...cafe(), design: '이미 정해진 디자인이 있어요' };
    expect(impactItems(a, D).map((i) => i.title)).not.toContain('맞춤 디자인');
    expect(vendorQuestions(a)).toContain('정해 둔 디자인(색·글꼴·화면 규칙)을 그대로 따라 만들어 주시나요?');
    expect(unknownItems(a)).not.toContain('디자인 방식');
  });
});

test('견적 영향 표시 문구는 「견적가에 크게 영향」', () => {
  expect(Q.impactBadge).toBe('견적가에 크게 영향');
});

test('운영 질문 문구', () => {
  expect(Q.ops.title).toBe('홈페이지 오픈 뒤 직접 생성하거나 수정하고 싶은 게 있을까요?');
});

test('일정 문구', () => {
  expect(Q.when.fixed.label).toBe('선택한 날짜에 꼭 오픈되어야 하나요?');
  expect([...Q.when.fixed.opts]).toEqual(['해당 날짜에 꼭 오픈해주세요', '희망일이에요']);
  expect(Q.when.budgetHelp).toBe('생각하는 예산을 넣으면 견적가가 거기에 맞춰 올라오기도 해요.');
});

test('복사 글: 업체 제안 목록은 항목 이름만(「: 업체 제안 받기」 반복 없음)', () => {
  const t = toPlainText(cafe(), D);
  expect(t).toContain('업체 제안을 받고 싶은 것\n연결할 서비스, 사진, 디자인 자료, 디자인 방식, 오픈 일정\n');
  expect(t).not.toContain('업체 제안 받기');
});

test('업체 제안 항목마다 고칠 질문이 이어져 있다', () => {
  const a: Answers = { ...emptyAnswers(), mode: 'renew', kind: '회사·사무실', goalMain: '문의 남기기', own: { domain: '모르겠어요', hosting: '내 이름으로', admin: '대표 계정은 내가', source: '오픈 때 받기' } };
  const rows = buildBrief(a, D).sections.find((s) => s.id === 'unknown')!.rows;
  const map = Object.fromEntries(rows.map((r) => [r.label, r.edit]));
  expect(map).toMatchObject({ '옮길 글·사진 양': 'renew', '주 방문자': 'audience', '화면 구성': 'pages', '필요한 기능': 'features', '연결할 서비스': 'links',
    '소개 글': 'content', '사진': 'content', '디자인 자료': 'brand', '디자인 방식': 'design', '오픈 뒤 운영': 'ops', '도메인': 'own', '수정 횟수': 'scope', '오픈 뒤 관리': 'scope', '오픈 일정': 'when' });
  expect(rows.every((r) => r.edit)).toBe(true);
});

test('사진은 「있어요 / 없어요 / 모르겠어요」 — 촬영을 맡길 수 있을지는 사장님이 알 수 없다', () => {
  expect([...Q.content.photo.opts]).toEqual(['있어요', '없어요', '모르겠어요']);
  expect(Q.content.why).toBe('글 작성은 보통 제작비와 따로 계산돼요.');
});

test('사진이 없으면 요청서에 「없음」으로 적고 업체 제안으로도 넘긴다', () => {
  const a: Answers = { ...cafe(), photo: '없어요' };
  expect(buildBrief(a, D).sections.find((x) => x.id === 'content')!.rows).toContainEqual({ label: '사진', value: '없음' });
  expect(unknownItems(a)).toContain('사진');
});

test.describe('복사 글 다듬기 — 업체에게 보내는 문서 말투', () => {
  const rich = (): Answers => ({ ...emptyAnswers(), mode: 'renew', renewUrl: 'example.com', renewAmount: '보통', kind: '가게(식당·카페 등)', name: '봄날 베이커리',
    goalMain: '찾아오기', goalMore: ['예약하기', '소식 보기'], audience: ['처음 오는 고객', '단골'], pages: ['소개', '메뉴·서비스', '오시는 길'],
    features: { '예약 받기': 'must', '외국어 페이지': 'later' }, booking: '네이버 예약 연결', langs: ['영어'], links: ['인스타그램'], copy: '써 주길 원함', photo: '없어요',
    brand: ['로고 원본 파일'], design: '새 디자인을 맞춤으로 만들어 주세요', refs: [{ url: 'https://example.org', likes: ['색·분위기', '배치'], memo: '사진이 크게' }],
    ops: ['공지·소식'], revisions: '3번(보통)', care: '필요할 때만', openDate: '2026-11-10', openFixed: '해당 날짜에 꼭 오픈해주세요', decider: '나 혼자' });
  const t = () => toPlainText(rich(), D);

  test('단원 제목은 번호 + 명사', () => {
    const heads = t().split('\n').filter((l) => /^\d+\. /.test(l) && !l.includes('?'));
    expect(heads).toEqual(['1. 목적', '2. 기존 홈페이지', '3. 화면 구성', '4. 기능', '5. 연결할 서비스', '6. 글과 사진', '7. 디자인 자료', '8. 디자인', '9. 오픈 뒤 운영', '10. 명의', '11. 범위', '12. 일정과 결정', '13. 업체 제안을 받고 싶은 것']);
    expect(t()).not.toContain('■');
  });
  test('단추 글자 대신 문서 말투 — 반말·부탁·해요체가 섞이지 않는다', () => {
    const x = t();
    for (const bad of ['써 주길 원함', '없어요', '만들어 주세요', '오픈해주세요', '내가', '나 혼자', '내 이름으로', '알려 주세요', '—', '2026-11-10']) expect(x, bad).not.toContain(bad);
    for (const good of ['- 가장 중요한 고객 행동: 매장 방문', '- 그 밖의 고객 행동: 예약, 소식 보기', '- 옮길 글·사진 양: 보통(10~100개)', '- 화면 3개: 소개 / 메뉴·서비스 / 오시는 길',
      '- 예약 받기 [오픈 때 필수]: 네이버 예약 연결', '- 소개 글: 작성 요청', '- 사진: 없음', '- 방식: 맞춤 디자인 희망', '- 참고 사이트 1: https://example.org', '- 참고 1 좋은 점: 색·분위기, 배치',
      '- 직접 올리거나 고칠 것: 공지·소식', '- 관리자 화면: 필요', '- 도메인: 제 명의', '- 관리자 계정: 대표 계정은 제가 보유', '- 소스·디자인 파일: 오픈 때 인도',
      '- 오픈 희망일: 2026년 11월 10일(화), 이 날짜에 꼭 오픈 필요', '- 최종 결정: 대표 혼자']) expect(x, good).toContain(good);
  });
  test('업체 제안 항목은 한 줄, 매달 비용은 질문에만', () => {
    const x = t();
    expect(x).toContain('13. 업체 제안을 받고 싶은 것\n사진\n');
    const min = toPlainText({ ...emptyAnswers(), kind: '회사·사무실', goalMain: '문의 남기기' }, D);
    expect(min).toMatch(/업체 제안을 받고 싶은 것\n주 방문자, 화면 구성, 필요한 기능, 연결할 서비스, [^\n]+\n/);
    expect(min).toContain('- 도메인: 제 명의');   // 건너뛰어도 명의는 적는다
    expect(x).not.toContain('매달 비용:');
    expect(x).toContain('오픈 뒤 매달 드는 비용은 무엇이고 얼마인가요?');
    expect(toPlainText({ ...rich(), monthlyCost: false }, D)).not.toContain('매달 드는 비용');
  });
  test('서랍 요약: 괄호가 겹치지 않고 날짜는 한국어', () => {
    const s = briefSummary(rich(), D);
    expect(s).toContain('업종: 가게(식당·카페 등)\n이름: 봄날 베이커리');
    expect(s).toContain('오픈 희망일: 2026년 11월 10일(화)');
    expect(s).not.toMatch(/\) \(/);
  });
});

test('복사 글: 단원 번호와 질문 번호가 헷갈리지 않고, 줄 이름이 단원 제목을 되풀이하지 않는다', () => {
  const t = toPlainText({ ...cafe(), links: ['인스타그램'] }, D);
  expect(t).toContain('Q1. 수정은 몇 번까지 포함인가요?');
  expect(t).toContain('- 이용 중: 인스타그램');
  expect(t).not.toContain('- 서비스:');
});
