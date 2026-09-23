# Prologue& 시안 → Next.js 이식 설계

| 작성일 | 2026-09-23 |
|---|---|
| 범위 | **Projects 목록 + Case Study 상세 + 문의 서랍**을 Next.js로 옮긴다. 대시보드(v6 경로형)는 다음 단계 |
| 근거 | 시안 `design/mockups/v3`(목록·상세)·`v6`(대시보드), 결정 문서 docs/14(컨셉)·20(전환)·21(문구)·25(장 스키마)·27~28(G안 배치) |
| 결정 | App Router + 서버 컴포넌트 중심(A안) · 자체 API 라우트 + 메일 · TS 데이터 파일 · 화면은 PNG · 같은 저장소 `web/` + Vercel |

## 1. 구조와 라우트

```
web/                              Next 15 · App Router · TypeScript
  app/
    layout.tsx                    폰트, globals.css, 헤더, 문의 서랍(클라이언트)
    page.tsx                      임시 홈: 표지 + Projects 링크 (경로형 대시보드는 범위 밖)
    projects/page.tsx             목록 (서버)
    projects/[slug]/page.tsx      상세 (서버, generateStaticParams)
    api/inquiry/route.ts          문의 수신 (POST)
    globals.css                   토큰·리셋
  components/
    header.tsx footer.tsx inquiry-drawer.tsx project-row.tsx
    case/ pan.tsx cover.tsx screen.tsx hotspots.tsx morph-diagram.tsx wipe.tsx scatter-collage.tsx
    case/ use-stations.ts use-fit-pans.ts use-dwell.ts
    view-transition-link.tsx
  content/ types.ts projects.ts cases/por-favor-harry.ts
  lib/ mail.ts inquiry-schema.ts
  public/screens/pfh/*.png
  tests/ case.spec.ts list.spec.ts
```

- 서버 컴포넌트: 페이지·목록·상세의 글과 그림. 클라이언트: 판 엔진, 핫스팟, morph, 와이프, 콜라주, 문의 서랍, 전환 링크.
- 주소 `/projects`, `/projects/[slug]`. `published: false`인 slug는 **`redirect('/projects')`**.
- 목업(`design/`)과 GitHub Pages는 건드리지 않는다 — 비교용으로 남긴다.

## 2. 상세 판 엔진

시안 `case.js`(227줄)를 훅 셋으로 나눈다.

| 훅 | 하는 일 | 옮길 값 |
|---|---|---|
| `useStations()` | 정거장 목록(판 시작 + 머무름 안 t 0/.5/1), smoothDamp 이동, 휠 스트림·키 입력 | `smooth 0.28`, `WHEEL{gap:100, first:90, more:480}`, lock 160ms |
| `useFitPans()` | 판마다 글 높이를 재고 그림 폭 결정(`--dw`), 문단 폭(`--tw`) | 다이어그램 640:360, 화면 1280:800, 폰 390:844, 표지 0.62 |
| `useDwell(ref)` | 머무름 구간 진행률 t, `translateY` 붙이기 | 구간 120vh, 붙는 위치 top 64 |

- **선택자는 데이터 속성만**: `data-pan`·`data-text`·`data-media`·`data-dwell`·`data-scrub`. CSS Modules가 클래스명을 해시해도 엔진이 끊기지 않는다.
- **`ctrlKey`면 휠을 가로채지 않는다** — 시안의 버그(브라우저 확대 차단)를 옮기지 않는다.
- 측정 시점: `document.fonts.ready` 이후 + `ResizeObserver`. 계산은 두 번 돌려 수렴(문단 폭 ↔ 그림 폭).
- `history.scrollRestoration = 'manual'`, 뒤로가기·해시(`#s06`)는 정거장으로 스냅.

## 3. 전환

- `<ViewTransitionLink>`가 클릭을 가로채 `document.startViewTransition(() => router.push(href))`. 미지원 브라우저는 즉시 이동(폴백 없음 — 장식이다).
- 공유 이름: 목록 행 제목과 상세 표지 H1에 `pj-title`, 헤더에 `hdr`.
- 상세 → 상세는 타입 `to-case`로 제목 morph 없이 좌측 밀림.
- `prefers-reduced-motion`이면 전환·morph·와이프 모두 끄고 최종 상태.

## 4. 데이터와 이미지

