/** 문의 서랍 「지금 상황」에 요청서 요약을 넣는다 — 서버가 1,000자까지만 받는다(lib/inquiry-schema.ts).
 *  사용자가 이미 쓴 글은 지우지 않는다. 남는 자리가 100자 미만이면 덧붙이지 않는다 */
export const SUMMARY_MARK = '[요청서 만들기]';

export function appendSummary(existing: string, summary: string, max = 1000): string {
  // 전에 넣은 요약이 있으면 그 자리부터 새 요약으로 바꾼다 — 두 번 보내도 하나만 남게
  const at = existing.indexOf(SUMMARY_MARK);
  const base = (at >= 0 ? existing.slice(0, at) : existing).trim();
  if (!base) return summary.length > max ? `${summary.slice(0, max - 1)}…` : summary;
  const room = max - base.length - 2;
  if (room < 100) return base;
  const add = summary.length > room ? `${summary.slice(0, room - 1)}…` : summary;
  return `${base}\n\n${add}`;
}
