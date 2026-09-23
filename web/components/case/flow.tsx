'use client';
import { useMemo, useRef } from 'react';
import type { FlowBlock } from '@/content';
import { useReducedMotion, useScrollProgress } from './use-scroll-progress';
import g from './grid.module.css';
import s from './flow.module.css';

const CY = 160;                     // 가운데 줄
const Y0 = 64, Y1 = 256;            // 갈래가 서는 높이 범위
const X0 = 160, X1 = 566;           // 새 흐름 단계의 가로 범위(마지막은 화살표)
const SX = 40;                      // 갈래 선이 시작하는 x
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const spread = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => (n === 1 ? (a + b) / 2 : a + (b - a) * i / (n - 1)));

/** 윗변이 화면 85% 에 오면 0, 그림 가운데가 화면 40% 에 오면 1 (명세 §6) */
const morphT = (r: DOMRect, vh: number) => (vh * 0.85 - r.top) / (vh * 0.45 + r.height / 2);

export function Flow({ b }: { b: FlowBlock }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const t = useScrollProgress(ref, morphT, b.state === 'before' ? 0 : reduced ? 1 : undefined);

  const srcY = useMemo(() => spread(Y0, Y1, b.from.length).map(Math.round), [b.from.length]);
  // 뒤 절반(t 0.5→1)에 갈래 시작점이 가운데 줄로 모여 네 선이 한 선이 되고, 갈래 이름은 사라진다.
  // 그동안 첫 단계 점은 합쳐진 선의 시작(SX)으로 옮겨 가고, 나머지 점은 화살표까지 다시 고르게 선다
  const merge = clamp01((t - 0.5) * 2);
  const start = lerp(X0, SX, merge);
  const stepX = spread(start, X1, b.to.length);
  const paths = srcY.map((y0) => {
    const y = lerp(y0, CY, merge);
    const B = [150, y, 235, CY + (y - CY) * 0.12, 300, CY];
    const A = [110, y, 130, CY, 160, CY];
    const v = B.map((n, k) => lerp(n, A[k], t));
    return `M${SX} ${y} C ${v[0]} ${v[1]}, ${v[2]} ${v[3]}, ${v[4]} ${v[5]}`;
  });
  const after = t > 0.5;
  const shift = lerp(50, 22, t) - 22 * merge;   // 상태마다 그림을 상자 가운데에 둔다

  return (
    <div className={g.g}>
      <figure ref={ref} className={`${b.state === 'before' ? g.body : g.wide} ${s.fig}`} data-flow data-t={t.toFixed(3)}>
        <div className={s.box}>
          <svg viewBox="0 0 640 320" className={s.svg} role="img" aria-label={b.alt}>
            <g transform={`translate(${shift.toFixed(1)},0)`}>
              {srcY.map((y, i) => (
                <text key={`l${i}`} data-src-label x={34} y={y + 4} textAnchor="end" className={s.lbl} style={{ opacity: 1 - merge }}>{b.from[i]}</text>
              ))}
              {paths.map((d, i) => (
                <path key={`p${i}`} data-src-path d={d} fill="none" stroke={after ? 'var(--navy-800)' : 'var(--navy-400)'} strokeWidth={after ? 2 : 1.2} />
              ))}
              <g style={{ opacity: Math.max(0, 1 - t * 2) }}>
                <path d={`M300 ${CY} H520`} fill="none" stroke="var(--navy-400)" strokeWidth={1.2} />
                <circle cx={300} cy={CY} r={5} fill="var(--bone-50)" stroke="var(--navy-400)" />
                <text x={300} y={CY + 28} textAnchor="middle" className={s.lbl}>{b.hub}</text>
                <path d={`M514 ${CY - 6} l12 12 M526 ${CY - 6} l-12 12`} fill="none" stroke="var(--navy-400)" strokeWidth={1.2} />
                <text x={520} y={CY + 28} textAnchor="middle" className={s.lbl}>{b.stop}</text>
              </g>
              <g style={{ opacity: clamp01((t - 0.45) * 2) }}>
                <path data-chain d={`M${start} ${CY} H${X1}`} fill="none" stroke="var(--navy-800)" strokeWidth={2}
                      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01((t - 0.5) * 2)} />
                {stepX.map((x, i) => i < b.to.length - 1 ? (
                  <g key={i}>
                    <circle data-step cx={x} cy={CY} r={5} fill="var(--bone-50)" stroke="var(--navy-800)" />
                    <text x={x} y={i === 0 ? lerp(CY + 56, CY + 28, merge) : i % 2 ? CY - 20 : CY + 28} textAnchor="middle" className={s.lbl}>{b.to[i]}</text>
                  </g>
                ) : (
                  <g key={`t${i}`}>
                    <polygon points={`${X1},${CY - 9} ${X1 + 16},${CY} ${X1},${CY + 9}`} fill="var(--navy-800)" />
                    <text x={X1 + 16} y={CY + 28} textAnchor="middle" className={s.lbl}>{b.to[i]}</text>
                  </g>
                ))}
              </g>
            </g>
          </svg>
        </div>
        {b.caption ? <figcaption className={s.cap}>{b.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
