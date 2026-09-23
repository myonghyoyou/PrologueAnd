import { figuresOf } from './figures';
import type { Figure, Study } from './study-types';

const sentences = (t: string) => (t.match(/[.!?](?=\s|$)/g) ?? []).length;

/** 콘텐츠 규칙(명세 §7). 어긴 것마다 한 줄 설명, 없으면 빈 배열 */
export function validateStudy(s: Study): string[] {
  const errs: string[] = [];
  const ids = s.chapters.map((c) => c.id);
  for (const id of ids) if (!/^[a-z0-9-]+$/.test(id)) errs.push(`장 id 는 영문 소문자·숫자·하이픈만: ${id}`);
  if (new Set(ids).size !== ids.length) errs.push('장 id 가 겹칩니다');
  if (s.cover.numbers.length !== 3) errs.push(`표지 숫자는 3개: ${s.cover.numbers.length}개`);

  const blocks = s.chapters.flatMap((c) => c.blocks);
  if (blocks.filter((b) => b.type === 'wipe').length > 1) errs.push('와이프는 한 편에 하나까지');

  const spotOk = new Set<Figure>();
  for (const b of blocks) {
    if (b.type === 'note' || b.type === 'phones') {
      if (b.figs.length < 1 || b.figs.length > 3) errs.push(`${b.type} 의 그림은 1~3장: ${b.figs.length}장`);
      for (const p of b.p ?? []) if (sentences(p) > 2) errs.push(`여백 주석 문단은 두 문장 이하: ${p.slice(0, 20)}…`);
    }
    if (b.type === 'note' && b.figs[0]) spotOk.add(b.figs[0]);
  }
  for (const f of figuresOf(s)) {
    if (!f.alt.trim()) errs.push(`alt 가 비었습니다: ${f.src}`);
    if (f.spots?.length && !spotOk.has(f)) errs.push(`핫스팟은 여백 주석의 첫 그림에만: ${f.src}`);
  }
  return errs;
}
