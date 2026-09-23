/** 틀 한쪽 두께: 테두리 1 + 안쪽 여백 6 (frame.module.css .box 와 같아야 한다) */
export const FRAME_PAD = 7;

/** 'long' = 세로가 가로보다 긴 캡처 → 정사각 창 안에서 스크롤(명세 §5-3). 폰 칸은 폰 화면이라 창을 쓰지 않는다 */
export const frameMode = (w: number, h: number, ctx: 'block' | 'phones'): 'plain' | 'long' =>
  ctx === 'block' && h > w ? 'long' : 'plain';

/** 한 줄 높이 맞춤(§5-2)에서 어느 그림도 원본보다 커지지 않는 줄의 최대 폭(§5-4). 줄 높이는 가장 낮은 원본 높이까지 */
export function rowMaxWidth(figs: { w: number; h: number }[], gap: number): number {
  const H = Math.min(...figs.map((f) => f.h));
  const ratios = figs.reduce((a, f) => a + f.w / f.h, 0);
  return Math.round(H * ratios) + figs.length * FRAME_PAD * 2 + gap * (figs.length - 1);
}
