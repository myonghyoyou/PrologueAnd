'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { briefSummary, buildBrief, impactItems, toPlainText, vendorQuestions } from '@/lib/brief/derive';
import { COMPARE_ROWS, type CompareRow, browserStorage, loadCompare, saveCompare, type Vendor } from '@/lib/brief/storage';
import { isInAppBrowser } from '@/lib/brief/in-app';
import type { Answers, StepId } from '@/lib/brief/types';
import s from './result.module.css';
import { Num, ui } from '@/components/ui/controls';

/** 앱 안 브라우저에서 인쇄가 되는지 — Task 1 기기 시험 결과로 정한다. 확인 전에는 막혀 있다고 본다 */
export const PRINT_IN_APP: 'ok' | 'blocked' = 'blocked';

/** 예·아니오로 답하는 칸 — 폰에서 글자를 치지 않고 눌러서 바꾼다(빈칸 → 예 → 아니오 → 빈칸) */
const YN_ROWS: CompareRow[] = ['꼭 필요한 기능 포함', '도메인 내 이름', '소스·파일 받음'];
const YN_NEXT: Record<string, string> = { '': '예', '예': '아니오', '아니오': '' };

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
  const [canShare, setCanShare] = useState(false);
  const [printFailed, setPrintFailed] = useState(false);

  const boxRef = useRef<HTMLTextAreaElement>(null);
  // 글상자가 처음 뜰 때 한 번만 골라 둔다 — 렌더마다 하면 비교표에 치는 글이 글상자로 끌려간다
  useEffect(() => { if (box) { boxRef.current?.focus(); boxRef.current?.select(); } }, [box]);
  useEffect(() => { setCmp(loadCompare(browserStorage())); setInApp(isInAppBrowser(navigator.userAgent)); setCanShare(typeof navigator.share === 'function'); }, []);
  const putCmp = (v: Vendor[]) => { setCmp(v); saveCompare(browserStorage(), v); };
  const printBlocked = inApp && PRINT_IN_APP === 'blocked';

  const copy = async () => {
    const text = toPlainText(a, today);
    try { if (!navigator.clipboard) throw new Error('no clipboard'); await navigator.clipboard.writeText(text); setCopied('복사했어요'); setBox(''); }
    catch { setBox(text); setCopied(''); }
  };
  // 휴대폰 공유 창 — 사장님이 업체와 주로 쓰는 카톡·문자로 바로 보낸다. 취소하면 아무 일 없음
  const share = async () => { try { await navigator.share({ title: b.title, text: toPlainText(a, today) }); } catch { /* 취소 */ } };
  const setCell = (i: number, r: CompareRow, v: string) => putCmp(cmp.map((x, j) => (j === i ? { ...x, cells: { ...x.cells, [r]: v } } : x)));
  // 인쇄 창이 실제로 열리면 beforeprint 가 온다. 안 오면 막힌 앱(목록에 없는 앱 안 브라우저) — 안내하고 복사로 돌린다
  const printDoc = () => {
    let fired = false;
    const on = () => { fired = true; };
    window.addEventListener('beforeprint', on, { once: true });
    window.print();
    setTimeout(() => { window.removeEventListener('beforeprint', on); if (!fired) { setPrintFailed(true); void copy(); } }, 400);
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
        {b.sections.filter((x) => x.rows.length).map((x, n) => (
          <section key={x.id} className={s.sec}>
            <Num n={n + 1} className={s.secN} />
            <div className={s.secBody}>
              <h2 className={s.secT}><span>{x.title}</span>{EDIT_OF[x.id] ? <button type="button" className={s.edit} onClick={() => onEdit(EDIT_OF[x.id])} data-edit={EDIT_OF[x.id]}>고치기</button> : null}</h2>
              <dl className={s.dl}>{x.rows.map((r, i) => r.tag === 'ask'
                // 업체 제안 항목 — 단원 제목이 이미 말하므로 이름만, 그 질문으로 가는 고치기
                ? (<div key={i} className={`${s.row} ${s.askRow}`} data-ask-row><dt>{r.label}</dt>
                    <dd>{r.edit ? <button type="button" className={s.edit} onClick={() => onEdit(r.edit!)} aria-label={`${r.label} 고치기`}>고치기</button> : null}</dd></div>)
                : (<div key={i} className={s.row}><dt>{r.label}</dt><dd>
                {r.tag === 'must' ? <span className={s.tag}>오픈 때 꼭</span> : r.tag === 'later' ? <span className={`${s.tag} ${s.later}`}>나중에</span> : null}
                <span>{r.value}</span></dd></div>))}</dl>
            </div>
          </section>
        ))}
      </article>

      <section className={`${s.layer} ${s.noPrint}`} data-part="impact" data-brief-impact>
        <h2 className={s.layerT}>견적을 크게 움직이는 항목</h2>
        {impact.length ? <ul className={s.list}>{impact.map((i) => <li key={i.title}><span><b>{i.title}</b><small>{i.reason}</small></span></li>)}</ul>
          : <p className={s.layerNote}>크게 움직이는 항목이 없어요.</p>}
      </section>

      <section className={s.layer} data-part="vendor" data-brief-vendor>
        <h2 className={s.layerT}>업체에 꼭 물어볼 질문</h2>
        <p className={s.printOnly} data-print-only>이 요청서로 견적을 주실 때 아래 질문에도 답해 주세요.</p>
        <ol className={`${s.list} ${s.numbered}`}>{vq.map((q) => <li key={q}><span data-q>{q}<span className={s.answer} data-answer-line aria-hidden="true" /></span></li>)}</ol>
      </section>

      <section className={`${s.layer} ${s.noPrint}`} data-part="compare" data-brief-compare>
        <h2 className={s.layerT}>받은 견적 비교</h2>
        <div className={s.tbl}>
          <table className={s.table}>
            <thead><tr><th />{cmp.map((v, i) => <th key={i}><input aria-label={`업체 ${i + 1} 이름`} className={s.cell} value={v.name} onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">견적 금액</th>{cmp.map((v, i) => <td key={i}><input aria-label={`${v.name} 견적 금액`} className={s.cell} value={v.price} onChange={(e) => putCmp(cmp.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} /></td>)}</tr>
              {COMPARE_ROWS.map((r) => (
                <tr key={r}><th scope="row">{r}</th>{cmp.map((v, i) => <td key={i}>{YN_ROWS.includes(r)
                  ? <button type="button" className={`${s.yn} ${v.cells[r] === '예' ? s.yes : v.cells[r] === '아니오' ? s.no : ''}`} data-yn
                      aria-label={`${v.name} ${r}: ${v.cells[r] || '미정'}`} onClick={() => setCell(i, r, YN_NEXT[v.cells[r]] ?? '예')}>{v.cells[r] || '—'}</button>
                  : <input aria-label={`${v.name} ${r}`} className={s.cell} value={v.cells[r]} onChange={(e) => setCell(i, r, e.target.value)} />}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={s.layerNote}>이 표는 이 기기에만 저장돼요. 업체에 보내는 요청서에는 들어가지 않아요.</p>
      </section>

      <div className={`${s.exp} ${s.noPrint}`} data-part="export" data-brief-export>
        {printBlocked ? <>
          <button type="button" className={`${ui.btn} ${ui.pri}`} onClick={copy} data-brief-copy>글자로 복사</button>
          <p className={s.small} data-brief-inapp>Safari나 Chrome으로 열면 PDF로 저장할 수 있어요.</p>
        </> : <>
          <button type="button" className={`${ui.btn} ${ui.pri}`} onClick={printDoc} data-brief-print>PDF로 저장</button>
          <button type="button" className={`${ui.btn} ${ui.sec}`} onClick={copy} data-brief-copy>글자로 복사</button>
        </>}
        {canShare ? <button type="button" className={`${ui.btn} ${ui.sec}`} onClick={share} data-brief-share>카톡·문자로 보내기</button> : null}
        <button type="button" className={`${ui.txt} ${s.txtBtn}`} onClick={() => onEdit('mode')} data-brief-edit>답 고치기</button>
        <button type="button" className={`${ui.txt} ${s.txtBtn}`} onClick={reset} data-brief-reset>모두 지우기</button>
        {printFailed ? <p className={s.small} role="status" data-brief-print-failed>인쇄 창이 열리지 않았어요. Safari나 Chrome으로 열면 PDF로 저장할 수 있어요. 아래 글을 복사해서 보내셔도 돼요.</p> : null}
        <p className={s.small} aria-live="polite" data-brief-copied>{copied}</p>
        {box ? <div className={s.copybox}>
          <textarea readOnly value={box} rows={10} className={s.copyArea} data-brief-copybox ref={boxRef} />
          <p className={s.small} data-brief-copybox-help>길게 눌러 복사해 주세요</p>
        </div> : null}
      </div>

      <p className={`${s.small} ${s.noPrint}`} data-part="privacy" data-brief-privacy>입력한 내용은 이 기기에만 저장돼요. 연락처는 묻지 않아요. 특정 업체를 추천하거나 연결하지 않아요.</p>
      <p className={`${s.foot} ${s.noPrint}`} data-part="prologue" data-brief-prologue>이 요청서를 Prologue&amp;에도 보내 볼 수 있어요 · <button type="button" className={s.link} onClick={send} data-brief-send>보내기</button></p>
    </div>
  );
}
