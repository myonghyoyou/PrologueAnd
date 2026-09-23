'use client';
import { useFitPans, useStations } from './hooks';   // hooks.ts 는 세 훅을 re-export
import { Pan, Para } from './pan';
import { Screen } from './screen';
import type { Case, Project } from '@/content';

export function CaseView({ data, project, next }: { data: Case; project: Project; next?: Project }) {
  useFitPans();
  useStations();
  return (
    <main className="wrap">
      <Pan id="s00" kind="cover" media={<Screen pic={data.hero} />}>
        {/* 표지 글은 Task 7 에서 채운다 */}
      </Pan>
      <Pan id="s01" label="01 OVERVIEW" title={data.s01.h} media={<Screen pic={data.s01.pic} />}>
        <Para lines={data.s01.p} />
      </Pan>
      <Pan id="s06" label="06 SOLUTION" title={data.s06.h} media={<Screen pic={data.s06.screen} />}>
        <Para lines={data.s06.p} />
      </Pan>
      {data.s06.screens.map((sc, i) => (
        <Pan key={sc.lab} id={`s06-${i + 1}`} kind={sc.pic.w < sc.pic.h ? 'phone' : 'text'}
             label={`06 &nbsp;${sc.lab}`} title={sc.h} media={<Screen pic={sc.pic} />}>
          <Para lines={sc.p} />
        </Pan>
      ))}
      {/* 09·10·다음 이야기는 Task 7 의 <Finale /> 한 장으로 들어간다 — 여기에 09 판을 따로 두지 않는다 */}
    </main>
  );
}
