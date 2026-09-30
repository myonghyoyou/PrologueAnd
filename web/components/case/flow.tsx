'use client';
import { useMemo, useRef } from 'react';
import type { FlowBlock } from '@/content';
import { pinT, usePin } from './pinned';
import { useReducedMotion, useScrollProgress } from './use-scroll-progress';
import g from './grid.module.css';
import s from './flow.module.css';

const CY = 160;                     // 가운데 줄
const Y0 = 64, Y1 = 256;            // 갈래가 서는 높이 범위
const SX = 40;                      // 갈래 선이 시작하는 x = 새 흐름의 첫 점
const HX = 300;                     // 앞 그림: 담당자가 다시 정리하는 점
const KX = 609;                     // 앞 그림의 끝점(업무 효율 저하). 전 그림의 좌우 가운데가 새 흐름과 같아지는 자리
const X1 = 566;                     // 새 흐름의 끝점
// 가로 위치는 CSS(flow.module.css .shift)가 준다 — 전·후 그림 모두 상자 가운데, 전환 중에는 움직이지 않는다
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const spread = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => (n === 1 ? (a + b) / 2 : a + (b - a) * i / (n - 1)));
const curve = (y: number) => `M${SX} ${y} C ${lerp(SX, HX, 0.42)} ${y}, ${lerp(SX, HX, 0.75)} ${CY + (y - CY) * 0.12}, ${HX} ${CY}`;

/** 윗변이 화면 85% 에 오면 0, 그림 가운데가 화면 40% 에 오면 1 (명세 §6) */
const morphT = (r: DOMRect, vh: number) => (vh * 0.85 - r.top) / (vh * 0.45 + r.height / 2);

export function Flow({ b }: { b: FlowBlock }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // 붙은 장(바꾼 흐름) 안이면 장 트랙의 진행률로, 아니면(폰) 그림이 화면을 지나가는 위치로 잰다
  const pin = usePin();
  const pinned = b.state === 'morph' && !!pin?.on;
  const t = useScrollProgress(pinned ? pin!.ref : ref, pinned ? pinT : morphT, b.state === 'before' ? 0 : reduced ? 1 : undefined);

  const srcY = useMemo(() => spread(Y0, Y1, b.from.length).map(Math.round), [b.from.length]);
  const stepX = useMemo(() => spread(SX, X1, b.to.length), [b.to.length]);
  // 한 번에 하나씩 (비교 시트 design/spec/12-flow-morph.html A안)
  // ① 0.10–0.32 "다시 정리 → 멈춤" 구간이 오른쪽부터 지워진다  ② 0.34–0.58 네 갈래가 이름표를 단 채 한 줄로 모인다
  // ③ 0.58–0.94 그 줄 위로 새 흐름이 왼쪽부터 그어지고, 펜이 지나간 단계의 점·이름이 자란다
  const cut = ease(seg(t, 0.10, 0.32)), merge = ease(seg(t, 0.34, 0.58)), draw = ease(seg(t, 0.58, 0.94));
  const stop = 1 - seg(t, 0.10, 0.18), hubLbl = 1 - seg(t, 0.20, 0.30), hub = 1 - seg(t, 0.30, 0.42);
  const lbl = clamp01(1 - (merge - 0.45) * 2.5);                    // 이름표는 선 끝을 따라 모이다가 서로 겹치기 전에 사라진다
  const penX = lerp(SX, X1 + 24, draw);                              // 끝점도 다 자라도록 펜은 끝점을 24 지나간다. 선은 끝점에서 멈춘다
  const grow = (x: number, i: number) => clamp01((penX - x) / 24 + (i === 0 && draw > 0 ? 1 : 0));

  return (
    <div className={g.g}>
      <figure ref={ref} className={`${b.state === 'before' ? g.body : g.wide} ${s.fig}`} data-flow data-t={t.toFixed(3)}>
        <div className={s.box}>
          <svg viewBox="0 0 640 320" className={s.svg} role="img" aria-label={b.alt}>
            <g className={s.shift}>
              {srcY.map((y0, i) => {
                const y = lerp(y0, CY, merge);
                return (
                  <g key={`s${i}`}>
                    <text data-src-label x={25} y={y + 4} textAnchor="end" className={s.lbl} style={{ opacity: lbl }}>{b.from[i]}</text>
                    <path data-src-path d={curve(y)} fill="none" stroke="var(--navy-400)" strokeWidth={1.2} />
                    {/* 갈래의 시작점 — 모이면 네 점이 한 점이 되고, 그 자리에 새 흐름의 첫 점이 선다 */}
                    <circle data-src-dot cx={SX} cy={y} r={5} fill="var(--bone-50)" stroke="var(--navy-400)"
                            style={{ opacity: i === 0 ? 1 : 1 - seg(merge, 0.55, 0.9) }} />   {/* 거의 모이면 하나만 남는다 — 겹친 고리가 뭉쳐 보이지 않게 */}
                  </g>
                );
              })}
              {/* 다시 정리한 뒤: 끊기는 X 대신 흐려지는 점선이 빈 점에서 멈춘다. 잘라낼 때는 오른쪽부터 줄어든다 */}
              {cut < 1 ? <path data-tail d={`M${HX} ${CY} H${lerp(KX, HX, cut).toFixed(1)}`} fill="none" stroke="var(--navy-400)" strokeWidth={1.2} strokeDasharray="3 5" /> : null}
              {hub > 0 ? <circle cx={HX} cy={CY} r={5 * hub} fill="var(--bone-50)" stroke="var(--navy-400)" style={{ opacity: hub }} /> : null}
              {/* 모이는 점 이름은 점의 오른쪽 아래 — 가운데 아래는 아래 갈래 곡선이 지나가 글자와 겹친다(폰은 글자가 커서 더) */}
              <text x={HX + 10} y={CY + 24} textAnchor="start" className={s.lbl} style={{ opacity: hubLbl }}>{b.hub}</text>
              <g style={{ opacity: stop }}>
                <circle data-stop cx={KX} cy={CY} r={5} fill="var(--bone-50)" stroke="var(--bone-400)" />
                {/* 끝점 이름은 점선 위 — 아래에 두면 폰에서 모이는 점 이름과 부딪힌다 */}
                <text x={KX + 8} y={CY - 14} textAnchor="end" className={s.lbl}>{b.stop}</text>
              </g>
              {draw > 0 ? <path data-chain d={`M${SX} ${CY} H${Math.min(penX, X1).toFixed(1)}`} fill="none" stroke="var(--navy-800)" strokeWidth={2} /> : null}
              {stepX.map((x, i) => {
                const k = grow(x, i), first = i === 0, last = i === b.to.length - 1, up = !first && !last && i % 2 === 1;
                return (
                  <g key={`t${i}`} style={{ opacity: k }}>
                    {/* 마지막 단계도 점 — 끝이라 속을 채운다 */}
                    <circle data-step cx={x} cy={CY} r={5 * ease(k)} fill={last ? 'var(--navy-800)' : 'var(--bone-50)'} stroke="var(--navy-800)" />
                    {/* 첫·끝 단계 이름은 점에서 안쪽으로 편다 — 가운데 맞춤이면 긴 이름이 폰에서 그림 밖으로 나간다 */}
                    <text x={first ? x - 8 : last ? x + 8 : x} y={(up ? CY - 20 : CY + 28) + (up ? 4 : -4) * (1 - k)}
                          textAnchor={first ? 'start' : last ? 'end' : 'middle'} className={s.lbl}>{b.to[i]}</text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
        {b.caption ? <figcaption className={s.cap}>{b.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
