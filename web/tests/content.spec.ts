import { test, expect } from '@playwright/test';
import { allProjects, publishedProjects, getStudy, nextProject } from '../content';

test('프로젝트는 6건이고 공개는 Por favor, Harry 한 건', () => {
  expect(allProjects()).toHaveLength(6);
  expect(publishedProjects().map((p) => p.slug)).toEqual(['por-favor-harry']);
});

test('공개된 상세만 Study 데이터가 있다', () => {
  expect(getStudy('por-favor-harry')).toBeTruthy();
  expect(getStudy('custom-commerce')).toBeUndefined();
});

test('다음 이야기는 자기 자신이 아니다', () => {
  expect(nextProject('por-favor-harry')?.slug).not.toBe('por-favor-harry');
});
