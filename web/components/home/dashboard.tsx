'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SCENES, W, H, KNOT_D, MAIN_D, DOTS } from './path';
import { startEngine } from './engine';
import s from './dashboard.module.css';
import { CONTACT_MAIL } from '@/lib/contact';

/** 데스크톱(1024 이상)에서만 경로를 따라 움직인다 — 그 아래는 CSS 가 세로 스택으로 푼다 */
function useDesktop() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(min-width:1024px)');
    const f = () => setOn(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return on;
}

/** 홈: 꼬인 선 하나가 풀려 아홉 장면을 지난다. 화면은 고정, 세계가 선을 따라 흐른다 (시안 design/mockups/v6, docs/22) */
export function Dashboard({ published }: { published: number }) {
  const root = useRef<HTMLDivElement>(null);
  const desktop = useDesktop();

  useEffect(() => {
    if (!desktop || !root.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    return startEngine(root.current, { reduced });
  }, [desktop]);

  return (
    <div ref={root} className={s.root} data-dash>
      <nav className={s.pmap} data-pmap aria-label="장면">
        {SCENES.map((sc, i) => <button key={sc.id} type="button" data-i={i} aria-label={sc.n} />)}
      </nav>

      <div className={s.stage} data-stage>
        <div className={s.world} data-world>
          <svg className={s.path} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <path className={s.knot} data-knot d={KNOT_D} />
            <path className={s.guide} data-guide d={MAIN_D} />
            <path className={s.ink} data-ink d={MAIN_D} />
            {DOTS.map(([x, y]) => <circle key={`${x}-${y}`} className={s.dot} data-dot cx={x} cy={y} r={6} />)}
          </svg>

          {/* 0 Prologue: 헤드라인은 꼬임 왼쪽, 세계에 직접 */}
          <section className={`${s.scene} ${s.hero}`} id="p00">
            <h1 className={s.hl}>복잡한 업무를<br /><em>단순한 제품</em>으로<br />바꿉니다.</h1>
            <p className={s.sub}>회사 업무 시스템부터 개인 맞춤 개발, 직접 만드는 서비스까지. 만들기 전에 먼저 정리하고, 실제로 쓰일 때까지 함께합니다.</p>
            <div className={s.cta}>
              <button type="button" className={s.btn} data-open-drawer>프로젝트 문의 <i className={s.tri} /></button>
              <a className={`${s.btn} ${s.o}`} href="#p06" data-go="6">작업 보기 →</a>
            </div>
            <span className={s.hint}>휠을 굴리거나 → 키를 누르면 다음 장으로</span>
          </section>

          <section className={`${s.scene} ${s.pan}`} id="p01" data-pan>
            <div className={s.shapeArea}><div className={`${s.shape} ${s.ring}`}><i style={{ width: '52%', paddingTop: '52%', left: '46%', top: 0 }} /></div></div>
            <div className={s.txt}><h2 className={`${s.hl} ${s.hl2}`}>만들기 전에,<br />무엇이 불편한지부터.</h2><p className={s.sub}>업무가 어디서 들어오고, 누가 같은 내용을 몇 번씩 옮겨 적는지부터 확인합니다. 그중 없어도 되는 단계를 먼저 뺍니다.</p></div>
          </section>
          <section className={`${s.scene} ${s.pan}`} id="p02" data-pan>
            <div className={s.shapeArea}><div className={`${s.shape} ${s.glyph}`}><i>&amp;</i></div></div>
            <div className={s.txt}><h2 className={`${s.hl} ${s.hl2}`}>설계한 사람이<br />직접 만듭니다.</h2><p className={s.sub}>화면 설계부터 개발까지 중간에 다른 사람에게 넘기지 않습니다. 처음 정리한 내용이 그대로 제품이 됩니다.</p></div>
          </section>
          <section className={`${s.scene} ${s.pan}`} id="p03" data-pan>
            <div className={s.shapeArea}><div className={`${s.shape} ${s.flag}`}><i /></div></div>
            <div className={s.txt}><h2 className={`${s.hl} ${s.hl2}`}>출시했다고<br />끝이 아닙니다.</h2><p className={s.sub}>실제로 쓰기 시작하면 처음엔 보이지 않던 불편이 나옵니다. 쓰는 사람에게 듣고 다음 버전에 반영합니다.</p></div>
          </section>
          <section className={`${s.scene} ${s.pan}`} id="p04" data-pan>
            <div className={s.shapeArea}><div className={s.shape}>
              <i style={{ left: '46%', top: '4%', width: '22%', height: '30%' }} /><i style={{ left: '72%', top: '14%', width: '22%', height: '30%' }} />
              <i style={{ left: '52%', top: '42%', width: '22%', height: '30%' }} /><i style={{ left: '78%', top: '50%', width: '22%', height: '30%' }} />
            </div></div>
            <div className={s.txt}><h2 className={`${s.hl} ${s.hl2}`}>회사든,<br />개인이든.</h2><p className={s.sub}>팀이 함께 쓰는 업무 시스템도, 혼자 쓰는 작은 도구도 만듭니다. 개발 용어를 몰라도 지금 불편한 점만 말씀해 주시면 됩니다.</p></div>
          </section>
          <section className={`${s.scene} ${s.pan}`} id="p05" data-pan>
            <div className={s.shapeArea}><div className={`${s.shape} ${s.grid}`}><i style={{ left: '44%', top: '6%', width: '52%', height: '86%' }} /></div></div>
            <div className={s.txt}><h2 className={`${s.hl} ${s.hl2}`}>지금은<br />어느 쪽인가요?</h2><p className={s.sub}>쓰던 시스템이 불편한지, 엑셀과 종이로 하고 있는지, 아이디어만 있는지에 따라 시작하는 자리가 다릅니다.</p></div>
          </section>
          {/* 무엇을 칩 3개는 점 왼쪽에 세계 직접. 카메라가 점을 지나면 켜진다 */}
          <div className={`${s.scene} ${s.node}`} data-node><span>고치기</span><small>쓰던 시스템을 고칩니다</small></div>
          <div className={`${s.scene} ${s.node}`} data-node><span>옮기기</span><small>엑셀·종이·메신저로 하던 일을 웹으로</small></div>
          <div className={`${s.scene} ${s.node}`} data-node><span>만들기</span><small>아이디어를 첫 제품으로</small></div>
          <section className={`${s.scene} ${s.pan}`} id="p06" data-pan>
            <div className={s.shapeArea}><div className={s.shape}>
              <i style={{ left: '44%', top: '6%', width: '16%', height: '22%' }} /><i style={{ left: '66%', top: '16%', width: '16%', height: '22%' }} />
              <i style={{ left: '52%', top: '44%', width: '16%', height: '22%' }} /><i style={{ left: '78%', top: '50%', width: '16%', height: '22%' }} />
              <i style={{ left: '36%', top: '60%', width: '12%', height: '16%' }} /><i style={{ left: '88%', top: '2%', width: '10%', height: '14%' }} />
            </div></div>
            <div className={s.txt}><h2 className={`${s.hl} ${s.hl2}`}>작업<br /><span data-published>{published}</span>건.</h2><p className={s.sub}>프로젝트마다 무엇이 불편했고 무엇을 바꿨는지 실제 화면과 함께 적었습니다. 나머지도 정리되는 대로 올립니다.</p></div>
            <div className={s.below}><Link className={s.btn} href="/projects">Projects 보기 <i className={s.tri} /></Link></div>
          </section>
          <section className={`${s.scene} ${s.pan}`} id="p07" data-pan>
            <div className={s.txt}><h2 className={`${s.hl} ${s.hl3}`}>어떤 일이<br /><em>불편한지</em><br />알려주세요.</h2><p className={s.sub}>지금 상황을 한두 줄로 적어 보내 주세요. 이틀 안에 메일로 답장드립니다.</p></div>
            <div className={s.below}><button type="button" className={s.btn} data-open-drawer>프로젝트 문의하기 <i className={s.tri} /></button><a className={s.mail} href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a></div>
          </section>

          {/* 8 — & — : 선이 끝에 닿아 멈추면 Prologue 아래에 & 가 떠오른다 */}
          <section className={`${s.scene} ${s.end}`} id="p08">
            <p className={s.footTop}>Prologue</p>
            <p className={s.footAmp} aria-hidden="true">&amp;</p>
            <p className={s.footCap}>and, 그리고 end. 처음과 끝을 함께합니다.</p>
          </section>
        </div>
      </div>

      <footer className={s.ft}>
        <nav><Link href="/projects">Projects</Link><a href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a><button type="button" data-open-drawer>문의</button></nav>
        <span>© 2026 Prologue&amp;</span>
      </footer>
    </div>
  );
}
