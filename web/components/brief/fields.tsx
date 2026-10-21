'use client';
import { useId } from 'react';
import { Q } from '@/content/brief/questions';
import { ChoiceRow, Tag, ui } from '@/components/ui/controls';
import s from './fields.module.css';

type Opt = readonly string[];

/** 하나 고르기 — 기본은 괘선 줄, compact(기능 아래 이어 질문·명의처럼 덜 중요한 선택)는 각진 칸 한 줄 */
export function Single({ label, opts, value, onChange, name, compact }: { label?: string; opts: Opt; value?: string; onChange: (v: string) => void; name?: string; compact?: boolean }) {
  const id = useId();
  const Item = compact ? Tag : ChoiceRow;
  return (
    <fieldset className={s.set}>
      {label ? <legend className={s.legend}>{label}</legend> : null}
      <div className={compact ? `${ui.tags} ${ui.small}` : ui.rows}>
        {opts.map((o) => (
          <Item key={o} type="radio" name={name ?? id} value={o} checked={value === o} onChange={() => onChange(o)}>{o}</Item>
        ))}
      </div>
    </fieldset>
  );
}

/** 여러 개 고르기 — 각진 칸. exclusive(「없어요」처럼 다른 답과 같이 고를 수 없는 것)를 고르면 나머지를 지운다 */
export function Multi({ label, opts, values, onChange, exclusive }: { label?: string; opts: Opt; values: string[]; onChange: (v: string[]) => void; exclusive?: string }) {
  const toggle = (o: string) => {
    if (o === exclusive) return onChange(values.includes(o) ? [] : [o]);
    const rest = values.filter((v) => v !== exclusive);
    onChange(rest.includes(o) ? rest.filter((v) => v !== o) : [...rest, o]);
  };
  return (
    <fieldset className={s.set}>
      {label ? <legend className={s.legend}>{label} <span className={ui.cap}>· 여러 개 골라도 돼요</span></legend> : null}
      <div className={ui.tags}>
        {opts.map((o) => <Tag key={o} type="checkbox" checked={values.includes(o)} onChange={() => toggle(o)}>{o}</Tag>)}
      </div>
    </fieldset>
  );
}

/** 켜고 끄는 한 가지 — 체크 네모 줄 */
export function Check({ label, checked, onChange, data }: { label: string; checked: boolean; onChange: (v: boolean) => void; data?: string }) {
  return (
    <div className={`${ui.rows} ${s.check}`}>
      <label className={ui.choice} data-choice>
        <input type="checkbox" className={ui.native} checked={checked} onChange={(e) => onChange(e.target.checked)} {...(data ? { [data]: '' } : {})} />
        <span className={ui.box} data-mark aria-hidden="true" />
        <span className={ui.lb}>{label}</span>
      </label>
    </div>
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

/** 「견적가에 크게 영향」 — 이유를 늘 펼쳐 둔다. 읽지 않고 넘어가 나중에 「왜 이렇게 비싸졌나」 하지 않게(사용자 피드백 2026-10-21) */
export function Impact({ why }: { why: string }) {
  return (
    <div className={s.impact} data-impact>
      <p className={s.badge}>{Q.impactBadge}</p>
      <p className={s.why} data-impact-why>{why}</p>
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

/** 고른 답에 딸린 질문 — 왼쪽 네이비 세로선(GOV.UK 조건부 질문) */
export function Follow({ children }: { children: React.ReactNode }) {
  return <div className={s.follow} data-follow>{children}</div>;
}
