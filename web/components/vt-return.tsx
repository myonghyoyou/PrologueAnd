'use client';
import { useLayoutEffect } from 'react';

export function VtReturn() {
  useLayoutEffect(() => {
    let slug = '';
    try { slug = sessionStorage.getItem('vt-slug') ?? ''; } catch { return; }
    if (!slug) return;
    try { sessionStorage.removeItem('vt-slug'); } catch { /* 무시 */ }
    const row = document.querySelector<HTMLElement>(`[data-row][data-slug="${CSS.escape(slug)}"] [data-title]`);
    if (!row) return;
    row.style.viewTransitionName = 'pj-title';
    // 전환이 새 화면을 찍은 다음 프레임에 떼야, 목록에 이름이 남아 다음 전환을 막지 않는다
    requestAnimationFrame(() => requestAnimationFrame(() => { row.style.viewTransitionName = ''; }));
  }, []);
  return null;
}
