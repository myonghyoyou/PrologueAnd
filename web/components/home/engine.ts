/* 경로형 대시보드의 카메라 — 시안 v6.js 의 엔진을 옮긴 것 (docs/22).
   t = 선을 따라 잰 거리. 휠·키·진행 지도가 다음/이전 장면의 t 를 목표로 주고, smoothDamp 가 카메라를 그 자리로 끌고 간다.
   데스크톱 전용 — 폰은 CSS 가 세로 스택으로 풀고 이 엔진은 켜지지 않는다. 문서 스크롤이 아니라 고정된 무대 안의 이동이라 Lenis 를 쓰지 않는다 */
import { SCENES, PW, PH, GAP, EDGE, HDR, LIFT, PAD, NGAP, NDY, CAM0, CAM_END, KNOT_END } from './path';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function smoothDamp(cur: number, to: number, vel: number, smoothTime: number, dt: number) {
  const w = 2 / Math.max(0.0001, smoothTime), x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const ch = cur - to, tt = (vel + w * ch) * dt;
  return { pos: to + (ch + tt) * e, vel: (vel - w * tt) * e };
}

type SceneEl = { el: HTMLElement | null; pan: boolean; firstIdx: number; rect?: { x: number; y: number; w: number; h: number } };

export type DashApi = { go: (i: number, immediate?: boolean) => void; step: (dir: number) => boolean; state: () => { pos: number; target: number; active: boolean; scene: number; T: number[] } };

