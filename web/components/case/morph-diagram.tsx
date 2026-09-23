'use client';
import { useMemo } from 'react';

const Y = 1.6;
const SRC = [40, 80, 120, 160].map((y) => Math.round(y * Y));
const CY = Math.round(100 * Y);
const NAMES = ['전화', '메신저', '이메일', '직접 방문'];
const CHAIN: [number, string][] = [[160, '개인 링크'], [270, '요청폼'], [380, '심사 Queue'], [480, '약속일'], [580, '상태 공유']];
const B = SRC.map((y) => [150, y, 235, CY + (y - CY) * 0.12, 300, CY]);
const A = SRC.map((y) => [110, y, 130, CY, 160, CY]);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function MorphDiagram({ t }: { t: number }) {
  const paths = useMemo(() => SRC.map((y, i) => {
    const v = B[i].map((n, k) => lerp(n, A[i][k], t));
    return { d: `M40 ${y} C ${v[0]} ${v[1]}, ${v[2]} ${v[3]}, ${v[4]} ${v[5]}`, after: t > 0.5 };
  }), [t]);
  const shift = lerp(50, 22, t);     // 상태별로 그림을 상자 가운데에 둔다

  return (
    <div data-fit="dia"
         style={{ width: 'var(--dw, 100%)', maxWidth: '100%', background: 'var(--bone-0)', border: '1px solid var(--bone-200)', padding: 24, boxSizing: 'border-box' }}>
      <svg viewBox="0 0 640 360" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <g transform={`translate(${shift.toFixed(1)},0)`}>
          {SRC.map((y, i) => (
            <text key={`l${i}`} x={34} y={y + 5} textAnchor="end"
                  style={{ fontSize: 11, fontWeight: 500, fill: 'var(--bone-500)' }}>{NAMES[i]}</text>
          ))}
          {paths.map((p, i) => (
            <path key={`p${i}`} d={p.d} fill="none"
                  stroke={p.after ? 'var(--navy-800)' : 'var(--navy-400)'} strokeWidth={p.after ? 2 : 1.2} />
          ))}
          <g style={{ opacity: Math.max(0, 1 - t * 2) }}>
            <path d={`M300 ${CY} H520`} fill="none" stroke="var(--navy-400)" strokeWidth={1.2} />
            <circle cx={300} cy={CY} r={5} fill="var(--bone-50)" stroke="#8A96C2" />
            <text x={300} y={CY + 28} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--bone-500)' }}>담당자가 정리·기억</text>
            <path d={`M514 ${CY - 6} l12 12 M526 ${CY - 6} l-12 12`} fill="none" stroke="var(--navy-400)" strokeWidth={1.2} />
            <text x={520} y={CY + 28} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--bone-500)' }}>몰입 중단</text>
          </g>
          <g style={{ opacity: Math.min(1, Math.max(0, (t - 0.45) * 2)) }}>
            <path d={`M160 ${CY} H566`} fill="none" stroke="var(--navy-800)" strokeWidth={2} />
            {CHAIN.map(([x, n], i) => i < 4 ? (
              <g key={n}>
                <circle cx={x} cy={CY} r={5} fill="var(--bone-50)" stroke="var(--navy-800)" />
                <text x={x} y={i === 0 ? CY + 56 : i % 2 ? CY - 20 : CY + 28} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--bone-500)' }}>{n}</text>
              </g>
            ) : (
              <g key={n}>
                <polygon points={`566,${CY - 9} 582,${CY} 566,${CY + 9}`} fill="var(--navy-800)" />
                <text x={582} y={CY + 28} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--bone-500)' }}>{n}</text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
