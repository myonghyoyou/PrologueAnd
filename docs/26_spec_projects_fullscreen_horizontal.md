# SPEC — Projects 전면 페이지 + Case Study 가로 상세

| 작성일 | 2026-09-21 |
|---|---|
| 방식 | SDD. 아래 요구사항(REQ)을 먼저 확정하고, 구현은 REQ를 만족하는지로만 판정한다. 각 REQ에 검증 방법을 적는다(자동 = 페이지의 `window.__spec()`이 돌려주는 결과, 수동 = 사람이 보는 것) |
| 근거 | docs/23(전면·목록), docs/24(H2 가로 상세, 선 62%), docs/25(10장 스키마, 표지 숫자 미리보기, 고객의 말·기술 스택 없음) |
| 산출물 | `v3/v3.css`(헤더·목록 승격), `v3/projects.html`, `v3/case.html` + `v3/case.css` + `v3/case.js` + `v3/cases.js`(데이터), `v6/index.html`·`v6.js`·`v6.css`(시트 삭제·링크·VT) |

## 1. 헤더 (세 문서 공통)
| ID | 요구 | 검증 |
|---|---|---|
| H1 | 대시보드·목록·상세의 `.hdr`는 같은 높이(64px)·같은 브랜드 위치·같은 메뉴 버튼 스타일(40px 테두리 버튼, v6 스타일) | 자동: 세 페이지에서 `.hdr` 높이 64, `.brand` left 동일, `nav a` 높이 40 |
| H2 | `.hdr{view-transition-name:hdr}` — 세 문서 모두. 진행 지도·스트립은 헤더 **밖** 형제 요소 | 자동: `getComputedStyle(hdr).viewTransitionName==='hdr'`, `.pmap`/`.strip`의 부모가 `.hdr`가 아님 |
| H3 | 목록 헤더: 브랜드 → `../v6/index.html#p06`, 메뉴 `Projects`(현재, 클릭 불가 스타일) · `문의` | 자동: 브랜드 href, `nav a.cur` 존재 |
| H4 | 상세 헤더: 왼쪽 브랜드 + 제목(`.who`), 오른쪽 `← Projects` · `NN / 10` · `문의`. 상단바(`.topbar`) 없음 | 자동: `.topbar` 없음, `#hd-title`·`#hd-pos`·`#hd-back` 존재 |
| H5 | 상세 `← Projects`: 목록에서 왔으면 `history.back()`, 아니면 `projects.html` | 수동 |

## 2. 목록 (`projects.html`)
| ID | 요구 | 검증 |
|---|---|---|
| L1 | 시트 밀도가 기본값: 행 padding 16px 28px, 제목 20px, 번호 40px 열 | 자동: `.prow` computed padding, `.h2` font-size |
| L2 | 읽기 폭 max-width 56rem 가운데 | 자동: `.wrap` max-width 896 |
| L3 | 이미지·필터·건수 줄 없음 | 자동: `.prow img` 0개, `#cnt` 없음 |
| L4 | 푸터 행(Projects · 메일 · 문의 · ©)이 문서 끝에 정적으로 | 자동: `.ft` 존재, position static |
| L5 | `?embed=1`을 쓰지 않음 | 자동: 행 href에 `embed` 없음 |

## 3. 대시보드 (`v6`)
| ID | 요구 | 검증 |
|---|---|---|
| D1 | `#sheet`·`#sheet-bd`·`data-sheet` 없음. Projects 링크 3곳(헤더·판 6·푸터)이 `../v3/projects.html` | 자동 |
| D2 | `@view-transition{navigation:auto}` 켜짐, `.hdr` 이름 `hdr` | 자동 |
| D3 | `#p06`으로 진입하면 인트로 없이 Projects 점에 서 있음 | 자동: `V6._dbg().pos === T[6]`, `#knot` dashoffset 0 |
| D4 | 키 입력의 시트 가드 제거(시트가 없으므로) | 자동: `document.getElementById('sheet')===null` |

