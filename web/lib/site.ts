/** 사이트 대표 주소와 이름 — 검색·공유 미리보기·구조화 데이터가 함께 쓴다.
 *  맨 주소(prologueand.com)는 Vercel 이 www 로 넘기므로 www 를 대표로 둔다 */
export const SITE = 'https://www.prologueand.com';
export const NAME = 'Prologue&';
/** "프롤로그엔"으로 찾아도 나오게 — & 는 검색에서 지워지므로 읽는 이름을 함께 둔다 */
export const NAME_KO = '프롤로그엔';
export const ALT_NAMES = [NAME_KO, '프롤로그앤', 'Prologue and', 'prologueand'];
export const TAGLINE = '복잡한 업무를 단순한 제품으로 바꿉니다.';

/** 검색에 열지 — Vercel 미리보기·개발 배포만 막는다. 실제 배포(production)와 로컬 빌드는 연다 */
export function shouldIndex(vercelEnv: string | undefined): boolean {
  return vercelEnv === undefined || vercelEnv === 'production';
}
