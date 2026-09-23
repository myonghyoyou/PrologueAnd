import type { Block } from '@/content';
import { Frame } from './frame';
import g from './grid.module.css';

/** 블록 한 개. 종류가 늘면 case 를 더한다 */
export function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case 'figure':
      return (
        <div className={g.g}>
          <div className={b.slot === 'wide' ? g.wide : g.body}>
            <Frame fig={b.fig} sizes={b.slot === 'wide' ? '(max-width:1023px) 100vw, 1343px' : '(max-width:1023px) 100vw, 900px'} />
          </div>
        </div>
      );
    default:
      return null;
  }
}
