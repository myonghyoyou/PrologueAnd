import { imageSize, publicFile } from '../lib/image-size';
import type { Block, Figure, Study } from './study-types';

const sized = (f: Figure): Figure => ({ ...f, ...imageSize(publicFile(f.src)) });

function block(b: Block): Block {
  switch (b.type) {
    case 'figure': return { ...b, fig: sized(b.fig) };
    case 'note': return { ...b, figs: b.figs.map(sized) };
    case 'phones': return { ...b, figs: b.figs.map(sized) };
    case 'wipe': return { ...b, after: sized(b.after), before: Array.isArray(b.before) ? b.before : sized(b.before) };
    default: return b;
  }
}

/** 모든 그림에 원본 w·h 를 채운 사본. 서버(페이지 렌더·빌드)에서만 부른다 — fs 를 쓴다 */
export function resolveStudy(s: Study): Study {
  return {
    ...s,
    cover: { ...s.cover, hero: sized(s.cover.hero) },
    chapters: s.chapters.map((c) => ({ ...c, blocks: c.blocks.map(block) })),
  };
}
