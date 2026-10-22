# 홈페이지 요청서 만들기 (`/tools/brief`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사장님이 질문에 답하면 어느 업체에나 보낼 수 있는 홈페이지 제작 요청서와 견적 비교표가 나오는 도구를 prologueand.com `/tools/brief`에 만든다. 답은 그 기기에만 저장하고, 「Prologue&에도 보내기」를 누르기 전까지 어디로도 보내지 않는다.

**Architecture:** 질문 정의는 데이터(`content/brief/questions.ts`), 결과 계산은 순수 함수(`lib/brief/derive.ts`), 저장은 `localStorage` 래퍼(`lib/brief/storage.ts`), 화면은 한 클라이언트 컴포넌트(`components/brief/brief-tool.tsx`)가 질문 단계와 결과를 바꿔 보여 준다. 기존 문의 서랍은 `inquiry:open` 이벤트의 `prefill`을 받아 칸을 채우도록 조금 고친다. 서버 코드는 바꾸지 않는다.

**Tech Stack:** Next 16 App Router(`web/`), React 19, CSS Modules, 사이트 토큰(`app/globals.css`), Playwright 테스트(프로젝트 w1440·w1280·w2560·phone, 3100 서버).

**Spec:** `docs/superpowers/specs/2026-10-15-homepage-brief-tool-design.md` (근거 조사 `docs/tools/2026-10-15-homepage-brief-research.md`, 시안 `data/images/tools/brief-*.png`)

## Global Constraints

- 저장소는 공개다. 회사·업종·실제 지역·실제 인물 이름을 코드·주석·테스트·커밋 메시지에 쓰지 않는다(`CLAUDE.md`).
- 경로의 `&` 때문에 `npx`·`npm run`이 깨진다. `web/`에서 node로 직접 부른다.
  - 타입: `node node_modules/typescript/bin/tsc --noEmit`
  - 테스트: `node node_modules/@playwright/test/cli.js test <파일> --workers=1 --reporter=line`
  - 빌드·서버(이 PC는 Google 글꼴 TLS 문제로 모의 글꼴 필요): `bash <scratchpad>/fontmock/rb.sh` — 3100을 끄고, 모의 글꼴로 빌드하고, `next start --port 3100`을 띄운다. 글꼴 서버(127.0.0.1:3199)가 꺼져 있으면 `node <scratchpad>/fontmock/serve.js &` 먼저.
- **포트 3000·3001은 다른 앱이 쓴다. 절대 쓰거나 끄지 않는다.** 테스트 서버는 3100. 코드를 바꿨으면 3100을 끄고 다시 빌드한 뒤 테스트한다.
- 커밋 메시지: `[ADD]`·`[MOD]`·`[FIX]` + 한글 제목(50자 이내)·한글 본문, 끝에 `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- **푸시는 사용자가 말할 때만.** `docs/`·`.claude/`는 커밋하지 않는다. `data/images/`는 커밋하지 않는다.
- 연락처를 묻지 않는다. 가게 이름만 선택 입력, 요청서에만 들어감.
- 「Prologue&에도 보내기」를 누르기 전까지 답을 어떤 요청으로도 보내지 않는다(`fetch`·`sendBeacon`·이미지 요청 모두 금지).
- 업체에게 가는 문서(PDF·복사 글)에 「Prologue&」 낱말을 넣지 않는다.
- AI를 쓰지 않는다. 금액을 지어내지 않는다(이유 문장의 배수는 「2~4배」 하나만, 조사 근거 있음).
- 새 움직임(전환 애니메이션) 없음 — 질문 전환은 즉시. 사이트 인터랙션 5종 상한.
- 한글 제목에 세리프(`--font-serif`, Bodoni Moda는 라틴 전용)를 쓰지 않는다. 전부 Pretendard(`--font-sans`).
- 문구: 「~요」 존댓말, 낫표 「」 쓰지 않음, `tests/banned.ts`의 `bannedWords()` 낱말 없음.
- 저장 키: `prologue.brief.v1`(답), `prologue.brief.compare.v1`(비교표). 저장 접근은 전부 try/catch.

## Review Focus

1. **저장이 막힌 브라우저(시크릿·차단):** 저장 실패해도 흐름이 끝까지 돌고 안내 한 줄이 보여야 한다 → Task 4 `storage.spec` + Task 6 흐름 테스트에 `localStorage` throw 컨텍스트.
2. **예전 형식이나 깨진 저장값:** 다른 버전·JSON 깨짐이면 오류 없이 빈 답으로 시작 → Task 4 단위 테스트.
3. **아무것도 안 고르고 끝까지 넘김(필수 둘만):** 요청서가 깨지지 않고 「업체 제안을 받고 싶은 것」에 빈 항목들이 모인다 → Task 3 단위 테스트 `minimal`.
4. **아주 긴 자유 입력(가게 이름·메모 수천 자):** 요약은 1,000자, 복사 글은 2,000자를 넘지 않는다 → Task 3 단위 테스트 `long`.
5. **서랍에 이미 긴 글이 있을 때 보내기:** 합계 1,000자 넘지 않음 → Task 8 단위·흐름 테스트.

---

## 파일 구조

| 파일 | 할 일 |
|---|---|
| `web/app/tools/print-test/page.tsx` | (Task 1, Task 9에서 삭제) 앱 안 브라우저 시험 페이지 |
| `web/components/brief/print-test.tsx` | (Task 1, Task 9에서 삭제) 시험 단추 셋 |
| `web/lib/brief/types.ts` | `Answers` 타입·상수 |
| `web/content/brief/questions.ts` | 질문 문구·선택지·도움말·견적 영향 이유 |
| `web/lib/brief/steps.ts` | `visibleSteps`, `REQUIRED`, `isAnswered` |
| `web/lib/brief/derive.ts` | `buildBrief`, `impactItems`, `vendorQuestions`, `unknownItems`, `toPlainText`, `briefSummary` |
| `web/lib/brief/storage.ts` | `emptyAnswers`, `loadAnswers`, `saveAnswers`, `clearBrief`, `storageOk`, 비교표 load/save |
| `web/lib/brief/prefill.ts` | `appendSummary` — 서랍 글과 요약 합치기(≤1000) |
| `web/lib/brief/in-app.ts` | `isInAppBrowser(ua)` |
| `web/components/header.tsx` | `variant: 'tool'` 추가 |
| `web/app/tools/brief/page.tsx` | 서버 컴포넌트, metadata, 머리글, `<BriefTool/>` |
| `web/app/tools/brief/page.module.css` | 본문 여백·인쇄 규칙 |
| `web/components/brief/brief-tool.tsx` | 클라이언트 루트 — 답 상태, 단계 이동, 결과 전환 |
| `web/components/brief/step-shell.tsx` + `.module.css` | 진행 표시·제목·도움말·하단 이전/다음 |
| `web/components/brief/fields.tsx` + `.module.css` | `Single`, `Multi`, `Seg`, `TextIn`, `Impact` |
| `web/components/brief/steps/*.tsx` | 단계별 화면(15개) |
| `web/components/brief/result.tsx` + `.module.css` | 요청서·영향·질문·비교표·내보내기·안내·Prologue& 줄 |
| `web/components/inquiry-drawer.tsx` | `prefill` 처리 |
| `web/app/sitemap.ts` | `/tools/brief` 추가 |
| `web/tests/brief-unit.spec.ts`, `brief-flow.spec.ts`, `brief-result.spec.ts`, `brief-drawer.spec.ts`, `print-test.spec.ts` | 테스트 |

---

### Task 1: 앱 안 브라우저 시험 페이지

**Files:**
- Create: `web/app/tools/print-test/page.tsx`
- Create: `web/components/brief/print-test.tsx`
- Test: `web/tests/print-test.spec.ts`

**Interfaces:**
- Consumes: 없음
- Produces: 없음(Task 9에서 지운다). 사용자의 기기 시험 결과가 Task 9의 `PRINT_IN_APP` 값을 정한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// web/tests/print-test.spec.ts
import { test, expect } from '@playwright/test';

test('시험 페이지: 검색 제외, 단추 셋, 저장소 쓰기 결과 표시', async ({ page }) => {
  await page.goto('/tools/print-test');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('button', { name: '인쇄 창 열기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '글 복사' })).toBeVisible();
  await page.getByRole('button', { name: '저장소 쓰기' }).click();
  await expect(page.locator('[data-result="storage"]')).toHaveText(/성공/);
  await expect(page.locator('[data-ua]')).not.toBeEmpty();
});

test('시험 페이지는 사이트맵에 없다', async ({ request }) => {
  const t = await (await request.get('/sitemap.xml')).text();
  expect(t).not.toContain('print-test');
});
```

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/@playwright/test/cli.js test tests/print-test.spec.ts --project=w1440 --workers=1 --reporter=line`
Expected: FAIL — `/tools/print-test` 404.

- [ ] **Step 3: 구현**

```tsx
// web/app/tools/print-test/page.tsx
import type { Metadata } from 'next';
import { PrintTest } from '@/components/brief/print-test';

/** 앱 안 브라우저(쓰레드 등)에서 인쇄·복사·저장이 되는지 기기에서 확인하는 임시 페이지 — 확인 뒤 지운다 */
export const metadata: Metadata = { title: '기기 시험', robots: { index: false, follow: false } };

export default function Page() {
  return <main style={{ maxWidth: 560, margin: '0 auto', padding: '96px 16px' }}><PrintTest /></main>;
}
```

```tsx
// web/components/brief/print-test.tsx
'use client';
import { useEffect, useState } from 'react';

type R = Record<'print' | 'copy' | 'storage', string>;

export function PrintTest() {
  const [r, setR] = useState<R>({ print: '', copy: '', storage: '' });
  const [ua, setUa] = useState('');
  useEffect(() => { setUa(navigator.userAgent); }, []);
  const set = (k: keyof R, v: string) => setR((p) => ({ ...p, [k]: v }));

  const doPrint = () => {
    try {
      const t0 = Date.now();
      window.print();
      // 인쇄 창이 실제로 뜨면 그동안 스크립트가 멈춰 시간이 흐른다. 바로 돌아오면 무시됐을 가능성이 크다
      set('print', `호출함(멈춘 시간 ${Date.now() - t0}ms) — 인쇄 창이 떴는지 눈으로 확인해 주세요`);
    } catch (e) { set('print', `실패: ${(e as Error).message}`); }
  };
  const doCopy = async () => {
    try { await navigator.clipboard.writeText('복사 시험 문장'); set('copy', '성공 — 메모장에 붙여 넣어 확인해 주세요'); }
    catch (e) { set('copy', `실패: ${(e as Error)?.message ?? '알 수 없음'}`); }
  };
  const doStore = () => {
    try { localStorage.setItem('prologue.print-test', String(Date.now())); localStorage.removeItem('prologue.print-test'); set('storage', '성공'); }
    catch (e) { set('storage', `실패: ${(e as Error).message}`); }
  };

  const row = { display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 24 };
  const btn = { height: 48, fontSize: 16, fontWeight: 600 } as const;
  return (
    <div>
      <h1 style={{ fontSize: 22 }}>기기 시험</h1>
      <div style={row}><button type="button" style={btn} onClick={doPrint}>인쇄 창 열기</button><output data-result="print">{r.print}</output></div>
      <div style={row}><button type="button" style={btn} onClick={doCopy}>글 복사</button><output data-result="copy">{r.copy}</output></div>
      <div style={row}><button type="button" style={btn} onClick={doStore}>저장소 쓰기</button><output data-result="storage">{r.storage}</output></div>
      <p style={{ fontSize: 12, color: 'var(--bone-500)', wordBreak: 'break-all' }} data-ua>{ua}</p>
    </div>
  );
}
```

- [ ] **Step 4: 빌드·통과 확인**

Run: `bash <scratchpad>/fontmock/rb.sh` 다음 Step 2 명령
Expected: 2 passed.

- [ ] **Step 5: 커밋**

```bash
git add web/app/tools/print-test/page.tsx web/components/brief/print-test.tsx web/tests/print-test.spec.ts
git commit -F - <<'EOF'
[ADD] 앱 안 브라우저 기기 시험 페이지

요청서 도구의 PDF 저장(인쇄)·복사·저장이 쓰레드 같은 앱 안
브라우저에서 되는지 실제 기기로 확인하는 임시 페이지.
검색 제외, 사이트맵·링크 없음. 확인 뒤 지운다.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

- [ ] **Step 6: 멈추고 사용자에게 요청**

푸시하지 않는다. 사용자에게 「main에 푸시해서 `https://www.prologueand.com/tools/print-test`를 쓰레드 앱(아이폰·안드로이드) 안에서 열어 볼까요?」를 묻는다. 허락하면 푸시 → 사용자가 세 단추 결과와 화면 아래 브라우저 문자열을 알려 줌 → 결과를 진행 기록에 `Ruling: PRINT_IN_APP = 'ok'|'blocked'`로 남긴다. **결과를 기다리는 동안 Task 2~8을 계속한다.**

---

### Task 2: 답 타입·질문 정의·단계 목록

**Files:**
- Create: `web/lib/brief/types.ts`
- Create: `web/content/brief/questions.ts`
- Create: `web/lib/brief/steps.ts`
- Test: `web/tests/brief-unit.spec.ts`

**Interfaces:**
- Produces:
  - `type Answers`(아래), `type StepId`, `UNKNOWN = '모르겠어요'`
  - `Q` 객체(질문 문구·선택지·도움말·이유)
  - `visibleSteps(a: Answers): StepId[]`, `REQUIRED: StepId[]`, `isAnswered(a: Answers, id: StepId): boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// web/tests/brief-unit.spec.ts
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
```

(`emptyAnswers`는 Task 4에서 만든다 — 이 Step에서는 Task 4의 `emptyAnswers`만 먼저 만들어 둔다. 아래 Step 3에 포함.)

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/@playwright/test/cli.js test tests/brief-unit.spec.ts --project=w1440 --workers=1 --reporter=line`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

```ts
// web/lib/brief/types.ts
export const UNKNOWN = '모르겠어요';

export type StepId =
  | 'mode' | 'renew' | 'kind' | 'goal' | 'audience' | 'pages' | 'features' | 'links'
  | 'content' | 'brand' | 'design' | 'ops' | 'own' | 'scope' | 'when';

export type Feature = '문의 남기기' | '예약 받기' | '상품 결제' | '회원' | '외국어 페이지' | '직접 글 올리기(공지·소식)' | '카카오 채널 연결';
export type Goal = '전화하기' | '문의 남기기' | '예약하기' | '찾아오기' | '상품 사기' | '소식 보기';
export type Ref = { url: string; likes: string[]; memo: string };

