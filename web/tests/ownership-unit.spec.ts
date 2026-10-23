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

/* ── 업체 패턴 ── */
import { PROVIDERS, matchRegistrar, matchNs, matchMail, matchHost } from '../lib/ownership/providers';

test.describe('업체 패턴', () => {
  test('대행자와 네임서버를 회사 키로', () => {
    expect(matchRegistrar('Name.com, Inc.')?.key).toBe('namecom');
    expect(matchNs(['ns1.vercel-dns.com', 'ns2.vercel-dns.com'])?.key).toBe('vercel');
  });
  test('모르는 값은 null(지어내지 않음)', () => {
    expect(matchNs(['ns1.example.net'])).toBeNull();
    expect(matchRegistrar('Some Registrar LLC')).toBeNull();
    expect(matchRegistrar(null)).toBeNull();
    expect(matchHost(['203.0.113.7'], [])).toBeNull();
  });
  test('메일', () => {
    expect(matchMail(['smtp.google.com'])).toMatchObject({ key: 'google' });
    expect(matchMail([])).toBe('none');
  });
  test('null MX는 메일 없음', () => { expect(matchMail(['.'])).toBe('none'); expect(matchMail([''])).toBe('none'); });
  test('모든 로그인 주소는 https, 키는 겹치지 않음', () => {
    for (const p of PROVIDERS) if (p.login) expect(p.login).toMatch(/^https:\/\//);
    expect(new Set(PROVIDERS.map((p) => p.key)).size).toBe(PROVIDERS.length);
  });
});

/* ── 규칙과 문구 ── */
import { QUESTIONS } from '../content/ownership/rules';
import { ko, en } from '../content/ownership/copy';

test.describe('규칙과 문구', () => {
  test('모르겠어요는 언제나 check', () => { for (const q of QUESTIONS) if (q.opts.includes('unknown')) expect(q.judge.unknown, q.id).toBe('check'); });
  test('모든 질문·선택지에 두 언어 문구가 있다', () => {
    for (const c of [ko, en]) for (const q of QUESTIONS) {
      expect(c.q[q.id].title.length, q.id).toBeGreaterThan(0);
      for (const o of q.opts) expect(c.q[q.id].opts[o]?.length ?? 0, `${q.id}.${o}`).toBeGreaterThan(0);
    }
  });
  test('영어 문구에 한글이 없다', () => { expect(JSON.stringify(en)).not.toMatch(/[가-힣]/); });
  test('문구에 낫표·RDAP 낱말 없음', () => { for (const c of [ko, en]) expect(JSON.stringify(c)).not.toMatch(/[「」]|RDAP/); });
});

/* ── 해석과 판정 ── */
import { interpret } from '../lib/ownership/interpret';
import { visibleQuestions, items, headline, vendorMessage, sheetRows, fill } from '../lib/ownership/verdict';
import type { Lookup, Normalized } from '../lib/ownership/types';

const NOW = new Date('2026-10-23T00:00:00Z');
const norm = (s: string) => normalizeInput(s) as Extract<Normalized, { ok: true }>;
const withExp = (l: Lookup, iso: string | null): Lookup =>
  l.rdap.status === 'ok' ? { ...l, rdap: { status: 'ok', value: { ...l.rdap.value, expires: iso } } } : l;
const comLookup = () => lookupAll('prologueand.com', { fetch: fake([{ match: 'rdap.verisign.com', file: 'rdap-com.json' }, ...DNS_OK]) });
const plusDays = (d: number) => new Date(NOW.getTime() + d * 86400000).toISOString();

test.describe('해석과 판정', () => {
  test('종료일: 지남·20일·60일·400일', async () => {
    const l = await comLookup();
    const st = (d: number) => interpret(norm('prologueand.com'), withExp(l, plusDays(d)), NOW).expiry?.state;
    expect([st(-3), st(20), st(60), st(400)]).toEqual(['risk', 'risk', 'check', 'ok']);
  });
  test('종료일이 없으면 종료일 항목이 없다', async () => {
    const l = await lookupAll('prologueand.com', { fetch: fake([{ match: 'rdap.verisign.com', file: 'rdap-noexp.json' }, ...DNS_OK]) });
    const f = interpret(norm('prologueand.com'), l, NOW);
    expect(f.expiry).toBeNull();
    expect(items(f, {}).map((i) => i.id)).not.toContain('expiry');
  });
  test('네임서버 회사 키: 다름·같음·모름', async () => {
    const l = await comLookup();                                // 대행자 Name.com · 네임서버 Vercel
    const f = interpret(norm('prologueand.com'), l, NOW);
    expect(f.nsDiffers).toBe('yes');
    expect(visibleQuestions(f)).toContain('dnsLogin');
    const same = interpret(norm('prologueand.com'), { ...l, ns: { status: 'ok', value: ['ns1.name.com'] } }, NOW);
    expect(same.nsDiffers).toBe('no');
    expect(visibleQuestions(same)).not.toContain('dnsLogin');
    const unk = interpret(norm('prologueand.com'), { ...l, ns: { status: 'ok', value: ['ns1.example.net'] } }, NOW);
    expect(unk.nsDiffers).toBe('unknown');
    expect(visibleQuestions(unk)).toContain('dnsLogin');
    expect(unk.nsRaw).toEqual(['ns1.example.net']);
  });
  test('메일·호스팅 추정', async () => {
    const f = interpret(norm('prologueand.com'), await comLookup(), NOW);
    expect(f.mail).toMatchObject({ key: 'google' });
    expect(f.registrar?.key).toBe('namecom');
    const nullMx = interpret(norm('prologueand.com'), { ...(await comLookup()), mx: { status: 'ok', value: ['.'] } }, NOW);
    expect(nullMx.mail).toBe('none');
    expect(visibleQuestions(nullMx)).not.toContain('mailAdmin');
    const failed = interpret(norm('prologueand.com'), { ...(await comLookup()), mx: { status: 'failed', reason: 'timeout' } }, NOW);
    expect(failed.mail).toBe('unknown');
  });
  test('빌더 기본 주소: ownDomain 이 check, 등록대행자 질문 없음', () => {
    const f = interpret(norm('abc.imweb.me'), null, NOW);
    expect(f.builderOnly).toBe('imweb');
    expect(f.isBuilder).toBe(true);
    const qs = visibleQuestions(f);
    expect(qs).not.toContain('registrarLogin');
    expect(qs).toContain('builderAccount');
    expect(qs).not.toContain('backup');
    expect(items(f, {})[0]).toEqual({ id: 'ownDomain', state: 'check', value: null });
    expect(items(f, {}).map((i) => i.id)).not.toContain('registrarLogin');
  });
  test('지원 안 되는 도메인: 자동 항목 없이 질문만', async () => {
    const l = await lookupAll('shop.es', { fetch: fake(DNS_OK) });
    const f = interpret(norm('shop.es'), l, NOW);
    expect(f.unsupported).toBe(true);
    expect(f.expiry).toBeNull();
    expect(visibleQuestions(f)).toContain('registrarLogin');
  });
  test('items는 보이는 질문의 답만 쓴다', async () => {
    const l = await comLookup();
    const differs = interpret(norm('prologueand.com'), l, NOW);
    expect(items(differs, { dnsLogin: 'no' }).find((i) => i.id === 'dnsLogin')?.state).toBe('risk');
    const same = interpret(norm('prologueand.com'), { ...l, ns: { status: 'ok', value: ['ns1.name.com'] } }, NOW);
    const list = items(same, { dnsLogin: 'no' });
    expect(list.map((i) => i.id)).not.toContain('dnsLogin');
    expect(headline(list).kind).not.toBe('risk');
  });
  test('판정 한 줄과 순서', async () => {
    const f = interpret(norm('prologueand.com'), withExp(await comLookup(), plusDays(400)), NOW);
    const list = items(f, { registrarLogin: 'no', hostLogin: 'unknown', adminAccount: 'no', selfEdit: 'yes' });
    expect(list.slice(0, 3).map((i) => i.state)).toEqual(['risk', 'risk', 'check']);
    expect(list.filter((i) => i.state === 'ok').map((i) => i.id)).toEqual(['expiry', 'selfEdit']);
    expect(headline(list)).toEqual({ kind: 'risk', n: 2 });
    const all = (over: Record<string, string>) => Object.fromEntries(visibleQuestions(f).map((q) => [q, over[q] ?? (q === 'renewalCard' || q === 'mailAdmin' || q === 'mapAdmin' ? 'mine' : 'yes')])) as never;
    expect(headline(items(f, all({ hostLogin: 'unknown', registrarLogin: 'unknown', selfEdit: 'no' })))).toEqual({ kind: 'check', n: 3 });
    expect(headline(items(f, all({})))).toEqual({ kind: 'ok', n: 0 });
  });
  test('요청 문구: 위험·확인 필요만, Prologue 없음, 두 언어', async () => {
    const f = interpret(norm('prologueand.com'), withExp(await comLookup(), plusDays(400)), NOW);
    const list = items(f, { registrarLogin: 'no', selfEdit: 'yes', backup: 'unknown' });
    for (const c of [ko, en]) {
      const m = vendorMessage(list, f, c, 'prologueand.com');
      expect(m.startsWith(c.vendor.intro)).toBe(true);
      expect(m).toContain(fill(c.vendor.lines.registrarLogin, { d: 'prologueand.com' }));
      expect(m).toContain(c.vendor.lines.backup);
      expect(m).not.toContain(c.vendor.lines.selfEdit);
      expect(m).not.toContain(c.vendor.lines.expiry.slice(0, 8));
      expect(m).not.toContain('Prologue');
      expect(m.trim().endsWith(c.vendor.outro)).toBe(true);
    }
    expect(vendorMessage(list, f, en, 'prologueand.com')).not.toMatch(/[가-힣]/);
  });
  test('정리표: 로그인 주소는 아는 것만, 아는 값은 채운다', async () => {
    const f = interpret(norm('prologueand.com'), await comLookup(), NOW);
    const rows = sheetRows(f, ko, 'ko', 'prologueand.com');
    const by = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(by.domain.where).toBe('prologueand.com');
    expect(by.registrar).toMatchObject({ where: 'Name.com', login: 'https://www.name.com/account/login' });
    expect(by.dns.where).toBe('Vercel');
    expect(by.mail.where).toBe('Google Workspace');
    expect(by.map).toMatchObject({ where: '', login: null });
    expect(rows.map((r) => r.key)).toEqual(['domain', 'registrar', 'expiry', 'dns', 'host', 'mail', 'map', 'admin', 'backup', 'contract']);
  });
});

/* ── 기기 저장 ── */
import { loadOwnership, saveOwnership, clearOwnership, ownershipStorageOk, type Saved } from '../lib/ownership/storage';

class MemStore implements Storage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}
const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } } as unknown as Storage;

