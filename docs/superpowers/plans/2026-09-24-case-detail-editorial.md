# Case Study 상세 재구축 — 에디토리얼 문서형 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Por favor, Harry 상세 페이지를 "판 = 화면 한 장" 구조에서, 표지 · 장(블록 조합) · 끝으로 이루어진 내려 읽는 문서형 페이지로 다시 짓는다.

**Architecture:** 콘텐츠는 새 타입 `Study`(표지 + 장 N개 + 끝)로 쓰고, 서버 페이지가 `resolveStudy`로 그림 파일의 원본 크기를 채워 넘긴다. 화면은 12칸 격자 위의 서버 컴포넌트(표지·장·끝)와, 상태가 필요한 곳만 클라이언트 컴포넌트(여백 주석의 핫스팟, 흐름 다이어그램, 와이프)로 짠다. 판 엔진(정거장·머무름·그림 크기 맞추기)은 모두 지운다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, next/image, Lenis, Playwright(프로덕션 빌드 대상).

**Spec:** `docs/superpowers/specs/2026-09-23-case-detail-editorial-design.md` (§14에 이 계획을 쓰며 바꾼 점)

## Global Constraints

- 작업 디렉터리는 `web/`. 모든 명령은 `cd web` 뒤에 실행한다.
- 테스트는 `npx playwright test ...` — `playwright.config.ts`가 `npm run build && npm run start -- --port 3100`으로 **프로덕션 빌드**를 띄운다. 3100번에 다른 서버(개발 서버 등)가 떠 있으면 **먼저 끈다** — `reuseExistingServer: true`라 옛 코드를 잰다.
- 이 저장소의 셸에는 `rtk`가 명령 출력을 가로채 줄이는 래퍼가 있다. git·테스트 출력이 이상하면 `rtk proxy <명령>`으로 원본을 본다.
- 새 의존성을 넣지 않는다.
- 폰 경계는 `max-width:1023px` / `min-width:1024px`.
- 격자: 본문 컨테이너는 전역 `.wrap`(max-width `clamp(1272px,80vw,1760px)`, 좌우 72px) 그대로, 그 안을 12칸·간격 24px.
- 글자 크기는 docs/14 §3.1: 표지 H1 `clamp(44px,3.8vw,72px)`, 장 제목 `clamp(30px,2.8vw,40px)`, 여백 주석 제목 `clamp(21px,1.7vw,24px)`, 장 도입 문단 `clamp(17px,1.3vw,19px)`, 본문 16px, 캡션·라벨 13px. 강조는 색만(navy-800).
- 색은 `globals.css` 토큰(`var(--navy-800)` 등)만. 하드코딩 색 금지.
- 섹션 간격 128px(폰 80px), 장 시작에 bone-200 1px 괘선.
- 새 문구는 docs/21 규칙(번역투·줄표·대구 금지, 존댓말 "~합니다").
- 나타남(페이드업) 효과 금지(docs/14 §3.6). 움직이는 곳은 흐름 다이어그램(02)과 와이프(04) 둘뿐.
- 모션 줄이기: Lenis 끔(이미 `lenis-provider`가 함), 흐름 t=1, 와이프 After 전부.
- 커밋 메시지는 이 저장소 형식 `[ADD|MOD|FIX] web: …`(한국어), 끝에 `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- 테스트 선택자 약속(다른 테스트가 기대함): `[data-cover-title]`·그 안 `[data-title]`(목록→상세 전환), `[data-num]`, `[data-meta-row]`, `[data-spot="n"]`, `[data-spot-hl]`, `[data-cta]`, `[data-teaser]`, `[data-wipe-before]`, `[data-wipe-after]`, `[data-wipe-edge]`, 헤더 `[data-back]`·`[data-brand]`·`[data-open-drawer]`.

---

## 파일 구조

| 파일 | 역할 | 작업 |
|---|---|---|
| `web/content/study-types.ts` | 새 콘텐츠 타입 `Study`·`Chapter`·`Block`·`Figure` | 1 |
| `web/content/figures.ts` | 한 편의 모든 그림 목록 | 1 |
| `web/content/validate.ts` | 콘텐츠 규칙 검사 `validateStudy` | 1 |
| `web/lib/image-size.ts` | PNG·JPEG 파일 머리에서 원본 크기 | 1 |
| `web/content/resolve.ts` | 모든 그림에 w·h 채우기 `resolveStudy`(서버 전용) | 1 |
| `web/content/studies/por-favor-harry.ts` | Por favor, Harry 새 콘텐츠 | 1 |
| `web/lib/figure-rules.ts` | 그림 규칙의 순수 계산(`frameMode`, `rowMaxWidth`) | 2 |
| `web/components/case/grid.module.css` | 12칸 격자 칸 | 2 |
| `web/components/case/type.module.css` | 라벨·제목·문단 글자 | 2 |
| `web/components/case/frame.tsx` + `.module.css` | 그림 한 장의 틀(원본 상한·긴 캡처 창·캡션) | 2 |
| `web/components/case/cover.tsx` + `.module.css` | 표지 | 2(고침) |
| `web/components/case/chapter.tsx` + `.module.css` | 장(번호·도입·블록) | 2 |
| `web/components/case/block-view.tsx` | 블록 종류별 분기 | 2, 3~6에서 늘림 |
| `web/components/case/closing.tsx` + `.module.css` | 끝(Built with·문의·다음 이야기) | 2 |
| `web/components/case/study-view.tsx` | 한 편 조립 | 2 |
| `web/components/case/row.tsx` + `.module.css` | 한 줄 높이 맞춤 | 3 |
| `web/components/case/note.tsx` + `.module.css` | 여백 주석(+핫스팟) | 3 |
| `web/components/case/phones.tsx` + `.module.css` | 폰 칸 | 4 |
| `web/components/case/quote.tsx` + `.module.css` | 통찰 한 문장 | 4 |
| `web/components/case/use-scroll-progress.ts` | 스크롤 진행률 훅 | 5 |
| `web/components/case/flow.tsx` + `.module.css` | 흐름 다이어그램 | 5 |
| `web/components/case/wipe.tsx` + `.module.css` | 와이프(CSS sticky) | 6(고침) |
| 지움 | `case-view.tsx`, `pan.tsx`, `pan.module.css`, `screen.tsx`, `finale.tsx`, `finale.module.css`, `dwell.tsx`, `dwell.module.css`, `use-dwell.ts`, `use-fit-pans.ts`, `use-stations.ts`, `hooks.ts`, `morph-diagram.tsx`, `content/cases/por-favor-harry.ts` | 2 |

---

### Task 1: 콘텐츠 모델 — 타입, 그림 크기 읽기, 규칙 검사, Por favor, Harry 데이터

옛 상세 화면은 이 작업에서 건드리지 않는다(옛 `Case`·`getCase`를 그대로 둔다). 새 모델만 더하고 Node 테스트로 검증한다.

**Files:**
- Create: `web/content/study-types.ts`, `web/content/figures.ts`, `web/content/validate.ts`, `web/lib/image-size.ts`, `web/content/resolve.ts`, `web/content/studies/por-favor-harry.ts`
- Modify: `web/content/index.ts`
- Test: `web/tests/study.spec.ts`

**Interfaces:**
- Produces:
  - `type Study`, `Chapter`, `Block`, `Figure`, `Num`, `NoteBlock`, `PhonesBlock`, `FlowBlock`, `QuoteBlock`, `WipeBlock`, `FigureBlock` (`content/study-types.ts`)
  - `figuresOf(s: Study): Figure[]`
  - `validateStudy(s: Study): string[]` — 규칙 위반 설명 목록, 없으면 `[]`
  - `imageSize(file: string): { w: number; h: number }`, `publicFile(src: string): string`
  - `resolveStudy(s: Study): Study` — 모든 그림에 `w`·`h`를 채운 사본(서버 전용, fs 사용)
  - `getStudy(slug: string): Study | undefined` (`content/index.ts`)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`web/tests/study.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { getStudy } from '../content';
import { validateStudy } from '../content/validate';
import { resolveStudy } from '../content/resolve';
import { figuresOf } from '../content/figures';
import type { Study } from '../content/study-types';

const pfh = () => getStudy('por-favor-harry')!;

test('Por favor, Harry 는 콘텐츠 규칙을 지킨다', () => {
  expect(validateStudy(pfh())).toEqual([]);
});

test('장 네 개: 문제 · 바꾼 흐름 · 화면 · Before & After', () => {
  const s = pfh();
  expect(s.chapters.map((c) => c.id)).toEqual(['problem', 'flow', 'screens', 'before-after']);
  const screens = s.chapters[2].blocks.map((b) => b.type);
  expect(screens).toEqual(['note', 'note', 'note', 'note', 'note', 'note', 'phones']);
  expect(s.cover.numbers).toHaveLength(3);
});

test('규칙을 어기면 이유를 돌려준다', () => {
  const bad: Study = structuredClone(pfh());
  bad.chapters[0].id = '문제';
  const wipe = bad.chapters[3].blocks[0];
  bad.chapters[3].blocks.push(structuredClone(wipe));
  const note = bad.chapters[2].blocks[1];
  if (note.type !== 'note') throw new Error('03 두 번째 블록은 note 여야 한다');
  note.figs = [note.figs[0], note.figs[0], note.figs[0], note.figs[0]];
  note.p = ['하나입니다. 둘입니다. 셋입니다.'];
  const pair = bad.chapters[2].blocks[4];
  if (pair.type !== 'note') throw new Error('03 다섯 번째 블록은 note 여야 한다');
  pair.figs[1] = { ...pair.figs[1], spots: [{ x: 1, y: 1, w: 1, h: 1, cap: '두 번째 그림의 핫스팟' }] };
  bad.cover.hero = { ...bad.cover.hero, alt: ' ' };
  const errs = validateStudy(bad).join('\n');
  expect(errs).toContain('장 id');
  expect(errs).toContain('와이프는 한 편에 하나까지');
  expect(errs).toContain('그림은 1~3장');
  expect(errs).toContain('두 문장 이하');
  expect(errs).toContain('핫스팟은 여백 주석의 첫 그림에만');
  expect(errs).toContain('alt 가 비었습니다');
});

test('그림 크기는 파일에서 읽는다', () => {
  const figs = figuresOf(resolveStudy(pfh()));
  expect(figs.every((f) => (f.w ?? 0) > 0 && (f.h ?? 0) > 0)).toBe(true);
  expect(figs.find((f) => f.src.endsWith('/form.png'))).toMatchObject({ w: 1280, h: 800 });
  expect(figs.find((f) => f.src.endsWith('/mobile.png'))).toMatchObject({ w: 390, h: 844 });
});

