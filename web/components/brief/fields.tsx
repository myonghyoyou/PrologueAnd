'use client';
import { useId, useState } from 'react';
import { Q } from '@/content/brief/questions';
import s from './fields.module.css';

type Opt = readonly string[];

export function Single({ label, opts, value, onChange, name }: { label?: string; opts: Opt; value?: string; onChange: (v: string) => void; name?: string }) {
  const id = useId();
  return (
    <fieldset className={s.set}>
      {label ? <legend className={s.legend}>{label}</legend> : null}
      <div className={s.cards}>
        {opts.map((o) => (
          <label key={o} className={value === o ? `${s.card} ${s.on}` : s.card}>
            <input type="radio" name={name ?? id} value={o} checked={value === o} onChange={() => onChange(o)} className={s.native} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Multi({ label, opts, values, onChange, exclusive }: { label?: string; opts: Opt; values: string[]; onChange: (v: string[]) => void; exclusive?: string }) {
  const toggle = (o: string) => {
    if (o === exclusive) return onChange(values.includes(o) ? [] : [o]);
    const rest = values.filter((v) => v !== exclusive);
    onChange(rest.includes(o) ? rest.filter((v) => v !== o) : [...rest, o]);
  };
  return (
    <fieldset className={s.set}>
      {label ? <legend className={s.legend}>{label}</legend> : null}
      <div className={s.chips}>
        {opts.map((o) => (
          <label key={o} className={values.includes(o) ? `${s.chip} ${s.on}` : s.chip}>
            <input type="checkbox" checked={values.includes(o)} onChange={() => toggle(o)} className={s.native} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TextIn({ label, value, onChange, help, multiline, data, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; help?: string; multiline?: boolean; data?: string; type?: string }) {
  const props = { value, onChange: (e: { target: { value: string } }) => onChange(e.target.value), className: s.input, ...(data ? { [data]: '' } : {}) };
  return (
    <label className={s.text}>
      <span className={s.legend}>{label}</span>
      {multiline ? <textarea rows={3} maxLength={1000} {...props} /> : <input type={type} maxLength={300} {...props} />}
      {help ? <span className={s.help}>{help}</span> : null}
    </label>
  );
}

/** 「견적에 크게 영향」 — 누르면 이유가 펼쳐진다(마우스 올림 말풍선은 폰에서 안 되니 쓰지 않는다) */
export function Impact({ why }: { why: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.impact}>
      <button type="button" className={s.badge} aria-expanded={open} onClick={() => setOpen((o) => !o)} data-impact>{Q.impactBadge}</button>
      {open ? <p className={s.why} data-impact-why>{why}</p> : null}
    </div>
  );
}

export function Seg({ value, onChange }: { value?: 'must' | 'later'; onChange: (v?: 'must' | 'later') => void }) {
  return (
    <div className={s.seg} role="group">
      {(['must', 'later'] as const).map((k) => (
        <button key={k} type="button" aria-pressed={value === k} className={value === k ? s.segOn : ''} data-seg={k}
          onClick={() => onChange(value === k ? undefined : k)}>{k === 'must' ? Q.features.must : Q.features.later}</button>
      ))}
    </div>
  );
}
