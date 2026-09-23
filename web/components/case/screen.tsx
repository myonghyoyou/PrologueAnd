import Image from 'next/image';
import type { Pic } from '@/content';

export function Screen({ pic, children }: { pic: Pic; children?: React.ReactNode }) {
  return (
    <>
      <div
        data-fit="shot"
        style={{ position: 'relative', width: 'var(--dw, 100%)', maxWidth: '100%', aspectRatio: `${pic.w + 12} / ${pic.h + 12}`,
                 background: 'var(--bone-0)', border: '1px solid var(--bone-900)', padding: 6, boxSizing: 'border-box' }}
      >
        <Image src={pic.src} alt={pic.alt} width={pic.w} height={pic.h} sizes="(max-width:1023px) 100vw, 1120px"
               style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left' }} />
        {children}
      </div>
      <span data-cap style={{ display: 'block', marginTop: 8, fontSize: 'clamp(12px,.9vw,15px)', color: 'var(--bone-500)', width: 'var(--dw, 100%)', maxWidth: '100%' }}>
        {pic.cap}
      </span>
    </>
  );
}
