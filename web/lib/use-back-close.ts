'use client';
import { useEffect, useRef } from 'react';

/** 열려 있는 동안 브라우저 뒤로가기를 '닫기'로 쓴다(명세 §3, 계획 §0-4).
 *  열 때 history 에 한 칸 — Next 가 넣어 둔 state 를 그대로 펼쳐 두어 라우터가 같은 화면으로 본다.
 *  닫기 단추·막·Esc 로 닫히면 쌓은 칸을 history.back() 으로 되돌린다 */
export function useBackClose(open: boolean, close: () => void, enabled = true) {
  const pushed = useRef(false);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!enabled) return;
    if (!open) {
      if (pushed.current) { pushed.current = false; history.back(); }
      return;
    }
    history.pushState({ ...(history.state ?? {}), overlay: 1 }, '');
    pushed.current = true;
    const onPop = () => { if (!pushed.current) return; pushed.current = false; closeRef.current(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open, enabled]);
}
