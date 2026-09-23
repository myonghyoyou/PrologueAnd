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

핫스팟·morph·와이프는 **자기 판 안의 `ref`로만** 대상을 잡는다(시안의 `#solbox` 같은 전역 id 참조를 옮기지 않는다).

- **선택자는 데이터 속성만**: `data-pan`·`data-text`·`data-media`·`data-dwell`·`data-scrub`. CSS Modules가 클래스명을 해시해도 엔진이 끊기지 않는다.
- **`ctrlKey`면 휠을 가로채지 않는다** — 시안의 버그(브라우저 확대 차단)를 옮기지 않는다.
- 측정 시점: `document.fonts.ready` 이후 + `ResizeObserver`. 계산은 두 번 돌려 수렴(문단 폭 ↔ 그림 폭).
- `history.scrollRestoration = 'manual'`, 뒤로가기·해시는 정거장으로 스냅.
- **판 id 규칙**: `s00`(표지) `s01` `s02` `s03`(03~05 머무름) `s06` `s06-1`…`s06-6`(화면별) `s07`(머무름) `s09`(마지막). 해시 진입과 키 이동이 이 id를 쓴다.

## 3. 전환

- `<ViewTransitionLink>`가 클릭을 가로채 `document.startViewTransition(() => router.push(href))`. 미지원 브라우저는 즉시 이동(폴백 없음 — 장식이다).
- 공유 이름: 상세 표지 H1에 `pj-title`(항상), 헤더에 `hdr`(세 화면 공통).
- **목록 쪽은 클릭한 행에만** `pj-title`을 붙인다 — `view-transition-name`은 문서에 하나만 있어야 하므로, 클릭 직전에 그 행에 부여하고 전환이 끝나면(`finished`) 제거한다. 돌아올 때는 `sessionStorage('vt-slug')`로 행을 찾아 같은 방식으로 붙였다 뗀다. 여러 행에 동시에 붙으면 전환이 통째로 무시된다.
- 상세 → 상세는 타입 `to-case`로 제목 morph 없이 좌측 밀림.
- `prefers-reduced-motion`이면 전환·morph·와이프 모두 끄고 최종 상태.

## 4. 데이터와 이미지

```ts
type Pic = { src: string; alt: string; cap: string; w: number; h: number }
type Case = {
  title; cap; meta: [string, string][]; numbers: { value; label; small }[]   // 숫자는 표지에만
  hero: Pic
  s01: { h; p: string[]; pic: Pic }
  s02: { h; p: string[]; diagram: 'before' } // 그림 = 다이어그램을 t=0 으로 고정 렌더 (07 데이터를 참조하지 않는다)
  s03: { h; p: string[] }; s04: { q; p: string[] }; s05: { h; flow: string[]; p: string[] }
  s06: { h; p: string[]; screen: Pic; spots: { x; y; w; h; cap }[]; screens: { lab; h; p: string[]; pic: Pic }[] }
  s07: { h; p: string[]; scatter: { text; from; at }[]; after: Pic }   // Before = 콜라주, After = 화면
  s09: { h; p: string[] }; s10: { p: string[]; next?: string }   // next 가 없거나 공개된 편이 없으면 티저는 "Projects / 나머지 작업은 정리하는 대로 올립니다"
// Case 가 없는 slug 는 목록에서 "준비 중", 상세는 redirect('/projects')
}
```

- `content/projects.ts` 6건, `published`는 `por-favor-harry`만. 나머지 3편은 파일 없이 목록에서 "준비 중".
- 이미지는 `public/screens/pfh/` 9장(1280×800, 폰 390×844) + 목록 티저. `next/image`에 실제 픽셀 크기와 `sizes`.
- **흩어진 요청(A + B 결정 2026-09-23)**
  - 02 Problem = **Before 다이어그램**(전화·메신저·이메일·직접 방문 → 담당자가 정리·기억 → 몰입 중단), `t=0` 정지 상태. 03~05 머무름은 같은 그림이 바뀌는 과정이므로 역할이 나뉜다.
  - 07 = **와이프 유지**(2026-09-23). 와이프는 두 요소를 같은 상자에 겹쳐 `clip-path`로 가르므로 **콜라주와 화면의 크기가 같아야 한다** → 콜라주는 화면과 같은 **1280 × 800 비율의 고정 상자** 안에 담고, 글자 크기는 상자 폭에 비례(`cqw` 또는 `--dw` 기반)로 정한다. 상자 폭은 `useFitPans`가 화면과 동일하게 계산한다.
  - 07 Before = **말풍선 콜라주** 컴포넌트. 문장·출처·시각을 데이터로 받는다: `{ text: '단가표에 시작일 좀 넣어주세요', from: '메신저', at: '오전 9:12' }`, `{ text: '그거 어떻게 됐어요?', from: '자리로 찾아옴', at: '오후 2:05' }`, `{ text: '부재중 전화 3통', from: '전화', at: '오전 10:03' }` 등 5~7개. UI를 흉내 내지 않는다(제품 모사·실제 대화 유출을 피한다).
  - iframe 목업은 제품에 넣지 않는다.

