'use client';
import { useEffect, useState } from 'react';

type R = Record<'print' | 'copy' | 'storage', string>;

export function PrintTest() {
  const [r, setR] = useState<R>({ print: '', copy: '', storage: '' });
  const [ua, setUa] = useState('');
  useEffect(() => { setUa(navigator.userAgent); }, []);
  const set = (k: keyof R, v: string) => setR((p) => ({ ...p, [k]: v }));

  const doPrint = () => {
    try {
      const t0 = Date.now();
      window.print();
      // 인쇄 창이 실제로 뜨면 그동안 스크립트가 멈춰 시간이 흐른다. 바로 돌아오면 무시됐을 가능성이 크다
      set('print', `호출함(멈춘 시간 ${Date.now() - t0}ms) — 인쇄 창이 떴는지 눈으로 확인해 주세요`);
    } catch (e) { set('print', `실패: ${(e as Error).message}`); }
  };
  const doCopy = async () => {
    try { await navigator.clipboard.writeText('복사 시험 문장'); set('copy', '성공 — 메모장에 붙여 넣어 확인해 주세요'); }
    catch (e) { set('copy', `실패: ${(e as Error)?.message ?? '알 수 없음'}`); }
  };
  const doStore = () => {
    try { localStorage.setItem('prologue.print-test', String(Date.now())); localStorage.removeItem('prologue.print-test'); set('storage', '성공'); }
    catch (e) { set('storage', `실패: ${(e as Error).message}`); }
  };

  const row = { display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 24 };
  const btn = { height: 48, fontSize: 16, fontWeight: 600 } as const;
  return (
    <div>
      <h1 style={{ fontSize: 22 }}>기기 시험</h1>
      <div style={row}><button type="button" style={btn} onClick={doPrint}>인쇄 창 열기</button><output data-result="print">{r.print}</output></div>
      <div style={row}><button type="button" style={btn} onClick={doCopy}>글 복사</button><output data-result="copy">{r.copy}</output></div>
      <div style={row}><button type="button" style={btn} onClick={doStore}>저장소 쓰기</button><output data-result="storage">{r.storage}</output></div>
      <p style={{ fontSize: 12, color: 'var(--bone-500)', wordBreak: 'break-all' }} data-ua>{ua}</p>
    </div>
  );
}
