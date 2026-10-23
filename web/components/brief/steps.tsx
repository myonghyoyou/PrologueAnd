'use client';
import { OPTS, NONE, LANG_OPTS, PAGES_MANY, LINKS_MANY } from '@/content/brief/rules';
import type { BriefCopy } from '@/content/brief/copy';
import { UNKNOWN, type Answers, type StepId } from '@/lib/brief/types';
import { useCopy } from './copy-context';
import { Check, Follow, Impact, Multi, Seg, Single, TextIn } from './fields';
import s from './fields.module.css';
import { DateField } from '@/components/ui/date-field';

type P = { a: Answers; set: (p: Partial<Answers>) => void };

export function stepTitle(id: StepId, c: BriefCopy): string {
  return c.q[id].title;
}
const HELP_STEPS: StepId[] = ['kind', 'goal', 'audience', 'pages', 'features', 'ops', 'own'];
export function stepHelp(id: StepId, c: BriefCopy): string | undefined {
  return HELP_STEPS.includes(id) ? (c.q[id] as { help?: string }).help : undefined;
}

const OWN_ROWS = [['domain', 'ownDomain'], ['hosting', 'ownHosting'], ['admin', 'ownAdmin'], ['source', 'ownSource']] as const;

export function StepView({ id, a, set }: P & { id: StepId }) {
  const c = useCopy();
  const q = c.q;
  switch (id) {
    case 'mode': return <Single opts={OPTS.mode} labels={q.mode.opts} value={a.mode} onChange={(v) => set({ mode: v })} />;
    case 'renew': return (<>
      <TextIn label={q.renew.url} value={a.renewUrl} onChange={(v) => set({ renewUrl: v })} type="url" />
      <TextIn label={q.renew.pain} value={a.renewPain} onChange={(v) => set({ renewPain: v })} multiline />
      <Single label={q.renew.amountLabel} opts={OPTS.renewAmount} labels={q.renew.amount} value={a.renewAmount} onChange={(v) => set({ renewAmount: v })} />
      {a.renewAmount === 'many' ? <Impact why={q.renew.amountWhy} /> : null}
    </>);
    case 'kind': return (<>
      <Single opts={OPTS.kind} labels={q.kind.opts} value={a.kind} onChange={(v) => set({ kind: v })} />
      {a.kind === 'other' ? <TextIn label={q.kind.otherLabel} value={a.kindOther} onChange={(v) => set({ kindOther: v })} /> : null}
      <TextIn label={q.kind.name} help={q.kind.nameHelp} value={a.name} onChange={(v) => set({ name: v })} data="data-brief-name" />
    </>);
    case 'goal': return (<>
      <Single opts={OPTS.goal} labels={q.goal.opts} value={a.goalMain} onChange={(v) => set({ goalMain: v, goalMore: a.goalMore.filter((g) => g !== v),
        ...(v === 'buy' && !a.features.payment ? { features: { ...a.features, payment: 'must' } } : {}) })} />
      <Multi label={q.goal.more} opts={OPTS.goal.filter((g) => g !== a.goalMain)} labels={q.goal.opts} values={a.goalMore} onChange={(v) => set({ goalMore: v })} />
    </>);
    case 'audience': return <Multi opts={OPTS.audience} labels={q.audience.opts} exclusive={UNKNOWN} values={a.audience} onChange={(v) => set({ audience: v })} />;
    case 'pages': return (<>
      <Multi opts={OPTS.pages} labels={q.pages.opts} values={a.pages} onChange={(v) => set({ pages: v })} />
      <TextIn label={q.pages.extra} value={a.pagesExtra} onChange={(v) => set({ pagesExtra: v })} />
      {a.pages.length + a.pagesExtra.split(',').filter((x) => x.trim()).length > PAGES_MANY ? <Impact why={q.pages.manyWhy} /> : null}
    </>);
    case 'features': {
      const F = q.features;
      // 외국어 단추는 화면 언어의 목록. 목록 밖 코드(다른 언어판에서 고른 것)는 단추 없이 답에 그대로 남는다
      const langOpts = LANG_OPTS[c.locale] as readonly string[];
      const langLabels = Object.fromEntries(langOpts.map((l) => [l, c.ui.langName(l)]));
      return (
        <div className={s.blocks}>
          {OPTS.features.map((f) => (
            <div key={f} className={a.features[f] ? `${s.feat} ${s.featOn}` : s.feat} data-feature={f}>
              <div className={s.featTop}>
                <span className={s.featName}>{F.opts[f]}</span>
                <Seg value={a.features[f]} onChange={(v) => { const n = { ...a.features }; if (v) n[f] = v; else delete n[f]; set({ features: n, featuresUnknown: false }); }} />
              </div>
              {F.why[f] ? <Impact why={F.why[f]!} /> : null}
              {f === 'multilang' && !a.features[f] && a.audience.includes('foreign') ? <p className={s.suggest} data-suggest>{F.foreignSuggest}</p> : null}
              {a.features[f] && f === 'booking' ? <Follow><Single compact label={F.booking.label} opts={OPTS.booking} labels={F.booking.opts} value={a.booking} onChange={(v) => set({ booking: v })} /></Follow> : null}
              {a.features[f] && f === 'payment' ? <Follow>
                <Single compact label={F.shopCount.label} opts={OPTS.shopCount} labels={F.shopCount.opts} value={a.shopCount} onChange={(v) => set({ shopCount: v })} />
                <Single compact label={F.shopHow.label} opts={OPTS.shopHow} labels={F.shopHow.opts} value={a.shopHow} onChange={(v) => set({ shopHow: v })} /></Follow> : null}
              {a.features[f] && f === 'members' ? <Follow><Single compact label={F.member.label} opts={OPTS.member} labels={F.member.opts} value={a.member} onChange={(v) => set({ member: v })} /></Follow> : null}
              {a.features[f] && f === 'multilang' ? <Follow>
                <Multi label={F.langs.label} opts={langOpts} labels={langLabels} values={a.langs} onChange={(v) => set({ langs: v })} />
                <TextIn label={F.langs.other} value={a.langOther} onChange={(v) => set({ langOther: v })} /></Follow> : null}
            </div>
          ))}
          <div className={s.extra}><TextIn label={F.extra} help={F.extraHelp} value={a.featuresExtra} onChange={(v) => set({ featuresExtra: v, featuresUnknown: false })} /></div>
        </div>
      );
    }
    case 'links': return (<>
      <Multi opts={OPTS.links} labels={q.links.opts} exclusive={NONE} values={a.links} onChange={(v) => set({ links: v })} />
      {a.links.filter((l) => l !== NONE).length > LINKS_MANY ? <Impact why={q.links.manyWhy} /> : null}
    </>);
    case 'content': return (<>
      <Single label={q.content.copyLabel} opts={OPTS.copy} labels={q.content.copy} value={a.copy} onChange={(v) => set({ copy: v })} />
      <Single label={q.content.photoLabel} opts={OPTS.photo} labels={q.content.photo} value={a.photo} onChange={(v) => set({ photo: v })} />
      {a.copy === 'write' ? <Impact why={q.content.why} /> : null}
      {a.copy === 'self' || a.photo === 'have' ? <TextIn label={q.content.by} value={a.contentBy} onChange={(v) => set({ contentBy: v })} type="date" /> : null}
    </>);
    case 'brand': return (<>
      <Multi opts={OPTS.brand} labels={q.brand.opts} exclusive={NONE} values={a.brand} onChange={(v) => set({ brand: v })} />
      {a.brand.includes(NONE) ? <Impact why={q.brand.noneWhy} /> : null}
    </>);
    case 'design': return (<>
      <Single opts={OPTS.design} labels={q.design.opts} value={a.design} onChange={(v) => set({ design: v })} />
      {a.design === 'custom' ? <Impact why={q.design.customWhy} /> : null}
      <p className={s.legend} style={{ marginTop: 8 }}>{q.design.refsLabel}</p>
      <div className={s.blocks}>
        {[0, 1, 2].map((i) => {
          const r = a.refs[i] ?? { url: '', likes: [], memo: '' };
          const put = (p: Partial<typeof r>) => { const refs = [...a.refs]; while (refs.length <= i) refs.push({ url: '', likes: [], memo: '' }); refs[i] = { ...r, ...p }; set({ refs }); };
          if (i > 0 && !a.refs[i - 1]?.url.trim()) return null;
          return (
            <div key={i} className={s.block} data-ref={i}>
              <TextIn label={q.design.refUrl(i + 1)} value={r.url} onChange={(v) => put({ url: v })} type="url" />
              {r.url.trim() ? <Follow>
                <Multi label={q.design.likesLabel} opts={OPTS.likes} labels={q.design.likes} values={r.likes} onChange={(v) => put({ likes: v })} />
                <TextIn label={q.design.memo} value={r.memo} onChange={(v) => put({ memo: v })} />
              </Follow> : null}
            </div>
          );
        })}
      </div>
      <TextIn label={q.design.dislikes} value={a.dislikes} onChange={(v) => set({ dislikes: v })} multiline />
    </>);
    case 'ops': return <Multi opts={OPTS.ops} labels={q.ops.opts} exclusive={NONE} values={a.ops} onChange={(v) => set({ ops: v })} />;
    case 'own': return (
      <div className={s.blocks}>
        {OWN_ROWS.map(([k, o]) => {
          const row = q.own[k] as { label: string; why: string; opts: Record<string, string> };
          return (
            <div key={k} className={s.block} data-own={k}>
              <p className={s.blockT}>{row.label}</p>
              <p className={s.blockWhy}>{row.why}</p>
              <Single compact opts={OPTS[o] as readonly string[]} labels={row.opts} value={a.own[k]} onChange={(v) => set({ own: { ...a.own, [k]: v } })} />
            </div>
          );
        })}
      </div>
    );
    case 'scope': return (<>
      <Single label={q.scope.revisionsLabel} opts={OPTS.revisions} labels={q.scope.revisions} value={a.revisions} onChange={(v) => set({ revisions: v })} />
      <Single label={q.scope.careLabel} opts={OPTS.care} labels={q.scope.care} value={a.care} onChange={(v) => set({ care: v })} />
      <Check label={q.scope.monthly} checked={a.monthlyCost} onChange={(v) => set({ monthlyCost: v })} />
    </>);
    case 'when': {
      const W = q.when, B = W.budget;
      return (<>
        <DateField text={c.ui.date} label={W.date} value={a.openDate} onChange={(v) => set({ openDate: v, openUnknown: false })} />
        <Check label={W.dateUnknown} checked={a.openUnknown} onChange={(v) => set({ openUnknown: v, openDate: v ? '' : a.openDate })} />
        {a.openDate ? <Single label={W.fixedLabel} opts={OPTS.openFixed} labels={W.fixed} value={a.openFixed} onChange={(v) => set({ openFixed: v })} /> : null}
        {/* 예산 — 한국어판은 구간, 영어판은 금액·통화를 적는 글칸(명세 3-3) */}
        {B.kind === 'range'
          ? <Single label={B.label} opts={OPTS.budget} labels={B.opts} value={a.budget} onChange={(v) => set({ budget: v })} />
          : <TextIn label={B.label} help={B.hint} value={a.budgetText} onChange={(v) => set({ budgetText: v })} />}
        <Check label={W.budgetIn} checked={a.budgetInBrief} onChange={(v) => set({ budgetInBrief: v })} data="data-brief-budget-in" />
        <p className={s.checkHelp}>{W.budgetHelp}</p>
        <Single label={W.deciderLabel} opts={OPTS.decider} labels={W.decider} value={a.decider} onChange={(v) => set({ decider: v })} />
      </>);
    }
  }
}
