import Link from 'next/link';

export default function Home() {
  return (
    <main className="wrap" style={{ paddingTop: 120, paddingBottom: 80 }}>
      <p className="serif" style={{ fontSize: 40, margin: 0 }}>Prologue&amp;</p>
      <h1 style={{ fontSize: 'clamp(40px,3.2vw,64px)', fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.12, maxWidth: '18em' }}>
        복잡한 업무를<br />단순한 제품으로 바꿉니다.
      </h1>
      <p style={{ fontSize: 18, color: 'var(--bone-700)', maxWidth: '34rem' }}>
        회사 업무 시스템부터 개인 맞춤 개발, 직접 만드는 서비스까지. 만들기 전에 먼저 정리하고, 실제로 쓰일 때까지 함께합니다.
      </p>
      <Link href="/projects" style={{ display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 22px', background: 'var(--navy-800)', color: '#fff', borderRadius: 2, marginTop: 24 }}>
        Projects 보기
      </Link>
    </main>
  );
}
