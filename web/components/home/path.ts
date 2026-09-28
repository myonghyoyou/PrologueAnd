/* 경로형 대시보드의 세계와 곡선 — 시안 design/mockups/v6/v6.js 와 같은 좌표 (docs/22).
   선 하나가 고정된 세계(2800×5100) 위에 놓이고, 카메라(화면 중앙)가 선을 따라 미끄러진다. 장면은 선 위의 점 T[i] 에 선다 */

export const W = 2800, H = 5100;

export type Scene = {
  id: string; n: string; x: number; y: number;
  knot?: boolean; end?: boolean;
  group?: [number, number][];      // 점이 여럿인 장면(무엇을)
  off?: [number, number];          // 점이 화면 중앙에 있을 때 판 중심의 화면 px 오프셋. 없으면 곡선 바깥쪽 자동
};

export const SCENES: Scene[] = [
  { id: 'p00', n: 'Prologue', x: 1500, y: 520, knot: true },
  { id: 'p01', n: '처음', x: 2200, y: 1100, off: [376, -20] },
  { id: 'p02', n: '&', x: 1300, y: 1600, off: [-376, -40] },
  { id: 'p03', n: '끝까지', x: 2000, y: 2050 },
  { id: 'p04', n: '회사든, 개인이든', x: 1150, y: 2550, off: [-376, -68] },
  { id: 'p05', n: '무엇을', x: 1700, y: 3000, group: [[1700, 3000], [1700, 3200], [1700, 3400]], off: [376, 220] },
  { id: 'p06', n: 'Projects', x: 1300, y: 3750, off: [-376, 0] },
  { id: 'p07', n: '문의', x: 2100, y: 4250 },
  { id: 'p08', n: '&', x: 1500, y: 4676, end: true },   // 선은 Prologue 글자 위(24px)에서 끝난다
];

export const KNOT_END: [number, number] = [1780, 700];
const NODES: [number, number][] = [KNOT_END, [2200, 1100], [1300, 1600], [2000, 2050], [1150, 2550], [1700, 3000], [1700, 3200], [1700, 3400], [1300, 3750], [2100, 4250], [1500, 4676]];

/** 판(640×420)은 화면 px 고정 — 글자는 세계 스케일에서 제외된다 (docs/22 §12-1) */
export const PW = 640, PH = 420, GAP = 56;
/** 화면 px: 가장자리 여백, 헤더 높이, 선이 화면 중앙보다 내려간 거리, 판 안쪽 여백, 무엇을 칩과 점 사이, 칩의 세로 오프셋(고치기 아래·옮기기 중앙·만들기 위) */
export const EDGE = 24, HDR = 84, LIFT = 20, PAD = 40, NGAP = 28, NDY = [24, 0, -24];
/** 인트로 카메라: 꼬임과 헤드라인이 같이 보이는 자리 / 끝 카메라: Prologue·&·캡션 묶음의 가운데 */
export const CAM0: [number, number] = [1240, 600];
export const CAM_END: [number, number] = [1500, 4772];

/** Catmull-Rom → 3차 베지어 */
function crPath(p: [number, number][], k = 0.5) {
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p[i + 1];
    const c1 = [p1[0] + (p2[0] - p0[0]) * k / 3, p1[1] + (p2[1] - p0[1]) * k / 3];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k / 3, p2[1] - (p3[1] - p1[1]) * k / 3];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const kb = { x: 1150, y: 310, w: 700, h: 420 }, kx = (f: number) => kb.x + kb.w * f, ky = (f: number) => kb.y + kb.h * f;
/** 첫 장면의 꼬인 선 — 풀리면서 경로의 시작점(KNOT_END)에 닿는다 */
export const KNOT_D = `M${kx(-0.15)} ${ky(-0.1)} C ${kx(0.2)} ${ky(-0.05)}, ${kx(0.45)} ${ky(0.35)}, ${kx(0.7)} ${ky(0.15)} S ${kx(0.95)} ${ky(0.45)}, ${kx(0.6)} ${ky(0.6)} S ${kx(0.05)} ${ky(0.5)}, ${kx(0.3)} ${ky(0.25)} S ${kx(0.85)} ${ky(0.05)}, ${kx(0.8)} ${ky(0.5)} S ${kx(0.4)} ${ky(1.05)}, ${kx(0.15)} ${ky(0.75)} S ${kx(0.5)} ${ky(0.1)}, ${kx(0.55)} ${ky(0.45)} S ${kx(0.2)} ${ky(0.95)}, ${kx(0.7)} ${ky(0.85)} C ${kx(0.85)} ${ky(0.82)}, ${kx(0.86)} ${ky(0.9)}, ${KNOT_END[0]} ${KNOT_END[1]}`;
export const MAIN_D = crPath(NODES);

/** 선 위의 점(꼬임·끝 제외) — 카메라가 지나가면 채워진다 */
export const DOTS: [number, number][] = SCENES.filter((s) => !s.knot && !s.end).flatMap((s) => s.group ?? [[s.x, s.y] as [number, number]]);
