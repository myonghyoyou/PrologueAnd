import { Q } from '@/content/brief/questions';
import { UNKNOWN, type Answers, type Feature, type StepId } from './types';

/** edit: 그 줄을 고칠 질문(업체 제안 항목) */
export type Row = { label: string; value: string; tag?: 'must' | 'later' | 'ask'; edit?: StepId };
export type Section = { id: string; title: string; rows: Row[] };

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

/** 업체 제안으로 넘길 항목과 그 항목을 고칠 질문 — 결과에서 항목마다 「고치기」로 바로 간다 */
export function unknownList(a: Answers): { label: string; step: StepId }[] {
  const out: { label: string; step: StepId }[] = [];
  const add = (label: string, step: StepId) => out.push({ label, step });
  if (a.mode === 'renew' && isUnknown(a.renewAmount)) add('옮길 글·사진 양', 'renew');
  if (a.audience.length === 0 || a.audience.includes(UNKNOWN)) add('주 방문자', 'audience');
  if (pagesAll(a).length === 0) add('화면 구성', 'pages');
  if (a.featuresUnknown || (featureEntries(a).length === 0 && !a.featuresExtra.trim())) add('필요한 기능', 'features');
  if (a.links.length === 0) add('연결할 서비스', 'links');
  if (isUnknown(a.copy)) add('소개 글', 'content');
  if (isUnknown(a.photo) || a.photo === '없어요') add('사진', 'content');   // 사진이 없으면 준비 방법을 업체에 맡긴다
  if (a.brand.length === 0) add('디자인 자료', 'brand');
  if (isUnknown(a.design)) add('디자인 방식', 'design');
  if (a.ops.length === 0) add('오픈 뒤 운영', 'ops');
  (['domain', 'hosting', 'admin', 'source'] as const).forEach((k) => {
    if (isUnknown(a.own[k])) add(Q.own.rows.find((r) => r.key === k)!.label.replace(/\s*\(.*?\)/g, ''), 'own');
  });
  if (!a.revisions || a.revisions === '업체 제안') add('수정 횟수', 'scope');
  if (!a.care) add('오픈 뒤 관리', 'scope');
  if (!a.openDate) add('오픈 일정', 'when');
  return out;
}

export function unknownItems(a: Answers): string[] {
  return unknownList(a).map((x) => x.label);
}

