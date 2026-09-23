# Case Study 상세 재구축 — 에디토리얼 문서형 (설계)

| 작성일 | 2026-09-23 |
|---|---|
| 상태 | **구현 완료**(2026-09-24) — 계획 `docs/superpowers/plans/2026-09-24-case-detail-editorial.md` |
| 대체 | docs/28(G안 판 구조)의 **상세 배치·동작 전부**, docs/26·27 상세 부분. `design/mockups/v3/case.html`은 더 이상 기준이 아니다 |
| 유지 | docs/13 컬러 · docs/14 컨셉(구조적 편집물) · docs/20 목록→상세 전환 · docs/21 문구 규칙 · 이식 설계서(2026-09-23-next-port-design)의 목록·문의·헤더·배포 |
| 근거 | 에이전시·개인 포트폴리오 프로젝트 페이지 조사(§2), 브레인스토밍 결정(§3). 비교 화면은 `.superpowers/brainstorm/` |

---

## 1. 왜 다시 짓나

지금 상세는 "판 = 화면 한 장"이다. 글을 먼저 놓고 **남는 높이**에 그림을 맞추기 때문에, 같은 1280×800 캡처가 1440×900 창에서 판마다 **536~774px**로 다르게 나온다(실측). 06 화면을 판 여러 장으로 늘리면서 "06" 라벨이 연달아 붙고, 08을 지운 뒤 번호가 07 → 09로 건너뛰었다. 판 구조를 고쳐 가며 맞추는 대신, 레퍼런스들이 쓰는 **내려 읽는 문서** 구조로 새로 짓는다.

## 2. 레퍼런스

B2B 제품·웹 작업이 많은 곳의 프로젝트 페이지를 실제로 열어 전체를 캡처하고 구조·그림 폭·비율을 쟀다.

