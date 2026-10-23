import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { buildBrief, impactItems, vendorQuestions, unknownList, toPlainText, briefSummary, printZoom } from '../lib/brief/derive';
import { copyFor } from '../content/brief/copy';
import { fromKo } from './brief-ko';

/** 언어 분리 전(Task 1)에 고정한 한국어 결과 — 같은 답을 id 로 옮겨 문구 파일로 계산해도 글자 하나 다르지 않아야 한다.
 *  고정 파일(ko-before.json)은 고치지 않는다. 다르면 코드·문구를 고친다 */
const FIX = JSON.parse(readFileSync('tests/fixtures/brief/ko-before.json', 'utf8')) as { date: string; sets: { name: string; v1: Record<string, unknown>; out: unknown }[] };
const D = new Date('2026-10-15T09:00:00+09:00');

test('고정 파일의 기준일이 단위 테스트와 같다', () => { expect(FIX.date).toBe(D.toISOString()); });

for (const set of FIX.sets) test(`한국어 결과 그대로 — ${set.name}`, () => {
  const a = fromKo(set.v1), c = copyFor('ko');
  expect({ brief: buildBrief(a, D, c), impact: impactItems(a, D, c), vendor: vendorQuestions(a, c), unknown: unknownList(a, c),
    plain: toPlainText(a, D, c), summary: briefSummary(a, D, c), zoom: printZoom(a, c) }).toEqual(set.out);
});
