import { test, expect } from '@playwright/test';
import { normalizeInput } from '../lib/ownership/normalize';

/** 권한 점검 — 화면 없이 도는 계산(입력 다듬기·조회·패턴·판정·저장) */

test.describe('입력 다듬기', () => {
  const ok = (raw: string) => { const r = normalizeInput(raw); if (!r.ok) throw new Error(raw); return r; };
  test('주소 꼴을 도메인으로', () => {
    expect(ok('  https://www.가게.co.kr/menu?x=1 ').display).toBe('가게.co.kr');
    expect(ok('https://www.가게.co.kr/menu?x=1').domain).toBe(new URL('http://가게.co.kr').hostname);
    expect(ok('Shop.COM').domain).toBe('shop.com');
    expect(ok('me@shop.kr').domain).toBe('shop.kr');
    expect(ok('가게.한국').domain).toMatch(/^xn--/);
    expect(ok('http://shop.com:8080/a').domain).toBe('shop.com');
  });
  test('하위 주소는 등록 도메인으로 자르고 원래 호스트를 남긴다', () => {
    expect(ok('shop.가게.co.kr')).toMatchObject({ display: '가게.co.kr', trimmedFrom: 'shop.가게.co.kr' });
    expect(ok('www.example.com').trimmedFrom).toBeNull();          // www 는 알리지 않는다
    expect(ok('blog.example.com').domain).toBe('example.com');
    expect(ok('a.b.example.co.uk').domain).toBe('example.co.uk');
    expect(ok('가게.seoul.kr').display).toBe('가게.seoul.kr');
  });
  test('빌더 기본 주소', () => {
    expect(ok('abc.imweb.me').builderOnly).toBe('imweb');
    expect(ok('mystore.wixsite.com/home').builderOnly).toBe('wix');
    expect(ok('example.com').builderOnly).toBeNull();
  });
  test('틀린 모양', () => {
    expect(normalizeInput('   ')).toEqual({ ok: false, error: 'empty' });
    expect(normalizeInput('abc')).toEqual({ ok: false, error: 'shape' });
    expect(normalizeInput('a b.com')).toEqual({ ok: false, error: 'shape' });
  });
});

