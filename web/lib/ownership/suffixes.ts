/** 등록 도메인이 세 칸인 끝 이름(두 단계 끝 이름).
 *  출처: https://publicsuffix.org/list/public_suffix_list.dat (2026-10-23 대조) — 이 도구가 다루는 나라만 발췌 */
export const TWO_LEVEL: ReadonlySet<string> = new Set([
  // .kr 속성형
  'co.kr', 'or.kr', 'ne.kr', 're.kr', 'pe.kr', 'go.kr', 'ac.kr', 'mil.kr', 'hs.kr', 'ms.kr', 'es.kr', 'sc.kr', 'kg.kr',
  // .kr 지역
  'seoul.kr', 'busan.kr', 'daegu.kr', 'incheon.kr', 'gwangju.kr', 'daejeon.kr', 'ulsan.kr', 'gyeonggi.kr', 'gangwon.kr',
  'chungbuk.kr', 'chungnam.kr', 'jeonbuk.kr', 'jeonnam.kr', 'gyeongbuk.kr', 'gyeongnam.kr', 'jeju.kr',
  // 영어권
  'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'org.nz',
  // 스페인어권(자동 조회는 안 되지만 등록 도메인 자르기는 맞춘다)
  'com.mx', 'com.ar', 'com.co', 'com.pe', 'com.es',
]);
