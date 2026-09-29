'use client';
import { useLayoutEffect, useRef } from 'react';
import type { Scatter } from '@/content';
import s from './day-board.module.css';

/** 재현한 어느 하루 — 요청을 들어온 곳(칸) × 시각(세로)에 놓는다. 비교 시트 design/spec/13-before-scene.html A안.
 *  판은 1280×800 기준 좌표를 그림 폭에 비례(--u = 폭/1280)해 그대로 줄인다. 폰은 같은 요청을 시각 순 목록으로(글이 읽히게) */
const CH = ['메신저', '메일', '전화', '자리로 찾아옴'];
const NAME: Record<string, string> = { '자리로 찾아옴': '자리 방문' };
const T0 = 9 * 60, T1 = 16 * 60 + 30, Y0 = 136, Y1 = 768, COL_TOP = 84, GAP = 6;
const yOf = (m: number) => Y0 + (m - T0) / (T1 - T0) * (Y1 - Y0);
const minutes = (at: string) => {
  const m = at.match(/(오전|오후)\s*(\d{1,2}):(\d{2})/);
  return m ? (Number(m[2]) % 12 + (m[1] === '오후' ? 12 : 0)) * 60 + Number(m[3]) : T0;
};
const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;   // 축(9시~16시)과 같은 24시간제
const u = (n: number) => `calc(var(--u) * ${n})`;

function Text({ text, mark }: { text: string; mark?: string }) {
  if (!mark || !text.includes(mark)) return <>{text}</>;
  const [head, ...rest] = text.split(mark);
  return <>{head}{rest.map((r, i) => <span key={i}><mark className={s.mark}>{mark}</mark>{r}</span>)}</>;
}

export function DayBoard({ items, mark }: { items: Scatter[]; mark?: string }) {
  const board = useRef<HTMLDivElement>(null);
  const byTime = [...items].sort((a, b) => minutes(a.at) - minutes(b.at));
  const same = mark ? byTime.filter((d) => d.text.includes(mark)) : [];
  const chans = [...CH.filter((c) => items.some((d) => d.from === c)), ...new Set(items.map((d) => d.from).filter((c) => !CH.includes(c)))];
  const badge = (d: Scatter) => (same.includes(d) ? <span className={s.badge}>같은 요청 {same.indexOf(d) + 1}/{same.length}</span> : null);

  // 칸 안에서 시각 자리에 두되, 앞 카드와 겹치면 바로 아래로 민다(글 줄 수는 폭에 비례해 같으므로 폭이 바뀔 때만 다시)
  useLayoutEffect(() => {
    const el = board.current;
    if (!el) return;
    const place = () => {
      const k = el.clientWidth / 1280;
      if (!k) return;
      el.querySelectorAll<HTMLElement>('[data-day-col]').forEach((col) => {
        let bottom = 36 * k;
        col.querySelectorAll<HTMLElement>('[data-day-card]').forEach((cd) => {
          const y = Math.max(Number(cd.dataset.y) * k, bottom + GAP * k);
          cd.style.top = `${y}px`;
          bottom = y + cd.offsetHeight;
        });
      });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    document.fonts?.ready.then(place);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={s.box} data-day-board>
      <div ref={board} className={s.board}>
        <div className={s.head}>
          <b>어느 하루, 담당자에게 온 요청</b>
          <span>{items.length}건 · {chans.length === 4 ? '네' : chans.length} 갈래{same.length ? ` · 같은 요청 ${same.length}번` : ''}</span>
          <em>재현</em>
        </div>
        {Array.from({ length: 8 }, (_, i) => 9 + i).map((h) => (
          <div key={h} className={s.hour} style={{ top: u(yOf(h * 60)) }}><span>{h}시</span></div>
        ))}
        {chans.map((c, i) => {
          const list = byTime.filter((d) => d.from === c);
          return (
            <div key={c} className={s.col} style={{ left: u(100 + i * 291) }} data-day-col>
              <h3 className={s.ch}>{NAME[c] ?? c}<i>{list.length}건</i></h3>
              {list.map((d, j) => {
                const y = yOf(minutes(d.at)) - COL_TOP;
                return (
                  <div key={j} className={same.includes(d) ? `${s.card} ${s.same}` : s.card} data-day-card data-y={y} style={{ top: u(y) }}>
                    <time>{hm(minutes(d.at))}</time>
                    <p><Text text={d.text} mark={mark} />{badge(d)}</p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* 폰: 네 칸을 줄이면 글자가 읽히지 않는다 — 같은 하루를 시각 순서로 */}
      <div className={s.list}>
        <div className={s.listHead}><b>어느 하루, 담당자에게 온 요청</b><em>재현</em></div>
        <ol>
          {byTime.map((d, j) => (
            <li key={j} className={same.includes(d) ? s.same : undefined} data-day-row>
              <time>{hm(minutes(d.at))}</time><span className={s.from}>{NAME[d.from] ?? d.from}</span>
              <p><Text text={d.text} mark={mark} />{badge(d)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
