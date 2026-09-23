import { projects, PROBLEM_NAME, COVERS } from './projects';
import { porFavorHarry } from './cases/por-favor-harry';
import { porFavorHarry as pfhStudy } from './studies/por-favor-harry';
import type { Case, Project } from './types';
import type { Study } from './study-types';

export const cases: Record<string, Case> = { 'por-favor-harry': porFavorHarry };
export const studies: Record<string, Study> = { 'por-favor-harry': pfhStudy };
export const getStudy = (slug: string): Study | undefined => studies[slug];
export const allProjects = (): Project[] => [...projects].sort((a, b) => a.order - b.order);
export const publishedProjects = (): Project[] => allProjects().filter((p) => p.published);
export const getProject = (slug: string): Project | undefined => projects.find((p) => p.slug === slug);
export const getCase = (slug: string): Case | undefined => cases[slug];
export const nextProject = (slug: string): Project | undefined =>
  publishedProjects().filter((p) => p.slug !== slug)[0];
export { PROBLEM_NAME, COVERS };
export type { Case, Project, Pic, Spot, Scatter } from './types';
export type { Study, Chapter, Block, Figure, Num } from './study-types';
