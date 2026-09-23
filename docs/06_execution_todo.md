# Prologue& 포트폴리오 및 마케팅 실행 ToDo

## Phase 1. 브랜드·포트폴리오 기반 결정

- [x] 개인 브랜드명 확정: **Prologue&**
- [x] 핵심 포지셔닝 결정
- [x] 핵심 고객 문제 정의
- [x] 포트폴리오 전체 IA 초안 결정
- [x] PRD 작성 → `07_PRD.md`
- [x] 기술 스택 결정 → Next.js (App Router) + MDX, Vercel 배포 (`07_PRD.md` §8) — 구현 확정: Next 16 App Router + CSS Modules + Vercel
- [x] 문의 수신 방식 결정 → 이메일 알림 + Google Sheets 적재 (`07_PRD.md` §6.3)
- [x] 디자인 방향 결정 → 컬러 13 · 컨셉 14 · 구조 V5 가로 전용(17), 시안 `design/mockups/v5/` 다듬는 중
  - [x] 안별 시안 제작 → `design/mockups/index.html` (5안, 데스크톱 1200px·모바일 400px 비교)
  - [x] 인터랙션 방향 결정 → Rauno 계열 + Lenis, 사이트 전체 5종 (`09_interaction_references.md` §8)
  - [x] 1차 시안 피드백: 빌더 템플릿 느낌 → 구조 재설계 (`10_v2_structure_concepts.md`)
  - [x] v2 구조 시안 A·B·C 제작 → `design/mockups/v2/index.html` (동작하는 인터랙션 포함)
  - [x] 시각 언어 3종을 A·B·C 전부에 적용 → 3×3 = 9조합, 허브의 "9개 한눈에" 모드
  - [x] 피드백 "Rauno 느낌이 아님" → D 포스터형(Rauno 원형 재현) 추가 (`10` §3.4)
  - [x] 구조 확정 → **D 포스터형** (`10` §6, 2026-09-16)
  - [ ] D 브라우저 검증 (데스크톱 1440·모바일 400) — 브라우저 확장 연결 후 진행
  - [x] D 디벨롭 → D1/D2/D3 비교 후 **D2 합본형 채택** (2026-09-16)
  - [x] 컬러·컨셉 리서치 (`12_color_concept_research.md`) → D2 컬러 변형 시안 S1~S4 제작
  - [x] 외부 피드백 "템플릿에 덧붙이는 느낌" → 시안 밖에서 1·2·3을 따로 결정 (2026-09-16)
    - [x] 1. 컬러셋 → 딥 네이비 + 웜 본 (`13_colorset.md`, `design/spec/01-colorset.html`)
    - [x] 2. 디자인 컨셉 → 구조적 편집물 (`14_design_concept.md`, `design/spec/02-concept.html`)
    - [x] 3. 화면 설계 → 세로 한 장 랜딩 + Projects + Case Study + 문의 서랍, D2 대체 (`15_screen_design.md`, `design/spec/03-screens.html`)
    - [x] 브랜드명 의미(Prologue And / End — 처음과 끝을 함께) 반영 + 서명 장치 S1~S4 채택 (`14` §1·§3.7)
  - [x] 4. 합본 시안 제작 → `design/mockups/v3/` (index·projects·case, 데스크톱 1440·모바일 400 확인)
  - [x] 사용자 요청 "V2(Rauno)와 V3를 섞는 구조" → 하이브리드 설계 A안 (`16_hybrid_structure.md`, `design/spec/04-hybrid.html`) — 승인 대기
  - [x] 사용자 요청 "세로 없이 가로만" → 가로 전용 설계 (`17_horizontal_only.md`, `design/spec/05-horizontal.html`) — A안과 병렬 후보
  - [x] 홈 프로젝트 패널에 화면 캡처 없음 결정 → 도형 + 미니 다이어그램 + 결과 숫자(`14` §3.5, `panels.js`)
  - [x] 구조 3안 전부 시안 제작 → `design/mockups/compare.html` (v3 세로 · v4 하이브리드 · v5 가로 전용)
  - [x] 구조 확정 → **V5 가로 전용**(2026-09-16) + 이동 중 축소 추가(`17` §3.9)
  - [ ] v5 다듬기(휠 체감·축소 강도·모바일 확인) → 시안 확정 → 구현 착수
- [x] Prologue& 로고/워드마크 사용 방식 결정 → 변형별 용도·최소 크기 규칙 (`07_PRD.md` §7.2)
- [ ] 공개/IP 범위 확인 → 프로젝트별 체크리스트는 아래 Week 1 §2, 결과는 MDX `disclosure` 필드에 기록

---

# Week 1. 기반 구축

## 1. Prologue& 포트폴리오 구조 확정
- [x] Home / Work / Services / About·Contact 구조 확정
- [x] Home 주요 Section 정의
- [x] Case Study 공통 구조 정의
- [ ] 각 Section의 최종 Copy 초안 작성
- [ ] Prologue& 브랜드 표기 규칙 정리
- [ ] 모바일 우선순위 정의
- [ ] 문의 Conversion Flow 정의