## 5. 문의

- 폼 9문항(docs/05 §7 그대로): 현재 업무 / 쓰는 도구 / 가장 불편한 점 / 사용 인원 / 반복 주기 / 개선·신규 / 원하는 결과 / 희망 일정 / 예산 범위. + **연락처(메일, 필수)**, 상세에서 열면 붙는 **프로젝트 slug(숨김)**.
- 2단계: 1단계 = 업무·불편·인원·주기, 2단계 = 나머지 + 연락처. 필수는 **불편한 점**과 **연락처** 둘.
- `POST /api/inquiry` → zod 검증 → `lib/mail.ts` → `{ ok: true }`. 실패 시 서랍에 안내 + `mailto:` 링크.
- **발송**: Gmail SMTP + 앱 비밀번호. 보내는 계정과 받는 주소가 모두 `PrologueAnd@gmail.com`이다(`GMAIL_USER` = `INQUIRY_TO`).
- **수신**: 그 편지함에서 Gmail 전달(Settings → Forwarding)로 실제 사용 주소에 자동 전달한다. 코드는 전달을 모른다 — 주소가 바뀌어도 배포가 필요 없다.
- 앱 비밀번호는 계정에 2단계 인증이 켜져 있어야 만들 수 있다. 키는 Vercel 환경변수(`GMAIL_USER`·`GMAIL_APP_PASSWORD`·`INQUIRY_TO`), 저장소에 넣지 않는다.
- 도메인이 정해지면 `lib/mail.ts` 구현만 Resend로 교체한다(API 계약·폼·화면은 그대로).
- 스팸 대비는 허니팟 1개 + 5초 미만 제출 차단까지.

## 6. 스타일·폰트

- `globals.css`에 토큰(navy/bone·`--ease-out`)과 리셋, 나머지는 CSS Modules. 시안 `case.css`·`v3.css`에서 상세·목록·헤더·서랍만 옮긴다.
- **격자 공식**(넓은 화면 포함): 본문 컨테이너 `max-width: clamp(1272px, 80vw, 1760px)`, 좌우 여백 72px 대칭. 헤더는 같은 컨테이너에 맞춰 `padding: 0 max(72px, calc((100% - clamp(1272px,80vw,1760px)) / 2 + 72px))`. 글자는 `clamp()`로 창 폭에 비례(제목 40~64, 본문 16~22, 표지 H1 44~72).
- **옮기지 않는 것**: `v3.css`의 `.case-head*`·`.nrail`·`.topbar`·`.shot.live`와 iframe 관련 규칙, `::view-transition-*(pj-title)` 중 `.case-head .h1` 선택자(상세가 `.h1x`로 바뀌었다). 대시보드(v6) 전용 규칙 전부.
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

## 8. 배포

- Vercel, 루트 디렉터리 `web/`. 도메인이 정해질 때까지 **Vercel 기본 주소**를 쓴다(2026-09-23 결정).
- `metadataBase`는 `NEXT_PUBLIC_SITE_URL`에서 읽고, 기본 주소로 도는 동안에는 `robots: noindex` — 브랜드 주소가 확정되기 전에 색인되지 않게. 도메인이 붙으면 환경변수만 바꾼다.
- 환경변수: `NEXT_PUBLIC_SITE_URL`·`GMAIL_USER`·`GMAIL_APP_PASSWORD`·`INQUIRY_TO`.
- 기존 GitHub Pages(목업)는 그대로 둔다 — 비교용.

## 9. 범위 밖

경로형 대시보드 · `?mob=1` 미리보기 · `__spec()`·`window.__case` 전역(테스트로만) · iframe 목업(`v2/img-src.html`)과 `.shot.live` 규칙 · 나머지 3편 본문 · 블로그 · SaaS · reCAPTCHA · 다국어.

## 10. 미결

- 실제 도메인(정해지면 메일 발송을 Resend로 교체, `NEXT_PUBLIC_SITE_URL`·OG·robots도 그때).
- 나머지 3편의 공개 범위(docs/06 Week 1 §2 체크리스트).
- `PrologueAnd@gmail.com`의 2단계 인증·앱 비밀번호 발급 — 안 되면 폼 서비스(Formspree 등)로 대체하고 `lib/mail.ts`만 교체한다.

## 11. 검토 반영 (2026-09-23)

