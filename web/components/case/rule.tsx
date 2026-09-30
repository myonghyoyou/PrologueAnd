import type { RuleBlock } from '@/content';
import { rowMaxWidth } from '@/lib/figure-rules';
import { CropView } from './crop-view';
import g from './grid.module.css';
import t from './type.module.css';
import s from './rule.module.css';

const GAP = 16;

/** 같은 부분을 자른 캡처 한 쌍. 두 칸은 높이를 맞추고(비율만큼 폭을 나눔), 어느 쪽도 원본보다 커지지 않는다.
 *  h 가 없으면 글 칸을 그리지 않고 본문과 같은 왼쪽 선(넓은 칸)에 한 쌍과 캡션을 둔다 */
export function Rule({ b }: { b: RuleBlock }) {
  const size = (c: RuleBlock['before']) => ({ w: (c.crop.w / 100) * c.w!, h: (c.crop.h / 100) * c.h! });
  const maxWidth = rowMaxWidth([size(b.before), size(b.after)], GAP);
  const [t0, t1] = b.tags ?? ['전', '후'];
  const one = (c: RuleBlock['before'], tag: string) => (
    // 높이를 정확히 맞춘다: 틀 여백(14px)은 기본 폭으로, 남는 폭은 자른 영역의 가로세로 비율대로 나눈다 → 높이 = (폭-14)/비율 + 14 가 두 칸 같음
    <div className={s.one} style={{ flex: `${size(c).w / size(c).h} 1 14px` }}>
      <p className={s.tag} data-rule-tag>{tag}</p><CropView c={c} />
    </div>
  );
  const pair = (
    <div className={s.col} style={{ maxWidth }}>
      <div className={s.pair}>{one(b.before, t0)}{one(b.after, t1)}</div>
      {b.caption ? <p className={s.cap} data-rule-cap>{b.caption}</p> : null}
    </div>
  );
  if (!b.h) return <div className={g.g} data-rule><div className={g.wide}>{pair}</div></div>;
  return (
    <div className={g.g} data-rule>
      <div className={g.noteText} data-note-text>
        <h3 className={t.h3}>{b.h}</h3>
        {b.p ? <p className={t.p}>{b.p}</p> : null}
      </div>
      <div className={`${g.noteFigs} ${s.withText}`}>{pair}</div>
    </div>
  );
}
