/** 홈 문구 — 편집형 세로 페이지(P1). 문구 기준은 docs/21, 사실은 사례 본문(content/studies)에서만 가져온다 */
export const HERO = {
  label: 'Prologue& (프롤로그엔) · 1인 스튜디오',
  h: ['업무 시스템과', '홈페이지를', '만듭니다.'],
  services: ['업무 시스템 화면 개선', '업무 시스템 개발', '맞춤 웹 서비스 개발', '홈페이지 제작'],
  p: '엑셀·종이·메신저로 하던 회사 일을 업무 시스템으로 옮기고, 가게와 브랜드의 홈페이지를 만듭니다.',
};

export const HOW = {
  h: ['만들기 전에', '지금 어디가 불편한지 듣습니다.'],
  steps: [
    { t: '듣기', p: '업무 시스템은 일이 어디서 들어오고 누가 같은 내용을 몇 번씩 옮겨 적는지부터 봅니다. 홈페이지는 고객이 무엇을 찾으러 오는지부터 정리합니다.' },
    { t: '설계와 개발', p: '업무 시스템은 화면 설계부터 개발까지 직접 합니다. 홈페이지는 디자이너와 함께 디자인을 정하고, 개발은 제가 맡습니다.' },
    { t: '오픈한 뒤', p: '실제로 쓰기 시작하면 처음엔 보이지 않던 불편이 나옵니다. 그런 곳이나 오류가 생기면 고칩니다.' },
  ],
};

/** 할 수 있는 일 — 관련 작업은 공개된 사례의 slug */
export const CAN = {
  p: '팀이 함께 쓰는 업무 시스템도, 혼자 쓰는 작은 도구도 만듭니다. 개발 용어를 몰라도 지금 불편한 점만 말씀해 주시면 됩니다.',
  rows: [
    { v: '고치기', name: '업무 시스템 화면 개선', d: '지금 쓰는 시스템에서 불편한 화면을 고칩니다.', rel: ['hospital-ux'] },
    { v: '옮기기', name: '업무 시스템 개발', d: '엑셀·종이·메신저로 하던 일을 웹 화면으로 옮깁니다.', rel: ['por-favor-harry', 'problem-bank', 'shift-board'] },
    { v: '만들기', name: '맞춤 웹 서비스 개발', d: '아이디어를 처음 써 볼 수 있는 웹 서비스로 만듭니다.', rel: [] },
    { v: '홈페이지', name: '홈페이지 제작', d: '가게와 브랜드의 홈페이지를 만듭니다.', rel: [] },
  ],
};

export type Shot = { src: string; w: number; h: number; alt: string; label?: [string, string] };
/** 작업마다 배치가 다르다: wide 큰 그림+옆 글 · phones 폰 화면 둘 · pair 전/후 한 쌍 · full 꽉 찬 그림+아래 세 칸 */
export type WorkEntry = { layout: 'wide' | 'phones' | 'pair' | 'full'; problem: string; changed: string; caption?: string; shots: Shot[] };

export const WORK_P = '프로젝트마다 무엇이 불편했고 무엇을 바꿨는지 실제 화면과 함께 적었습니다. 나머지도 정리되는 대로 올립니다.';
export const WORK: Record<string, WorkEntry> = {
  'por-favor-harry': {
    layout: 'wide',
    problem: '전화·메신저·메일·자리 방문으로 흩어져 오던 요청을 담당자 한 사람이 모두 다시 정리하고 있었습니다.',
    changed: '요청은 한 화면에 모이고, 요청한 사람이 진행 상황을 직접 확인합니다.',
    caption: '요청이 쌓이는 심사 대기 화면',
    shots: [{ src: '/screens/covers/por-favor-harry.png', w: 1280, h: 800, alt: '심사 대기 화면. 위에 숫자 칸 네 개가 있고, 그 아래 요청 목록에 번호·요청한 사람·내용·상태가 줄마다 적혀 있다.' }],
  },
  'problem-bank': {
    layout: 'phones',
    problem: '직원 약 200명이 해마다 문제집을 인쇄해 풀고, 한 해가 지나면 버렸습니다.',
    changed: '휴대폰으로 풀고, 답을 내면 바로 채점됩니다.',
    shots: [
      { src: '/screens/pbank/home-m.png', w: 1170, h: 2532, alt: '휴대폰 학습 홈. 랜덤으로 풀기, 골라서 풀기, 문제 훑어보기, 내 풀이 이력 네 칸이 세로로 놓여 있다.' },
      { src: '/screens/pbank/play-m.png', w: 1170, h: 2532, alt: '휴대폰 풀이 화면. 내 답은 빨간 칸, 정답은 초록 칸으로 표시되고 아래에 「틀렸습니다」와 「다음 문제」가 보인다.' },
    ],
  },
  'hospital-ux': {
    layout: 'pair',
    problem: '기능이 늘 때마다 화면을 따로 만들어, 같은 시스템인데 화면마다 색과 버튼 크기가 달랐습니다.',
    changed: '22개 화면에 같은 색·버튼·표 규칙을 적용했습니다.',
    shots: [
      { src: '/screens/hux/inventory-before.png', w: 2560, h: 1600, label: ['전', '재고관리 1차 화면'], alt: '재고관리 1차 화면. 연두색 표 머리 아래 행마다 제품 정보가 여러 줄로 쌓여 있고, 기능 칸에 색이 다른 버튼이 놓여 있다.' },
      { src: '/screens/hux/inventory-after.png', w: 2560, h: 1600, label: ['후', '규칙을 적용한 화면'], alt: '재고관리 다시 설계한 화면. 옅은 회색 표 머리 아래 행이 낮아져 한 화면에 더 많은 행이 보이고 기능 버튼은 테두리형이다.' },
    ],
  },
  'shift-board': {
    layout: 'full',
    problem: '순번을 잘못 세거나 퇴사한 분의 이름이 남아 있어도, 공지가 나간 뒤에야 알 수 있었습니다.',
    changed: '엑셀로 따로 짜서 합치던 근무표를 한 화면에서 짭니다.',
    shots: [{ src: '/screens/shift/panel.png', w: 2789, h: 1416, alt: '근무표와 오른쪽 인원별 누적 패널. 패널에는 사람마다 이달·올해·요일별 근무 횟수가 적혀 있다.' }],
  },
};

export const CONTACT = {
  h: ['어떤 일이', '불편한지', '알려주세요.'],
  p: '지금 상황을 한두 줄로 적어 보내 주세요. 이틀 안에 메일로 답장드립니다.',
  end: 'Prologue& (프롤로그엔) · and, 그리고 end.',
};
