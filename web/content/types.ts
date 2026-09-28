export type Scatter = { text: string; from: string; at: string };
export type Spot = { x: number; y: number; w: number; h: number; cap: string };

export type Project = {
  slug: string; title: string; tagline: string;
  tags: string[]; year: string;
  disclosure: 'full' | 'anonymized' | 'mockup';
  order: number; published: boolean;
};
