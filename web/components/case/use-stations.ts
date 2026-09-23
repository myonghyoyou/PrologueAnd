'use client';
import { useCallback, useEffect, useRef } from 'react';
import { getLenis } from '../lenis-provider';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const WHEEL = { gap: 100, first: 90, more: 480 };
const LOCK = 160;
const SMOOTH = 0.28;   // 도달 감각(초) — 시안 case.js 의 anim.smooth

/** 임계감쇠 스무딩 (시안 case.js·v5·v6 와 같은 식). 이동 중에 목표가 바뀌어도 속도를 이어받아 끊기지 않는다 */
function smoothDamp(cur: number, to: number, vel: number, smoothTime: number, dt: number) {
  const w = 2 / Math.max(0.0001, smoothTime), x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const ch = cur - to, tt = (vel + w * ch) * dt, nv = (vel - w * tt) * e;
  return { pos: to + (ch + tt) * e, vel: nv };
}

/** 스크롤 위치를 옮기고, 같은 프레임 안에 머무름 판의 붙이기를 다시 계산시킨다(시안 tick 이 onScroll 을 직접 부르는 것과 같음).
 *  진짜 scroll 이벤트는 다음 프레임에 와서, 그것만 기다리면 붙은 판이 한 프레임씩 밀렸다 돌아온다 */
function place(y: number) {
  const l = getLenis();
  if (l) l.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
  window.dispatchEvent(new Event('scroll'));
}

export function useStations() {
  const anim = useRef({ pos: 0, target: 0, vel: 0, active: false, raf: 0, last: 0 });

  const stops = useCallback((): number[] => {
    const out: number[] = [];
    document.querySelectorAll<HTMLElement>('[data-pan]').forEach((pan) => {
      const dwell = pan.closest<HTMLElement>('[data-dwell]');
      if (!dwell) { out.push(pan.getBoundingClientRect().top + window.scrollY - 64); return; }
      // 붙이기(use-dwell)는 구간 위가 화면 64 에 올 때 시작한다 — 정거장도 거기서부터 재야 k=0/.5/1 이 그대로 t 가 되고
      // 판이 늘 64 에 선다. 시안(case.js stops)은 −64 를 빼먹어 k=1 에서 판이 헤더 밑으로 들어갔다
      const y0 = dwell.getBoundingClientRect().top + window.scrollY - 64;
      const range = dwell.offsetHeight - pan.offsetHeight;
      const ks = dwell.dataset.dwell === '2' ? [0, 1] : [0, 0.5, 1];
      ks.forEach((k) => out.push(y0 + range * k));
    });
    return out.map((y) => Math.max(0, Math.round(y))).sort((a, b) => a - b);
  }, []);

  const goY = useCallback((y: number) => {
    const a = anim.current;
    a.target = clamp(y, 0, document.documentElement.scrollHeight - window.innerHeight);
    if (a.active) return;                                    // 달리는 중이면 목표만 바꾼다 — 속도는 이어받는다
    a.pos = window.scrollY; a.vel = 0; a.active = true; a.last = performance.now();
    const tick = (now: number) => {
      const dt = clamp((now - a.last) / 1000, 0.001, 0.05); a.last = now;
      const r = smoothDamp(a.pos, a.target, a.vel, SMOOTH, dt); a.pos = r.pos; a.vel = r.vel;
      if (Math.abs(a.target - a.pos) < 0.5 && Math.abs(a.vel) < 8) { a.pos = a.target; a.vel = 0; a.active = false; }
      place(a.pos);
      a.raf = a.active ? requestAnimationFrame(tick) : 0;
    };
    a.raf = requestAnimationFrame(tick);
  }, []);

  const goStop = useCallback((dir: 1 | -1) => {
    const st = stops();
    const from = anim.current.active ? anim.current.target : window.scrollY;
    let k = 0;
    st.forEach((y, i) => { if (y <= from + 2) k = i; });
    goY(st[clamp(k + dir, 0, st.length - 1)]);
  }, [stops, goY]);

  // 해시로 들어오면 정거장으로 스냅한다 (명세 §2, 시안 case.js:195-196): 판이면 판 위 − 64,
  // 머무름 구간 안이면 구간의 시작. 브라우저의 기본 해시 스크롤(요소 위 = 0, 헤더 밑)을 덮어쓴다.
  useEffect(() => {
    if (!window.matchMedia('(min-width:1024px)').matches) return;
    let id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    const jump = () => {
      const dwell = el.closest<HTMLElement>('[data-dwell]');
      const pan = el.closest<HTMLElement>('[data-pan]') ?? el;
      const y = (dwell ?? pan).getBoundingClientRect().top + window.scrollY - 64;   // 판·머무름 구간 모두 정거장 식과 같다
      const to = Math.max(0, Math.round(y));
      const l = getLenis();
      if (l) l.scrollTo(to, { immediate: true, force: true }); else window.scrollTo(0, to);
      // 같은 프레임 안에서 오갔다 제자리로 오면 scroll 이벤트가 오지 않는다 — 머무름 판의 붙이기를 다시 계산시킨다
      // (시안 goTo 도 이동 뒤 onScroll() 을 직접 부른다)
      window.dispatchEvent(new Event('scroll'));
    };
    jump();
    // 글꼴·그림 맞추기와 브라우저의 늦은 해시 스크롤 뒤에도 한 번 더 (시안은 50ms 뒤 한 번)
    const late = setTimeout(jump, 50);
    return () => clearTimeout(late);
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(min-width:1024px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    history.scrollRestoration = 'manual';

    let acc = 0, lastEv = 0, stepped = false, streamStart = 0, lockUntil = 0, pending = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;                                   // 브라우저 확대는 건드리지 않는다
      if (document.documentElement.hasAttribute('data-drawer-open')) return;
      e.preventDefault();
      const d = e.deltaY;
      if (!d) return;
      const now = performance.now(), gap = now - lastEv; lastEv = now;
      if (gap > WHEEL.gap) { acc = 0; stepped = false; streamStart = now; }
      acc += d;
      const fire = (dir: 1 | -1) => { if (now < lockUntil) { pending += dir; return; } goStop(dir); lockUntil = now + LOCK; };
      if (!stepped) { if (Math.abs(acc) >= WHEEL.first) { fire(acc > 0 ? 1 : -1); acc = 0; stepped = true; } return; }
      if (now - streamStart > 300 && Math.abs(acc) >= WHEEL.more) { fire(acc > 0 ? 1 : -1); acc = 0; }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (document.documentElement.hasAttribute('data-drawer-open')) return;
      // 버튼·링크·포커스 가능한 요소·입력칸의 Space/Enter/화살표는 그 요소의 것이다 (문의 버튼 Space 등)
      const el = e.target as HTMLElement | null;
      if (el && el !== document.body && el !== document.documentElement &&
          (['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.hasAttribute('tabindex') || el.isContentEditable)) return;
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goStop(1); }
      else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goStop(-1); }
      else if (e.key === 'Home') { e.preventDefault(); goY(0); }
      else if (e.key === 'End') { e.preventDefault(); goY(document.documentElement.scrollHeight - window.innerHeight); }
    };

    const drain = window.setInterval(() => {
      if (!pending || performance.now() < lockUntil) return;
      const dir = Math.sign(pending) as 1 | -1; pending -= dir; goStop(dir); lockUntil = performance.now() + LOCK;
    }, 40);

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearInterval(drain);
      cancelAnimationFrame(anim.current.raf); anim.current.active = false;
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [goStop, goY]);

  return { goStop, stops };
}
