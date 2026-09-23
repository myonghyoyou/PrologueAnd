'use client';
import { useState } from 'react';
import { useFitPans, useStations } from './hooks';   // hooks.ts 는 세 훅을 re-export
import { Pan, Para } from './pan';
import { Screen } from './screen';
import { CoverText } from './cover';
import { SpotList, SpotOverlay } from './hotspots';
import { Finale } from './finale';
import { MorphDiagram } from './morph-diagram';
import { Dwell } from './dwell';
import type { Case, Project } from '@/content';

export function CaseView({ data, project, next }: { data: Case; project: Project; next?: Project }) {
  useFitPans();
  useStations();
  const [spot, setSpot] = useState(-1);
  const STEPS = [
    { lab: '03 &nbsp;EXISTING WORKFLOW', h: data.s03.h, p: data.s03.p[0] },
    { lab: '04 &nbsp;INSIGHT', h: data.s04.q, p: data.s04.p[0] },
    { lab: '05 &nbsp;REDESIGN', h: data.s05.h, p: data.s05.p[0] },
  ];
  return (
    <main className="wrap">
      <Pan id="s00" kind="cover" media={<Screen pic={data.hero} />}>
        <CoverText data={data} project={project} />
      </Pan>
      <Pan id="s01" label="01 OVERVIEW" title={data.s01.h} media={<Screen pic={data.s01.pic} />}>
        <Para lines={data.s01.p} />
      </Pan>
      <Pan id="s02" label="02 PROBLEM" title={data.s02.h} media={<MorphDiagram t={0} />}>
        <Para lines={data.s02.p} />
      </Pan>
      <Dwell steps={3}>
        {(t) => {
          const k = t < 0.34 ? 0 : t < 0.67 ? 1 : 2;
          return (
            <Pan id="s03" label={STEPS[k].lab} title={STEPS[k].h} media={<MorphDiagram t={t} />}>
              <Para lines={[STEPS[k].p]} />
              {/* 05 에서만: 새 길의 다섯 단계를 글 아래 한 줄로 */}
              {k === 2 ? (
                <ol data-flow style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, margin: '12px 0 0', padding: 0, fontSize: 'clamp(13px,.95vw,16px)', color: 'var(--navy-800)' }}>
                  {data.s05.flow.map((f, i) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ border: '1px solid var(--navy-200)', borderRadius: 2, padding: '5px 10px', background: 'var(--bone-0)' }}>{f}</span>
                      {i < data.s05.flow.length - 1 ? <span style={{ color: 'var(--bone-400)' }}>→</span> : null}
                    </li>
                  ))}
                </ol>
              ) : null}
            </Pan>
          );
        }}
      </Dwell>
      <Pan id="s06" label="06 SOLUTION" title={data.s06.h}
           media={<Screen pic={data.s06.screen}><SpotOverlay spots={data.s06.spots} active={spot} /></Screen>}>
        <Para lines={data.s06.p} />
        <SpotList spots={data.s06.spots} active={spot} onHover={setSpot} />
      </Pan>
      {data.s06.screens.map((sc, i) => (
        <Pan key={sc.lab} id={`s06-${i + 1}`} kind={sc.pic.w < sc.pic.h ? 'phone' : 'text'}
             label={`06 &nbsp;${sc.lab}`} title={sc.h} media={<Screen pic={sc.pic} />}>
          <Para lines={sc.p} />
        </Pan>
      ))}
      <Finale data={data} next={next} slug={project.slug} />
    </main>
  );
}
