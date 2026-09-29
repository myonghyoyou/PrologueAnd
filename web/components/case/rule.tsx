import type { RuleBlock } from '@/content';
import { rowMaxWidth } from '@/lib/figure-rules';
import { CropView } from './crop-view';
import g from './grid.module.css';
import t from './type.module.css';
import s from './rule.module.css';

const GAP = 16;

/** 같은 부분을 자른 전·후 캡처 한 쌍. 두 칸은 높이를 맞추고(비율만큼 폭을 나눔), 어느 쪽도 원본보다 커지지 않는다 */
export function Rule({ b }: { b: RuleBlock }) {
  const size = (c: RuleBlock['before']) => ({ w: (c.crop.w / 100) * c.w!, h: (c.crop.h / 100) * c.h! });
  const maxWidth = rowMaxWidth([size(b.before), size(b.after)], GAP);
  return (
    <div className={g.g} data-rule>
      <div className={g.noteText}>
        <h3 className={t.h3}>{b.h}</h3>
        {b.p ? <p className={t.p}>{b.p}</p> : null}
      </div>
      <div className={`${g.noteFigs} ${s.pair}`} style={{ maxWidth }}>
        <div className={s.one} style={{ flex: `${(size(b.before).w + 14) / (size(b.before).h + 14)} 1 0` }}><p className={s.tag}>전</p><CropView c={b.before} /></div>
        <div className={s.one} style={{ flex: `${(size(b.after).w + 14) / (size(b.after).h + 14)} 1 0` }}><p className={s.tag}>후</p><CropView c={b.after} /></div>
      </div>
    </div>
  );
}
