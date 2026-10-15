import type { Metadata } from 'next';
import { PrintTest } from '@/components/brief/print-test';

/** 앱 안 브라우저(쓰레드 등)에서 인쇄·복사·저장이 되는지 기기에서 확인하는 임시 페이지 — 확인 뒤 지운다 */
export const metadata: Metadata = { title: '기기 시험', robots: { index: false, follow: false } };

export default function Page() {
  return <main style={{ maxWidth: 560, margin: '0 auto', padding: '96px 16px' }}><PrintTest /></main>;
}