## 4. 상세 무대 (`case.html`, H2)
| ID | 요구 | 검증 |
|---|---|---|
| C1 | 세로 문서 + Lenis 세로. `.track`은 `position:sticky; top:0; height:100vh; overflow:clip`. `html,body{overflow-x:clip}`. 가로 스크롤바 없음 | 자동: computed 값, `document.documentElement.scrollWidth <= innerWidth` |
| C2 | 장 9개(00 표지, 01, 02, 03~05 묶음, 06, 07, 08, 09, 10)가 데이터(`V3.cases[slug]`, docs/25 §4 스키마)로 렌더. 단계는 10개(04·05는 묶음 안). 다른 slug는 같은 본문 + 제목만 | 자동: `.scene` 9개, `?p=custom-commerce`에서 `#hd-title` 바뀜 |
| C3 | 매핑 `xOf(y)`/`yOf(x)`: 보통 구간 1:1, 머무름 구간(03~05: 160vh, 07: 120vh — Before 있을 때만)은 X 고정·t 진행. 스크롤 범위 = trackWidth − vw + 머무름 합. sticky 부모 높이 = 범위 + 100vh | 자동: `__spec().range`, 부모 높이, `xOf(yOf(x))===x` 표본 5개 |
| C4 | 장 폭: 표지 100vw, 01·02·09 44rem, 03~05 묶음 100vw, 06 80rem, 07 80rem, 08 64rem, 10 100vw. 장 높이 = 100vh − 64, 세로 넘침 없음 | 자동: 각 `.scene` scrollHeight ≤ clientHeight |
| C5 | 선(S1): 트랙 폭 SVG, y = 62vh 고정. 점 = 장 시작 + 48px. 잉크 끝 = x + 45vw. 지난 점 채움 | 자동: `line.y === innerHeight*.62 ± 1`, 점 11개 |
| C6 | 라이브 화면 배율 = min(폭/1280, 높이/800). 1280×720에서도 잘리지 않음 | 자동: `.shot.live` rect가 장 rect 안 |
| C7 | 진행 스트립: 헤더 밖, 칸 10개(단계 01~10) 같은 폭, 현재·지난 표시, 클릭 → 그 단계의 정거장으로 이동. 묶음 안에서는 t로 03/04/05를 가른다. `NN / 10`도 갱신 | 자동: 칸 10, 클릭 후 `__spec().step` |
| C8 | 키: ←/→/↑/↓/PgUp/PgDn/Space/Home/End 가로채서 **정거장** 단위 이동(장 시작, 묶음은 t 0/.5/1, 07은 t 0/1) | 자동: keydown 후 `__spec().step` 순서 1,2,3,4,5,6,7,7,8,9,10 |
| C9 | 창 크기 변경 시 같은 장에 서 있음 | 자동: resize 이벤트 후 `cur` 동일 |
| C10 | 표지 오른쪽 아래 힌트 "→ 굴리면 옆으로", 첫 스크롤 뒤 사라짐 | 자동: `.hint` opacity |
| C11 | 해시 `#s07` 등으로 진입하면 그 장에 즉시 | 자동 |

## 5. 상세 인터랙션 (docs/23 §11 → 가로)
| ID | 요구 | 검증 |
|---|---|---|
| I1 | 03~05 머무름: 다이어그램은 묶음 왼쪽, 글 03·04·05는 오른쪽 세로 배열. t 0→1로 morph(기존 `morph(t)` 재사용), t 구간별로 03/04/05 글 강조 | 자동: y=y_3+dwell/2에서 `morph t≈.5` |
| I2 | 07 머무름(Before 있을 때): 같은 자리 두 화면, 경계선이 왼→오른쪽. Before 없으면 머무름 없고 After 한 장 | 자동: `#wipe` clip-path 값 변화 |
| I3 | 06 핫스팟: 캡션 ≤3, 호버(터치: 탭) 시 화면 위 해당 영역만 밝게, 번호 배지 | 자동: hover 후 `.spot-hl` 위치 = spot 좌표 |
| I4 | 08 막대: 전·후 값이 있는 항목만, 잉크가 08 점을 지나면 0.6s에 그려짐 | 자동: `.bar i` width > 0 after passing |
| I5 | 10: 문의 CTA + 오른쪽 "다음 이야기" 판, 선이 그 밑줄로 이어짐, 호버 시 밑줄 늘어남 | 수동 + 자동(`.next` 존재) |
| I6 | 전환: 목록→상세 A(제목 공유) 유지, 상세→상세 `to-case` 타입으로 root translateX, 그때 H1 이름 제거. 상세→목록 제목 복귀 | 수동(Chrome) + 자동: `pageswap` 리스너 존재 |
| I7 | 표지 `numbers[3]`와 08 `numbers[3]` 같은 값 | 자동: 텍스트 비교 |