```ts
type Pic = { src: string; alt: string; cap: string; w: number; h: number }
type Case = {
  title; cap; meta: [string, string][]; numbers: { value; label; small }[]   // 숫자는 표지에만
  hero: Pic
  s01: { h; p: string[]; pic: Pic }
  s02: { h; p: string[] }                    // 그림 = Before 다이어그램(고정 t=0)
  s03: { h; p: string[] }; s04: { q; p: string[] }; s05: { h; flow: string[]; p: string[] }
  s06: { h; p: string[]; screen: Pic; spots: { x; y; w; h; cap }[]; screens: { lab; h; p: string[]; pic: Pic }[] }
  s07: { h; p: string[]; scatter: { text; from; at }[]; after: Pic }   // Before = 콜라주
  s09: { h; p: string[] }; s10: { p: string[]; next?: string }
}
```

- `content/projects.ts` 6건, `published`는 `por-favor-harry`만. 나머지 3편은 파일 없이 목록에서 "준비 중".
- 이미지는 `public/screens/pfh/` 9장(1280×800, 폰 390×844) + 목록 티저. `next/image`에 실제 픽셀 크기와 `sizes`.
- **흩어진 요청(A + B 결정 2026-09-23)**
  - 02 Problem = **Before 다이어그램**(전화·메신저·이메일·직접 방문 → 담당자가 정리·기억 → 몰입 중단), 정지 상태.
  - 07 Before = **말풍선 콜라주** 컴포넌트. 문장·출처·시각을 데이터로 받는다: `{ text: '단가표에 시작일 좀 넣어주세요', from: '메신저', at: '오전 9:12' }`, `{ text: '그거 어떻게 됐어요?', from: '자리로 찾아옴', at: '오후 2:05' }`, `{ text: '부재중 전화 3통', from: '전화', at: '오전 10:03' }` 등 5~7개. UI를 흉내 내지 않는다(제품 모사·실제 대화 유출을 피한다).
  - iframe 목업은 제품에 넣지 않는다.

## 5. 문의

- 폼 9문항(docs/05 §7 그대로): 현재 업무 / 쓰는 도구 / 가장 불편한 점 / 사용 인원 / 반복 주기 / 개선·신규 / 원하는 결과 / 희망 일정 / 예산 범위. + **연락처(메일, 필수)**, 상세에서 열면 붙는 **프로젝트 slug(숨김)**.
- 2단계: 1단계 = 업무·불편·인원·주기, 2단계 = 나머지 + 연락처. 필수는 **불편한 점**과 **연락처** 둘.
- `POST /api/inquiry` → zod 검증 → `lib/mail.ts` → `{ ok: true }`. 실패 시 서랍에 안내 + `mailto:` 링크.
- 발송은 **Gmail SMTP + 앱 비밀번호**(`PrologueAnd@gmail.com` → 본인, 받는 쪽에서 전달 설정). 도메인이 정해지면 `lib/mail.ts` 구현만 Resend로 교체한다. 키는 Vercel 환경변수(`GMAIL_USER`·`GMAIL_APP_PASSWORD`·`INQUIRY_TO`).
- 스팸 대비는 허니팟 1개 + 5초 미만 제출 차단까지.

## 6. 스타일·폰트

- `globals.css`에 토큰(navy/bone·`--ease-out`)과 리셋, 나머지는 CSS Modules. 시안 `case.css`·`v3.css`에서 상세·목록·헤더·서랍만 옮긴다.
- Bodoni Moda는 `next/font/google`, Pretendard는 npm 패키지를 `next/font/local`로 자체 호스팅(CDN 의존 제거).

## 7. 검증 (수용 기준)

Playwright로 네 폭(2560·1440×900·1280×720·390)에서:

| # | 기준 |
|---|---|
| V1 | 모든 판이 화면 높이 안에 들어오고 넘침 0 |
| V2 | 정거장 개수가 판 구성과 일치하고, 휠 1노치 = 1정거장 |
| V3 | 머무름 구간에서 t가 0 → 0.5 → 1을 다 채우고, 그동안 판이 상단 64에 붙어 있다 |
| V4 | 06 핫스팟 강조 영역이 데이터 좌표(%)와 일치 |
| V5 | 가로 스크롤 없음, 헤더 왼쪽선 = 본문 왼쪽선 |
| V6 | 목록 → 상세에서 제목이 공유 요소로 이동(지원 브라우저) |
| V7 | `published: false` 주소는 목록으로 이동 |
| V8 | 문의: 필수 두 칸이 비면 막고, 채우면 200과 메일 1통 |
| V9 | `prefers-reduced-motion`에서 morph·와이프가 최종 상태로 즉시 |

## 8. 범위 밖

경로형 대시보드 · `?mob=1` 미리보기 · `__spec()` 전역 · 나머지 3편 본문 · 블로그 · SaaS · reCAPTCHA · 다국어.

## 9. 미결

- 실제 도메인(정해지면 메일 발송을 Resend로 교체, 사이트 주소·OG·robots도 그때).
- 나머지 3편의 공개 범위(docs/06 Week 1 §2 체크리스트).