## 2. 공개 가능 범위 확인
프로젝트별:
- [ ] Por favor, Harry
- [ ] Daeryun Learning Hub
- [ ] 병원 UI/UX
- [ ] Custom Commerce

확인사항:
- [ ] 회사명
- [ ] 실제 화면
- [ ] 사용자 데이터
- [ ] 내부 URL
- [ ] 업무 프로세스
- [ ] NDA
- [ ] IP
- [ ] 필요 시 Mockup 재제작

## 3. 공통 Case Study Template 제작
- [ ] Overview
- [ ] Problem
- [ ] Existing Workflow
- [ ] Insight
- [ ] Redesign
- [ ] Solution
- [ ] Before/After
- [ ] Impact
- [ ] What I Learned
- [ ] CTA

## 4. 문의폼 초안
- [ ] 현재 업무
- [ ] 현재 사용도구
- [ ] 문제
- [ ] 사용자 수
- [ ] 반복빈도
- [ ] 기존/신규
- [ ] 목표
- [ ] 일정
- [ ] 예산
- [ ] 연락처

## 5. 콘텐츠 관리표
필드:
- 프로젝트
- 주제
- 콘텐츠 타입
- 채널
- 상태
- 발행일
- 조회
- 클릭
- 문의
- 계약 연결 여부

---

# Week 2. Por favor, Harry

- [ ] Case Study 작성
- [ ] Before Workflow Diagram
- [ ] After Workflow Diagram
- [ ] 핵심 화면 정리
- [ ] Before/After 대표 이미지
- [ ] 대표 블로그 글 1개
- [ ] 파생 블로그 주제 2개
- [ ] Threads 초안 8개
- [ ] Prologue& Portfolio 카드
- [ ] CTA 작성

---

# Week 3. Daeryun Learning Hub

- [ ] Case Study 작성
- [ ] 종이 학습 Flow 시각화
- [ ] 웹 학습 Flow 시각화
- [ ] 핵심 화면 정리
- [ ] Before/After 대표 이미지
- [ ] 대표 블로그 글 1개
- [ ] 파생 블로그 주제 2개
- [ ] Threads 초안 8개
- [ ] Prologue& Portfolio 카드
- [ ] CTA 작성

---

# Week 4. 병원 UI/UX 고도화

- [ ] 개선 전 화면 선정
- [ ] 개선 후 대응 화면 선정
- [ ] 사용자·사용목적 정리
- [ ] 문제점 기록
- [ ] 변경 이유 정리
- [ ] Before/After 최소 3세트
- [ ] Case Study 작성
- [ ] 대표 블로그 글
- [ ] Threads 초안 8개
- [ ] Prologue& Portfolio 카드
- [ ] CTA 작성

---

# Week 5. Custom Commerce

- [ ] 실제 구현 기능 Inventory
- [ ] 사용자 Flow
- [ ] 관리자 Flow
- [ ] Architecture Diagram
- [ ] 직접 구축 이유 정리
- [ ] 핵심 Product/Technical Decision 정리
- [ ] Case Study 작성
- [ ] 대표 블로그 글
- [ ] Threads 초안 8개
- [ ] Prologue& Portfolio 카드
- [ ] CTA 작성

---

# Week 6. 공개 및 판매 채널

## Prologue& 포트폴리오
- [ ] 배포
- [ ] Analytics 연결
- [ ] 문의폼 연결
- [ ] 모바일 검수
- [ ] SEO 기본 설정
- [ ] Prologue& 브랜드 표기 최종 검수

## 블로그
- [ ] 대표 Case Study 게시
- [ ] Prologue& 포트폴리오 링크 연결
- [ ] CTA 연결

## Threads
- [ ] Prologue& 관련 프로필 Copy
- [ ] 포트폴리오 링크
- [ ] 주 2~3회 게시 시작
- [ ] 첫 1개월 콘텐츠 예약

## 크몽
- [ ] 서비스 1 등록: 업무 시스템 UX/Workflow 개선
- [ ] 서비스 2 등록: 업무/MVP 시스템 구축
- [ ] 프로젝트 Portfolio 등록
- [ ] Prologue& 브랜드명 노출 방식 검토
- [ ] 가격/범위/수정횟수/산출물 명확화

---

# 운영 루틴

## 매주
- [ ] Threads 2~3개
- [ ] 문의 확인
- [ ] 고객 문제 DB 업데이트
- [ ] 성과가 좋은 콘텐츠 기록
- [ ] 실제 작업에서 새로운 콘텐츠 소재 저장

## 매월
- [ ] 블로그 2개 이상
- [ ] Prologue& Portfolio 업데이트
- [ ] 채널별 유입/문의 비교
- [ ] 반복되는 고객 문제 확인
- [ ] SaaS 후보 문제 업데이트

---

# 주요 KPI

- Prologue& Portfolio 방문
- Case Study 조회
- 문의 수
- 상담 수
- 견적 수
- 계약 수
- 문의→계약 전환율
- 프로젝트별 문의 기여도
- 반복적으로 등장한 고객 문제 수

팔로워나 단순 조회보다 실제 문의와 계약에 가까운 지표를 우선한다.
