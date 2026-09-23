'use client';
import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { notifyPath } from '@/lib/route-commit';

/** 새 경로가 DOM 에 커밋된 순간(레이아웃 효과)을 lib/route-commit 에 알린다 — 뷰 전환 update 가 이것을 기다린다 */
export function RouteCommit() {
  const path = usePathname();
  useLayoutEffect(() => { notifyPath(path); }, [path]);
  return null;
}
