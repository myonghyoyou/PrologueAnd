'use client';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import s from './select.module.css';

type Props = { name: string; label: string; options: readonly string[]; placeholder?: string };

/** 고르기 칸 — 기본 select 대신. 폼에는 숨은 input(name)으로 값이 실린다.
 *  목록 상자(listbox) 패턴: 버튼에서 ↓·Enter·Space 로 열고, ↑↓·Home·End 로 옮기고, Enter·Space 로 고르고, Esc·Tab·바깥 클릭으로 닫는다.
 *  Esc 는 preventDefault 해서 서랍(문의)이 같이 닫히지 않게 한다 — 서랍은 defaultPrevented 를 보고 넘긴다 */
export function Select({ name, label, options, placeholder = '고르지 않음' }: Props) {
  const id = useId();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);            // 목록에서 가리키는 칸(0 = 고르지 않음)
  const [up, setUp] = useState(false);                // 아래 자리가 모자라면 위로 연다
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const all = ['', ...options];

  const show = (at = Math.max(0, all.indexOf(value))) => {
    const b = btn.current!.getBoundingClientRect(), box = btn.current!.closest('[data-lenis-prevent]')?.getBoundingClientRect();
    const h = list.current?.scrollHeight ?? 0, bottom = box ? box.bottom : innerHeight;
    setUp(b.bottom + 6 + h > bottom && b.top - 6 - h > (box ? box.top : 0));
    setActive(at); setOpen(true);
  };
  const close = (focus = true) => { setOpen(false); if (focus) btn.current?.focus(); };
  const pick = (i: number) => { setValue(all[i]); close(); };

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close(false); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);
  // 열리면 목록에 초점, 가리키는 칸이 보이게
  useEffect(() => { if (open) list.current?.focus(); }, [open]);
  useEffect(() => { if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [open, active]);

  const onBtnKey = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show(); }
  };
  const onListKey = (e: KeyboardEvent) => {
    const n = all.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(n - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(n - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(active); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') close(false);
  };

  return (
    <div ref={root} className={s.sel} data-select={name} data-open={open ? '' : undefined}>
      <span id={`${id}-l`} className={s.lab}>{label}</span>
      <input type="hidden" name={name} value={value} />
      <button ref={btn} type="button" id={`${id}-b`} className={s.btn} aria-haspopup="listbox" aria-expanded={open}
              aria-labelledby={`${id}-l ${id}-b`} onClick={() => (open ? close() : show())} onKeyDown={onBtnKey}>
        <span className={value ? s.val : `${s.val} ${s.ph}`}>{value || placeholder}</span>
        <svg className={s.chev} viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <ul ref={list} className={up ? `${s.list} ${s.up}` : s.list} role="listbox" tabIndex={-1} aria-labelledby={`${id}-l`}
          aria-activedescendant={open ? `${id}-o${active}` : undefined} onKeyDown={onListKey} inert={!open}>
        {all.map((o, i) => (
          <li key={o || '-'} id={`${id}-o${i}`} role="option" aria-selected={o === value} data-active={i === active ? '' : undefined}
              className={o ? s.opt : `${s.opt} ${s.none}`} style={{ ['--i' as string]: i }}
              onPointerEnter={() => setActive(i)} onClick={() => pick(i)}>
            <span>{o || placeholder}</span>
            <svg className={s.check} viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.2 4.8 9 10 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
          </li>
        ))}
      </ul>
    </div>
  );
}
