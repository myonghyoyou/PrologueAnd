import { Q } from '@/content/brief/questions';
import { UNKNOWN, type Answers, type Feature } from './types';

export type Row = { label: string; value: string; tag?: 'must' | 'later' | 'ask' };
export type Section = { id: string; title: string; rows: Row[] };

const ASK = '업체 제안 받기';
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const list = (xs: string[]) => xs.filter(Boolean).join(', ');
const dateKo = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
const isUnknown = (v?: string) => !v || v === UNKNOWN || v.startsWith('모르겠어요');
const kindText = (a: Answers) => (a.kind === '직접 입력' ? a.kindOther.trim() : a.kind ?? '');
const featureEntries = (a: Answers) => (Object.entries(a.features) as [Feature, 'must' | 'later'][]);
const pagesAll = (a: Answers) => [...a.pages, ...a.pagesExtra.split(',').map((s) => s.trim()).filter(Boolean)];
const needsAdmin = (a: Answers) => a.ops.some((o) => !o.startsWith('없어요'));
const langCount = (a: Answers) => a.langs.length + (a.langOther.trim() ? 1 : 0);

function featureDetail(a: Answers, f: Feature): string {
  if (f === '예약 받기') return a.booking && !isUnknown(a.booking) ? a.booking : '';
  if (f === '상품 결제') return list([a.shopCount && !isUnknown(a.shopCount) ? `상품 ${a.shopCount}` : '', a.shopHow && !isUnknown(a.shopHow) ? a.shopHow : '']);
  if (f === '회원') return a.member && !isUnknown(a.member) ? a.member : '';
  if (f === '외국어 페이지') return list([...a.langs, a.langOther.trim()]);
  return '';
}

export function unknownItems(a: Answers): string[] {
  const out: string[] = [];
  if (a.mode === 'renew' && isUnknown(a.renewAmount)) out.push('옮길 글·사진 양');
  if (a.audience.length === 0 || a.audience.includes(UNKNOWN)) out.push('주로 보는 사람');
  if (pagesAll(a).length === 0) out.push('페이지 구성');
  if (a.featuresUnknown || (featureEntries(a).length === 0 && !a.featuresExtra.trim())) out.push('필요한 기능');
  if (a.links.length === 0) out.push('이어져야 하는 것');
  if (isUnknown(a.copy)) out.push('소개 글');
  if (isUnknown(a.photo)) out.push('사진');
  if (a.brand.length === 0) out.push('디자인 자료');
  if (isUnknown(a.design)) out.push('디자인 방식');
  if (a.ops.length === 0) out.push('오픈 뒤 운영');
  (['domain', 'hosting', 'admin', 'source'] as const).forEach((k) => {
    if (isUnknown(a.own[k])) out.push(Q.own.rows.find((r) => r.key === k)!.label.replace(/s*(.*?)/g, ''));
  });
  if (!a.revisions || a.revisions === '업체 제안') out.push('수정 횟수');
  if (!a.care) out.push('오픈 뒤 관리');
  if (!a.openDate) out.push('오픈 일정');
  return out;
}

