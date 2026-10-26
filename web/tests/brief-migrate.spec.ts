import { test, expect } from '@playwright/test';
import { migrateV1, migrateCompareV1 } from '../lib/brief/migrate-v1';
import { emptyAnswers } from '../lib/brief/storage';

/** 2026-10-23 배포본이 저장하던 v1 답 — 표의 모든 칸을 쓴다 */
const V1_FULL = {
  mode: 'renew', renewUrl: 'https://example.com', renewPain: '느려요', renewAmount: '보통',
  kind: '직접 입력', kindOther: '꽃집', name: '꽃가게',
  goalMain: '찾아오기', goalMore: ['예약하기', '소식 보기'], audience: ['단골', '모르겠어요'],
  pages: ['소개', '가격'], pagesExtra: '',
  features: { '문의 남기기': 'must', '예약 받기': 'must', '외국어 페이지': 'later' }, featuresExtra: '', featuresUnknown: false,
  booking: '네이버 예약 연결', shopCount: '10개 이하', shopHow: '홈페이지에서 직접 결제', member: '이메일로 가입', langs: ['영어', '일본어'], langOther: '',
  links: ['네이버 플레이스·예약', '인스타그램'], copy: '직접 준비', photo: '있어요', contentBy: '',
  brand: ['로고 원본 파일'], design: '템플릿이어도 괜찮아요',
  refs: [{ url: 'https://example.org', likes: ['색·분위기', '움직임'], memo: '좋아요' }], dislikes: '',
  ops: ['공지·소식', '메뉴·가격'],
  own: { domain: '내 이름으로', hosting: '업체에 맡김', admin: '모르겠어요', source: '오픈 때 받기' },
  revisions: '3번(보통)', care: '필요할 때만', monthlyCost: false,
  openDate: '2026-12-01', openUnknown: false, openFixed: '해당 날짜에 꼭 오픈해주세요',
  budget: '300~800만 원', budgetInBrief: true, decider: '나 혼자',
};

test('v1 → v2: 고치기·직접 입력·여러 개·기능 키', () => {
  const v2 = migrateV1({ v: 1, ...V1_FULL })!;
  expect(v2).toMatchObject({ v: 2, mode: 'renew', renewAmount: 'some', kind: 'other', kindOther: '꽃집', goalMain: 'visit', goalMore: ['book', 'news'],
    audience: ['regular', 'unknown'], pages: ['about', 'pricing'],
    features: { inquiry: 'must', booking: 'must', multilang: 'later' }, booking: 'service', shopCount: 'upTo10', shopHow: 'builtin', member: 'email', langs: ['en', 'ja'],
    links: ['map', 'instagram'], copy: 'self', photo: 'have', brand: ['logo'], design: 'template', ops: ['news', 'menu'],
    refs: [{ url: 'https://example.org', likes: ['color', 'motion'], memo: '좋아요' }],
    own: { domain: 'mine', hosting: 'vendor', admin: 'unknown', source: 'get' },
    revisions: '3', care: 'asNeeded', monthlyCost: false, openFixed: 'must', budget: '300to800', budgetText: '', budgetInBrief: true, decider: 'solo' });
});
test('v1 → v2: 표에 없는 글자는 빠지고 나머지는 남는다', () => {
  const v2 = migrateV1({ v: 1, kind: '이상한 값', pages: ['소개', '없는 화면'], goalMain: '전화하기' })!;
  expect(v2.kind).toBeUndefined(); expect(v2.pages).toEqual(['about']); expect(v2.goalMain).toBe('call');
  expect(v2.own).toEqual(emptyAnswers().own);
});
test('v1 → v2: own 에서 표에 없는 글자는 기본값, 모르겠어요는 unknown', () => {
  const v2 = migrateV1({ v: 1, own: { domain: '이상한 값', hosting: '모르겠어요' } })!;
  expect(v2.own).toEqual({ domain: 'mine', hosting: 'unknown', admin: 'mine', source: 'get' });
});
test('v1 → v2: v가 1이 아니거나 모양이 틀리면 null', () => {
  expect(migrateV1({ v: 2 })).toBeNull();
  expect(migrateV1({ v: 1, features: null, goalMore: null })).toBeNull();
  expect(migrateV1('깨짐')).toBeNull();
  expect(migrateV1(null)).toBeNull();
});
test('비교표 v1 → v2: 줄 id, 예·아니오, 기본 업체 이름', () => {
  const c = migrateCompareV1([{ name: 'A 업체', price: '300', cells: { '꼭 필요한 기능 포함': '예', '도메인 내 이름': '아니오', '소스·파일 받음': '', '수정 횟수': '3', '매달 비용': '', '오픈 가능일': '' } },
    { name: '우리동네 웹', price: '', cells: {} }, { name: 'C 업체', price: '', cells: {} }])!;
  expect(c[0]).toEqual({ name: '', price: '300', cells: { features: 'yes', domain: 'no', source: '', revisions: '3', monthly: '', openBy: '' } });
  expect(c[1].name).toBe('우리동네 웹');
  expect(c[2].name).toBe('');
  expect(migrateCompareV1([])).toBeNull(); expect(migrateCompareV1('x')).toBeNull();
});

test('v1: constructor·toString 같은 글자는 표에 없는 글자로 본다', () => {
  const m = migrateV1({ v: 1, kind: 'constructor', pages: ['toString', '소개'] })!;
  expect(m.kind).toBeUndefined();
  expect(m.pages).toEqual(['about']);
});
