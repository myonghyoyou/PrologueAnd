import type { Normalized } from './types';
import { TWO_LEVEL } from './suffixes';
import { BUILDER_SUFFIXES } from './providers';

const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;

/** 붙여 넣은 주소·이메일을 조회할 등록 도메인으로 다듬는다 */
export function normalizeInput(raw: string): Normalized {
  let t = raw.trim();
  if (!t) return { ok: false, error: 'empty' };
  if (/\s/.test(t)) return { ok: false, error: 'shape' };
  if (t.includes('@')) t = t.slice(t.lastIndexOf('@') + 1);

  // 화면용 호스트: 스킴·경로·포트를 떼고 소문자(한글은 그대로)
  const typedHost = t.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split(/[/?#]/)[0].replace(/:\d+$/, '').replace(/\.$/, '').toLowerCase();
  let host: string;
  try { host = new URL(`http://${typedHost}`).hostname; } catch { return { ok: false, error: 'shape' }; }
  const labels = host.split('.');
  if (labels.length < 2 || labels.some((l) => !l)) return { ok: false, error: 'shape' };

  const builder = BUILDER_SUFFIXES.find((b) => host === b.suffix || host.endsWith(`.${b.suffix}`));
  if (builder) return { ok: true, domain: host, display: typedHost, trimmedFrom: null, builderOnly: builder.key };

  const keep = labels.length >= 3 && TWO_LEVEL.has(labels.slice(-2).join('.')) ? 3 : 2;
  const domain = labels.slice(-keep).join('.');
  const shown = HANGUL.test(typedHost) ? typedHost.split('.').slice(-keep).join('.') : domain;
  const cut = labels.slice(0, -keep);
  const trimmedFrom = cut.length && !(cut.length === 1 && cut[0] === 'www') ? typedHost : null;
  return { ok: true, domain, display: shown, trimmedFrom, builderOnly: null };
}
