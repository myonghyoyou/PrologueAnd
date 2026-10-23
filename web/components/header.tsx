import Link from 'next/link';
import { ViewTransitionLink } from './view-transition-link';
import s from './header.module.css';

/** hideContact: 영어 페이지처럼 한국어 문의 서랍으로 이어지면 안 되는 곳에서 「문의」 단추를 숨긴다(기본은 보임) */
type Props = { variant: 'home' | 'list' | 'case' | 'tool'; title?: string; project?: string; hideContact?: boolean };

export function Header({ variant, title, project, hideContact = false }: Props) {
  return (
    <header className={variant === 'home' ? `${s.hdr} ${s.home}` : s.hdr}>
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
        {variant === 'list' ? <span className={s.cur} aria-current="page" data-nav-current>Projects</span> : variant === 'home' ? <Link href="/projects">Projects</Link> : null}
        {hideContact ? null : <button type="button" data-open-drawer data-project={project ?? ''}>문의</button>}
      </nav>
    </header>
  );
}
