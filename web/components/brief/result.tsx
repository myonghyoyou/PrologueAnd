'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { briefSummary, buildBrief, impactKeys, printZoom, impactItems, toPlainText, vendorQuestions } from '@/lib/brief/derive';
import { COMPARE_ROWS, YN_ROWS, YN, type CompareRowId } from '@/content/brief/rules';
import { browserStorage, loadCompare, saveCompare, type Vendor } from '@/lib/brief/storage';
import { PREFILL_NEED_NEW } from '@/lib/brief/prefill';
import { isInAppBrowser } from '@/lib/brief/in-app';
import type { Answers, StepId } from '@/lib/brief/types';
import s from './result.module.css';
import { Num, ui } from '@/components/ui/controls';
import { useCopy } from './copy-context';

/** 앱 안 브라우저에서 인쇄가 되는지 — Task 1 기기 시험 결과로 정한다. 확인 전에는 막혀 있다고 본다 */
export const PRINT_IN_APP: 'ok' | 'blocked' = 'blocked';

/** 예·아니오로 답하는 칸(YN_ROWS) — 폰에서 글자를 치지 않고 눌러서 바꾼다(빈칸 → 예 → 아니오 → 빈칸, YN 순서). 저장은 id, 화면은 c.result.yn */
const ynNext = (v: string) => YN[(Math.max(0, (YN as readonly string[]).indexOf(v)) + 1) % YN.length];

const EDIT_OF: Record<string, StepId> = { purpose: 'kind', renew: 'renew', pages: 'pages', features: 'features', links: 'links', content: 'content', brand: 'brand',
  design: 'design', ops: 'ops', own: 'own', scope: 'scope', when: 'when', budget: 'when' };

