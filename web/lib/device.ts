import type { LenisOptions } from 'lenis';

/** iPhone · iPad · iPod. 데스크톱 모드 iPad 는 Mac 처럼 보고하므로 "MacIntel + 터치"로 잡는다.
 *  iOS 위의 Chrome · 인앱 브라우저도 같은 엔진이라 함께 잡힌다 */
export function isIOS(ua: string, platform: string, maxTouchPoints: number): boolean {
  return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

/** Lenis 설정 — 데스크톱 그대로, 안드로이드 등 터치는 약하게(0.075), iOS 는 손가락 스크롤만 기본 */
export function lenisOptions(env: { ios: boolean; touch: boolean }): LenisOptions {
  // 두 손가락 터치는 Lenis 가 막지 않게 넘긴다 — syncTouch 의 preventDefault 가 페이지 핀치 확대까지 막는다
  if (!env.ios && env.touch) return { lerp: 0.075, smoothWheel: true, syncTouch: true, syncTouchLerp: 0.075,
    virtualScroll: ({ event }) => !('touches' in event) || event.touches.length < 2 };
  return { lerp: 0.1, smoothWheel: true, syncTouch: false };
}
