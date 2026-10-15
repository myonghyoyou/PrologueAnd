'use client';
import { useMemo } from 'react';
import { buildBrief } from '@/lib/brief/derive';
import type { Answers, StepId } from '@/lib/brief/types';
import s from './preview.module.css';

/** 질문 단계 → 요청서 단원 — 지금 답하는 단원을 표시한다 */
const SECTION_OF: Record<StepId, string> = {
  mode: 'purpose', renew: 'renew', kind: 'purpose', goal: 'purpose', audience: 'purpose', pages: 'pages', features: 'features', links: 'links',
  content: 'content', brand: 'brand', design: 'design', ops: 'ops', own: 'own', scope: 'scope', when: 'when',
};

/** 답이 요청서가 되어 가는 모습 — 결과 화면과 같은 계산(buildBrief)을 줄여서 보인다 */
export function BriefPreview({ a, current, limit }: { a: Answers; current?: StepId; limit?: number }) {
  const today = useMemo(() => new Date(), []);
  const b = useMemo(() => buildBrief(a, today), [a, today]);
  const cur = current ? SECTION_OF[current] : undefined;
  // 답하는 중에는 「업체 제안을 받고 싶은 것」은 뺀다 — 아직 묻지 않은 질문까지 모르는 것으로 보인다
  const secs = b.sections.filter((x) => (x.rows.length || x.id === cur) && !(current && x.id === 'unknown')).slice(0, limit);
  return (
    <div className={s.doc}>
      <p className={s.title}>{b.title}</p>
      <p className={s.meta}>{b.subtitle}</p>
      {secs.map((x) => (
        <section key={x.id} className={x.id === cur ? `${s.sec} ${s.cur}` : s.sec} {...(x.id === cur ? { 'data-current': '' } : {})}>
          <p className={s.secT}>{x.title}</p>
          {x.rows.length ? (
            <dl className={s.dl}>{x.rows.map((r, i) => (
              <div key={i} className={s.row}><dt>{r.label}</dt><dd className={r.tag === 'ask' ? s.ask : ''}>{r.tag === 'must' ? '[오픈 때 꼭] ' : r.tag === 'later' ? '[나중에] ' : ''}{r.value}</dd></div>
            ))}</dl>
          ) : <p className={s.empty}>답하면 여기에 채워져요</p>}
        </section>
      ))}
    </div>
  );
}
