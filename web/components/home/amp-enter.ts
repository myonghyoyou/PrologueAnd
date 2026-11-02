/** 첫 화면 & 등장(시그니처 1) — 제목과 글은 처음부터 보이고, & 의 가닥만 원본 경로를 따라 그려진다.
 *  고리(위 꼭대기 → 위 고리 → 아래 고리) → 오른쪽 내림획(고리 끝에서 위로)·가로획(내림획이 닿는 자리에서 양옆으로) → 대각선(꼭대기 → 발끝).
 *  같은 무리 안에서는 1 → 6 번이 조금씩 늦게 따라오고, 주된 가닥(대각선 6번)이 마지막으로 발끝에 닿아 그 속도 그대로 페이지 선으로 이어진다.
 *  재생: 페이지를 새로 열거나 새로고침했을 때 맨 위에서만(매번 같은 방식). 주소에 #이 있거나 중간에서 열리면·모션 줄이기면 완성된 & 로 바로 보인다.
 *  자동화 브라우저(테스트)는 ?amp 가 있을 때만 */
export const AMP_GATE = `(function(){try{var q=location.search.indexOf('amp')>-1;
if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
if((navigator.webdriver&&!q)||location.hash||scrollY>0)return;
var h=document.documentElement;h.dataset.ampIn='on';
setTimeout(function(){if(h.dataset.ampIn==='on'&&!window.__ampIn)delete h.dataset.ampIn},2500)}catch(e){}})();`;

/** mode — fwd: 경로 시작에서, rev: 끝에서, out: 경로의 s 비율 자리에서 양옆으로 */
export type EnterDraw = { a: number; b: number; mode: 'fwd' | 'rev' | 'out'; s: number; main: boolean };

/** 가닥이 그려지는 때(ms). 합쳐 1.56초 */
export function enterPlan(group: string, n: number): EnterDraw {
  const i = n - 1;
  if (group === 'loops') return { a: i * 55, b: i * 55 + 720, mode: 'fwd', s: 0, main: false };
  if (group === 'desc') return { a: 640 + i * 35, b: 900 + i * 35, mode: 'rev', s: 0, main: false };
  // 가로획(x 812 → 1157)은 같은 번호 내림획 윗끝(x 1024.5 − 13·i)이 닿는 자리에서 벌어진다
  if (group === 'bar') return { a: 780 + i * 35, b: 1080 + i * 35, mode: 'out', s: (1024.5 - 13 * i - 812) / 345, main: false };
  return { a: 720 + i * 60, b: 1260 + i * 60, mode: 'fwd', s: 0, main: n === 6 };
}
export const ENTER_END = 1560;

const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 주된 가닥은 천천히 출발해 빨라진 채 끝난다(끝 속도 = 평균의 1.5배) — 그 속도로 페이지 선이 이어받는다 */
const gather = (t: number) => (t * t * (3 - t)) / 2;
export const MAIN_END_SPEED = 1.5;
export const enterEase = (x: EnterDraw, t: number) => (x.main ? gather(t) : inOut(t));

/** 가닥 하나의 점선 — len 은 화면 px(가닥 굵기가 화면 기준이라), t 는 0~1. 다 그렸으면 점선을 풀어 원본 그대로 둔다.
 *  hold: 첫 & 등장 중 — 가닥을 비워 두는 CSS(html[data-amp-in]) 가 아직 걸려 있으니 none 으로 붙잡아 둔다 */
export function dash(p: SVGPathElement, len: number, t: number, mode: EnterDraw['mode'], s = 0, hold = false) {
  const st = p.style;
  if (t >= 1) { st.strokeDasharray = hold ? 'none' : ''; st.strokeDashoffset = ''; return; }
  if (mode === 'out') {
    st.strokeDasharray = `0 ${(s * len * (1 - t)).toFixed(1)} ${(len * t).toFixed(1)} ${(len * 2).toFixed(1)}`;
    st.strokeDashoffset = '0';
    return;
  }
  st.strokeDasharray = `${len.toFixed(1)} ${(len + 2).toFixed(1)}`;
  st.strokeDashoffset = ((mode === 'rev' ? -1 : 1) * len * (1 - t)).toFixed(1);
}

/** 대각선 밑으로 고리·내림획을 가리는 띠(원본 mask 의 굵은 둥근 획) — 등장 중에는 대각선 머리가 지나간 곳까지만 가린다.
 *  띠의 점마다 가장 가까운 대각선 자리(0~1)를 미리 짝지어 둔다. 단위는 원본 좌표 */
export type Band = { p: SVGPathElement; L: number; at: number[]; u: number[]; r: number };
export function bandOf(p: SVGPathElement, lead: SVGPathElement): Band {
  const L = p.getTotalLength(), LL = lead.getTotalLength(), N = 160, K = 64;
  const ref = Array.from({ length: N + 1 }, (_, j) => lead.getPointAtLength((LL * j) / N));
  const at: number[] = [], u: number[] = [];
  for (let k = 0; k <= K; k++) {
    const q = p.getPointAtLength((L * k) / K);
    let best = 0, bd = Infinity;
    ref.forEach((r, j) => { const d = (r.x - q.x) ** 2 + (r.y - q.y) ** 2; if (d < bd) { bd = d; best = j; } });
    at.push((L * k) / K); u.push(best / N);
  }
  return { p, L, at, u, r: parseFloat(p.getAttribute('stroke-width') ?? '0') / 2 };
}
/** 대각선 머리가 f(0~1) 까지 왔을 때 띠를 그 자리까지만 — 둥근 끝이 머리보다 앞서지 않게 반지름만큼 물린다. f ≥ 1 이면 원본 그대로
 *  (hold: 등장 중이라 띠를 끄는 CSS 가 아직 걸려 있으니 켠 채로 붙잡아 둔다) */
export function band(b: Band, f: number, hold = false) {
  const st = b.p.style;
  if (f >= 1) { st.display = hold ? 'inline' : ''; st.strokeDasharray = ''; return; }
  let m1 = -1;
  b.u.forEach((v, k) => { if (v <= f) m1 = b.at[k]; });
  const len = m1 - b.r;
  if (len <= 0) { st.display = 'none'; return; }
  st.display = 'inline';
  st.strokeDasharray = `${len.toFixed(1)} ${(b.L * 2).toFixed(1)}`;
}
