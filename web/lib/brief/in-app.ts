/** 앱 안 브라우저(쓰레드=Barcelona, 인스타그램, 페이스북, 카카오톡, 네이버, 라인). 인쇄가 막혀 있을 수 있다 — Task 1 기기 시험으로 확인 */
export function isInAppBrowser(ua: string): boolean {
  return /Barcelona|Instagram|FBAN|FBAV|KAKAOTALK|NAVER\(inapp|Line\//i.test(ua);
}
