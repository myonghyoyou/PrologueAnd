'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import s from './pinned.module.css';

/** 장이 붙는 위치 — pinned.module.css .stage top 과 같게(헤더 64 + 16) */
export const PIN = 80;

/** 트랙 윗변이 PIN 에 오면 0, 한 화면 높이 더 내려가면 1. 트랙의 .room 은 120vh 라 끝의 20vh 는 완성된 그림을 잠시 붙잡아 둔다 */
export const pinT = (r: DOMRect, vh: number) => (PIN - r.top) / vh;

type Pin = { ref: RefObject<HTMLDivElement | null>; on: boolean };
const Ctx = createContext<Pin | null>(null);

/** 붙는 장 안의 블록이 쓴다. 붙는 장 밖이면 null */
export const usePin = () => useContext(Ctx);

/** 데스크톱이고 모션 줄이기가 아닐 때만 붙인다 — pinned.module.css 의 미디어 쿼리와 같은 조건 */
function usePinOn(): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const m = window.matchMedia('(min-width:1024px) and (prefers-reduced-motion:no-preference)');
    const f = () => setOn(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return on;
}

/** 장(또는 블록 하나)을 헤더 아래에 붙여 두고, room(vh) 만큼 스크롤하는 동안 안의 그림이 진행률(t)로 움직이게 한다.
 *  제목(장 도입)과 그림이 같은 무대에 있어 움직이는 동안 제목도 보인다. 폰·모션 줄이기에서는 room 이 사라진다(CSS) */
export function Pinned({ children, room = 120 }: { children: ReactNode; room?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const on = usePinOn();
  // 무대 안 첫 요소(장 도입: 괘선·제목·문단)의 높이를 --intro-h 로 넘긴다 — 그림은 "화면 높이 − 도입 높이"에 맞춰 폭을 정해
  // 제목과 그림이 한 화면에 들어오고, 무대는 내용 높이만큼만 차지해 다음 장 앞에 빈 자리가 생기지 않는다
  useEffect(() => {
    const st = stage.current, intro = st?.firstElementChild as HTMLElement | null;
    if (!st || !intro) return;
    const put = () => st.style.setProperty('--intro-h', `${intro.offsetHeight}px`);
    put();
    const ro = new ResizeObserver(put);
    ro.observe(intro);
    return () => ro.disconnect();
  }, []);
  return (
    <Ctx.Provider value={{ ref, on }}>
      <div ref={ref} className={s.track} data-pin-track>
        <div ref={stage} className={s.stage} data-pin-stage>{children}</div>
        <div aria-hidden className={s.room} style={room === 120 ? undefined : { height: `${room}vh` }} />
      </div>
    </Ctx.Provider>
  );
}
