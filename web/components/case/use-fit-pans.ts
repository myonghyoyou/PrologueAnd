'use client';
import { useEffect } from 'react';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function useFitPans() {
  useEffect(() => {
    const desktop = () => window.matchMedia('(min-width:1024px)').matches;

    const once = () => {
      document.querySelectorAll<HTMLElement>('[data-pan]').forEach((pan) => {
        const kind = pan.dataset.pan;

        // 마지막 판: 티저 그림이 남는 높이를 쓴다 (시안 case.js:66)
        if (kind === 'finale') {
          const img = pan.querySelector<HTMLElement>('[data-teaser-img]');
          if (!img) return;
          if (!desktop()) { img.style.height = ''; img.style.width = ''; return; }
          const used = [...pan.children]
            .filter((k) => !(k as HTMLElement).hasAttribute('data-teaser'))
            .reduce((a, k) => a + (k as HTMLElement).offsetHeight, 0);
          const h = clamp(pan.clientHeight - 56 - used - 48 - 40, 140, 320);
          img.style.height = `${h}px`;
          img.style.width = `${Math.round(h * 1.6)}px`;
          return;
        }

        const box = pan.querySelector<HTMLElement>('[data-media]');
        if (!box) return;
        const targets = box.querySelectorAll<HTMLElement>(':scope > [data-fit]');
        if (!targets.length) return;
        if (!desktop()) {
          targets.forEach((t) => t.style.removeProperty('--dw'));
          pan.style.removeProperty('--tw');
          return;
        }

        const padT = parseFloat(getComputedStyle(pan).paddingTop) || 0;
        const cap = box.querySelector<HTMLElement>(':scope > [data-cap]');
        const capH = cap ? cap.offsetHeight + 8 : 0;

        let h: number;
        if (kind === 'cover') {
          const title = pan.querySelector<HTMLElement>('[data-cover-title]');
          h = Math.min(pan.clientHeight * 0.62,
                       pan.clientHeight - padT - 32 - 28 - (title?.offsetHeight ?? 0)) - capH;
        } else {
          const txt = pan.querySelector<HTMLElement>('[data-text]');
          // 폰 판은 캡션까지 한 번 더 빼야 넘치지 않는다 (시안 case.js:72)
          h = pan.clientHeight - padT - 40 - (txt?.offsetHeight ?? 0) - (kind === 'phone' ? capH : 0);
        }

        targets.forEach((t) => {
          const w = t.dataset.fit === 'dia'
            ? (h - 48) * (640 / 360)
            : (h - (kind === 'cover' ? 0 : capH) - 12) * (kind === 'phone' ? 390 / 844 : 1280 / 800);
          const dw = Math.max(kind === 'phone' ? 150 : 280, Math.min(box.clientWidth, w));
          t.style.setProperty('--dw', `${Math.round(dw)}px`);
          pan.style.setProperty('--tw',
            kind === 'phone' ? `${Math.min(box.clientWidth, 704)}px` : `${Math.round(dw)}px`);
        });
      });
    };

    const run = () => { once(); once(); };   // 문단 폭(--tw)과 그림 폭(--dw)이 서로 영향을 주므로 두 번
    run();
    document.fonts?.ready.then(run);
    const ro = new ResizeObserver(run);
    ro.observe(document.body);
    window.addEventListener('resize', run);
    const late = setTimeout(run, 300);       // 이미지 디코딩 뒤 한 번 더 (시안 case.js:84)
    return () => { clearTimeout(late); ro.disconnect(); window.removeEventListener('resize', run); };
  }, []);
}
