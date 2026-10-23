/** 최상위 도메인 → RDAP 서버. 손으로 옮겨 적은 고정 목록이다(빌드·실행 때 받지 않는다).
 *  원본: https://data.iana.org/rdap/dns.json (2026-10-23 받음). 목록에 없는 도메인은 자동 조회를 하지 않고 질문으로 간다.
 *  .es·.mx·.co·.cl·.pe·.us·.io·.me 는 원본에 서버가 없다(2026-10-23 확인). */
export const RDAP_SERVERS: Readonly<Record<string, string>> = {
  kr: 'https://rdap.nic.or.kr/',
  'xn--3e0b707e': 'https://rdap.nic.or.kr/',   // .한국
  com: 'https://rdap.verisign.com/com/v1/',
  net: 'https://rdap.verisign.com/net/v1/',
  org: 'https://rdap.publicinterestregistry.org/rdap/',
  shop: 'https://rdap.gmoregistry.net/rdap/',
  store: 'https://rdap.radix.host/rdap/',
  online: 'https://rdap.radix.host/rdap/',
  site: 'https://rdap.radix.host/rdap/',
  app: 'https://pubapi.registry.google/rdap/',
  dev: 'https://pubapi.registry.google/rdap/',
  xyz: 'https://rdap.centralnic.com/xyz/',
  info: 'https://rdap.identitydigital.services/rdap/',
  biz: 'https://rdap.nic.biz/',
  uk: 'https://rdap.nominet.uk/uk/',
  ca: 'https://rdap.ca.fury.ca/rdap/',
  au: 'https://rdap.cctld.au/rdap/',
};

export function rdapServerFor(domain: string): string | null {
  const tld = domain.slice(domain.lastIndexOf('.') + 1);
  return RDAP_SERVERS[tld] ?? null;
}
