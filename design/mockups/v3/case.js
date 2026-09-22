/* Case Study 상세 — G안 렌더·동작 (docs/28). 데이터는 V3.cases[slug] (docs/25 §4). */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desktop = () => matchMedia('(min-width:1024px)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* ---------- 데이터 ---------- */
  const slug = new URLSearchParams(location.search).get('p');
  const pj = V3.project(slug) || V3.project('por-favor-harry');
  const D = V3.cases[pj.slug] || V3.cases['por-favor-harry'];
  const sample = !V3.cases[pj.slug];   // 다른 slug: 같은 본문에 제목만 (docs/25 전제)
  const title = sample ? pj.tagline : D.title;
  const nextSlug = D.s10.next && D.s10.next !== pj.slug ? D.s10.next : null;
  const next = (nextSlug && V3.project(nextSlug)) || V3.projects.find(p => p.slug !== pj.slug);
  document.title = `Prologue & ${pj.title}`;
  document.getElementById('hd-title').textContent = pj.title;
  document.getElementById('hd-ask').dataset.project = pj.slug;

  /* ---------- 렌더 ---------- */
  const pic = (s, cls) => s.type === 'live'
    ? `<div class="shot live ${cls || ''}" data-src="${s.src}" title="${esc(s.cap || '')}"></div>`
    : `<div class="shot img ${cls || ''}"><img src="${s.src}" alt="${esc(s.cap || '')}" loading="lazy" onerror="this.remove()"></div>`;
  const P = ps => (ps || []).map(t => `<p>${t}</p>`).join('');
  const hasBefore = !!D.s07.before;
  const nums = D.numbers.map(n => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('');
  document.getElementById('main').innerHTML = `
    <div class="g-cover" id="s00">${pic(D.hero)}<span class="capn">${esc(D.hero.cap)}</span></div>
    <div class="g-title">
      <div><span class="cap">Prologue <span class="amp" style="font-size:14px">&amp;</span> ${esc(pj.title)} · ${esc(D.cap)}${sample ? ' · <span style="color:var(--warning)">본문은 Por favor, Harry 예시(시안)</span>' : ''}</span>
        <h1 class="h1x">${title}</h1>
        <div class="metarow">${D.meta.map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join('')}</div></div>
      <div class="knums" id="nums0">${nums}</div>
    </div>
    <section class="g-panel" id="s01"><div><span class="nlab">01 OVERVIEW</span><h2>${D.s01.h || '업무 요청을 받아 처리하는<br>담당자를 위한 도구'}</h2>${P(D.s01.p)}</div><div class="dia" data-morph data-t="0"></div></section>
    <section class="g-panel" id="s02"><div><span class="nlab">02 PROBLEM</span><h2>${D.s02.h || '네 갈래로 흩어져<br>들어온 요청'}</h2>${P(D.s02.p)}</div><div>${hasBefore ? pic(D.s07.before) + `<span class="capn">${esc(D.s07.before.cap)}</span>` : pic(D.hero)}</div></section>
    <div class="g-dwell" data-dwell><div class="g-stick">
      <section class="g-panel txt" id="s03"><div><span class="nlab">03 · 04 · 05 &nbsp;EXISTING WORKFLOW → INSIGHT → REDESIGN</span><h2>${esc(D.s04.q).replace(/, /, ',<br>')}</h2><p>${D.s03.p[0]} ${D.s05.flow.join(' → ')}.</p></div></section>
      <div class="g-full dw"><div class="dia" data-morph data-scrub></div></div>
    </div></div>
    <section class="g-panel txt" id="s06"><div><span class="nlab">06 SOLUTION</span><h2>${D.s06.h || '필수 항목을 채워야<br>보낼 수 있는 양식'}</h2>${P(D.s06.p)}
      ${D.s06.spots ? `<ul class="spots" id="spots">${D.s06.spots.map((s, i) => `<li data-i="${i}"><b>${i + 1}</b><span>${esc(s.cap)}</span></li>`).join('')}</ul>` : ''}</div></section>
    <div class="g-full" id="solbox">${pic(D.s06.screen, 'spotted')}<span class="capn">${esc(D.s06.screen.cap)}</span></div>
    ${hasBefore
      ? `<div class="g-dwell" data-dwell data-wipe><div class="g-stick">
          <section class="g-panel txt" id="s07"><div><span class="nlab">07 BEFORE &amp; AFTER</span><h2>${D.s07.h || '길 네 개가 하나로'}</h2>${P(D.s07.p)}</div></section>
          <div class="g-wipe dw"><div class="stack">${pic(D.s07.before)}${pic(D.s07.after, 'after')}<i class="edge"></i></div><div class="wcaps"><span class="wb">${esc(D.s07.before.cap)}</span><span class="wa" style="opacity:.35">${esc(D.s07.after.cap)}</span></div></div>
        </div></div>`
      : `<section class="g-panel txt" id="s07"><div><span class="nlab">07 BEFORE &amp; AFTER</span><h2>${D.s07.h || '길 네 개가 하나로'}</h2>${P(D.s07.p)}</div></section><div class="g-full">${pic(D.s07.after)}<span class="capn">${esc(D.s07.after.cap)}</span></div>`}
    <section class="g-panel txt" id="s08"><div><span class="nlab">08 IMPACT</span>
      <div class="impact2" id="nums8">${D.numbers.map(n => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span><small>${esc(n.small || '')}</small></div>`).join('')}</div>
      ${D.s08.bars && D.s08.bars.some(b => b.before > 0) ? `<div class="bars" id="bars">${D.s08.bars.filter(b => b.before > 0).map(b => `<div class="bar" style="--w:${Math.round(b.after / b.before * 100)}%"><div class="lbl"><span>${esc(b.label)}</span><span>${b.before}${esc(b.unit || '')} → ${b.after}${esc(b.unit || '')}</span></div><div class="tr"><i></i></div></div>`).join('')}</div>` : ''}</div></section>
    <section class="g-panel" id="s09"><div><span class="nlab">09 WHAT I LEARNED</span><h2>${D.s09.h || '도구보다 길부터'}</h2>${P(D.s09.p)}</div>
      <div id="s10"><span class="nlab">10</span><h2>비슷한 문제가 있다면</h2>${P(D.s10.p)}<div class="cta"><a class="btn" href="#" data-open-drawer data-project="${pj.slug}">이 프로젝트를 보고 문의하기 <i class="tri"></i></a><a class="mail link" href="mailto:hello@prologue.and">hello@prologue.and</a></div></div></section>
    <div class="teaser"><div><span class="cap">다음 이야기</span><a class="big" href="case.html?p=${next.slug}" id="next-link">${esc(next.title)}</a><p style="margin:0;color:var(--bone-700)">${esc(next.tagline)}</p></div><a href="case.html?p=${next.slug}" class="shot img"><img src="${V3.img(next)}" alt="${esc(next.title)}" loading="lazy" onerror="this.remove()"></a></div>
    <footer class="ft"><nav><a href="projects.html">Projects</a><a href="mailto:hello@prologue.and">hello@prologue.and</a><a href="#" data-open-drawer>문의</a></nav><span>© 2026 Prologue&amp;</span></footer>`;

  /* ---------- 라이브 화면: 폭에 맞춰 축소(원본보다 키우지 않음), 화면에 가까워지면 로드 ---------- */
  function fit() { document.querySelectorAll('.shot.live').forEach(el => { const w = el.clientWidth - 12; if (w <= 0) return; const sc = Math.min(1, w / 1280); el.style.setProperty('--sc', sc.toFixed(4)); el.style.height = (800 * sc + 12) + 'px'; }); }
  function lazy() { document.querySelectorAll('.shot.live').forEach(el => { if (el.querySelector('iframe')) return; const r = el.getBoundingClientRect(); if (r.top < innerHeight * 2 && r.bottom > -innerHeight) el.insertAdjacentHTML('afterbegin', `<iframe src="${el.dataset.src}" tabindex="-1" aria-label="${esc(el.title)}" loading="lazy"></iframe>`); }); }
  fit(); lazy(); addEventListener('resize', () => { fit(); onScroll(); });

  /* ---------- 다이어그램 03→05 morph (docs/28 G5): data-t 고정 또는 data-scrub(화면 안 위치 = t, 핀 없음) ---------- */
  const src = [40, 80, 120, 160], names = ['전화', '메신저', '이메일', '직접 방문'];
  const B = src.map((y, i) => [120 + i * 30, y + (i % 2 ? -50 : 50), 220, 100 + (i - 1.5) * 24, 300, 100]);
  const A = src.map(y => [110, y, 130, 100, 160, 100]);
  const lerp = (a, b, t) => a + (b - a) * t;
  const chain = [[160, '개인 링크'], [270, '요청폼'], [380, '심사 Queue'], [480, '약속일'], [580, '상태 공유']];
  document.querySelectorAll('[data-morph]').forEach(d => {
    d.innerHTML = `<svg viewBox="0 0 640 220">${src.map((y, i) => `<text x="34" y="${y + 4}" text-anchor="end">${names[i]}</text>`).join('')}${src.map((y, i) => `<path class="before" data-i="${i}" d=""/>`).join('')}<g class="mb"><path class="before" d="M300 100 H520"/><circle class="node" cx="300" cy="100" r="4" style="stroke:#8A96C2"/><text x="300" y="124" text-anchor="middle">담당자가 정리·기억</text><path class="before" d="M514 94 l12 12 M526 94 l-12 12"/><text x="520" y="124" text-anchor="middle">몰입 중단</text></g><g class="ma"><path class="after mchain" d="M160 100 H566"/>${chain.map(([x, n], i) => i < 4 ? `<circle class="node" cx="${x}" cy="100" r="4"/><text x="${x}" y="${i === 0 ? 148 : i % 2 ? 84 : 124}" text-anchor="middle">${n}</text>` : `<polygon class="flagp" points="566,92 582,100 566,108"/><text x="582" y="124" text-anchor="middle">${n}</text>`).join('')}</g></svg><div class="dcap"><span class="cb">${esc(D.s03.before)}</span><span class="ca" style="text-align:right">${esc(D.s03.after)}</span></div>`;
    const mchain = d.querySelector('.mchain'); const L = mchain.getTotalLength(); mchain.style.strokeDasharray = L; let last = -1;
    d._morph = t => { if (t === last) return; last = t; src.forEach((y, i) => { const b = B[i], a = A[i]; const v = b.map((n, j) => lerp(n, a[j], t)); const el = d.querySelector(`path[data-i="${i}"]`); el.setAttribute('d', `M40 ${y} C ${v[0]} ${v[1]}, ${v[2]} ${v[3]}, ${v[4]} ${v[5]}`); el.setAttribute('class', t > .5 ? 'after' : 'before'); }); d.querySelector('.mb').style.opacity = Math.max(0, 1 - t * 2); d.querySelector('.ma').style.opacity = clamp((t - .45) * 2, 0, 1); mchain.style.strokeDashoffset = L * (1 - clamp((t - .5) * 2, 0, 1)); d.querySelector('.cb').style.opacity = t < .5 ? 1 : .35; d.querySelector('.ca').style.opacity = t < .5 ? .35 : 1; };
    d._morph(d.dataset.t !== undefined ? +d.dataset.t : 0);
  });

  /* ---------- 06 핫스팟 (docs/28 G9) ---------- */
  (function () {
    const list = document.getElementById('spots'), sh = document.querySelector('#solbox .shot.live'); if (!list || !sh) return;
    const hl = document.createElement('i'); hl.className = 'spot-hl'; sh.appendChild(hl);
    const pos = (el, s) => { el.style.left = `calc(6px + (100% - 12px) * ${s.x / 100})`; el.style.top = `calc(6px + (100% - 12px) * ${s.y / 100})`; };
    D.s06.spots.forEach((s, i) => { const b = document.createElement('b'); b.className = 'badge'; b.textContent = i + 1; pos(b, s); sh.appendChild(b); });
    let cur = -1;
    const set = i => { cur = i; list.querySelectorAll('li').forEach(li => li.classList.toggle('on', +li.dataset.i === i)); if (i < 0) { hl.classList.remove('on'); return; } const s = D.s06.spots[i]; pos(hl, s); hl.style.width = `calc((100% - 12px) * ${s.w / 100})`; hl.style.height = `calc((100% - 12px) * ${s.h / 100})`; hl.classList.add('on'); };
    list.addEventListener('mouseover', e => { const li = e.target.closest('li'); if (li) set(+li.dataset.i); });
    list.addEventListener('mouseleave', () => set(-1));
    list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) set(cur === +li.dataset.i ? -1 : +li.dataset.i); });
    window.__setSpot = set;
  })();

  /* ---------- 스크롤: morph(scrub)·와이프·막대·지연 로드 ---------- */
  // 머무름(docs/28 G5·G6 개정 2026-09-22): 03~05 판과 07 판은 애니메이션이 끝날 때까지 화면에 붙어 있고(sticky), 구간(120vh)을 다 지나야 다음으로 내려간다
  const wipe = document.querySelector('[data-wipe]');
  // 붙이기: 구간 안에서는 .g-stick을 translateY로 따라 내려 헤더 아래(64)에 고정된 것처럼. 진행률 t = 내려온 거리 / 구간
  function pin(el) { const r = el.getBoundingClientRect(); const st = el.querySelector('.g-stick'); const range = Math.max(1, r.height - st.offsetHeight); const off = desktop() ? clamp(64 - r.top, 0, range) : 0; st.style.transform = off ? `translate3d(0,${off.toFixed(1)}px,0)` : ''; return off / range; }
  function tDwell(el) { let t = pin(el); if (reduced) t = t >= .5 ? 1 : 0; return t; }
  function tWipe() { return wipe ? tDwell(wipe) : 0; }
  function onScroll() {
    lazy();
    document.querySelectorAll('[data-scrub]').forEach(d => { const dw = d.closest('[data-dwell]'); d._morph(desktop() ? tDwell(dw) : 1); });
    if (wipe && desktop()) { const t = tWipe(); wipe.querySelector('.after').style.clipPath = `inset(0 ${(100 - t * 100).toFixed(2)}% 0 0)`; wipe.querySelector('.edge').style.left = `calc(${(t * 100).toFixed(2)}% - 1px)`; wipe.querySelector('.wb').style.opacity = t < .5 ? 1 : .35; wipe.querySelector('.wa').style.opacity = t < .5 ? .35 : 1; }
    const bars = document.getElementById('bars'); if (bars && bars.getBoundingClientRect().top < innerHeight * .85) bars.querySelectorAll('.bar').forEach(b => b.classList.add('on'));
  }
  V3.initLenis();
  if (V3.lenis) V3.lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 키·해시·뒤로가기 ---------- */
  const panels = () => [...document.querySelectorAll('#s00, .g-panel, .teaser')];
  const goTo = (el, immediate) => { const dw = el.closest && el.closest('[data-dwell]'); const y = (dw || el).getBoundingClientRect().top + scrollY - (dw ? 0 : 88); if (V3.lenis) V3.lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.1 }); else scrollTo({ top: y, behavior: immediate || reduced ? 'auto' : 'smooth' }); };
  addEventListener('keydown', e => {
    if (!desktop() || e.altKey || e.ctrlKey || e.metaKey) return;
    const dr = document.getElementById('drawer'); if (dr && dr.classList.contains('on')) return;
    const ps = panels(); let k = 0; ps.forEach((p, i) => { if (p.getBoundingClientRect().top <= 90) k = i; });
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goTo(ps[clamp(k + 1, 0, ps.length - 1)]); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(ps[clamp(k - 1, 0, ps.length - 1)]); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(ps[0], false); } else if (e.key === 'End') { e.preventDefault(); goTo(ps[ps.length - 1]); }
  });
  const hash = location.hash.replace('#', ''); const target = hash && document.getElementById(hash);
  if (target) setTimeout(() => goTo(target.closest('.g-panel') || target, true), 50);
  document.getElementById('hd-back').addEventListener('click', e => { if (document.referrer && /projects\.html/.test(document.referrer) && history.length > 1) { e.preventDefault(); history.back(); } });

  /* ---------- 전환 종류: 상세 → 상세는 제목 morph 없이 (docs/28 B5) ---------- */
  addEventListener('pageswap', e => { if (!e.viewTransition) return; const to = (e.activation && e.activation.entry && e.activation.entry.url) || ''; if (/case\.html/.test(to)) e.viewTransition.types.add('to-case'); });
  addEventListener('pagereveal', e => { if (!e.viewTransition) return; const from = (e.activation && e.activation.from && e.activation.from.url) || ''; if (/case\.html/.test(from)) e.viewTransition.types.add('to-case'); });

  V3.drawer.init();

  /* ---------- 검증 (docs/28) ---------- */
  window.__spec = function () {
    const cs = el => getComputedStyle(el);
    const L = el => Math.round(el.getBoundingClientRect().left);
    const cover = document.querySelector('#s00 .shot'), panelsEl = document.querySelectorAll('.g-panel'), fulls = document.querySelectorAll('.g-full');
    return {
      G1: { lefts: [L(cover), ...[...panelsEl].map(L), ...[...fulls].map(L)], scMax: Math.max(...[...document.querySelectorAll('.shot.live')].map(s => +s.style.getPropertyValue('--sc'))) },
      G2: { order: ['#s00', '.g-title .h1x', '.g-title .knums'].map(q => !!document.querySelector(q)) },
      G3: { panels: panelsEl.length, borders: [...panelsEl].filter(p => cs(p).borderBottomWidth !== '0px').length },
      G4: { fullW: [...fulls].map(f => Math.round(f.getBoundingClientRect().width)), gridW: Math.round(document.getElementById('main').clientWidth - 152) },
      G6: { hasWipe: !!wipe, t: wipe ? +tWipe().toFixed(2) : null, pinned: wipe ? Math.round(wipe.querySelector('.g-stick').getBoundingClientRect().top) : null, dwells: document.querySelectorAll('[data-dwell]').length, stickFits: [...document.querySelectorAll('.g-stick')].map(e => e.offsetHeight + 64 <= innerHeight) },
      G7: { bars: document.querySelectorAll('.bar').length, on: document.querySelectorAll('.bar.on').length },
      G8: { next: document.getElementById('next-link').textContent, ft: !!document.querySelector('.ft'), cta: !!document.querySelector('#s10 .btn[data-project]') },
      G10: { title: document.getElementById('hd-title').textContent, notSelf: document.getElementById('next-link').getAttribute('href').indexOf(pj.slug) < 0 },
      B1: { html: cs(document.documentElement).overflowX, body: cs(document.body).overflow, lenis: !!V3.lenis },
      B6: { drawer: !!document.getElementById('drawer'), hdrProject: document.getElementById('hd-ask').dataset.project },
      H: { hdrH: document.querySelector('.hdr').offsetHeight, vt: cs(document.querySelector('.hdr')).viewTransitionName, strip: !!document.querySelector('.pmap'), pos: !!document.querySelector('.hdr .pos') },
      noHScroll: document.documentElement.scrollWidth <= innerWidth
    };
  };
  window.__case = { goTo, panels, tWipe };
})();
