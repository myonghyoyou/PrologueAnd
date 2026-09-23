export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--bone-200)', padding: '24px 0 40px', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--bone-500)', marginTop: 48 }}>
      <nav style={{ display: 'flex', gap: 20 }}>
        <a href="/projects">Projects</a>
        <a href="mailto:PrologueAnd@gmail.com">PrologueAnd@gmail.com</a>
        <button type="button" data-open-drawer style={{ background: 'none', border: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0 }}>문의</button>
      </nav>
      <span>© 2026 Prologue&amp;</span>
    </footer>
  );
}