/** 사장님 답. 선택 안 함은 undefined 또는 빈 배열·빈 문자열. 「모르겠어요」는 UNKNOWN 문자열 */
export type Answers = {
  v: 1;
  mode?: 'new' | 'renew';
  renewUrl: string; renewPain: string; renewAmount?: string;
  kind?: string; kindOther: string; name: string;
  goalMain?: Goal; goalMore: Goal[];
  audience: string[];
  pages: string[]; pagesExtra: string;
  features: Partial<Record<Feature, 'must' | 'later'>>; featuresUnknown: boolean;
  booking?: string; shopCount?: string; shopHow?: string; member?: string; langs: string[]; langOther: string;
  links: string[];
  copy?: string; photo?: string; contentBy: string;
  brand: string[];
  design?: string; refs: Ref[]; dislikes: string;
  ops: string[];
  own: { domain: string; hosting: string; admin: string; source: string };
  revisions?: string; care?: string; monthlyCost: boolean;
  openDate: string; openUnknown: boolean; openFixed?: string;
  budget?: string; budgetInBrief: boolean;
  decider?: string;
};
```

```ts
// web/content/brief/questions.ts
import type { Feature, Goal } from '@/lib/brief/types';

/** 질문 문구·선택지·도움말·견적 영향 이유 — 명세 §3. 금액을 쓰지 않는다(배수는 「2~4배」만) */
export const Q = {
  mode: { title: '새로 만드시나요, 지금 홈페이지를 고치시나요?', opts: ['새로 만들기', '지금 홈페이지 고치기'] as const },
  renew: {
    title: '지금 홈페이지에 대해 알려 주세요',
    url: '지금 홈페이지 주소 (선택)',
    pain: '지금 홈페이지에서 가장 불편한 점 (선택)',
    amount: { label: '그대로 옮겨야 하는 글·사진은 얼마나 되나요?', opts: ['적어요(10개 이하)', '보통', '많아요(100개 넘음)', '모르겠어요'] },
    amountWhy: '글과 사진을 옮기는 작업에 시간이 따로 들어요.',
  },
  kind: {
    title: '어떤 곳의 홈페이지인가요?',
    help: '꼭 골라 주세요. 요청서 맨 위에 들어가요.',
    opts: ['가게(식당·카페 등)', '예약 받는 곳(병원·학원·미용실 등)', '브랜드·제품', '회사·사무실', '직접 입력'],
    name: '가게·회사 이름 (선택)',
    nameHelp: '요청서에만 들어가요. 어디로도 보내지 않아요.',
  },
  goal: {
    title: '손님이 홈페이지에서 딱 한 가지를 한다면 무엇이었으면 하세요?',
    help: '가장 중요한 하나를 골라 주세요. 그 밖에 했으면 하는 것은 아래에서 더 고를 수 있어요.',
    opts: ['전화하기', '문의 남기기', '예약하기', '찾아오기', '상품 사기', '소식 보기'] as Goal[],
    more: '그 밖에 했으면 하는 것 (선택)',
  },
  audience: { title: '주로 누가 보나요?', help: '여러 개 골라도 돼요.', opts: ['처음 오는 손님', '단골', '거래처·기업', '외국인'] },
  pages: {
    title: '어떤 페이지가 필요하세요?',
    help: '메뉴에 들어갈 이름이라고 생각하고 골라 주세요.',
    opts: ['소개', '메뉴·서비스', '가격', '오시는 길', '소식', '사진·포트폴리오', '후기', '자주 묻는 질문', '문의', '채용'],
    extra: '그 밖에 필요한 페이지 (쉼표로 나눠 적어 주세요)',
    manyWhy: '페이지마다 모양이 다르면 그만큼 작업이 늘어나요.',
  },
  features: {
    title: '홈페이지에 어떤 기능이 필요하세요?',
    help: '고른 기능마다 오픈할 때 꼭 있어야 하는지, 나중에 해도 되는지 골라 주세요.',
    opts: ['문의 남기기', '예약 받기', '상품 결제', '회원', '외국어 페이지', '직접 글 올리기(공지·소식)', '카카오 채널 연결'] as Feature[],
    must: '오픈 때 꼭', later: '나중에',
    unknown: '어떤 기능이 필요한지 모르겠어요',
    why: {
      '예약 받기': '홈페이지 안에서 날짜·시간을 받고 겹치지 않게 관리하려면 따로 만들어야 할 게 많아요. 네이버 예약을 연결하면 훨씬 가벼워져요.',
      '상품 결제': '결제를 홈페이지 안에서 받으려면 결제 서비스 연결과 주문 관리가 따로 들어가요. 스마트스토어로 연결하면 가벼워져요.',
      '회원': '로그인을 만들면 가입·비밀번호 찾기·개인정보 보관까지 함께 만들어야 해요.',
      '외국어 페이지': '언어가 하나 늘 때마다 글과 화면을 그만큼 더 만들어야 해요.',
    } as Partial<Record<Feature, string>>,
    booking: { label: '예약은 어떻게 받으실 건가요?', opts: ['네이버 예약 연결', '홈페이지 안에서 직접', '모르겠어요'] },
    shopCount: { label: '상품은 대략 몇 개인가요?', opts: ['10개 이하', '50개 이하', '그 이상', '모르겠어요'] },
    shopHow: { label: '결제는 어디서 받으실 건가요?', opts: ['스마트스토어 연결로 충분', '홈페이지에서 직접 결제', '모르겠어요'] },
    member: { label: '누가 로그인하나요?', opts: ['카카오로 로그인', '이메일로 가입', '관리자만', '모르겠어요'] },
    langs: { label: '어떤 언어가 필요하세요?', opts: ['영어', '중국어', '일본어'], other: '그 밖의 언어' },
  },
  links: {
    title: '지금 쓰고 있어서 홈페이지와 이어져야 하는 게 있나요?',
    opts: ['네이버 플레이스·예약', '카카오 채널', '인스타그램', '스마트스토어', '배달앱', '없어요'],
    manyWhy: '연결하는 곳마다 작업이 따로 들어요.',
  },
  content: {
    title: '소개 글과 사진은 어떻게 준비하실 건가요?',
    copy: { label: '소개 글', opts: ['직접 준비', '써 주길 원함', '모르겠어요'] },
    photo: { label: '사진', opts: ['있어요', '찍어 주길 원함', '모르겠어요'] },
    by: '직접 준비하신다면 언제까지 주실 수 있나요? (선택)',
    why: '글 작성·사진 촬영은 보통 제작비와 따로 계산돼요.',
  },
  brand: {
    title: '지금 쓰고 있는 디자인 자료가 있나요?',
    opts: ['로고 원본 파일', '정해진 색·글꼴', '명함·전단 같은 인쇄물', '없어요'],
    noneWhy: '로고부터 새로 만들면 따로 들어요.',
  },
  design: {
    title: '디자인은 어떻게 할까요?',
    opts: ['템플릿이어도 괜찮아요', '우리만의 디자인', '모르겠어요'],
    customWhy: '우리만의 디자인은 보통 템플릿의 2~4배예요.',
    refsLabel: '마음에 드는 홈페이지 (최대 3개, 선택)',
    likes: ['색·분위기', '배치', '글·사진', '움직임', '기능'],
    memo: '한 줄 메모 (선택)',
    dislikes: '이렇게는 싫다 싶은 곳 (선택)',
  },
  ops: {
    title: '오픈 뒤 직접 고치고 싶은 게 있나요?',
    help: '하나라도 고르면 요청서에 관리자 화면이 필요하다고 적혀요.',
    opts: ['공지·소식', '사진', '메뉴·가격', '없어요(다 맡길게요)'],
  },
  own: {
    title: '홈페이지는 누구 이름으로 할까요?',
    help: '나중에 업체를 바꾸거나 연락이 끊겨도 홈페이지를 지킬 수 있게, 미리 정해 두는 게 좋아요.',
    rows: [
      { key: 'domain', label: '도메인 (홈페이지 주소)', why: '업체 이름으로 사면 업체를 바꿀 때 주소를 못 가져올 수 있어요.', opts: ['내 이름으로', '업체에 맡김', '모르겠어요'] },
      { key: 'hosting', label: '호스팅 (홈페이지를 올려 두는 서버) 계정', why: '내 계정이면 매달 비용과 연장을 직접 확인할 수 있어요.', opts: ['내 이름으로', '업체에 맡김', '모르겠어요'] },
      { key: 'admin', label: '관리자 계정', why: '대표 계정은 내가 갖고, 업체에는 작업용 계정을 따로 주는 방식이에요.', opts: ['대표 계정은 내가', '업체에 맡김', '모르겠어요'] },
      { key: 'source', label: '소스·디자인 파일', why: '오픈할 때 받아 두면 다른 업체에 맡겨도 이어서 고칠 수 있어요.', opts: ['오픈 때 받기', '안 받아도 됨', '모르겠어요'] },
    ] as const,
  },
  scope: {
    title: '범위와 비용, 미리 정해 둘까요?',
    revisions: { label: '포함할 수정 횟수', opts: ['2번', '3번(보통)', '5번', '업체 제안'] },
    care: { label: '오픈 뒤 관리', opts: ['매달 맡기기', '필요할 때만', '직접 할게요'] },
    monthly: '매달 나가는 비용을 모두 알려 주세요',
  },
  when: {
    title: '일정과 예산, 결정하실 분을 알려 주세요',
    date: '오픈 희망일', dateUnknown: '아직 모르겠어요',
    fixed: { label: '그 날짜는 꼭 지켜야 하나요?', opts: ['개업·행사라 꼭', '희망일이에요'] },
    budget: { label: '생각하는 예산 (선택)', opts: ['100만 원 이하', '100~300만 원', '300~800만 원', '800만 원 이상', '모르겠어요'] },
    budgetIn: '예산을 요청서에 넣기',
    budgetHelp: '예산을 밝히면 견적이 그만큼 맞춰 올라오기도 해요. 넣을지는 정하세요.',
    decider: { label: '최종 결정은 누가 하나요?', opts: ['나 혼자', '여럿이 같이'] },
    rushWhy: '급하게 맞춰야 하면 비용이 붙을 수 있어요.',
  },
  impactBadge: '견적에 크게 영향',
  dunno: '모르겠어요',
  required: '하나만 골라 주세요',
} as const;
```

```ts
// web/lib/brief/steps.ts
import type { Answers, StepId } from './types';

export const REQUIRED: StepId[] = ['kind', 'goal'];

const ALL: StepId[] = ['mode', 'renew', 'kind', 'goal', 'audience', 'pages', 'features', 'links', 'content', 'brand', 'design', 'ops', 'own', 'scope', 'when'];

/** 지금 답에서 보이는 단계 — 고치기일 때만 renew */
export function visibleSteps(a: Answers): StepId[] {
  return ALL.filter((s) => s !== 'renew' || a.mode === 'renew');
}

export function isAnswered(a: Answers, id: StepId): boolean {
  if (id === 'kind') return !!a.kind && (a.kind !== '직접 입력' || a.kindOther.trim().length > 0);
  if (id === 'goal') return !!a.goalMain;
  return true;
}
```

```ts
// web/lib/brief/storage.ts — 이 Task에서는 emptyAnswers만. 나머지는 Task 4
import type { Answers } from './types';

