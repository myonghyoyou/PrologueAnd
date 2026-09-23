import type { Project } from './types';

export const projects: Project[] = [
  { slug: 'por-favor-harry', title: 'Por favor, Harry', tagline: '전화·메신저·메일·방문으로 오던 요청을 한 곳으로', problem: 'scattered', tags: ['Workflow Design', 'Internal Tool'], year: '2025', disclosure: 'full', order: 1, featured: true, published: true },
  { slug: 'daeryun-learning-hub', title: 'Daeryun Learning Hub', tagline: '1,220개의 종이 문제를 새로운 학습 경험으로', problem: 'paper', tags: ['Digital Transformation', 'Web Application'], year: '2025', disclosure: 'anonymized', order: 2, featured: true, published: false },
  { slug: 'hospital-ux', title: '병원 UI/UX 고도화', tagline: '복잡한 업무 화면을 더 빠르게 읽고 처리하도록', problem: 'legacy', tags: ['Enterprise UX', 'UI Redesign'], year: '2024–2025', disclosure: 'mockup', order: 3, featured: true, published: false },
  { slug: 'custom-commerce', title: 'Custom Commerce', tagline: '기성 쇼핑몰 프레임워크 없이 처음부터 구축한 Commerce Product', problem: 'idea', tags: ['Product Engineering', 'Commerce'], year: '2025', disclosure: 'full', order: 4, featured: true, published: false },
  { slug: 'quote-sheet', title: '견적서 자동화', tagline: '엑셀 견적서 12종을 입력 한 번으로', problem: 'paper', tags: ['Automation', 'Internal Tool'], year: '2024', disclosure: 'anonymized', order: 5, featured: false, published: false },
  { slug: 'shift-board', title: '교대 근무표', tagline: '카톡으로 돌던 근무표를 한 화면으로', problem: 'scattered', tags: ['Workflow Design', 'Mobile'], year: '2024', disclosure: 'mockup', order: 6, featured: false, published: false },
];

// design/mockups/v2/img/ 에 표지 PNG 가 있는 slug. quote-sheet·shift-board 는 아직 없다(2026-09-23 확인)
export const COVERS = new Set(['por-favor-harry', 'daeryun-learning-hub', 'hospital-ux', 'custom-commerce']);

export const PROBLEM_NAME: Record<Project['problem'], string> = {
  scattered: '흩어진 요청', legacy: '불편한 기존 시스템', paper: '종이·수작업', idea: '제품이 필요한 아이디어',
};
