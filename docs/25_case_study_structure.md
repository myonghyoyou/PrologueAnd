# Case Study 상세 구성 — 에이전시 사례 검토와 표준 구성

| 작성일 | 2026-09-21 |
|---|---|
| 상태 | **결정 완료**(2026-09-21): 표지 숫자 미리보기 넣음 · 고객의 말 없음 · 함께 쓴 것 없음 |
| 전제 | 상세는 H2 가로(docs/24). **프로젝트마다 구성 데이터가 같아야 한다**(2026-09-21 사용자). 시안은 Por favor, Harry 본문 하나로 만들고 "다음 이야기"도 같은 본문으로 넘어간다 |
| 목적 | 10장의 이름·순서·각 장에 들어가는 데이터 필드를 확정해, 프로젝트 4개가 같은 틀로 채워지게 한다 |

## 1. 본 것

직접 열어 장 순서를 적은 것만 표에 넣었다(SPA라 본문이 안 읽히는 곳 — Plus X, DFY, 펜타브리드, 이모션글로벌, Work & Co 상세 — 은 제외).

| 에이전시 | 성격 | 상단 메타 | 장 순서 | 숫자(결과) 위치 | 끝 |
|---|---|---|---|---|---|
| ustwo (RVO Health) | 제품 디자인·개발, 영국/미국 | 클라이언트·산업·서비스·연도 | 표지 → 개요 → **Impact 숫자 3개** → 고객 영상 인용 → Challenge → 협업 방식 → 접근(불릿) → 다음 계획 → CTA | **두 번째 장** | "Have an idea?" CTA, 다음 프로젝트 없음 |
| Instrument (EA) | 브랜드·디지털, 미국 | 클라이언트·서비스 | 소개 → Challenge → 주제 챕터 4~5(제목 + 문단 + 전폭 이미지) → 고객 인용 → 챕터 2 → **Our Role** | 없음(브랜드) | 역할 표 → CTA → 뉴스레터 |
| Huge (CoinTracker) | 디지털 에이전시, 미국 | 클라이언트·서비스 | 표지 → 개요 불릿 → 맥락 → 문제(숫자 인용) → 주제 챕터 6 → **Outcomes 숫자 3개** → 캠페인 이미지 | **끝에서 두 번째** | 뉴스레터, 다음 프로젝트 없음 |
| Fueled (Microsoft) | 앱·웹 개발, 미국 | 클라이언트·태그(AI·Backend·Design·Research·Web) | 표지(태그) → 개요 → 챕터 3(설계 / AI 백엔드 / **기술 스택·성능**) → 마무리 + 숫자 1개 → "Work with Us" | 끝 | **"More projects" 캐러셀** |
| Metalab (Midjourney) | 제품 디자인, 캐나다 | 클라이언트·**유형(Product)·단계(Startup)**·서비스 | 표지 + 큰 화면 → (이하 본문 미확인) | — | — |
| Clay (목록) | 디자인·개발, 미국 | 목록에 **분야 태그 + 맥락 라벨**(Fintech, B2B, SaaS, Startup) | — | 숫자 없음 | — |
| 라이트브레인 (신세계) | UX 에이전시, 국내 | 클라이언트·서비스(UX 기획·GUI) | **Situation → Strategy → Main Structure → 화면(패널)별 설명 4~6 → Design Element** | **없음** | 뉴스레터·채용·프로젝트 문의 폼 |
| 디지털 인사이트 구축 사례 | 국내 에이전시 사례 DB | **수상·부문·클라이언트·제작사·런칭일** 표 | 요약만 | 없음 | 같은 제작사의 다른 프로젝트 8개 |

글로 정리한 지침 두 곳도 같은 방향이다: 결과 → 이야기 → 방법 → 영향 순으로 "결과 먼저"(zmistandcopy), 제목은 "영향 + 범위 + 제품명"(uxfol.io).

## 2. 읽어 낸 규칙