test.describe('기기 저장', () => {
  test('저장하고 다시 불러온다(요청서 키와 다른 키)', async () => {
    const s = new MemStore();
    const v: Saved = { v: 1, input: 'prologueand.com', lookup: await comLookup(), answers: { registrarLogin: 'no' }, step: 'q:hostLogin', done: false };
    expect(saveOwnership(s, v)).toBe(true);
    expect([...s.m.keys()]).toEqual(['prologue.ownership.v1']);
    expect(loadOwnership(s)).toEqual(v);
    clearOwnership(s);
    expect(loadOwnership(s)).toBeNull();
  });
  test('버전이 다르거나 깨진 값은 버린다', () => {
    const s = new MemStore();
    s.setItem('prologue.ownership.v1', '{not json'); expect(loadOwnership(s)).toBeNull();
    s.setItem('prologue.ownership.v1', JSON.stringify({ v: 2, input: 'a.com', lookup: null, answers: {}, step: 'domain', done: false })); expect(loadOwnership(s)).toBeNull();
    s.setItem('prologue.ownership.v1', JSON.stringify({ v: 1, input: 5, lookup: null, answers: {}, step: 'domain', done: false })); expect(loadOwnership(s)).toBeNull();
  });
  test('모르는 질문·선택지 답은 그 답만 버린다', () => {
    const s = new MemStore();
    s.setItem('prologue.ownership.v1', JSON.stringify({ v: 1, input: 'a.com', lookup: null, answers: { hostLogin: 'yes', nope: 'yes', backup: 'maybe' }, step: 'domain', done: false }));
    expect(loadOwnership(s)?.answers).toEqual({ hostLogin: 'yes' });
  });
  test('저장이 막힌 저장소', () => {
    expect(saveOwnership(broken, { v: 1, input: '', lookup: null, answers: {}, step: 'domain', done: false })).toBe(false);
    expect(loadOwnership(broken)).toBeNull();
    expect(ownershipStorageOk(broken)).toBe(false);
    expect(ownershipStorageOk(null)).toBe(false);
    expect(() => clearOwnership(broken)).not.toThrow();
  });
  test('불러온 뒤 사용 종료일 판정은 지금 날짜로', async () => {
    const s = new MemStore();
    const l = withExp(await comLookup(), '2026-12-01T00:00:00Z');
    saveOwnership(s, { v: 1, input: 'prologueand.com', lookup: l, answers: {}, step: 'result', done: true });
    const raw = s.getItem('prologue.ownership.v1')!;
    expect(raw).not.toMatch(/"state"/);                               // 판정 값은 저장하지 않는다
    const back = loadOwnership(s)!;
    expect(interpret(norm('prologueand.com'), back.lookup, new Date('2026-09-01T00:00:00Z')).expiry?.state).toBe('ok');
    expect(interpret(norm('prologueand.com'), back.lookup, new Date('2026-11-15T00:00:00Z')).expiry?.state).toBe('risk');
  });
});

