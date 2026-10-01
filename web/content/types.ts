export type Scatter = { text: string; from: string; at: string };
/** 핫스팟 — 그림 % 영역. also: 같은 항목을 고르면 함께 밝아지는 다른 영역(예: 패널 줄과 그 사람의 표 칸) */
export type Spot = { x: number; y: number; w: number; h: number; cap: string; also?: { x: number; y: number; w: number; h: number }[] };

export type Project = {
  slug: string; title: string; tagline: string;
  tags: string[]; year: string;
  disclosure: 'full' | 'anonymized' | 'mockup';
  order: number; published: boolean;
};
