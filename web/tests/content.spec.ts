import { test, expect } from '@playwright/test';
import { allProjects, publishedProjects, getStudy, nextProject } from '../content';

test('프로젝트는 6건이고 공개는 Por favor, Harry · 문제 은행 · 병원 UI/UX 고도화 세 건', () => {
  expect(allProjects()).toHaveLength(6);
  expect(publishedProjects().map((p) => p.slug)).toEqual(['por-favor-harry', 'problem-bank', 'hospital-ux']);
});

test('공개된 상세만 Study 데이터가 있다', () => {
  expect(getStudy('por-favor-harry')).toBeTruthy();
  expect(getStudy('problem-bank')).toBeTruthy();
  expect(getStudy('custom-commerce')).toBeUndefined();
});

test('다음 이야기는 자기 자신이 아니다', () => {
  for (const p of publishedProjects()) expect(nextProject(p.slug)?.slug).not.toBe(p.slug);
});

test('회사 이름은 목록 어디에도 없다', () => {
  for (const p of allProjects()) expect(`${p.slug} ${p.title} ${p.tagline}`).not.toMatch(/(?!)/);
});

test('다음 이야기는 공개 순서의 바로 다음 편, 마지막 편은 첫 편으로 돈다', () => {
  const ps = publishedProjects();
  ps.forEach((p, i) => expect(nextProject(p.slug)?.slug).toBe(ps[(i + 1) % ps.length].slug));
});
