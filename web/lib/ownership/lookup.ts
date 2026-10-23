import type { Fail, Lookup, Part, RdapInfo } from './types';
import { rdapServerFor } from './rdap-servers';

/** 공개 조회는 사장님 브라우저가 직접 한다 — Prologue& 서버를 거치지 않는다 */

type Opt = { fetch?: typeof fetch; timeoutMs?: number; now?: () => Date };
type Got = { ok: true; json: unknown } | { ok: false; status?: number; reason: Fail };

const MASKED = /^(비공개|redacted|data protected|not disclosed|privacy)/i;
const DNS_TYPE = { NS: 2, MX: 15, A: 1, CNAME: 5 } as const;

class Timeout extends Error {}

async function getJson(f: typeof fetch, url: string, accept: string | null, signal: AbortSignal, dead: Promise<never>): Promise<Got> {
  let res: Response;
  try {
    res = await Promise.race([f(url, { signal, headers: accept ? { accept } : undefined }), dead]);
  } catch (e) {
    return { ok: false, reason: e instanceof Timeout || signal.aborted ? 'timeout' : 'network' };
  }
  if (!res.ok) return { ok: false, status: res.status, reason: 'http' };
  try { return { ok: true, json: await Promise.race([res.json(), dead]) }; }
  catch (e) { return { ok: false, reason: e instanceof Timeout ? 'timeout' : 'shape' }; }
}

const unescape = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

type Entity = { roles?: string[]; vcardArray?: [string, [string, unknown, string, string][]]; jscontact_card?: { name?: { full?: string }; localizations?: { ko?: { name?: { full?: string } } } } };

/** 엔티티 이름: (preferKo면 한국어 표기 →) 기본 표기 → vCard fn. 비었거나 가림 표시면 null.
 *  대행자는 기본(영문) 표기를 쓴다 — 패턴 표가 영문 회사 이름으로 맞춘다 */
function entityName(es: Entity[] | undefined, role: string, preferKo: boolean): string | null {
  const e = es?.find((x) => x.roles?.includes(role));
  if (!e) return null;
  const j = e.jscontact_card;
  const fn = e.vcardArray?.[1]?.find((p) => p[0] === 'fn')?.[3];
  const raw = (preferKo ? j?.localizations?.ko?.name?.full : undefined) ?? j?.name?.full ?? j?.localizations?.ko?.name?.full ?? (typeof fn === 'string' ? fn : undefined);
  const v = raw ? unescape(raw).trim() : '';
  return v && !MASKED.test(v) ? v : null;
}

function parseRdap(j: unknown): RdapInfo | null {
  if (!j || typeof j !== 'object') return null;
  const o = j as { entities?: Entity[]; events?: { eventAction?: string; eventDate?: string }[]; nameservers?: { ldhName?: string }[] };
  if (!Array.isArray(o.events) && !Array.isArray(o.nameservers) && !Array.isArray(o.entities)) return null;
  return {
    registrar: entityName(o.entities, 'registrar', false),
    registrant: entityName(o.entities, 'registrant', true),
    expires: o.events?.find((e) => e.eventAction === 'expiration')?.eventDate ?? null,
    nameservers: (o.nameservers ?? []).map((n) => (n.ldhName ?? '').toLowerCase().replace(/\.$/, '')).filter(Boolean),
  };
}

function parseDns(j: unknown, type: keyof typeof DNS_TYPE): string[] | null {
  if (!j || typeof j !== 'object' || typeof (j as { Status?: unknown }).Status !== 'number') return null;
  const o = j as { Status: number; Answer?: { type: number; data: string }[] };
  if (o.Status === 3) return [];   // 그런 이름 없음
  if (o.Status !== 0) return null;  // SERVFAIL 등 — 없다고 단정하지 않고 다음 서버로
  return (o.Answer ?? []).filter((x) => x.type === DNS_TYPE[type])
    .map((x) => (type === 'MX' ? x.data.split(/\s+/).slice(1).join(' ') : x.data).toLowerCase().replace(/\.$/, ''));
}

/** 다섯 조회(RDAP·NS·MX·A·CNAME)를 동시에 보내고 전체 시간(기본 6초)에서 끊는다 */
export async function lookupAll(domain: string, opt: Opt = {}): Promise<Lookup> {
  const f = opt.fetch ?? fetch.bind(globalThis);
  const ctl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const dead = new Promise<never>((_, rej) => { timer = setTimeout(() => { ctl.abort(); rej(new Timeout()); }, opt.timeoutMs ?? 6000); });
  dead.catch(() => {});

  const rdap = async (): Promise<Part<RdapInfo>> => {
    const server = rdapServerFor(domain);
    if (!server) return { status: 'failed', reason: 'unsupported' };
    const g = await getJson(f, `${server}domain/${domain}`, 'application/rdap+json', ctl.signal, dead);
    if (!g.ok) return g.status === 404 ? { status: 'notFound' } : { status: 'failed', reason: g.reason };
    const v = parseRdap(g.json);
    return v ? { status: 'ok', value: v } : { status: 'failed', reason: 'shape' };
  };

  const dns = async (type: keyof typeof DNS_TYPE): Promise<Part<string[]>> => {
    let last: Fail = 'network';
    for (const url of [`https://cloudflare-dns.com/dns-query?type=${type}&name=${domain}`, `https://dns.google/resolve?type=${type}&name=${domain}`]) {
      const g = await getJson(f, url, url.includes('cloudflare') ? 'application/dns-json' : null, ctl.signal, dead);
      if (g.ok) { const v = parseDns(g.json, type); if (v) return { status: 'ok', value: v }; last = 'shape'; continue; }
      last = g.reason;
      if (g.reason === 'timeout') break;
    }
    return { status: 'failed', reason: last };
  };

  const [r, ns, mx, a, cname] = await Promise.all([rdap(), dns('NS'), dns('MX'), dns('A'), dns('CNAME')]);
  clearTimeout(timer);
  return { domain, at: (opt.now?.() ?? new Date()).toISOString(), rdap: r, ns, mx, a, cname };
}