export function startEngine(root: HTMLElement, { reduced }: { reduced: boolean }): () => void {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const stage = q<HTMLElement>('[data-stage]'), world = q<HTMLElement>('[data-world]');
  const guide = q<SVGPathElement>('[data-guide]'), ink = q<SVGPathElement>('[data-ink]'), knot = q<SVGPathElement>('[data-knot]');
  const dotEls = [...root.querySelectorAll<SVGCircleElement>('[data-dot]')];
  const nodeEls = [...root.querySelectorAll<HTMLElement>('[data-node]')];
  const mapEls = [...root.querySelectorAll<HTMLElement>('[data-pmap] button')];

  /* ---------- 선 샘플 표(4px 간격)와 장면 스냅 점 T ---------- */
  const L = guide.getTotalLength();
  const S: [number, number][] = [];
  for (let t = 0; t <= L + 4; t += 4) { const p = guide.getPointAtLength(Math.min(t, L)); S.push([p.x, p.y]); }
  const pAt = (t: number) => S[Math.min(S.length - 1, Math.max(0, Math.round(clamp(t, 0, L) / 4)))];
  const tangentAt = (t: number) => { const a = pAt(t - 8), b = pAt(t + 8), dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1; return [dx / n, dy / n]; };
  const turnAt = (t: number) => { const a = tangentAt(t - 120), b = tangentAt(t + 120); return a[0] * b[1] - a[1] * b[0]; };
  const tOf = (x: number, y: number) => { let bi = 0, bd = 1e12; S.forEach((p, i) => { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi * 4; };

  const T: number[] = [];
  const sc: SceneEl[] = SCENES.map((s) => {
    const el = root.querySelector<HTMLElement>(`#${s.id}`);
    const firstIdx = T.length;
    (s.group ?? [[s.x, s.y]]).forEach(([x, y]) => T.push(s.knot ? 0 : tOf(x, y)));
    return { el, pan: !!el?.hasAttribute('data-pan'), firstIdx };
  });
  const dotT = dotEls.map((d) => tOf(Number(d.getAttribute('cx')), Number(d.getAttribute('cy'))));
  const F5 = sc[5].firstIdx;

  /* ---------- 판 자리: 점에서 곡선 바깥쪽으로 GAP + 판 반폭. 판은 화면 px 라 세계 안 크기가 scale 따라 달라져 창이 바뀔 때마다 다시 잡는다 ---------- */
  let scale = 1;
  function place() {
    const s = scale, pw = PW / s, ph = PH / s;
    const halfW = innerWidth / 2 / s, up = (innerHeight / 2 + LIFT) / s, down = (innerHeight / 2 - LIFT) / s, m = EDGE / s, hdr = HDR / s;
    const within = (v: number, a: number, b: number) => a > b ? (a + b) / 2 : clamp(v, a, b);   // 창이 좁아 다 못 들어오면 가운데로
    SCENES[5].group!.forEach((pt, i) => { const n = nodeEls[i]; if (!n) return; n.style.left = `${pt[0] - NGAP / s}px`; n.style.top = `${pt[1] + NDY[i] / s}px`; });
    SCENES.forEach((def, i) => {
      const o = sc[i];
      if (!o.el || !o.pan) return;
      const t = T[o.firstIdx], tg = tangentAt(t), turn = turnAt(t);
      let cx: number, cy: number;
      if (def.off) { cx = def.x + def.off[0] / s; cy = def.y + def.off[1] / s; }
      else {
        let nx = -tg[1], ny = tg[0];
        if (turn > 0) { nx = -nx; ny = -ny; }
        const ext = Math.abs(nx) * pw / 2 + Math.abs(ny) * ph / 2;
        cx = def.x + nx * (GAP + ext); cy = def.y + ny * (GAP + ext);
      }
      // 창 안으로: 자동 배치는 상자 전체가 장면의 모든 점에서, 직접 지정은 안쪽 내용 영역이 도착 자리에서 가장자리·헤더를 넘지 않게
      const pts = def.off ? [[def.x, def.y]] : (def.group ?? [[def.x, def.y]]), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const hw = (def.off ? pw - 2 * PAD / s : pw) / 2, hh = (def.off ? ph - 2 * PAD / s : ph) / 2;
      const lx = Math.max(...xs) - halfW + m + hw, hx = Math.min(...xs) + halfW - m - hw, ly = Math.max(...ys) - up + hdr + hh, hy = Math.min(...ys) + down - m - hh;
      cx = within(cx, lx, hx); cy = within(cy, ly, hy);
      // 선이 판을 지나면 접선 방향으로 밀어 피한다 — 창 안에 남는 자리만. 그런 자리가 없으면 창 안을 우선하고 선은 판 뒤로 지나간다
      const hits = (x: number, y: number) => S.some((p) => p[0] >= x - 12 && p[0] <= x + pw + 12 && p[1] >= y - 12 && p[1] <= y + ph + 12);
      const inWin = (x: number, y: number) => x >= lx - 0.5 && x <= hx + 0.5 && y >= ly - 0.5 && y <= hy + 0.5;
      if (hits(cx - pw / 2, cy - ph / 2)) {
        outer: for (let d = 20; d <= 400; d += 20) for (const sg of [1, -1]) {
          const x = cx + tg[0] * d * sg, y = cy + tg[1] * d * sg;
          if (inWin(x, y) && !hits(x - pw / 2, y - ph / 2)) { cx = x; cy = y; break outer; }
        }
      }
      o.rect = { x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph };
      o.el.style.left = `${o.rect.x}px`; o.el.style.top = `${o.rect.y}px`;
    });
  }
  function fit() { scale = clamp(Math.min(innerWidth / 1440, innerHeight / 900), 0.85, 1.2); world.style.setProperty('--inv', String(1 / scale)); place(); }

  /* ---------- 이동 ---------- */
  const anim = { pos: 0, target: 0, vel: 0, active: false, smooth: 0.32 };
  let dirty = true;
  const setTarget = (t: number) => {
    anim.target = clamp(t, 0, L);
    if (reduced) { anim.pos = anim.target; anim.vel = 0; anim.active = false; dirty = true; return; }   // 모션 줄이기: 미끄러지지 않고 바로 선다
    anim.active = true;
  };
  const step = (dir: number) => {
    const at = anim.active ? anim.target : anim.pos;
    const t = dir > 0 ? T.find((v) => v > at + 2) : [...T].reverse().find((v) => v < at - 2);
    if (t === undefined) return false;
    setTarget(t); return true;
  };
  const go = (i: number, immediate = false) => {
    const t = T[sc[i].firstIdx];
    if (immediate) { anim.active = false; anim.vel = 0; anim.pos = anim.target = t; dirty = true; render(); }
    else setTarget(t);
  };

  // 무엇을: 세 점을 지나는 동안 카메라는 가운데 점(옮기기)에 고정, 선·점·칩만 진행. 앞뒤 구간은 선형으로 재매개해 도착 직전에 튀지 않는다
  function camT(t: number) {
    const a = T[F5], b = T[F5 + 1], c = T[F5 + 2], pre = T[F5 - 1], post = T[F5 + 3];
    if (t <= pre || t >= post) return t;
    if (t >= a && t <= c) return b;
    return t < a ? pre + (t - pre) * (b - pre) / (a - pre) : b + (t - c) * (post - b) / (post - c);
  }
  const curScene = () => { let i = 0; sc.forEach((o, k) => { if (anim.pos >= T[o.firstIdx] - 40) i = k; }); return i; };
  const sceneDist = (i: number) => {
    const o = sc[i], a = T[o.firstIdx], b = T[o.firstIdx + ((SCENES[i].group?.length ?? 1) - 1)];
    return anim.pos < a ? a - anim.pos : anim.pos > b ? anim.pos - b : 0;
  };
  const nearestScene = () => { let bi = 0, bd = Infinity; sc.forEach((_, i) => { const d = sceneDist(i); if (d < bd) { bd = d; bi = i; } }); return bi; };
  const flag = (el: Element, name: string, on: boolean) => el.toggleAttribute(name, on);

  function render() {
    const p = pAt(camT(anim.pos)), s = scale, cx = innerWidth / 2;
    // 인트로: t=0 에서 카메라는 CAM0, 첫 점까지 오프셋이 선형으로 0 이 된다. 끝: 마지막 구간에서 선 끝점 대신 CAM_END 로, LIFT 도 0 으로
    const e = clamp(anim.pos / T[1], 0, 1);
    const tEnd = T[T.length - 1], tPrev = T[T.length - 2], e2 = clamp((anim.pos - tPrev) / (tEnd - tPrev), 0, 1), pEnd = pAt(tEnd);
    const cy = innerHeight / 2 + LIFT * (1 - e2);
    const c = [p[0] + (CAM0[0] - KNOT_END[0]) * (1 - e) + (CAM_END[0] - pEnd[0]) * e2, p[1] + (CAM0[1] - KNOT_END[1]) * (1 - e) + (CAM_END[1] - pEnd[1]) * e2];
    world.style.transform = `translate(${cx}px, ${cy}px) scale(${s}) translate(${-c[0]}px, ${-c[1]}px)`;
    ink.style.strokeDashoffset = String(L - Math.min(anim.pos, L));
    if (sc[8].el) flag(sc[8].el, 'data-arrive', anim.pos >= L - 2);
    dotEls.forEach((d, i) => flag(d, 'data-on', anim.pos >= dotT[i] - 2));
    // 판은 가장 가까운 장면의 것만 — 두 장면의 중간에서 지금 판이 사라지고 다음 판이 뜬다. 숨은 판은 키보드 초점도 받지 않는다
    const near = nearestScene();
    sc.forEach((o, i) => { if (o.el && o.pan) { flag(o.el, 'data-show', i === near); o.el.inert = i !== near; } });
    nodeEls.forEach((n, i) => { flag(n, 'data-vis', near === 5); flag(n, 'data-on', anim.pos >= T[F5 + i] - 2); });
    const cur = curScene();
    mapEls.forEach((b, i) => { flag(b, 'data-on', i === cur); flag(b, 'data-done', i < cur); if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    const hash = cur ? `#${SCENES[cur].id}` : '';
    if (location.hash !== hash) history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
  }

  /* ---------- 입력 ---------- */
  const blocked = () => document.documentElement.hasAttribute('data-drawer-open');
  const WHEEL = { gap: 100, first: 90, more: 480 };
  let acc = 0, lastEv = 0, pending = 0, lockUntil = 0, stepped = false, streamStart = 0;
  const request = (dir: number) => { const now = performance.now(); if (now < lockUntil) { pending += dir; return; } step(dir); lockUntil = now + 160; };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (blocked()) return;
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (!d) return;
    const now = performance.now(), gap = now - lastEv; lastEv = now;
    if (gap > WHEEL.gap) { acc = 0; stepped = false; streamStart = now; }
    acc += d;
    if (!stepped) { if (Math.abs(acc) >= WHEEL.first) { request(acc > 0 ? 1 : -1); acc = 0; stepped = true; } return; }
    if (now - streamStart > 300 && Math.abs(acc) >= WHEEL.more) { request(acc > 0 ? 1 : -1); acc = 0; }
  };
  const KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', ' '];
  const onKey = (e: KeyboardEvent) => {
    if (!KEYS.includes(e.key) || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || blocked()) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;   // 입력 칸의 스페이스·화살표는 글자 입력이다
    if (e.key === ' ' && t?.closest('a, button')) return;                           // 초점 받은 버튼의 스페이스는 누르기다
    e.preventDefault();
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) step(1);
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) step(-1);
    else if (e.key === 'Home') setTarget(0);
    else setTarget(L);
  };
  const onMap = (e: MouseEvent) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-pmap] button'); if (b) setTarget(T[sc[Number(b.dataset.i)].firstIdx]); };
  const onGo = (e: MouseEvent) => { const a = (e.target as HTMLElement).closest<HTMLElement>('[data-go]'); if (!a) return; e.preventDefault(); setTarget(T[sc[Number(a.dataset.go)].firstIdx]); };
  const onResize = () => { fit(); dirty = true; };
  // 주소창·뒤로 가기로 해시만 바뀌면 그 장면으로 (엔진이 쓰는 replaceState 는 이 이벤트를 내지 않는다)
  const onHash = () => { const i = SCENES.findIndex((s) => `#${s.id}` === location.hash); setTarget(T[sc[Math.max(0, i)].firstIdx]); };

  stage.addEventListener('wheel', onWheel, { passive: false });
  addEventListener('keydown', onKey);
  root.addEventListener('click', onMap);
  root.addEventListener('click', onGo);
  addEventListener('resize', onResize);
  addEventListener('hashchange', onHash);

  /* ---------- 시작 ---------- */
  fit();
  ink.style.strokeDasharray = String(L);
  const hi = SCENES.findIndex((s) => `#${s.id}` === location.hash);
  if (hi > 0) anim.pos = anim.target = T[sc[hi].firstIdx];   // 주소의 장면에서 바로 시작, 인트로 생략
  if (hi <= 0 && !reduced) {
    // 꼬임이 그려지며 풀린다
    const KL = knot.getTotalLength();
    knot.style.strokeDasharray = String(KL); knot.style.strokeDashoffset = String(KL);
    knot.getBoundingClientRect();
    knot.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.45,0,.55,1) .2s';
    knot.style.strokeDashoffset = '0';
  }
  render();
  root.setAttribute('data-ready', '');

  let raf = 0, last = performance.now();
  const tick = (now: number) => {
    const dt = clamp((now - last) / 1000, 0.001, 0.5); last = now;
    if (pending && now >= lockUntil) { const dir = Math.sign(pending); pending -= dir; step(dir); lockUntil = now + 160; }
    if (anim.active) {
      const r = smoothDamp(anim.pos, anim.target, anim.vel, anim.smooth, dt); anim.pos = r.pos; anim.vel = r.vel;
      if (Math.abs(anim.target - anim.pos) < 0.4 && Math.abs(anim.vel) < 6) { anim.pos = anim.target; anim.vel = 0; anim.active = false; }
    }
    // 멈춰 있을 때는 그리지 않는다
    if (anim.active || dirty) { dirty = false; render(); }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const api: DashApi = { go, step, state: () => ({ pos: anim.pos, target: anim.target, active: anim.active, scene: curScene(), T: T.slice() }) };
  (window as unknown as { __dash?: DashApi }).__dash = api;   // 테스트가 카메라를 옮기고 읽는 통로

  return () => {
    cancelAnimationFrame(raf);
    stage.removeEventListener('wheel', onWheel);
    removeEventListener('keydown', onKey);
    root.removeEventListener('click', onMap);
    root.removeEventListener('click', onGo);
    removeEventListener('resize', onResize);
    removeEventListener('hashchange', onHash);
    delete (window as unknown as { __dash?: DashApi }).__dash;
    // 폰 폭으로 바뀌면 세로 스택이 된다 — 엔진이 남긴 자리·표시를 걷어낸다
    world.style.transform = ''; world.style.removeProperty('--inv');
    ink.style.strokeDasharray = ''; ink.style.strokeDashoffset = '';
    knot.style.cssText = '';
    sc.forEach((o) => { if (!o.el) return; o.el.inert = false; o.el.removeAttribute('data-show'); o.el.removeAttribute('data-arrive'); if (o.pan) { o.el.style.left = ''; o.el.style.top = ''; } });
    nodeEls.forEach((n) => { n.style.left = ''; n.style.top = ''; n.removeAttribute('data-vis'); n.removeAttribute('data-on'); });
    root.removeAttribute('data-ready');
  };
}
