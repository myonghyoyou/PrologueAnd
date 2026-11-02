'use client';
import { useEffect } from 'react';
import { AMP_H, AMP_TIP, AMP_VB, AMP_MAIN } from './amp-path';
import { enterPlan, enterEase, dash, bandOf, band, ENTER_END, MAIN_END_SPEED } from './amp-enter';
import s from './home.module.css';

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const f = (n: number) => n.toFixed(1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Pt = [number, number];
/** 꺾은선 점 — 셋째 값이 있으면 그 모서리만 그 반지름으로 둥글린다 */
type Wp = [number, number] | [number, number, number];
type Box = { l: number; t: number; r: number; b: number; w: number; h: number };
/** [선 끝이 따라가는 높이, 그때 그려진 길이] — 사이는 곧게 잇는다 */
type Knot = [number, number];

/** 장면 하나의 선 — 장면(또는 흐르는 구간) 왼쪽 위에 1px SVG 를 두고 넘쳐 그린다. 좌표는 그 장면 기준 px */
class Line {
  svg: SVGSVGElement; ink: SVGPathElement; tip: SVGCircleElement; m: SVGPathElement;
  L = 0; at: number[] = []; len = 0; light: boolean; private ad = ''; private an: { len: number; y: number }[] = [];
  constructor(host: Element, light = false) {
    this.light = light;
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('class', s.seg); this.svg.setAttribute('aria-hidden', 'true'); this.svg.dataset.thread = '';
    this.m = document.createElementNS(NS, 'path'); this.m.setAttribute('fill', 'none'); this.m.setAttribute('visibility', 'hidden');
    this.ink = document.createElementNS(NS, 'path'); this.ink.setAttribute('class', light ? `${s.threadInk} ${s.threadLight}` : s.threadInk);
    this.tip = document.createElementNS(NS, 'circle'); this.tip.setAttribute('r', '4.5'); this.tip.setAttribute('class', s.threadTip);
    this.tip.toggleAttribute('data-dark', light);
    this.svg.append(this.m, this.ink, this.tip);
    host.appendChild(this.svg);
  }
  /** start 에서 pts 를 차례로 지나는 꺾은선. at[i]: i 번째 점의 모서리에 들어서기 전까지의 길이(마지막은 전체 길이) */
  set(start: Pt, pts: Wp[], r = 40) {
    let d = `M${f(start[0])} ${f(start[1])}`, prev: Pt = start;
    const at: number[] = [];
    pts.forEach((p, i) => {
      const nx = pts[i + 1];
      if (!nx) { d += ` L${f(p[0])} ${f(p[1])}`; this.m.setAttribute('d', d); at.push(this.m.getTotalLength()); return; }
      const la = Math.hypot(prev[0] - p[0], prev[1] - p[1]) || 1, lb = Math.hypot(nx[0] - p[0], nx[1] - p[1]) || 1, t = Math.min(p[2] ?? r, la / 2, lb / 2);
      const p1: Pt = [p[0] + ((prev[0] - p[0]) / la) * t, p[1] + ((prev[1] - p[1]) / la) * t], p2: Pt = [p[0] + ((nx[0] - p[0]) / lb) * t, p[1] + ((nx[1] - p[1]) / lb) * t];
      d += ` L${f(p1[0])} ${f(p1[1])}`; this.m.setAttribute('d', d); at.push(this.m.getTotalLength());
      d += ` C${f(p1[0] + (p[0] - p1[0]) * 0.55)} ${f(p1[1] + (p[1] - p1[1]) * 0.55)} ${f(p2[0] + (p[0] - p2[0]) * 0.55)} ${f(p2[1] + (p[1] - p2[1]) * 0.55)} ${f(p2[0])} ${f(p2[1])}`;
      prev = [p[0], p[1]];
    });
    this.ink.setAttribute('d', d); this.L = this.ink.getTotalLength(); this.at = at;
    at[at.length - 1] = this.L;
  }
  private mk: SVGGElement | null = null;
  /** 이 상자들 안에서는 선이 보이지 않는다(그림 뒤로 지난다). 선 끝 점도 같이 가린다 */
  hide(rs: Box[]) {
    if (!this.mk) {
      const id = `thread-m${++Line.n}`, defs = document.createElementNS(NS, 'defs'), m = document.createElementNS(NS, 'mask'), all = document.createElementNS(NS, 'rect');
      m.id = id; m.setAttribute('maskUnits', 'userSpaceOnUse');
      for (const [k, v] of [['x', '-20000'], ['y', '-20000'], ['width', '60000'], ['height', '200000']]) { m.setAttribute(k, v); all.setAttribute(k, v); }
      all.setAttribute('fill', '#fff'); this.mk = document.createElementNS(NS, 'g'); m.append(all, this.mk); defs.append(m); this.svg.prepend(defs);
      this.ink.setAttribute('mask', `url(#${id})`); this.tip.setAttribute('mask', `url(#${id})`);
    }
    this.mk.replaceChildren(...rs.map((r) => { const e = document.createElementNS(NS, 'rect'); e.setAttribute('x', f(r.l)); e.setAttribute('y', f(r.t)); e.setAttribute('width', f(r.w)); e.setAttribute('height', f(r.h)); e.setAttribute('fill', '#000'); return e; }));
  }
  static n = 0;
  draw(len: number) { this.len = clamp(len, 0, this.L); this.ink.style.strokeDasharray = `${f(this.len)} ${f(this.L + 40)}`; }
  /** 흐르는 구간: 선 위 점의 높이(지나온 가장 낮은 곳)를 8px 마다 — 가로로 가는 곳에도 조금씩 스크롤을 준다 */
  anchors(y0: number) {
    const d = this.ink.getAttribute('d') ?? '';
    if (d === this.ad && this.an.length && this.an[0].y === y0) return this.an;
    const out = [{ len: 0, y: y0 }]; let y = y0;
    for (let l = 8; l < this.L; l += 8) { y = Math.max(y + 1.2, this.ink.getPointAtLength(l).y); out.push({ len: l, y }); }
    out.push({ len: this.L, y: Math.max(y + 1, this.ink.getPointAtLength(this.L).y) });
    this.ad = d; this.an = out;
    return out;
  }
}
const lenAt = (an: { len: number; y: number }[], y: number) => {
  if (!an.length || y <= an[0].y) return 0;
  for (let i = 1; i < an.length; i++) if (y <= an[i].y) { const p = an[i - 1], q = an[i]; return p.len + (q.len - p.len) * clamp((y - p.y) / Math.max(1e-6, q.y - p.y)); }
  return an[an.length - 1].len;
};
const knots = (k: Knot[], vy: number) => {
  if (vy <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (vy <= k[i][0]) { const [a, la] = k[i - 1], [b, lb] = k[i]; return la + (lb - la) * clamp((vy - a) / Math.max(1e-6, b - a)); }
  return k[k.length - 1][1];
};

type Scene = {
  key: string; host: HTMLElement; sec: HTMLElement; line: Line; pinned: boolean;
  /** 페이지 기준 장면 꼭대기, 붙어 있는 길이 */
  top: number; P: number; extB: number; exitX: number;
  measure: () => void; build: (xE: number) => void; frame: (vy: number) => void;
};

/** 홈의 잇는 선과 장면(시그니처 2) — 한 가닥이 장면마다 그 장면의 변화를 시작하고 다음 장면으로 시선을 넘긴다.
 *  첫 & 발끝 → 02 머리 선 끝을 지나면 큰 문장이 올라오고, 「불편한지」 밑을 지나며 초점이 잡힌다 → 왼쪽 번호 사이를 옮겨 갈 때마다 단계가 바뀐다 →
 *  남색이 선을 따라 내려와 작업이 열린다 → 그림이 커지거나(요청 처리) 비교가 움직이거나(병원) 확대가 열리는(근무표) 동안 선은 그림 뒤에 있다가 아래에서 다시 나온다 →
 *  두 폰 화면 사이로 → 마지막 & 를 완성.
 *  선과 장면은 모두 스크롤 위치 하나에서 계산한다(되돌리면 그대로 되돌아가고, 빨리 내려도 같은 상태). 정지 화면 설명: docs/superpowers/specs/2026-10-29-home-motion-p2.md 14절 */
export function Scenes() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-home]');
    if (!root) return;
    const html = document.documentElement;
    const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
    root.dataset.motion = reduced ? 'still' : 'on';
    const q = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => from.querySelector<T>(sel);
    const qa = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => [...from.querySelectorAll<T>(sel)];
    const box = (e: Element, host: Element): Box => { const r = e.getBoundingClientRect(), b = host.getBoundingClientRect(), x = b.left + host.clientLeft, y = b.top + host.clientTop; return { l: r.left - x, t: r.top - y, r: r.right - x, b: r.bottom - y, w: r.width, h: r.height }; };

    let vh = innerHeight, P62 = vh * 0.62, phone = innerWidth < 1024, CL = 0, CR = 0, xR = 0, xL = 0;
    const scenes: Scene[] = [];
    const side = new Map<Scene, number>();
    const add = (sc: Omit<Scene, 'top' | 'P' | 'extB' | 'exitX'>) => { const x = { ...sc, top: 0, P: 0, extB: 0, exitX: 0 }; scenes.push(x); return x; };
    /** 붙는 장면의 선 길이: 붙어 있는 동안은 knots, 풀린 뒤에는 (x0 높이에서 시작하는) 마지막 세로 구간을 스크롤 그대로 */
    const pinLen = (sc: Scene, k: Knot[], vy: number, Lx: number, yx: number) => (vy <= k[k.length - 1][0] ? knots(k, vy) : Math.max(Lx, Lx + (vy - sc.P - yx)));
    const flowScene = (key: string, host: HTMLElement, light: boolean, want: () => number) => {
      let an: { len: number; y: number }[] = [];
      const sc = add({
        key, host, sec: host, line: new Line(host, light), pinned: false, measure: () => {},
        build: (xE) => {
          const x = want();
          sc.line.set([xE, 0], Math.abs(x - xE) < 1 ? [[xE, sc.extB]] : [[xE, 28, 16], [x, 28, 16], [x, sc.extB]]);
          sc.exitX = x; an = sc.line.anchors(0);
        },
        frame: (vy) => sc.line.draw(reduced ? sc.line.L : lenAt(an, vy)),
      });
      return sc;
    };

    // ── 01 첫 화면: 첫 & 등장(amp-enter.ts) 뒤 주된 가닥 끝에서 선이 나간다
    const heroSec = q('[data-sec="hero"]')!, heroAmp = q<SVGSVGElement>('[data-amp="hero"]');
    const enters = [...(heroAmp?.querySelectorAll<SVGPathElement>('[data-line]') ?? [])].map((p) => ({ p, len: 0, ...enterPlan(p.dataset.group ?? '', Number(p.dataset.line?.slice(-1))) }));
    const lead = enters.find((x) => x.p.dataset.line === 'diagonal-line-1'), main = enters.find((x) => x.main);
    let entering = html.dataset.ampIn === 'on' && !reduced && !!lead && !!main && scrollY < 2 && !location.hash;
    if (!entering) delete html.dataset.ampIn;
    const bands = entering && heroAmp && lead ? [...heroAmp.querySelectorAll<SVGPathElement>('mask path')].map((p) => bandOf(p, lead.p)) : [];
    let eT = entering ? 0 : ENTER_END, cap = entering ? 0 : Infinity, capK = 0, heroBox: Box | null = null, enterTip: { x: number; y: number } | null = null;
    let heroAn: { len: number; y: number }[] = [], minLen = 0;
    const hero = add({
      key: 'hero', host: heroSec, sec: heroSec, line: new Line(heroSec), pinned: false, measure: () => {},
      build: () => {
        if (!heroAmp) return;
        const a = box(heroAmp, heroSec); heroBox = a;
        for (const x of enters) x.len = x.p.getTotalLength() * (a.h / AMP_H);
        const ha = a.h / AMP_H, hx = a.l + AMP_TIP.x * ha, hy = a.t + AMP_TIP.y * ha;
        hero.line.set([hx, hy], [[xR, hy, Math.max(4, Math.min(40, xR - hx))], [xR, hero.extB]]);
        hero.exitX = xR;
        heroAn = hero.line.anchors(hy - vh * 0.35);
        // 맨 위에서도 선은 & 발끝에서 나와 오른쪽 길로 꺾여 내려가는 데까지는 보인다 — 긴 선으로 이어진다는 것이 읽히게
        minLen = 0;
        for (let l = 0; l < Math.min(hero.line.L, 800); l += 4) if (hero.line.ink.getPointAtLength(l).y >= hy + 28) { minLen = l; break; }
      },
      frame: (vy) => hero.line.draw(reduced ? hero.line.L : Math.min(Math.max(lenAt(heroAn, vy), minLen), cap)),
    });
    const want = (vy: number) => Math.max(lenAt(heroAn, vy), minLen);

    // ── 02 큰 글자: 선이 02 머리 선 오른쪽 끝을 지나면 문장이 올라오고(e), 「불편한지」 밑(글자와 28px)을 오른쪽에서 왼쪽으로 지나는 만큼 초점이 잡힌다(f).
    //    짧게 머문 뒤 풀려, 아래에서 다음 장면(문제 파악)이 올라온다
    const stepsSc = q('[data-scene="steps"]')!;
    const focusSc = q('[data-scene="focus"]')!, focusSt = q('[data-stage]', focusSc)!, focusH = q('[data-focus]', focusSc)!, big = q('[data-mark="find"]', focusSc)!;
    {
      let ruleY = 0, wb = 0, k: Knot[] = [], Lx = 0, yx = 0, Lw0 = 0, Lw1 = 0, V0 = 0, bigL = 0, bigR = 0;
      const R1 = 48;
      const sc = add({
        key: 'focus', host: focusSt, sec: focusSc, line: new Line(focusSt), pinned: true,
        measure: () => {
          focusH.style.setProperty('--e', '1');
          ruleY = box(q('.' + s.sh, focusSt)!, focusSt).t;
          const w = box(big, focusSt); wb = w.b + 28; bigL = w.l; bigR = w.r;
          V0 = wb - R1;
          sc.P = Math.max(0, V0 + vh * 0.72 - P62);
          // 다음 장면(세 단계)은 이 무대 아래 빈 자리와 겹쳐 올라온다 — 선이 꺾여 내려가는 곳 아래 40px 부터
          stepsSc.style.setProperty('--ov', `${f(Math.max(0, vh - (wb + R1 + 40)))}px`);
        },
        build: (xE) => {
          sc.line.set([xE, 0], [[xE, wb, R1], [xL, wb, R1], [xL, sc.extB]]);
          const h0 = sc.line.at[1] - ((xE - R1) - (xL + R1)), at = (x: number) => h0 + (xE - R1 - x);
          Lw0 = at(bigR + 6); Lw1 = at(bigL - 2); yx = wb + R1; Lx = sc.line.L - (sc.extB - yx);
          k = [[0, 0], [V0, sc.line.at[0]], [V0 + vh * 0.1, Lw0], [V0 + vh * 0.38, Lw1], [V0 + vh * 0.62, Lw1], [V0 + vh * 0.72, Lx]];
          sc.exitX = xL;
        },
        frame: (vy) => {
          const len = reduced ? sc.line.L : pinLen(sc, k, vy, Lx, yx);
          sc.line.draw(len);
          focusH.style.setProperty('--e', f(reduced ? 1 : clamp((vy - ruleY) / Math.max(1, P62 - ruleY))));
          focusH.style.setProperty('--f', (reduced ? 1 : clamp((len - Lw0) / Math.max(1, Lw1 - Lw0))).toFixed(3));
        },
      });
    }

    // ── 세 단계: 왼쪽 번호 줄 옆으로 선이 내려와, 지금 단계 번호에 머문다. 다음 번호로 옮겨 가는 순간 단계가 바뀐다
    //    (지금 단계의 제목·설명은 가운데, 다음 단계 제목은 아래에 흐리게, 지난 단계는 위로 빠진다)
    const stepsSt = q('[data-stage]', stepsSc)!, rows = qa('[data-step]', stepsSc), nums = qa('[data-tn]', stepsSc);
    {
      let ys = [0, 0, 0], act = -2, xE0 = 0;
      const sc = add({
        key: 'steps', host: stepsSt, sec: stepsSc, line: new Line(stepsSt), pinned: true,
        measure: () => {
          ys = (nums.length === 3 && !reduced ? nums : rows.map((r) => q('h3', r)!)).map((e) => { const b = box(e, stepsSt); return (b.t + b.b) / 2; });
          const base = Math.max(ys[0], P62);
          sc.P = Math.max(0, base + vh * 1.06 - P62);
        },
        build: (xE) => { xE0 = xE; sc.line.set([xE, 0], Math.abs(xE - xL) < 1 ? [[xL, sc.extB]] : [[xE, 20, 12], [xL, 20, 12], [xL, sc.extB]]); sc.exitX = xL; },
        frame: (vy) => {
          void xE0;
          const [y1, y2, y3] = ys, base = Math.max(y1, P62), v = (i: number) => base + vh * i;
          const k: Knot[] = [[0, 0], [y1, y1], [v(0.3), y1], [v(0.38), y2], [v(0.68), y2], [v(0.76), y3], [v(1.06), y3]];
          const len = reduced ? sc.line.L : vy <= k[k.length - 1][0] ? knots(k, vy) : Math.max(y3, vy - sc.P);
          sc.line.draw(len);
          // 문제 파악은 장면이 아래에서 들어오기 시작할 때부터 앞에 선다(큰 글자 장면 끝에서 바로 이어 읽히게)
          const a = reduced ? -1 : len >= y3 - 2 ? 2 : len >= y2 - 2 ? 1 : vy > 0 ? 0 : -1;
          if (a === act) return;
          act = a;
          rows.forEach((r, i) => { if (reduced) delete r.dataset.st; else r.dataset.st = i < a ? 'past' : i === a ? 'on' : i === a + 1 ? 'next' : 'later'; });
          nums.forEach((n, i) => n.toggleAttribute('data-on', i === a));
        },
      });
    }

    // ── 03 할 수 있는 일: 왼쪽 길로 조용히 지난다(서비스 이름 채우기가 이 구간의 변화)
    const canSec = q('[data-sec="can"]')!;
    flowScene('can', canSec, false, () => xL);

    // ── 04 명암 전환: 선 끝 높이까지 남색이 덮인다(같은 한 동작). 제목은 위쪽이라 일찍 읽히고, 아래에 첫 작업 화면 윗부분이 보인다
    const darkSc = q('[data-scene="dark"]')!, darkSt = q('[data-stage]', darkSc)!;
    let edge = 0;
    {
      const sc = add({
        key: 'dark', host: darkSt, sec: darkSc, line: new Line(darkSt, true), pinned: true,
        measure: () => { sc.P = vh * 0.62; },
        build: (xE) => { sc.line.set([xE, 0], [[xE, sc.extB]]); sc.exitX = xE; },
        frame: (vy) => {
          const len = reduced ? sc.line.L : vy <= P62 + sc.P ? clamp(vy, 0, vh) : Math.max(vh, vy - sc.P);
          sc.line.draw(len);
          edge = reduced ? vh : clamp(len, 0, vh);
          darkSt.style.setProperty('--edge', `${f(edge)}px`);
        },
      });
    }

    /** 그림 뒤로 지나는 선 — 그림 바깥 가장자리에서 멈췄다가(그림이 움직이는 동안) 그림 아래에서 다시 나온다.
     *  F: 그림 묶음(단추·캡션 포함) 상자. 들어오는 x 가 그림 폭 안이면 위에서 곧게, 밖이면 옆에서 가로로 들어간다. xo: 아래로 나오는 x */
    const through = (sc: Scene, xE: number, F: Box, xo: number) => {
      // 폰: 글이 그림 위에 오고 여백이 좁다 — 선은 오른쪽 여백 길로만 지난다(그림·글을 지나지 않는다)
      if (phone) { sc.line.set([xE, 0], Math.abs(xE - xR) < 1 ? [[xR, sc.extB]] : [[xE, 24, 12], [xR, 24, 12], [xR, sc.extB]]); sc.line.hide([]); return { aIn: F.t, aOut: F.b, x: xR }; }
      const inside = xE > F.l + 20 && xE < F.r - 20;
      if (inside) { sc.line.set([xE, 0], [[xE, sc.extB]]); sc.line.hide([F]); return { aIn: F.t, aOut: F.b, x: xE }; }
      const yIn = F.t + F.h * 0.38, edgeX = xE < F.l ? F.l : F.r;
      sc.line.set([xE, 0], [[xE, yIn, 28], [xo, yIn, 28], [xo, sc.extB]]);
      sc.line.hide([F]);
      return { aIn: sc.line.at[0] + 28 * 1.12 + Math.abs(edgeX - xE) - 28, aOut: sc.line.L - (sc.extB - F.b), x: xo };
    };
    /** 그림 장면 선 길이: 붙기 전에는 가장자리까지, 붙어 있는 동안은 가장자리에 머물고, 풀린 뒤 그림 아래로 나온다 */
    const behindLen = (sc: Scene, vy: number, aIn: number, aOut: number, Fb: number) =>
      vy < P62 ? Math.min(vy, aIn) : vy <= P62 + sc.P ? aIn : Math.max(aIn, aOut + (vy - sc.P - Fb));

    // ── 첫 작업(요청 처리): 그림이 오른쪽 글 옆 작은 자리에서 왼쪽으로 커진다(글은 제자리). 선은 그 사이 그림 뒤에 있다
    const growSc = q('[data-scene="grow"]');
    if (growSc) {
      const st = q('[data-stage]', growSc)!, pic = q('[data-grow]', growSc)!, slot = q('[data-slot]', growSc)!;
      let F1: Box | null = null, s0 = 1, xE0 = 0;
      const sc = add({
        key: 'grow', host: st, sec: growSc, line: new Line(st, true), pinned: true,
        measure: () => {
          pic.style.transform = ''; pic.style.removeProperty('--pw');
          if (!sc.pinned) return;
          const cols = box(pic, st), H = vh - box(q('.' + s.growIn, st)!, st).t - 28;
          pic.style.setProperty('--pw', `${f(Math.min(cols.w, (H - 100) * 1.6))}px`);
          F1 = box(pic, st); s0 = Math.min(1, box(slot, st).w / F1.w);
          sc.P = vh * 0.8;
        },
        build: (xE) => { xE0 = xE; },
        frame: (vy) => {
          if (!sc.pinned || reduced || !F1) {
            const F = box(pic, st), r = through(sc, xE0, F, F.l + F.w * 0.8); sc.exitX = r.x;
            sc.line.draw(reduced ? sc.line.L : lenAt(sc.line.anchors(0), vy));
            return;
          }
          const g = clamp((vy - P62) / (vh * 0.45)), k = s0 + (1 - s0) * g;
          pic.style.transform = g >= 1 ? '' : `scale(${k.toFixed(4)})`;
          const F = box(pic, st), r = through(sc, xE0, F, F1.l + F1.w * 0.8);
          sc.exitX = r.x;
          sc.line.draw(behindLen(sc, vy, r.aIn, r.aOut, F1.b));
        },
      });
    }

    // ── 문제 은행: 두 폰 화면이 서로 다른 빠르기로 올라오고, 선은 두 화면 사이로 지난다(폰에서는 사이를 지난 뒤 오른쪽 길로)
    const riseSc = q('[data-scene="rise"]');
    if (riseSc) {
      const devs = qa('[data-dev]', riseSc);
      const sc = flowScene('rise', riseSc, true, () => { const a = box(devs[0], riseSc), b = box(devs[1], riseSc); return (a.r + b.l) / 2; });
      const bd = sc.build;
      sc.build = (xE) => {
        if (!phone) return bd(xE);
        const a = box(devs[0], riseSc), b = box(devs[1], riseSc), gx = (a.r + b.l) / 2, top = Math.min(a.t, b.t) - 16, bot = Math.max(a.b, b.b) + 12;
        sc.line.set([xE, 0], [[xE, top, 12], [gx, top, 12], [gx, bot, 12], [xR, bot, 12], [xR, sc.extB]]);
        sc.exitX = xR;
      };
      const fr = sc.frame;
      sc.frame = (vy) => { fr(vy); const r = riseSc.getBoundingClientRect(); riseSc.style.setProperty('--r', (reduced ? 0.5 : clamp((vh - r.top) / (vh + r.height))).toFixed(3)); };
    }

    // ── 병원: 스크롤이 전·후 비교의 가운데 선을 옮긴다(손으로 옮기면 그때부터는 손이 정한다). 그동안 잇는 선은 비교 뒤에 있다
    const sweepSc = q('[data-scene="sweep"]');
    if (sweepSc) {
      const st = q('[data-stage]', sweepSc)!, ba = q('[data-ba]', sweepSc)!, wrap = q('.' + s.baWrap, sweepSc)!, range = q<HTMLInputElement>('input[type="range"]', ba)!, qaEl = q('.' + s.pairQa, sweepSc);
      let xE0 = 0;
      const X0 = 85, X1 = 15;
      const sc = add({
        key: 'sweep', host: st, sec: sweepSc, line: new Line(st, true), pinned: true,
        measure: () => {
          wrap.style.removeProperty('--pw');
          if (!sc.pinned) return;
          const cols = box(wrap, st), H = vh - box(q('.' + s.pairIn, st)!, st).t - 28 - (qaEl?.offsetHeight ?? 0) - 20;
          wrap.style.setProperty('--pw', `${f(Math.min(cols.w, (H - 50) * 1.6))}px`);
          sc.P = vh * 0.75;
        },
        build: (xE) => { xE0 = xE; },
        frame: (vy) => {
          const drive = sc.pinned && !reduced && !('touched' in ba.dataset);
          if (drive) { const X = Math.round(lerp(X0, X1, clamp((vy - P62 - vh * 0.05) / (vh * 0.5))) * 10) / 10; ba.style.setProperty('--x', `${X}%`); range.value = String(Math.round(X)); }
          // 비교와 그 아래 문제·판단 글을 한 덩어리로 — 선은 그 뒤로 지나 아래에서 나온다
          const w0 = box(wrap, st), q0 = qaEl && qaEl.offsetHeight ? box(qaEl, st) : w0;
          const F: Box = { l: Math.min(w0.l, q0.l), t: w0.t, r: Math.max(w0.r, q0.r), b: Math.max(w0.b, q0.b), w: 0, h: 0 }; F.w = F.r - F.l; F.h = F.b - F.t;
          const r = through(sc, xE0, F, F.l + F.w * 0.5);
          sc.exitX = r.x;
          sc.line.draw(reduced ? sc.line.L : !sc.pinned ? lenAt(sc.line.anchors(0), vy) : behindLen(sc, vy, r.aIn, r.aOut, F.b));
        },
      });
      range.addEventListener('input', () => wake());
    }

    // ── 근무표: 원본의 표시줄 자리가 그림 위로 크게 열린다. 그동안 잇는 선은 그림 뒤에 있다
    const zoomSc = q('[data-scene="zoom"]');
    if (zoomSc) {
      const st = q('[data-stage]', zoomSc)!, fullPic = q('.' + s.fullPic, zoomSc)!, fd = q('[data-zoomed]', zoomSc);
      const crop = (fd?.querySelector<HTMLElement>('[data-zoom-crop]')?.dataset.zoomCrop ?? '0,0,40,21').split(',').map(Number);
      let xE0 = 0, T0: [number, number, number] = [0, 0, 1], T1: [number, number] = [0, 0], ok = false;
      const sc = add({
        key: 'zoom', host: st, sec: zoomSc, line: new Line(st, true), pinned: true,
        measure: () => {
          fullPic.style.removeProperty('--pw'); ok = false;
          if (fd) { fd.style.transform = ''; fd.style.removeProperty('--fw'); }
          if (!sc.pinned) return;
          const cols = box(fullPic, st), H = vh - box(q('.' + s.zoomIn, st)!, st).t - 28;
          fullPic.style.setProperty('--pw', `${f(Math.min(cols.w, (H - 100) * (2789 / 1416)))}px`);
          const I = box(q('.' + s.frame, fullPic)!, st);
          const R = { l: I.l + (I.w * crop[0]) / 100, t: I.t + (I.h * crop[1]) / 100, w: (I.w * crop[2]) / 100 };
          if (fd) {
            const fw = Math.min(I.w * 0.92, 1040); fd.style.setProperty('--fw', `${f(fw)}px`);
            const fh = fd.offsetHeight, pad = 18, s0 = R.w / (fw - pad * 2), zo = box(q('.' + s.zoomIn, st)!, st);   // 확대 칸은 zoomIn 기준으로 놓인다
            T0 = [R.l - pad * s0 - zo.l, R.t - pad * s0 - zo.t, s0]; T1 = [I.l + (I.w - fw) / 2 - zo.l, I.b - fh - 20 - zo.t];
          }
          ok = true;
          sc.P = vh * 0.75;
        },
        build: (xE) => { xE0 = xE; },
        frame: (vy) => {
          const F = box(fullPic, st), r = through(sc, xE0, F, F.l + F.w * 0.8);
          sc.exitX = r.x;
          if (!sc.pinned || reduced || !ok) { sc.line.draw(reduced ? sc.line.L : lenAt(sc.line.anchors(0), vy)); return; }
          sc.line.draw(behindLen(sc, vy, r.aIn, r.aOut, F.b));
          const z = clamp((vy - P62 - vh * 0.1) / (vh * 0.35));
          if (fd) {
            const kz = lerp(T0[2], 1, z);
            fd.style.transform = `translate(${f(lerp(T0[0], T1[0], z))}px, ${f(lerp(T0[1], T1[1], z))}px) scale(${kz.toFixed(4)})`;
            fd.style.setProperty('--zo', z > 0.02 ? '1' : '0'); fd.style.setProperty('--z', z.toFixed(3));
            fd.toggleAttribute('data-open', z >= 0.99);
          }
        },
      });
    }

    // ── 「모든 작업」: 구분선 없이, 위 여백에서 오른쪽 길로 옮겨 내려간다
    const allHost = q('[data-all]')!;
    {
      let an: { len: number; y: number }[] = [];
      const sc = add({
        key: 'all', host: allHost, sec: allHost, line: new Line(allHost, true), pinned: false, measure: () => {},
        build: (xE) => {
          sc.line.set([xE, 0], Math.abs(xE - xR) < 1 ? [[xR, sc.extB]] : [[xE, 40, 32], [xR, 40, 32], [xR, sc.extB]]);
          sc.exitX = xR; an = sc.line.anchors(0);
        },
        frame: (vy) => sc.line.draw(reduced ? sc.line.L : lenAt(an, vy)),
      });
    }

    // ── 05 문의: 마지막 & 의 주된 가닥 끝으로 가로로 들어가, 남은 스크롤로 가닥을 차례로 그린다(첫 & 와 같은 형태·굵기)
    const contactSec = q('[data-sec="contact"]')!, contactAmp = q<SVGSVGElement>('[data-amp="contact"]');
    const order = (id: string, g: string): { a: number; b: number; rev: boolean } =>
      id === AMP_MAIN.diag ? { a: 0, b: 0.3, rev: true } : id === AMP_MAIN.loops ? { a: 0.3, b: 0.55, rev: false }
        : g === 'diag' ? { a: 0.4, b: 0.75, rev: true } : g === 'loops' ? { a: 0.55, b: 0.85, rev: false } : { a: 0.72, b: 1, rev: false };
    const strands = [...(contactAmp?.querySelectorAll<SVGPathElement>('[data-line]') ?? [])].map((p) => ({ p, len: 0, ...order(p.dataset.line ?? '', p.dataset.group ?? '') }));
    const mainD = strands.find((x) => x.p.dataset.line === AMP_MAIN.diag), mainL = strands.find((x) => x.p.dataset.line === AMP_MAIN.loops);
    let ampBox: Box | null = null, kAmp = 0, contactTip: { x: number; y: number } | null = null;
    {
      let an: { len: number; y: number }[] = [], aIn = 0, maxV = 0;
      const sc = add({
        key: 'contact', host: contactSec, sec: contactSec, line: new Line(contactSec, true), pinned: false, measure: () => {},
        build: (xE) => {
          if (!contactAmp) return;
          const c = box(contactAmp, contactSec); ampBox = c;
          const hc = c.h / AMP_H, ax = c.l + AMP_TIP.x * hc, ay = c.t + AMP_TIP.y * hc;
          sc.line.set([xE, 0], [[xE, ay, Math.max(4, xE - ax)], [ax, ay]]);
          for (const x of strands) x.len = x.p.getTotalLength() * hc;
          an = sc.line.anchors(0).map((p) => ({ ...p }));   // 아래에서 줄여 쓰므로 사본
          maxV = html.scrollHeight - vh + P62 - sc.top - 8;
          const end = Math.min(an[an.length - 1].y, maxV - Math.min(360, vh * 0.4));
          const y0 = an[0].y, lastY = an[an.length - 1].y;
          if (lastY > end && end > y0) for (const p of an) p.y = y0 + ((p.y - y0) * (end - y0)) / (lastY - y0);
          aIn = an[an.length - 1].y;
        },
        frame: (vy) => {
          sc.line.draw(reduced ? sc.line.L : lenAt(an, vy));
          const k = reduced ? 1 : clamp((vy - aIn) / Math.max(1, maxV - aIn)); kAmp = k;
          for (const x of strands) dash(x.p, x.len, clamp((k - x.a) / (x.b - x.a)), x.rev ? 'rev' : 'fwd');
          contactAmp?.toggleAttribute('data-drawn', k >= 0.995);
          contactTip = null;
          if (k > 0 && k < 0.55 && mainD && mainL && ampBox) {
            const sca = ampBox.h / AMP_H, x = k < 0.3 ? mainD : mainL, t = clamp((k - x.a) / (x.b - x.a)), L0 = x.len / sca;
            const p = x.p.getPointAtLength(x.rev ? L0 * (1 - t) : L0 * t);
            contactTip = { x: ampBox.l + (p.x - AMP_VB[0]) * sca, y: ampBox.t + (p.y - AMP_VB[1]) * sca };
          }
        },
      });
    }

    // ── 머리글 낱말 채우기(할 수 있는 일 · 문의)
    const fills = qa('[data-fill]').map((h) => ({ h, ws: qa('[data-w]', h), n: -1 }));
    const words = () => {
      for (const x of fills) {
        const r = x.h.getBoundingClientRect(), k = reduced ? 1 : clamp((vh * 0.92 - r.top) / (vh * 0.42)), n = Math.floor(k * x.ws.length + 0.0001);
        if (n === x.n) continue;
        x.n = n; x.ws.forEach((w, i) => w.toggleAttribute('data-on', i < n));
      }
    };
    /** 헤더 밑이 남색이면 헤더도 남색 — 명암 전환 무대에서는 남색이 헤더까지 내려왔을 때부터 */
    const header = () => {
      const h = (document.querySelector('header')?.getBoundingClientRect().height ?? 64) / 2;
      const work = q('[data-sec="work"]')!.getBoundingClientRect(), ds = darkSc.getBoundingClientRect(), st = darkSt.getBoundingClientRect();
      const dark = h >= work.top && (h >= ds.bottom || (h >= st.top && h < st.top + edge));
      html.toggleAttribute('data-hdr-dark', dark || contactSec.getBoundingClientRect().top <= h);
    };

    let ready = false, built = { w: 0, h: 0 }, hashPending = !!location.hash;
    const userMoved = () => { hashPending = false; };
    for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, userMoved, { passive: true, once: true });
    const build = () => {
      vh = innerHeight; P62 = vh * 0.62; phone = innerWidth < 1024;
      built = { w: innerWidth, h: innerHeight };
      root.style.setProperty('--vh', `${vh}px`);
      const wr = q('.' + s.wrap, heroSec)!, cs = getComputedStyle(wr), rb = root.getBoundingClientRect(), wb = wr.getBoundingClientRect();
      CL = wb.left - rb.left + parseFloat(cs.paddingLeft); CR = wb.right - rb.left - parseFloat(cs.paddingRight);
      // 글·그림과 선 사이 — 데스크톱은 40px(여백이 좁으면 여백의 반)
      xR = CR + (phone ? 8 : Math.min(40, (root.clientWidth - CR) / 2)); xL = CL - (phone ? 9 : Math.min(40, CL / 2));
      // 붙는 장면 정하기 → 장면 안 배치를 재고 붙는 길이를 정한 뒤 → 페이지 위치 → 선
      for (const sc of scenes) {
        if (sc.sec === sc.host && !sc.host.matches('[data-stage]')) continue;
        sc.pinned = !reduced && (!phone || ['focus', 'steps', 'dark'].includes(sc.key));
        sc.sec.toggleAttribute('data-pin', sc.pinned);
        if (!sc.pinned) sc.sec.style.removeProperty('--pin');
      }
      for (const sc of scenes) { sc.measure(); if (sc.pinned) sc.sec.style.setProperty('--pin', `${f(sc.P)}px`); }
      // 단계 장면은 머리 위치를 재야 붙는 길이를 안다 — 한 번 그려 보고 다시 정한다
      for (const sc of scenes) sc.top = sc.sec.getBoundingClientRect().top + scrollY;
      scenes.forEach((sc, i) => {
        const next = scenes[i + 1], hostTop = sc.pinned ? sc.top + sc.P : sc.host.getBoundingClientRect().top + scrollY;
        sc.extB = next ? next.sec.getBoundingClientRect().top + scrollY - hostTop : sc.host.getBoundingClientRect().height;
      });
      let x = xR;
      for (const sc of scenes) { sc.build(x); sc.frame(-1); x = sc.exitX; }
      const stepsS = scenes.find((sc) => sc.key === 'steps')!;
      if (stepsS.pinned) {
        stepsS.sec.style.setProperty('--pin', `${f(stepsS.P)}px`);
        for (const sc of scenes) sc.top = sc.sec.getBoundingClientRect().top + scrollY;
        scenes.forEach((sc, i) => {
          const next = scenes[i + 1], hostTop = sc.pinned ? sc.top + sc.P : sc.host.getBoundingClientRect().top + scrollY;
          sc.extB = next ? next.sec.getBoundingClientRect().top + scrollY - hostTop : sc.host.getBoundingClientRect().height;
        });
        x = xR;
        for (const sc of scenes) { sc.build(x); x = sc.exitX; }
      }
      // 주소에 #이 있으면, 장면 길이가 정해져 페이지가 길어진 뒤 그 자리로 다시 맞춘다(사용자가 먼저 움직였으면 그대로)
      if (hashPending) { const tg = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (tg) { const y = tg.getBoundingClientRect().top + scrollY; const l = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis; if (l) l.scrollTo(y, { immediate: true }); else scrollTo(0, y); } }
      yS = -1; side.clear();
      paint(scrollY);
    };

    /** sy: (부드럽게 따라간) 스크롤 위치 */
    const paint = (sy: number) => {
      for (const sc of scenes) {
        const vy = sy + P62 - sc.top;
        if (!reduced && sc.key !== 'hero' && sc.key !== 'contact') {
          const r = sc.sec.getBoundingClientRect();
          if (r.bottom < -vh || r.top > vh * 2) { const sd = r.top > 0 ? -1 : 1; if (side.get(sc) !== sd) { side.set(sc, sd); sc.frame(sd < 0 ? -1 : 1e7); } continue; }
          side.set(sc, 0);
        }
        sc.frame(vy);
      }
      // 선 끝 점: 첫 & 주된 가닥이 그려지는 동안은 그 머리, 마지막 & 주된 가닥을 그리는 동안은 그 가닥 위, 그 밖에는 지금 그려지는 선의 끝
      let head: Scene | null = null;
      for (const sc of scenes) { sc.line.tip.removeAttribute('data-on'); if (sc.line.len > 1) head = sc; }
      if (reduced) return;
      const show = (sc: Scene, p: { x: number; y: number }) => { sc.line.tip.setAttribute('cx', f(p.x)); sc.line.tip.setAttribute('cy', f(p.y)); sc.line.tip.setAttribute('data-on', ''); };
      if (enterTip) show(hero, enterTip);
      else if (contactTip) show(scenes[scenes.length - 1], contactTip);
      else if (head && head.line.len < head.line.L - 1 && kAmp <= 0) show(head, head.line.ink.getPointAtLength(head.line.len));
    };

    let raf = 0, yS = -1;
    const tick = () => {
      raf = 0;
      if (!ready) return;
      header(); words();
      const target = scrollY;
      // 크게 건너뛰었으면(링크·새로고침 복원·빠른 끌기) 따라가는 장면 없이 바로 그 자리 상태로
      if (yS < 0 || reduced || Math.abs(target - yS) > vh * 1.5) yS = target;
      else yS += (target - yS) * 0.22;
      paint(yS);
      if (Math.abs(target - yS) > 0.5) raf = requestAnimationFrame(tick);
    };
    function wake() { if (!raf) raf = requestAnimationFrame(tick); }

    // ── 첫 & 등장 고리 — 스크롤이 들어오면 남은 & 를 세 배 빠르게 마치고, 크게 건너뛰면 바로 완성. 다 그리면 페이지 선이 주된 가닥 끝 속도로 출발한다
    const paintEnter = (et: number) => {
      let fl = 0;
      enterTip = null;
      for (const x of enters) {
        const e = enterEase(x, clamp((et - x.a) / (x.b - x.a)));
        dash(x.p, x.len, et >= ENTER_END ? 1 : e, x.mode, x.s, et < ENTER_END);
        if (x === lead) fl = e;
        if (x.main && e > 0 && e < 1 && heroBox) {
          const L0 = x.p.getTotalLength(), p = x.p.getPointAtLength(L0 * e), sc = heroBox.h / AMP_H;
          enterTip = { x: heroBox.l + (p.x - AMP_VB[0]) * sc, y: heroBox.t + (p.y - AMP_VB[1]) * sc };
        }
      }
      for (const b of bands) band(b, et >= ENTER_END ? 1 : fl, et < ENTER_END);
      if (et >= ENTER_END) { enterTip = null; delete html.dataset.ampIn; }
    };
    let eRaf = 0, eLast = 0, eFast = false, sy0 = scrollY;
    const enterTick = (now: number) => {
      const dt = Math.min(64, eLast ? now - eLast : 16); eLast = now;
      if (Math.abs(scrollY - sy0) > innerHeight * 1.5) { eT = ENTER_END; cap = Infinity; }
      else if (Math.abs(scrollY - sy0) > 0.5) eFast = true;
      sy0 = scrollY;
      if (eT < ENTER_END || bands.length) {
        if (eT < ENTER_END) eT = Math.min(ENTER_END, eT + dt * (eFast ? 3 : 1));
        paintEnter(eT);
        if (eT >= ENTER_END) bands.length = 0;
      } else if (cap < Infinity) {
        const target = want((yS < 0 ? scrollY : yS) + P62 - hero.top);
        if (!capK && main) capK = clamp((MAIN_END_SPEED * main.len) / (main.b - main.a) / Math.max(1, target - cap), 0.0025, 0.012);
        cap += Math.max(0.06, (target - cap) * capK) * dt;
        if (cap >= target - 0.5) cap = Infinity;
      }
      if (ready) paint(yS < 0 ? scrollY : yS);
      if (eT < ENTER_END || cap < Infinity) eRaf = requestAnimationFrame(enterTick);
      else eRaf = 0;
    };

    const begin = () => {
      ready = true; build(); wake();
      if (entering) { (window as unknown as { __ampIn?: boolean }).__ampIn = true; paintEnter(0); eRaf = requestAnimationFrame(enterTick); }
    };
    let rz = 0;
    const rebuild = () => { clearTimeout(rz); rz = window.setTimeout(() => { if (ready) build(); wake(); }, 150); };
    // 폰 주소창이 들고 나며 높이만 조금 바뀌는 것은 다시 짜지 않는다(장면 길이가 흔들리지 않게)
    const onResize = () => { if (innerWidth !== built.w || Math.abs(innerHeight - built.h) > 120) rebuild(); };
    addEventListener('resize', onResize);
    addEventListener('scroll', wake, { passive: true });
    addEventListener('load', rebuild);
    document.fonts?.ready.then(rebuild);
    begin();
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(eRaf); clearTimeout(rz);
      removeEventListener('resize', onResize); removeEventListener('scroll', wake); removeEventListener('load', rebuild);
      if (eT < ENTER_END) { eT = ENTER_END; paintEnter(eT); }
      for (const sc of scenes) { sc.line.svg.remove(); sc.sec.removeAttribute('data-pin'); }
      delete root.dataset.motion;
      html.removeAttribute('data-hdr-dark');
    };
  }, []);

  return null;
}
