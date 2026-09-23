'use client';
import { useRef, type ReactNode } from 'react';
import { useDwell } from './hooks';

export function Dwell({ steps, children }: { steps: 2 | 3; children: (t: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useDwell(ref, steps);
  return (
    <div ref={ref} data-dwell={steps} data-t={t.toFixed(3)} style={{ position: 'relative', paddingBottom: '120vh' }}>
      {children(t)}
    </div>
  );
}
