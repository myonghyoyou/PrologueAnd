import { NextResponse } from 'next/server';
import { inquirySchema } from '@/lib/inquiry-schema';
import { sendInquiry } from '@/lib/mail';

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
  if (data.website || data.elapsed < 5000) return NextResponse.json({ ok: true, sent: false });

  try {
    await sendInquiry(data);
    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    console.error('inquiry send failed', e);
    return NextResponse.json({ ok: false, error: '보내지 못했습니다' }, { status: 502 });
  }
}
