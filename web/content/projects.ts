import type { Project } from './types';

export const projects: Project[] = [
  { slug: 'por-favor-harry', title: 'Por favor, Harry', tagline: '전화·메신저·메일·방문으로 오던 요청을 한 곳으로', tags: ['Workflow Design', 'Internal Tool'], year: '2026', disclosure: 'full', order: 1, published: true },
  { slug: 'problem-bank', title: '문제 은행', tagline: '1,220개의 종이 문제를 새로운 학습 경험으로', tags: ['Digital Transformation', 'Web Application'], year: '2026', disclosure: 'anonymized', order: 2, published: false },
  { slug: 'hospital-ux', title: '병원 UI/UX 고도화', tagline: '복잡한 업무 화면을 더 빠르게 읽고 처리하도록', tags: ['Enterprise UX', 'UI Redesign'], year: '2026', disclosure: 'mockup', order: 3, published: false },
  { slug: 'custom-commerce', title: 'Custom Commerce', tagline: '기성 쇼핑몰 프레임워크 없이 처음부터 구축한 Commerce Product', tags: ['Product Engineering', 'Commerce'], year: '2026', disclosure: 'full', order: 4, published: false },
  { slug: 'quote-sheet', title: '견적서 자동화', tagline: '엑셀 견적서 12종을 입력 한 번으로', tags: ['Automation', 'Internal Tool'], year: '2026', disclosure: 'anonymized', order: 5, published: false },
  { slug: 'shift-board', title: '교대 근무표', tagline: '카톡으로 돌던 근무표를 한 화면으로', tags: ['Workflow Design', 'Mobile'], year: '2026', disclosure: 'mockup', order: 6, published: false },
];

// design/mockups/v2/img/ 에 표지 PNG 가 있는 slug. quote-sheet·shift-board 는 아직 없다(2026-09-23 확인)
export const COVERS = new Set(['por-favor-harry', 'problem-bank', 'hospital-ux', 'custom-commerce']);
