'use client';
import type { Answers, StepId } from '@/lib/brief/types';

export function Result(_: { a: Answers; onEdit: (s: StepId) => void; onReset: () => void }) {
  return <div data-brief-result />;
}