/* 업체에게 보내는 문서 말투 — 선택지 단추의 글자(해요체·부탁·반말)를 그대로 옮기지 않고 명사형으로 바꾼다 */
const GOAL: Record<string, string> = { '전화하기': '전화 문의', '문의 남기기': '문의 남기기', '예약하기': '예약', '찾아오기': '매장 방문', '상품 사기': '상품 구매', '소식 보기': '소식 보기' };
const AMOUNT: Record<string, string> = { '적어요(10개 이하)': '적음(10개 이하)', '보통': '보통(10~100개)', '많아요(100개 넘음)': '많음(100개 넘음)' };
const COPY: Record<string, string> = { '직접 준비': '직접 준비', '써 주길 원함': '작성 요청' };
const PHOTO: Record<string, string> = { '있어요': '있음', '없어요': '없음' };
const DESIGN: Record<string, string> = { '템플릿이어도 괜찮아요': '템플릿 사용 가능', '새 디자인을 맞춤으로 만들어 주세요': '맞춤 디자인 희망', '이미 정해진 디자인이 있어요': '정해진 디자인 있음(그대로 적용)' };
const OWN: Record<string, string> = { '내 이름으로': '제 명의', '업체에 맡김': '업체에 맡김', '대표 계정은 내가': '대표 계정은 제가 보유', '오픈 때 받기': '오픈 때 인도', '안 받아도 됨': '인도 필요 없음' };
const CARE: Record<string, string> = { '매달 맡기기': '매달 관리 맡김', '필요할 때만': '필요할 때만 요청', '직접 할게요': '직접 관리' };
const DECIDER: Record<string, string> = { '나 혼자': '대표 혼자', '여럿이 같이': '여러 명이 함께' };
const BRAND: Record<string, string> = { '없어요': '없음' };
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
/** 「2026-11-10」 → 「2026년 11월 10일(화)」 */
const dayKo = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${y}년 ${m}월 ${d}일(${DAYS[new Date(y, m - 1, d).getDay()]})`;
};
const pick = (map: Record<string, string>, v: string) => map[v] ?? v;

export function buildBrief(a: Answers, today: Date): { title: string; subtitle: string; sections: Section[] } {
  const name = clip(a.name.trim(), 60) || '이름 미정';
  const sections: Section[] = [];
  sections.push({ id: 'purpose', title: '목적', rows: [
    { label: '업종', value: clip(kindText(a), 80) },
    ...(a.goalMain ? [{ label: '가장 중요한 고객 행동', value: pick(GOAL, a.goalMain) }] : []),
    ...(a.goalMore.length ? [{ label: '그 밖의 고객 행동', value: list(a.goalMore.map((g) => pick(GOAL, g))) }] : []),
    ...(a.audience.length && !a.audience.includes(UNKNOWN) ? [{ label: '주 방문자', value: list(a.audience) }] : []),
  ] });
  if (a.mode === 'renew') sections.push({ id: 'renew', title: '기존 홈페이지', rows: [
    ...(a.renewUrl.trim() ? [{ label: '주소', value: clip(a.renewUrl.trim(), 120) }] : []),
    ...(a.renewPain.trim() ? [{ label: '불편한 점', value: clip(a.renewPain.trim(), 300) }] : []),
    ...(a.renewAmount && !isUnknown(a.renewAmount) ? [{ label: '옮길 글·사진 양', value: pick(AMOUNT, a.renewAmount) }] : []),
  ] });
  const pages = pagesAll(a);
  // 항목 안에도 「·」가 있어(메뉴·서비스) 항목 사이는 「 / 」로 나눈다
  sections.push({ id: 'pages', title: '화면 구성', rows: pages.length ? [{ label: `화면 ${pages.length}개`, value: clip(pages.join(' / '), 300) }] : [] });
  sections.push({ id: 'features', title: '기능', rows: [
    ...featureEntries(a).map(([f, t]) => ({ label: f, value: featureDetail(a, f), tag: t })),
    ...(a.featuresExtra.trim() ? [{ label: '그 밖에', value: clip(a.featuresExtra.trim(), 300) }] : []),
  ] });
  sections.push({ id: 'links', title: '연결할 서비스', rows: a.links.length ? [{ label: '이용 중', value: a.links.includes('없어요') ? '없음' : list(a.links) }] : [] });
  sections.push({ id: 'content', title: '글과 사진', rows: [
    ...(a.copy && !isUnknown(a.copy) ? [{ label: '소개 글', value: pick(COPY, a.copy) }] : []),
    ...(a.photo && !isUnknown(a.photo) ? [{ label: '사진', value: pick(PHOTO, a.photo) }] : []),
    ...(a.contentBy ? [{ label: '자료 전달 가능일', value: dayKo(a.contentBy) }] : []),
  ] });
  sections.push({ id: 'brand', title: '디자인 자료', rows: a.brand.length ? [{ label: '보유 자료', value: list(a.brand.map((x) => pick(BRAND, x))) }] : [] });
  sections.push({ id: 'design', title: '디자인', rows: [
    ...(a.design && !isUnknown(a.design) ? [{ label: '방식', value: pick(DESIGN, a.design) }] : []),
    ...a.refs.filter((r) => r.url.trim()).flatMap((r, i) => [
      { label: `참고 사이트 ${i + 1}`, value: clip(r.url.trim(), 200) },
      ...(r.likes.length ? [{ label: `참고 ${i + 1} 좋은 점`, value: list(r.likes) }] : []),
      ...(r.memo.trim() ? [{ label: `참고 ${i + 1} 메모`, value: clip(r.memo.trim(), 200) }] : []),
    ]),
    ...(a.dislikes.trim() ? [{ label: '피하고 싶은 것', value: clip(a.dislikes.trim(), 300) }] : []),
  ] });
  sections.push({ id: 'ops', title: '오픈 뒤 운영', rows: needsAdmin(a)
    ? [{ label: '직접 올리거나 고칠 것', value: list(a.ops) }, { label: '관리자 화면', value: '필요' }]
    : a.ops.length ? [{ label: '직접 올리거나 고칠 것', value: '없음(모두 맡김)' }] : [] });
  // 건너뛰어도 명의는 적는다(기본값이 「제 명의」) — 꼭 지켜야 하는 항목
  sections.push({ id: 'own', title: '명의', rows: Q.own.rows.filter((r) => !isUnknown(a.own[r.key])).map((r) => ({ label: r.label.replace(/\s*\(.*?\)/g, ''), value: pick(OWN, a.own[r.key]) })) });
  // 매달 비용은 요청서 줄 대신 업체 질문으로만 묻는다(같은 말이 두 번 나오지 않게)
  sections.push({ id: 'scope', title: '범위', rows: [
    ...(a.revisions && a.revisions !== '업체 제안' ? [{ label: '수정 횟수', value: a.revisions.replace('(보통)', '') }] : []),
    ...(a.care ? [{ label: '오픈 뒤 관리', value: pick(CARE, a.care) }] : []),
  ] });
  sections.push({ id: 'when', title: '일정과 결정', rows: [
    ...(a.openDate ? [{ label: '오픈 희망일', value: `${dayKo(a.openDate)}${a.openFixed === Q.when.fixed.must ? ', 이 날짜에 꼭 오픈 필요' : a.openFixed ? ', 희망일' : ''}` }] : []),
    ...(a.decider ? [{ label: '최종 결정', value: pick(DECIDER, a.decider) }] : []),
  ] });
  if (a.budgetInBrief && a.budget && !isUnknown(a.budget)) sections.push({ id: 'budget', title: '예산', rows: [{ label: '생각하는 예산', value: a.budget }] });
  sections.push({ id: 'unknown', title: '업체 제안을 받고 싶은 것', rows: unknownList(a).map((x) => ({ label: x.label, value: '', tag: 'ask' as const, edit: x.step })) });
  return {
    title: `홈페이지 제작 요청서 · ${name}`,
    subtitle: `${a.mode === 'renew' ? '기존 홈페이지 개편' : '새로 제작'} · ${dateKo(today)} 작성`,
    sections,
  };
}

/** 견적가를 크게 움직이는 항목 — section·label 은 요청서에서 그 항목이 적힌 줄(결과·미리보기에서 그 줄을 표시한다) */
export type Impact = { title: string; reason: string; section: string; label: string };
export function impactItems(a: Answers, today: Date): Impact[] {
  const out: Impact[] = [];
  const t = (f: Feature) => (a.features[f] === 'must' ? '오픈 때 필수' : '나중에');
  if (a.mode === 'renew' && a.renewAmount?.startsWith('많아요')) out.push({ title: '옮길 글·사진 많음', reason: Q.renew.amountWhy, section: 'renew', label: '옮길 글·사진 양' });
  if (pagesAll(a).length > 10) out.push({ title: `화면 ${pagesAll(a).length}개`, reason: Q.pages.manyWhy, section: 'pages', label: `화면 ${pagesAll(a).length}개` });
  if (a.features['예약 받기']) out.push({ title: `예약 받기 (${t('예약 받기')})`, reason: a.booking === '네이버 예약 연결' ? '네이버 예약을 연결해서 견적가 부담이 적은 편이에요. 홈페이지 안에서 직접 받으면 견적가가 크게 올라가요.' : Q.features.why['예약 받기']!, section: 'features', label: '예약 받기' });
  if (a.features['상품 결제']) out.push({ title: `상품 결제 (${t('상품 결제')})`, reason: Q.features.why['상품 결제']!, section: 'features', label: '상품 결제' });
  if (a.features['회원'] && a.member !== '관리자만') out.push({ title: `회원 (${t('회원')})`, reason: Q.features.why['회원']!, section: 'features', label: '회원' });
  if (a.features['외국어 페이지']) out.push({ title: `외국어 페이지 (${Math.max(langCount(a), 1)}개 언어)`, reason: Q.features.why['외국어 페이지']!, section: 'features', label: '외국어 페이지' });
  if (a.links.filter((l) => l !== '없어요').length > 3) out.push({ title: `연결할 서비스 ${a.links.length}곳`, reason: Q.links.manyWhy, section: 'links', label: '이용 중' });
  if (a.copy === '써 주길 원함') out.push({ title: '소개 글 작성 요청', reason: Q.content.why, section: 'content', label: '소개 글' });
  if (a.brand.includes('없어요')) out.push({ title: '로고 없음', reason: Q.brand.noneWhy, section: 'brand', label: '보유 자료' });
  if (a.design === Q.design.custom) out.push({ title: '맞춤 디자인', reason: Q.design.customWhy, section: 'design', label: '방식' });
  if (a.openFixed === Q.when.fixed.must && a.openDate) {
    const days = (new Date(`${a.openDate}T00:00:00+09:00`).getTime() - today.getTime()) / 86_400_000;
    if (days <= 30) out.push({ title: '정해진 날짜에 꼭 오픈', reason: Q.when.rushWhy, section: 'when', label: '오픈 희망일' });
  }
  return out;
}

export function vendorQuestions(a: Answers): string[] {
  // 명의(도메인·호스팅·소스)는 요청서 「명의」 단원에 적으므로 다시 묻지 않는다
  const q = ['수정은 몇 번까지 포함인가요?', ...(a.monthlyCost ? ['오픈 뒤 매달 드는 비용은 무엇이고 얼마인가요?'] : []), '오픈 뒤 고칠 게 생기면 어디로 연락하고, 보통 며칠 걸리나요?'];
  if (needsAdmin(a)) q.push('관리자 화면에서 제가 직접 고칠 수 있는 범위는 어디까지인가요?');
  if (a.features['예약 받기']) q.push(a.booking === '네이버 예약 연결' ? '네이버 예약은 어떻게 연결하시나요?' : '예약은 어떤 방식으로 만드시나요?');
  if (a.features['상품 결제']) q.push('결제 수수료와 결제 서비스 가입은 누가 하나요?');
  if (a.features['외국어 페이지']) q.push('외국어 글 번역도 포함인가요?');
  if (a.design === Q.design.existing) q.push('정해 둔 디자인(색·글꼴·화면 규칙)을 그대로 따라 만들어 주시나요?');
  if (a.copy === '써 주길 원함') q.push('글 작성 비용은 견적에 들어 있나요?');
  if (a.mode === 'renew' && a.renewAmount && /^(보통|많아요)/.test(a.renewAmount)) q.push('지금 홈페이지의 글과 사진을 옮기는 것도 포함인가요?');
  if (a.openFixed === Q.when.fixed.must) q.push('이 날짜까지 오픈이 가능한가요? 늦어지면 어떻게 하나요?');
  return q;
}

export function toPlainText(a: Answers, today: Date): string {
  const b = buildBrief(a, today);
  const lines = [b.title, b.subtitle, ''];
  let n = 0;
  for (const s of b.sections) {
    if (!s.rows.length) continue;
    lines.push(`${++n}. ${s.title}`);
    // 업체 제안 목록은 단원 제목이 이미 말하므로 이름만 한 줄로
    if (s.id === 'unknown') lines.push(s.rows.map((r) => r.label).join(', '));
    else for (const r of s.rows) lines.push(`- ${r.label}${r.tag === 'must' ? ' [오픈 때 필수]' : r.tag === 'later' ? ' [나중에]' : ''}${r.value ? `: ${r.value}` : ''}`);
    lines.push('');
  }
  lines.push('견적 주실 때 아래 질문에도 답해 주세요.');
  vendorQuestions(a).forEach((q, i) => lines.push(`Q${i + 1}. ${q}`));   // 단원 번호(1. 2. …)와 헷갈리지 않게
  return clip(lines.join('\n'), 2000);
}

export function briefSummary(a: Answers, today: Date): string {
  const musts = featureEntries(a).filter(([, t]) => t === 'must').map(([f]) => f);
  const parts = [
    '[요청서 만들기]',
    a.mode === 'renew' ? '기존 홈페이지 개편' : '새로 제작',
    `업종: ${clip(kindText(a), 60)}`,
    a.name.trim() ? `이름: ${clip(a.name.trim(), 40)}` : '',
    a.goalMain ? `가장 중요한 고객 행동: ${pick(GOAL, a.goalMain)}` : '',
    musts.length ? `꼭 필요한 기능: ${list(musts)}` : '',
    a.featuresExtra.trim() ? `그 밖에 필요한 기능: ${clip(a.featuresExtra.trim(), 200)}` : '',
    pagesAll(a).length ? `화면 ${pagesAll(a).length}개` : '',
    a.openDate ? `오픈 희망일: ${dayKo(a.openDate)}` : '',
    `작성일: ${dateKo(today)}`,
  ].filter(Boolean);
  return clip(parts.join('\n'), 1000);
}

/** PDF 한 쪽 맞춤 — 요청서 분량(줄 수 어림)이 A4 한 쪽(두 칼럼)을 넘으면 인쇄할 때만 그 비율만큼 줄인다.
 *  84 는 실측 기준(보통 분량 78 은 그대로 한 쪽, 거의 모든 칸 + 긴 글 120 은 0.8배 이하에서 한 쪽). 읽을 수 있게 0.6배 아래로는 줄이지 않는다 */
export function printZoom(a: Answers): number {
  const b = buildBrief(a, new Date());
  let load = vendorQuestions(a).length * 1.6;
  for (const s of b.sections) {
    if (!s.rows.length) continue;
    load += 2;
    if (s.id === 'unknown') { load += 1; continue; }
    for (const r of s.rows) load += Math.max(1, Math.ceil(r.value.length / 26));
  }
  return Math.max(0.6, Math.min(1, 84 / load));
}

/** 요청서에서 견적가 영향 줄을 찾는 열쇠 — 「단원|줄 이름」 */
export function impactKeys(a: Answers, today: Date): Set<string> {
  return new Set(impactItems(a, today).map((i) => `${i.section}|${i.label}`));
}