export function Result({ a, onEdit, onReset }: { a: Answers; onEdit: (s: StepId) => void; onReset: () => void }) {
  const c = useCopy();
  const R = c.result;
  const today = useMemo(() => new Date(), []);
  const b = useMemo(() => buildBrief(a, today, c), [a, today, c]);
  const impact = useMemo(() => impactItems(a, today, c), [a, today, c]);
  const vq = useMemo(() => vendorQuestions(a, c), [a, c]);
  const marks = useMemo(() => impactKeys(a, today, c), [a, today, c]);
  const [cmp, setCmp] = useState<Vendor[]>([]);
  const [copied, setCopied] = useState('');
  const [box, setBox] = useState('');
  const [inApp, setInApp] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [printFailed, setPrintFailed] = useState(false);

  const boxRef = useRef<HTMLTextAreaElement>(null);
  // 글상자가 처음 뜰 때 한 번만 골라 둔다 — 렌더마다 하면 비교표에 치는 글이 글상자로 끌려간다
  useEffect(() => { if (box) { boxRef.current?.focus(); boxRef.current?.select(); } }, [box]);
  useEffect(() => { setCmp(loadCompare(browserStorage())); setInApp(isInAppBrowser(navigator.userAgent)); setCanShare(typeof navigator.share === 'function'); }, []);
  const putCmp = (v: Vendor[]) => { setCmp(v); saveCompare(browserStorage(), v); };
  const printBlocked = inApp && PRINT_IN_APP === 'blocked';

  const copy = async () => {
    const text = toPlainText(a, today, c);
    try { if (!navigator.clipboard) throw new Error('no clipboard'); await navigator.clipboard.writeText(text); setCopied(R.copied); setBox(''); }
    catch { setBox(text); setCopied(''); }
  };
  // 휴대폰 공유 창 — 사장님이 업체와 주로 쓰는 카톡·문자로 바로 보낸다. 취소하면 아무 일 없음
  const share = async () => { try { await navigator.share({ title: b.title, text: toPlainText(a, today, c) }); } catch { /* 취소 */ } };
  const setCell = (i: number, r: CompareRowId, v: string) => putCmp(cmp.map((x, j) => (j === i ? { ...x, cells: { ...x.cells, [r]: v } } : x)));
  // 인쇄 창이 실제로 열리면 beforeprint 가 온다. 안 오면 막힌 앱(목록에 없는 앱 안 브라우저) — 안내하고 복사로 돌린다
  const printDoc = () => {
    let fired = false;
    const on = () => { fired = true; };
    window.addEventListener('beforeprint', on, { once: true });
    window.print();
    setTimeout(() => { window.removeEventListener('beforeprint', on); if (!fired) { setPrintFailed(true); void copy(); } }, 400);
  };
  const send = () => {
    document.dispatchEvent(new CustomEvent('inquiry:open', { detail: { project: '', prefill: { need: a.mode === 'new' ? PREFILL_NEED_NEW : undefined, pain: briefSummary(a, today, c) } } }));
  };
  const reset = () => { if (window.confirm(R.resetConfirm)) onReset(); };

  return (
    <div className={s.result} data-brief-result style={{ '--print-zoom': printZoom(a, c) } as React.CSSProperties}>
      <section className={`${s.layer} ${s.impactLayer} ${s.noPrint}`} data-part="impact" data-brief-impact>
        <h2 className={s.layerT}>{R.impactTitle}</h2>
        {impact.length ? <p className={s.legend} data-impact-legend><i className={s.swatch} aria-hidden="true" />{R.impactLegend}</p> : null}
        {impact.length ? <ul className={s.list}>{impact.map((i) => <li key={i.title}><span><b>{i.title}</b><small>{i.reason}</small></span></li>)}</ul>
          : <p className={s.layerNote}>{R.impactNone}</p>}
      </section>

      <article className={s.doc} data-part="doc" data-brief-doc>
        <h1 className={s.title}>{b.title}</h1>
        <p className={s.meta}>{b.subtitle}</p>
        {b.sections.filter((x) => x.rows.length).map((x, n) => (
          <section key={x.id} className={s.sec}>
            <Num n={n + 1} className={s.secN} />
            <div className={s.secBody}>
              <h2 className={s.secT}><span>{x.title}</span>{EDIT_OF[x.id] ? <button type="button" className={s.edit} onClick={() => onEdit(EDIT_OF[x.id])} data-edit={EDIT_OF[x.id]}>{R.edit}</button> : null}</h2>
              <dl className={s.dl}>{x.rows.map((r, i) => r.tag === 'ask'
                // 업체 제안 항목 — 단원 제목이 이미 말하므로 이름만, 그 질문으로 가는 고치기
                ? (<div key={i} className={`${s.row} ${s.askRow}`} data-ask-row><dt>{r.label}</dt>
                    <dd>{r.edit ? <button type="button" className={s.edit} onClick={() => onEdit(r.edit!)} aria-label={R.editAria(r.label)}>{R.edit}</button> : null}</dd></div>)
                : (<div key={i} className={marks.has(`${x.id}|${r.label}`) ? `${s.row} ${s.impactRow}` : s.row} {...(marks.has(`${x.id}|${r.label}`) ? { 'data-impact-row': '' } : {})}><dt>{r.label}</dt><dd>
                {r.tag === 'must' ? <span className={s.tag}>{c.doc.tags.must}</span> : r.tag === 'later' ? <span className={`${s.tag} ${s.later}`}>{c.doc.tags.later}</span> : null}
                <span>{r.value}</span></dd></div>))}</dl>
            </div>
          </section>
        ))}
      </article>

      <section className={s.layer} data-part="vendor" data-brief-vendor>
        <h2 className={s.layerT}>{R.vendorTitle}</h2>
        <p className={s.printOnly} data-print-only>{R.vendorPrintLead}</p>
        <ol className={`${s.list} ${s.numbered}`}>{vq.map((q) => <li key={q}><span data-q>{q}<span className={s.answer} data-answer-line aria-hidden="true" /></span></li>)}</ol>
      </section>

      <section className={`${s.layer} ${s.noPrint}`} data-part="compare" data-brief-compare>
        <h2 className={s.layerT}>{R.compareTitle}</h2>
        <div className={s.tbl}>
          <table className={s.table}>
            <thead><tr><th />{cmp.map((v, i) => <th key={i}><input aria-label={R.nameAria(i)} className={`${s.cell} ${s.vendorName}`} value={v.name} placeholder={R.vendorName(i)} onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">{R.comparePrice}</th>{cmp.map((v, i) => <td key={i}><input aria-label={`${v.name || R.vendorName(i)} ${R.comparePrice}`} className={s.cell} value={v.price} onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} /></td>)}</tr>
              {COMPARE_ROWS.map((r) => (
                <tr key={r}><th scope="row">{R.compareRows[r]}</th>{cmp.map((v, i) => {
                  const name = v.name || R.vendorName(i), yn = v.cells[r] === 'yes' || v.cells[r] === 'no' ? R.yn[v.cells[r] as 'yes' | 'no'] : '';
                  return <td key={i}>{YN_ROWS.includes(r)
                  ? <button type="button" className={`${s.yn} ${v.cells[r] === 'yes' ? s.yes : v.cells[r] === 'no' ? s.no : ''}`} data-yn
                      aria-label={R.cellAria(name, R.compareRows[r], yn || R.yn.unsetAria)} onClick={() => setCell(i, r, ynNext(v.cells[r]))}>{yn || R.yn.unset}</button>
                  : <input aria-label={R.cellAria(name, R.compareRows[r], '')} className={s.cell} value={v.cells[r]} onChange={(e) => setCell(i, r, e.target.value)} />}</td>;
                })}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={s.layerNote}>{R.compareNote}</p>
      </section>

      <div className={`${s.exp} ${s.noPrint}`} data-part="export" data-brief-export>
        {printBlocked ? <>
          <button type="button" className={`${ui.btn} ${ui.pri}`} onClick={copy} data-brief-copy>{R.copy}</button>
          <p className={s.small} data-brief-inapp>{R.inAppHint}</p>
        </> : <>
          <button type="button" className={`${ui.btn} ${ui.pri}`} onClick={printDoc} data-brief-print>{R.pdf}</button>
          <button type="button" className={`${ui.btn} ${ui.sec}`} onClick={copy} data-brief-copy>{R.copy}</button>
        </>}
        {canShare ? <button type="button" className={`${ui.btn} ${ui.sec}`} onClick={share} data-brief-share>{R.share}</button> : null}
        <button type="button" className={`${ui.txt} ${s.txtBtn}`} onClick={() => onEdit('mode')} data-brief-edit>{R.editAll}</button>
        <button type="button" className={`${ui.txt} ${s.txtBtn}`} onClick={reset} data-brief-reset>{R.reset}</button>
        {printFailed ? <p className={s.small} role="status" data-brief-print-failed>{R.printFailed}</p> : null}
        <p className={s.small} aria-live="polite" data-brief-copied>{copied}</p>
        {box ? <div className={s.copybox}>
          <textarea readOnly value={box} rows={10} className={s.copyArea} data-brief-copybox ref={boxRef} />
          <p className={s.small} data-brief-copybox-help>{R.copyBoxHelp}</p>
        </div> : null}
      </div>

      <p className={`${s.small} ${s.noPrint}`} data-part="privacy" data-brief-privacy>{R.privacy}</p>
      {/* 맨 아래 줄 — 한국어판은 문의 서랍으로 보낸다(영어판 메일 보내기는 따로) */}
      {c.end.kind === 'drawer' ? <p className={`${s.foot} ${s.noPrint}`} data-part="prologue" data-brief-prologue>{c.end.text} · <button type="button" className={s.link} onClick={send} data-brief-send>{c.end.send}</button></p> : null}
    </div>
  );
}
