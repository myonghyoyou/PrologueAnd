/** 문의 서랍 「지금 상황」에 요청서 요약을 넣는다 — 서버가 1,000자까지만 받는다(lib/inquiry-schema.ts).
 *  사용자가 이미 쓴 글은 지우지 않는다. 남는 자리가 100자 미만이면 덧붙이지 않는다 */
export function appendSummary(existing: string, summary: string, max = 1000): string {
  const base = existing.trim();
  if (!base) return summary.length > max ? `${summary.slice(0, max - 1)}…` : summary;
  const room = max - base.length - 2;
  if (room < 100) return base;
  const add = summary.length > room ? `${summary.slice(0, room - 1)}…` : summary;
  return `${base}\n\n${add}`;
}