`/reviewing-plans-for-gaps` 결과를 반영했다.
| 지적 | 반영 |
|---|---|
| 와이프는 두 요소 크기가 같아야 성립 | 콜라주를 1280:800 고정 상자에 (§4) |
| 02가 07 데이터를 참조 | `s02.diagram: 'before'`로 분리 (§4) |
| 공유 요소 이름이 여러 행에 붙으면 전환이 깨짐 | 클릭한 행에만 부여·해제 규칙 (§3) |
| 핫스팟이 전역 id에 묶임 | 판 안 `ref`로 (§2) |
| 판 id 체계 없음 | `s00`~`s09` 규칙 명시 (§2) |
| 다음 이야기 폴백 없음 | 타입 주석에 명시 (§4) |
| 넓은 화면 격자 공식 없음 | `clamp(1272px,80vw,1760px)`·여백 72 (§6) |
| 배포 절이 통째로 빠짐 | §8 신설 (기본 주소·noindex·환경변수) |
| 안 옮길 CSS 목록 없음 | §6에 목록, §9에 추가 |

## 12. 시안 대조 수정 (2026-09-23)

상세를 시안(`design/mockups/v3/case.html`)과 같은 창·같은 정거장 16곳에서 나란히 캡처하고 글·그림·캡션 좌표를 비교했다. 수정 뒤 1440×900·1280×720 모두 정거장 위치는 완전히 같고, 판 안 요소 차이는 0~2px이다.

| 차이 | 원인 | 수정 |
|---|---|---|
| 한 칸 이동이 0.5초(시안 1.2초), 빠른 두 칸 중 하나가 사라짐, 머무름 판이 이동 중 6px 흔들림 | 정거장 이동을 Lenis `scrollTo`(0.55s easeOutCubic, `lock`)로 했고, 잠금 중 입력을 버렸고, 붙이기가 다음 프레임의 scroll 이벤트를 기다림 | `use-stations`를 시안 엔진으로: smoothDamp 0.28(속도 이어받기), 잠금 중 입력 큐, 매 프레임 위치를 옮긴 직후 scroll 을 직접 보내 같은 프레임에 붙인다. docs/17 §10에서 Lenis 를 정거장 이동에서 뺀 이유와 같다 |
| 머무름 마지막 정거장(05·07 After)에서 판이 헤더 밑으로 64px 들어가 라벨이 가려짐 | 정거장을 `구간 위 + 범위×k`로 계산 — 붙이기는 `구간 위 − 64`부터라 k=1 에서 어긋난다. **시안에도 같은 버그** | 양쪽 모두 `구간 위 − 64 + 범위×k`. 이제 k 가 그대로 진행률 t 이고 판은 늘 64 |
| 라벨·캡션·메타 표 줄 높이가 조금씩 작음(캡션 22→15px) | `body`에 시안의 `font-size:16px; line-height:1.7`(v3.css:17)이 빠짐 | `globals.css` body 에 추가 |
| 캡션이 그림 아래가 아니라 격자 왼쪽 끝에서 전체 폭으로 | 캡션 폭을 `--dw`로 줬는데 `--dw`는 그림 요소에만 걸려 형제인 캡션이 물려받지 못함 | `--tw`(판에 걸림, 시안 case.css:22). 표지 캡션 14px |
| 그림이 2~5px 길어짐 | 그림 틀에 `overflow:hidden`이 없어 aspect-ratio 상자의 `min-height:auto`가 그림에 끌림 | 시안 `.shot.img`처럼 `overflow:hidden` |
| 상세 헤더에 `← Projects`와 `Projects`가 둘 다 | 헤더가 상세에서도 nav 의 Projects 를 그림 | 상세는 `← Projects · 문의`만(시안 case.html:19-20) |
| 05 판에 다섯 단계 칩 줄이 붙어 다이어그램이 작아지고, 칩은 새 용어·다이어그램은 옛 용어(요청폼·심사 Queue·약속일) | 구현 계획에만 있던 줄 | 칩 줄 삭제(시안과 같게), 다이어그램 라벨을 본문 용어로(요청 링크·요청 양식·심사 대기열·처리 예정일·진행 상황 안내) — 시안도 같이. `s05.flow` 데이터는 쓰는 곳이 없어져 삭제 |
| 마지막 판 간격·라벨 크기, 버튼 ▸ 없음, 낮은 창(≤800) 규칙 일부 누락 | 옮길 때 빠짐 | 시안 case.css:42-47·81-88 대로 |

**그대로 둔 차이(§4의 결정)**: 02 = Before 다이어그램(시안은 재현 화면), 07 Before = 말풍선 콜라주(시안은 iframe 재현 화면), 메일 주소 `PrologueAnd@gmail.com`(시안은 옛 주소). 07 캡션 문구가 달라 1280×720 에서 그림 높이가 34px 다른 것도 이 결정에서 나온다.

**테스트 서버**: `playwright.config.ts`의 webServer 를 `npm run dev` → `npm run build && npm run start` 로 바꿨다. 개발 서버는 이 스위트의 병렬 부하에서 새 경로 커밋이 `lib/route-commit`의 500ms 안전장치를 넘어(실측 502ms) C1 이 무작위로 실패했다. 프로덕션은 같은 부하에서 31~56ms. 수정 뒤 전체 180 통과.