export function emptyAnswers(): Answers {
  return {
    v: 1, renewUrl: '', renewPain: '', kindOther: '', name: '', goalMore: [], audience: [], pages: [], pagesExtra: '',
    features: {}, featuresUnknown: false, langs: [], langOther: '', links: [], contentBy: '', brand: [], refs: [], dislikes: '',
    ops: [], own: { domain: '내 이름으로', hosting: '내 이름으로', admin: '대표 계정은 내가', source: '오픈 때 받기' },
    monthlyCost: true, openDate: '', openUnknown: false, budgetInBrief: false,
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: Step 2 명령 (순수 모듈 테스트라 빌드 불필요 — 서버 재사용)
Expected: 3 passed.

- [ ] **Step 5: 커밋**

```bash
git add web/lib/brief/types.ts web/content/brief/questions.ts web/lib/brief/steps.ts web/lib/brief/storage.ts web/tests/brief-unit.spec.ts
git commit -F - <<'EOF'
[ADD] 요청서 도구 질문 정의와 단계 목록

질문 13개(고치기 단계 포함 15단계)의 문구·선택지·견적 영향 이유를
데이터로 두고, 답에 따라 보이는 단계와 필수 질문(어떤 곳·주 목적)을
정한다. 명의 질문은 「내 이름으로」가 기본값.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 3: 결과 계산(요청서·견적 영향·업체 질문·복사 글·요약)

**Files:**
- Create: `web/lib/brief/derive.ts`
- Test: `web/tests/brief-unit.spec.ts` (추가)

**Interfaces:**
- Consumes: `Answers`, `UNKNOWN`, `Q`, `emptyAnswers`
- Produces:
  - `type Row = { label: string; value: string; tag?: 'must' | 'later' | 'ask' }`
  - `type Section = { id: string; title: string; rows: Row[] }`
  - `buildBrief(a: Answers, today: Date): { title: string; subtitle: string; sections: Section[] }`
  - `impactItems(a: Answers, today: Date): { title: string; reason: string }[]`
  - `vendorQuestions(a: Answers): string[]`
  - `unknownItems(a: Answers): string[]`
  - `toPlainText(a: Answers, today: Date): string` (≤ 2000자)
  - `briefSummary(a: Answers, today: Date): string` (≤ 1000자)

- [ ] **Step 1: 실패하는 테스트 추가**

```ts
// web/tests/brief-unit.spec.ts 끝에 추가
import { buildBrief, impactItems, vendorQuestions, unknownItems, toPlainText, briefSummary } from '../lib/brief/derive';
import type { Answers } from '../lib/brief/types';

const D = new Date('2026-10-15T09:00:00+09:00');
const cafe = (): Answers => ({ ...emptyAnswers(), mode: 'new', kind: '가게(식당·카페 등)', name: '가람 로스터리',
  goalMain: '찾아오기', goalMore: ['예약하기'], audience: ['처음 오는 손님', '단골'], pages: ['소개', '메뉴·서비스', '오시는 길', '소식', '문의'],
  features: { '문의 남기기': 'must', '예약 받기': 'must', '직접 글 올리기(공지·소식)': 'later' }, booking: '네이버 예약 연결',
  copy: '모르겠어요', photo: '찍어 주길 원함', design: '모르겠어요', ops: ['공지·소식'], revisions: '3번(보통)', care: '필요할 때만' });

test.describe('결과 계산', () => {
  test('요청서 제목·부제·단원', () => {
    const b = buildBrief(cafe(), D);
    expect(b.title).toBe('홈페이지 제작 요청서 · 가람 로스터리');
    expect(b.subtitle).toBe('새로 만들기 · 2026년 10월 15일 작성');
    const ids = b.sections.map((s) => s.id);
    expect(ids).toEqual(['purpose', 'pages', 'features', 'links', 'content', 'brand', 'design', 'ops', 'own', 'scope', 'when', 'unknown']);
    const f = b.sections.find((s) => s.id === 'features')!;
    expect(f.rows.find((r) => r.label === '예약 받기')).toMatchObject({ tag: 'must', value: '네이버 예약 연결' });
    expect(b.sections.find((s) => s.id === 'ops')!.rows.some((r) => r.value.includes('관리자 화면 필요'))).toBe(true);
  });
  test('이름이 없으면 「이름 미정」, 고치기면 renew 단원', () => {
    const b = buildBrief({ ...cafe(), name: '', mode: 'renew', renewUrl: 'example.com', renewAmount: '많아요(100개 넘음)' }, D);
    expect(b.title).toBe('홈페이지 제작 요청서 · 이름 미정');
    expect(b.sections[1].id).toBe('renew');
  });
  test('견적 영향: 예약(네이버)·사진 촬영, 금액 없음', () => {
    const it = impactItems(cafe(), D);
    expect(it.map((i) => i.title)).toEqual(['예약 받기 (오픈 때 꼭)', '사진 촬영을 맡김']);
    expect(it.every((i) => !/\d+\s*만\s*원/.test(i.reason))).toBe(true);
  });
  test('견적 영향: 직접 예약·우리만의 디자인·외국어 2개·급한 개업', () => {
    const a: Answers = { ...cafe(), booking: '홈페이지 안에서 직접', design: '우리만의 디자인', features: { ...cafe().features, '외국어 페이지': 'later' },
      langs: ['영어', '일본어'], openDate: '2026-11-01', openFixed: '개업·행사라 꼭' };
    const t = impactItems(a, D).map((i) => i.title);
    expect(t).toContain('우리만의 디자인');
    expect(t).toContain('외국어 페이지 (2개 언어)');
    expect(t).toContain('개업·행사 날짜에 맞춰야 함');
  });
  test('업체 질문: 항상 4개 + 조건', () => {
    const q = vendorQuestions(cafe());
    expect(q.slice(0, 4)).toEqual([
      '도메인과 호스팅은 제 이름으로 사 주시나요?', '수정은 몇 번까지 포함인가요?',
      '오픈 뒤 매달 드는 비용은 무엇이고 얼마인가요?', '오픈 뒤 고칠 게 생기면 어디로 연락하고, 보통 며칠 걸리나요?']);
    expect(q).toContain('오픈할 때 소스와 디자인 파일을 넘겨 주시나요?');
    expect(q).toContain('관리자 화면에서 제가 직접 고칠 수 있는 범위는 어디까지인가요?');
    expect(q).toContain('네이버 예약은 어떻게 연결하시나요?');
    expect(q).toContain('글 작성·사진 촬영 비용은 견적에 들어 있나요?');
  });
  test('업체 제안 받기 목록', () => {
    expect(unknownItems(cafe())).toEqual(['소개 글', '디자인 방식']);
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
```

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/@playwright/test/cli.js test tests/brief-unit.spec.ts --project=w1440 --workers=1 --reporter=line`
Expected: FAIL — `derive` 없음.

- [ ] **Step 3: 구현**

```ts
// web/lib/brief/derive.ts
import { Q } from '@/content/brief/questions';
import { UNKNOWN, type Answers, type Feature } from './types';

export type Row = { label: string; value: string; tag?: 'must' | 'later' | 'ask' };
export type Section = { id: string; title: string; rows: Row[] };

const ASK = '업체 제안 받기';
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const list = (xs: string[]) => xs.filter(Boolean).join(', ');
const dateKo = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
const isUnknown = (v?: string) => !v || v === UNKNOWN || v.startsWith('모르겠어요');
const kindText = (a: Answers) => (a.kind === '직접 입력' ? a.kindOther.trim() : a.kind ?? '');
const featureEntries = (a: Answers) => (Object.entries(a.features) as [Feature, 'must' | 'later'][]);
const pagesAll = (a: Answers) => [...a.pages, ...a.pagesExtra.split(',').map((s) => s.trim()).filter(Boolean)];
const needsAdmin = (a: Answers) => a.ops.some((o) => !o.startsWith('없어요'));
const langCount = (a: Answers) => a.langs.length + (a.langOther.trim() ? 1 : 0);

function featureDetail(a: Answers, f: Feature): string {
  if (f === '예약 받기') return a.booking && !isUnknown(a.booking) ? a.booking : '';
  if (f === '상품 결제') return list([a.shopCount && !isUnknown(a.shopCount) ? `상품 ${a.shopCount}` : '', a.shopHow && !isUnknown(a.shopHow) ? a.shopHow : '']);
  if (f === '회원') return a.member && !isUnknown(a.member) ? a.member : '';
  if (f === '외국어 페이지') return list([...a.langs, a.langOther.trim()]);
  return '';
}

export function unknownItems(a: Answers): string[] {
  const out: string[] = [];
  if (a.mode === 'renew' && isUnknown(a.renewAmount)) out.push('옮길 글·사진 양');
  if (a.audience.length === 0 || a.audience.includes(UNKNOWN)) out.push('주로 보는 사람');
  if (pagesAll(a).length === 0) out.push('페이지 구성');
  if (a.featuresUnknown || featureEntries(a).length === 0) out.push('필요한 기능');
  if (a.copy === undefined || isUnknown(a.copy)) out.push('소개 글');
  if (a.photo === undefined ? false : isUnknown(a.photo)) out.push('사진');
  if (a.design === undefined || isUnknown(a.design)) out.push('디자인 방식');
  (['domain', 'hosting', 'admin', 'source'] as const).forEach((k) => {
    if (isUnknown(a.own[k])) out.push(Q.own.rows.find((r) => r.key === k)!.label);
  });
  if (a.revisions === '업체 제안') out.push('수정 횟수');
  if (!a.openDate && a.openUnknown) out.push('오픈 일정');
  return out;
}

export function buildBrief(a: Answers, today: Date): { title: string; subtitle: string; sections: Section[] } {
  const name = clip(a.name.trim(), 60) || '이름 미정';
  const sections: Section[] = [];
  sections.push({ id: 'purpose', title: '무엇을 위한 홈페이지인가요', rows: [
    { label: '어떤 곳', value: clip(kindText(a), 80) },
    { label: '손님이 할 일', value: [a.goalMain ?? '', ...(a.goalMore.length ? [`그 밖에 ${list(a.goalMore)}`] : [])].filter(Boolean).join(' · ') },
    ...(a.audience.length && !a.audience.includes(UNKNOWN) ? [{ label: '주로 보는 사람', value: list(a.audience) }] : []),
  ] });
  if (a.mode === 'renew') sections.push({ id: 'renew', title: '지금 홈페이지', rows: [
    ...(a.renewUrl.trim() ? [{ label: '주소', value: clip(a.renewUrl.trim(), 120) }] : []),
    ...(a.renewPain.trim() ? [{ label: '불편한 점', value: clip(a.renewPain.trim(), 300) }] : []),
    ...(a.renewAmount && !isUnknown(a.renewAmount) ? [{ label: '옮길 글·사진', value: a.renewAmount }] : []),
  ] });
  const pages = pagesAll(a);
  sections.push({ id: 'pages', title: '페이지', rows: pages.length ? [{ label: `메뉴 ${pages.length}개`, value: clip(pages.join(' · '), 300) }] : [] });
  sections.push({ id: 'features', title: '기능', rows: featureEntries(a).map(([f, t]) => ({ label: f, value: featureDetail(a, f), tag: t })) });
  sections.push({ id: 'links', title: '이어져야 하는 것', rows: a.links.length ? [{ label: '연결', value: list(a.links) }] : [] });
  sections.push({ id: 'content', title: '글과 사진', rows: [
    ...(a.copy && !isUnknown(a.copy) ? [{ label: '소개 글', value: a.copy }] : []),
    ...(a.photo && !isUnknown(a.photo) ? [{ label: '사진', value: a.photo }] : []),
    ...(a.contentBy ? [{ label: '자료 줄 수 있는 날', value: a.contentBy }] : []),
  ] });
  sections.push({ id: 'brand', title: '디자인 자료', rows: a.brand.length ? [{ label: '있는 것', value: list(a.brand) }] : [] });
  sections.push({ id: 'design', title: '디자인과 참고 사이트', rows: [
    ...(a.design && !isUnknown(a.design) ? [{ label: '방식', value: a.design }] : []),
    ...a.refs.filter((r) => r.url.trim()).map((r, i) => ({ label: `참고 ${i + 1}`, value: clip([r.url.trim(), r.likes.length ? `좋은 점: ${list(r.likes)}` : '', r.memo.trim()].filter(Boolean).join(' — '), 300) })),
    ...(a.dislikes.trim() ? [{ label: '피하고 싶은 것', value: clip(a.dislikes.trim(), 300) }] : []),
  ] });
  sections.push({ id: 'ops', title: '오픈 뒤 운영', rows: needsAdmin(a)
    ? [{ label: '직접 고칠 것', value: `${list(a.ops)} — 관리자 화면 필요` }]
    : a.ops.length ? [{ label: '직접 고칠 것', value: '없음(다 맡김)' }] : [] });
  sections.push({ id: 'own', title: '명의와 소유권', rows: Q.own.rows.filter((r) => !isUnknown(a.own[r.key])).map((r) => ({ label: r.label.replace(/ \(.*\)$/, ''), value: a.own[r.key] })) });
  sections.push({ id: 'scope', title: '범위와 비용', rows: [
    ...(a.revisions && a.revisions !== '업체 제안' ? [{ label: '수정 횟수', value: a.revisions.replace('(보통)', '') }] : []),
    ...(a.care ? [{ label: '오픈 뒤 관리', value: a.care }] : []),
    ...(a.monthlyCost ? [{ label: '매달 비용', value: '매달 나가는 비용을 모두 알려 주세요' }] : []),
  ] });
  sections.push({ id: 'when', title: '일정과 결정', rows: [
    ...(a.openDate ? [{ label: '오픈 희망일', value: `${a.openDate}${a.openFixed ? ` (${a.openFixed})` : ''}` }] : []),
    ...(a.decider ? [{ label: '최종 결정', value: a.decider }] : []),
  ] });
  if (a.budgetInBrief && a.budget && !isUnknown(a.budget)) sections.push({ id: 'budget', title: '예산', rows: [{ label: '생각하는 예산', value: a.budget }] });
  sections.push({ id: 'unknown', title: '업체 제안을 받고 싶은 것', rows: unknownItems(a).map((l) => ({ label: l, value: ASK, tag: 'ask' as const })) });
  return {
    title: `홈페이지 제작 요청서 · ${name}`,
    subtitle: `${a.mode === 'renew' ? '지금 홈페이지 고치기' : '새로 만들기'} · ${dateKo(today)} 작성`,
    sections,
  };
}

export function impactItems(a: Answers, today: Date): { title: string; reason: string }[] {
  const out: { title: string; reason: string }[] = [];
  const t = (f: Feature) => (a.features[f] === 'must' ? '오픈 때 꼭' : '나중에');
  if (a.mode === 'renew' && a.renewAmount?.startsWith('많아요')) out.push({ title: '옮길 글·사진이 많음', reason: Q.renew.amountWhy });
  if (pagesAll(a).length > 10) out.push({ title: `페이지 ${pagesAll(a).length}개`, reason: Q.pages.manyWhy });
  if (a.features['예약 받기']) out.push({ title: `예약 받기 (${t('예약 받기')})`, reason: a.booking === '네이버 예약 연결' ? '네이버 예약을 연결해서 가벼운 편이에요. 홈페이지 안에서 직접 받으면 크게 올라가요.' : Q.features.why['예약 받기']! });
  if (a.features['상품 결제']) out.push({ title: `상품 결제 (${t('상품 결제')})`, reason: Q.features.why['상품 결제']! });
  if (a.features['회원'] && a.member !== '관리자만') out.push({ title: `회원 (${t('회원')})`, reason: Q.features.why['회원']! });
  if (a.features['외국어 페이지']) out.push({ title: `외국어 페이지 (${Math.max(langCount(a), 1)}개 언어)`, reason: Q.features.why['외국어 페이지']! });
  if (a.links.filter((l) => l !== '없어요').length > 3) out.push({ title: `연결 ${a.links.length}곳`, reason: Q.links.manyWhy });
  if (a.copy === '써 주길 원함') out.push({ title: '소개 글 작성을 맡김', reason: Q.content.why });
  if (a.photo === '찍어 주길 원함') out.push({ title: '사진 촬영을 맡김', reason: Q.content.why });
  if (a.brand.includes('없어요')) out.push({ title: '로고가 없음', reason: Q.brand.noneWhy });
  if (a.design === '우리만의 디자인') out.push({ title: '우리만의 디자인', reason: Q.design.customWhy });
  if (a.openFixed === '개업·행사라 꼭' && a.openDate) {
    const days = (new Date(`${a.openDate}T00:00:00+09:00`).getTime() - today.getTime()) / 86_400_000;
    if (days <= 30) out.push({ title: '개업·행사 날짜에 맞춰야 함', reason: Q.when.rushWhy });
  }
  return out;
}

export function vendorQuestions(a: Answers): string[] {
  const q = ['도메인과 호스팅은 제 이름으로 사 주시나요?', '수정은 몇 번까지 포함인가요?', '오픈 뒤 매달 드는 비용은 무엇이고 얼마인가요?', '오픈 뒤 고칠 게 생기면 어디로 연락하고, 보통 며칠 걸리나요?'];
  if (a.own.source === '오픈 때 받기') q.push('오픈할 때 소스와 디자인 파일을 넘겨 주시나요?');
  if (needsAdmin(a)) q.push('관리자 화면에서 제가 직접 고칠 수 있는 범위는 어디까지인가요?');
  if (a.features['예약 받기']) q.push(a.booking === '네이버 예약 연결' ? '네이버 예약은 어떻게 연결하시나요?' : '예약은 어떤 방식으로 만드시나요?');
  if (a.features['상품 결제']) q.push('결제 수수료와 결제 서비스 가입은 누가 하나요?');
  if (a.features['외국어 페이지']) q.push('외국어 글 번역도 포함인가요?');
  if (a.copy === '써 주길 원함' || a.photo === '찍어 주길 원함') q.push('글 작성·사진 촬영 비용은 견적에 들어 있나요?');
  if (a.mode === 'renew' && a.renewAmount && /^(보통|많아요)/.test(a.renewAmount)) q.push('지금 홈페이지의 글과 사진을 옮기는 것도 포함인가요?');
  if (a.openFixed === '개업·행사라 꼭') q.push('이 날짜까지 오픈이 가능한가요? 늦어지면 어떻게 하나요?');
  return q;
}

export function toPlainText(a: Answers, today: Date): string {
  const b = buildBrief(a, today);
  const lines = [b.title, b.subtitle, ''];
  for (const s of b.sections) {
    if (!s.rows.length) continue;
    lines.push(`■ ${s.title}`);
    for (const r of s.rows) lines.push(`- ${r.label}${r.tag === 'must' ? ' [오픈 때 꼭]' : r.tag === 'later' ? ' [나중에]' : ''}${r.value ? `: ${r.value}` : ''}`);
    lines.push('');
  }
  lines.push('■ 견적 주실 때 함께 답해 주세요');
  vendorQuestions(a).forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  return clip(lines.join('\n'), 2000);
}

export function briefSummary(a: Answers, today: Date): string {
  const musts = featureEntries(a).filter(([, t]) => t === 'must').map(([f]) => f);
  const parts = [
    '[요청서 만들기]',
    a.mode === 'renew' ? '지금 홈페이지 고치기' : '새로 만들기',
    `어떤 곳: ${clip(kindText(a), 60)}${a.name.trim() ? ` (${clip(a.name.trim(), 40)})` : ''}`,
    a.goalMain ? `손님이 할 일: ${a.goalMain}` : '',
    musts.length ? `꼭 필요한 기능: ${list(musts)}` : '',
    pagesAll(a).length ? `페이지 ${pagesAll(a).length}개` : '',
    a.openDate ? `오픈 희망일: ${a.openDate}` : '',
    `작성일: ${dateKo(today)}`,
  ].filter(Boolean);
  return clip(parts.join('\n'), 1000);
}
```

- [ ] **Step 4: 통과 확인**

Run: Step 2 명령
Expected: 모든 테스트 통과. 실패하면 기대값이 아니라 구현을 고친다(단, `unknownItems` 기대 순서는 위 구현 순서가 기준).

- [ ] **Step 5: 커밋**

```bash
git add web/lib/brief/derive.ts web/tests/brief-unit.spec.ts
git commit -F - <<'EOF'
[ADD] 요청서 결과 계산

답에서 요청서 단원, 견적을 크게 움직이는 항목(금액 없이 이유만),
업체에 꼭 물어볼 질문, 업체 제안 받기 목록, 복사용 글(2,000자 안),
문의 서랍용 요약(1,000자 안)을 만든다. 예산은 넣기를 켰을 때만.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 4: 저장(기기에만)·비교표·앱 안 브라우저 감지·서랍 요약 합치기

**Files:**
- Modify: `web/lib/brief/storage.ts`
- Create: `web/lib/brief/prefill.ts`
- Create: `web/lib/brief/in-app.ts`
- Test: `web/tests/brief-unit.spec.ts` (추가)

**Interfaces:**
- Produces:
  - `type Saved = { answers: Answers; step: StepId; done: boolean }`
  - `loadSaved(s: Storage | null): Saved | null`, `saveSaved(s: Storage | null, v: Saved): boolean`, `clearBrief(s: Storage | null): void`, `storageOk(s: Storage | null): boolean`
  - `type Vendor = { name: string; price: string; cells: Record<CompareRow, string> }`, `CompareRow` 키 7개, `emptyCompare(): Vendor[]`(3곳), `loadCompare(s)`, `saveCompare(s, v)`
  - `appendSummary(existing: string, summary: string, max = 1000): string`
  - `isInAppBrowser(ua: string): boolean`

- [ ] **Step 1: 실패하는 테스트 추가**

```ts
// web/tests/brief-unit.spec.ts 끝에 추가
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
    const r = appendSummary('가'.repeat(900), '나'.repeat(500));
    expect(r.length).toBeLessThanOrEqual(1000);
    expect(r.startsWith('가'.repeat(900))).toBe(true);
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
```

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/@playwright/test/cli.js test tests/brief-unit.spec.ts --project=w1440 --workers=1 --reporter=line`
Expected: FAIL — 함수 없음.

- [ ] **Step 3: 구현**

```ts
// web/lib/brief/storage.ts (Task 2의 emptyAnswers 아래에 추가)
import type { StepId } from './types';

const KEY = 'prologue.brief.v1';
const KEY_CMP = 'prologue.brief.compare.v1';
export type Saved = { answers: Answers; step: StepId; done: boolean };

/** 브라우저 저장소. 시크릿 창·차단이면 null 또는 접근 때 예외 — 모든 접근을 감싼다 */
export function browserStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

export function storageOk(s: Storage | null): boolean {
  if (!s) return false;
  try { s.setItem('prologue.brief.probe', '1'); s.removeItem('prologue.brief.probe'); return true; } catch { return false; }
}

export function loadSaved(s: Storage | null): Saved | null {
  try {
    const raw = s?.getItem(KEY); if (!raw) return null;
    const v = JSON.parse(raw) as Saved;
    if (!v || v.answers?.v !== 1 || typeof v.step !== 'string') return null;
    return { answers: { ...emptyAnswers(), ...v.answers, own: { ...emptyAnswers().own, ...v.answers.own } }, step: v.step, done: !!v.done };
  } catch { return null; }
}

export function saveSaved(s: Storage | null, v: Saved): boolean {
  try { if (!s) return false; s.setItem(KEY, JSON.stringify(v)); return true; } catch { return false; }
}

export function clearBrief(s: Storage | null): void {
  try { s?.removeItem(KEY); s?.removeItem(KEY_CMP); } catch { /* 저장이 막혀 있으면 지울 것도 없다 */ }
}

export const COMPARE_ROWS = ['꼭 필요한 기능 포함', '도메인 내 이름', '소스·파일 받음', '수정 횟수', '매달 비용', '오픈 가능일'] as const;
export type CompareRow = (typeof COMPARE_ROWS)[number];
export type Vendor = { name: string; price: string; cells: Record<CompareRow, string> };

export function emptyCompare(): Vendor[] {
  const cells = Object.fromEntries(COMPARE_ROWS.map((r) => [r, ''])) as Record<CompareRow, string>;
  return ['A 업체', 'B 업체', 'C 업체'].map((name) => ({ name, price: '', cells: { ...cells } }));
}
export function loadCompare(s: Storage | null): Vendor[] {
  try { const raw = s?.getItem(KEY_CMP); const v = raw ? (JSON.parse(raw) as Vendor[]) : null; return Array.isArray(v) && v.length === 3 ? v : emptyCompare(); }
  catch { return emptyCompare(); }
}
export function saveCompare(s: Storage | null, v: Vendor[]): boolean {
  try { if (!s) return false; s.setItem(KEY_CMP, JSON.stringify(v)); return true; } catch { return false; }
}
```

(`storage.ts` 위쪽 import를 `import type { Answers, StepId } from './types';` 하나로 합친다.)

```ts
// web/lib/brief/prefill.ts
/** 문의 서랍 「지금 상황」에 요청서 요약을 넣는다 — 서버가 1,000자까지만 받는다(lib/inquiry-schema.ts).
 *  사용자가 이미 쓴 글은 지우지 않는다. 남는 자리가 100자 미만이면 덧붙이지 않는다 */
export function appendSummary(existing: string, summary: string, max = 1000): string {
  const base = existing.trim();
  if (!base) return summary.length > max ? `${summary.slice(0, max - 1)}…` : summary;
  const room = max - base.length - 2;
  if (room < 100) return base;
  const add = summary.length > room ? `${summary.slice(0, room - 1)}…` : summary;
  return `${base}\n\n${add}`;
}
```

```ts
// web/lib/brief/in-app.ts
/** 앱 안 브라우저(쓰레드=Barcelona, 인스타그램, 페이스북, 카카오톡, 네이버, 라인). 인쇄가 막혀 있을 수 있다 — Task 1 기기 시험으로 확인 */
export function isInAppBrowser(ua: string): boolean {
  return /Barcelona|Instagram|FBAN|FBAV|KAKAOTALK|NAVER\(inapp|Line\//i.test(ua);
}
```

- [ ] **Step 4: 통과 확인**

Run: Step 2 명령
Expected: 모두 통과.

- [ ] **Step 5: 커밋**

```bash
git add web/lib/brief/storage.ts web/lib/brief/prefill.ts web/lib/brief/in-app.ts web/tests/brief-unit.spec.ts
git commit -F - <<'EOF'
[ADD] 요청서 저장·비교표·서랍 요약 합치기

답과 비교표를 이 기기 저장소에만 둔다. 저장이 막히거나 값이
깨져도 예외 없이 빈 상태로 시작한다. 서랍에 요약을 넣을 때
기존 글은 지우지 않고 1,000자를 넘지 않게 줄인다.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 5: 머리글 `tool` 형태·페이지 뼈대·사이트맵

**Files:**
- Modify: `web/components/header.tsx:5`
- Create: `web/app/tools/brief/page.tsx`, `web/app/tools/brief/page.module.css`
- Create: `web/components/brief/brief-tool.tsx` (빈 뼈대 — Task 6에서 채움)
- Modify: `web/app/sitemap.ts`
- Test: `web/tests/brief-flow.spec.ts`(새로), `web/tests/seo.spec.ts`(추가)

**Interfaces:**
- Consumes: 없음
- Produces: `<Header variant="tool" />`, 페이지 `/tools/brief`, `BriefTool` 컴포넌트(`export function BriefTool(): JSX.Element`)

- [ ] **Step 1: 실패하는 테스트**

```ts
// web/tests/brief-flow.spec.ts
import { test, expect } from '@playwright/test';

test('요청서 페이지: 제목·대표 주소·머리글(브랜드+문의만)·바닥글 없음', async ({ page }) => {
  await page.goto('/tools/brief');
  expect(await page.title()).toBe('홈페이지 요청서 만들기 · Prologue&');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.prologueand.com/tools/brief');
  await expect(page.locator('header [data-brand]')).toBeVisible();
  await expect(page.locator('header [data-open-drawer]')).toBeVisible();
  await expect(page.locator('header a[href="/projects"]')).toHaveCount(0);
  await expect(page.locator('[data-footer]')).toHaveCount(0);
  await expect(page.locator('[data-brief]')).toBeVisible();
});

test('기존 머리글 형태는 그대로', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header a[href="/projects"]')).toHaveCount(1);
  await page.goto('/projects');
  await expect(page.locator('header [data-nav-current]')).toHaveText('Projects');
});
```

```ts
// web/tests/seo.spec.ts 끝에 추가
test('사이트맵에 요청서 만들기가 있다', async ({ request }) => {
  const t = await (await request.get('/sitemap.xml')).text();
  expect(t).toContain('<loc>https://www.prologueand.com/tools/brief</loc>');
});
```

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/@playwright/test/cli.js test tests/brief-flow.spec.ts tests/seo.spec.ts --project=w1440 --workers=1 --reporter=line`
Expected: FAIL — 404, 사이트맵에 없음.

- [ ] **Step 3: 구현**

```tsx
// web/components/header.tsx — Props 줄만 바꾼다
type Props = { variant: 'home' | 'list' | 'case' | 'tool'; title?: string; project?: string };
```
(본문은 그대로 — `tool`이면 nav에 「문의」 단추만 남는다: `header.tsx:20`의 삼항이 `null`을 낸다.)

```tsx
// web/app/tools/brief/page.tsx
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { BriefTool } from '@/components/brief/brief-tool';
import s from './page.module.css';

const DESC = '질문에 답하면 어느 업체에나 보낼 수 있는 홈페이지 제작 요청서가 만들어져요. 가입·연락처 없이, 입력한 내용은 이 기기에만 저장돼요.';

export const metadata: Metadata = {
  title: '홈페이지 요청서 만들기',
  description: DESC,
  alternates: { canonical: '/tools/brief' },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: 'Prologue&', url: '/tools/brief', title: '홈페이지 요청서 만들기 · Prologue&', description: DESC },
};

export default function BriefPage() {
  return (
    <>
      <Header variant="tool" />
      <main className={s.main} data-brief-page><BriefTool /></main>
    </>
  );
}
```

```css
/* web/app/tools/brief/page.module.css — 머리글이 고정이라 그 높이만큼 내린다 */
.main{max-width:640px;margin:0 auto;padding:calc(var(--hdr) + 40px) 0 160px}
@media (max-width:700px){ .main{padding:calc(var(--hdr) + 24px) 16px 150px} }
@media print{
  :global(header),:global([role="dialog"]),:global([data-zoom-viewer]){display:none!important}
  .main{padding:0;max-width:none}
}
```

```tsx
// web/components/brief/brief-tool.tsx — Task 6에서 채운다
'use client';
export function BriefTool() {
  return <div data-brief />;
}
```

```ts
// web/app/sitemap.ts — 반환 배열의 projects 다음 줄에 추가
    { url: `${SITE}/tools/brief`, changeFrequency: 'monthly', priority: 0.6 },
```

(인쇄 선택자 `[data-zoom-viewer]`가 실제 `components/zoom-viewer.tsx` 루트에 없으면, 그 파일의 최상위 요소 속성을 grep해 맞는 선택자로 바꾼다 — 바꿨으면 Ruling으로 기록.)

- [ ] **Step 4: 빌드·통과 확인**

Run: `bash <scratchpad>/fontmock/rb.sh` 후 Step 2 명령, 이어서 `tests/list.spec.ts tests/home.spec.ts tests/transition.spec.ts`(머리글 쓰는 기존 테스트)
Expected: 모두 통과.

- [ ] **Step 5: 커밋**

```bash
git add web/components/header.tsx web/app/tools/brief web/components/brief/brief-tool.tsx web/app/sitemap.ts web/tests/brief-flow.spec.ts web/tests/seo.spec.ts
git commit -F - <<'EOF'
[ADD] 요청서 만들기 페이지 뼈대와 사이트맵

/tools/brief 페이지와 머리글 tool 형태(브랜드·문의만)를 더한다.
바닥글은 쓰지 않는다. 대표 주소·검색 설명을 두고 사이트맵에 넣는다.
기존 머리글 세 형태는 그대로.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 6: 질문 화면(단계 이동·입력 부품·저장·스크롤·필수)

**Files:**
- Modify: `web/components/brief/brief-tool.tsx`
- Create: `web/components/brief/step-shell.tsx`, `step-shell.module.css`
- Create: `web/components/brief/fields.tsx`, `fields.module.css`
- Create: `web/components/brief/steps.tsx` (15단계 화면을 한 파일에 `StepView` 하나로 — 단계별 함수 15개)
- Test: `web/tests/brief-flow.spec.ts` (추가)

**Interfaces:**
- Consumes: `Answers`, `StepId`, `Q`, `visibleSteps`, `isAnswered`, `REQUIRED`, `emptyAnswers`, `browserStorage`, `loadSaved`, `saveSaved`, `storageOk`, `getLenis`(`components/lenis-provider.tsx`)
- Produces:
  - `StepView({ id, a, set }: { id: StepId; a: Answers; set: (p: Partial<Answers>) => void })`
  - `StepShell({ index, total, title, help, error, onPrev, onNext, nextLabel, children })`
  - fields: `Single`, `Multi`, `Seg`, `TextIn`, `Impact`
  - `BriefTool`가 결과 화면에 넘길 값: `answers`, `goTo(id)`, `reset()` (Task 7에서 씀)

- [ ] **Step 1: 실패하는 흐름 테스트 추가**

```ts
// web/tests/brief-flow.spec.ts 끝에 추가
import type { Page } from '@playwright/test';

async function next(page: Page) { await page.locator('[data-brief-next]').click(); }
async function pick(page: Page, name: string) { await page.getByRole('radio', { name, exact: true }).check({ force: true }); }

test.describe('질문 흐름', () => {
  test('필수(어떤 곳·주 목적)를 비우면 넘어가지 않고 한 줄 오류', async ({ page }) => {
    await page.goto('/tools/brief');
    await pick(page, '새로 만들기'); await next(page);
    await expect(page.locator('h1')).toHaveText('어떤 곳의 홈페이지인가요?');
    await next(page);
    await expect(page.locator('[data-brief-error]')).toHaveText('하나만 골라 주세요');
    await expect(page.locator('h1')).toHaveText('어떤 곳의 홈페이지인가요?');
  });

  test('고치기면 지금 홈페이지 단계가 나오고, 새로 만들기면 안 나온다', async ({ page }) => {
    await page.goto('/tools/brief');
    await pick(page, '지금 홈페이지 고치기'); await next(page);
    await expect(page.locator('h1')).toHaveText('지금 홈페이지에 대해 알려 주세요');
    await expect(page.locator('[data-brief-progress]')).toContainText('2 / 15');
    await page.locator('[data-brief-prev]').click();
    await pick(page, '새로 만들기'); await next(page);
    await expect(page.locator('[data-brief-progress]')).toContainText('2 / 14');
  });

  test('예약을 고르면 이어 질문, 「견적에 크게 영향」을 누르면 이유가 펼쳐진다', async ({ page }) => {
    await page.goto('/tools/brief');
    await pick(page, '새로 만들기'); await next(page);
    await pick(page, '가게(식당·카페 등)'); await next(page);
    await pick(page, '예약하기'); await next(page);
    await next(page); await next(page);                       // 누가 보나요, 페이지
    await expect(page.locator('h1')).toHaveText('홈페이지에 어떤 기능이 필요하세요?');
    await page.locator('[data-feature="예약 받기"] [data-seg="must"]').click();
    await expect(page.getByText('예약은 어떻게 받으실 건가요?')).toBeVisible();
    await page.locator('[data-feature="예약 받기"] [data-impact]').click();
    await expect(page.locator('[data-feature="예약 받기"] [data-impact-why]')).toBeVisible();
  });

  test('새로고침해도 단계와 답이 그대로, 이전으로 가도 답 유지', async ({ page }) => {
    await page.goto('/tools/brief');
    await pick(page, '새로 만들기'); await next(page);
    await pick(page, '회사·사무실'); await page.locator('[data-brief-name]').fill('테스트 상사'); await next(page);
    await page.reload();
    await expect(page.locator('h1')).toHaveText('손님이 홈페이지에서 딱 한 가지를 한다면 무엇이었으면 하세요?');
    await page.locator('[data-brief-prev]').click();
    await expect(page.getByRole('radio', { name: '회사·사무실', exact: true })).toBeChecked();
    await expect(page.locator('[data-brief-name]')).toHaveValue('테스트 상사');
  });

  test('긴 질문 아래까지 내린 뒤 다음을 누르면 새 질문 제목이 화면 위에 보인다', async ({ page }) => {
    await page.goto('/tools/brief');
    await pick(page, '새로 만들기'); await next(page);
    await pick(page, '가게(식당·카페 등)'); await next(page);
    await pick(page, '예약하기'); await next(page); await next(page); await next(page);
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
    await expect(page.locator('[data-brief-nostore]')).toContainText('새로고침하면 답이 사라져요');
    await pick(page, '새로 만들기'); await next(page);
    await expect(page.locator('h1')).toHaveText('어떤 곳의 홈페이지인가요?');
    await ctx.close();
  });

  test('폰: 가로 스크롤 없음, 하단 단추가 마지막 선택지를 가리지 않는다', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone');
    await page.goto('/tools/brief');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await pick(page, '새로 만들기'); await next(page);
    const last = page.getByRole('radio', { name: '직접 입력', exact: true }).locator('xpath=..');
    await last.scrollIntoViewIfNeeded();
    const lb = (await last.boundingBox())!, bar = (await page.locator('[data-brief-bar]').boundingBox())!;
    expect(lb.y + lb.height).toBeLessThanOrEqual(bar.y + 1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bash <scratchpad>/fontmock/rb.sh` 후 `node node_modules/@playwright/test/cli.js test tests/brief-flow.spec.ts --project=w1440 --project=phone --workers=1 --reporter=line`
Expected: FAIL — 질문 화면 없음.

- [ ] **Step 3: 입력 부품 구현**

```tsx
// web/components/brief/fields.tsx
'use client';
import { useId, useState } from 'react';
import { Q } from '@/content/brief/questions';
import s from './fields.module.css';

type Opt = readonly string[];

export function Single({ label, opts, value, onChange, name }: { label?: string; opts: Opt; value?: string; onChange: (v: string) => void; name?: string }) {
  const id = useId();
  return (
    <fieldset className={s.set}>
      {label ? <legend className={s.legend}>{label}</legend> : null}
      <div className={s.cards}>
        {opts.map((o) => (
          <label key={o} className={value === o ? `${s.card} ${s.on}` : s.card}>
            <input type="radio" name={name ?? id} value={o} checked={value === o} onChange={() => onChange(o)} className={s.native} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Multi({ label, opts, values, onChange, exclusive }: { label?: string; opts: Opt; values: string[]; onChange: (v: string[]) => void; exclusive?: string }) {
  const toggle = (o: string) => {
    if (o === exclusive) return onChange(values.includes(o) ? [] : [o]);
    const rest = values.filter((v) => v !== exclusive);
    onChange(rest.includes(o) ? rest.filter((v) => v !== o) : [...rest, o]);
  };
  return (
    <fieldset className={s.set}>
      {label ? <legend className={s.legend}>{label}</legend> : null}
      <div className={s.chips}>
        {opts.map((o) => (
          <label key={o} className={values.includes(o) ? `${s.chip} ${s.on}` : s.chip}>
            <input type="checkbox" checked={values.includes(o)} onChange={() => toggle(o)} className={s.native} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TextIn({ label, value, onChange, help, multiline, data, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; help?: string; multiline?: boolean; data?: string; type?: string }) {
  const props = { value, onChange: (e: { target: { value: string } }) => onChange(e.target.value), className: s.input, ...(data ? { [data]: '' } : {}) };
  return (
    <label className={s.text}>
      <span className={s.legend}>{label}</span>
      {multiline ? <textarea rows={3} maxLength={1000} {...props} /> : <input type={type} maxLength={300} {...props} />}
      {help ? <span className={s.help}>{help}</span> : null}
    </label>
  );
}

/** 「견적에 크게 영향」 — 누르면 이유가 펼쳐진다(마우스 올림 말풍선은 폰에서 안 되니 쓰지 않는다) */
export function Impact({ why }: { why: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.impact}>
      <button type="button" className={s.badge} aria-expanded={open} onClick={() => setOpen((o) => !o)} data-impact>{Q.impactBadge}</button>
      {open ? <p className={s.why} data-impact-why>{why}</p> : null}
    </div>
  );
}

export function Seg({ value, onChange }: { value?: 'must' | 'later'; onChange: (v?: 'must' | 'later') => void }) {
  return (
    <div className={s.seg} role="group">
      {(['must', 'later'] as const).map((k) => (
        <button key={k} type="button" aria-pressed={value === k} className={value === k ? s.segOn : ''} data-seg={k}
          onClick={() => onChange(value === k ? undefined : k)}>{k === 'must' ? Q.features.must : Q.features.later}</button>
      ))}
    </div>
  );
}
```

```css
/* web/components/brief/fields.module.css — 사이트 토큰만 */
.set{border:0;margin:0 0 20px;padding:0}
.legend{display:block;font-size:14px;font-weight:600;color:var(--bone-700);margin:0 0 8px}
.cards{display:flex;flex-direction:column;gap:10px}
.card{position:relative;display:flex;align-items:center;min-height:52px;padding:12px 18px;background:var(--bone-0);border:1px solid var(--bone-200);border-radius:4px;cursor:pointer;font-size:16px}
.card:has(.native:focus-visible),.chip:has(.native:focus-visible){outline:2px solid var(--signal);outline-offset:2px}
.on{border-color:var(--navy-900);box-shadow:0 0 0 1px var(--navy-900)}
.native{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{position:relative;display:inline-flex;align-items:center;min-height:44px;padding:8px 16px;border:1px solid var(--bone-300);border-radius:999px;background:var(--bone-0);font-size:15px;cursor:pointer}
.chip.on{background:var(--navy-900);border-color:var(--navy-900);color:var(--bone-0);box-shadow:none}
.text{display:block;margin:0 0 20px}
.input{width:100%;min-height:48px;padding:12px 14px;border:1px solid var(--bone-300);border-radius:3px;background:var(--bone-0);font:inherit;font-size:16px;color:inherit}
textarea.input{min-height:96px;resize:vertical}
.help{display:block;margin-top:6px;font-size:13px;color:var(--bone-600)}
.impact{margin-top:8px}
.badge{border:0;background:#FBF3E6;color:var(--warning);font:inherit;font-size:12px;font-weight:600;padding:4px 10px;border-radius:2px;cursor:pointer;min-height:28px}
.why{margin:8px 0 0;font-size:14px;color:var(--bone-700);background:var(--bone-100);padding:10px 12px;border-radius:3px}
.seg{display:flex;border:1px solid var(--bone-300);border-radius:3px;overflow:hidden;flex-shrink:0}
.seg button{border:0;background:var(--bone-0);font:inherit;font-size:13px;padding:0 12px;min-height:36px;color:var(--bone-600);cursor:pointer}
.seg button+button{border-left:1px solid var(--bone-300)}
.segOn{background:var(--navy-900)!important;color:var(--bone-0)!important}
```

- [ ] **Step 4: 단계 틀 구현**

```tsx
// web/components/brief/step-shell.tsx
'use client';
import { useEffect, useRef } from 'react';
import { Q } from '@/content/brief/questions';
import s from './step-shell.module.css';

type P = { index: number; total: number; title: string; help?: string; error?: string; onPrev?: () => void; onNext: () => void; nextLabel: string; dunno?: { label: string; onClick: () => void }; children: React.ReactNode };

export function StepShell({ index, total, title, help, error, onPrev, onNext, nextLabel, dunno, children }: P) {
  const h = useRef<HTMLHeadingElement>(null);
  // 단계가 바뀌면 제목으로 포커스 — 화면 낭독기가 새 질문을 읽는다
  useEffect(() => { h.current?.focus({ preventScroll: true }); }, [title]);
  return (
    <section className={s.step} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); onNext(); } }}>
      <div className={s.top} data-brief-progress aria-live="polite">
        <span>{index + 1} / {total}</span>
        <div className={s.bar} aria-hidden="true"><b style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
      </div>
      <h1 ref={h} tabIndex={-1} className={s.q}>{title}</h1>
      {help ? <p className={s.help}>{help}</p> : null}
      {children}
      {dunno ? <button type="button" className={s.dunno} onClick={dunno.onClick}>{dunno.label}</button> : null}
      {error ? <p className={s.error} role="alert" data-brief-error>{error}</p> : null}
      <div className={s.navbar} data-brief-bar>
        <div className={s.navin}>
          {onPrev ? <button type="button" className={s.btn} onClick={onPrev} data-brief-prev>이전</button> : <span />}
          <button type="button" className={`${s.btn} ${s.pri}`} onClick={onNext} data-brief-next>{nextLabel}</button>
        </div>
      </div>
    </section>
  );
}
export { Q };
```

```css
/* web/components/brief/step-shell.module.css */
.step{padding-bottom:24px}
.top{display:flex;align-items:center;gap:14px;font-size:13px;color:var(--bone-600);font-weight:500}
.bar{flex:1;height:3px;background:var(--bone-200);border-radius:2px;overflow:hidden}
.bar b{display:block;height:100%;background:var(--navy-900)}
.q{margin:32px 0 0;font-size:28px;font-weight:700;letter-spacing:-.025em;line-height:1.4;outline:none}
.help{margin:10px 0 28px;color:var(--bone-600);font-size:15px}
.dunno{display:inline-block;margin-top:4px;background:none;border:0;padding:8px 0;font:inherit;font-size:14px;color:var(--bone-600);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.error{margin:12px 0 0;font-size:14px;font-weight:600;color:var(--error)}
.navbar{position:fixed;left:0;right:0;bottom:0;z-index:30;background:rgba(250,249,246,.96);border-top:1px solid var(--bone-200);padding:14px 0 calc(14px + env(safe-area-inset-bottom))}
.navin{max-width:640px;margin:0 auto;display:flex;justify-content:space-between;gap:12px;padding:0 max(0px, env(safe-area-inset-left))}
.btn{height:48px;padding:0 24px;border-radius:3px;font:inherit;font-size:15px;font-weight:600;border:1px solid var(--bone-300);background:var(--bone-0);color:var(--bone-900);cursor:pointer}
.pri{background:var(--navy-900);border-color:var(--navy-900);color:var(--bone-0);min-width:140px}
@media (max-width:700px){ .q{font-size:23px} .navin{padding:0 16px} }
@media print{ .navbar{display:none} }
```

- [ ] **Step 5: 단계별 화면 구현**

```tsx
// web/components/brief/steps.tsx
'use client';
import { Q } from '@/content/brief/questions';
import { UNKNOWN, type Answers, type Feature, type Goal, type StepId } from '@/lib/brief/types';
import { Impact, Multi, Seg, Single, TextIn } from './fields';
import s from './fields.module.css';

type P = { a: Answers; set: (p: Partial<Answers>) => void };

export const STEP_TITLE: Record<StepId, string> = {
  mode: Q.mode.title, renew: Q.renew.title, kind: Q.kind.title, goal: Q.goal.title, audience: Q.audience.title, pages: Q.pages.title,
  features: Q.features.title, links: Q.links.title, content: Q.content.title, brand: Q.brand.title, design: Q.design.title,
  ops: Q.ops.title, own: Q.own.title, scope: Q.scope.title, when: Q.when.title,
};
export const STEP_HELP: Partial<Record<StepId, string>> = {
  kind: Q.kind.help, goal: Q.goal.help, audience: Q.audience.help, pages: Q.pages.help, features: Q.features.help, ops: Q.ops.help, own: Q.own.help,
};

export function StepView({ id, a, set }: P & { id: StepId }) {
  switch (id) {
    case 'mode': return <Single opts={Q.mode.opts} value={a.mode === 'new' ? Q.mode.opts[0] : a.mode === 'renew' ? Q.mode.opts[1] : undefined} onChange={(v) => set({ mode: v === Q.mode.opts[0] ? 'new' : 'renew' })} />;
    case 'renew': return (<>
      <TextIn label={Q.renew.url} value={a.renewUrl} onChange={(v) => set({ renewUrl: v })} type="url" />
      <TextIn label={Q.renew.pain} value={a.renewPain} onChange={(v) => set({ renewPain: v })} multiline />
      <Single label={Q.renew.amount.label} opts={Q.renew.amount.opts} value={a.renewAmount} onChange={(v) => set({ renewAmount: v })} />
      {a.renewAmount?.startsWith('많아요') ? <Impact why={Q.renew.amountWhy} /> : null}
    </>);
    case 'kind': return (<>
      <Single opts={Q.kind.opts} value={a.kind} onChange={(v) => set({ kind: v })} />
      {a.kind === '직접 입력' ? <TextIn label="어떤 곳인지 적어 주세요" value={a.kindOther} onChange={(v) => set({ kindOther: v })} /> : null}
      <TextIn label={Q.kind.name} help={Q.kind.nameHelp} value={a.name} onChange={(v) => set({ name: v })} data="data-brief-name" />
    </>);
    case 'goal': return (<>
      <Single opts={Q.goal.opts} value={a.goalMain} onChange={(v) => set({ goalMain: v as Goal, goalMore: a.goalMore.filter((g) => g !== v),
        ...(v === '상품 사기' && !a.features['상품 결제'] ? { features: { ...a.features, '상품 결제': 'must' } } : {}) })} />
      <Multi label={Q.goal.more} opts={Q.goal.opts.filter((g) => g !== a.goalMain)} values={a.goalMore} onChange={(v) => set({ goalMore: v as Goal[] })} />
    </>);
    case 'audience': return <Multi opts={[...Q.audience.opts, UNKNOWN]} exclusive={UNKNOWN} values={a.audience} onChange={(v) => set({ audience: v })} />;
    case 'pages': return (<>
      <Multi opts={Q.pages.opts} values={a.pages} onChange={(v) => set({ pages: v })} />
      <TextIn label={Q.pages.extra} value={a.pagesExtra} onChange={(v) => set({ pagesExtra: v })} />
      {a.pages.length + a.pagesExtra.split(',').filter((x) => x.trim()).length > 10 ? <Impact why={Q.pages.manyWhy} /> : null}
    </>);
    case 'features': return (
      <div className={s.cards}>
        {Q.features.opts.map((f: Feature) => (
          <div key={f} className={a.features[f] ? `${s.card} ${s.on}` : s.card} data-feature={f} style={{ display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontWeight: 600 }}>{f}</span>
              <Seg value={a.features[f]} onChange={(v) => { const n = { ...a.features }; if (v) n[f] = v; else delete n[f]; set({ features: n, featuresUnknown: false }); }} />
            </div>
            {Q.features.why[f] ? <Impact why={Q.features.why[f]!} /> : null}
            {a.features[f] && f === '예약 받기' ? <div style={{ marginTop: 12 }}><Single label={Q.features.booking.label} opts={Q.features.booking.opts} value={a.booking} onChange={(v) => set({ booking: v })} /></div> : null}
            {a.features[f] && f === '상품 결제' ? <div style={{ marginTop: 12 }}>
              <Single label={Q.features.shopCount.label} opts={Q.features.shopCount.opts} value={a.shopCount} onChange={(v) => set({ shopCount: v })} />
              <Single label={Q.features.shopHow.label} opts={Q.features.shopHow.opts} value={a.shopHow} onChange={(v) => set({ shopHow: v })} /></div> : null}
            {a.features[f] && f === '회원' ? <div style={{ marginTop: 12 }}><Single label={Q.features.member.label} opts={Q.features.member.opts} value={a.member} onChange={(v) => set({ member: v })} /></div> : null}
            {a.features[f] && f === '외국어 페이지' ? <div style={{ marginTop: 12 }}>
              <Multi label={Q.features.langs.label} opts={Q.features.langs.opts} values={a.langs} onChange={(v) => set({ langs: v })} />
              <TextIn label={Q.features.langs.other} value={a.langOther} onChange={(v) => set({ langOther: v })} /></div> : null}
          </div>
        ))}
      </div>
    );
    case 'links': return (<>
      <Multi opts={Q.links.opts} exclusive="없어요" values={a.links} onChange={(v) => set({ links: v })} />
      {a.links.filter((l) => l !== '없어요').length > 3 ? <Impact why={Q.links.manyWhy} /> : null}
    </>);
    case 'content': return (<>
      <Single label={Q.content.copy.label} opts={Q.content.copy.opts} value={a.copy} onChange={(v) => set({ copy: v })} />
      <Single label={Q.content.photo.label} opts={Q.content.photo.opts} value={a.photo} onChange={(v) => set({ photo: v })} />
      {a.copy === '써 주길 원함' || a.photo === '찍어 주길 원함' ? <Impact why={Q.content.why} /> : null}
      {a.copy === '직접 준비' || a.photo === '있어요' ? <TextIn label={Q.content.by} value={a.contentBy} onChange={(v) => set({ contentBy: v })} type="date" /> : null}
    </>);
    case 'brand': return (<>
      <Multi opts={Q.brand.opts} exclusive="없어요" values={a.brand} onChange={(v) => set({ brand: v })} />
      {a.brand.includes('없어요') ? <Impact why={Q.brand.noneWhy} /> : null}
    </>);
    case 'design': return (<>
      <Single opts={Q.design.opts} value={a.design} onChange={(v) => set({ design: v })} />
      {a.design === '우리만의 디자인' ? <Impact why={Q.design.customWhy} /> : null}
      <p className={s.legend} style={{ marginTop: 24 }}>{Q.design.refsLabel}</p>
      {[0, 1, 2].map((i) => {
        const r = a.refs[i] ?? { url: '', likes: [], memo: '' };
        const put = (p: Partial<typeof r>) => { const refs = [...a.refs]; while (refs.length <= i) refs.push({ url: '', likes: [], memo: '' }); refs[i] = { ...r, ...p }; set({ refs }); };
        if (i > 0 && !a.refs[i - 1]?.url.trim()) return null;
        return (
          <div key={i} className={s.card} style={{ display: 'block', marginBottom: 10 }} data-ref={i}>
            <TextIn label={`참고 ${i + 1} 주소`} value={r.url} onChange={(v) => put({ url: v })} type="url" />
            {r.url.trim() ? <>
              <Multi label="이 사이트의 좋은 점" opts={Q.design.likes} values={r.likes} onChange={(v) => put({ likes: v })} />
              <TextIn label={Q.design.memo} value={r.memo} onChange={(v) => put({ memo: v })} />
            </> : null}
          </div>
        );
      })}
      <TextIn label={Q.design.dislikes} value={a.dislikes} onChange={(v) => set({ dislikes: v })} multiline />
    </>);
    case 'ops': return <Multi opts={Q.ops.opts} exclusive="없어요(다 맡길게요)" values={a.ops} onChange={(v) => set({ ops: v })} />;
    case 'own': return (<>
      {Q.own.rows.map((r) => (
        <div key={r.key} className={s.card} style={{ display: 'block', marginBottom: 12 }} data-own={r.key}>
          <p style={{ margin: 0, fontWeight: 600 }}>{r.label}</p>
          <p className={s.help} style={{ margin: '4px 0 10px' }}>{r.why}</p>
          <Multi opts={r.opts} values={[a.own[r.key]]} onChange={(v) => set({ own: { ...a.own, [r.key]: v.at(-1) ?? a.own[r.key] } })} />
        </div>
      ))}
    </>);
    case 'scope': return (<>
      <Single label={Q.scope.revisions.label} opts={Q.scope.revisions.opts} value={a.revisions} onChange={(v) => set({ revisions: v })} />
      <Single label={Q.scope.care.label} opts={Q.scope.care.opts} value={a.care} onChange={(v) => set({ care: v })} />
      <label className={s.chip} style={{ marginTop: 8 }}>
        <input type="checkbox" className={s.native} checked={a.monthlyCost} onChange={(e) => set({ monthlyCost: e.target.checked })} />
        <span>{a.monthlyCost ? '✓ ' : ''}{Q.scope.monthly}</span>
      </label>
    </>);
    case 'when': return (<>
      <TextIn label={Q.when.date} value={a.openDate} onChange={(v) => set({ openDate: v, openUnknown: false })} type="date" />
      <Multi opts={[Q.when.dateUnknown]} values={a.openUnknown ? [Q.when.dateUnknown] : []} onChange={(v) => set({ openUnknown: v.length > 0, openDate: v.length ? '' : a.openDate })} />
      {a.openDate ? <Single label={Q.when.fixed.label} opts={Q.when.fixed.opts} value={a.openFixed} onChange={(v) => set({ openFixed: v })} /> : null}
      <Single label={Q.when.budget.label} opts={Q.when.budget.opts} value={a.budget} onChange={(v) => set({ budget: v })} />
      <label className={s.chip}>
        <input type="checkbox" className={s.native} checked={a.budgetInBrief} onChange={(e) => set({ budgetInBrief: e.target.checked })} data-brief-budget-in />
        <span>{a.budgetInBrief ? '✓ ' : ''}{Q.when.budgetIn}</span>
      </label>
      <p className={s.help}>{Q.when.budgetHelp}</p>
      <Single label={Q.when.decider.label} opts={Q.when.decider.opts} value={a.decider} onChange={(v) => set({ decider: v })} />
    </>);
  }
}
```

(이 파일의 인라인 `style`은 시안 재현용 최소한이다. 실행 중 3곳 이상 반복되면 `fields.module.css`에 클래스로 옮기고 Ruling 기록.)

- [ ] **Step 6: 루트 구현(상태·저장·이동·스크롤·필수)**

```tsx
// web/components/brief/brief-tool.tsx
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLenis } from '@/components/lenis-provider';
import { Q } from '@/content/brief/questions';
import { REQUIRED, isAnswered, visibleSteps } from '@/lib/brief/steps';
import { browserStorage, clearBrief, emptyAnswers, loadSaved, saveSaved, storageOk } from '@/lib/brief/storage';
import type { Answers, StepId } from '@/lib/brief/types';
import { StepShell } from './step-shell';
import { STEP_HELP, STEP_TITLE, StepView } from './steps';
import { Result } from './result';

const top = () => { const l = getLenis(); if (l) l.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); };

export function BriefTool() {
  const [a, setA] = useState<Answers>(emptyAnswers);
  const [step, setStep] = useState<StepId>('mode');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [noStore, setNoStore] = useState(false);
  const [back, setBack] = useState(false);          // 결과에서 「고치기」로 들어왔는지

  useEffect(() => {
    const s = browserStorage();
    setNoStore(!storageOk(s));
    const v = loadSaved(s);
    if (v) { setA(v.answers); setStep(v.step); setDone(v.done); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) saveSaved(browserStorage(), { answers: a, step, done }); }, [a, step, done, ready]);

  const steps = useMemo(() => visibleSteps(a), [a]);
  const idx = Math.max(0, steps.indexOf(step));
  const set = useCallback((p: Partial<Answers>) => { setA((o) => ({ ...o, ...p })); setError(''); }, []);

  const go = (s: StepId) => { setStep(s); setError(''); top(); };
  const next = () => {
    if (REQUIRED.includes(step) && !isAnswered(a, step)) { setError(Q.required); return; }
    if (back || idx === steps.length - 1) { setDone(true); setBack(false); top(); return; }
    go(steps[idx + 1]);
  };
  const prev = idx > 0 ? () => go(steps[idx - 1]) : undefined;
  // 단원의 「고치기」는 그 질문만 고치고 결과로. 「답 고치기」(mode)는 처음부터 다시 걷는다 — 고치기↔새로 만들기를 바꾸면 단계가 달라지므로
  const edit = (s: StepId) => { setDone(false); setBack(s !== 'mode'); go(s); };
  const reset = () => { clearBrief(browserStorage()); setA(emptyAnswers()); setStep('mode'); setDone(false); setBack(false); top(); };

  const dunno = step === 'features'
    ? { label: Q.features.unknown, onClick: () => { set({ features: {}, featuresUnknown: true }); next(); } }
    : step === 'design' || step === 'pages' || step === 'brand' || step === 'links' || step === 'ops'
      ? { label: Q.dunno, onClick: () => next() } : undefined;

  if (!ready) return <div data-brief aria-busy="true" />;
  return (
    <div data-brief>
      {noStore ? <p data-brief-nostore style={{ fontSize: 13, color: 'var(--warning)', margin: '0 0 16px' }}>이 브라우저에서는 저장이 안 돼서 새로고침하면 답이 사라져요.</p> : null}
      {done
        ? <Result a={a} onEdit={edit} onReset={reset} />
        : <StepShell index={idx} total={steps.length} title={STEP_TITLE[step]} help={STEP_HELP[step]} error={error}
            onPrev={prev} onNext={next} nextLabel={back ? '결과로 돌아가기' : idx === steps.length - 1 ? '요청서 만들기' : '다음'} dunno={dunno}>
            <StepView id={step} a={a} set={set} />
          </StepShell>}
    </div>
  );
}
```

(`Result`는 Task 7. 이 Task에서는 `web/components/brief/result.tsx`에 `export function Result(_: { a: Answers; onEdit: (s: StepId) => void; onReset: () => void }) { return <div data-brief-result />; }` 임시 구현을 둔다.)

- [ ] **Step 7: 빌드·통과 확인**

Run: `bash <scratchpad>/fontmock/rb.sh` 후 Step 2 명령, 그리고 `node node_modules/typescript/bin/tsc --noEmit`
Expected: 흐름 테스트 전부 통과(폰 전용 테스트는 w1440에서 skip), 타입 오류 없음.

- [ ] **Step 8: 커밋**

```bash
git add web/components/brief web/tests/brief-flow.spec.ts
git commit -F - <<'EOF'
[ADD] 요청서 질문 화면

한 화면에 질문 하나씩, 답에 따라 갈라지는 15단계. 필수(어떤 곳·
주 목적)만 막고 나머지는 넘어간다. 답과 단계를 이 기기에만 저장해
새로고침해도 이어진다. 저장이 막히면 안내 한 줄. 단계가 바뀌면
맨 위로, 폰에서는 이전·다음이 아래에 붙는다.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 7: 결과 화면(요청서·견적 영향·업체 질문·비교표·내보내기)

**Files:**
- Modify: `web/components/brief/result.tsx`
- Create: `web/components/brief/result.module.css`
- Test: `web/tests/brief-result.spec.ts`

**Interfaces:**
- Consumes: `buildBrief`, `impactItems`, `vendorQuestions`, `toPlainText`, `briefSummary`, `browserStorage`, `loadCompare`, `saveCompare`, `COMPARE_ROWS`, `isInAppBrowser`
- Produces: `Result({ a, onEdit, onReset })`. 「Prologue&에도 보내기」 링크는 `data-brief-prologue` — Task 8에서 이벤트를 연결.
- `PRINT_IN_APP: 'ok' | 'blocked'` 상수(이 파일 맨 위) — Task 1 기기 시험 결과 전까지 `'blocked'`(안전한 쪽).

- [ ] **Step 1: 실패하는 테스트**

```ts
// web/tests/brief-result.spec.ts
import { test, expect, type Page } from '@playwright/test';

/** 질문을 다 거쳐 결과까지 — 예약(네이버)·사진 촬영을 고른 카페 */
async function finish(page: Page) {
  const pick = (n: string) => page.getByRole('radio', { name: n, exact: true }).check({ force: true });
  const next = () => page.locator('[data-brief-next]').click();
  await page.goto('/tools/brief');
  await pick('새로 만들기'); await next();
  await pick('가게(식당·카페 등)'); await page.locator('[data-brief-name]').fill('가람 로스터리'); await next();
  await pick('찾아오기'); await next();
  await next(); await next();
  await page.locator('[data-feature="예약 받기"] [data-seg="must"]').click(); await pick('네이버 예약 연결'); await next();
  await next();
  await pick('찍어 주길 원함'); await next();
  for (let i = 0; i < 6; i++) await next();
  await expect(page.locator('[data-brief-result]')).toBeVisible();
}

test.describe('결과', () => {
  test('요청서·영향·질문·비교표·안내가 순서대로', async ({ page }) => {
    await finish(page);
    await expect(page.locator('[data-brief-doc] h1')).toHaveText('홈페이지 제작 요청서 · 가람 로스터리');
    await expect(page.locator('[data-brief-impact] li')).toHaveCount(2);
    await expect(page.locator('[data-brief-vendor] li').first()).toHaveText('도메인과 호스팅은 제 이름으로 사 주시나요?');
    await expect(page.locator('[data-brief-compare] tbody tr')).toHaveCount(7);
    await expect(page.locator('[data-brief-privacy]')).toContainText('이 기기에만 저장돼요');
    const order = await page.locator('[data-brief-result] > [data-part]').evaluateAll((els) => els.map((e) => e.getAttribute('data-part')));
    expect(order).toEqual(['doc', 'impact', 'vendor', 'compare', 'export', 'privacy', 'prologue']);
  });

  test('처음부터 결과까지 서버로 나가는 요청이 없다', async ({ page }) => {
    const sent: string[] = [];
    page.on('request', (r) => { if (r.resourceType() === 'fetch' || r.resourceType() === 'xhr' || r.method() === 'POST' || r.url().includes('/api/')) sent.push(r.url()); });
    await finish(page);
    await page.locator('[data-brief-compare] input').first().fill('180만 원');
    expect(sent.filter((u) => !u.includes('_next/') && !u.includes('?_rsc'))).toEqual([]);
  });

  test('글자로 복사: 단원 포함, Prologue& 없음', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'w1440');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await finish(page);
    await page.locator('[data-brief-copy]').click();
    await expect(page.locator('[data-brief-copied]')).toHaveText('복사했어요');
    const t = await page.evaluate(() => navigator.clipboard.readText());
    expect(t).toContain('■ 기능');
    expect(t).not.toContain('Prologue');
  });

  test('복사가 막히면 글상자로 펼쳐 길게 눌러 복사 안내', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { get: () => undefined }); });
    await finish(page);
    await page.locator('[data-brief-copy]').click();
    await expect(page.locator('[data-brief-copybox]')).toBeVisible();
    await expect(page.locator('[data-brief-copybox-help]')).toHaveText('길게 눌러 복사해 주세요');
  });

  test('인쇄: 단추·비교표·영향·Prologue&·머리글이 안 보이고 요청서·질문은 보인다', async ({ page }) => {
    await finish(page);
    await page.emulateMedia({ media: 'print' });
    for (const sel of ['[data-brief-export]', '[data-brief-compare]', '[data-brief-impact]', '[data-brief-prologue]', 'header', '[data-brief-privacy]'])
      await expect(page.locator(sel).first()).toBeHidden();
    await expect(page.locator('[data-brief-doc]')).toBeVisible();
    await expect(page.locator('[data-brief-vendor]')).toBeVisible();
    await expect(page.locator('[data-brief-vendor] [data-print-only]')).toBeVisible();
    const top = await page.locator('[data-brief-doc] h1').evaluate((h) => h.getBoundingClientRect().top);
    expect(top).toBeLessThan(80);
  });

  test('답 고치기 → 그 질문 → 결과로 돌아가기', async ({ page }) => {
    await finish(page);
    await page.locator('[data-edit="features"]').click();
    await expect(page.locator('h1')).toHaveText('홈페이지에 어떤 기능이 필요하세요?');
    await page.locator('[data-brief-next]').click();
    await expect(page.locator('[data-brief-result]')).toBeVisible();
  });

  test('모두 지우기: 확인 후 첫 질문, 저장 비움', async ({ page }) => {
    await finish(page);
    page.once('dialog', (d) => d.accept());
    await page.locator('[data-brief-reset]').click();
    await expect(page.locator('h1')).toHaveText('새로 만드시나요, 지금 홈페이지를 고치시나요?');
    expect(await page.evaluate(() => [localStorage.getItem('prologue.brief.v1'), localStorage.getItem('prologue.brief.compare.v1')])).toEqual([expect.any(String), null]);
    // 첫 화면 상태가 다시 저장되므로 답 키는 빈 답으로 다시 생긴다 — 이전 답이 없는지 본다
    expect(await page.evaluate(() => localStorage.getItem('prologue.brief.v1'))).not.toContain('가람');
  });

  test('비교표는 새로고침해도 남고 요청서에는 없다', async ({ page }) => {
    await finish(page);
    await page.locator('[data-brief-compare] input').first().fill('180만 원');
    await page.reload();
    await expect(page.locator('[data-brief-compare] input').first()).toHaveValue('180만 원');
    await expect(page.locator('[data-brief-doc]')).not.toContainText('180만 원');
  });

  test('폰: 결과 화면 가로 스크롤 없음(표 상자 안은 예외)', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone');
    await finish(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bash <scratchpad>/fontmock/rb.sh` 후 `node node_modules/@playwright/test/cli.js test tests/brief-result.spec.ts --project=w1440 --project=phone --workers=1 --reporter=line`
Expected: FAIL — 결과 화면 비어 있음.

- [ ] **Step 3: 구현**

```tsx
// web/components/brief/result.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { buildBrief, impactItems, toPlainText, vendorQuestions } from '@/lib/brief/derive';
import { COMPARE_ROWS, browserStorage, loadCompare, saveCompare, type Vendor } from '@/lib/brief/storage';
import { isInAppBrowser } from '@/lib/brief/in-app';
import type { Answers, StepId } from '@/lib/brief/types';
import s from './result.module.css';

/** 앱 안 브라우저에서 인쇄가 되는지 — Task 1 기기 시험 결과로 정한다. 확인 전에는 막혀 있다고 본다 */
export const PRINT_IN_APP: 'ok' | 'blocked' = 'blocked';

const EDIT_OF: Record<string, StepId> = { purpose: 'kind', renew: 'renew', pages: 'pages', features: 'features', links: 'links', content: 'content', brand: 'brand',
  design: 'design', ops: 'ops', own: 'own', scope: 'scope', when: 'when', budget: 'when' };

export function Result({ a, onEdit, onReset }: { a: Answers; onEdit: (s: StepId) => void; onReset: () => void }) {
  const today = useMemo(() => new Date(), []);
  const b = useMemo(() => buildBrief(a, today), [a, today]);
  const impact = useMemo(() => impactItems(a, today), [a, today]);
  const vq = useMemo(() => vendorQuestions(a), [a]);
  const [cmp, setCmp] = useState<Vendor[]>([]);
  const [copied, setCopied] = useState('');
  const [box, setBox] = useState('');
  const [inApp, setInApp] = useState(false);

  useEffect(() => { setCmp(loadCompare(browserStorage())); setInApp(isInAppBrowser(navigator.userAgent)); }, []);
  const putCmp = (v: Vendor[]) => { setCmp(v); saveCompare(browserStorage(), v); };
  const printBlocked = inApp && PRINT_IN_APP === 'blocked';

  const copy = async () => {
    const text = toPlainText(a, today);
    try { if (!navigator.clipboard) throw new Error('no clipboard'); await navigator.clipboard.writeText(text); setCopied('복사했어요'); setBox(''); }
    catch { setBox(text); setCopied(''); }
  };
  const reset = () => { if (window.confirm('입력한 답과 비교표를 모두 지울까요?')) onReset(); };

  return (
    <div className={s.result} data-brief-result>
      <article className={s.doc} data-part="doc" data-brief-doc>
        <h1 className={s.title}>{b.title}</h1>
        <p className={s.meta}>{b.subtitle}</p>
        {b.sections.filter((x) => x.rows.length).map((x) => (
          <section key={x.id} className={s.sec}>
            <h2 className={s.secT}>{x.title}{EDIT_OF[x.id] ? <button type="button" className={s.edit} onClick={() => onEdit(EDIT_OF[x.id])} data-edit={EDIT_OF[x.id]}>고치기</button> : null}</h2>
            <dl className={s.dl}>{x.rows.map((r, i) => (<div key={i} className={s.row}><dt>{r.label}</dt><dd>
              {r.tag === 'must' ? <span className={s.tag}>오픈 때 꼭</span> : r.tag === 'later' ? <span className={`${s.tag} ${s.later}`}>나중에</span> : null}
              <span className={r.tag === 'ask' ? s.ask : ''}>{r.value}</span></dd></div>))}</dl>
          </section>
        ))}
      </article>

      <section className={`${s.box} ${s.noPrint}`} data-part="impact" data-brief-impact>
        <h2 className={s.boxT}>견적을 크게 움직이는 항목</h2>
        {impact.length ? <ul className={s.ul}>{impact.map((i) => <li key={i.title}><b>{i.title}</b><small>{i.reason}</small></li>)}</ul>
          : <p className={s.small}>크게 움직이는 항목이 없어요.</p>}
      </section>

      <section className={s.box} data-part="vendor" data-brief-vendor>
        <h2 className={s.boxT}>업체에 꼭 물어볼 질문</h2>
        <p className={s.printOnly} data-print-only>이 요청서로 견적을 주실 때 아래 질문에도 답해 주세요.</p>
        <ul className={s.ul}>{vq.map((q) => <li key={q}>{q}</li>)}</ul>
      </section>

      <section className={`${s.box} ${s.noPrint}`} data-part="compare" data-brief-compare>
        <h2 className={s.boxT}>받은 견적 비교</h2>
        <div className={s.tbl}>
          <table className={s.table}>
            <thead><tr><th />{cmp.map((v, i) => <th key={i}><input aria-label={`업체 ${i + 1} 이름`} className={s.cell} value={v.name} onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">견적 금액</th>{cmp.map((v, i) => <td key={i}><input aria-label={`${v.name} 견적 금액`} className={s.cell} value={v.price} onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} /></td>)}</tr>
              {COMPARE_ROWS.map((r) => (
                <tr key={r}><th scope="row">{r}</th>{cmp.map((v, i) => <td key={i}><input aria-label={`${v.name} ${r}`} className={s.cell} value={v.cells[r]}
                  onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, cells: { ...x.cells, [r]: e.target.value } } : x)))} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={s.small}>이 표는 이 기기에만 저장돼요. 업체에 보내는 요청서에는 들어가지 않아요.</p>
      </section>

      <div className={`${s.exp} ${s.noPrint}`} data-part="export" data-brief-export>
        {printBlocked ? <>
          <button type="button" className={`${s.btn} ${s.pri}`} onClick={copy} data-brief-copy>글자로 복사</button>
          <p className={s.small} data-brief-inapp>Safari나 Chrome으로 열면 PDF로 저장할 수 있어요.</p>
        </> : <>
          <button type="button" className={`${s.btn} ${s.pri}`} onClick={() => window.print()} data-brief-print>PDF로 저장</button>
          <button type="button" className={s.btn} onClick={copy} data-brief-copy>글자로 복사</button>
        </>}
        <button type="button" className={s.btn} onClick={() => onEdit('mode')} data-brief-edit>답 고치기</button>
        <button type="button" className={s.btn} onClick={reset} data-brief-reset>모두 지우기</button>
        <p className={s.small} aria-live="polite" data-brief-copied>{copied}</p>
        {box ? <div className={s.copybox}>
          <textarea readOnly value={box} rows={10} className={s.copyArea} data-brief-copybox ref={(t) => { t?.focus(); t?.select(); }} />
          <p className={s.small} data-brief-copybox-help>길게 눌러 복사해 주세요</p>
        </div> : null}
      </div>

      <p className={`${s.small} ${s.noPrint}`} data-part="privacy" data-brief-privacy>입력한 내용은 이 기기에만 저장돼요. 연락처는 묻지 않아요.</p>
      <p className={`${s.foot} ${s.noPrint}`} data-part="prologue" data-brief-prologue>이 요청서를 Prologue&amp;에도 보내 볼 수 있어요 · <button type="button" className={s.link} data-brief-send>보내기</button></p>
    </div>
  );
}
```

```css
/* web/components/brief/result.module.css */
.result{display:flex;flex-direction:column;gap:24px}
.doc{background:var(--bone-0);border:1px solid var(--bone-200);border-radius:4px;padding:40px 44px}
.title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em;line-height:1.35}
.meta{margin:6px 0 0;font-size:13px;color:var(--bone-500)}
.sec{margin-top:28px}
.secT{display:flex;align-items:center;gap:10px;margin:0 0 8px;font-size:13px;font-weight:600;color:var(--bone-500)}
.edit{border:0;background:none;padding:2px 4px;font:inherit;font-size:12px;color:var(--signal);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.dl{margin:0}
.row{display:grid;grid-template-columns:132px 1fr;gap:16px;padding:4px 0;font-size:15px}
.row dt{color:var(--bone-600)}.row dd{margin:0;overflow-wrap:anywhere}
.tag{display:inline-block;font-size:12px;padding:1px 8px;border-radius:2px;background:var(--navy-50);color:var(--navy-700);margin-right:6px}
.later{background:var(--bone-100);color:var(--bone-600)}
.ask{color:var(--signal);font-weight:600}
.box{background:var(--bone-0);border:1px solid var(--bone-200);border-radius:4px;padding:24px 28px}
.boxT{margin:0 0 12px;font-size:19px;font-weight:700;letter-spacing:-.02em}
.ul{margin:0;padding-left:18px;font-size:15px}.ul li+li{margin-top:8px}
.ul b{font-weight:600}.ul small{display:block;color:var(--bone-600);font-size:13px}
.small{margin:0;font-size:13px;color:var(--bone-500)}
.tbl{overflow-x:auto;margin:4px 0 10px}
.table{border-collapse:collapse;font-size:14px;min-width:560px;width:100%}
.table th,.table td{border-bottom:1px solid var(--bone-200);padding:8px 10px;text-align:left;white-space:nowrap}
.table tbody th{position:sticky;left:0;background:var(--bone-0);font-weight:500;z-index:1}
.cell{width:100%;min-width:96px;border:0;border-bottom:1px solid var(--bone-300);background:transparent;font:inherit;padding:4px 0;color:inherit}
.exp{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.btn{height:48px;padding:0 22px;border-radius:3px;font:inherit;font-size:15px;font-weight:600;border:1px solid var(--bone-300);background:var(--bone-0);color:var(--bone-900);cursor:pointer}
.pri{background:var(--navy-900);border-color:var(--navy-900);color:var(--bone-0)}
.copybox{width:100%}
.copyArea{width:100%;font:inherit;font-size:14px;padding:12px;border:1px solid var(--bone-300);border-radius:3px;background:var(--bone-0)}
.foot{margin:16px 0 0;font-size:13px;color:var(--bone-500)}
.link{border:0;background:none;padding:0;font:inherit;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.printOnly{display:none}
@media (max-width:700px){ .doc{padding:28px 20px} .title{font-size:23px} .row{grid-template-columns:96px 1fr} .box{padding:20px} }
@media print{
  .noPrint{display:none!important}
  .printOnly{display:block;margin:0 0 8px;font-size:13px}
  .doc,.box{border:0;padding:0;background:none}
  .edit{display:none}
  .result{gap:16px;color:#000}
}
```

- [ ] **Step 4: 빌드·통과 확인**

Run: `bash <scratchpad>/fontmock/rb.sh` 후 Step 2 명령
Expected: 모두 통과. 「서버 요청 없음」 테스트가 Next 내부 요청(`?_rsc`, `_next/`)에 걸리면 걸러진 목록을 보고 그 요청이 답을 담지 않는지 확인 후 필터에 더하고 Ruling 기록.

- [ ] **Step 5: 커밋**

```bash
git add web/components/brief/result.tsx web/components/brief/result.module.css web/tests/brief-result.spec.ts
git commit -F - <<'EOF'
[ADD] 요청서 결과 화면과 내보내기

요청서·견적을 움직이는 항목·업체에 물어볼 질문·받은 견적 비교표를
보여 준다. PDF 저장은 인쇄로(단추·비교표·머리글은 빠짐), 글자로
복사는 막히면 글상자로 펼친다. 앱 안 브라우저에서는 기기 시험 전까지
복사를 주 단추로 둔다. 서버로 나가는 요청 없음.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 8: 「Prologue&에도 보내기」 — 문의 서랍 미리 채우기

**Files:**
- Modify: `web/components/inquiry-drawer.tsx:41-65`
- Modify: `web/components/brief/result.tsx` (보내기 단추에 이벤트)
- Test: `web/tests/brief-drawer.spec.ts`

**Interfaces:**
- Consumes: `briefSummary(a, today)`, `appendSummary(existing, summary)`
- Produces: `inquiry:open` 이벤트 `detail: { project: string; instant?: boolean; prefill?: { need?: string; pain: string } }`

- [ ] **Step 1: 실패하는 테스트**

```ts
// web/tests/brief-drawer.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Prologue&에도 보내기', () => {
  test('보내기 → 서랍이 열리고 1단계·요약·새로 만들기 선택, 서버 요청 없음', async ({ page }) => {
    const sent: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/api/')) sent.push(r.url()); });
    await page.goto('/tools/brief');
    await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: true })));
    await page.reload();
    await page.locator('[data-brief-send]').click();
    const pain = page.locator('textarea[name="pain"]');
    await expect(pain).toBeVisible();
    await expect(pain).toHaveValue(/^\[요청서 만들기\]/);
    await expect(page.getByRole('radio', { name: '새로 만들고 싶어요' })).toBeChecked();
    expect(sent).toEqual([]);
  });

  test('서랍 2단계에서 닫은 뒤 보내기로 열면 1단계, 이미 쓴 글은 지우지 않고 덧붙임', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: true })));
    await page.reload();
    await page.locator('header [data-open-drawer]').click();
    await page.locator('textarea[name="pain"]').fill('제가 먼저 쓴 글');
    await page.getByRole('button', { name: '다음' }).click();
    await page.locator('[data-drawer] button[aria-label="닫기"]').click();
    await page.locator('[data-brief-send]').click();
    const pain = page.locator('textarea[name="pain"]');
    await expect(pain).toBeVisible();
    await expect(pain).toHaveValue(/^제가 먼저 쓴 글\n\n\[요청서 만들기\]/);
  });

  test('이미 900자를 쓴 뒤 보내기 → 합계 1,000자 이하, 기존 글 그대로', async ({ page }) => {
    await page.goto('/tools/brief');
    await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기', name: '가'.repeat(60) }, step: 'when', done: true })));
    await page.reload();
    await page.locator('header [data-open-drawer]').click();
    await page.locator('textarea[name="pain"]').fill('나'.repeat(900));
    await page.locator('[data-drawer] button[aria-label="닫기"]').click();
    await page.locator('[data-brief-send]').click();
    const v = await page.locator('textarea[name="pain"]').inputValue();
    expect(v.length).toBeLessThanOrEqual(1000);
    expect(v.startsWith('나'.repeat(900))).toBe(true);
  });

  test('미리 채움이 없는 기존 열기는 그대로(이전 단계 유지)', async ({ page }) => {
    await page.goto('/projects');
    await page.click('header [data-open-drawer]');
    await page.locator('textarea[name="pain"]').fill('기존 동작 확인');
    await page.getByRole('button', { name: '다음' }).click();
    await page.locator('[data-drawer] button[aria-label="닫기"]').click();
    await page.click('header [data-open-drawer]');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
```

(서랍의 폼 ref 이름(`form`)·「다음」 단추 이름·「닫기」 레이블·`[data-drawer]`·`input[name="email"]`이 실제와 다르면 `components/inquiry-drawer.tsx`와 `tests/inquiry.spec.ts`의 선택자를 grep해 맞춘다 — 테스트 의도는 바꾸지 않는다.)

- [ ] **Step 2: 실패 확인**

Run: `bash <scratchpad>/fontmock/rb.sh` 후 `node node_modules/@playwright/test/cli.js test tests/brief-drawer.spec.ts --project=w1440 --project=phone --workers=1 --reporter=line`
Expected: FAIL — 보내기 단추에 이벤트 없음.

- [ ] **Step 3: 서랍 수정**

```tsx
// web/components/inquiry-drawer.tsx — 맨 위 import에 추가
import { appendSummary } from '@/lib/brief/prefill';

// openWith 시그니처와 본문 (기존 :41-52를 교체)
type Prefill = { need?: string; pain: string };
const openWith = useCallback((p: string, from: HTMLElement | null, inst: boolean, prefill?: Prefill) => {
  opener.current = from;
  setProject(p); setError('');
  // 미리 채울 내용이 있으면 1단계로 — 없으면 지금처럼 열려 있던 단계를 그대로 둔다(done 이후만 새로 시작)
  setStep((prev) => (prefill || prev === 'done' ? 'step1' : prev));
  setPhone(window.matchMedia('(max-width:1023px)').matches);
  setInstant(inst);
  setMounted(true);
  setOpen(true);
  openedAt.current = Date.now();
  if (prefill) {
    // 비제어 폼 — done 에서 새로 마운트될 수 있어 다음 그림 때 넣는다
    requestAnimationFrame(() => {
      const f = form.current; if (!f) return;
      const pain = f.elements.namedItem('pain') as HTMLTextAreaElement | null;
      if (pain) pain.value = appendSummary(pain.value, prefill.pain);
      if (prefill.need) {
        const chosen = f.querySelector<HTMLInputElement>('input[name="need"]:checked');
        const target = f.querySelector<HTMLInputElement>(`input[name="need"][value="${CSS.escape(prefill.need)}"]`);
        if (!chosen && target) target.checked = true;
      }
    });
  }
}, []);

// onOpen 처리기 (기존 :62-65를 교체)
const onOpen = (e: Event) => {
  const d = (e as CustomEvent<{ project?: string; instant?: boolean; prefill?: Prefill }>).detail ?? {};
  openWith(d.project ?? '', document.querySelector<HTMLElement>('[data-dock]') ?? (document.activeElement as HTMLElement | null), !!d.instant, d.prefill);
};
```

- [ ] **Step 4: 보내기 단추 연결**

```tsx
// web/components/brief/result.tsx — import 추가
import { briefSummary } from '@/lib/brief/derive';

// Result 안, return 위에 추가
const send = () => {
  document.dispatchEvent(new CustomEvent('inquiry:open', { detail: { project: '', prefill: { need: a.mode === 'new' ? '새로 만들고 싶어요' : undefined, pain: briefSummary(a, today) } } }));
};
// 보내기 단추에 onClick={send}
```

- [ ] **Step 5: 통과 확인 — 새 테스트와 기존 서랍 테스트 전부**

Run: `bash <scratchpad>/fontmock/rb.sh` 후 `node node_modules/@playwright/test/cli.js test tests/brief-drawer.spec.ts tests/inquiry.spec.ts tests/mobile-inquiry.spec.ts tests/mobile-fixes.spec.ts --workers=1 --reporter=line`
Expected: 모두 통과(기존 서랍 테스트 포함).

- [ ] **Step 6: 커밋**

```bash
git add web/components/inquiry-drawer.tsx web/components/brief/result.tsx web/tests/brief-drawer.spec.ts
git commit -F - <<'EOF'
[ADD] 요청서를 Prologue&에도 보내기

결과 화면 맨 아래 「보내기」를 누르면 문의 서랍이 요청서 요약이
채워진 채 1단계로 열린다. 이미 쓴 글은 지우지 않고 덧붙이며
1,000자를 넘지 않게 줄인다. 실제 전송은 서랍에서 보낼 때만.
미리 채움이 없는 기존 열기 동작은 그대로.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 9: 기기 시험 결과 반영·시험 페이지 삭제

**전제:** Task 1 Step 6의 사용자 결과가 진행 기록에 `Ruling: PRINT_IN_APP = ...`로 있다. 없으면 이 Task를 마지막으로 미루고 Task 10을 먼저 한다.

**Files:**
- Modify: `web/components/brief/result.tsx` (`PRINT_IN_APP` 값)
- Delete: `web/app/tools/print-test/page.tsx`, `web/components/brief/print-test.tsx`, `web/tests/print-test.spec.ts`
- Test: `web/tests/brief-result.spec.ts` (추가)

- [ ] **Step 1: 실패하는 테스트 추가(결과가 'blocked'일 때)**

```ts
// web/tests/brief-result.spec.ts 끝에 추가 — 앱 안 브라우저 흉내
test('앱 안 브라우저: 인쇄 대신 복사가 주 단추, 다른 브라우저 안내', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone) AppleWebKit Barcelona 289.0' });
  const page = await ctx.newPage();
  await page.goto('/tools/brief');
  await page.evaluate(() => localStorage.setItem('prologue.brief.v1', JSON.stringify({ answers: { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' }, step: 'when', done: true })));
  await page.reload();
  await expect(page.locator('[data-brief-print]')).toHaveCount(0);
  await expect(page.locator('[data-brief-inapp]')).toContainText('Safari나 Chrome');
  await ctx.close();
});
test('시험 페이지는 지워졌다', async ({ request }) => {
  expect((await request.get('/tools/print-test')).status()).toBe(404);
});
```

결과가 `'ok'`이면 첫 테스트를 「앱 안 브라우저에서도 PDF로 저장 단추가 있다」(`[data-brief-print]` 1개, `[data-brief-inapp]` 0개)로 바꾼다.

- [ ] **Step 2: 실패 확인** — 시험 페이지가 아직 있어 두 번째 테스트 FAIL.

- [ ] **Step 3: 반영·삭제**
  - `result.tsx` `PRINT_IN_APP`를 기록된 값으로.
  - `git rm web/app/tools/print-test/page.tsx web/components/brief/print-test.tsx web/tests/print-test.spec.ts`

- [ ] **Step 4: 빌드·통과 확인** — `rb.sh` 후 `tests/brief-result.spec.ts` 전부 통과.

- [ ] **Step 5: 커밋**

```bash
git add -A web/components/brief/result.tsx web/tests/brief-result.spec.ts web/app/tools web/components/brief
git commit -F - <<'EOF'
[MOD] 앱 안 브라우저 PDF 처리 확정, 시험 페이지 삭제

기기 시험 결과에 맞춰 앱 안 브라우저의 PDF 저장 단추를 정하고,
임시 시험 페이지를 지운다.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 10: 문구 검사·전체 테스트·눈으로 확인

**Files:**
- Test: `web/tests/brief-unit.spec.ts` (추가)

- [ ] **Step 1: 문구 검사 테스트 추가**

```ts
// web/tests/brief-unit.spec.ts 끝에 추가
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { bannedWords } from './banned';

test('문구: 금지 낱말·낫표 없음, 이유 문장에 금액 없음', () => {
  const files = ['content/brief/questions.ts', 'components/brief/result.tsx', 'components/brief/brief-tool.tsx', 'components/brief/steps.tsx', 'lib/brief/derive.ts', 'app/tools/brief/page.tsx'];
  const text = files.map((f) => readFileSync(join(__dirname, '..', f), 'utf8')).join('\n');
  expect(text).not.toMatch(/[「」]/);
  const words = bannedWords();
  if (words) for (const w of words) expect(text, w).not.toContain(w);
  const q = readFileSync(join(__dirname, '..', 'content/brief/questions.ts'), 'utf8');
  const whyLines = q.split('\n').filter((l) => /Why|why:/.test(l));
  for (const l of whyLines) expect(l).not.toMatch(/\d+\s*만\s*원/);
});
```

- [ ] **Step 2: 실행** — `node node_modules/@playwright/test/cli.js test tests/brief-unit.spec.ts --project=w1440 --workers=1 --reporter=line` → 통과(실패하면 문구를 고친다).

- [ ] **Step 3: 전체 테스트**

Run: `bash <scratchpad>/fontmock/rb.sh` 후 `node node_modules/@playwright/test/cli.js test --workers=1 --reporter=line > ../.superpowers/full.log 2>&1; tail -5 ../.superpowers/full.log`
Expected: 실패 0. 실패가 있으면 이름을 적고 원인을 찾아 고친다(기존 테스트를 고쳐 맞추지 않는다).

- [ ] **Step 4: 타입** — `node node_modules/typescript/bin/tsc --noEmit` → 오류 없음.

- [ ] **Step 5: 눈으로 확인(명세 §10)** — vibescraper로 3100의 `/tools/brief`를 390·1440 폭에서 질문 5·11·결과 캡처해 시안(`data/images/tools/brief-*.png`)과 나란히 본다. 질문·도움말·이유 문장을 모아 소리 내어 읽고 어색한 곳을 고친다. 캡처는 `data/images/tools/impl-*.png`(커밋하지 않음).

- [ ] **Step 6: 커밋(문구를 고쳤다면)**

```bash
git add web/content/brief web/components/brief web/tests/brief-unit.spec.ts
git commit -F - <<'EOF'
[MOD] 요청서 도구 문구 다듬기와 문구 검사

금지 낱말·낫표·이유 문장 속 금액이 없는지 검사하고, 소리 내어
읽어 어색한 문구를 고친다.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

- [ ] **Step 7: 사용자에게 넘기기** — 푸시하지 않는다. 명세 §10의 남은 확인(지인 사장님 실제 사용, PDF 실제 저장, 보내기 테스트 메일 1통)을 사용자에게 안내한다.