export function buildBrief(a: Answers, today: Date): { title: string; subtitle: string; sections: Section[] } {
  const name = clip(a.name.trim(), 60) || '이름 미정';
  const sections: Section[] = [];
  sections.push({ id: 'purpose', title: '무엇을 위한 홈페이지인가요', rows: [
    { label: '어떤 곳', value: clip(kindText(a), 80) },
    { label: '고객이 할 일', value: [a.goalMain ?? '', ...(a.goalMore.length ? [`그 밖에 ${list(a.goalMore)}`] : [])].filter(Boolean).join(' · ') },
    ...(a.audience.length && !a.audience.includes(UNKNOWN) ? [{ label: '주로 보는 사람', value: list(a.audience) }] : []),
  ] });
  if (a.mode === 'renew') sections.push({ id: 'renew', title: '지금 홈페이지', rows: [
    ...(a.renewUrl.trim() ? [{ label: '주소', value: clip(a.renewUrl.trim(), 120) }] : []),
    ...(a.renewPain.trim() ? [{ label: '불편한 점', value: clip(a.renewPain.trim(), 300) }] : []),
    ...(a.renewAmount && !isUnknown(a.renewAmount) ? [{ label: '옮길 글·사진', value: a.renewAmount }] : []),
  ] });
  const pages = pagesAll(a);
  sections.push({ id: 'pages', title: '페이지', rows: pages.length ? [{ label: `메뉴 ${pages.length}개`, value: clip(pages.join(' · '), 300) }] : [] });
  sections.push({ id: 'features', title: '기능', rows: [
    ...featureEntries(a).map(([f, t]) => ({ label: f, value: featureDetail(a, f), tag: t })),
    ...(a.featuresExtra.trim() ? [{ label: '그 밖에', value: clip(a.featuresExtra.trim(), 300) }] : []),
  ] });
  sections.push({ id: 'links', title: '이어져야 하는 것', rows: a.links.length ? [{ label: '연결', value: list(a.links) }] : [] });
  sections.push({ id: 'content', title: '글과 사진', rows: [
    ...(a.copy && !isUnknown(a.copy) ? [{ label: '소개 글', value: a.copy }] : []),
    ...(a.photo && !isUnknown(a.photo) ? [{ label: '사진', value: a.photo }] : []),
    ...(a.contentBy ? [{ label: '자료 줄 수 있는 날', value: a.contentBy }] : []),
  ] });
  sections.push({ id: 'brand', title: '디자인 자료', rows: a.brand.length ? [{ label: '있는 것', value: list(a.brand) }] : [] });
  sections.push({ id: 'design', title: '디자인과 참고 사이트', rows: [
    ...(a.design && !isUnknown(a.design) ? [{ label: '방식', value: a.design }] : []),
    ...a.refs.filter((r) => r.url.trim()).map((r, i) => ({ label: `참고 ${i + 1}`, value: clip([r.url.trim(), r.likes.length ? `좋은 점: ${list(r.likes)}` : '', r.memo.trim()].filter(Boolean).join(' — '), 300) })),
    ...(a.dislikes.trim() ? [{ label: '피하고 싶은 것', value: clip(a.dislikes.trim(), 300) }] : []),
  ] });
  sections.push({ id: 'ops', title: '오픈 뒤 운영', rows: needsAdmin(a)
    ? [{ label: '직접 고칠 것', value: `${list(a.ops)} — 관리자 화면 필요` }]
    : a.ops.length ? [{ label: '직접 고칠 것', value: '없음(다 맡김)' }] : [] });
  sections.push({ id: 'own', title: '명의와 소유권', rows: Q.own.rows.filter((r) => !isUnknown(a.own[r.key])).map((r) => ({ label: r.label.replace(/\s*\(.*?\)/g, ''), value: a.own[r.key] })) });
  sections.push({ id: 'scope', title: '범위와 비용', rows: [
    ...(a.revisions && a.revisions !== '업체 제안' ? [{ label: '수정 횟수', value: a.revisions.replace('(보통)', '') }] : []),
    ...(a.care ? [{ label: '오픈 뒤 관리', value: a.care }] : []),
    ...(a.monthlyCost ? [{ label: '매달 비용', value: '매달 나가는 비용을 모두 알려 주세요' }] : []),
  ] });
  sections.push({ id: 'when', title: '일정과 결정', rows: [
    ...(a.openDate ? [{ label: '오픈 희망일', value: `${a.openDate}${a.openFixed ? ` (${a.openFixed})` : ''}` }] : []),
    ...(a.decider ? [{ label: '최종 결정', value: a.decider }] : []),
  ] });
  if (a.budgetInBrief && a.budget && !isUnknown(a.budget)) sections.push({ id: 'budget', title: '예산', rows: [{ label: '생각하는 예산', value: a.budget }] });
  sections.push({ id: 'unknown', title: '업체 제안을 받고 싶은 것', rows: unknownItems(a).map((l) => ({ label: l, value: ASK, tag: 'ask' as const })) });
  return {
    title: `홈페이지 제작 요청서 · ${name}`,
    subtitle: `${a.mode === 'renew' ? '지금 홈페이지 고치기' : '새로 만들기'} · ${dateKo(today)} 작성`,
    sections,
  };
}

