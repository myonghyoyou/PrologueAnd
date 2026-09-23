import type { ReactNode } from 'react';
import s from './pan.module.css';

type Props = { id: string; kind?: 'cover' | 'text' | 'phone'; label?: string; title?: string; children?: ReactNode; media?: ReactNode };

export function Pan({ id, kind = 'text', label, title, children, media }: Props) {
  const txt = label || title || children ? (
    <div className={s.txt} data-text>
      {label ? <span className={s.label} dangerouslySetInnerHTML={{ __html: label }} /> : null}
      {title ? <h2 className={s.h2} dangerouslySetInnerHTML={{ __html: title }} /> : null}
      {children}
    </div>
  ) : null;
  const mediaEl = media ? <div className={s.media} data-media>{media}</div> : null;

  return (
    <section id={id} className={`${s.pan} ${kind === 'cover' ? s.cover : ''}`} data-pan={kind}>
      {kind === 'cover' ? (
        <>
          {mediaEl}
          {txt}
        </>
      ) : (
        <>
          {txt}
          {mediaEl}
        </>
      )}
    </section>
  );
}

export function Para({ lines }: { lines: string[] }) {
  return <>{lines.map((t, i) => <p key={i} className={s.p} dangerouslySetInnerHTML={{ __html: t }} />)}</>;
}
