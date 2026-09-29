import nodemailer from 'nodemailer';
import type { InquiryInput } from './inquiry-schema';

const ROWS: [keyof InquiryInput, string][] = [
  ['need', '무엇이 필요한지'], ['pain', '지금 상황'], ['people', '누가 쓰나요'],
  ['goal', '이렇게 됐으면'], ['when', '언제까지'], ['budget', '예산'],
  ['email', '이메일'], ['phone', '전화'], ['project', '보고 온 프로젝트'],
];

/** 실패 이유 — config: 환경변수 없음 · auth: Gmail 로그인 실패(앱 비밀번호) · send: 그 밖의 발송 실패 */
export type MailFail = 'config' | 'auth' | 'send';
export class MailError extends Error {
  constructor(readonly reason: MailFail, message: string, readonly detail?: string) { super(message); }
}

/** 환경변수를 읽는다. 구글은 앱 비밀번호를 "abcd efgh ijkl mnop"처럼 띄어 보여 주고, 그대로 붙여 넣으면 로그인이 거절된다 — 공백을 뺀다 */
export function mailConfig() {
  const user = process.env.GMAIL_USER?.trim() || '';
  const pass = (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s+/g, '');
  const to = process.env.INQUIRY_TO?.trim() || user;
  return { user, pass, to };
}

export async function sendInquiry(input: InquiryInput): Promise<void> {
  const { user, pass, to } = mailConfig();
  if (!user || !pass || !to) throw new MailError('config', '메일 환경변수가 없습니다');

  const text = ROWS
    .map(([k, label]) => {
      const raw = input[k];
      const v = Array.isArray(raw) ? raw.join(', ') : String(raw ?? '');
      return v ? `${label}\n${v}\n` : '';
    })
    .filter(Boolean)
    .join('\n');

  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  try {
    await transport.sendMail({
      from: `Prologue& <${user}>`,
      to,
      replyTo: input.email,
      subject: `[문의] ${input.pain.slice(0, 30)}${input.project ? ` · ${input.project}` : ''}`,
      text,
    });
  } catch (e) {
    const err = e as { code?: string; responseCode?: number; response?: string; message?: string };
    const auth = err.code === 'EAUTH' || err.responseCode === 535 || err.responseCode === 534;
    throw new MailError(auth ? 'auth' : 'send', auth ? 'Gmail 로그인 실패' : '발송 실패', `${err.code ?? ''} ${err.responseCode ?? ''} ${err.response ?? err.message ?? ''}`.trim());
  }
}