test('없는 그림 파일은 오류', () => {
  const s = pfh();
  const missing: Study = { ...s, cover: { ...s.cover, hero: { ...s.cover.hero, src: '/screens/pfh/없는-파일.png' } } };
  expect(() => resolveStudy(missing)).toThrow();
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd web && npx playwright test tests/study.spec.ts --project=w1440`
Expected: FAIL — `getStudy` is not a function / `Cannot find module '../content/validate'` (빌드는 통과하고 테스트 파일 로드에서 실패)

- [ ] **Step 3: 타입을 쓴다**

`web/content/study-types.ts`:

```ts
import type { Scatter, Spot } from './types';

/** 그림 한 장. w·h 는 쓰지 않는다 — resolveStudy 가 public/ 의 파일에서 읽어 채운다 */
export type Figure = { src: string; alt: string; caption?: string; spots?: Spot[]; w?: number; h?: number };
export type Num = { value: string; label: string; small?: string };

export type FigureBlock = { type: 'figure'; slot: 'wide' | 'body'; fig: Figure };
export type NoteBlock = { type: 'note'; label: string; h?: string; p?: string[]; figs: Figure[] };
export type PhonesBlock = { type: 'phones'; label?: string; h?: string; p?: string[]; figs: Figure[]; caption?: string };
export type FlowBlock = {
  type: 'flow'; state: 'before' | 'morph';
  from: string[];   // 흩어진 갈래(2~5개)
  hub: string;      // before: 갈래가 모이는 곳
  stop: string;     // before: 끝의 × 자리
  to: string[];     // morph: 새 흐름의 단계(2~6개)
  alt: string; caption?: string;
};
export type QuoteBlock = { type: 'quote'; text: string; p?: string };
export type WipeBlock = { type: 'wipe'; before: Scatter[] | Figure; after: Figure; caps: [string, string] };
export type Block = FigureBlock | NoteBlock | PhonesBlock | FlowBlock | QuoteBlock | WipeBlock;

/** 장 — id 는 주소(#problem), name 은 왼쪽 라벨 칸. 번호는 순서대로 자동 */
export type Chapter = { id: string; name: string; h: string; p: string[]; blocks: Block[] };

/** 한 편 = 표지 + 장 N개 + 끝. 다음 이야기는 목록 순서로 정한다 */
export type Study = {
  cover: { cap: string; title: string; summary: string[]; meta: [string, string][]; numbers: Num[]; hero: Figure };
  chapters: Chapter[];
  builtWith?: string[];
  cta: string;
};
```

- [ ] **Step 4: 그림 목록·규칙 검사를 쓴다**

`web/content/figures.ts`:

```ts
import type { Figure, Study } from './study-types';

/** 표지 대표 화면부터 블록 순서대로, 한 편의 모든 그림 */
export function figuresOf(s: Study): Figure[] {
  const out: Figure[] = [s.cover.hero];
  for (const c of s.chapters) {
    for (const b of c.blocks) {
      if (b.type === 'figure') out.push(b.fig);
      else if (b.type === 'note' || b.type === 'phones') out.push(...b.figs);
      else if (b.type === 'wipe') {
        out.push(b.after);
        if (!Array.isArray(b.before)) out.push(b.before);
      }
    }
  }
  return out;
}
```

`web/content/validate.ts`:

```ts
import { figuresOf } from './figures';
import type { Figure, Study } from './study-types';

const sentences = (t: string) => (t.match(/[.!?](?=\s|$)/g) ?? []).length;

/** 콘텐츠 규칙(명세 §7). 어긴 것마다 한 줄 설명, 없으면 빈 배열 */
export function validateStudy(s: Study): string[] {
  const errs: string[] = [];
  const ids = s.chapters.map((c) => c.id);
  for (const id of ids) if (!/^[a-z0-9-]+$/.test(id)) errs.push(`장 id 는 영문 소문자·숫자·하이픈만: ${id}`);
  if (new Set(ids).size !== ids.length) errs.push('장 id 가 겹칩니다');
  if (s.cover.numbers.length !== 3) errs.push(`표지 숫자는 3개: ${s.cover.numbers.length}개`);

  const blocks = s.chapters.flatMap((c) => c.blocks);
  if (blocks.filter((b) => b.type === 'wipe').length > 1) errs.push('와이프는 한 편에 하나까지');

  const spotOk = new Set<Figure>();
  for (const b of blocks) {
    if (b.type === 'note' || b.type === 'phones') {
      if (b.figs.length < 1 || b.figs.length > 3) errs.push(`${b.type} 의 그림은 1~3장: ${b.figs.length}장`);
      for (const p of b.p ?? []) if (sentences(p) > 2) errs.push(`여백 주석 문단은 두 문장 이하: ${p.slice(0, 20)}…`);
    }
    if (b.type === 'note' && b.figs[0]) spotOk.add(b.figs[0]);
  }
  for (const f of figuresOf(s)) {
    if (!f.alt.trim()) errs.push(`alt 가 비었습니다: ${f.src}`);
    if (f.spots?.length && !spotOk.has(f)) errs.push(`핫스팟은 여백 주석의 첫 그림에만: ${f.src}`);
  }
  return errs;
}
```

- [ ] **Step 5: 그림 크기 읽기와 resolve 를 쓴다**

`web/lib/image-size.ts`:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** PNG·JPEG 파일 머리에서 원본 가로·세로를 읽는다(의존성 없이). 다른 형식이면 오류 */
export function imageSize(file: string): { w: number; h: number } {
  const b = readFileSync(file);
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const m = b[i + 1];
      const sof = m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
      if (sof) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  throw new Error(`이미지 크기를 읽을 수 없습니다: ${file}`);
}

/** '/screens/pfh/form.png' → <web>/public/screens/pfh/form.png (빌드·테스트 모두 web/ 에서 돈다) */
export const publicFile = (src: string) => path.join(process.cwd(), 'public', src);
```

`web/content/resolve.ts`:

```ts
import { imageSize, publicFile } from '../lib/image-size';
import type { Block, Figure, Study } from './study-types';

const sized = (f: Figure): Figure => ({ ...f, ...imageSize(publicFile(f.src)) });

function block(b: Block): Block {
  switch (b.type) {
    case 'figure': return { ...b, fig: sized(b.fig) };
    case 'note': return { ...b, figs: b.figs.map(sized) };
    case 'phones': return { ...b, figs: b.figs.map(sized) };
    case 'wipe': return { ...b, after: sized(b.after), before: Array.isArray(b.before) ? b.before : sized(b.before) };
    default: return b;
  }
}

/** 모든 그림에 원본 w·h 를 채운 사본. 서버(페이지 렌더·빌드)에서만 부른다 — fs 를 쓴다 */
export function resolveStudy(s: Study): Study {
  return {
    ...s,
    cover: { ...s.cover, hero: sized(s.cover.hero) },
    chapters: s.chapters.map((c) => ({ ...c, blocks: c.blocks.map(block) })),
  };
}
```

- [ ] **Step 6: Por favor, Harry 콘텐츠를 쓴다**

문구는 지금 `content/cases/por-favor-harry.ts`에서 옮기되, 여백 주석 문단은 두 문장 이하로 다듬었다. 03 장 제목("요청 하나가 돌아오기까지")은 명세 §13 미결 — 구현 뒤 사용자 확인.

`web/content/studies/por-favor-harry.ts`:

```ts
import type { Figure, Study } from '../study-types';
import type { Spot } from '../types';

const F = (name: string, alt: string, caption?: string, spots?: Spot[]): Figure =>
  ({ src: `/screens/pfh/${name}.png`, alt, caption, spots });

const FROM = ['전화', '메신저', '이메일', '직접 방문'];
const TO = ['요청 링크', '요청 양식', '심사 대기열', '처리 예정일', '진행 상황 안내'];

export const porFavorHarry: Study = {
  cover: {
    cap: '문제 01 흩어진 요청',
    title: '요청이 들어오는 곳을<br>하나로 줄였습니다',
    summary: ['요청은 링크 하나로 들어오고, 담당자가 수락할 때 처리 예정일이 정해집니다. 그 뒤로는 상태가 바뀔 때마다 요청한 사람에게 알림이 갑니다.'],
    meta: [['역할', '기획 · 설계 · 개발'], ['기간', '2025 · 6주'], ['사용자', '요청을 받는 담당자 1명 · 요청하는 사람 40여 명'], ['공개 범위', '전체 공개']],
    numbers: [
      { value: '4 → 1', label: '요청이 들어오는 곳', small: '전화 · 메신저 · 메일 · 방문 → 요청 링크 하나' },
      { value: '0회', label: '진행 상황을 묻는 연락', small: '요청한 사람이 화면에서 직접 봅니다' },
      { value: '전부', label: '처리 예정일이 붙은 요청', small: '수락할 때 날짜가 정해지고 요청한 사람에게 보입니다' },
    ],
    hero: F('queue', 'Por favor, Harry 담당자 대시보드. 상단에 오늘·새 요청·이번 주 완료·약속 임박·지연 다섯 지표가 있고, 아래 심사 대기 목록에 요청 두 건이 카드로 놓여 있다.',
      '담당자 화면: 들어온 요청은 전부 이 목록에 쌓입니다. 심사를 통과해야 업무가 됩니다.'),
  },
  chapters: [
    {
      id: 'problem', name: '문제',
      h: '네 갈래로 흩어져 들어온 요청',
      p: ['업무 요청이 전화, 메신저, 메일, 직접 방문으로 흩어져 들어왔습니다. 요청하는 쪽은 내용을 다 정리하지 않은 채 보내는 일이 많았고, 받는 쪽이 그걸 다시 정리하고 기억해야 했습니다.',
          '요청이 올 때마다 하던 일을 멈춰야 했습니다. "그거 어떻게 됐어요?"라는 연락도 수시로 왔습니다.'],
      blocks: [
        { type: 'flow', state: 'before', from: FROM, hub: '담당자가 정리·기억', stop: '몰입 중단', to: TO,
          alt: '전화·메신저·이메일·직접 방문으로 들어온 요청이 담당자 한 사람에게 모여 정리·기억되고, 그때마다 하던 일이 끊긴다.',
          caption: '정리는 담당자 머릿속에서 이뤄졌습니다.' },
        { type: 'quote', text: '할 일 관리가 아니라, 요청이 들어오는 길의 문제였습니다.',
          p: '요청이 어디로 들어올지 정해져 있지 않으니, 정리하고 기억하고 다시 묻는 일이 전부 담당자 몫이었습니다.' },
      ],
    },
    {
      id: 'flow', name: '바꾼 흐름',
      h: '요청은 링크 하나로만 들어옵니다',
      p: ['요청할 때 꼭 필요한 정보를 채우게 해서 다시 묻는 일을 없앴습니다. 요청 하나는 아래 다섯 단계를 거칩니다.'],
      blocks: [
        { type: 'flow', state: 'morph', from: FROM, hub: '담당자가 정리·기억', stop: '몰입 중단', to: TO,
          alt: '네 갈래로 들어오던 요청이 요청 링크 → 요청 양식 → 심사 대기열 → 처리 예정일 → 진행 상황 안내, 한 줄 흐름으로 바뀐다.' },
      ],
    },
    {
      id: 'screens', name: '화면',
      h: '요청 하나가 돌아오기까지',
      p: ['요청 하나가 들어와 처리되고 요청한 사람에게 돌아가기까지, 화면 일곱 개가 이어집니다.'],
      blocks: [
        { type: 'note', label: '들어온다 · 요청 양식', h: '필수 항목을 채워야 보낼 수 있는 양식',
          figs: [F('form', '업무 요청 양식. 유형 기능수정이 선택되어 있고 제목·희망 시점·화면 이름·내용이 채워져 있으며, 파일 두 개가 첨부된 상태로 「요청하기」 버튼이 보인다.',
            '요청 양식: 필요한 내용을 요청하는 쪽에서 채웁니다.', [
              { x: 15, y: 4, w: 70, h: 10, cap: '유형과 제목을 먼저 고릅니다. 무엇을 바꾸는 요청인지가 여기서 정해집니다' },
              { x: 15, y: 16, w: 70, h: 20, cap: '언제까지 필요한지, 어느 화면인지를 고르게 해서 다시 묻지 않습니다' },
              { x: 15, y: 57, w: 70, h: 18, cap: '화면 캡처와 파일을 붙여 말로 설명할 일을 줄입니다' },
            ])] },
        { type: 'note', label: '들어온다 · 대리 등록', h: '전화로 온 요청도 같은 양식으로 들어갑니다',
          p: ['전화로 오거나 직접 찾아온 요청은 담당자가 그 사람 이름으로 대신 남깁니다. 양식을 쓰지 않는 사람이 있어도 요청은 한 곳에 모입니다.'],
          figs: [F('proxy', '요청 대신 등록 화면. 「누구의 요청인가요」에서 최민준(생산팀)이 선택되어 있고, 아래는 요청 양식과 같은 구조로 유형·제목·희망 시점·사유·화면 이름이 채워져 있다.',
            '대리 등록: 담당자가 요청한 사람 이름으로 남기고, 그다음은 똑같이 처리됩니다.')] },
        { type: 'note', label: '처리한다 · 업무 목록', h: '심사를 통과한 요청이 업무가 됩니다',
          p: ['요청한 사람 칸이 있어 누구의 부탁에서 나온 일인지 바로 보입니다. 지연된 것, 오늘 할 것, 기한이 남은 것 순이라 무엇부터 할지 고민하지 않습니다.'],
          figs: [F('tasks', '업무 목록 화면. 오늘·지연·약속임박·완료 같은 필터 칩 아래에 업무 세 건이 유형·상태·프로젝트·요청자·기한과 함께 표로 놓여 있다.',
            '업무 목록: 기한 옆의 "약속"은 요청한 사람과 정한 날짜입니다.')] },
        { type: 'note', label: '처리한다 · 업무 상세', h: '요청 원문이 업무 화면에 붙어 있습니다',
          p: ['원문과 요청한 사람, 희망 날짜가 한 화면에 있어 다른 곳을 찾아볼 일이 없습니다. 요청이 걸린 업무는 지우거나 건너뛸 수 없습니다.'],
          figs: [F('task', '업무 상세 화면. 메모와 처리 내용 아래 「요청 맥락」 블록에 #844 이지우의 요청이 붙어 있고, 완료하면 요청자 화면이 바뀐다는 안내와 약속일 09/19가 적혀 있다.',
            '업무 상세: 약속한 날짜와 요청한 사람이 화면에 항상 붙어 있습니다.')] },
        { type: 'note', label: '돌려준다 · 진행 상황 · 내 요청', h: '요청이 지금 어디쯤인지 요청한 사람이 직접 봅니다',
          p: ['상태가 바뀔 때마다 요청한 사람에게 알림이 갑니다. 같은 팀 요청이 함께 묶이고 비고에 약속한 날짜가 적혀, 목록만 봐도 물어볼 일이 없습니다.'],
          figs: [
            F('status', '요청 진행 상황 화면. 제목 아래 "진행 중 · 9/19까지"가 크게 표시되고, 원본 요청과 담당자 메모, 접수·처리 일정 확정 이력이 차례로 보인다.',
              '진행 상황: "그거 어떻게 됐나요"를 물으러 올 일이 없어졌습니다.'),
            F('mylist', '내 요청 목록. 「품질팀 요청」 아래 진행 중 탭에 요청 두 건이 상태·제목·프로젝트·요청자·접수일·비고와 함께 표로 보인다.',
              '내 요청: 비고에 9/19까지, 9/30까지 적혀 있습니다.'),
          ] },
        { type: 'note', label: '돌려준다 · 업데이트', h: '무엇이 바뀌었는지 요청한 사람에게 돌아갑니다',
          p: ['공개를 눌러야 요청한 사람에게 나갑니다. 담당자가 보는 글과 요청한 사람이 보는 글을 따로 적어, 내부에서 쓰는 말이 그대로 나가지 않습니다.'],
          figs: [F('news', '업데이트 화면. 9/15과 9/11에 공개된 지난 업데이트 두 건이 항목 목록과 「요청자에게 보인 글」과 함께 놓여 있다.',
            '업데이트: 공개 전에는 초안으로 남고, 사람이 다듬어 내보냅니다.')] },
        { type: 'phones', label: '어디서든', h: '자리에 없어도 폰에서 처리합니다',
          p: ['심사 대기 카드가 폰 폭에 맞춰 세로로 서고, 수락·되묻기·보류·병합 버튼이 그대로 있습니다.'],
          figs: [F('mobile', '폰 화면. 심사 대기 두 건이 세로 카드로 서 있고 수락·되묻기·보류·병합 버튼이 그대로 보인다.')],
          caption: '폰 390 × 844: 심사 대기 두 건과 그 아래 업무 목록.' },
      ],
    },
    {
      id: 'before-after', name: 'Before & After',
      h: '요청이 한 곳으로 모였습니다',
      p: ['전화·메신저·메일·방문으로 오던 요청이 한 화면에 카드로 모입니다. 담당자는 올 때마다 대응하지 않고 이 목록을 한 번에 심사합니다.'],
      blocks: [
        { type: 'wipe',
          before: [
            { text: '단가표 양식에 시작일 좀 넣어주세요 급해요', from: '메신저', at: '오전 9:12' },
            { text: '아 그리고 저번에 말한 비품 화면도요', from: '메신저', at: '오전 9:13' },
            { text: '검사 결과 엑셀로 뽑을 수 있게 되나요', from: '메신저', at: '오전 11:40' },
            { text: '[요청] 비품 신청 화면 필수값 추가 부탁드립니다', from: '메일', at: '오전 9:15' },
            { text: '인쇄 여백 → 오늘 중? (전화 2번 옴)', from: '전화', at: '오전 10:03' },
            { text: '단가표 건 어떻게 됐어요?', from: '자리로 찾아옴', at: '오후 2:05' },
          ],
          after: F('queue', 'Por favor, Harry 담당자 대시보드. 심사 대기 목록에 요청 두 건이 카드로 놓여 있다.'),
          caps: ['Before(재현): 메신저·메일·전화·자리 방문으로 흩어진 요청', 'After: 심사 대기 한 곳에 카드로'] },
      ],
    },
  ],
  cta: '지금 어떻게 일하고 있는지, 무엇이 가장 불편한지 알려주세요. 이 프로젝트를 붙여 보내면 무엇을 보고 연락했는지 알 수 있어, 이틀 안에 메일로 답장드립니다.',
};
```

- [ ] **Step 7: index 에 getStudy 를 더한다**

`web/content/index.ts` — 기존 내용을 두고 아래를 더한다(옛 `porFavorHarry` 이름과 겹치지 않게 별칭):

```ts
import { porFavorHarry as pfhStudy } from './studies/por-favor-harry';
import type { Study } from './study-types';

export const studies: Record<string, Study> = { 'por-favor-harry': pfhStudy };
export const getStudy = (slug: string): Study | undefined => studies[slug];
export type { Study, Chapter, Block, Figure, Num } from './study-types';
```

- [ ] **Step 8: 통과를 확인한다**

Run: `cd web && npx playwright test tests/study.spec.ts --project=w1440`
Expected: PASS (5 passed). 전체도 그대로인지: `npx playwright test` → 기존 테스트 모두 통과(옛 화면은 안 건드림).

- [ ] **Step 9: 커밋**

```bash
git add web/content/study-types.ts web/content/figures.ts web/content/validate.ts web/lib/image-size.ts web/content/resolve.ts web/content/studies/por-favor-harry.ts web/content/index.ts web/tests/study.spec.ts
git commit -m "[ADD] web: 상세 콘텐츠 모델(Study) — 장·블록, 그림 크기 읽기, 콘텐츠 규칙 검사

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 문서형 뼈대로 교체 — 표지 · 장 · 끝, 판 구조 삭제

페이지를 새 모델로 바꾼다. 이 작업이 끝나면 표지(대표 화면 포함), 장 네 개의 번호·도입, 끝이 보이고 블록은 아직 `figure`만 그린다. 옛 판 코드와 옛 콘텐츠를 지운다. 핫스팟·와이프 테스트는 그 블록이 생기는 작업 3·6에서 되살린다(`test.fixme`).

**Files:**
- Create: `web/lib/figure-rules.ts`, `web/components/case/grid.module.css`, `web/components/case/type.module.css`, `web/components/case/frame.tsx`, `web/components/case/frame.module.css`, `web/components/case/chapter.tsx`, `web/components/case/chapter.module.css`, `web/components/case/block-view.tsx`, `web/components/case/closing.tsx`, `web/components/case/closing.module.css`, `web/components/case/study-view.tsx`, `web/tests/layout.spec.ts`
- Modify: `web/components/case/cover.tsx`, `web/components/case/cover.module.css`, `web/app/projects/[slug]/page.tsx`, `web/content/index.ts`, `web/content/types.ts`, `web/tests/content.spec.ts`, `web/tests/acceptance.spec.ts`, `web/tests/case-parts.spec.ts`, `web/tests/wipe.spec.ts`, `web/tests/study.spec.ts`
- Delete: `web/components/case/{case-view.tsx,pan.tsx,pan.module.css,screen.tsx,finale.tsx,finale.module.css,dwell.tsx,dwell.module.css,use-dwell.ts,use-fit-pans.ts,use-stations.ts,hooks.ts,morph-diagram.tsx}`, `web/content/cases/por-favor-harry.ts`, `web/tests/dwell.spec.ts`, `web/tests/case-layout.spec.ts`

**Interfaces:**
- Consumes: `Study`, `Figure`, `Block`, `getStudy`, `resolveStudy` (Task 1)
- Produces:
  - `frameMode(w, h, ctx: 'block' | 'phones'): 'plain' | 'long'`, `rowMaxWidth(figs: {w;h}[], gap: number): number`, `FRAME_PAD = 7`
  - `<Frame fig sizes ctx? grow? children?>` — `figure[data-frame][data-w][data-h]` > `div`(틀, position:relative, 테두리 1 + 안쪽 6) > `img` + children. 캡션은 `figcaption`
  - 격자 클래스(`grid.module.css`): `g`, `lab`, `body`, `wide`, `full`, `noteText`, `noteFigs`
  - 글자 클래스(`type.module.css`): `lab`, `h2`, `h3`, `lead`, `p`
  - `<BlockView b>` — 블록 한 개. 이 작업에서는 `figure`만, 나머지는 `null`
  - `<StudyView study project next>`
  - 장 DOM: `section[data-chapter][id]` > 라벨 `[data-chapter-label]`, 블록은 `div[data-block="<type>"]`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`web/tests/layout.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('상세 — 문서형 뼈대', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/por-favor-harry');
    await page.waitForTimeout(600);
  });

  test('장 네 개가 순서대로, 번호 01~04', async ({ page }) => {
    const chs = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-chapter]')].map((c) => ({
      id: c.id, lab: (c.querySelector('[data-chapter-label]')!.textContent ?? '').replace(/\s+/g, ' ').trim(),
    })));
    expect(chs.map((c) => c.id)).toEqual(['problem', 'flow', 'screens', 'before-after']);
    expect(chs.map((c) => c.lab.slice(0, 2))).toEqual(['01', '02', '03', '04']);
  });

  test('판 구조가 남아 있지 않다', async ({ page }) => {
    expect(await page.locator('[data-pan], [data-dwell]').count()).toBe(0);
  });

  test('그림은 원본 픽셀보다 크게 그려지지 않는다', async ({ page }) => {
    const over = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-frame]')]
      .filter((f) => f.querySelector('img')!.getBoundingClientRect().width > Number(f.dataset.w) + 1)
      .map((f) => f.dataset.w));
    expect(over).toEqual([]);
  });

  test('가로 스크롤이 없다', async ({ page }) => {
    const vw = page.viewportSize()!.width;
    expect(await page.evaluate(() => window.innerWidth)).toBe(vw);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test('끝: 문의 버튼과 다음 이야기', async ({ page }) => {
    await expect(page.locator('[data-cta]')).toBeVisible();
    await expect(page.locator('[data-teaser]')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('WHAT I LEARNED');
  });
});
```

`web/tests/study.spec.ts` 끝에 순수 계산 테스트를 더한다:

```ts
import { frameMode, rowMaxWidth } from '../lib/figure-rules';

test('그림 규칙: 세로로 긴 캡처만 창, 폰 칸은 아님', () => {
  expect(frameMode(1280, 800, 'block')).toBe('plain');
  expect(frameMode(1280, 1600, 'block')).toBe('long');
  expect(frameMode(390, 844, 'phones')).toBe('plain');
});

test('그림 규칙: 한 줄의 최대 폭은 가장 낮은 원본 높이에서 정해진다', () => {
  // 1280×800 두 장, 간격 12 → 높이 800 에서 폭 1280 두 장 + 틀 여백 7×2×2 + 간격 12
  expect(rowMaxWidth([{ w: 1280, h: 800 }, { w: 1280, h: 800 }], 12)).toBe(1280 * 2 + 28 + 12);
  // 높이가 낮은 쪽(720)이 상한을 정한다
  expect(rowMaxWidth([{ w: 1280, h: 800 }, { w: 1280, h: 720 }], 12)).toBe(Math.round(720 * (1.6 + 1280 / 720)) + 28 + 12);
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd web && npx playwright test tests/layout.spec.ts tests/study.spec.ts --project=w1440`
Expected: FAIL — `[data-chapter]` 없음, `Cannot find module '../lib/figure-rules'`

- [ ] **Step 3: 그림 규칙·격자·글자를 쓴다**

`web/lib/figure-rules.ts`:

```ts
/** 틀 한쪽 두께: 테두리 1 + 안쪽 여백 6 (frame.module.css .box 와 같아야 한다) */
export const FRAME_PAD = 7;

/** 'long' = 세로가 가로보다 긴 캡처 → 정사각 창 안에서 스크롤(명세 §5-3). 폰 칸은 폰 화면이라 창을 쓰지 않는다 */
export const frameMode = (w: number, h: number, ctx: 'block' | 'phones'): 'plain' | 'long' =>
  ctx === 'block' && h > w ? 'long' : 'plain';

/** 한 줄 높이 맞춤(§5-2)에서 어느 그림도 원본보다 커지지 않는 줄의 최대 폭(§5-4). 줄 높이는 가장 낮은 원본 높이까지 */
export function rowMaxWidth(figs: { w: number; h: number }[], gap: number): number {
  const H = Math.min(...figs.map((f) => f.h));
  const ratios = figs.reduce((a, f) => a + f.w / f.h, 0);
  return Math.round(H * ratios) + figs.length * FRAME_PAD * 2 + gap * (figs.length - 1);
}
```

`web/components/case/grid.module.css`:

```css
/* 상세 격자 — 12칸, 간격 24 (명세 §4.1). 1440 창: 라벨 168 · 본문 648 · 넓게 936 · 여백 주석 글 264 · 그림 840 */
.g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:24px;align-items:start}
.lab{grid-column:1/3}
.body{grid-column:3/10}
.wide{grid-column:3/13}
.full{grid-column:1/13}
.noteText{grid-column:1/4}
.noteFigs{grid-column:4/13}
/* 폰: 한 줄. 칸 지정은 무시되고 위에서 아래로 쌓인다 */
@media (max-width:1023px){ .g{display:block} }
```

`web/components/case/type.module.css`:

```css
/* 글자 — docs/14 §3.1 크기 단계 */
.lab{font-size:13px;font-weight:600;letter-spacing:.04em;line-height:1.5;color:var(--navy-800);font-variant-numeric:tabular-nums}
.lab i{font-style:normal;font-weight:500;color:var(--bone-500)}
.h2{font-size:clamp(30px,2.8vw,40px);font-weight:600;letter-spacing:-.025em;line-height:1.15;margin:0 0 16px;word-break:keep-all}
.h3{font-size:clamp(21px,1.7vw,24px);font-weight:600;letter-spacing:-.02em;line-height:1.25;margin:8px 0 10px;word-break:keep-all}
.lead{font-size:clamp(17px,1.3vw,19px);line-height:1.6;color:var(--bone-700);margin:0 0 14px;max-width:34rem;word-break:keep-all}
.p{font-size:16px;line-height:1.7;color:var(--bone-700);margin:0 0 12px;word-break:keep-all}
.lead:last-child,.p:last-child{margin-bottom:0}
```

- [ ] **Step 4: 그림 틀을 쓴다**

`web/components/case/frame.module.css`:

```css
/* 그림 한 장의 틀 — 테두리 1 + 안쪽 여백 6 (lib/figure-rules FRAME_PAD 와 같게). 핫스팟 좌표도 이 틀 기준 */
.fig{margin:0;min-width:0}
.box{position:relative;background:var(--bone-0);border:1px solid var(--bone-900);padding:6px;box-sizing:border-box;overflow:hidden}
.img{display:block;width:100%;height:100%;object-fit:cover;object-position:top left}
/* 세로로 긴 캡처: 정사각 창 안에서 스크롤, 아래를 흐리게 (명세 §5-3) */
.long{aspect-ratio:1;overflow-y:auto}
.long .img{height:auto}
.long::after{content:"";position:sticky;display:block;bottom:0;height:48px;margin-top:-48px;background:linear-gradient(transparent,var(--bone-0));pointer-events:none}
.cap{margin-top:8px;font-size:13px;line-height:1.5;color:var(--bone-500)}
/* 폰: 스크롤 안의 스크롤은 손가락에 불편 — 긴 캡처도 전체를 보인다 */
@media (max-width:1023px){ .long{aspect-ratio:auto;overflow:visible} .long::after{display:none} }
```

`web/components/case/frame.tsx`:

```tsx
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Figure } from '@/content';
import { FRAME_PAD, frameMode } from '@/lib/figure-rules';
import s from './frame.module.css';

/** 그림 한 장. 폭은 부모 칸이 정하고 원본 픽셀보다 커지지 않는다(§5-4). grow = 한 줄 높이 맞춤의 한 칸(§5-2) */
export function Frame({ fig, sizes, ctx = 'block', grow = false, children }: {
  fig: Figure; sizes: string; ctx?: 'block' | 'phones'; grow?: boolean; children?: ReactNode;
}) {
  const w = fig.w, h = fig.h;
  if (!w || !h) throw new Error(`그림 크기가 없습니다(resolveStudy 를 거치지 않음): ${fig.src}`);
  const long = frameMode(w, h, ctx) === 'long';
  return (
    <figure className={s.fig} data-frame data-w={w} data-h={h}
            style={grow ? { flex: `${w / h} 1 0` } : { maxWidth: w + FRAME_PAD * 2 }}>
      <div className={`${s.box} ${long ? s.long : ''}`} style={long ? undefined : { aspectRatio: `${w + 12} / ${h + 12}` }}>
        <Image src={fig.src} alt={fig.alt} width={w} height={h} sizes={sizes} className={s.img} />
        {children}
      </div>
      {fig.caption ? <figcaption className={s.cap}>{fig.caption}</figcaption> : null}
    </figure>
  );
}
```

- [ ] **Step 5: 표지를 고친다**

`web/components/case/cover.tsx` 전체 교체:

```tsx
import type { Project, Study } from '@/content';
import { Frame } from './frame';
import s from './cover.module.css';

export function Cover({ study, project }: { study: Study; project: Project }) {
  const c = study.cover;
  return (
    <section className={s.cover} data-cover>
      <div className={s.title} data-cover-title>
        <div>
          <span className={s.cap}>Prologue &amp; {project.title} · {c.cap}</span>
          <h1 className={s.h1} data-title dangerouslySetInnerHTML={{ __html: c.title }} />
          {c.summary.map((t, i) => <p key={i} className={s.summary}>{t}</p>)}
          <table className={s.meta}>
            <tbody>
              {c.meta.map(([k, v]) => <tr key={k} data-meta-row><td>{k}</td><td>{v}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className={s.nums}>
          {c.numbers.map((n) => (
            <div key={n.label} data-num><b>{n.value}</b><span>{n.label}</span>{n.small ? <small>{n.small}</small> : null}</div>
          ))}
        </div>
      </div>
      <div className={s.hero}>
        <Frame fig={c.hero} sizes="(max-width:1023px) 100vw, 1616px" />
      </div>
    </section>
  );
}
```

`web/components/case/cover.module.css` — 첫 줄 앞에 두 규칙을 더하고, `.meta` 앞에 `.summary`를 더한다(나머지 규칙은 그대로):

```css
.cover{padding-top:clamp(96px,11vh,128px)}
.hero{margin-top:56px}
```

```css
.summary{font-size:clamp(17px,1.3vw,19px);line-height:1.6;color:var(--bone-700);margin:16px 0 0;max-width:34rem;word-break:keep-all}
```

그리고 파일 끝 폰 규칙에 `.cover{padding-top:88px} .hero{margin-top:32px}`를 더한다:

```css
@media (max-width:1023px){ .title,.nums{grid-template-columns:1fr;gap:24px} .h1{font-size:34px} .cover{padding-top:88px} .hero{margin-top:32px} }
```

- [ ] **Step 6: 장·블록 분기를 쓴다**

`web/components/case/chapter.module.css`:

```css
/* 장 — 섹션 간격 128(폰 80), 시작 괘선 bone-200 1px (docs/14 §3.2·3.3). 장 링크로 들어오면 헤더(64) 아래 24 */
.ch{margin-top:128px;scroll-margin-top:88px}
.intro{border-top:1px solid var(--bone-200);padding-top:16px}
.name{display:block}
.block{margin-top:72px}
.intro + .block{margin-top:48px}
@media (max-width:1023px){
  .ch{margin-top:80px}
  .name{display:inline;margin-left:.5em}
  .intro [data-chapter-label]{margin-bottom:8px}
  .block{margin-top:56px}
  .intro + .block{margin-top:32px}
}
```

`web/components/case/block-view.tsx`:

```tsx
import type { Block } from '@/content';
import { Frame } from './frame';
import g from './grid.module.css';

/** 블록 한 개. 종류가 늘면 case 를 더한다 */
export function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case 'figure':
      return (
        <div className={g.g}>
          <div className={b.slot === 'wide' ? g.wide : g.body}>
            <Frame fig={b.fig} sizes={b.slot === 'wide' ? '(max-width:1023px) 100vw, 1343px' : '(max-width:1023px) 100vw, 900px'} />
          </div>
        </div>
      );
    default:
      return null;
  }
}
```

`web/components/case/chapter.tsx`:

```tsx
import type { Chapter as ChapterData } from '@/content';
import { BlockView } from './block-view';
import g from './grid.module.css';
import t from './type.module.css';
import s from './chapter.module.css';

export function Chapter({ ch, n }: { ch: ChapterData; n: number }) {
  return (
    <section id={ch.id} className={s.ch} data-chapter>
      <div className={`${g.g} ${s.intro}`}>
        <div className={`${g.lab} ${t.lab}`} data-chapter-label>
          {String(n).padStart(2, '0')}<span className={s.name}>{ch.name}</span>
        </div>
        <div className={g.body}>
          <h2 className={t.h2} dangerouslySetInnerHTML={{ __html: ch.h }} />
          {ch.p.map((x, i) => <p key={i} className={t.lead}>{x}</p>)}
        </div>
      </div>
      {ch.blocks.map((b, i) => (
        <div key={i} className={s.block} data-block={b.type}><BlockView b={b} /></div>
      ))}
    </section>
  );
}
```

- [ ] **Step 7: 끝과 조립을 쓴다**

`web/components/case/closing.module.css`:

```css
/* 끝 — Built with 한 줄 → 문의 → 다음 이야기 (명세 §4.2) */
.closing{margin-top:160px;padding-bottom:40px}
.built{font-size:13px;color:var(--bone-500);margin:0 0 20px}
.cta{display:flex;align-items:center;gap:16px;margin-top:24px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 22px;background:var(--navy-800);color:#fff;border:0;border-radius:2px;font:inherit;font-size:15px;font-weight:500;cursor:pointer}
.btn:hover{background:var(--navy-700)}
.tri{width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:8px solid currentColor}
.mail{color:var(--navy-800);font-weight:500}
.teaser{margin-top:96px;border-top:1px solid var(--bone-200);padding-top:24px;display:flex;justify-content:space-between;align-items:center;gap:48px;color:inherit}
.cap{display:block;font-size:13px;color:var(--bone-500);margin-bottom:6px}
.big{font-size:clamp(28px,2.2vw,40px);font-weight:600;letter-spacing:-.02em;display:block;margin-bottom:8px}
.tag{font-size:16px;line-height:1.7;color:var(--bone-700);margin:0}
.teaser:hover .big{color:var(--navy-800)}
.teaserImg{flex:none;width:320px;height:200px;object-fit:cover;border:1px solid var(--bone-300);background:var(--bone-0)}
@media (max-width:1023px){ .closing{margin-top:96px} .teaser{flex-direction:column;align-items:flex-start;gap:24px;margin-top:64px} .teaserImg{width:100%;height:auto} }
```

`web/components/case/closing.tsx`:

```tsx
import Image from 'next/image';
import { ViewTransitionLink } from '../view-transition-link';
import { COVERS, type Project, type Study } from '@/content';
import g from './grid.module.css';
import t from './type.module.css';
import s from './closing.module.css';

export function Closing({ study, next, slug }: { study: Study; next?: Project; slug: string }) {
  return (
    <section className={s.closing} data-closing>
      <div className={g.g}>
        <div className={g.body}>
          {study.builtWith?.length ? <p className={s.built}>Built with · {study.builtWith.join(' · ')}</p> : null}
          <h2 className={t.h2}>비슷한 문제가 있다면</h2>
          <p className={t.lead}>{study.cta}</p>
          <div className={s.cta}>
            <button type="button" data-cta data-open-drawer data-project={slug} className={s.btn}>
              이 프로젝트를 보고 문의하기 <i className={s.tri} aria-hidden />
            </button>
            <a href="mailto:PrologueAnd@gmail.com" className={s.mail}>PrologueAnd@gmail.com</a>
          </div>
        </div>
      </div>
      {next ? (
        <ViewTransitionLink className={s.teaser} data-teaser href={`/projects/${next.slug}`} vtType="to-case">
          <div>
            <span className={s.cap}>다음 이야기</span>
            <span className={s.big}>{next.title}</span>
            <p className={s.tag}>{next.tagline}</p>
          </div>
          {COVERS.has(next.slug) ? (
            <Image src={`/screens/covers/${next.slug}.png`} alt="" width={512} height={320} className={s.teaserImg} />
          ) : null}
        </ViewTransitionLink>
      ) : (
        <a className={s.teaser} data-teaser href="/projects">
          <div>
            <span className={s.cap}>다음 이야기</span>
            <span className={s.big}>Projects</span>
            <p className={s.tag}>나머지 작업은 정리하는 대로 올립니다.</p>
          </div>
        </a>
      )}
    </section>
  );
}
```

`web/components/case/study-view.tsx`:

```tsx
import type { Project, Study } from '@/content';
import { Cover } from './cover';
import { Chapter } from './chapter';
import { Closing } from './closing';

export function StudyView({ study, project, next }: { study: Study; project: Project; next?: Project }) {
  return (
    <main className="wrap">
      <Cover study={study} project={project} />
      {study.chapters.map((ch, i) => <Chapter key={ch.id} ch={ch} n={i + 1} />)}
      <Closing study={study} next={next} slug={project.slug} />
    </main>
  );
}
```

- [ ] **Step 8: 페이지와 콘텐츠 색인을 바꾸고 옛 코드를 지운다**

`web/app/projects/[slug]/page.tsx` 전체 교체:

```tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { StudyView } from '@/components/case/study-view';
import { getProject, getStudy, nextProject, publishedProjects } from '@/content';
import { resolveStudy } from '@/content/resolve';

export function generateStaticParams() {
  return publishedProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  return { title: p?.title ?? 'Projects', description: p?.tagline };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  const study = project ? getStudy(slug) : undefined;
  if (!project || !project.published || !study) redirect('/projects');
  return (
    <>
      <Header variant="case" title={project.title} project={project.slug} />
      <StudyView study={resolveStudy(study)} project={project} next={nextProject(slug)} />
    </>
  );
}
```

`web/content/index.ts` 전체 교체:

```ts
import { projects, PROBLEM_NAME, COVERS } from './projects';
import { porFavorHarry } from './studies/por-favor-harry';
import type { Project } from './types';
import type { Study } from './study-types';

export const studies: Record<string, Study> = { 'por-favor-harry': porFavorHarry };
export const allProjects = (): Project[] => [...projects].sort((a, b) => a.order - b.order);
export const publishedProjects = (): Project[] => allProjects().filter((p) => p.published);
export const getProject = (slug: string): Project | undefined => projects.find((p) => p.slug === slug);
export const getStudy = (slug: string): Study | undefined => studies[slug];
export const nextProject = (slug: string): Project | undefined =>
  publishedProjects().filter((p) => p.slug !== slug)[0];
export { PROBLEM_NAME, COVERS };
export type { Project, Spot, Scatter } from './types';
export type { Study, Chapter, Block, Figure, Num, NoteBlock, PhonesBlock, FlowBlock, QuoteBlock, WipeBlock, FigureBlock } from './study-types';
```

`web/content/types.ts` — `Pic`과 `Case` 타입을 지운다(`Scatter`, `Spot`, `Project`만 남김).

옛 파일을 지운다:

```bash
cd web
git rm components/case/case-view.tsx components/case/pan.tsx components/case/pan.module.css components/case/screen.tsx components/case/finale.tsx components/case/finale.module.css components/case/dwell.tsx components/case/dwell.module.css components/case/use-dwell.ts components/case/use-fit-pans.ts components/case/use-stations.ts components/case/hooks.ts components/case/morph-diagram.tsx content/cases/por-favor-harry.ts tests/dwell.spec.ts tests/case-layout.spec.ts
```

- [ ] **Step 9: 옛 판 구조를 재던 테스트를 정리한다**

`web/tests/content.spec.ts` — `getCase`를 쓰던 두 테스트를 바꾼다:

```ts
import { test, expect } from '@playwright/test';
import { allProjects, publishedProjects, getStudy, nextProject } from '../content';

test('프로젝트는 6건이고 공개는 Por favor, Harry 한 건', () => {
  expect(allProjects()).toHaveLength(6);
  expect(publishedProjects().map((p) => p.slug)).toEqual(['por-favor-harry']);
});

test('공개된 상세만 Study 데이터가 있다', () => {
  expect(getStudy('por-favor-harry')).toBeTruthy();
  expect(getStudy('custom-commerce')).toBeUndefined();
});

test('다음 이야기는 자기 자신이 아니다', () => {
  expect(nextProject('por-favor-harry')?.slug).not.toBe('por-favor-harry');
});
```

`web/tests/acceptance.spec.ts` — `test.describe('상세 수용 기준')` 안에서 `V1 판 넘침 0`, `V1-b`, `V2-a`, `V2-b`를 지우고, 파일 아래의 `V9 모션 줄이기…` 테스트와 `test.describe('해시로 들어오면 정거장에 선다 …')` 블록 전체를 지운다. `V5`, `V7`만 남는다. 쓰이지 않게 된 `import { scrollToY } from './helpers';`도 지운다.

`web/tests/case-parts.spec.ts` — 핫스팟 두 테스트의 `test(`를 `test.fixme(`로 바꾸고 바로 위에 주석 `// 작업 3(여백 주석)에서 되살린다`를 단다. 나머지 두 테스트는 그대로.

`web/tests/wipe.spec.ts` — 세 테스트의 `test(`를 `test.fixme(`로 바꾸고 파일 맨 위(import 아래)에 주석 `// 작업 6(와이프)에서 새 구조로 다시 쓴다`를 단다.

- [ ] **Step 10: 통과를 확인한다**

Run: `cd web && node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
Expected: 오류 없음

Run: `cd web && npx playwright test`
Expected: 모두 PASS (fixme 는 skipped 로 셈). 새 `layout.spec`의 다섯 테스트가 네 뷰포트에서 통과.

- [ ] **Step 11: 커밋**

```bash
cd web
git add lib/figure-rules.ts components/case/grid.module.css components/case/type.module.css components/case/frame.tsx components/case/frame.module.css components/case/cover.tsx components/case/cover.module.css components/case/chapter.tsx components/case/chapter.module.css components/case/block-view.tsx components/case/closing.tsx components/case/closing.module.css components/case/study-view.tsx "app/projects/[slug]/page.tsx" content/index.ts content/types.ts tests/layout.spec.ts tests/study.spec.ts tests/content.spec.ts tests/acceptance.spec.ts tests/case-parts.spec.ts tests/wipe.spec.ts
git commit -m "[MOD] web: 상세를 문서형 뼈대로 교체 — 표지·장·끝, 판 구조 삭제

- 판 엔진(정거장·머무름·그림 크기 맞추기)과 옛 Case 콘텐츠 삭제
- 12칸 격자, 그림 틀(원본 상한·긴 캡처 창), 장 번호 자동
- 핫스팟·와이프 테스트는 작업 3·6에서 되살림(fixme)

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 여백 주석 블록 — 한 줄 높이 맞춤, 핫스팟

**Files:**
- Create: `web/components/case/row.tsx`, `web/components/case/row.module.css`, `web/components/case/note.tsx`, `web/components/case/note.module.css`
- Modify: `web/components/case/block-view.tsx`, `web/components/case/hotspots.module.css`, `web/tests/case-parts.spec.ts`, `web/tests/layout.spec.ts`

**Interfaces:**
- Consumes: `Frame`, `rowMaxWidth`, `FRAME_PAD`, 격자·글자 클래스(Task 2), `NoteBlock`(Task 1), `SpotList`·`SpotOverlay`(기존 `hotspots.tsx`)
- Produces:
  - `<Row figs sizes ctx? overlay?>` — `div[data-row-figs]`. 그림 1장이면 그 틀, 2~3장이면 한 줄 높이 맞춤. `overlay`는 첫 그림 틀 안에 들어간다
  - `<Note b>` — `NoteBlock` 렌더(클라이언트)
  - `NoteText({ label, h, p, children })` — 라벨·제목·문단(폰 칸도 씀, Task 4)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`web/tests/layout.spec.ts`의 describe 안에 더한다:

```ts
  test('여백 주석의 한 장 그림은 모두 같은 폭', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 — 폰은 모두 전폭');
    const ws = await page.evaluate(() => [...document.querySelectorAll('[data-block="note"]')]
      .map((n) => [...n.querySelectorAll<HTMLElement>('[data-frame]')])
      .filter((fs) => fs.length === 1)
      .map((fs) => Math.round(fs[0].getBoundingClientRect().width)));
    expect(ws.length).toBe(5);
    expect(Math.max(...ws) - Math.min(...ws)).toBeLessThanOrEqual(1);
  });

  test('두 장 한 줄은 높이가 같고 칸을 넘지 않는다', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 — 폰은 세로로 쌓는다');
    const r = await page.evaluate(() => {
      const n = [...document.querySelectorAll('[data-block="note"]')].find((x) => x.querySelectorAll('[data-frame]').length === 2)!;
      const boxes = [...n.querySelectorAll<HTMLElement>('[data-frame] > div')].map((b) => b.getBoundingClientRect());
      const col = n.querySelector<HTMLElement>('[data-row-figs]')!.parentElement!.getBoundingClientRect();
      return { h: boxes.map((b) => b.height), right: Math.max(...boxes.map((b) => b.right)), colRight: col.right };
    });
    expect(Math.abs(r.h[0] - r.h[1])).toBeLessThanOrEqual(1);
    expect(r.right).toBeLessThanOrEqual(r.colRight + 1);
  });

  test('여백 주석 글은 그림 왼쪽 칸에 있다', async ({ page, isMobile }) => {
    test.skip(!!isMobile, '데스크톱 — 폰은 글이 그림 위');
    const r = await page.evaluate(() => {
      const n = document.querySelectorAll('[data-block="note"]')[1];
      const text = n.querySelector<HTMLElement>('[data-note-text]')!.getBoundingClientRect();
      const fig = n.querySelector<HTMLElement>('[data-frame]')!.getBoundingClientRect();
      return { textRight: text.right, figLeft: fig.left, top: Math.abs(text.top - fig.top) };
    });
    expect(r.textRight).toBeLessThanOrEqual(r.figLeft);
    expect(r.top).toBeLessThanOrEqual(24);
  });

  test('폰: 여백 주석은 글이 위, 두 장은 세로로 쌓인다', async ({ page, isMobile }) => {
    test.skip(!isMobile, '폰 전용');
    const r = await page.evaluate(() => {
      const n = [...document.querySelectorAll('[data-block="note"]')].find((x) => x.querySelectorAll('[data-frame]').length === 2)!;
      const text = n.querySelector<HTMLElement>('[data-note-text]')!.getBoundingClientRect();
      const [a, b] = [...n.querySelectorAll<HTMLElement>('[data-frame]')].map((f) => f.getBoundingClientRect());
      return { textBottom: text.bottom, aTop: a.top, aBottom: a.bottom, bTop: b.top, aw: a.width, bw: b.width };
    });
    expect(r.aTop).toBeGreaterThanOrEqual(r.textBottom);
    expect(r.bTop).toBeGreaterThanOrEqual(r.aBottom);
    expect(Math.abs(r.aw - r.bw)).toBeLessThanOrEqual(1);
  });
```

`web/tests/case-parts.spec.ts` — 두 핫스팟 테스트를 `test(`로 되돌리고 주석을 지운다. 첫 핫스팟 테스트에서 `#s06` 정거장으로 가던 두 줄을 여백 주석으로 가게 바꾼다:

```ts
  await scrollToY(page, await page.evaluate(() =>
    document.querySelector('[data-block="note"]:has([data-spot])')!.getBoundingClientRect().top + window.scrollY - 100));
```

(그 위 주석의 "s06 정거장(판 위 − 64)에 서고"는 "핫스팟이 있는 여백 주석으로 옮기고"로 고친다.)

- [ ] **Step 2: 실패를 확인한다**

Run: `cd web && npx playwright test tests/layout.spec.ts tests/case-parts.spec.ts --project=w1440`
Expected: FAIL — `ws.length` 0, `[data-spot="1"]` 없음

- [ ] **Step 3: 한 줄과 여백 주석을 쓴다**

`web/components/case/row.module.css`:

```css
/* 한 줄 높이 맞춤 (명세 §5-2): 각 그림이 자기 비율만큼 폭을 나눠 높이가 같아진다(frame 의 flex: 비율 1 0) */
.row{display:flex;gap:12px;align-items:flex-start}
/* 폰: 나란히 두면 한 장이 170px 라 읽히지 않는다 — 세로로 쌓는다 */
@media (max-width:1023px){
  .row{flex-direction:column;gap:16px;max-width:none!important}
  .row > *{flex:none!important;width:100%;max-width:none!important}
}
```

`web/components/case/row.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { Figure } from '@/content';
import { rowMaxWidth } from '@/lib/figure-rules';
import { Frame } from './frame';
import s from './row.module.css';

const GAP = 12;   // row.module.css .row gap 과 같게

/** 그림 1~3장. 1장이면 틀 하나, 여러 장이면 한 줄 높이 맞춤. overlay 는 첫 그림 틀 안(핫스팟) */
export function Row({ figs, sizes, ctx = 'block', overlay }: {
  figs: Figure[]; sizes: string; ctx?: 'block' | 'phones'; overlay?: ReactNode;
}) {
  const many = figs.length > 1;
  const maxWidth = many ? rowMaxWidth(figs.map((f) => ({ w: f.w!, h: f.h! })), GAP) : undefined;
  return (
    <div className={s.row} data-row-figs style={maxWidth ? { maxWidth } : undefined}>
      {figs.map((f, i) => (
        <Frame key={f.src + i} fig={f} sizes={sizes} ctx={ctx} grow={many}>{i === 0 ? overlay : null}</Frame>
      ))}
    </div>
  );
}
```

`web/components/case/note.module.css`:

```css
/* 여백 주석 — 글은 왼쪽 3칸, 그림은 오른쪽 9칸 (명세 §4.3). 폰은 글이 위 */
.text{padding-top:2px}
@media (max-width:1023px){ .figs{margin-top:20px} }
```

`web/components/case/note.tsx`:

```tsx
'use client';
import { useState, type ReactNode } from 'react';
import type { NoteBlock } from '@/content';
import { Row } from './row';
import { SpotList, SpotOverlay } from './hotspots';
import g from './grid.module.css';
import t from './type.module.css';
import s from './note.module.css';

/** 여백 주석 글: 라벨(앞부분 굵게, " · " 뒤는 흐리게) · 제목 · 문단. 폰 칸(phones.tsx)도 쓴다 */
export function NoteText({ label, h, p, children }: { label?: string; h?: string; p?: string[]; children?: ReactNode }) {
  const [head, ...rest] = (label ?? '').split(' · ');
  return (
    <>
      {label ? <div className={t.lab}>{head}{rest.length ? <i> · {rest.join(' · ')}</i> : null}</div> : null}
      {h ? <h3 className={t.h3} dangerouslySetInnerHTML={{ __html: h }} /> : null}
      {p?.map((x, i) => <p key={i} className={t.p}>{x}</p>)}
      {children}
    </>
  );
}

export function Note({ b }: { b: NoteBlock }) {
  const [spot, setSpot] = useState(-1);
  const spots = b.figs[0].spots ?? [];
  return (
    <div className={g.g}>
      <div className={`${g.noteText} ${s.text}`} data-note-text>
        <NoteText label={b.label} h={b.h} p={b.p}>
          {spots.length ? <SpotList spots={spots} active={spot} onHover={setSpot} /> : null}
        </NoteText>
      </div>
      <div className={`${g.noteFigs} ${s.figs}`}>
        <Row figs={b.figs} sizes="(max-width:1023px) 100vw, 1230px"
             overlay={spots.length ? <SpotOverlay spots={spots} active={spot} /> : undefined} />
      </div>
    </div>
  );
}
```

`web/components/case/hotspots.module.css` — 목록은 이제 좁은 여백 칸에 서므로 늘 세로. 첫 줄을 바꾸고 폰 규칙을 지운다:

```css
.spots{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
```

(`@media (max-width:1023px){ .spots{flex-direction:column} }` 줄 삭제, 낮은 창 규칙의 `.spots{gap:6px;margin-top:10px}`는 그대로.)

`web/components/case/block-view.tsx` — import 와 case 를 더한다:

```tsx
import { Note } from './note';
```

```tsx
    case 'note':
      return <Note b={b} />;
```

- [ ] **Step 4: 통과를 확인한다**

Run: `cd web && npx playwright test tests/layout.spec.ts tests/case-parts.spec.ts`
Expected: PASS (네 뷰포트, 폰 전용·데스크톱 전용은 skip)

- [ ] **Step 5: 커밋**

```bash
cd web
git add components/case/row.tsx components/case/row.module.css components/case/note.tsx components/case/note.module.css components/case/block-view.tsx components/case/hotspots.module.css tests/layout.spec.ts tests/case-parts.spec.ts
git commit -m "[ADD] web: 여백 주석 블록 — 한 줄 높이 맞춤, 핫스팟

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 폰 칸 · 통찰 한 문장

**Files:**
- Create: `web/components/case/phones.tsx`, `web/components/case/phones.module.css`, `web/components/case/quote.tsx`, `web/components/case/quote.module.css`
- Modify: `web/components/case/block-view.tsx`, `web/tests/layout.spec.ts`

**Interfaces:**
- Consumes: `NoteText`(Task 3), `Frame`(Task 2), `PhonesBlock`·`QuoteBlock`(Task 1)
- Produces: `<Phones b>`, `<Quote b>`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`web/tests/layout.spec.ts` describe 안에 더한다:

```ts
  test('폰 칸: 창 없이 원래 비율, 높이 640 이하', async ({ page }) => {
    const r = await page.evaluate(() => {
      const box = document.querySelector<HTMLElement>('[data-block="phones"] [data-frame] > div')!;
      const b = box.getBoundingClientRect();
      return { w: b.width, h: b.height, sh: box.scrollHeight, ch: box.clientHeight };
    });
    expect(r.h).toBeLessThanOrEqual(641);
    expect(Math.abs(r.w / r.h - (390 + 12) / (844 + 12))).toBeLessThan(0.02);
    expect(r.sh).toBeLessThanOrEqual(r.ch + 1);   // 안에서 스크롤하지 않는다
  });

  test('폰: 폰 칸 한 장은 띠 폭의 60%', async ({ page, isMobile }) => {
    test.skip(!isMobile, '폰 전용');
    const r = await page.evaluate(() => {
      const band = document.querySelector<HTMLElement>('[data-phones-band]')!;
      const cs = getComputedStyle(band);
      const inner = band.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return document.querySelector<HTMLElement>('[data-block="phones"] [data-frame]')!.getBoundingClientRect().width / inner;
    });
    expect(r).toBeGreaterThan(0.57);
    expect(r).toBeLessThan(0.63);
  });

  test('통찰 한 문장이 01 장 안에 있다', async ({ page }) => {
    await expect(page.locator('#problem [data-block="quote"] blockquote')).toContainText('요청이 들어오는 길의 문제였습니다');
  });
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd web && npx playwright test tests/layout.spec.ts --project=w1440`
Expected: FAIL — `[data-block="phones"] [data-frame]` 없음(null 참조)

- [ ] **Step 3: 폰 칸과 통찰 한 문장을 쓴다**

`web/components/case/phones.module.css`:

```css
/* 폰 칸 — 회색 띠 위, 높이는 640 과 원본 높이 중 작은 쪽, 1~3장 가운데 (명세 §4.3·§8) */
.band{background:var(--bone-100);padding:40px 32px}
.row{display:flex;gap:24px;justify-content:center;align-items:flex-start}
.one{flex:none}
.cap{margin:12px 0 0;font-size:13px;line-height:1.5;color:var(--bone-500);text-align:center}
@media (max-width:1023px){
  .band{margin-top:20px;padding:24px 16px}
  .one{width:60%!important}
  .row:has(.one + .one) .one{flex:1;width:auto!important}
}
```

`web/components/case/phones.tsx`:

```tsx
import type { PhonesBlock } from '@/content';
import { Frame } from './frame';
import { NoteText } from './note';
import g from './grid.module.css';
import s from './phones.module.css';

export function Phones({ b }: { b: PhonesBlock }) {
  return (
    <div className={g.g}>
      <div className={g.noteText} data-note-text>
        <NoteText label={b.label} h={b.h} p={b.p} />
      </div>
      <div className={`${g.noteFigs} ${s.band}`} data-phones-band>
        <div className={s.row}>
          {b.figs.map((f, i) => (
            // 높이 = min(640, 원본 높이) → 폭 = 높이 × 비율
            <div key={f.src + i} className={s.one} style={{ width: `calc(min(640px, ${f.h}px) * ${f.w! / f.h!})` }}>
              <Frame fig={f} ctx="phones" sizes="(max-width:1023px) 60vw, 320px" />
            </div>
          ))}
        </div>
        {b.caption ? <p className={s.cap}>{b.caption}</p> : null}
      </div>
    </div>
  );
}
```

`web/components/case/quote.module.css`:

```css
/* 통찰 한 문장 — 크게, 강조는 색만 (docs/14 §3.1) */
.q{margin:0}
.text{font-size:clamp(26px,2.4vw,36px);font-weight:600;letter-spacing:-.025em;line-height:1.3;color:var(--navy-800);margin:0 0 14px;word-break:keep-all}
@media (max-width:1023px){ .text{font-size:24px} }
```

`web/components/case/quote.tsx`:

```tsx
import type { QuoteBlock } from '@/content';
import g from './grid.module.css';
import t from './type.module.css';
import s from './quote.module.css';

export function Quote({ b }: { b: QuoteBlock }) {
  return (
    <div className={g.g}>
      <blockquote className={`${g.wide} ${s.q}`}>
        <p className={s.text}>{b.text}</p>
        {b.p ? <p className={t.p}>{b.p}</p> : null}
      </blockquote>
    </div>
  );
}
```

`web/components/case/block-view.tsx`:

```tsx
import { Phones } from './phones';
import { Quote } from './quote';
```

```tsx
    case 'phones':
      return <Phones b={b} />;
    case 'quote':
      return <Quote b={b} />;
```

- [ ] **Step 4: 통과를 확인한다**

Run: `cd web && npx playwright test tests/layout.spec.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
cd web
git add components/case/phones.tsx components/case/phones.module.css components/case/quote.tsx components/case/quote.module.css components/case/block-view.tsx tests/layout.spec.ts
git commit -m "[ADD] web: 폰 칸·통찰 한 문장 블록

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 흐름 다이어그램 — 문구를 데이터로, 지나가며 바뀜

옛 `morph-diagram.tsx`(작업 2에서 지움)의 그림을 그대로 옮기되, 갈래·단계 문구와 개수를 데이터에서 받는다. 화면에 붙이지 않고, 그림이 화면을 지나가는 동안 t가 0 → 1.

**Files:**
- Create: `web/components/case/use-scroll-progress.ts`, `web/components/case/flow.tsx`, `web/components/case/flow.module.css`, `web/tests/flow.spec.ts`
- Modify: `web/components/case/block-view.tsx`

**Interfaces:**
- Consumes: `FlowBlock`(Task 1), 격자 클래스(Task 2), `scrollToY`(`tests/helpers.ts`)
- Produces:
  - `useScrollProgress(ref, calc: (r: DOMRect, vh: number) => number, fixed?: number): number` — `calc`는 **모듈 수준 함수**로 넘긴다(렌더마다 새로 만들면 효과가 다시 돈다)
  - `useReducedMotion(): boolean`
  - `<Flow b>` — `figure[data-flow][data-t="0.000"]`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`web/tests/flow.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

const t = (page: import('@playwright/test').Page, sel: string) =>
  page.evaluate((s) => Number(document.querySelector<HTMLElement>(`${s} [data-flow]`)!.dataset.t), sel);

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
});

test('01 은 정지 상태(t=0)', async ({ page }) => {
  await scrollToY(page, await page.evaluate(() => document.getElementById('problem')!.getBoundingClientRect().top + window.scrollY));
  expect(await t(page, '#problem')).toBe(0);
});

test('02 는 지나가며 0 → 1: 윗변이 화면 85% 에서 0, 가운데가 40% 에서 1', async ({ page }) => {
  const y = (k: number) => page.evaluate((k) => {
    const f = document.querySelector<HTMLElement>('#flow [data-flow]')!;
    const r = f.getBoundingClientRect(), top = r.top + window.scrollY, vh = window.innerHeight;
    const s0 = top - 0.85 * vh, s1 = top + r.height / 2 - 0.4 * vh;
    return s0 + (s1 - s0) * k;
  }, k);
  await scrollToY(page, (await y(0)) - 20);
  expect(await t(page, '#flow')).toBe(0);
  await scrollToY(page, await y(0.5));
  const mid = await t(page, '#flow');
  expect(mid).toBeGreaterThan(0.4);
  expect(mid).toBeLessThan(0.6);
  await scrollToY(page, (await y(1)) + 20);
  expect(await t(page, '#flow')).toBe(1);
});

test('문구는 데이터에서, 그림 설명이 붙는다', async ({ page }) => {
  const r = await page.evaluate(() => {
    const svg = document.querySelector('#flow [data-flow] svg')!;
    return { text: svg.textContent, label: svg.getAttribute('aria-label'), role: svg.getAttribute('role') };
  });
  expect(r.text).toContain('직접 방문');
  expect(r.text).toContain('진행 상황 안내');
  expect(r.role).toBe('img');
  expect(r.label).toContain('한 줄 흐름');
});

test('색은 토큰만', async ({ page }) => {
  expect(await page.evaluate(() => document.querySelector('#flow [data-flow] svg')!.innerHTML.includes('#8A96C2'))).toBe(false);
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd web && npx playwright test tests/flow.spec.ts --project=w1440`
Expected: FAIL — `[data-flow]` 없음

- [ ] **Step 3: 스크롤 진행률 훅을 쓴다**

`web/components/case/use-scroll-progress.ts`:

```ts
'use client';
import { useEffect, useState, type RefObject } from 'react';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 모션 줄이기 설정 */
export function useReducedMotion(): boolean {
  const [r, setR] = useState(false);
  useEffect(() => { setR(window.matchMedia('(prefers-reduced-motion:reduce)').matches); }, []);
  return r;
}

/** 스크롤할 때마다 el 의 위치로 진행률(0~1)을 잰다. fixed 를 주면 그 값에 고정.
 *  calc 는 모듈 수준 함수로 넘긴다 — 렌더마다 새로 만들면 효과가 매번 다시 돈다 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, calc: (r: DOMRect, vh: number) => number, fixed?: number): number {
  const [t, setT] = useState(fixed ?? 0);
  useEffect(() => {
    if (fixed !== undefined) { setT(fixed); return; }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => { raf = 0; setT(clamp01(calc(el.getBoundingClientRect(), window.innerHeight))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [ref, calc, fixed]);
  return t;
}
```

- [ ] **Step 4: 흐름 다이어그램을 쓴다**

`web/components/case/flow.module.css`:

```css
/* 흐름 다이어그램 — 흰 바탕 상자 안에 640×360 그림 */
.fig{margin:0}
.box{background:var(--bone-0);border:1px solid var(--bone-200);padding:24px;box-sizing:border-box}
.svg{width:100%;height:auto;display:block;overflow:visible}
.lbl{font-size:11px;font-weight:500;fill:var(--bone-500)}
.cap{margin-top:8px;font-size:13px;line-height:1.5;color:var(--bone-500)}
/* 폰: 그림이 358px 로 줄면 11 은 6px — 그림 좌표 단위로 키운다(20 → 약 11px) */
@media (max-width:1023px){ .box{padding:12px} .lbl{font-size:20px} }
```

`web/components/case/flow.tsx`:

```tsx
'use client';
import { useMemo, useRef } from 'react';
import type { FlowBlock } from '@/content';
import { useReducedMotion, useScrollProgress } from './use-scroll-progress';
import g from './grid.module.css';
import s from './flow.module.css';

const CY = 160;                     // 가운데 줄
const Y0 = 64, Y1 = 256;            // 갈래가 서는 높이 범위
const X0 = 160, X1 = 566;           // 새 흐름 단계의 가로 범위(마지막은 화살표)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const spread = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => (n === 1 ? (a + b) / 2 : a + (b - a) * i / (n - 1)));

/** 윗변이 화면 85% 에 오면 0, 그림 가운데가 화면 40% 에 오면 1 (명세 §6) */
const morphT = (r: DOMRect, vh: number) => (vh * 0.85 - r.top) / (vh * 0.45 + r.height / 2);

export function Flow({ b }: { b: FlowBlock }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const t = useScrollProgress(ref, morphT, b.state === 'before' ? 0 : reduced ? 1 : undefined);

  const srcY = useMemo(() => spread(Y0, Y1, b.from.length).map(Math.round), [b.from.length]);
  const stepX = useMemo(() => spread(X0, X1, b.to.length), [b.to.length]);
  const paths = srcY.map((y) => {
    const B = [150, y, 235, CY + (y - CY) * 0.12, 300, CY];
    const A = [110, y, 130, CY, 160, CY];
    const v = B.map((n, k) => lerp(n, A[k], t));
    return `M40 ${y} C ${v[0]} ${v[1]}, ${v[2]} ${v[3]}, ${v[4]} ${v[5]}`;
  });
  const after = t > 0.5;
  const shift = lerp(50, 22, t);   // 상태마다 그림을 상자 가운데에 둔다

  return (
    <div className={g.g}>
      <figure ref={ref} className={`${b.state === 'before' ? g.body : g.wide} ${s.fig}`} data-flow data-t={t.toFixed(3)}>
        <div className={s.box}>
          <svg viewBox="0 0 640 320" className={s.svg} role="img" aria-label={b.alt}>
            <g transform={`translate(${shift.toFixed(1)},0)`}>
              {srcY.map((y, i) => <text key={`l${i}`} x={34} y={y + 4} textAnchor="end" className={s.lbl}>{b.from[i]}</text>)}
              {paths.map((d, i) => (
                <path key={`p${i}`} d={d} fill="none" stroke={after ? 'var(--navy-800)' : 'var(--navy-400)'} strokeWidth={after ? 2 : 1.2} />
              ))}
              <g style={{ opacity: Math.max(0, 1 - t * 2) }}>
                <path d={`M300 ${CY} H520`} fill="none" stroke="var(--navy-400)" strokeWidth={1.2} />
                <circle cx={300} cy={CY} r={5} fill="var(--bone-50)" stroke="var(--navy-400)" />
                <text x={300} y={CY + 28} textAnchor="middle" className={s.lbl}>{b.hub}</text>
                <path d={`M514 ${CY - 6} l12 12 M526 ${CY - 6} l-12 12`} fill="none" stroke="var(--navy-400)" strokeWidth={1.2} />
                <text x={520} y={CY + 28} textAnchor="middle" className={s.lbl}>{b.stop}</text>
              </g>
              <g style={{ opacity: clamp01((t - 0.45) * 2) }}>
                <path data-chain d={`M${X0} ${CY} H${X1}`} fill="none" stroke="var(--navy-800)" strokeWidth={2}
                      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01((t - 0.5) * 2)} />
                {stepX.map((x, i) => i < b.to.length - 1 ? (
                  <g key={b.to[i]}>
                    <circle cx={x} cy={CY} r={5} fill="var(--bone-50)" stroke="var(--navy-800)" />
                    <text x={x} y={i === 0 ? CY + 56 : i % 2 ? CY - 20 : CY + 28} textAnchor="middle" className={s.lbl}>{b.to[i]}</text>
                  </g>
                ) : (
                  <g key={b.to[i]}>
                    <polygon points={`${X1},${CY - 9} ${X1 + 16},${CY} ${X1},${CY + 9}`} fill="var(--navy-800)" />
                    <text x={X1 + 16} y={CY + 28} textAnchor="middle" className={s.lbl}>{b.to[i]}</text>
                  </g>
                ))}
              </g>
            </g>
          </svg>
        </div>
        {b.caption ? <figcaption className={s.cap}>{b.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
```

`web/components/case/block-view.tsx`:

```tsx
import { Flow } from './flow';
```

```tsx
    case 'flow':
      return <Flow b={b} />;
```

- [ ] **Step 5: 통과를 확인한다**

Run: `cd web && npx playwright test tests/flow.spec.ts tests/layout.spec.ts`
Expected: PASS (네 뷰포트)

- [ ] **Step 6: 커밋**

```bash
cd web
git add components/case/use-scroll-progress.ts components/case/flow.tsx components/case/flow.module.css components/case/block-view.tsx tests/flow.spec.ts
git commit -m "[ADD] web: 흐름 다이어그램 — 문구를 데이터로, 지나가며 바뀜

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Before & After 와이프 — CSS sticky 로 붙이기

와이프는 화면에 붙는 유일한 곳. 트랙(`padding-bottom:100vh`) 안에서 무대(`position:sticky; top:88px`)가 붙고, 한 화면 높이를 스크롤하는 동안 t 0 → 1.

**Files:**
- Modify: `web/components/case/wipe.tsx`(전체 교체), `web/components/case/wipe.module.css`(전체 교체), `web/components/case/block-view.tsx`, `web/tests/wipe.spec.ts`(전체 교체), `web/tests/acceptance.spec.ts`

**Interfaces:**
- Consumes: `useScrollProgress`·`useReducedMotion`(Task 5), `WipeBlock`(Task 1), `ScatterCollage`(기존), 격자(Task 2)
- Produces: `<WipeView b>` — `[data-wipe-track]` > `[data-wipe-stage]` > `[data-wipe-before]`·`[data-wipe-after]`·`[data-wipe-edge]`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`web/tests/wipe.spec.ts` 전체 교체:

```ts
import { test, expect } from '@playwright/test';
import { scrollToY } from './helpers';

const PIN = 88;   // wipe.module.css .stage top
const trackY = (page: import('@playwright/test').Page, k: number) => page.evaluate(([k, pin]) => {
  const tr = document.querySelector<HTMLElement>('[data-wipe-track]')!;
  return tr.getBoundingClientRect().top + window.scrollY - pin + window.innerHeight * k;
}, [k, PIN] as const);
const right = (page: import('@playwright/test').Page) => page.evaluate(() =>
  Number((document.querySelector('[data-wipe-after]') as HTMLElement).style.clipPath.match(/inset\(0px\s+([\d.]+)%/)?.[1] ?? NaN));

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
});

test('와이프: 무대가 붙은 채 경계선이 0% → 100%', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — 폰은 붙이지 않고 쌓는다');
  await scrollToY(page, await trackY(page, 0));
  expect(await right(page)).toBeGreaterThanOrEqual(99);
  await scrollToY(page, await trackY(page, 0.5));
  expect(await right(page)).toBeGreaterThan(40);
  expect(await right(page)).toBeLessThan(60);
  const top = await page.evaluate(() => document.querySelector<HTMLElement>('[data-wipe-stage]')!.getBoundingClientRect().top);
  expect(Math.abs(top - PIN)).toBeLessThanOrEqual(2);
  await scrollToY(page, await trackY(page, 1));
  expect(await right(page)).toBeLessThanOrEqual(1);
});

test('와이프 무대가 화면 안에 다 들어온다', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용');
  await scrollToY(page, await trackY(page, 0.5));
  const bottom = await page.evaluate(() => document.querySelector<HTMLElement>('[data-wipe-stage]')!.getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test('콜라주와 화면의 크기가 같다', async ({ page }) => {
  const [a, b] = await page.evaluate(() => {
    const r1 = (document.querySelector('[data-wipe-before]') as HTMLElement).getBoundingClientRect();
    const r2 = (document.querySelector('[data-wipe-after]') as HTMLElement).getBoundingClientRect();
    return [Math.round(r1.width), Math.round(r2.width)];
  });
  expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
});

test('폰: Before 위, After 아래로 둘 다 보인다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '폰 전용 — 데스크톱은 와이프');
  await expect(page.locator('[data-wipe-before]')).toBeVisible();
  await expect(page.locator('[data-wipe-after]')).toBeVisible();
  const r = await page.evaluate(() => {
    const b = (document.querySelector('[data-wipe-before]') as HTMLElement).getBoundingClientRect();
    const a = document.querySelector('[data-wipe-after]') as HTMLElement;
    const edge = document.querySelector('[data-wipe-edge]') as HTMLElement | null;
    return { bh: b.height, ah: a.getBoundingClientRect().height, bBottom: b.bottom, aTop: a.getBoundingClientRect().top,
             clip: getComputedStyle(a).clipPath, edge: edge ? getComputedStyle(edge).display : 'none' };
  });
  expect(r.bh).toBeGreaterThan(0);
  expect(r.ah).toBeGreaterThan(0);
  expect(r.aTop).toBeGreaterThanOrEqual(r.bBottom);
  expect(r.clip).toBe('none');
  expect(r.edge).toBe('none');
});
```

`web/tests/acceptance.spec.ts` 끝에 모션 줄이기 테스트를 더한다:

```ts
test('V9 모션 줄이기: 02 흐름은 완성(t=1), 와이프는 After 전부', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => Number(document.querySelector<HTMLElement>('#flow [data-flow]')!.dataset.t))).toBe(1);
  const right = await page.evaluate(() =>
    Number((document.querySelector('[data-wipe-after]') as HTMLElement).style.clipPath.match(/inset\(0px\s+([\d.]+)%/)?.[1] ?? NaN));
  expect(right).toBe(0);
  await ctx.close();
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd web && npx playwright test tests/wipe.spec.ts tests/acceptance.spec.ts --project=w1440`
Expected: FAIL — `[data-wipe-track]` 없음

- [ ] **Step 3: 와이프를 다시 쓴다**

`web/components/case/wipe.module.css` 전체 교체:

```css
/* Before & After 와이프 — 트랙 안에서 무대가 헤더 아래(88)에 붙고, 한 화면 높이를 지나며 After 가 왼쪽부터 드러난다 (명세 §6) */
.track{position:relative;padding-bottom:100vh}
.stage{position:sticky;top:88px}
/* 무대가 화면에 다 들어오게: 폭 ≤ (화면 높이 − 위 88 − 캡션·여백 64) × 1292/812 */
.stack{position:relative;aspect-ratio:1292/812;width:min(100%, calc((100vh - 152px) * 1.591))}
.layer{position:absolute;inset:0}
.edge{position:absolute;top:0;bottom:0;width:2px;background:var(--navy-800);z-index:3;pointer-events:none}
.after{background:var(--bone-0)}
.img{object-fit:cover;object-position:top left;border:1px solid var(--bone-900);background:var(--bone-0)}
.caps{display:flex;gap:12px;margin-top:8px;font-size:13px;line-height:1.5;color:var(--bone-500)}
.caps span{transition:opacity .3s}
/* 폰: 붙이지 않고 Before 위 · After 아래 */
@media (max-width:1023px){
  .track{padding-bottom:0}
  .stage{position:static}
  .stack{width:100%;aspect-ratio:auto}
  .layer{position:relative;inset:auto;aspect-ratio:1292/812}
  .after{margin-top:12px;clip-path:none!important}
  .edge{display:none}
  .caps{flex-direction:column;gap:4px}
  .caps span{opacity:1!important}
  .caps .arrow{display:none}
}
```

`web/components/case/wipe.tsx` 전체 교체:

```tsx
'use client';
import { useRef } from 'react';
import Image from 'next/image';
import type { WipeBlock } from '@/content';
import { ScatterCollage } from './scatter-collage';
import { useReducedMotion, useScrollProgress } from './use-scroll-progress';
import g from './grid.module.css';
import s from './wipe.module.css';

const PIN = 88;   // wipe.module.css .stage top 과 같게
/** 트랙 윗변이 PIN 에 오면 0, 한 화면 높이(= 트랙의 padding-bottom) 더 내려가면 1 */
const wipeT = (r: DOMRect, vh: number) => (PIN - r.top) / vh;

export function WipeView({ b }: { b: WipeBlock }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const t = useScrollProgress(ref, wipeT, reduced ? 1 : undefined);
  const pct = (100 - t * 100).toFixed(2);
  return (
    <div className={g.g}>
      <div className={g.wide}>
        <div ref={ref} className={s.track} data-wipe-track>
          <div className={s.stage} data-wipe-stage>
            <div className={s.stack}>
              <div data-wipe-before className={s.layer}>
                {Array.isArray(b.before)
                  ? <ScatterCollage items={b.before} />
                  : <Image src={b.before.src} alt={b.before.alt} fill sizes="(max-width:1023px) 100vw, 1343px" className={s.img} />}
              </div>
              <div data-wipe-after className={`${s.layer} ${s.after}`} style={{ clipPath: `inset(0 ${pct}% 0 0)` }}>
                <Image src={b.after.src} alt={b.after.alt} fill sizes="(max-width:1023px) 100vw, 1343px" className={s.img} />
              </div>
              <i aria-hidden data-wipe-edge className={s.edge} style={{ left: `calc(${(t * 100).toFixed(2)}% - 1px)` }} />
            </div>
            <div className={s.caps}>
              <span style={{ opacity: t < 0.5 ? 1 : 0.35 }}>{b.caps[0]}</span>
              <span className={s.arrow} style={{ color: 'var(--bone-400)' }}>→</span>
              <span style={{ opacity: t < 0.5 ? 0.35 : 1 }}>{b.caps[1]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

`web/components/case/block-view.tsx`:

```tsx
import { WipeView } from './wipe';
```

```tsx
    case 'wipe':
      return <WipeView b={b} />;
```

(이제 모든 블록 종류를 다루므로 `default: return null;`을 지우고, 함수 끝에 도달하지 않음을 TypeScript 가 확인하게 둔다.)

- [ ] **Step 4: 통과를 확인한다**

Run: `cd web && npx playwright test tests/wipe.spec.ts tests/acceptance.spec.ts tests/layout.spec.ts`
Expected: PASS. **sticky 가 붙지 않으면**(무대 top 이 88 이 아니면) 조상 요소의 `overflow`가 원인이다 — `html{overflow-x:clip}`은 괜찮고 `overflow:hidden`이 있으면 안 된다. `getComputedStyle`로 무대의 조상들을 확인해 `hidden`을 `clip`으로 바꾼다.

- [ ] **Step 5: 커밋**

```bash
cd web
git add components/case/wipe.tsx components/case/wipe.module.css components/case/block-view.tsx tests/wipe.spec.ts tests/acceptance.spec.ts
git commit -m "[MOD] web: Before & After 와이프 — CSS sticky 로 붙이기, 모션 줄이기는 After 전부

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 부드러운 스크롤, 장 링크, 문서 정리, 최종 확인

**Files:**
- Modify: `web/components/lenis-provider.tsx`, `web/tests/acceptance.spec.ts`, `web/tests/inquiry.spec.ts`, `docs/28_spec_case_vertical_G.md`, `docs/superpowers/specs/2026-09-23-case-detail-editorial-design.md`

**Interfaces:**
- Consumes: 장 `section[data-chapter][id]`와 `scroll-margin-top:88px`(Task 2)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`web/tests/acceptance.spec.ts` 끝에 더한다:

```ts
test('장 링크로 들어오면 그 장이 헤더 아래에서 시작', async ({ page }) => {
  await page.goto('/projects/por-favor-harry#screens');
  await page.waitForTimeout(800);
  const top = await page.evaluate(() => document.getElementById('screens')!.getBoundingClientRect().top);
  expect(Math.abs(top - 88)).toBeLessThanOrEqual(4);
});

test('상세에서도 휠이 부드럽게 굴러간다(Lenis smoothWheel)', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — 터치는 Lenis 가 건드리지 않는다');
  await page.goto('/projects/por-favor-harry');
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { __lenis?: { options: { smoothWheel: boolean } } }).__lenis?.options.smoothWheel)).toBe(true);
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd web && npx playwright test tests/acceptance.spec.ts --project=w1440`
Expected: FAIL — `smoothWheel` 이 `false`(상세에서는 꺼 두었음). 장 링크 테스트는 이미 통과할 수 있다(Task 2 의 scroll-margin) — 그대로 둔다.

- [ ] **Step 3: Lenis 를 상세에서도 켠다**

`web/components/lenis-provider.tsx` 전체 교체:

```tsx
'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

let current: Lenis | null = null;
export const getLenis = () => current;

/** 부드러운 스크롤 — 목록·상세 모두(명세 §6). 모션 줄이기면 켜지 않는다 */
export function LenisProvider() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const l = new Lenis({ lerp: 0.1, smoothWheel: true });
    current = l;
    (window as unknown as { __lenis?: Lenis }).__lenis = l;   // 테스트가 스크롤을 옮길 통로
    let raf = 0;
    const tick = (t: number) => { l.raf(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); l.destroy(); current = null; delete (window as unknown as { __lenis?: Lenis }).__lenis; };
  }, []);
  return null;
}
```

`web/tests/inquiry.spec.ts` — 정거장이 없어졌으므로 이름과 설명만 고친다:

```ts
test('상세에서 포커스된 문의 버튼에 Space 를 누르면 서랍이 열리고 페이지는 움직이지 않는다', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용 — 헤더 문의 버튼 포커스로 확인');
```

(본문은 그대로.)

- [ ] **Step 4: 전체를 확인한다**

Run: `cd web && node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json && npx playwright test`
Expected: 오류 없음, 전체 PASS(skip 은 폰/데스크톱 전용 분기). `test.fixme`가 남아 있지 않은지: `grep -rn "fixme" tests/` → 결과 없음.

- [ ] **Step 5: 눈으로 확인한다**

개발 서버를 3000번에 띄우고(`npm run dev`) 1440×900, 1280×720, 390×844 에서 `/projects/por-favor-harry`를 처음부터 끝까지 내려 본다. 확인할 것: 표지 → 01(정지 다이어그램 + 통찰) → 02(내려가며 네 갈래가 한 흐름으로) → 03(여백 주석 여섯 + 폰 칸, 핫스팟 호버) → 04(무대가 붙은 채 와이프) → 끝(문의 · 다음 이야기). 폰에서는 글이 그림 위, 두 장이 세로, 와이프는 위아래로 쌓임.

- [ ] **Step 6: 문서를 정리한다**

`docs/28_spec_case_vertical_G.md` — 맨 위 표의 `| 결정 |` 행 바로 아래에 한 행 더한다:

```markdown
| 대체 | **상세 배치·동작은 2026-09-24 에디토리얼 문서형으로 대체** — `docs/superpowers/specs/2026-09-23-case-detail-editorial-design.md`. 이 문서의 판·머무름·정거장 규칙은 더 이상 쓰지 않는다 |
```

`docs/superpowers/specs/2026-09-23-case-detail-editorial-design.md` — 상태 행을 바꾼다:

```markdown
| 상태 | **구현 완료**(2026-09-24) — 계획 `docs/superpowers/plans/2026-09-24-case-detail-editorial.md` |
```

- [ ] **Step 7: 커밋**

```bash
git add web/components/lenis-provider.tsx web/tests/acceptance.spec.ts web/tests/inquiry.spec.ts docs/28_spec_case_vertical_G.md docs/superpowers/specs/2026-09-23-case-detail-editorial-design.md
git commit -m "[MOD] web: 상세 부드러운 스크롤, 장 링크 테스트, 문서 정리

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

## 명세 대조 (자체 점검)

| 명세 | 작업 |
|---|---|
| §3 스크롤 자유·Lenis·정거장 없음 | 2(정거장 삭제), 7(Lenis) |
| §4.1 격자 칸 | 2 `grid.module.css` |
| §4.2 표지 · 끝 | 2 `cover`·`closing` |
| §4.3 블록 여섯 | figure 2, note 3, phones·quote 4, flow 5, wipe 6 |
| §4.4 Por favor, Harry 장 구성 | 1 데이터, 2 `layout.spec` 장 순서 |
| §5-1 한 장 칸 | 2 `Frame`, 3 같은 폭 테스트 |
| §5-2 한 줄 높이 맞춤 | 3 `Row`, 높이 테스트 |
| §5-3 긴 캡처 창 | 2 `frameMode`·`.long`(Por favor, Harry 에는 해당 그림이 없어 순수 계산 테스트만) |
| §5-4 원본보다 안 키움 | 2 `Frame` maxWidth·`rowMaxWidth`, 테스트 |
| §6 움직임 | 5 flow, 6 wipe, 7 Lenis·장 링크, 모션 줄이기 6 |
| §7 데이터·규칙 검사 | 1 |
| §8 폰 | 3(주석 위·세로 쌓기), 4(폰 60%), 5(글자 키움), 6(와이프 쌓기) |
| §9 접근성 | 제목 단계 2·3, alt 1(검사), flow role·aria 5, wipe alt 6 |
| §10 코드 없앰·고침·새로 | 2~7 |
| §11 테스트 | 2(버림·고침), 3~7(추가) |
| §13 미결 | Built with 는 데이터에서 뺌(1), 03 장 제목은 구현 뒤 사용자 확인 |
