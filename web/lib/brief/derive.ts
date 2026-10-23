import { NONE, PAGES_MANY, LINKS_MANY, RUSH_DAYS } from '@/content/brief/rules';
import type { BriefCopy } from '@/content/brief/copy';
import { SUMMARY_MARK } from './prefill';
import { UNKNOWN, type Answers, type Feature, type StepId } from './types';

/* 화면·문서에 나가는 글자는 모두 문구 파일(c)에서 — 이 파일에는 언어가 없다. 계산은 언어 분리 전과 한 줄도 다르지 않다(tests/brief-ko-fixture.spec.ts) */

/** edit: 그 줄을 고칠 질문(업체 제안 항목) */
export type Row = { label: string; value: string; tag?: 'must' | 'later' | 'ask'; edit?: StepId };
export type Section = { id: string; title: string; rows: Row[] };

/** 이모지 같은 짝 글자(서러게이트 쌍)의 한가운데를 자르면 외톨이 글자가 남아 encodeURIComponent 가 URIError 를 낸다 — 그 한 글자도 같이 뺀다 */
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).replace(/[\uD800-\uDBFF]$/, '')}…` : s);
const list = (xs: string[]) => xs.filter(Boolean).join(', ');
const isUnknown = (v?: string) => !v || v === UNKNOWN;
const kindText = (a: Answers, c: BriefCopy) => (a.kind === 'other' ? a.kindOther.trim() : a.kind ? c.q.kind.opts[a.kind] : '');
const featureEntries = (a: Answers) => (Object.entries(a.features) as [Feature, 'must' | 'later'][]);
const pagesAll = (a: Answers, c: BriefCopy) => [...a.pages.map((p) => c.q.pages.opts[p]), ...a.pagesExtra.split(',').map((s) => s.trim()).filter(Boolean)];
const needsAdmin = (a: Answers) => a.ops.some((o) => o !== NONE);
const langCount = (a: Answers) => a.langs.length + (a.langOther.trim() ? 1 : 0);
const OWN_KEYS = ['domain', 'hosting', 'admin', 'source'] as const;

function featureDetail(a: Answers, f: Feature, c: BriefCopy): string {
  const q = c.q.features;
  if (f === 'booking') return a.booking && !isUnknown(a.booking) ? q.booking.opts[a.booking] : '';
  if (f === 'payment') return list([a.shopCount && !isUnknown(a.shopCount) ? c.doc.values.shopCount[a.shopCount] ?? '' : '', a.shopHow && !isUnknown(a.shopHow) ? q.shopHow.opts[a.shopHow] : '']);
  if (f === 'members') return a.member && !isUnknown(a.member) ? q.member.opts[a.member] : '';
  if (f === 'multilang') return list([...a.langs.map(c.ui.langName), a.langOther.trim()]);
  return '';
}

/** 업체 제안으로 넘길 항목과 그 항목을 고칠 질문 — 결과에서 항목마다 「고치기」로 바로 간다 */
export function unknownList(a: Answers, c: BriefCopy): { label: string; step: StepId }[] {
  const out: { label: string; step: StepId }[] = [];
  const u = c.doc.unknown;
  const add = (label: string, step: StepId) => out.push({ label, step });
  if (a.mode === 'renew' && isUnknown(a.renewAmount)) add(u.renewAmount, 'renew');
  if (a.audience.length === 0 || a.audience.includes(UNKNOWN)) add(u.audience, 'audience');
  if (pagesAll(a, c).length === 0) add(u.pages, 'pages');
  if (a.featuresUnknown || (featureEntries(a).length === 0 && !a.featuresExtra.trim())) add(u.features, 'features');
  if (a.links.length === 0) add(u.links, 'links');
  if (isUnknown(a.copy)) add(u.copy, 'content');
  if (isUnknown(a.photo) || a.photo === NONE) add(u.photo, 'content');   // 사진이 없으면 준비 방법을 업체에 맡긴다
  if (a.brand.length === 0) add(u.brand, 'brand');
  if (isUnknown(a.design)) add(u.design, 'design');
  if (a.ops.length === 0) add(u.ops, 'ops');
  OWN_KEYS.forEach((k) => { if (isUnknown(a.own[k])) add(u[k], 'own'); });
  if (!a.revisions || a.revisions === 'vendor') add(u.revisions, 'scope');
  if (!a.care) add(u.care, 'scope');
  if (!a.openDate) add(u.openDate, 'when');
  return out;
}

export function unknownItems(a: Answers, c: BriefCopy): string[] {
  return unknownList(a, c).map((x) => x.label);
}

/** 예산 줄 값 — 지금 보는 언어의 칸만 쓴다(한국어판은 구간, 영어판은 글칸). 다른 언어의 칸은 지우지 않고 그대로 둔다(명세 3-3) */
function budgetValue(a: Answers, c: BriefCopy): string {
  const b = c.q.when.budget;
  if (b.kind === 'range') return a.budget && !isUnknown(a.budget) ? b.opts[a.budget] : '';
  return a.budgetText.trim();
}

/* 업체에게 보내는 문서 말투 — 선택지 단추의 글자(해요체·부탁·반말)를 그대로 옮기지 않고 명사형(c.doc.values)으로 바꾼다 */
export function buildBrief(a: Answers, today: Date, c: BriefCopy): { title: string; subtitle: string; sections: Section[] } {
  const R = c.doc.rows, V = c.doc.values, T = c.doc.sections;
  const name = clip(a.name.trim(), 60) || c.doc.untitled;
  const sections: Section[] = [];
  sections.push({ id: 'purpose', title: T.purpose, rows: [
    { label: R.kind, value: clip(kindText(a, c), 80) },
    ...(a.goalMain ? [{ label: R.goalMain, value: V.goal[a.goalMain] }] : []),
    ...(a.goalMore.length ? [{ label: R.goalMore, value: list(a.goalMore.map((g) => V.goal[g])) }] : []),
    ...(a.audience.length && !a.audience.includes(UNKNOWN) ? [{ label: R.audience, value: list(a.audience.map((x) => c.q.audience.opts[x])) }] : []),
  ] });
  if (a.mode === 'renew') sections.push({ id: 'renew', title: T.renew, rows: [
    ...(a.renewUrl.trim() ? [{ label: R.renewUrl, value: clip(a.renewUrl.trim(), 120) }] : []),
    ...(a.renewPain.trim() ? [{ label: R.renewPain, value: clip(a.renewPain.trim(), 300) }] : []),
    ...(a.renewAmount && !isUnknown(a.renewAmount) ? [{ label: R.renewAmount, value: V.amount[a.renewAmount] ?? '' }] : []),
  ] });
  const pages = pagesAll(a, c);
  // 항목 안에도 「·」가 있어(메뉴·서비스) 항목 사이는 「 / 」로 나눈다
  sections.push({ id: 'pages', title: T.pages, rows: pages.length ? [{ label: R.pages(pages.length), value: clip(pages.join(' / '), 300) }] : [] });
  sections.push({ id: 'features', title: T.features, rows: [
    ...featureEntries(a).map(([f, t]) => ({ label: c.q.features.opts[f], value: featureDetail(a, f, c), tag: t })),
    ...(a.featuresExtra.trim() ? [{ label: R.featuresExtra, value: clip(a.featuresExtra.trim(), 300) }] : []),
  ] });
  sections.push({ id: 'links', title: T.links, rows: a.links.length ? [{ label: R.links, value: a.links.includes(NONE) ? V.none : list(a.links.map((l) => c.q.links.opts[l])) }] : [] });
  sections.push({ id: 'content', title: T.content, rows: [
    ...(a.copy && !isUnknown(a.copy) ? [{ label: R.copy, value: V.copy[a.copy] ?? '' }] : []),
    ...(a.photo && !isUnknown(a.photo) ? [{ label: R.photo, value: V.photo[a.photo] ?? '' }] : []),
    ...(a.contentBy ? [{ label: R.contentBy, value: c.doc.formatDay(a.contentBy) }] : []),
  ] });
  sections.push({ id: 'brand', title: T.brand, rows: a.brand.length ? [{ label: R.brand, value: list(a.brand.map((x) => (x === NONE ? V.brandNone : c.q.brand.opts[x]))) }] : [] });
  sections.push({ id: 'design', title: T.design, rows: [
    ...(a.design && !isUnknown(a.design) ? [{ label: R.design, value: V.design[a.design] ?? '' }] : []),
    ...a.refs.filter((r) => r.url.trim()).flatMap((r, i) => [
      { label: R.ref(i + 1), value: clip(r.url.trim(), 200) },
      ...(r.likes.length ? [{ label: R.refLikes(i + 1), value: list(r.likes.map((l) => c.q.design.likes[l])) }] : []),
      ...(r.memo.trim() ? [{ label: R.refMemo(i + 1), value: clip(r.memo.trim(), 200) }] : []),
    ]),
    ...(a.dislikes.trim() ? [{ label: R.dislikes, value: clip(a.dislikes.trim(), 300) }] : []),
  ] });
  sections.push({ id: 'ops', title: T.ops, rows: needsAdmin(a)
    ? [{ label: R.opsWhat, value: list(a.ops.map((o) => c.q.ops.opts[o])) }, { label: R.opsAdmin, value: V.needed }]
    : a.ops.length ? [{ label: R.opsWhat, value: V.noneAll }] : [] });
  // 건너뛰어도 명의는 적는다(기본값이 「제 명의」) — 꼭 지켜야 하는 항목
  sections.push({ id: 'own', title: T.own, rows: OWN_KEYS.filter((k) => !isUnknown(a.own[k]))
    .map((k) => ({ label: R.own[k], value: (V.own[k] as Record<string, string | undefined>)[a.own[k]] ?? '' })) });
  // 매달 비용은 요청서 줄 대신 업체 질문으로만 묻는다(같은 말이 두 번 나오지 않게)
  sections.push({ id: 'scope', title: T.scope, rows: [
    ...(a.revisions && a.revisions !== 'vendor' ? [{ label: R.revisions, value: V.revisions[a.revisions] ?? '' }] : []),
    ...(a.care ? [{ label: R.care, value: V.care[a.care] }] : []),
  ] });
  sections.push({ id: 'when', title: T.when, rows: [
    ...(a.openDate ? [{ label: R.openDate, value: `${c.doc.formatDay(a.openDate)}${a.openFixed === 'must' ? V.openMust : a.openFixed ? V.openWish : ''}` }] : []),
    ...(a.decider ? [{ label: R.decider, value: V.decider[a.decider] }] : []),
  ] });
  const budget = budgetValue(a, c);
  if (a.budgetInBrief && budget) sections.push({ id: 'budget', title: T.budget, rows: [{ label: R.budget, value: budget }] });
  sections.push({ id: 'unknown', title: T.unknown, rows: unknownList(a, c).map((x) => ({ label: x.label, value: '', tag: 'ask' as const, edit: x.step })) });
  return { title: c.doc.title(name), subtitle: c.doc.subtitle(a.mode === 'renew' ? 'renew' : 'new', today), sections };
}

/** 견적가를 크게 움직이는 항목 — section·label 은 요청서에서 그 항목이 적힌 줄(결과·미리보기에서 그 줄을 표시한다) */
export type Impact = { title: string; reason: string; section: string; label: string };
export function impactItems(a: Answers, today: Date, c: BriefCopy): Impact[] {
  const out: Impact[] = [];
  const F = c.q.features, R = c.doc.rows, I = c.impact;
  const feat = (f: Feature) => I.feature(F.opts[f], a.features[f] === 'must');
  const n = pagesAll(a, c).length;
  if (a.mode === 'renew' && a.renewAmount === 'many') out.push({ title: I.renewMany, reason: c.q.renew.amountWhy, section: 'renew', label: R.renewAmount });
  if (n > PAGES_MANY) out.push({ title: I.pages(n), reason: c.q.pages.manyWhy, section: 'pages', label: R.pages(n) });
  if (a.features.booking) out.push({ title: feat('booking'), reason: a.booking === 'service' ? I.bookingService : F.why.booking!, section: 'features', label: F.opts.booking });
  if (a.features.payment) out.push({ title: feat('payment'), reason: F.why.payment!, section: 'features', label: F.opts.payment });
  if (a.features.members && a.member !== 'adminOnly') out.push({ title: feat('members'), reason: F.why.members!, section: 'features', label: F.opts.members });
  if (a.features.multilang) out.push({ title: I.multilang(Math.max(langCount(a), 1)), reason: F.why.multilang!, section: 'features', label: F.opts.multilang });
  if (a.links.filter((l) => l !== NONE).length > LINKS_MANY) out.push({ title: I.links(a.links.length), reason: c.q.links.manyWhy, section: 'links', label: R.links });
  if (a.copy === 'write') out.push({ title: I.copyWrite, reason: c.q.content.why, section: 'content', label: R.copy });
  if (a.brand.includes(NONE)) out.push({ title: I.noLogo, reason: c.q.brand.noneWhy, section: 'brand', label: R.brand });
  if (a.design === 'custom') out.push({ title: I.custom, reason: c.q.design.customWhy, section: 'design', label: R.design });
  if (a.openFixed === 'must' && a.openDate) {
    // 희망일은 사용자 기기 시간대의 그날 0시로 읽는다(명세 3-4 — 한국 사용자는 전과 결과가 같다)
    const days = (new Date(`${a.openDate}T00:00:00`).getTime() - today.getTime()) / 86_400_000;
    if (days <= RUSH_DAYS) out.push({ title: I.rush, reason: c.q.when.rushWhy, section: 'when', label: R.openDate });
  }
  return out;
}

export function vendorQuestions(a: Answers, c: BriefCopy): string[] {
  const V = c.vendor;
  // 명의(도메인·호스팅·소스)는 요청서 「명의」 단원에 적으므로 다시 묻지 않는다
  const q = [V.revisions, ...(a.monthlyCost ? [V.monthly] : []), V.contact];
  if (needsAdmin(a)) q.push(V.admin);
  if (a.features.booking) q.push(a.booking === 'service' ? V.bookingService : V.bookingOther);
  if (a.features.payment) q.push(V.payment);
  if (a.features.multilang) q.push(V.translate);
  if (a.design === 'existing') q.push(V.existingDesign);
  if (a.copy === 'write') q.push(V.copyCost);
  if (a.mode === 'renew' && (a.renewAmount === 'some' || a.renewAmount === 'many')) q.push(V.migrate);
  if (a.openFixed === 'must') q.push(V.deadline);
  return q;
}

export function toPlainText(a: Answers, today: Date, c: BriefCopy): string {
  const b = buildBrief(a, today, c);
  const lines = [b.title, b.subtitle, ''];
  let n = 0;
  for (const s of b.sections) {
    if (!s.rows.length) continue;
    lines.push(`${++n}. ${s.title}`);
    // 업체 제안 목록은 단원 제목이 이미 말하므로 이름만 한 줄로
    if (s.id === 'unknown') lines.push(s.rows.map((r) => r.label).join(', '));
    else for (const r of s.rows) lines.push(`- ${r.label}${r.tag === 'must' ? ` [${c.doc.tags.must}]` : r.tag === 'later' ? ` [${c.doc.tags.later}]` : ''}${r.value ? `: ${r.value}` : ''}`);
    lines.push('');
  }
  lines.push(c.doc.vendorLead);
  vendorQuestions(a, c).forEach((q, i) => lines.push(`${c.doc.qPrefix(i + 1)} ${q}`));   // 단원 번호(1. 2. …)와 헷갈리지 않게
  return clip(lines.join('\n'), 2000);
}

/** 서랍 요약 줄들(머리표 없이) — 한국어 서랍으로만 간다 */
export function summaryLines(a: Answers, today: Date, c: BriefCopy): string[] {
  const S = c.summary;
  const musts = featureEntries(a).filter(([, t]) => t === 'must').map(([f]) => c.q.features.opts[f]);
  const pages = pagesAll(a, c).length;
  return [
    a.mode === 'renew' ? S.mode.renew : S.mode.new,
    `${S.kind}: ${clip(kindText(a, c), 60)}`,
    a.name.trim() ? `${S.name}: ${clip(a.name.trim(), 40)}` : '',
    a.goalMain ? `${S.goal}: ${c.doc.values.goal[a.goalMain]}` : '',
    musts.length ? `${S.must}: ${list(musts)}` : '',
    a.featuresExtra.trim() ? `${S.extra}: ${clip(a.featuresExtra.trim(), 200)}` : '',
    pages ? S.pages(pages) : '',
    a.openDate ? `${S.open}: ${c.doc.formatDay(a.openDate)}` : '',
    `${S.written}: ${c.doc.formatToday(today)}`,
  ].filter(Boolean);
}

export function briefSummary(a: Answers, today: Date, c: BriefCopy): string {
  return clip([SUMMARY_MARK, ...summaryLines(a, today, c)].join('\n'), 1000);
}

/** PDF 한 쪽 맞춤 — 요청서 분량(줄 수 어림)이 A4 한 쪽(두 칼럼)을 넘으면 인쇄할 때만 그 비율만큼 줄인다.
 *  84 는 실측 기준(보통 분량 78 은 그대로 한 쪽, 거의 모든 칸 + 긴 글 120 은 0.8배 이하에서 한 쪽). 읽을 수 있게 0.6배 아래로는 줄이지 않는다.
 *  한 줄 글자 수는 언어마다 달라 문구 파일(print.lineChars)에서 */
export function printZoom(a: Answers, c: BriefCopy): number {
  const b = buildBrief(a, new Date(), c);
  let load = vendorQuestions(a, c).length * 1.6;
  for (const s of b.sections) {
    if (!s.rows.length) continue;
    load += 2;
    if (s.id === 'unknown') { load += 1; continue; }
    for (const r of s.rows) load += Math.max(1, Math.ceil(r.value.length / c.print.lineChars));
  }
  return Math.max(0.6, Math.min(1, 84 / load));
}

/** 요청서에서 견적가 영향 줄을 찾는 열쇠 — 「단원|줄 이름」 */
export function impactKeys(a: Answers, today: Date, c: BriefCopy): Set<string> {
  return new Set(impactItems(a, today, c).map((i) => `${i.section}|${i.label}`));
}

/** 영어판 「Prologue&에도 보내기」 — 메일 앱을 여는 mailto 주소(명세 5-1). 서버로는 아무것도 가지 않는다.
 *  본문은 첨부 안내 한 줄 + 짧은 요약뿐(전체 글은 인코딩하면 주소 길이 한도를 넘는다). 1,800자를 넘으면
 *  ① 제목·요약의 자유 입력 값(이름·직접 입력 업종·그 밖의 기능)을 40자로 자르고 ② 그래도 넘으면 요약 줄을 뒤에서부터 뺀다.
 *  이름 칸에는 길이 제한이 없고 한글·악센트 글자는 인코딩하면 몇 배로 늘어서, 제목도 자른 이름으로 다시 만든다. 결과는 늘 1,800자 안 */
export const MAIL_MAX = 1800;
export function mailHref(a: Answers, today: Date, c: BriefCopy, to: string): string {
  try { return mailHrefRaw(a, today, c, to); } catch { return `mailto:${to}`; }   // 인코딩이 어떤 이유로든 깨져도 화면은 멈추지 않는다
}
function mailHrefRaw(a: Answers, today: Date, c: BriefCopy, to: string): string {
  const attach = c.end.kind === 'mail' ? c.end.attachLine : '';
  const href = (title: string, lines: string[]) => `mailto:${to}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent([attach, '', ...lines].join('\n'))}`;
  const full = href(buildBrief(a, today, c).title, summaryLines(a, today, c));
  if (full.length <= MAIL_MAX) return full;
  const short = { ...a, name: clip(a.name.trim(), 40), kindOther: clip(a.kindOther.trim(), 40), featuresExtra: clip(a.featuresExtra.trim(), 40) };
  const title = c.doc.title(short.name || c.doc.untitled);
  let lines = summaryLines(short, today, c);
  while (lines.length && href(title, lines).length > MAIL_MAX) lines = lines.slice(0, -1);
  if (href(title, lines).length <= MAIL_MAX) return href(title, lines);
  // 마지막 안전망 — 이름 없는 제목과 첨부 안내만, 그래도 넘으면(받는 주소가 아주 길 때) 받는 사람만
  const bare = href(c.doc.title(c.doc.untitled), []);
  return bare.length <= MAIL_MAX ? bare : `mailto:${to}`;
}
