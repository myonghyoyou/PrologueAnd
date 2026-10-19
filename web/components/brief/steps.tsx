'use client';
import { Q } from '@/content/brief/questions';
import { UNKNOWN, type Answers, type Feature, type Goal, type StepId } from '@/lib/brief/types';
import { Check, Follow, Impact, Multi, Seg, Single, TextIn } from './fields';
import s from './fields.module.css';
import { DateField } from '@/components/ui/date-field';

type P = { a: Answers; set: (p: Partial<Answers>) => void };

export const STEP_TITLE: Record<StepId, string> = {
  mode: Q.mode.title, renew: Q.renew.title, kind: Q.kind.title, goal: Q.goal.title, audience: Q.audience.title, pages: Q.pages.title,
  features: Q.features.title, links: Q.links.title, content: Q.content.title, brand: Q.brand.title, design: Q.design.title,
  ops: Q.ops.title, own: Q.own.title, scope: Q.scope.title, when: Q.when.title,
};
export const STEP_HELP: Partial<Record<StepId, string>> = {
  kind: Q.kind.help, goal: Q.goal.help, audience: Q.audience.help, pages: Q.pages.help, features: Q.features.help, ops: Q.ops.help, own: Q.own.help,
};

export function StepView({ id, a, set }: P & { id: StepId }) {
  switch (id) {
    case 'mode': return <Single opts={Q.mode.opts} value={a.mode === 'new' ? Q.mode.opts[0] : a.mode === 'renew' ? Q.mode.opts[1] : undefined} onChange={(v) => set({ mode: v === Q.mode.opts[0] ? 'new' : 'renew' })} />;
    case 'renew': return (<>
      <TextIn label={Q.renew.url} value={a.renewUrl} onChange={(v) => set({ renewUrl: v })} type="url" />
      <TextIn label={Q.renew.pain} value={a.renewPain} onChange={(v) => set({ renewPain: v })} multiline />
      <Single label={Q.renew.amount.label} opts={Q.renew.amount.opts} value={a.renewAmount} onChange={(v) => set({ renewAmount: v })} />
      {a.renewAmount?.startsWith('많아요') ? <Impact why={Q.renew.amountWhy} /> : null}
    </>);
    case 'kind': return (<>
      <Single opts={Q.kind.opts} value={a.kind} onChange={(v) => set({ kind: v })} />
      {a.kind === '직접 입력' ? <TextIn label="어떤 곳인지 적어 주세요" value={a.kindOther} onChange={(v) => set({ kindOther: v })} /> : null}
      <TextIn label={Q.kind.name} help={Q.kind.nameHelp} value={a.name} onChange={(v) => set({ name: v })} data="data-brief-name" />
    </>);
    case 'goal': return (<>
      <Single opts={Q.goal.opts} value={a.goalMain} onChange={(v) => set({ goalMain: v as Goal, goalMore: a.goalMore.filter((g) => g !== v),
        ...(v === '상품 사기' && !a.features['상품 결제'] ? { features: { ...a.features, '상품 결제': 'must' } } : {}) })} />
      <Multi label={Q.goal.more} opts={Q.goal.opts.filter((g) => g !== a.goalMain)} values={a.goalMore} onChange={(v) => set({ goalMore: v as Goal[] })} />
    </>);
    case 'audience': return <Multi opts={[...Q.audience.opts, UNKNOWN]} exclusive={UNKNOWN} values={a.audience} onChange={(v) => set({ audience: v })} />;
    case 'pages': return (<>
      <Multi opts={Q.pages.opts} values={a.pages} onChange={(v) => set({ pages: v })} />
      <TextIn label={Q.pages.extra} value={a.pagesExtra} onChange={(v) => set({ pagesExtra: v })} />
      {a.pages.length + a.pagesExtra.split(',').filter((x) => x.trim()).length > 10 ? <Impact why={Q.pages.manyWhy} /> : null}
    </>);
    case 'features': return (
      <div className={s.blocks}>
        {Q.features.opts.map((f: Feature) => (
          <div key={f} className={a.features[f] ? `${s.feat} ${s.featOn}` : s.feat} data-feature={f}>
            <div className={s.featTop}>
              <span className={s.featName}>{f}</span>
              <Seg value={a.features[f]} onChange={(v) => { const n = { ...a.features }; if (v) n[f] = v; else delete n[f]; set({ features: n, featuresUnknown: false }); }} />
            </div>
            {Q.features.why[f] ? <Impact why={Q.features.why[f]!} /> : null}
            {f === '외국어 페이지' && !a.features[f] && a.audience.includes('외국인') ? <p className={s.suggest} data-suggest>외국인 고객이 본다고 하셨어요. 필요하면 골라 주세요.</p> : null}
            {a.features[f] && f === '예약 받기' ? <Follow><Single compact label={Q.features.booking.label} opts={Q.features.booking.opts} value={a.booking} onChange={(v) => set({ booking: v })} /></Follow> : null}
            {a.features[f] && f === '상품 결제' ? <Follow>
              <Single compact label={Q.features.shopCount.label} opts={Q.features.shopCount.opts} value={a.shopCount} onChange={(v) => set({ shopCount: v })} />
              <Single compact label={Q.features.shopHow.label} opts={Q.features.shopHow.opts} value={a.shopHow} onChange={(v) => set({ shopHow: v })} /></Follow> : null}
            {a.features[f] && f === '회원' ? <Follow><Single compact label={Q.features.member.label} opts={Q.features.member.opts} value={a.member} onChange={(v) => set({ member: v })} /></Follow> : null}
            {a.features[f] && f === '외국어 페이지' ? <Follow>
              <Multi label={Q.features.langs.label} opts={Q.features.langs.opts} values={a.langs} onChange={(v) => set({ langs: v })} />
              <TextIn label={Q.features.langs.other} value={a.langOther} onChange={(v) => set({ langOther: v })} /></Follow> : null}
          </div>
        ))}
        <div className={s.extra}><TextIn label={Q.features.extra} help={Q.features.extraHelp} value={a.featuresExtra} onChange={(v) => set({ featuresExtra: v, featuresUnknown: false })} /></div>
      </div>
    );
    case 'links': return (<>
      <Multi opts={Q.links.opts} exclusive="없어요" values={a.links} onChange={(v) => set({ links: v })} />
      {a.links.filter((l) => l !== '없어요').length > 3 ? <Impact why={Q.links.manyWhy} /> : null}
    </>);
    case 'content': return (<>
      <Single label={Q.content.copy.label} opts={Q.content.copy.opts} value={a.copy} onChange={(v) => set({ copy: v })} />
      <Single label={Q.content.photo.label} opts={Q.content.photo.opts} value={a.photo} onChange={(v) => set({ photo: v })} />
      {a.copy === '써 주길 원함' || a.photo === '찍어 주길 원함' ? <Impact why={Q.content.why} /> : null}
      {a.copy === '직접 준비' || a.photo === '있어요' ? <TextIn label={Q.content.by} value={a.contentBy} onChange={(v) => set({ contentBy: v })} type="date" /> : null}
    </>);
    case 'brand': return (<>
      <Multi opts={Q.brand.opts} exclusive="없어요" values={a.brand} onChange={(v) => set({ brand: v })} />
      {a.brand.includes('없어요') ? <Impact why={Q.brand.noneWhy} /> : null}
    </>);
    case 'design': return (<>
      <Single opts={Q.design.opts} value={a.design} onChange={(v) => set({ design: v })} />
      {a.design === Q.design.custom ? <Impact why={Q.design.customWhy} /> : null}
      <p className={s.legend} style={{ marginTop: 8 }}>{Q.design.refsLabel}</p>
      <div className={s.blocks}>
        {[0, 1, 2].map((i) => {
          const r = a.refs[i] ?? { url: '', likes: [], memo: '' };
          const put = (p: Partial<typeof r>) => { const refs = [...a.refs]; while (refs.length <= i) refs.push({ url: '', likes: [], memo: '' }); refs[i] = { ...r, ...p }; set({ refs }); };
          if (i > 0 && !a.refs[i - 1]?.url.trim()) return null;
          return (
            <div key={i} className={s.block} data-ref={i}>
              <TextIn label={`참고 ${i + 1} 주소`} value={r.url} onChange={(v) => put({ url: v })} type="url" />
              {r.url.trim() ? <Follow>
                <Multi label="이 사이트의 좋은 점" opts={Q.design.likes} values={r.likes} onChange={(v) => put({ likes: v })} />
                <TextIn label={Q.design.memo} value={r.memo} onChange={(v) => put({ memo: v })} />
              </Follow> : null}
            </div>
          );
        })}
      </div>
      <TextIn label={Q.design.dislikes} value={a.dislikes} onChange={(v) => set({ dislikes: v })} multiline />
    </>);
    case 'ops': return <Multi opts={Q.ops.opts} exclusive="없어요(다 맡길게요)" values={a.ops} onChange={(v) => set({ ops: v })} />;
    case 'own': return (
      <div className={s.blocks}>
        {Q.own.rows.map((r) => (
          <div key={r.key} className={s.block} data-own={r.key}>
            <p className={s.blockT}>{r.label}</p>
            <p className={s.blockWhy}>{r.why}</p>
            <Single compact opts={r.opts} value={a.own[r.key]} onChange={(v) => set({ own: { ...a.own, [r.key]: v } })} />
          </div>
        ))}
      </div>
    );
    case 'scope': return (<>
      <Single label={Q.scope.revisions.label} opts={Q.scope.revisions.opts} value={a.revisions} onChange={(v) => set({ revisions: v })} />
      <Single label={Q.scope.care.label} opts={Q.scope.care.opts} value={a.care} onChange={(v) => set({ care: v })} />
      <Check label={Q.scope.monthly} checked={a.monthlyCost} onChange={(v) => set({ monthlyCost: v })} />
    </>);
    case 'when': return (<>
      <DateField label={Q.when.date} value={a.openDate} onChange={(v) => set({ openDate: v, openUnknown: false })} />
      <Check label={Q.when.dateUnknown} checked={a.openUnknown} onChange={(v) => set({ openUnknown: v, openDate: v ? '' : a.openDate })} />
      {a.openDate ? <Single label={Q.when.fixed.label} opts={Q.when.fixed.opts} value={a.openFixed} onChange={(v) => set({ openFixed: v })} /> : null}
      <Single label={Q.when.budget.label} opts={Q.when.budget.opts} value={a.budget} onChange={(v) => set({ budget: v })} />
      <Check label={Q.when.budgetIn} checked={a.budgetInBrief} onChange={(v) => set({ budgetInBrief: v })} data="data-brief-budget-in" />
      <p className={s.checkHelp}>{Q.when.budgetHelp}</p>
      <Single label={Q.when.decider.label} opts={Q.when.decider.opts} value={a.decider} onChange={(v) => set({ decider: v })} />
    </>);
  }
}
