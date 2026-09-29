import { heroFigure, type Figure, type SheetCell, type Study } from './study-types';

const cellFig = (c: SheetCell): Figure[] => ('crop' in c.show ? [c.show.crop] : []);

/** 표지 그림부터 블록 순서대로, 한 편의 모든 그림(자른 캡처·전 캡처 포함) */
export function figuresOf(s: Study): Figure[] {
  const h = heroFigure(s.cover.hero);
  const out: Figure[] = h ? [h] : [];
  for (const c of s.chapters) {
    for (const b of c.blocks) {
      if (b.type === 'figure') out.push(b.fig);
      else if (b.type === 'note') { out.push(...b.figs); if (b.beforeFig) out.push(b.beforeFig); }
      else if (b.type === 'phones') out.push(...b.figs);
      else if (b.type === 'wipe') { out.push(b.after); if (!Array.isArray(b.before)) out.push(b.before); }
      else if (b.type === 'rule') out.push(b.before, b.after);
      else if (b.type === 'sheet') for (const r of b.rows) out.push(...cellFig(r.before), ...cellFig(r.after));
    }
  }
  return out;
}
