'use client';
import { useState } from 'react';
import { useFitPans, useStations } from './hooks';   // hooks.ts 는 세 훅을 re-export
import { Pan, Para } from './pan';
import { Screen } from './screen';
import { CoverText } from './cover';
import { SpotList, SpotOverlay } from './hotspots';
import { Finale } from './finale';
import type { Case, Project } from '@/content';

export function CaseView({ data, project, next }: { data: Case; project: Project; next?: Project }) {
  useFitPans();
  useStations();
  const [spot, setSpot] = useState(-1);
  return (
    <main className="wrap">
      <Pan id="s00" kind="cover" media={<Screen pic={data.hero} />}>
        <CoverText data={data} project={project} />
      </Pan>
      <Pan id="s01" label="01 OVERVIEW" title={data.s01.h} media={<Screen pic={data.s01.pic} />}>
        <Para lines={data.s01.p} />
      </Pan>
      <Pan id="s06" label="06 SOLUTION" title={data.s06.h}
           media={<Screen pic={data.s06.screen}><SpotOverlay spots={data.s06.spots} active={spot} /></Screen>}>
        <Para lines={data.s06.p} />
        <SpotList spots={data.s06.spots} onHover={setSpot} />
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
