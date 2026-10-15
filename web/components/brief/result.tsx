'use client';
import { useEffect, useMemo, useState } from 'react';
import { briefSummary, buildBrief, impactItems, toPlainText, vendorQuestions } from '@/lib/brief/derive';
import { COMPARE_ROWS, browserStorage, loadCompare, saveCompare, type Vendor } from '@/lib/brief/storage';
import { isInAppBrowser } from '@/lib/brief/in-app';
import type { Answers, StepId } from '@/lib/brief/types';
import s from './result.module.css';

/** 앱 안 브라우저에서 인쇄가 되는지 — Task 1 기기 시험 결과로 정한다. 확인 전에는 막혀 있다고 본다 */
export const PRINT_IN_APP: 'ok' | 'blocked' = 'blocked';

const EDIT_OF: Record<string, StepId> = { purpose: 'kind', renew: 'renew', pages: 'pages', features: 'features', links: 'links', content: 'content', brand: 'brand',
  design: 'design', ops: 'ops', own: 'own', scope: 'scope', when: 'when', budget: 'when' };

export function Result({ a, onEdit, onReset }: { a: Answers; onEdit: (s: StepId) => void; onReset: () => void }) {
  const today = useMemo(() => new Date(), []);
  const b = useMemo(() => buildBrief(a, today), [a, today]);
  const impact = useMemo(() => impactItems(a, today), [a, today]);
  const vq = useMemo(() => vendorQuestions(a), [a]);
  const [cmp, setCmp] = useState<Vendor[]>([]);
  const [copied, setCopied] = useState('');
  const [box, setBox] = useState('');
  const [inApp, setInApp] = useState(false);

  useEffect(() => { setCmp(loadCompare(browserStorage())); setInApp(isInAppBrowser(navigator.userAgent)); }, []);
  const putCmp = (v: Vendor[]) => { setCmp(v); saveCompare(browserStorage(), v); };
  const printBlocked = inApp && PRINT_IN_APP === 'blocked';

  const copy = async () => {
    const text = toPlainText(a, today);
    try { if (!navigator.clipboard) throw new Error('no clipboard'); await navigator.clipboard.writeText(text); setCopied('복사했어요'); setBox(''); }
    catch { setBox(text); setCopied(''); }
  };
  const send = () => {
    document.dispatchEvent(new CustomEvent('inquiry:open', { detail: { project: '', prefill: { need: a.mode === 'new' ? '새로 만들고 싶어요' : undefined, pain: briefSummary(a, today) } } }));
  };
  const reset = () => { if (window.confirm('입력한 답과 비교표를 모두 지울까요?')) onReset(); };

  return (
    <div className={s.result} data-brief-result>
      <article className={s.doc} data-part="doc" data-brief-doc>
        <h1 className={s.title}>{b.title}</h1>
        <p className={s.meta}>{b.subtitle}</p>
        {b.sections.filter((x) => x.rows.length).map((x) => (
          <section key={x.id} className={s.sec}>
            <h2 className={s.secT}>{x.title}{EDIT_OF[x.id] ? <button type="button" className={s.edit} onClick={() => onEdit(EDIT_OF[x.id])} data-edit={EDIT_OF[x.id]}>고치기</button> : null}</h2>
            <dl className={s.dl}>{x.rows.map((r, i) => (<div key={i} className={s.row}><dt>{r.label}</dt><dd>
              {r.tag === 'must' ? <span className={s.tag}>오픈 때 꼭</span> : r.tag === 'later' ? <span className={`${s.tag} ${s.later}`}>나중에</span> : null}
              <span className={r.tag === 'ask' ? s.ask : ''}>{r.value}</span></dd></div>))}</dl>
          </section>
        ))}
      </article>

      <section className={`${s.box} ${s.noPrint}`} data-part="impact" data-brief-impact>
        <h2 className={s.boxT}>견적을 크게 움직이는 항목</h2>
        {impact.length ? <ul className={s.ul}>{impact.map((i) => <li key={i.title}><b>{i.title}</b><small>{i.reason}</small></li>)}</ul>
          : <p className={s.small}>크게 움직이는 항목이 없어요.</p>}
      </section>

      <section className={s.box} data-part="vendor" data-brief-vendor>
        <h2 className={s.boxT}>업체에 꼭 물어볼 질문</h2>
        <p className={s.printOnly} data-print-only>이 요청서로 견적을 주실 때 아래 질문에도 답해 주세요.</p>
        <ul className={s.ul}>{vq.map((q) => <li key={q}>{q}</li>)}</ul>
      </section>

      <section className={`${s.box} ${s.noPrint}`} data-part="compare" data-brief-compare>
        <h2 className={s.boxT}>받은 견적 비교</h2>
        <div className={s.tbl}>
          <table className={s.table}>
            <thead><tr><th />{cmp.map((v, i) => <th key={i}><input aria-label={`업체 ${i + 1} 이름`} className={s.cell} value={v.name} onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">견적 금액</th>{cmp.map((v, i) => <td key={i}><input aria-label={`${v.name} 견적 금액`} className={s.cell} value={v.price} onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} /></td>)}</tr>
              {COMPARE_ROWS.map((r) => (
                <tr key={r}><th scope="row">{r}</th>{cmp.map((v, i) => <td key={i}><input aria-label={`${v.name} ${r}`} className={s.cell} value={v.cells[r]}
                  onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, cells: { ...x.cells, [r]: e.target.value } } : x)))} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={s.small}>이 표는 이 기기에만 저장돼요. 업체에 보내는 요청서에는 들어가지 않아요.</p>
      </section>

      <div className={`${s.exp} ${s.noPrint}`} data-part="export" data-brief-export>
        {printBlocked ? <>
          <button type="button" className={`${s.btn} ${s.pri}`} onClick={copy} data-brief-copy>글자로 복사</button>
          <p className={s.small} data-brief-inapp>Safari나 Chrome으로 열면 PDF로 저장할 수 있어요.</p>
        </> : <>
          <button type="button" className={`${s.btn} ${s.pri}`} onClick={() => window.print()} data-brief-print>PDF로 저장</button>
          <button type="button" className={s.btn} onClick={copy} data-brief-copy>글자로 복사</button>
        </>}
        <button type="button" className={s.btn} onClick={() => onEdit('mode')} data-brief-edit>답 고치기</button>
        <button type="button" className={s.btn} onClick={reset} data-brief-reset>모두 지우기</button>
        <p className={s.small} aria-live="polite" data-brief-copied>{copied}</p>
        {box ? <div className={s.copybox}>
          <textarea readOnly value={box} rows={10} className={s.copyArea} data-brief-copybox ref={(t) => { t?.focus(); t?.select(); }} />
          <p className={s.small} data-brief-copybox-help>길게 눌러 복사해 주세요</p>
        </div> : null}
      </div>

      <p className={`${s.small} ${s.noPrint}`} data-part="privacy" data-brief-privacy>입력한 내용은 이 기기에만 저장돼요. 연락처는 묻지 않아요.</p>
      <p className={`${s.foot} ${s.noPrint}`} data-part="prologue" data-brief-prologue>이 요청서를 Prologue&amp;에도 보내 볼 수 있어요 · <button type="button" className={s.link} onClick={send} data-brief-send>보내기</button></p>
    </div>
  );
}