| # | 규칙 | 근거 |
|---|---|---|
| R1 | **상단 메타 표는 어디나 있다.** 클라이언트·서비스는 필수, 연도·산업·유형·단계는 선택 | 8곳 전부. Metalab의 "유형·단계"가 우리 "회사든 개인이든"에 맞는 축 |
| R2 | **결과 숫자는 앞이나 끝, 둘 중 하나에 세 개.** 중간에 흩어 두지 않는다 | ustwo(앞), Huge·Fueled(끝). 셋 다 3개 이하 |
| R3 | **뼈대는 고정, 가운데 챕터는 가변.** Challenge → 챕터 2~6 → 인용 → 결과 | Instrument·Huge·Fueled 모두 "제목 + 문단 + 전폭 이미지" 챕터를 반복. 우리 규칙(구성 동일)과는 여기가 다르다 → 챕터 수를 고정한다 |
| R4 | **고객의 말이 있으면 넣는다.** 영상·인용 한 곳 | ustwo·Instrument. 국내 UX 에이전시는 없음 |
| R5 | **개발 에이전시는 기술·역할을 뒤에 둔다.** 앞은 문제와 사람 | Fueled(스택은 3번째 챕터 끝), Instrument(Our Role 마지막). docs/05 "Built with는 하단 보조" 결정과 같다 |
| R6 | **국내 UX 에이전시는 화면별 설명이 본문이고 숫자가 없다.** 우리는 이걸 따라가지 않는다 | 라이트브레인. 우리 포지션(docs/01: 문제 → 워크플로 → 제품 → 영향)과 다름 |
| R7 | **끝은 CTA + 다음 프로젝트.** 다음 프로젝트 링크가 없는 곳(ustwo·Huge)은 CTA만 | Fueled 캐러셀, 디지털 인사이트 8개 목록. 우리는 가로라 "오른쪽 다음 한 편" |
| R8 | **"배운 것" 장은 에이전시에 없다.** 개인 브랜드에서만 의미 | 8곳 모두 없음. 있으면 차별점, 없어도 표준 |

## 3. 지금 10단계와 대조

| 지금(docs/03 §5) | 규칙 대조 | 판단 |
|---|---|---|
| 01 Overview | R1 메타는 표지에 있음 ✓. 결과 숫자는 08까지 안 나옴 → R2 위반 | 표지에 **숫자 3개 미리보기** 추가 |
| 02 Problem | Challenge ✓ | 유지 |
| 03 Existing Workflow · 05 Redesign | 에이전시엔 없는 우리만의 장(morph). 포지션의 핵심 | 유지. 04 Insight를 사이에 두는 것도 유지 |
| 06 Solution | 챕터 "제목 + 문단 + 화면" ✓ | 유지. 화면 핫스팟(docs/23 D4) |
| 07 Before & After | 우리만의 장. Before 화면이 없는 프로젝트가 있음 | **유지하되 필드 규칙**: Before 화면이 없으면 "전 워크플로 그림 vs 후 화면" |
| 08 Impact | R2 ✓(끝 쪽 숫자 3개) | 유지. 고객의 말(R4)은 넣지 않음(결정 2) |
| 09 What I Learned | R8 | 유지(차별점). 문단 1개로 상한 |
| 10 비슷한 문제가 있다면 | R7 CTA ✓ + 다음 이야기 ✓ | 유지 |
| (없음) 역할·기술 | R5 | 표지 메타 표에 "역할"만. 기술 스택 표기는 넣지 않음(결정 3) |

결론: **10장 이름·순서는 그대로**. 바꾸는 것은 (1) 표지에 결과 숫자 미리보기, (2) 각 장의 데이터 필드를 고정. 고객의 말·기술 스택 표기는 넣지 않는다.

## 4. 표준 구성 — 장별 데이터 필드

같은 스키마를 프로젝트 4개가 모두 채운다. `필수`는 비면 발행 불가, `선택`은 비면 그 블록만 빠진다(장은 남는다). 가로 장 폭·머무름은 docs/24 §4.1.

