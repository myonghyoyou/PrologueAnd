import type { Provider } from './types';

/** 등록대행자·DNS·호스팅·빌더·메일 패턴 표. 2026-10-23 확인한 값만 넣었다 — 확인 못 한 값은 넣지 않는다(지어내지 않음).
 *  대행자 이름: IANA 등록대행자 목록(https://www.iana.org/assignments/registrar-ids/registrar-ids-1.csv)과 RDAP 실조회, .kr 은 KISA 후이즈.
 *  네임서버·연결 대상·MX·로그인 주소: 각 회사 공식 도움말(주석의 주소). 로그인 주소를 확인 못 한 회사는 login 을 비운다.
 *  같은 회사 키면 "같은 곳"으로 본다 — 대행자와 네임서버 회사가 같은지 비교하는 데 쓴다. */
export const PROVIDERS: Provider[] = [
  // ── 국내
  { key: 'gabia', name: { ko: '가비아', en: 'Gabia' }, kinds: ['registrar', 'dns', 'host'], registrar: /gabia/i, ns: /(^|\.)ns\d?\.gabia\.(co\.kr|net)$/ },
  // 후이즈: homepage.whois.co.kr 도메인 연결 안내(dns2/4/6.whois.co.kr), 도메인 DNS ns*.whoisdomain.kr
  { key: 'whois', name: { ko: '후이즈', en: 'Whois Corp.' }, kinds: ['registrar', 'dns', 'host'], registrar: /^whois corp/i, ns: /\.(whois\.co\.kr|whoisdomain\.kr)$/ },
  // 카페24: help.cafe24.com/docs/domain/domain-dns-management-guide
  { key: 'cafe24', name: { ko: '카페24', en: 'Cafe24' }, kinds: ['dns', 'host', 'builder'], ns: /\.(cafe24\.(com|co\.kr)|simplexi\.com)$/, login: 'https://eclogin.cafe24.com/Shop/' },
  // 아이네임즈: dom.inames.co.kr(ns1/ns2.uhost.co.kr)
  { key: 'inames', name: { ko: '아이네임즈', en: 'Inames' }, kinds: ['registrar', 'dns'], registrar: /inames/i, ns: /\.(uhost|inames)\.co\.kr$/, login: 'https://my.inames.co.kr/members/login' },
  { key: 'dotname', name: { ko: '닷네임코리아', en: 'Dotname Korea' }, kinds: ['registrar'], registrar: /dotname korea/i, login: 'https://sso.dotname.co.kr/signin' },
  // 한국호스트웨이: hostway.co.kr 안내(siteprotect·cninet)
  { key: 'hostway', name: { ko: '한국호스트웨이', en: 'Hostway Korea' }, kinds: ['dns', 'host'], ns: /\.(siteprotect|cninet)\.co\.kr$/ },
  { key: 'hostingkr', name: { ko: '호스팅케이알', en: 'HOSTING.KR' }, kinds: ['registrar'], registrar: /megazone|hosting\.kr/i },
  // 아임웹: 기본 주소 imweb.me. 네임서버·연결 대상은 공식 문서로 확인 못 함
  { key: 'imweb', name: { ko: '아임웹', en: 'imweb' }, kinds: ['builder', 'host'], login: 'https://imweb.me/login' },
  // 식스샵: help.pro.sixshop.com/domains/dns(CNAME was.sixshop.com)
  { key: 'sixshop', name: { ko: '식스샵', en: 'sixshop' }, kinds: ['builder', 'host'], host: /^was\.sixshop\.com$/ },

  // ── 해외 등록대행자
  { key: 'godaddy', name: { ko: 'GoDaddy', en: 'GoDaddy' }, kinds: ['registrar', 'dns'], registrar: /godaddy/i, ns: /\.domaincontrol\.com$/, login: 'https://sso.godaddy.com/' },
  { key: 'namecheap', name: { ko: 'Namecheap', en: 'Namecheap' }, kinds: ['registrar', 'dns'], registrar: /namecheap/i, ns: /\.registrar-servers\.com$/, login: 'https://www.namecheap.com/myaccount/login/' },
  { key: 'cloudflare', name: { ko: 'Cloudflare', en: 'Cloudflare' }, kinds: ['registrar', 'dns'], registrar: /cloudflare/i, ns: /\.ns\.cloudflare\.com$/, login: 'https://dash.cloudflare.com/login' },
  { key: 'namecom', name: { ko: 'Name.com', en: 'Name.com' }, kinds: ['registrar', 'dns'], registrar: /name\.com/i, ns: /(^|\.)name\.com$/, login: 'https://www.name.com/account/login' },
  { key: 'porkbun', name: { ko: 'Porkbun', en: 'Porkbun' }, kinds: ['registrar', 'dns'], registrar: /porkbun/i, ns: /\.ns\.porkbun\.com$/, login: 'https://porkbun.com/account/login' },
  { key: 'ionos', name: { ko: 'IONOS', en: 'IONOS' }, kinds: ['registrar', 'dns', 'host'], registrar: /ionos/i, ns: /\.ui-dns\.(de|biz|org|com)$/, login: 'https://login.ionos.com/' },
  { key: 'hostinger', name: { ko: 'Hostinger', en: 'Hostinger' }, kinds: ['registrar', 'dns', 'host'], registrar: /hostinger/i, ns: /\.(dns-parking\.com|main-hosting\.eu)$/, login: 'https://auth.hostinger.com/login' },

  // ── 해외 빌더·호스팅(대행자 기능이 있으면 함께)
  // Squarespace: support.squarespace.com 205812378(A 198.185.159.144/145, 198.49.23.144/145, www → ext-cust.squarespace.com)
  { key: 'squarespace', name: { ko: 'Squarespace', en: 'Squarespace' }, kinds: ['registrar', 'dns', 'builder', 'host'], registrar: /squarespace/i, ns: /\.(squarespacedns\.com|googledomains\.com)$/, host: /^(198\.185\.159\.14[45]|198\.49\.23\.14[45]|ext-cust\.squarespace\.com)$/, login: 'https://account.squarespace.com/' },
  // Wix: support.wix.com(A 185.230.63.107, www → pointing.wixdns.net)
  { key: 'wix', name: { ko: 'Wix', en: 'Wix' }, kinds: ['registrar', 'builder', 'host'], registrar: /wix\.com/i, host: /^(185\.230\.63\.107|pointing\.wixdns\.net)$/, login: 'https://users.wix.com/signin' },
  // Shopify: help.shopify.com connect-domain-manual(A 23.227.38.65, www → shops.myshopify.com)
  { key: 'shopify', name: { ko: 'Shopify', en: 'Shopify' }, kinds: ['builder', 'host'], host: /^(23\.227\.38\.65|shops\.myshopify\.com)$/, login: 'https://accounts.shopify.com/lookup' },
  // Webflow: A 198.202.211.1, www → cdn.webflow.com
  { key: 'webflow', name: { ko: 'Webflow', en: 'Webflow' }, kinds: ['builder', 'host'], host: /^(198\.202\.211\.1|cdn\.webflow\.com)$/, login: 'https://webflow.com/login' },
  // WordPress.com: 네임서버 ns1~3.wordpress.com, 대행자 Automattic Inc.
  { key: 'wpcom', name: { ko: 'WordPress.com', en: 'WordPress.com' }, kinds: ['registrar', 'dns', 'builder', 'host'], registrar: /automattic/i, ns: /^ns\d\.wordpress\.com$/, login: 'https://wordpress.com/log-in' },
  // Vercel: A 76.76.21.21 / 216.198.79.1, CNAME *.vercel-dns-0xx.com, 네임서버 ns1/ns2.vercel-dns.com
  { key: 'vercel', name: { ko: 'Vercel', en: 'Vercel' }, kinds: ['dns', 'host'], ns: /\.vercel-dns\.com$/, host: /^(76\.76\.21\.21|216\.198\.79\.1|.*\.vercel-dns(-\d+)?\.com)$/, login: 'https://vercel.com/login' },
  // Netlify: apex-loadbalancer.netlify.com, A 75.2.60.5, CNAME <site>.netlify.app
  { key: 'netlify', name: { ko: 'Netlify', en: 'Netlify' }, kinds: ['host'], host: /^(75\.2\.60\.5|.*\.netlify\.(app|com))$/, login: 'https://app.netlify.com/login' },

  // ── 메일
  // Google Workspace: smtp.google.com(2023 이전 계정은 aspmx*.google.com)
  { key: 'google', name: { ko: 'Google Workspace', en: 'Google Workspace' }, kinds: ['mail'], mx: /(^|\.)(google|googlemail)\.com$/, login: 'https://admin.google.com/' },
  { key: 'm365', name: { ko: 'Microsoft 365', en: 'Microsoft 365' }, kinds: ['mail'], mx: /\.mail\.protection\.outlook\.com$/, login: 'https://admin.microsoft.com/' },
  { key: 'zoho', name: { ko: 'Zoho Mail', en: 'Zoho Mail' }, kinds: ['mail'], mx: /^mx\d?\.zoho\./, login: 'https://mailadmin.zoho.com/' },
  // 다음 스마트워크: cs.daum.net 공식 FAQ(ASPMX.daum.net, ALT.ASPMX.daum.net)
  { key: 'daum', name: { ko: '다음 스마트워크', en: 'Daum Smartwork' }, kinds: ['mail'], mx: /aspmx\.daum\.net$/ },
];