/* ── 조회 ── 가짜 fetch: 주소에 들어 있는 낱말로 고정 응답을 고른다 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lookupAll } from '../lib/ownership/lookup';

const FX = (f: string) => readFileSync(join(__dirname, 'fixtures', 'ownership', f), 'utf8');
type Rule = { match: string; status?: number; file?: string; body?: string; hang?: boolean; throws?: boolean };
function fake(rules: Rule[], calls: string[] = []): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input); calls.push(url);
    const r = rules.find((x) => url.includes(x.match));
    if (!r) return new Response('{}', { status: 404 });
    if (r.throws) throw new TypeError('Failed to fetch');
    if (r.hang) return new Promise<Response>((_, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))));
    return new Response(r.body ?? (r.file ? FX(r.file) : '{}'), { status: r.status ?? 200 });
  }) as typeof fetch;
}
const DNS_OK: Rule[] = [
  { match: 'type=NS', file: 'doh-ns.json' }, { match: 'type=MX', file: 'doh-mx.json' },
  { match: 'type=A&', file: 'doh-a.json' }, { match: 'type=CNAME', file: 'doh-cname.json' },
];

test.describe('조회', () => {
  test('.kr 기관: 등록인·종료일·네임서버·대행자', async () => {
    const l = await lookupAll('kisa.or.kr', { fetch: fake([{ match: 'rdap.nic.or.kr', file: 'rdap-kr-org.json' }, ...DNS_OK]) });
    expect(l.rdap).toMatchObject({ status: 'ok', value: { registrant: '한국인터넷진흥원', registrar: 'KISA' } });
    if (l.rdap.status === 'ok') { expect(l.rdap.value.nameservers).toContain('center.kisa.or.kr'); expect(l.rdap.value.expires).toMatch(/^9999-/); }
  });
  test('.com: 등록인은 null', async () => {
    const l = await lookupAll('prologueand.com', { fetch: fake([{ match: 'rdap.verisign.com', file: 'rdap-com.json' }, ...DNS_OK]) });
    expect(l.rdap).toMatchObject({ status: 'ok', value: { registrant: null, registrar: 'Name.com, Inc.', expires: '2027-10-02T02:32:21Z' } });
    expect(l.ns).toEqual({ status: 'ok', value: ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'] });
    expect(l.mx).toEqual({ status: 'ok', value: ['smtp.google.com'] });
  });
  test('등록인이 없음·빈 값·가림 문자열이면 모두 null', async () => {
    for (const f of ['rdap-kr-hidden-none.json', 'rdap-kr-hidden-empty.json', 'rdap-kr-hidden-mask.json']) {
      const l = await lookupAll('kisa.or.kr', { fetch: fake([{ match: 'rdap.nic.or.kr', file: f }, ...DNS_OK]) });
      expect(l.rdap, f).toMatchObject({ status: 'ok', value: { registrant: null } });
    }
  });
  test('RDAP 404는 notFound', async () => {
    const l = await lookupAll('nothere.com', { fetch: fake([{ match: 'rdap.verisign.com', status: 404 }, ...DNS_OK]) });
    expect(l.rdap).toEqual({ status: 'notFound' });
  });
  test('RDAP 500·이상한 JSON은 failed', async () => {
    const a = await lookupAll('x.com', { fetch: fake([{ match: 'rdap.verisign.com', status: 500 }, ...DNS_OK]) });
    expect(a.rdap).toEqual({ status: 'failed', reason: 'http' });
    const b = await lookupAll('x.com', { fetch: fake([{ match: 'rdap.verisign.com', body: 'not json' }, ...DNS_OK]) });
    expect(b.rdap).toEqual({ status: 'failed', reason: 'shape' });
  });
  test('목록에 없는 최상위 도메인은 RDAP를 부르지 않고 unsupported', async () => {
    const calls: string[] = [];
    const l = await lookupAll('shop.es', { fetch: fake(DNS_OK, calls) });
    expect(l.rdap).toEqual({ status: 'failed', reason: 'unsupported' });
    expect(calls.some((c) => c.includes('rdap'))).toBe(false);
  });
  test('다섯 조회를 동시에 보내고 전체 시간에서 끊는다', async () => {
    const t0 = Date.now();
    const l = await lookupAll('prologueand.com', { fetch: fake([{ match: 'http', hang: true }]), timeoutMs: 300 });
    expect(Date.now() - t0).toBeLessThan(900);
    expect([l.rdap, l.ns, l.mx, l.a, l.cname].every((p) => p.status === 'failed' && p.reason === 'timeout')).toBe(true);
  });
  test('DNS는 Cloudflare 실패 시 구글로 한 번', async () => {
    const calls: string[] = [];
    const l = await lookupAll('prologueand.com', { fetch: fake([{ match: 'cloudflare-dns.com', status: 500 }, { match: 'dns.google', file: 'doh-ns.json' }, { match: 'rdap.verisign.com', file: 'rdap-com.json' }], calls) });
    expect(l.ns).toEqual({ status: 'ok', value: ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'] });
    const ns = calls.filter((c) => c.includes('type=NS'));
    expect(ns[0]).toContain('cloudflare-dns.com'); expect(ns[1]).toContain('dns.google');
  });
  test('fetch가 던지면(CORS·망 차단) network', async () => {
    const l = await lookupAll('prologueand.com', { fetch: fake([{ match: 'http', throws: true }]) });
    expect(l.rdap).toEqual({ status: 'failed', reason: 'network' });
    expect(l.mx).toEqual({ status: 'failed', reason: 'network' });
  });
});
