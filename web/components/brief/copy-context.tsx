'use client';
import { createContext, useContext, useMemo } from 'react';
import { copyFor, type BriefCopy, type Locale } from '@/content/brief/copy';

/** 요청서 화면 글자 — 기본값을 두지 않는다. Provider 밖에서 부르면 바로 예외가 나서 빠뜨린 곳이 드러난다 */
const Ctx = createContext<BriefCopy | null>(null);

export function BriefCopyProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const c = useMemo(() => copyFor(locale), [locale]);
  return <Ctx.Provider value={c}>{children}</Ctx.Provider>;
}

export function useCopy(): BriefCopy {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCopy must be called inside BriefCopyProvider');
  return c;
}
