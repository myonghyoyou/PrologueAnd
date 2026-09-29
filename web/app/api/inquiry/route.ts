import { NextResponse } from 'next/server';
import { inquirySchema } from '@/lib/inquiry-schema';
import { MailError, mailConfig, sendInquiry } from '@/lib/mail';

/** 발송 설정 확인 — 메일은 보내지 않고, 값 대신 들어 있는지만 알려 준다(앱 비밀번호는 공백을 뺀 길이가 16자여야 한다) */
export async function GET() {
  const { user, pass, to } = mailConfig();
  return NextResponse.json({ user: !!user, pass: !!pass, passLength16: pass.length === 16, to: !!to });
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: '본문을 읽지 못했습니다' }, { status: 400 }); }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력을 확인해주세요';
    return NextResponse.json({ ok: false, error: first }, { status: 400 });
  }
  const data = parsed.data;

  // 봇: 허니팟이 채워졌거나 5초 안에 제출 → 조용히 성공 처리하고 보내지 않는다
  if (data.hp_note || data.elapsed < 5000) return NextResponse.json({ ok: true, sent: false });

  try {
    await sendInquiry(data);
    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    const reason = e instanceof MailError ? e.reason : 'send';
    // Vercel 함수 로그에 이유가 남는다(비밀번호 값은 남기지 않는다)
    console.error('inquiry send failed', reason, e instanceof MailError ? e.detail ?? '' : e);
    return NextResponse.json({ ok: false, error: '보내지 못했습니다', reason }, { status: 502 });
  }
}
