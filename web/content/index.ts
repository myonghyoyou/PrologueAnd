import { projects, COVERS } from './projects';
import { porFavorHarry } from './studies/por-favor-harry';
import { hospitalUx } from './studies/hospital-ux';
import { problemBank } from './studies/problem-bank';
import type { Project } from './types';
import type { Study } from './study-types';

export const studies: Record<string, Study> = { 'por-favor-harry': porFavorHarry, 'problem-bank': problemBank, 'hospital-ux': hospitalUx };
export const allProjects = (): Project[] => [...projects].sort((a, b) => a.order - b.order);
export const publishedProjects = (): Project[] => allProjects().filter((p) => p.published);
export const getProject = (slug: string): Project | undefined => projects.find((p) => p.slug === slug);
export const getStudy = (slug: string): Study | undefined => studies[slug];
/** 다음 이야기 — 공개 순서에서 바로 다음 편, 마지막 편은 첫 편으로 돈다. 공개 편이 하나뿐이면 없음 */
export const nextProject = (slug: string): Project | undefined => {
  const ps = publishedProjects();
  const i = ps.findIndex((p) => p.slug === slug);
  if (i < 0 || ps.length < 2) return undefined;
  return ps[(i + 1) % ps.length];
};
export { COVERS };
export type { Project, Spot, Scatter } from './types';
export type { Study, Chapter, Block, Figure, Num, NoteBlock, PhonesBlock, FlowBlock, QuoteBlock, WipeBlock, FigureBlock, ThreadBlock, ScatterHero, PinnedHero, Hero, Crop, TableBlock, TableCell, SheetBlock, SheetRow, SheetCell, SheetShow, RuleBlock, StepsBlock } from './study-types';
export { isScatterHero, isPinnedHero, heroFigure } from './study-types';
