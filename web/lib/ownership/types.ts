/** 권한 점검 — 언어 없는 타입. 화면 글자는 content/ownership/copy 에만 있다 */

export type Locale = 'ko' | 'en';

export type Normalized =
  | {
      ok: true;
      domain: string;              // 조회용 ASCII(한글 도메인은 퓨니코드)
      display: string;             // 화면용
      trimmedFrom: string | null;  // 하위 주소를 잘라 냈으면 원래 호스트(www 는 알리지 않음)
      builderOnly: string | null;  // 빌더 기본 주소면 그 빌더 회사 키
    }
  | { ok: false; error: 'empty' | 'shape' };

/** 조회 하나의 결과 — 찾을 수 없음(등록 안 됨)과 실패(망·시간·형식)를 나눈다 */
export type Fail = 'timeout' | 'http' | 'network' | 'shape' | 'unsupported';
export type Part<T> = { status: 'ok'; value: T } | { status: 'notFound' } | { status: 'failed'; reason: Fail };

export type RdapInfo = { registrar: string | null; registrant: string | null; expires: string | null; nameservers: string[] };

export type Lookup = {
  domain: string;
  at: string;   // 조회 시각(ISO)
  rdap: Part<RdapInfo>;
  ns: Part<string[]>;
  mx: Part<string[]>;
  a: Part<string[]>;
  cname: Part<string[]>;
};