## 6. 모바일·접근성
| ID | 요구 | 검증 |
|---|---|---|
| M1 | <1024: `.track` static, 장 세로 스택, 선은 왼쪽 세로 1px, 스트립·힌트 숨김, 머무름 정적(morph t=1, Before/After 두 장) | 자동(iframe 390px): `.track` position static, 문서 가로 넘침 없음 |
| A1 | `prefers-reduced-motion`: Lenis 없음, 머무름 변형은 구간 중간에서 최종 상태로 즉시, 전환 없음 | 수동 |
| A2 | 대시보드·목록·상세 모두에서 문의 서랍이 같은 위치·동작 | 자동: `#drawer` 존재 |

## 7. 범위 밖 (만들지 않음)
선 끝 `&` 마커 · 이동 중 축소 · Ctrl+F 대응 · 고객의 말 · 기술 스택 표기 · D9 글자 스크럽 · D10 십자선 · `?embed=1` 경로(코드 삭제).

## 8. 순서
1. 헤더 통일 + 목록 승격 + 대시보드 시트 삭제 (H·L·D)
2. 상세 데이터·무대·매핑·선·스트립·키 (C)
3. 머무름·핫스팟·막대·다음 이야기·전환 (I)
4. 모바일·감속 (M·A), `__spec()` 전 항목 통과 → 커밋

## 9. 검증 결과 (2026-09-21, Chrome, `window.__spec()`)
| ID | 결과 | 값 |
|---|---|---|
| H1 | 통과 | 세 페이지 `.hdr` 64px, 브랜드 left 112, 메뉴 40px |
| H2 | 통과 | `viewTransitionName: hdr` 세 문서. 스트립·진행 지도 부모가 `.hdr` 아님 |
| H3·H4 | 통과 | 브랜드 → `#p06`, `nav a.cur`, `.topbar` 없음 |
| H5 | 통과(흐름) | 대시보드 → 목록 → 상세 → `← Projects`(history.back) → 상세 → 다음 이야기 → 브랜드 → 대시보드 `#p06`(pos 5268 = Projects 점) |
| L1~L5 | 통과 | padding 16px 28px, h2 20px, 열 40px, max-width 896, img 0, `#cnt` 없음, `.ft` static, embed 없음 |
| D1~D4 | 통과 | 시트 없음, Projects 링크 3곳, VT 켜짐, `#p06` 진입 시 pos = T[Projects] |
| C1 | 통과 | sticky·clip·bodyClip, scrollWidth ≤ vw |
| C2 | 통과 | 장 9, 제목 교체 |
| C3 | 통과 | 범위 11096(1440×900), wrapH = 범위 + vh, 왕복 표본 5개 일치 |
| C4 | 통과 | 1440×900·1920×1080 넘침 0. 1280×720은 묶음 장이 넘쳐 `max-height:800px` 규칙 추가 후 0 |
| C5 | 통과 | ly = 62vh(558@900, 446@720, 670@1080), 점 9 |
| C6 | 통과 | 배율 .58~.92, 화면 rect가 장 안 |
| C7 | 통과 | 칸 10, 폭 29/26, 단계 03→04→05가 t로 갈림, `NN / 10` 갱신 |
| C8 | 통과 | → 키 11번: 1,2,3,4,5,6,7,7(와이프 끝),8,9,10. ← 키 역순 |
| C9 | 통과 | resize 후 step 6 유지, x 동일 |
| C10 | 통과 | y > 40에서 `.hint.off` |
| C11 | 통과 | `#s07` 진입 → step 7, y 8326 |
| I1 | 통과 | 묶음 중간 y에서 morphT .5, 04만 `.on` |
| I2 | 통과 | 07 t=0 → clip 100%, t=1 → 0%, 경계선 left 0→100% |
| I3 | 통과 | 캡션 2 → `.spot-hl` 위치 26.1/49/47.9(%) = 데이터, 배지 3 |
| I4 | 통과 | 08 점을 지나면 `.bar.on`, 막대 25% = 1/4 |
| I5 | 통과 | `.next a` 밑변이 선 8px 위, 링크 = 다음 프로젝트 |
| I6 | 부분 | `pageswap`/`pagereveal` 처리 있음. 실제 전환 모양(왼쪽 밀림·제목 공유)은 사람이 Chrome에서 확인 |
| I7 | 통과 | 표지 숫자 = 08 숫자 |
| M1 | 통과 | 390px: `.track` static, scrollWidth 373 < 388, 선·스트립·힌트 숨김, morph t=1, After 정적 |
| A1 | 미확인 | reduced-motion은 사람이 확인 |
| A2 | 통과 | 세 페이지 `#drawer` 존재 |
