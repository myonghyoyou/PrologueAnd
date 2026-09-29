import { imageSize, publicFile } from '../lib/image-size';
import { isPinnedHero, isScatterHero, type Block, type Figure, type Hero, type SheetCell, type Study } from './study-types';

const sized = <F extends Figure>(f: F): F => ({ ...f, ...imageSize(publicFile(f.src)) });
const sizedCell = (c: SheetCell): SheetCell => ('crop' in c.show ? { ...c, show: { crop: sized(c.show.crop) } } : c);

function hero(h: Hero): Hero {
  if (isScatterHero(h)) return h;
  if (isPinnedHero(h)) return { ...h, pinned: sized(h.pinned) };
  return sized(h);
}

function block(b: Block): Block {
  switch (b.type) {
    case 'figure': return { ...b, fig: sized(b.fig) };
    case 'note': return { ...b, figs: b.figs.map(sized), ...(b.beforeFig ? { beforeFig: sized(b.beforeFig) } : {}) };
    case 'phones': return { ...b, figs: b.figs.map(sized) };
    case 'wipe': return { ...b, after: sized(b.after), before: Array.isArray(b.before) ? b.before : sized(b.before) };
    case 'rule': return { ...b, before: sized(b.before), after: sized(b.after) };
    case 'sheet': return { ...b, rows: b.rows.map((r) => ({ ...r, before: sizedCell(r.before), after: sizedCell(r.after) })) };
    default: return b;
  }
}

/** 모든 그림에 원본 w·h 를 채운 사본. 서버(페이지 렌더·빌드)에서만 부른다 — fs 를 쓴다 */
export function resolveStudy(s: Study): Study {
  return { ...s, cover: { ...s.cover, hero: hero(s.cover.hero) }, chapters: s.chapters.map((c) => ({ ...c, blocks: c.blocks.map(block) })) };
}
