'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';

type VTDoc = Document & { startViewTransition?: (arg: unknown) => { finished: Promise<void> } };
const NAME = 'pj-title';

/** 문서에 pj-title 이 둘 이상이면 전환이 통째로 무시된다 — 항상 전부 지우고 하나만 붙인다 */
export function clearNames() {
  document.querySelectorAll<HTMLElement>('[data-title]').forEach((el) => { el.style.viewTransitionName = ''; });
}

export function startVT(update: () => void | Promise<void>, types?: string[]) {
  const doc = document as VTDoc;
  if (!doc.startViewTransition) { update(); return null; }
  try { return doc.startViewTransition(types ? { update, types } : update); }
  catch { return doc.startViewTransition(update); }   // 구버전은 콜백만 받는다
}

type Props = {
  href: string; className?: string; children: ReactNode;
  shareTitle?: boolean;      // 클릭 직전 이 행의 [data-title] 에만 이름을 붙인다
  slug?: string;             // 돌아올 때 같은 행을 찾기 위해 남긴다
  vtType?: 'to-case';        // 상세 → 상세: 제목 morph 없이 root 페이드만
};

export function ViewTransitionLink({ href, className, children, shareTitle, slug, vtType, ...rest }: Props) {
  const router = useRouter();

  const mark = (e: PointerEvent<HTMLAnchorElement>) => {
    if (!shareTitle) return;
    clearNames();
    const t = e.currentTarget.querySelector<HTMLElement>('[data-title]');
    if (t) t.style.viewTransitionName = NAME;
  };

  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const doc = document as VTDoc;
    if (!doc.startViewTransition) return;      // 미지원 브라우저는 기본 이동 — 장식이다
    e.preventDefault();
    if (slug) { try { sessionStorage.setItem('vt-slug', slug); } catch { /* 사생활 보호 창 */ } }
    const vt = startVT(async () => {
      router.push(href);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));   // 새 화면이 그려진 뒤 스냅샷
    }, vtType ? [vtType] : undefined);
    vt?.finished.finally(clearNames);
  };

  return <Link href={href} className={className} onPointerDown={mark} onClick={go} {...rest}>{children}</Link>;
}
