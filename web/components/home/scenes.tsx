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
 *  첫 & 발끝 → 02 머리 선 끝에 닿으면 큰 문장이 올라오고, 「불편한지」 밑을 지나며 초점이 잡힌다 → 단계 머리에 닿을 때마다 그 단계가 앞으로 →
 *  남색이 선을 따라 내려와 작업이 열린다 → 첫 작업 그림이 화면 대부분으로 커지며 선은 그 오른쪽 가장자리를 따른다 → 두 폰 화면 사이로 →
 *  전·후 비교의 가운데 선이 되어 스크롤로 옮겨진다 → 근무표의 표시줄 자리를 짚고 그 자리가 크게 열린다 → 「모든 작업」 구분선을 이어받아 → 마지막 & 를 완성.
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

    // ── 02 큰 글자: 선이 02 머리 선 오른쪽 끝을 지나면 문장이 올라오고(e), 「불편한지」 밑을 오른쪽에서 왼쪽으로 지나는 만큼 초점이 잡힌다(f)
    const focusSc = q('[data-scene="focus"]')!, focusSt = q('[data-stage]', focusSc)!, focusH = q('[data-focus]', focusSc)!, big = q('[data-mark="find"]', focusSc)!;
    {
      let ruleY = 0, wb = 0, k: Knot[] = [], Lx = 0, yx = 0, Lw0 = 0, Lw1 = 0, V0 = 0, bigL = 0, bigR = 0;
      const sc = add({
        key: 'focus', host: focusSt, sec: focusSc, line: new Line(focusSt), pinned: true,
        measure: () => {
          focusH.style.setProperty('--e', '1');
          ruleY = box(q('.' + s.sh, focusSt)!, focusSt).t;
          const w = box(big, focusSt); wb = w.b + 6; bigL = w.l; bigR = w.r;
          V0 = wb - 36;
          k = [[0, 0], [V0, V0], [V0 + vh * 0.14, 0], [V0 + vh * 0.52, 0], [V0 + vh * 0.95, 0], [V0 + vh * 1.07, 0]];
          sc.P = Math.max(0, k[5][0] - P62);
        },
        build: (xE) => {
          sc.line.set([xE, 0], [[xE, wb, 36], [xL, wb, 28], [xL, sc.extB]]);
          const h0 = sc.line.at[1] - ((xE - 36) - (xL + 28)), at = (x: number) => h0 + (xE - 36 - x);
          Lw0 = at(bigR + 6); Lw1 = at(bigL - 2); yx = wb + 28; Lx = sc.line.L - (sc.extB - yx);
          k = [[0, 0], [V0, sc.line.at[0]], [V0 + vh * 0.14, Lw0], [V0 + vh * 0.52, Lw1], [V0 + vh * 0.95, Lw1], [V0 + vh * 1.07, Lx]];
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

    // ── 세 단계: 왼쪽 길의 선 끝이 단계 머리에 닿을 때마다 그 단계가 앞으로(1 큰 글자 · 2 자리 이동). 셋째 줄 머리 선을 따라 옆 빈 칸으로 건너가 옛 경로를 곧게 다시 긋는다(3)
    const stepsSc = q('[data-scene="steps"]')!, stepsSt = q('[data-stage]', stepsSc)!, rows = qa('[data-step]', stepsSc);
    {
      const old = document.createElementNS(NS, 'path'); old.setAttribute('class', s.threadOld);
      let k: Knot[] = [], Lx = 0, yx = 0, lens = [0, 0, 0], Lfix0 = 0, Lfix1 = 0, act = -2;   // -2: 아직 한 번도 정하지 않음
      const sc = add({
        key: 'steps', host: stepsSt, sec: stepsSc, line: new Line(stepsSt), pinned: true,
        measure: () => { sc.P = 0; },
        build: () => {},
        frame: () => {},
      });
      sc.line.svg.prepend(old);
      const geo = (xE: number) => {
        const tm = rows.map((r) => { const h = box(q('h3', r)!, stepsSt); return (h.t + h.b) / 2; });
        const r3 = box(rows[2], stepsSt), body1 = box(q('.' + s.stepBody, rows[0])!, stepsSt);
        if (phone) { sc.line.set([xE, 0], xE === xL ? [[xL, sc.extB]] : [[xE, 20, 12], [xL, 20, 12], [xL, sc.extB]]); sc.exitX = xL; old.removeAttribute('d'); lens = [tm[0], tm[1], tm[2]]; Lfix0 = Lfix1 = tm[2]; yx = tm[2]; Lx = tm[2]; return; }
        const fx0 = body1.l, y3 = tm[2];
        stepsSt.style.setProperty('--col7', `${f(fx0 - CL)}px`);
        sc.line.set([xE, 0], [[xL, r3.t, 28], [fx0, r3.t, 28], [fx0, y3, 24], [xR, y3, 28], [xR, sc.extB]]);
        const at = sc.line.at;
        lens = [tm[0], tm[1], at[0]];
        Lfix0 = at[2] + 30; Lfix1 = at[3]; yx = y3 + 28; Lx = sc.line.L - (sc.extB - yx); sc.exitX = xR;
        // 어긋난 옛 경로 — 고칠 구간(머리 선에서 내려온 곳 ~ 오른쪽 끝) 안에서 위아래로 흔들린다
        const a = fx0 + 40, b = CR - 20, n = 6, z = 18;
        old.setAttribute('d', 'M' + Array.from({ length: n + 1 }, (_, i) => `${f(a + ((b - a) * i) / n)} ${f(y3 + (i === 0 || i === n ? 0 : (i % 2 ? z : -z * 0.6)))}`).join(' L'));
      };
      sc.build = (xE) => { (sc as Scene & { xE?: number }).xE = xE; geo(xE); };
      sc.frame = (vy) => {
        geo((sc as Scene & { xE?: number }).xE ?? xL);   // 머리 위치는 그때그때 잰다(글꼴·전환 뒤에도 맞게)
        const t1 = lens[0], base = Math.max(t1, P62), v = (i: number) => base + vh * i;   // 머무는 구간은 장면이 붙은 뒤부터 센다
        k = phone
          ? [[0, 0], [t1, lens[0]], [v(0.36), lens[0]], [v(0.62), lens[1]], [v(1.04), lens[1]], [v(1.24), lens[2]], [v(1.7), lens[2]], [v(1.95), Lx]]
          : [[0, 0], [t1, lens[0]], [v(0.36), lens[0]], [v(0.62), lens[1]], [v(1.04), lens[1]], [v(1.2), Lfix0], [v(1.5), Lfix1], [v(1.85), Lfix1], [v(1.95), Lx]];
        if (!reduced) sc.P = Math.max(sc.P, k[k.length - 1][0] - P62);
        const len = reduced ? sc.line.L : pinLen(sc, k, vy, Lx, yx);
        sc.line.draw(len);
        const a = reduced ? -1 : len >= lens[2] - 2 && vy >= v(1.04) ? 2 : len >= lens[1] - 2 && vy >= v(0.6) ? 1 : len >= lens[0] - 2 ? 0 : -1;
        if (a !== act) {
          act = a;
          rows.forEach((r, i) => { if (reduced) delete r.dataset.st; else r.dataset.st = i < a ? 'past' : i === a ? 'on' : 'next'; });
          stepsSt.style.setProperty('--rows', ['1fr 1fr 1fr', '5fr 1fr 1fr', '1fr 5fr 1fr', '1fr 1fr 5fr'][a + 1]);
        }
        const fx = clamp((len - Lfix0) / Math.max(1, Lfix1 - Lfix0));
        old.style.opacity = reduced ? '0' : a === 2 ? f(1 - fx) : '0';
      };
    }

    // ── 03 할 수 있는 일: 오른쪽 길로 조용히 지난다(머리글 낱말 채우기가 이 구간의 변화)
    const canSec = q('[data-sec="can"]')!;
    flowScene('can', canSec, false, () => xR);

    // ── 04 명암 전환: 선 끝 높이까지 남색이 덮인다(같은 한 동작). 덮인 자리에 작업을 여는 큰 문구가 드러난다
    const darkSc = q('[data-scene="dark"]')!, darkSt = q('[data-stage]', darkSc)!;
    let edge = 0;
    {
      const sc = add({
        key: 'dark', host: darkSt, sec: darkSc, line: new Line(darkSt, true), pinned: true,
        measure: () => { sc.P = vh * 0.95; },
        build: (xE) => { sc.line.set([xE, 0], [[xE, sc.extB]]); sc.exitX = xE; },
        frame: (vy) => {
          const len = reduced ? sc.line.L : vy <= P62 + sc.P ? clamp(vy, 0, vh) : Math.max(vh, vy - sc.P);
          sc.line.draw(len);
          edge = reduced ? vh : clamp(len, 0, vh);
          darkSt.style.setProperty('--edge', `${f(edge)}px`);
        },
      });
    }

    // ── 첫 작업(요청 처리): 그림이 오른쪽 작은 자리에서 화면 대부분으로 커진다. 선은 그 화면의 오른쪽 가장자리를 따라 내려간다
    const growSc = q('[data-scene="grow"]');
    if (growSc) {
      const st = q('[data-stage]', growSc)!, pic = q('[data-grow]', growSc)!, slot = q('[data-slot]', growSc)!, txt = q('[data-fade]', growSc)!;
      const frame = q('.' + s.frame, pic)!;
      let F: Box | null = null, S: Box | null = null, fo: Box | null = null, xE0 = 0;
      const offs = (e: HTMLElement, host: HTMLElement): Box => { let l = 0, t = 0, n: HTMLElement | null = e; while (n && n !== host) { l += n.offsetLeft; t += n.offsetTop; n = n.offsetParent as HTMLElement | null; } return { l, t, r: l + e.offsetWidth, b: t + e.offsetHeight, w: e.offsetWidth, h: e.offsetHeight }; };
      const sc = add({
        key: 'grow', host: st, sec: growSc, line: new Line(st, true), pinned: true,
        measure: () => {
          if (!sc.pinned) { pic.style.removeProperty('--pw'); pic.style.transform = ''; return; }
          pic.style.transform = '';
          const top = offs(pic, st).t, grid = box(q('.' + s.growIn, st)!, st).w;
          const cap = 46, btn = 48, H = vh - top - 28;
          pic.style.setProperty('--pw', `${f(Math.min(grid, (H - cap - btn) * 1.6))}px`);
          F = offs(pic, st); S = offs(slot, st); fo = offs(frame, pic);
          sc.P = vh * 1.05;
        },
        build: (xE) => { xE0 = xE; },
        frame: (vy) => {
          if (!sc.pinned || reduced || !F || !S || !fo) {
            const e = box(frame, st);
            sc.line.set([xE0, 0], [[xE0, e.t - 30, 20], [e.r, e.t - 30, 20], [e.r, sc.extB]]);
            sc.exitX = e.r;
            sc.line.draw(reduced ? sc.line.L : lenAt(sc.line.anchors(0), vy));
            return;
          }
          const g = clamp((vy - P62) / (vh * 0.5)), sc0 = S.w / F.w, k = sc0 + (1 - sc0) * g;
          const cl = lerp(S.l, F.l, g), ct = lerp(S.t, F.t, g);
          pic.style.transform = g >= 1 ? '' : `translate(${f(cl - F.l)}px, ${f(ct - F.t)}px) scale(${k.toFixed(4)})`;
          txt.style.setProperty('--g', g.toFixed(3));
          const er = cl + (fo.l + fo.w) * k, et = ct + fo.t * k, eb = ct + (fo.t + fo.h) * k;
          sc.line.set([xE0, 0], [[xE0, et - 30, 20], [er, et - 30, 20], [er, sc.extB]]);
          sc.exitX = F.l + fo.l + fo.w;
          const a0 = sc.line.at[0], a2 = sc.line.L - (sc.extB - eb), Fb = F.t + fo.t + fo.h;
          const len = vy < P62 ? Math.min(vy, a0) : g < 1 ? lerp(a0, a2, g) : vy <= P62 + sc.P ? a2 : Math.max(a2, a2 + (vy - sc.P - Fb));
          sc.line.draw(len);
        },
      });
    }

    // ── 문제 은행: 두 폰 화면이 서로 다른 빠르기로 올라오고, 선은 두 화면 사이로 지난다
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

    // ── 병원: 선이 전·후 비교의 가운데 선이 되고, 스크롤이 그 선을 옮긴다(손으로 옮기면 그때부터는 손이 정한다)
    const sweepSc = q('[data-scene="sweep"]');
    if (sweepSc) {
      const st = q('[data-stage]', sweepSc)!, ba = q('[data-ba]', sweepSc)!, range = q<HTMLInputElement>('input[type="range"]', ba)!;
      let xE0 = 0;
      const X0 = 85, X1 = 15;
      const sc = add({
        key: 'sweep', host: st, sec: sweepSc, line: new Line(st, true), pinned: true,
        measure: () => { sc.P = vh * 1.0; },
        build: (xE) => { xE0 = xE; },
        frame: (vy) => {
          const B = box(ba, st);
          const drive = sc.pinned && !reduced && !('touched' in ba.dataset);
          const g = clamp((vy - P62 - vh * 0.12) / (vh * 0.58));
          if (drive) { const X = Math.round(lerp(X0, X1, g) * 10) / 10; ba.style.setProperty('--x', `${X}%`); range.value = String(Math.round(X)); }
          const X = parseFloat(ba.style.getPropertyValue('--x')) || 50, dx = B.l + (B.w * X) / 100, yb = B.b + 6;
          sc.line.set([xE0, 0], [[xE0, B.t - 12, 10], [dx, B.t - 12, 10], [dx, yb, 6], [xR, yb, 16], [xR, sc.extB]]);
          sc.exitX = xR;
          const a0 = sc.line.at[0], aB = sc.line.at[2];
          if (!sc.pinned || reduced) { sc.line.draw(reduced ? sc.line.L : lenAt(sc.line.anchors(0), vy)); return; }
          const yx = yb + 16, Lx = sc.line.L - (sc.extB - yx);
          const len = vy < P62 ? Math.min(vy, a0) : vy < P62 + vh * 0.12 ? lerp(a0, aB, (vy - P62) / (vh * 0.12)) : vy <= P62 + sc.P ? aB : Math.max(aB, Lx + (vy - sc.P - yx));
          sc.line.draw(len);
        },
      });
      range.addEventListener('input', () => wake());
    }

    // ── 근무표: 선이 원본의 표시줄 자리(오른쪽·아래 가장자리)를 짚고, 그 자리가 그림 위로 크게 열린다
    const zoomSc = q('[data-scene="zoom"]');
    if (zoomSc) {
      const st = q('[data-stage]', zoomSc)!, fullPic = q('.' + s.fullPic, zoomSc)!, fd = q('[data-zoomed]', zoomSc);
      const crop = (fd?.querySelector<HTMLElement>('[data-zoom-crop]')?.dataset.zoomCrop ?? '0,0,40,21').split(',').map(Number);
      let xE0 = 0, I: Box | null = null, R: Box | null = null, T0: [number, number, number] = [0, 0, 1], T1: [number, number] = [0, 0];
      const sc = add({
        key: 'zoom', host: st, sec: zoomSc, line: new Line(st, true), pinned: true,
        measure: () => {
          fullPic.style.removeProperty('--pw'); if (fd) { fd.style.transform = ''; fd.style.removeProperty('--fw'); }
          if (!sc.pinned) return;
          const fp = box(fullPic, st), H = vh - fp.t - 28;
          fullPic.style.setProperty('--pw', `${f(Math.min(fp.w, (H - 94) * (2789 / 1416)))}px`);
          I = box(q('.' + s.frame, fullPic)!, st);
          R = { l: I.l + (I.w * crop[0]) / 100, t: I.t + (I.h * crop[1]) / 100, w: (I.w * crop[2]) / 100, h: (I.h * crop[3]) / 100, r: 0, b: 0 };
          R.r = R.l + R.w; R.b = R.t + R.h;
          if (fd) {
            const fw = Math.min(I.w * 0.92, 1040); fd.style.setProperty('--fw', `${f(fw)}px`);
            const fh = fd.offsetHeight, pad = 18, s0 = R.w / (fw - pad * 2);
            const zo = box(q('.' + s.zoomIn, st)!, st);   // 확대 칸은 zoomIn 기준으로 놓인다
            T0 = [R.l - pad * s0 - zo.l, R.t - pad * s0 - zo.t, s0]; T1 = [I.l + (I.w - fw) / 2 - zo.l, I.b - fh - 20 - zo.t];
          }
          sc.P = vh * 1.0;
        },
        build: (xE) => { xE0 = xE; },
        frame: (vy) => {
          if (!sc.pinned || reduced || !I || !R) {
            const e = box(q('.' + s.frame, fullPic)!, st), bt = box(q('.' + s.twoBtns, fullPic) ?? q('.' + s.frame, fullPic)!, st).t - 14;
            sc.line.set([xE0, 0], [[xE0, bt, 20], [e.l - (phone ? 0 : 0), bt, 20], [e.l, sc.extB]]);
            sc.exitX = e.l;
            sc.line.draw(reduced ? sc.line.L : lenAt(sc.line.anchors(0), vy));
            return;
          }
          const bt = box(q('.' + s.twoBtns, fullPic) ?? q('.' + s.frame, fullPic)!, st).t - 14;
          sc.line.set([xE0, 0], [[xE0, bt, 20], [R.r, bt, 20], [R.r, R.b, 16], [I.l, R.b, 16], [I.l, sc.extB]]);
          sc.exitX = I.l;
          const at = sc.line.at, a0 = at[0], aB = at[3] + 18, yx = R.b + 16;
          const t = vy - P62;
          const len = t < 0 ? Math.min(vy, a0) : t < vh * 0.3 ? lerp(a0, aB, t / (vh * 0.3)) : vy <= P62 + sc.P ? aB : Math.max(aB, aB + (vy - sc.P - yx));
          sc.line.draw(len);
          const z = clamp((t - vh * 0.35) / (vh * 0.3));
          if (fd) {
            const k = lerp(T0[2], 1, z);
            fd.style.transform = `translate(${f(lerp(T0[0], T1[0], z))}px, ${f(lerp(T0[1], T1[1], z))}px) scale(${k.toFixed(4)})`;
            fd.style.setProperty('--zo', t > vh * 0.33 ? '1' : '0'); fd.style.setProperty('--z', z.toFixed(3));
            fd.toggleAttribute('data-open', z >= 0.99);
          }
        },
      });
    }

    // ── 「모든 작업」 구분선을 이어받아 오른쪽 끝에서 빠진다
    const allHost = q('[data-all]')!;
    {
      let an: { len: number; y: number }[] = [];
      const sc = add({
        key: 'all', host: allHost, sec: allHost, line: new Line(allHost, true), pinned: false, measure: () => {},
        build: (xE) => {
          const ry = box(q('.' + s.all, allHost)!, allHost).t + 0.5;
          sc.line.set([xE, 0], Math.abs(xE - xR) < 1 ? [[xR, sc.extB]] : [[xE, ry, Math.max(4, Math.min(40, Math.abs(xE - CL) + 30))], [xR, ry, Math.max(4, xR - CR)], [xR, sc.extB]]);
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

    let ready = false, built = { w: 0, h: 0 };
    const build = () => {
      vh = innerHeight; P62 = vh * 0.62; phone = innerWidth < 1024;
      built = { w: innerWidth, h: innerHeight };
      root.style.setProperty('--vh', `${vh}px`);
      const wr = q('.' + s.wrap, heroSec)!, cs = getComputedStyle(wr), rb = root.getBoundingClientRect(), wb = wr.getBoundingClientRect();
      CL = wb.left - rb.left + parseFloat(cs.paddingLeft); CR = wb.right - rb.left - parseFloat(cs.paddingRight);
      xR = CR + (phone ? 8 : 24); xL = CL - (phone ? 9 : 30);
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