| 곳 | 페이지 | 가져온 것 |
|---|---|---|
| Work & Co | [IKEA](https://work.co/clients/ikea/) | 왼쪽 좁은 라벨 칸 + 오른쪽 본문 칸, 번호 붙은 장, 숫자를 앞에 |
| Metalab | [Midjourney](https://www.metalab.com/work/midjourney) | 제목 + 메타 한 줄 → 대표 이미지 → 소개 문단, 그림 옆 짧은 설명 |
| Instrument | [Mercury](https://www.instrument.com/work/mercury) | 짧은 장과 그림 교대, 끝에 역할 목록(Our Role) |
| ustwo | [RVO Health](https://ustwo.com/work/rvo-health/) | Impact 숫자를 앞쪽에, Before/After 다이어그램 나란히 |
| Clay | [Marqeta](https://clay.global/work/marqeta) | 소개 두 칸(글 \| 서비스), 화면 목업을 틀에 |
| Locomotive | [사례 1편](https://locomotive.ca/en/work) | 라벨 \| 본문 두 칸, 전폭·가운데·두 장 섞기, 끝에 Credits 표 |
| Karolis Kosas(개인) | [CUJO](https://karoliskosas.com/cujo-3/) | 역할·결과 두 칸, 회색 띠 위 화면 여러 장 |
| van Schneider(개인) | [Europa Clipper](https://vanschneider.com/europaclipper) | 짧은 문장 도입 → 전폭 사진 → 메타 \| 본문 |

읽어 낸 것:
1. **한 화면에 한 판씩 맞추는 곳이 없다.** 모두 내려 읽는 문서이고, 그림은 원래 비율 그대로 격자 칸 폭에 선다. 그래서 그림 크기가 글 길이에 따라 흔들리지 않는다.
2. **뼈대는 좁은 라벨 칸 + 본문 칸.** 번호·장 이름이 라벨 칸에 들어간다.
3. **장은 3~5개.** 10단계를 다 드러내는 곳은 없다.
4. **"배운 것" 장은 어디에도 없다**(docs/25 R8과 같음). 끝은 역할·다음 프로젝트·문의.
5. **화면에 붙는 연출은 없거나 한 곳.** 한 곳만 두면 오히려 돋보인다.

## 3. 결정 (2026-09-23)

| 항목 | 결정 |
|---|---|
| 스크롤 | 자유롭게 내려 읽기. 부드러운 스크롤(Lenis) 있음. **정거장(휠 한 칸 = 판 하나) 없음** |
| 배치 | **A 에디토리얼 문서형** — 12칸 격자, 왼쪽 라벨 칸 + 본문 칸 |
| 틀 | 고정 뼈대(표지 · 끝) + 가변 본문(장 N개, 블록 조합) |
| 화면 설명 | **여백 주석형** — 설명은 왼쪽 3칸, 그림은 오른쪽 9칸 |
| 03→05 다이어그램 | 화면에 붙지 않고 **지나가며 바뀜** |
| Before & After | 와이프 유지. **화면에 붙는 유일한 곳** |
| 나타남 효과 | 없음(docs/14 §3.6 "섹션 페이드업 없음") |
| WHAT I LEARNED | **완전히 삭제** |
| 끝 | Built with 한 줄 → 문의 → 다음 이야기. 역할은 표지 메타에만(반복하지 않음) |
| 그림 크기 | §5의 규칙 네 줄. 프로젝트마다 캡처 크기·비율이 달라도 같은 규칙 |

## 4. 페이지 구성

### 4.1 격자
본문 컨테이너는 지금 공식 그대로 `max-width: clamp(1272px, 80vw, 1760px)`, 좌우 여백 72px. 그 안을 12칸(간격 24px)으로 나눈다. 1440 창에서 본문 폭 1128px, 한 칸 72px.

| 자리 | 칸 | 1440 창 폭 |
|---|---|---|
| 라벨(번호 · 장 이름) | 1–2 | 168px |
| 본문(장 도입 글, 본문 그림) | 3–9 | 648px |
| 넓게(핵심 그림) | 3–12 | 936px |
| 전폭(표지 대표 화면) | 1–12 | 1128px |
| 여백 주석 글 | 1–3 | 264px |
| 여백 주석 그림 | 4–12 | 840px |

### 4.2 뼈대 (모든 프로젝트 같음)
- **표지**: 윗줄(`Prologue & {프로젝트} · 문제 NN {유형}`) → 결과 문장 H1 → 개요 문단(1~2문장) + 메타 표(역할·기간·사용자·공개 범위) \| 숫자 3개 → 대표 화면(전폭) + 캡션. H1은 목록→상세 전환의 공유 이름(`pj-title`)을 그대로 가진다.
- **본문**: 장 N개(§4.3).
- **끝**: Built with 한 줄(데이터에 있을 때만) → 문의 문단 + "이 프로젝트를 보고 문의하기" → 다음 이야기(제목 · 태그라인 · 표지 그림).

### 4.3 장과 블록 (프로젝트마다 다름)
장 = 번호(자동, 01부터) + 이름 + 도입(제목 H2 + 문단) + 블록 목록. 도입은 라벨 칸 | 본문 칸.

| 블록 | 모양 |
|---|---|
| `figure` | 그림 한 장. 칸 `wide`(넓게) 또는 `body`(본문) |
| `note` | 여백 주석(라벨 · 제목 H3 · 문단) + 그림 1~3장(한 줄 높이 맞춤). 첫 그림에 핫스팟 가능 |
| `phones` | 여백 주석(선택) + 회색 띠 위 폰 화면 1~3장 |
| `flow` | 흐름 다이어그램. `before`(정지) 또는 `morph`(지나가며 바뀜) |
| `quote` | 통찰 한 문장(크게) + 선택 문단 |
| `wipe` | Before & After 와이프. 한 편에 최대 1개 |

### 4.4 Por favor, Harry
| 장 | 블록 |
|---|---|
| 01 문제 | flow(before) → quote("할 일 관리가 아니라, 요청이 들어오는 길의 문제였습니다.") |
| 02 바꾼 흐름 | flow(morph) |
| 03 화면 | note(요청 양식 + 핫스팟 ①②③) → note(대리 등록) → note(업무 목록) → note(업무 상세) → note(진행 상황 + 내 요청, 두 장) → note(업데이트) → phones(폰) |
| 04 Before & After | wipe(말풍선 콜라주 → 심사 대기) |

지금 10단계의 흡수: Overview → 표지 개요 문단, Existing Workflow → 01 flow(before), Insight → 01 quote, Redesign → 02 flow(morph), Solution → 03, Impact → 표지 숫자, What I Learned → 삭제. 03의 여백 주석 라벨은 흐름 순서(들어온다 → 처리한다 → 돌려준다 → 어디서든)를 보여 준다.

## 5. 그림 규칙

그림의 폭은 **칸**이 정하고 높이는 **그림의 원래 비율**이 정한다. 글 길이·창 높이는 그림 크기에 관여하지 않는다. 프로젝트마다 "기준 비율"을 정하지 않는다.

1. **한 장 칸(`figure`, `note`의 한 장)**: 폭 = 칸, 높이 = 비율. 자르지도, 띠를 넣지도 않는다. 16:10과 16:9가 같은 칸에 오면 폭은 같고 높이만 다르다(받아들이는 차이).
2. **여러 장(`note`의 2~3장, `phones`의 2~3장)**: 한 줄의 높이를 같게 두고 폭을 비율대로 나눈다. 줄 전체 폭은 칸에 꼭 맞는다. 비율이 섞여도 잘리거나 띠가 생기지 않는다.
3. **아주 긴 캡처**(세로 > 가로, 폰 제외): 칸 폭만 한 정사각 창 안에서 스크롤, 아래를 흐리게. 폰(<1024)에서는 창 없이 전체.
4. **원본 픽셀보다 키우지 않는다.** 칸이 원본보다 넓으면 원본 폭에서 멈춘다. 작은 캡처(예: 1024×640)는 `wide` 대신 `body` 칸을 쓴다. 새로 찍는 캡처는 2배(예: 2560×1600)를 권한다.

## 6. 움직임

| 순간 | 규칙 |
|---|---|
| 스크롤 | 브라우저 기본 + Lenis(lerp 0.1). 키보드는 브라우저 기본 |
| `flow(morph)` | 붙지 않음. 그림 윗변이 화면 85%에 올 때 t=0, 그림 가운데가 화면 40%에 올 때 t=1. 그 사이 네 갈래 → 한 흐름 |
| `wipe` | 이 블록만 화면에 붙는다(헤더 아래 88). 한 화면 높이만큼 스크롤하는 동안 경계선 왼 → 오. 붙이기는 CSS `position: sticky`를 먼저 쓰고, 조상 요소 때문에 붙지 않으면 JS로 |
| 나타남 | 없음 |
| 핫스팟 | 호버·포커스(폰은 탭)로 영역 강조 |
| 목록 → 상세 | 행 제목 → 표지 H1 공유 요소 전환, 돌아올 때도(docs/20, 지금 코드 그대로) |
| 장 링크 | 장 id(`#problem`, `#flow`, `#screens`, `#before-after`)로 들어오면 그 장이 헤더 아래에서 시작(`scroll-margin-top: 88px`). id는 데이터에 영문으로 |
| 모션 줄이기 | Lenis 끔, `flow(morph)`는 t=1, `wipe`는 After 전부 |

## 7. 데이터 구조

```ts
type Study = {
  cover: { cap: string; title: string; summary: string[];
           meta: [string, string][]; numbers: Num[]; hero: Figure };
  chapters: Chapter[];
  builtWith?: string[];
  cta: string;                            // 다음 이야기는 목록 순서로 정한다(지금과 같음)
};
type Chapter = { id: string; name: string; h: string; p: string[]; blocks: Block[] };
type Block =
  | { type: 'figure'; slot: 'wide' | 'body'; fig: Figure }
  | { type: 'note';   label: string; h?: string; p?: string[]; figs: Figure[] }
  | { type: 'phones'; label?: string; h?: string; p?: string[]; figs: Figure[]; caption?: string }
  | { type: 'flow';   state: 'before' | 'morph'; from: string[]; hub: string; stop: string; to: string[];
                      alt: string; caption?: string }
  | { type: 'quote';  text: string; p?: string }
  | { type: 'wipe';   before: Scatter[] | Figure; after: Figure; caps: [string, string] };
type Figure = { src: string; alt: string; caption?: string; spots?: Spot[]; w?: number; h?: number };
```

- **그림 크기는 적지 않는다.** 콘텐츠에는 `src`(public 경로)만 쓰고, 페이지를 만들 때 서버가 파일 머리에서 원본 가로·세로를 읽어 `w`·`h`를 채운다(`resolveStudy`). 없는 파일은 빌드에서 걸린다. 캡처는 `web/public/screens/pfh/`에 그대로 둔다.
- **흐름 다이어그램 문구는 데이터**(`from`·`hub`·`stop`·`to`). 지금 코드에 박힌 Por favor, Harry 문구를 뺀다. 모양이 다른 그림(병원 비교, 구조도)은 SVG·이미지로 `figure`에 넣는다.
- **콘텐츠 규칙은 테스트가 검사**: `wipe` 한 편 최대 1개, `note`·`phones` 그림 1~3장, 핫스팟은 `note` 첫 그림에만, 모든 그림에 alt, 여백 주석 문단은 두 문장 이하, 장 id는 영문 소문자·숫자·하이픈.
- **`phones`도 라벨·제목·문단을 받는다** — 여백 주석과 같은 배치에 그림 칸만 폰(회색 띠 위)으로.

## 8. 폰 (<1024px)

| 요소 | 폰에서 |
|---|---|
| 라벨 칸 | 제목 위 한 줄 |
| `note` | 주석이 그림 **위**로(라벨 → 제목 → 문단 → 그림). 여러 장은 **세로로 쌓음** |
| `phones` | 한 장이면 폭 60% 가운데, 여럿이면 나란히 |
| 핫스팟 | 탭으로 켜고 끔 |
| 긴 캡처 | 창 없이 전체 |
| `wipe` | 붙이지 않고 Before 위 · After 아래 |
| `flow` | 다이어그램 글자를 한 단계 키움(데스크톱 비율 그대로면 약 6px) |
| 숫자 3개 | 한 줄에 셋 |

## 9. 접근성
- 제목 단계: 표지 H1 → 장 H2 → 여백 주석 H3.
- 모든 그림 alt 필수(테스트). `flow`는 `role="img"` + `alt` 한 문장.
- `wipe`는 Before·After 모두 alt와 캡션 — 스크롤 연출 없이도 두 상태를 읽을 수 있다.
- 핫스팟 목록은 키보드 포커스로 켜진다(지금과 같음).

## 10. 코드

| 구분 | 대상 |
|---|---|
| 없앰 | `use-stations`, `use-dwell`, `dwell`, `use-fit-pans`, `pan`(판 컴포넌트), `finale`(끝으로 대체), `case-view`의 판 조립 |
| 그대로 | `hotspots`, `scatter-collage`, `view-transition-link`·`vt-return`·`route-commit`(전환), 헤더, 목록, 문의 서랍 |
| 고침 | `cover`(개요 문단 추가, 대표 화면 전폭), `wipe`(붙이기 단순화), `morph-diagram` → `flow`(문구를 데이터로), `screen` → `figure`(칸·상한·긴 캡처 창), `lenis-provider`(상세에서도 부드러운 휠), 콘텐츠 타입·Por favor, Harry 데이터 |
| 새로 | `chapter`, `note`(여백 주석 + 한 줄 높이 맞춤), `phones`, `quote`, `closing`(Built with · 문의 · 다음 이야기), 콘텐츠 검사 |

## 11. 테스트
- **버림**: 판 넘침(V1), 정거장 개수·휠 한 칸(V2), 머무름 03→05(dwell.spec), 판 기준 해시(#s06·#s07).
- **고침**: 해시 → 장 id, 콘텐츠(content.spec) → 새 형식, 모션 줄이기(V9) → flow t=1 · wipe After.
- **추가**: 같은 칸 그림 폭이 같다 · 한 줄 그림 높이가 같다 · 원본보다 크지 않다 · 콘텐츠 규칙(wipe ≤ 1, 그림 1~3장, alt) · 폰에서 가로 넘침 0이고 여러 장이 세로로 쌓인다 · `flow`가 스크롤에 따라 t 0 → 1.
- **유지**: 전환(transition), 문의(inquiry), 목록(list), 와이프(wipe, 붙이기 방식만 반영), 핫스팟(case-parts).
- 테스트는 프로덕션 빌드로 돈다(playwright.config, 83d7271).

## 12. 범위 밖
대시보드(v6) 이식 · 나머지 3편 본문 · 나타남 효과 · 장 목차/진행 표시 · Credits 표(협업 프로젝트가 생기면 그 편에만) · 시안(`v3/case.html`) 갱신.

## 13. 미결
| 항목 | 누가·언제 |
|---|---|
| Built with 실제 기술 스택 | 사용자 — 알려 주기 전까지 데이터에서 빼 둔다(끝에 안 그림) |
| 03 장 제목 | 지금 "필수 항목을 채워야 보낼 수 있는 양식"은 첫 화면 설명과 겹친다. 장 전체를 말하는 문장으로(예: "요청 하나가 돌아오기까지") — 구현 중 docs/21 규칙으로 다듬어 확인받는다 |
| 여백 주석 문단 | 두 문장 이하로 다듬는다(여백 주석형의 조건) |
| 2배 캡처 | 새로 찍을 때부터 권장. 기존 1280×800은 그대로 쓴다 |

## 14. 구현 계획을 쓰며 바꾼 것 (2026-09-24)
| 바꾼 것 | 이유 |
|---|---|
| 그림 정적 import → 서버가 파일 머리에서 크기를 읽음(`resolveStudy`), 캡처는 `public/`에 그대로 | 콘텐츠 규칙 테스트는 Node(Playwright)에서 도는데 Node는 `.png` import를 못 한다. "크기를 적지 않는다 · 없는 파일은 걸린다"는 그대로 |
| `flow`에 `stop`(몰입 중단 자리 문구)·`caption` | "몰입 중단"도 Por favor, Harry 전용 문구라 데이터로 |
| `phones`에 `label`·`h`·`p` | "어디서든" 폰 화면에도 설명 문단이 붙는다 |
| 타입 이름 `Case` → `Study`, `next` 삭제 | 옛 타입과 한동안 함께 있어야 해서 새 이름. `next`는 지금도 쓰이지 않는다(다음 이야기는 목록 순서) |