export function impactItems(a: Answers, today: Date): { title: string; reason: string }[] {
  const out: { title: string; reason: string }[] = [];
  const t = (f: Feature) => (a.features[f] === 'must' ? '오픈 때 꼭' : '나중에');
  if (a.mode === 'renew' && a.renewAmount?.startsWith('많아요')) out.push({ title: '옮길 글·사진이 많음', reason: Q.renew.amountWhy });
  if (pagesAll(a).length > 10) out.push({ title: `페이지 ${pagesAll(a).length}개`, reason: Q.pages.manyWhy });
  if (a.features['예약 받기']) out.push({ title: `예약 받기 (${t('예약 받기')})`, reason: a.booking === '네이버 예약 연결' ? '네이버 예약을 연결해서 가벼운 편이에요. 홈페이지 안에서 직접 받으면 크게 올라가요.' : Q.features.why['예약 받기']! });
  if (a.features['상품 결제']) out.push({ title: `상품 결제 (${t('상품 결제')})`, reason: Q.features.why['상품 결제']! });
  if (a.features['회원'] && a.member !== '관리자만') out.push({ title: `회원 (${t('회원')})`, reason: Q.features.why['회원']! });
  if (a.features['외국어 페이지']) out.push({ title: `외국어 페이지 (${Math.max(langCount(a), 1)}개 언어)`, reason: Q.features.why['외국어 페이지']! });
  if (a.links.filter((l) => l !== '없어요').length > 3) out.push({ title: `연결 ${a.links.length}곳`, reason: Q.links.manyWhy });
  if (a.copy === '써 주길 원함') out.push({ title: '소개 글 작성을 맡김', reason: Q.content.why });
  if (a.photo === '찍어 주길 원함') out.push({ title: '사진 촬영을 맡김', reason: Q.content.why });
  if (a.brand.includes('없어요')) out.push({ title: '로고가 없음', reason: Q.brand.noneWhy });
  if (a.design === Q.design.custom) out.push({ title: '맞춤 디자인', reason: Q.design.customWhy });
  if (a.openFixed === '개업·행사라 꼭' && a.openDate) {
    const days = (new Date(`${a.openDate}T00:00:00+09:00`).getTime() - today.getTime()) / 86_400_000;
    if (days <= 30) out.push({ title: '개업·행사 날짜에 맞춰야 함', reason: Q.when.rushWhy });
  }
  return out;
}

export function vendorQuestions(a: Answers): string[] {
  const q = ['도메인과 호스팅은 제 이름으로 사 주시나요?', '수정은 몇 번까지 포함인가요?', '오픈 뒤 매달 드는 비용은 무엇이고 얼마인가요?', '오픈 뒤 고칠 게 생기면 어디로 연락하고, 보통 며칠 걸리나요?'];
  if (a.own.source === '오픈 때 받기') q.push('오픈할 때 소스와 디자인 파일을 넘겨 주시나요?');
  if (needsAdmin(a)) q.push('관리자 화면에서 제가 직접 고칠 수 있는 범위는 어디까지인가요?');
  if (a.features['예약 받기']) q.push(a.booking === '네이버 예약 연결' ? '네이버 예약은 어떻게 연결하시나요?' : '예약은 어떤 방식으로 만드시나요?');
  if (a.features['상품 결제']) q.push('결제 수수료와 결제 서비스 가입은 누가 하나요?');
  if (a.features['외국어 페이지']) q.push('외국어 글 번역도 포함인가요?');
  if (a.design === Q.design.existing) q.push('정해 둔 디자인(색·글꼴·화면 규칙)을 그대로 따라 만들어 주시나요?');
  if (a.copy === '써 주길 원함' || a.photo === '찍어 주길 원함') q.push('글 작성·사진 촬영 비용은 견적에 들어 있나요?');
  if (a.mode === 'renew' && a.renewAmount && /^(보통|많아요)/.test(a.renewAmount)) q.push('지금 홈페이지의 글과 사진을 옮기는 것도 포함인가요?');
  if (a.openFixed === '개업·행사라 꼭') q.push('이 날짜까지 오픈이 가능한가요? 늦어지면 어떻게 하나요?');
  return q;
}

export function toPlainText(a: Answers, today: Date): string {
  const b = buildBrief(a, today);
  const lines = [b.title, b.subtitle, ''];
  for (const s of b.sections) {
    if (!s.rows.length) continue;
    lines.push(`■ ${s.title}`);
    for (const r of s.rows) lines.push(`- ${r.label}${r.tag === 'must' ? ' [오픈 때 꼭]' : r.tag === 'later' ? ' [나중에]' : ''}${r.value ? `: ${r.value}` : ''}`);
    lines.push('');
  }
  lines.push('■ 견적 주실 때 함께 답해 주세요');
  vendorQuestions(a).forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  return clip(lines.join('\n'), 2000);
}

export function briefSummary(a: Answers, today: Date): string {
  const musts = featureEntries(a).filter(([, t]) => t === 'must').map(([f]) => f);
  const parts = [
    '[요청서 만들기]',
    a.mode === 'renew' ? '지금 홈페이지 고치기' : '새로 만들기',
    `어떤 곳: ${clip(kindText(a), 60)}${a.name.trim() ? ` (${clip(a.name.trim(), 40)})` : ''}`,
    a.goalMain ? `고객이 할 일: ${a.goalMain}` : '',
    musts.length ? `꼭 필요한 기능: ${list(musts)}` : '',
    a.featuresExtra.trim() ? `그 밖에 필요한 기능: ${clip(a.featuresExtra.trim(), 200)}` : '',
    pagesAll(a).length ? `페이지 ${pagesAll(a).length}개` : '',
    a.openDate ? `오픈 희망일: ${a.openDate}` : '',
    `작성일: ${dateKo(today)}`,
  ].filter(Boolean);
  return clip(parts.join('\n'), 1000);
}