/* ── 문구 검사 ── 공개 저장소: 금지 낱말(저장소 밖 목록)·낫표를 점검기 파일 전부에서 확인한다 */
import { readdirSync } from 'node:fs';
import { bannedWords } from './banned';

test('점검기 파일에 금지 낱말·낫표가 없다', () => {
  const root = join(__dirname, '..');
  const comp = readdirSync(join(root, 'components/ownership')).filter((f) => f.endsWith('.tsx')).map((f) => `components/ownership/${f}`);
  const files = ['content/ownership/copy/ko.ts', 'content/ownership/copy/en.ts', 'content/ownership/rules.ts', 'lib/ownership/verdict.ts', 'lib/ownership/providers.ts',
    'app/tools/ownership/page.tsx', 'app/en/tools/ownership/page.tsx', ...comp];
  expect(comp.length).toBeGreaterThan(4);
  const words = bannedWords();
  for (const f of files) {
    const t = readFileSync(join(root, f), 'utf8');
    expect(t, f).not.toMatch(/[「」]/);
    if (words) for (const w of words) expect(t.includes(w), `${f}: ${w}`).toBe(false);
  }
});

/* ── 최종 검토 뒤 고친 것 ── */
test.describe('최종 검토 수정', () => {
  test('답하지 않은 보이는 질문은 확인 필요로 센다', async () => {
    const f = interpret(norm('prologueand.com'), withExp(await comLookup(), plusDays(400)), NOW);
    const list = items(f, {});
    expect(headline(list).kind).toBe('check');
    expect(list.find((i) => i.id === 'registrarLogin')).toEqual({ id: 'registrarLogin', state: 'check', value: null });
  });
  test('영어 판정 한 줄은 하나일 때 단수', async () => {
    const { headlineText } = await import('../lib/ownership/verdict');
    expect(headlineText({ kind: 'risk', n: 1 }, en)).toBe("There's 1 thing you can't do without your web company right now");
    expect(headlineText({ kind: 'check', n: 1 }, en)).toBe('1 thing to check before you could run your site on your own');
    expect(headlineText({ kind: 'risk', n: 2 }, en)).toBe("There are 2 things you can't do without your web company right now");
    expect(headlineText({ kind: 'risk', n: 1 }, ko)).toBe('지금은 업체 없이 할 수 없는 일이 1가지 있어요');
  });
  test('DNS가 SERVFAIL이면 메일 없음이 아니라 다음 서버로', async () => {
    const fail = JSON.stringify({ Status: 2 });
    const calls: string[] = [];
    const l = await lookupAll('prologueand.com', { fetch: fake([{ match: 'cloudflare-dns.com', body: fail }, { match: 'dns.google', file: 'doh-mx.json' }, { match: 'rdap.verisign.com', file: 'rdap-com.json' }], calls) });
    expect(l.mx).toEqual({ status: 'ok', value: ['smtp.google.com'] });
    const both = await lookupAll('prologueand.com', { fetch: fake([{ match: 'type=MX', body: fail }, { match: 'rdap.verisign.com', file: 'rdap-com.json' }]) });
    expect(both.mx).toEqual({ status: 'failed', reason: 'shape' });
  });
  test('조회 결과 일부가 깨진 저장 값은 조회 결과를 버린다', () => {
    const s = new MemStore();
    s.setItem('prologue.ownership.v1', JSON.stringify({ v: 1, input: 'a.com', lookup: { domain: 'a.com', at: 'x', rdap: { status: 'notFound' } }, answers: {}, step: 'lookup', done: false }));
    const v = loadOwnership(s)!;
    expect(v.lookup).toBeNull();
    expect(() => interpret(norm('a.com'), v.lookup, NOW)).not.toThrow();
  });
});

test('기한이 없는 도메인(9999년)은 정리표에 기한 없음', async () => {
  const l = await lookupAll('kisa.or.kr', { fetch: fake([{ match: 'rdap.nic.or.kr', file: 'rdap-kr-org.json' }, ...DNS_OK]) });
  const f = interpret(norm('kisa.or.kr'), l, NOW);
  expect(f.expiry?.state).toBe('ok');
  expect(sheetRows(f, ko, 'ko', 'kisa.or.kr').find((r) => r.key === 'expiry')?.where).toBe(ko.lookup.expiry.none);
  expect(sheetRows(f, en, 'en', 'kisa.or.kr').find((r) => r.key === 'expiry')?.where).toBe(en.lookup.expiry.none);
});
