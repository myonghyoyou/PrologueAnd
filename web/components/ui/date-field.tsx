'use client';
import { useEffect, useState, type Ref } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale/ko';
import 'react-datepicker/dist/react-datepicker.css';
import s from './date-field.module.css';

registerLocale('ko', ko);

const pad = (n: number) => String(n).padStart(2, '0');
/** 저장은 「2026-11-15」 — 시간대에 흔들리지 않게 그 기기의 날짜 그대로 */
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (v: string) => { const [y, m, d] = v.split('-').map(Number); return y && m && d ? new Date(y, m - 1, d) : null; };
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const show = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;

type TriggerProps = { label: string; text: string; ref?: Ref<HTMLButtonElement> } & Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onKeyDown' | 'onFocus' | 'onBlur' | 'id' | 'disabled' | 'tabIndex'>;
/** 입력칸 대신 단추 — 폰에서 키보드가 올라오지 않고, 누르면 달력이 펼쳐진다.
 *  달력이 넘기는 value(자기 형식 날짜)는 쓰지 않고 한국어 표시(text)를 쓴다. 키보드·포커스 처리는 그대로 이어 준다(Esc 로 닫기 등) */
function Trigger({ label, text, ref, onClick, onKeyDown, onFocus, onBlur, id, disabled, tabIndex }: TriggerProps) {
  return (
    <button type="button" ref={ref} id={id} disabled={disabled} tabIndex={tabIndex} onClick={onClick} onKeyDown={onKeyDown} onFocus={onFocus} onBlur={onBlur}
      className={text ? s.trigger : `${s.trigger} ${s.empty}`} aria-label={`${label}: ${text || '고르지 않음'}`}>
      <span>{text || '날짜를 골라 주세요'}</span>
      <span className={s.icon} aria-hidden="true" />
    </button>
  );
}

/** 사이트 공통 날짜 고르기 — react-datepicker 를 사이트 기준(모서리 2px·괘선·네이비)으로 다시 칠한다.
 *  넓은 화면은 칸 아래로 펼치고, 폰은 화면 가운데 띄운다(가장자리에서 잘리지 않게) */
export function DateField({ label, value, onChange, help, minToday = true }: { label: string; value: string; onChange: (v: string) => void; help?: string; minToday?: boolean }) {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width:700px)');
    const on = () => setPhone(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const selected = value ? fromIso(value) : null;
  return (
    <div className={s.field} data-date-field>
      <span className={s.label}>{label}</span>
      <DatePicker
        selected={selected}
        onChange={(d: Date | null) => onChange(d ? toIso(d) : '')}
        locale="ko"
        minDate={minToday ? new Date() : undefined}
        customInput={<Trigger label={label} text={selected ? show(selected) : ''} />}
        calendarClassName={s.cal}
        popperClassName={s.popper}
        popperPlacement="bottom-start"
        showPopperArrow={false}
        withPortal={phone}
        portalId="date-field-portal"
        formatWeekDay={(d) => d.slice(0, 1)}
        renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
          <div className={s.head}>
            <button type="button" className={s.nav} onClick={decreaseMonth} disabled={prevMonthButtonDisabled} aria-label="이전 달"><i className={s.prev} /></button>
            <span className={s.title} data-cal-title>{date.getFullYear()}년 {date.getMonth() + 1}월</span>
            <button type="button" className={s.nav} onClick={increaseMonth} disabled={nextMonthButtonDisabled} aria-label="다음 달"><i className={s.next} /></button>
          </div>
        )}
      />
      {help ? <span className={s.help}>{help}</span> : null}
    </div>
  );
}
