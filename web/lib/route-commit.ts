/**
 * 새 경로가 React 트리에 커밋됐는지 알려 주는 통로.
 *
 * 뷰 전환의 update 콜백 동안 브라우저는 렌더링을 멈춘다 — 그 안에서 requestAnimationFrame 을 기다리면
 * 4초 DOM 업데이트 타임아웃까지 영영 오지 않는다(C1). 그래서 "새 화면이 그려졌다"를 rAF 가 아니라
 * 루트 레이아웃의 RouteCommit 이 useLayoutEffect 에서 알려 주는 경로 커밋으로 판단한다.
 */
type Waiter = { target: string; from: string; done: () => void };

let waiters: Waiter[] = [];

/** RouteCommit 이 경로가 커밋될 때마다 부른다 */
export function notifyPath(path: string) {
  waiters = waiters.filter((w) => {
    // 목표 경로에 닿았거나, 리다이렉트로 다른 곳에 닿았어도 새 경로가 커밋된 것이다
    if (path === w.target || path !== w.from) { w.done(); return false; }
    return true;
  });
}

/** href 의 경로가 커밋되면 풀린다. 무슨 일이 있어도 timeout(ms) 안에는 풀린다 — 전환이 멈추지 않게 */
export function waitForPath(href: string, timeout = 500): Promise<void> {
  const from = window.location.pathname;
  const target = new URL(href, window.location.href).pathname;
  if (target === from) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const w: Waiter = { target, from, done: () => { clearTimeout(timer); resolve(); } };
    const timer = setTimeout(() => { waiters = waiters.filter((x) => x !== w); resolve(); }, timeout);
    waiters.push(w);
  });
}
