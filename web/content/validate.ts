import { figuresOf } from './figures';
import { isPinnedHero, isScatterHero, type Crop, type Figure, type Study } from './study-types';

const sentences = (t: string) => (t.match(/[.!?](?=\s|$)/g) ?? []).length;

/** 콘텐츠 규칙(명세 §7). 어긴 것마다 한 줄 설명, 없으면 빈 배열 */
export function validateStudy(s: Study): string[] {
  const errs: string[] = [];
  const ids = s.chapters.map((c) => c.id);
  for (const id of ids) if (!/^[a-z0-9-]+$/.test(id)) errs.push(`장 id 는 영문 소문자·숫자·하이픈만: ${id}`);
  if (new Set(ids).size !== ids.length) errs.push('장 id 가 겹칩니다');
  const nums = s.cover.numbers?.length ?? 0;
  if (nums !== 0 && nums !== 3) errs.push(`표지 숫자는 없거나 3개: ${nums}개`);

  if (isScatterHero(s.cover.hero) && !s.cover.hero.alt.trim()) errs.push('alt 가 비었습니다: 표지 문제 장면');
  if (isPinnedHero(s.cover.hero)) {
    const pins = s.cover.hero.pins;
    if (pins.length < 1 || pins.length > 5) errs.push(`표지 번호는 1~5개: ${pins.length}개`);
    for (const p of pins) if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) errs.push(`표지 번호 좌표는 0~100: ${p.x}, ${p.y}`);
  }
  const cropOk = (c: Crop) => { const { x, y, w, h } = c.crop; return x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 100 && y + h <= 100; };

  const blocks = s.chapters.flatMap((c) => c.blocks);
  if (blocks.filter((b) => b.type === 'wipe').length > 1) errs.push('와이프는 한 편에 하나까지');

  const spotOk = new Set<Figure>();
  for (const b of blocks) {
    if (b.type === 'note' || b.type === 'phones') {
      if (b.figs.length < 1 || b.figs.length > 3) errs.push(`${b.type} 의 그림은 1~3장: ${b.figs.length}장`);
      for (const p of b.p ?? []) if (sentences(p) > 2) errs.push(`여백 주석 문단은 두 문장 이하: ${p.slice(0, 20)}…`);
    }
    if (b.type === 'note' && b.figs[0]) spotOk.add(b.figs[0]);
    if (b.type === 'table') {
      const n = b.cols.length;
      if (b.rows.some((r) => r.length !== n) || (b.foot && b.foot.length !== n)) errs.push(`표 칸 수가 머리줄(${n})과 다릅니다`);
    }
    if (b.type === 'sheet') {
      if (b.rows.length < 3 || b.rows.length > 6) errs.push(`시트 행은 3~6개: ${b.rows.length}개`);
      for (const r of b.rows) for (const c of [r.before, r.after]) if ('crop' in c.show && !cropOk(c.show.crop)) errs.push(`자르기 범위가 캡처 밖입니다: ${c.show.crop.src}`);
    }
    if (b.type === 'rule') for (const c of [b.before, b.after]) if (!cropOk(c)) errs.push(`자르기 범위가 캡처 밖입니다: ${c.src}`);
  }
  for (const f of figuresOf(s)) {
    if (!f.alt.trim()) errs.push(`alt 가 비었습니다: ${f.src}`);
    if (f.spots?.length && !spotOk.has(f)) errs.push(`핫스팟은 여백 주석의 첫 그림에만: ${f.src}`);
  }
  return errs;
}
