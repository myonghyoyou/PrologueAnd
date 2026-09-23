import type { Block } from '@/content';
import { Flow } from './flow';
import { Frame } from './frame';
import { Note } from './note';
import { Phones } from './phones';
import { Quote } from './quote';
import { WipeView } from './wipe';
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
    case 'note':
      return <Note b={b} />;
    case 'phones':
      return <Phones b={b} />;
    case 'quote':
      return <Quote b={b} />;
    case 'flow':
      return <Flow b={b} />;
    case 'wipe':
      return <WipeView b={b} />;
  }
}
