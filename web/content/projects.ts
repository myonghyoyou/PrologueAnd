import type { Project } from './types';

export const projects: Project[] = [
  { slug: 'por-favor-harry', title: 'Por favor, Harry', tagline: '전화·메신저·메일·방문으로 오던 요청을 한 곳으로', tags: ['Workflow Design', 'Internal Tool'], year: '2026', disclosure: 'full', order: 1, published: true },
  { slug: 'problem-bank', title: '문제 은행', tagline: '답을 내면 바로 채점되는 사내 문제 은행', tags: ['Digital Transformation', 'Web Application'], year: '2026', disclosure: 'anonymized', order: 2, published: true },
  { slug: 'hospital-ux', title: '병원 UI/UX 고도화', tagline: '22개 화면에 같은 색·버튼·표 규칙을 적용했습니다', tags: ['Enterprise UX', 'UI Redesign'], year: '2026', disclosure: 'anonymized', order: 3, published: true },
  { slug: 'custom-commerce', title: 'Custom Commerce', tagline: '기성 쇼핑몰 프레임워크 없이 처음부터 구축한 Commerce Product', tags: ['Product Engineering', 'Commerce'], year: '2026', disclosure: 'full', order: 4, published: false },
  { slug: 'quote-sheet', title: '견적서 자동화', tagline: '엑셀 견적서 12종을 입력 한 번으로', tags: ['Automation', 'Internal Tool'], year: '2026', disclosure: 'anonymized', order: 5, published: false },
  { slug: 'shift-board', title: '교대 근무표', tagline: '엑셀로 따로 짜서 합치던 근무표를 한 화면에서 짭니다', tags: ['Workflow Design', 'Internal Tool'], year: '2026', disclosure: 'anonymized', order: 6, published: true },
];

// 다음 이야기 표지 PNG(web/public/screens/covers/) 가 있는 slug. quote-sheet 는 아직 없다(2026-09-30 확인)
export const COVERS = new Set(['por-favor-harry', 'problem-bank', 'hospital-ux', 'custom-commerce', 'shift-board']);
