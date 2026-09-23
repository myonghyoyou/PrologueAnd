import Link from 'next/link';
import { ViewTransitionLink } from './view-transition-link';
import s from './header.module.css';

type Props = { variant: 'home' | 'list' | 'case'; title?: string; project?: string };

export function Header({ variant, title, project }: Props) {
  return (
    <header className={s.hdr}>
      <Link className={s.brand} data-brand href="/" aria-label="Prologue&">
        Prologue<span className={s.amp}>&amp;</span>
      </Link>
      {variant === 'case' && title ? <span className={s.who}>{title}</span> : null}
      {variant === 'case' ? (
        <ViewTransitionLink className={s.back} data-back href="/projects" aria-label="Projects 목록으로">
          <i aria-hidden="true" /><span>Projects</span>
        </ViewTransitionLink>
      ) : null}
      <nav className={s.nav}>
        {variant === 'list' ? <span className={s.cur}>Projects</span> : variant === 'home' ? <Link href="/projects">Projects</Link> : null}
        <button type="button" data-open-drawer data-project={project ?? ''}>문의</button>
      </nav>
    </header>
  );
}