| 장 | 이름 | 필수 | 선택 | 가로 장 폭 |
|---|---|---|---|---|
| 00 | 표지 | `title`(결과 문장, "영향 + 범위 + 제품" 형식), `cap`(Prologue & 제품명 · 문제 유형), `meta{역할, 기간, 사용자, 공개 범위}`, `numbers[3]{value, label}` | `hero`(라이브 화면 또는 정지 이미지) | 100vw |
| 01 | Overview | `p`(문단 1) | — | 44rem |
| 02 | Problem | `p`(문단 1~2) | `quote`(사용자의 말 한 줄) | 44rem |
| 03 | Existing Workflow | `p`, `before{nodes, edges}`(morph 앞 상태) | — | 머무름 03~05 (다이어그램 왼쪽 고정, 글 3개 나란히) |
| 04 | Insight | `p`(한 문장 크게 + 문단 1) | — | ″ |
| 05 | Redesign | `p`, `after{nodes, edges}`(morph 뒤 상태) | — | ″ |
| 06 | Solution | `p`, `screen`(라이브 화면 또는 이미지) | `spots[≤3]{x,y,w,h,cap}` | 80rem |
| 07 | Before & After | `p`, `after`(화면) | `before`(화면). 없으면 03의 다이어그램이 Before 자리 | 머무름 07 (Before 있을 때만) |
| 08 | Impact | `numbers[3]{value, label, small}`(표지와 같은 값) | `bars[≤3]{label, before, after, unit}` | 64rem |
| 09 | What I Learned | `p`(문단 1) | — | 44rem |
| 10 | 비슷한 문제가 있다면 | `p`, `cta`(문의, `data-project`), `next{slug}` | — | 100vw (다음 이야기 판 포함) |

- 표지 `numbers`와 08 `numbers`는 같은 배열을 두 번 그린다(R2: 앞에서 예고, 끝에서 확인). 08의 `bars`는 전·후 값이 있는 항목만.
- 라이브 화면이 없는 프로젝트(3개)는 `hero`·`screen`·`after`에 정지 이미지(`v2/img/{slug}.png`)를 쓴다. 필드는 같고 종류만 다르다(`{type:'live'|'img', src}`).
- `p`는 docs/21 규칙. 장당 문단 상한: 01·04·09는 1, 02·05·06·07은 2, 03은 1 + 다이어그램.
- 지금 `V3.projects`(v3.js)의 `title/tagline/tags/year/problem/featured`는 목록용으로 유지하고, 상세 데이터는 `V3.cases[slug]`로 분리한다. 시안은 `por-favor-harry` 하나를 채우고 다른 slug는 같은 본문 + 제목만 바꿈(현재 방식).

## 5. 결정 기록 (2026-09-21)
1. 표지에 결과 숫자 3개 — **넣는다.** (2026-09-23 개정: 마지막 판의 08 Impact 반복은 중복이라 삭제, 숫자는 **표지에만** 두고 설명 한 줄을 붙인다.)
2. 고객의 말 — **받지 않는다.** `quote` 필드 없음.
3. "함께 쓴 것"(기술 스택) — **불필요.** `built` 필드 없음. docs/05의 "Built with 하단 보조" 결정은 이 결정으로 대체.

## 출처
- ustwo RVO Health https://ustwo.com/work/rvo-health/ · Instrument EA https://www.instrument.com/work/electronic-arts · Huge CoinTracker https://www.hugeinc.com/case-study/cointracker · Fueled Microsoft https://fueled.com/work/microsoft/ · Metalab https://www.metalab.com/work/midjourney · Clay https://clay.global/work · 라이트브레인 신세계 https://rightbrain.co.kr/portfolio-item/shinsegae/ · 디지털 인사이트 https://ditoday.com/project/신세계백화점-스토어-모바일앱/ · 구조 지침 https://www.zmistandcopy.com/blog/how-to-write-case-studies · https://blog.uxfol.io/ux-case-study-template/