/** 빌더 기본 주소 — 내 도메인 없이 빌더가 준 주소만 쓰는 경우(공식 도움말에서 확인한 것만) */
export const BUILDER_SUFFIXES: { suffix: string; key: string }[] = [
  { suffix: 'imweb.me', key: 'imweb' },
  { suffix: 'sixshop.com', key: 'sixshop' },       // sixshop.com/고객ID 경로 방식
  { suffix: 'cafe24.com', key: 'cafe24' },         // 상점ID.cafe24.com
  { suffix: 'wixsite.com', key: 'wix' },
  { suffix: 'myshopify.com', key: 'shopify' },
  { suffix: 'wordpress.com', key: 'wpcom' },
  { suffix: 'vercel.app', key: 'vercel' },
  { suffix: 'netlify.app', key: 'netlify' },
];

export const providerByKey = (key: string | null): Provider | null => (key ? PROVIDERS.find((p) => p.key === key) ?? null : null);

export function matchRegistrar(name: string | null): Provider | null {
  if (!name) return null;
  return PROVIDERS.find((p) => p.registrar?.test(name)) ?? null;
}

export function matchNs(hosts: string[]): Provider | null {
  for (const h of hosts) { const p = PROVIDERS.find((x) => x.ns?.test(h)); if (p) return p; }
  return null;
}

/** 'none' = 메일을 받지 않음(MX 없음 또는 null MX "0 ."), null = 받지만 어느 회사인지 모름 */
export function matchMail(mx: string[]): Provider | null | 'none' {
  const real = mx.map((m) => m.trim().replace(/\.$/, '')).filter(Boolean);
  if (!real.length) return 'none';
  for (const m of real) { const p = PROVIDERS.find((x) => x.mx?.test(m)); if (p) return p; }
  return null;
}

export function matchHost(a: string[], cname: string[]): Provider | null {
  for (const v of [...cname, ...a]) { const p = PROVIDERS.find((x) => x.host?.test(v)); if (p) return p; }
  return null;
}
