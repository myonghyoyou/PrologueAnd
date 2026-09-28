import { CONTACT_MAIL } from '@/lib/contact';
import s from './footer.module.css';

export function Footer() {
  return (
    <footer className={s.ft} data-footer>
      <nav>
        <a href="/projects">Projects</a>
        <a href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a>
        <button type="button" data-open-drawer>문의</button>
      </nav>
      <span>© 2026 Prologue&amp;</span>
    </footer>
  );
}
