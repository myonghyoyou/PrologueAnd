import type { Facts, ItemState, Lookup, Normalized } from './types';
import { matchHost, matchMail, matchNs, matchRegistrar, providerByKey } from './providers';

const DAY = 86_400_000;

/** 기한이 없는 도메인 — 기관 도메인 등은 사용 종료일이 9999년으로 등록돼 있다 */
export const noExpiry = (iso: string) => new Date(iso).getUTCFullYear() >= 9000;

/** 사용 종료일 판정 — 지남·30일 안 = 위험, 90일 안 = 확인 필요. 기준 날짜는 인자로 받는다(저장해 두지 않는다) */
export function expiryState(iso: string, now: Date): { state: ItemState; days: number } {
  const days = Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY);
  return { state: days <= 30 ? 'risk' : days <= 90 ? 'check' : 'ok', days };
}

/** 조회 결과(없으면 null)를 판정에 쓰는 사실로 바꾼다 */
export function interpret(n: Extract<Normalized, { ok: true }>, l: Lookup | null, now: Date): Facts {
  const rdap = l?.rdap.status === 'ok' ? l.rdap.value : null;
  const builderOnly = n.builderOnly;
  const exp = rdap?.expires && !Number.isNaN(Date.parse(rdap.expires)) ? rdap.expires : null;

  const registrarRaw = rdap?.registrar ?? null;
  const registrar = matchRegistrar(registrarRaw);
  const nsRaw = l?.ns.status === 'ok' && l.ns.value.length ? l.ns.value : rdap?.nameservers ?? [];
  const nsProvider = matchNs(nsRaw);
  const nsDiffers = registrar && nsProvider ? (registrar.key === nsProvider.key ? 'no' : 'yes') : 'unknown';

  // 빌더 기본 주소의 메일 설정은 빌더 회사 것이라 사장님 메일을 알 수 없다
  const mail = builderOnly || !l || l.mx.status !== 'ok' ? 'unknown' : matchMail(l.mx.value);

  const fromDns = l ? matchHost(l.a.status === 'ok' ? l.a.value : [], l.cname.status === 'ok' ? l.cname.value : []) : null;
  const host = builderOnly ? providerByKey(builderOnly) : fromDns ?? (nsProvider?.kinds.includes('builder') ? nsProvider : null);

  return {
    unsupported: l?.rdap.status === 'failed' && l.rdap.reason === 'unsupported',
    builderOnly,
    expiry: exp && !builderOnly ? { date: exp, state: expiryState(exp, now).state } : null,
    registrar, registrarRaw,
    registrant: rdap?.registrant ?? null,
    nsProvider, nsRaw, nsDiffers,
    mail,
    host,
    isBuilder: !!builderOnly || !!host?.kinds.includes('builder'),
  };
}
