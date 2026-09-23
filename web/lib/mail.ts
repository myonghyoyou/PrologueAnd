import nodemailer from 'nodemailer';
import type { InquiryInput } from './inquiry-schema';

const ROWS: [keyof InquiryInput, string][] = [
  ['work', '지금 하는 일'], ['tools', '쓰는 것'], ['pain', '가장 불편한 점'],
  ['people', '쓰는 사람'], ['repeat', '얼마나 자주'], ['kind', '고치기 / 새로 만들기'],
  ['goal', '이렇게 됐으면'], ['when', '언제까지'], ['budget', '예산'],
  ['email', '이메일'], ['phone', '전화'], ['project', '보고 온 프로젝트'],
];

export async function sendInquiry(input: InquiryInput): Promise<void> {
  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.INQUIRY_TO || user;
  if (!user || !pass || !to) throw new Error('메일 환경변수가 없습니다');

  const text = ROWS
    .map(([k, label]) => {
      const raw = input[k];
      const v = Array.isArray(raw) ? raw.join(', ') : String(raw ?? '');
      return v ? `${label}\n${v}\n` : '';
    })
    .filter(Boolean)
    .join('\n');

  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transport.sendMail({
    from: `Prologue& <${user}>`,
    to,
    replyTo: input.email,
    subject: `[문의] ${input.pain.slice(0, 30)}${input.project ? ` · ${input.project}` : ''}`,
    text,
  });
}
