import { expect, type Page } from '@playwright/test';
import { migrateV1, V1_MAP } from '../lib/brief/migrate-v1';
import { OPTS, type OptKey } from '../content/brief/rules';
import type { Answers, StepId } from '../lib/brief/types';

/** 테스트 답은 읽기 쉽게 한국어 글자로 적고, v1 옮기기(migrateV1)로 id 답을 만든다 — 저장되는 값은 id 다 */

/** 언어 분리 전 emptyAnswers() 의 값을 글자 그대로 옮긴 v1 빈 답 */
export const EMPTY_V1 = {
  v: 1, renewUrl: '', renewPain: '', kindOther: '', name: '', goalMore: [], audience: [], pages: [], pagesExtra: '',
  features: {}, featuresExtra: '', featuresUnknown: false, langs: [], langOther: '', links: [], contentBy: '', brand: [], refs: [], dislikes: '',
  ops: [], own: { domain: '내 이름으로', hosting: '내 이름으로', admin: '대표 계정은 내가', source: '오픈 때 받기' },
  monthlyCost: true, openDate: '', openUnknown: false, budgetInBrief: false,
};

type MapKey = keyof typeof V1_MAP;
/** 그 글자가 대응표에 있는지 — 「모르겠어요」는 그 질문에 unknown 이 있을 때만 */
const known = (map: MapKey, x: unknown, opt?: OptKey) =>
  typeof x === 'string' && (x in V1_MAP[map] || (x === '모르겠어요' && !!opt && (OPTS[opt] as readonly string[]).includes('unknown')));

const ONE: [keyof Answers, MapKey, OptKey][] = [['renewAmount', 'renewAmount', 'renewAmount'], ['kind', 'kind', 'kind'], ['goalMain', 'goal', 'goal'],
  ['booking', 'booking', 'booking'], ['shopCount', 'shopCount', 'shopCount'], ['shopHow', 'shopHow', 'shopHow'], ['member', 'member', 'member'],
  ['copy', 'copy', 'copy'], ['photo', 'photo', 'photo'], ['design', 'design', 'design'], ['revisions', 'revisions', 'revisions'], ['care', 'care', 'care'],
  ['openFixed', 'openFixed', 'openFixed'], ['budget', 'budget', 'budget'], ['decider', 'decider', 'decider']];
const MANY: [string, MapKey, OptKey?][] = [['goalMore', 'goal', 'goal'], ['audience', 'audience', 'audience'], ['pages', 'pages', 'pages'], ['langs', 'langs'],
  ['links', 'links', 'links'], ['brand', 'brand', 'brand'], ['ops', 'ops', 'ops']];
const OWN: [string, MapKey, OptKey][] = [['domain', 'ownDomain', 'ownDomain'], ['hosting', 'ownHosting', 'ownHosting'], ['admin', 'ownAdmin', 'ownAdmin'], ['source', 'ownSource', 'ownSource']];

/** 한국어(v1) 답 → id 답. 실제 migrateV1 은 대응표에 없는 글자를 조용히 버리지만, 테스트 답의 오타가 빈 칸으로 통과하지 않게 여기서는 멈춘다 */
export function fromKo(v1Partial: Record<string, unknown>): Answers {
  const m = { ...EMPTY_V1, ...v1Partial, v: 1 } as Record<string, unknown>;
  const bad: string[] = [];
  if (m.mode !== undefined && m.mode !== 'new' && m.mode !== 'renew') bad.push(`mode: ${String(m.mode)}`);
  for (const [k, map, opt] of ONE) if (m[k] !== undefined && m[k] !== '' && !known(map, m[k], opt)) bad.push(`${k}: ${String(m[k])}`);
  for (const [k, map, opt] of MANY) for (const x of (m[k] as unknown[]) ?? []) if (!known(map, x, opt)) bad.push(`${k}: ${String(x)}`);
  for (const f of Object.keys((m.features as object) ?? {})) if (!known('features', f)) bad.push(`features: ${f}`);
  for (const r of (m.refs as { likes?: unknown[] }[]) ?? []) for (const x of r.likes ?? []) if (!known('likes', x)) bad.push(`likes: ${String(x)}`);
  const own = (m.own ?? {}) as Record<string, unknown>;
  for (const [k, map, opt] of OWN) if (own[k] !== undefined && !known(map, own[k], opt)) bad.push(`own.${k}: ${String(own[k])}`);
  if (bad.length) throw new Error(`fromKo: 대응표에 없는 글자 — ${bad.join(' / ')}`);
  const a = migrateV1(m);
  if (!a) throw new Error(`fromKo: 옮기지 못함 — ${JSON.stringify(v1Partial)}`);
  return a;
}

/** 그 주소를 열고 v2 키에 답을 써 둔 뒤 새로 불러온다 */
export async function seedBrief(page: Page, answers: Answers, step: StepId, done = false, path = '/tools/brief') {
  await page.goto(path);
  await expect(page.locator('[data-brief] h1')).toBeVisible();
  await page.evaluate(([an, st, dn]) => localStorage.setItem('prologue.brief.v2', JSON.stringify({ answers: an, step: st, done: dn })), [answers, step, done] as const);
  await page.reload();
}
