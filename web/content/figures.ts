import type { Figure, Study } from './study-types';

/** 표지 대표 화면부터 블록 순서대로, 한 편의 모든 그림 */
export function figuresOf(s: Study): Figure[] {
  const out: Figure[] = [s.cover.hero];
  for (const c of s.chapters) {
    for (const b of c.blocks) {
      if (b.type === 'figure') out.push(b.fig);
      else if (b.type === 'note' || b.type === 'phones') out.push(...b.figs);
      else if (b.type === 'wipe') {
        out.push(b.after);
        if (!Array.isArray(b.before)) out.push(b.before);
      }
    }
  }
  return out;
}
