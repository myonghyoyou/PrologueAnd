export type Pic = { src: string; alt: string; cap: string; w: number; h: number };
export type Scatter = { text: string; from: string; at: string };
export type Spot = { x: number; y: number; w: number; h: number; cap: string };

export type Project = {
  slug: string; title: string; tagline: string;
  problem: 'scattered' | 'legacy' | 'paper' | 'idea';
  tags: string[]; year: string;
  disclosure: 'full' | 'anonymized' | 'mockup';
  order: number; featured: boolean; published: boolean;
};

export type Case = {
  title: string;            // 표지 H1 (줄바꿈은 <br>)
  cap: string;              // 표지 윗줄 "문제 01 흩어진 요청"
  meta: [string, string][];
  numbers: { value: string; label: string; small: string }[];
  hero: Pic;
  s01: { h: string; p: string[]; pic: Pic };
  s02: { h: string; p: string[]; diagram: 'before' };
  s03: { h: string; p: string[] };
  s04: { q: string; p: string[] };
  s05: { h: string; p: string[] };
  s06: { h: string; p: string[]; screen: Pic; spots: Spot[]; screens: { lab: string; h: string; p: string[]; pic: Pic }[] };
  s07: { h: string; p: string[]; scatter: Scatter[]; after: Pic };
  s09: { h: string; p: string[] };
  s10: { p: string[]; next?: string };
};
