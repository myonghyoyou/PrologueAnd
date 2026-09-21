/* Case Study 가로 상세 엔진 — docs/24 H2, docs/26.
   세로 스크롤(y) → 무대 x. 보통 구간은 1:1, 머무름 구간(03~05, 07)은 x 고정·t 진행.
   xOf(y)/yOf(x) 한 쌍이 스트립 클릭·키·해시·리사이즈를 모두 처리한다. */
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
  const next = (V3.project(D.s10.next) && D.s10.next !== pj.slug && V3.project(D.s10.next)) || V3.projects.find(p => p.slug !== pj.slug);
  document.title = `Prologue & ${pj.title}`;
  document.getElementById('hd-title').textContent = pj.title;
  document.getElementById('hd-ask').dataset.project = pj.slug;

  /* ---------- 장 렌더 (docs/25 §4 스키마 순서) ---------- */
  const shot = (s, cls) => `<div class="shot live ${cls || ''}" data-src="${s.src}" title="${esc(s.cap)}"><iframe src="${s.src}" tabindex="-1" aria-label="${esc(s.cap)}" loading="lazy"></iframe></div>`;
  const P = ps => (ps || []).map(t => `<p>${t}</p>`).join('');
  const H = (n, name) => `<h2><span class="num">${n}</span>${name}</h2>`;
  const nums = D.numbers.map(n => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('');
  const hasBefore = !!D.s07.before;
  const scenes = [
    { id: 's00', n: 0, cls: 'cover w100', html: `
      <div>
        <span class="cap">Prologue <span class="amp" style="font-size:14px">&amp;</span> ${esc(pj.title)} · ${esc(D.cap)}${sample ? ' · <span style="color:var(--warning)">본문은 Por favor, Harry 예시(시안)</span>' : ''}</span>
        <h1 class="h1">${title}</h1>
        <div class="nums" id="nums0">${nums}</div>
        <table>${D.meta.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
      </div>
      <div class="shotbox">${shot(D.hero)}<span class="cap">${esc(D.hero.cap)}</span></div>` },
    { id: 's01', n: 1, cls: 'w44', html: H('01', 'Overview') + P(D.s01.p) },
    { id: 's02', n: 2, cls: 'w44', html: H('02', 'Problem') + P(D.s02.p) },
    { id: 's03', n: 3, cls: 'group w100', dwell: 1.6, html: `
      <div class="dia"><svg id="morph" viewBox="0 0 640 220"></svg><div class="dcap"><span id="m-before">${esc(D.s03.before)}</span><span id="m-after" style="text-align:right">${esc(D.s03.after)}</span></div></div>
      <div class="steps">
        <div class="step" data-k="0">${H('03', 'Existing Workflow')}${P(D.s03.p)}</div>
        <div class="step" data-k="1" id="s04">${H('04', 'Insight')}<p class="q">${esc(D.s04.q)}</p></div>
        <div class="step" data-k="2" id="s05">${H('05', 'Redesign')}<div class="flow">${D.s05.flow.map((f, i, a) => `<span${i === a.length - 1 ? ' class="g"' : ''}>${esc(f)}</span>${i < a.length - 1 ? '<em>→</em>' : ''}`).join('')}</div>${P(D.s05.p)}</div>
      </div>` },
    { id: 's06', n: 6, cls: 'solution w80', html: `
      <div>${H('06', 'Solution')}${P(D.s06.p)}
        ${D.s06.spots ? `<ul class="spots" id="spots">${D.s06.spots.map((s, i) => `<li data-i="${i}"><b>${i + 1}</b><span>${esc(s.cap)}</span></li>`).join('')}</ul>` : ''}</div>
      <div class="shotbox" id="solbox">${shot(D.s06.screen, 'spotted')}<span class="cap">${esc(D.s06.screen.cap)}</span></div>` },
    { id: 's07', n: 7, cls: 'w80', dwell: hasBefore ? 1.2 : 0, html: `
      ${H('07', 'Before <span class="amp" style="font-size:.9em">&amp;</span> After')}${P(D.s07.p)}
      <div class="shotbox"><div class="wipe" id="wipe">${hasBefore ? shot(D.s07.before, 'before') : ''}${shot(D.s07.after, hasBefore ? 'after' : '')}${hasBefore ? '<i class="edge" id="wedge"></i>' : ''}</div>
      <div class="wcaps cap">${hasBefore ? `<span id="w-before">${esc(D.s07.before.cap)}</span>` : ''}<span id="w-after">${esc(D.s07.after.cap)}</span></div></div>` },
    { id: 's08', n: 8, cls: 'w64', html: `
      ${H('08', 'Impact')}
      <div class="impact" id="nums8">${D.numbers.map(n => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span><small>${esc(n.small || '')}</small></div>`).join('')}</div>
      ${D.s08.bars && D.s08.bars.length ? `<div class="bars" id="bars">${D.s08.bars.filter(b => b.before > 0).map(b => `<div class="bar" style="--w:${Math.round(b.after / b.before * 100)}%"><div class="lbl"><span>${esc(b.label)}</span><span>${b.before}${esc(b.unit || '')} → ${b.after}${esc(b.unit || '')}</span></div><div class="tr"><i></i></div></div>`).join('')}</div>` : ''}` },
    { id: 's09', n: 9, cls: 'w44', html: H('09', 'What I Learned') + P(D.s09.p) },
    { id: 's10', n: 10, cls: 'last w100', html: `
      <div>${H('10', '비슷한 문제가 있다면')}${P(D.s10.p)}
        <div class="cta"><a class="btn" href="#" data-open-drawer data-project="${pj.slug}">이 프로젝트를 보고 문의하기 <i class="tri"></i></a><a class="mail link" href="mailto:hello@prologue.and">hello@prologue.and</a></div></div>
      <div class="next"><span class="cap">다음 이야기</span><a href="case.html?p=${next.slug}" id="next-link">${esc(next.title)}</a></div>` }
  ];
  document.getElementById('scenes').innerHTML = scenes.map(s => `<section class="scene ${s.cls}" id="${s.id}" data-n="${s.n}">${s.html}</section>`).join('');
  const strip = document.getElementById('strip');
  // 진행 스트립: 칸 10개 = 단계 01~10 (표지는 칸 없음). 04·05는 03 묶음 안이라 같은 장으로 간다
  strip.innerHTML = Array.from({ length: 10 }, (_, k) => `<i data-n="${k + 1}"></i>`).join('');

  /* ---------- morph (03 → 05), 기존 코드 ---------- */
  const svg = document.getElementById('morph');
  const src = [40, 80, 120, 160], names = ['전화', '메신저', '이메일', '직접 방문'];
  const B = src.map((y, i) => [120 + i * 30, y + (i % 2 ? -50 : 50), 220, 100 + (i - 1.5) * 24, 300, 100]);
  const A = src.map(y => [110, y, 130, 100, 160, 100]);
  const lerp = (a, b, t) => a + (b - a) * t;
  const chain = [[160, '개인 링크'], [270, '요청폼'], [380, '심사 Queue'], [480, '약속일'], [580, '상태 공유']];
  svg.innerHTML = src.map((y, i) => `<text x="34" y="${y + 4}" text-anchor="end">${names[i]}</text>`).join('')
    + src.map((y, i) => `<path class="before" id="mp${i}" d=""/>`).join('')
    + `<g id="mb"><path class="before" d="M300 100 H520"/><circle class="node" cx="300" cy="100" r="4" style="stroke:#8A96C2"/><text x="300" y="124" text-anchor="middle">담당자가 정리·기억</text><path class="before" d="M514 94 l12 12 M526 94 l-12 12"/><text x="520" y="124" text-anchor="middle">몰입 중단</text></g>`
    + `<g id="ma"><path class="after" id="mchain" d="M160 100 H566"/>${chain.map(([x, n], i) => i < 4 ? `<circle class="node" cx="${x}" cy="100" r="4"/><text x="${x}" y="${i === 0 ? 148 : i % 2 ? 84 : 124}" text-anchor="middle">${n}</text>` : `<polygon class="flagp" points="566,92 582,100 566,108"/><text x="582" y="124" text-anchor="middle">${n}</text>`).join('')}</g>`;
  const mb = document.getElementById('mb'), ma = document.getElementById('ma'), mchain = document.getElementById('mchain');
  const chainLen = mchain.getTotalLength(); mchain.style.strokeDasharray = chainLen;
  let morphT = -1;
  function morph(t) {
    if (t === morphT) return; morphT = t;
    src.forEach((y, i) => { const b = B[i], a = A[i]; const v = b.map((n, k) => lerp(n, a[k], t)); const el = document.getElementById('mp' + i); el.setAttribute('d', `M40 ${y} C ${v[0]} ${v[1]}, ${v[2]} ${v[3]}, ${v[4]} ${v[5]}`); el.setAttribute('class', t > .5 ? 'after' : 'before'); });
    mb.style.opacity = Math.max(0, 1 - t * 2); ma.style.opacity = Math.min(1, Math.max(0, (t - .45) * 2));
    mchain.style.strokeDashoffset = chainLen * (1 - clamp((t - .5) * 2, 0, 1));
    document.getElementById('m-before').style.opacity = t < .5 ? 1 : .35; document.getElementById('m-after').style.opacity = t < .5 ? .35 : 1;
    document.querySelectorAll('#s03 .step').forEach(s => s.classList.toggle('on', +s.dataset.k === (t < .34 ? 0 : t < .67 ? 1 : 2)));
  }

  /* ---------- 06 핫스팟 ---------- */
  (function () {
    const list = document.getElementById('spots'); if (!list) return;
    const sh = document.querySelector('#solbox .shot.live');
    const hl = document.createElement('i'); hl.className = 'spot-hl'; sh.appendChild(hl);
    D.s06.spots.forEach((s, i) => { const b = document.createElement('b'); b.className = 'badge'; b.textContent = i + 1; b.style.left = `calc(6px + (100% - 12px) * ${s.x / 100})`; b.style.top = `calc(6px + (100% - 12px) * ${s.y / 100})`; sh.appendChild(b); });
    let cur = -1;
    const set = i => { cur = i; list.querySelectorAll('li').forEach(li => li.classList.toggle('on', +li.dataset.i === i)); if (i < 0) { hl.classList.remove('on'); return; } const s = D.s06.spots[i]; hl.style.left = `calc(6px + (100% - 12px) * ${s.x / 100})`; hl.style.top = `calc(6px + (100% - 12px) * ${s.y / 100})`; hl.style.width = `calc((100% - 12px) * ${s.w / 100})`; hl.style.height = `calc((100% - 12px) * ${s.h / 100})`; hl.classList.add('on'); };
    list.addEventListener('mouseover', e => { const li = e.target.closest('li'); if (li) set(+li.dataset.i); });
    list.addEventListener('mouseleave', () => set(-1));
    list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) set(cur === +li.dataset.i ? -1 : +li.dataset.i); });   // 터치: 탭 토글
    window.__setSpot = set;
  })();

  /* ---------- 무대 배치 ---------- */
  const track = document.getElementById('track'), wrap = document.getElementById('track-wrap'), scenesEl = document.getElementById('scenes'), line = document.getElementById('line');
  const els = scenes.map(s => document.getElementById(s.id));
  const IX = id => scenes.findIndex(s => s.id === id);   // 장 index (04·05는 묶음이라 index와 단계 번호가 다르다)
  const G = { vw: 0, vh: 0, x: [], w: [], dwell: [], xMax: 0, yMax: 0, trackW: 0, L: 0 };
  const dwellPx = i => (scenes[i].dwell || 0) * G.vh;
  function xOf(y) {   // 세로 → 무대 x. 머무름 구간에서는 x 고정
    let d = 0;
    for (let i = 0; i < scenes.length; i++) { const dw = dwellPx(i); if (!dw) continue; const y0 = G.x[i] + d; if (y < y0) break; if (y < y0 + dw) return G.x[i]; d += dw; }
    return clamp(y - d, 0, G.xMax);
  }
  function tOf(y, i) { let d = 0; for (let k = 0; k < i; k++) d += dwellPx(k); const y0 = G.x[i] + d, dw = dwellPx(i); if (!dw) return y >= y0 ? 1 : 0; const t = clamp((y - y0) / dw, 0, 1); return reduced ? (t >= .5 ? 1 : 0) : t; }
  function yOf(x) { let d = 0; for (let i = 0; i < scenes.length; i++) { const dw = dwellPx(i); if (!dw) continue; if (x <= G.x[i]) break; d += dw; } return x + d; }
  function fitShots() {   // 라이브 화면 배율 = min(폭/1280, 높이/800) (docs/24 §4.1, docs/26 C6)
    document.querySelectorAll('.shotbox').forEach(box => {
      const cap = box.querySelector(':scope > .cap, .wcaps'); const capH = cap ? cap.offsetHeight + 8 : 0;
      const bw = box.clientWidth, bh = desktop() ? box.clientHeight - capH : 1e9;
      const sc = Math.max(0.1, Math.min((bw - 12) / 1280, (bh - 12) / 800));
      box.querySelectorAll('.shot.live').forEach(sh => { sh.style.setProperty('--sc', sc.toFixed(4)); sh.style.width = (1280 * sc + 12) + 'px'; sh.style.height = (800 * sc + 12) + 'px'; });
      const w = box.querySelector('.wipe'); if (w) { w.style.width = (1280 * sc + 12) + 'px'; w.style.height = (800 * sc + 12) + 'px'; }
    });
  }
  function layout() {
    G.vw = innerWidth; G.vh = innerHeight;
    if (!desktop()) { wrap.style.height = ''; scenesEl.style.transform = ''; fitShots(); morph(1); document.querySelectorAll('#s03 .step').forEach(s => s.classList.add('on')); return; }
    fitShots();
    G.x = els.map(el => el.offsetLeft); G.w = els.map(el => el.offsetWidth);
    G.trackW = G.x[G.x.length - 1] + G.w[G.w.length - 1];
    G.xMax = Math.max(0, G.trackW - G.vw);
    G.yMax = G.xMax + scenes.reduce((a, s, i) => a + dwellPx(i), 0);
    wrap.style.height = (G.yMax + G.vh) + 'px';   // 스크롤 범위 + 무대 높이 (docs/24 §4.1)
    // 선: y = 62vh, 점 = 장 시작 + 48
    const ly = Math.round(G.vh * 0.62); G.L = G.trackW;
    line.setAttribute('width', G.trackW); line.setAttribute('viewBox', `0 0 ${G.trackW} ${G.vh}`); line.style.width = G.trackW + 'px';
    line.innerHTML = `<path class="guide" d="M0 ${ly} H${G.trackW}"/><path class="ink" id="ink" d="M0 ${ly} H${G.trackW}" style="stroke-dasharray:${G.trackW};stroke-dashoffset:${G.trackW}"/>`
      + scenes.map((s, i) => `<circle class="dot" data-i="${i}" cx="${G.x[i] + 48}" cy="${ly}" r="6"/>`).join('');
    G.ly = ly;
  }

  /* ---------- 렌더 ---------- */
  const S = { y: -1, cur: -1, step: -1, x: 0 };
  function curOf(x) { let c = 0; G.x.forEach((xi, i) => { if (xi <= x + 1) c = i; }); return c; }
  function render(force) {
    if (!desktop()) return;
    const y = clamp(scrollY, 0, G.yMax); if (!force && y === S.y) return; S.y = y;
    const x = xOf(y); S.x = x;
    scenesEl.style.transform = `translate3d(${-x}px,0,0)`;
    const inkEnd = Math.min(G.trackW, x + G.vw * 0.45);
    document.getElementById('ink').style.strokeDashoffset = G.trackW - inkEnd;
    line.querySelectorAll('.dot').forEach(d => d.classList.toggle('on', inkEnd >= +d.getAttribute('cx')));
    morph(tOf(y, IX('s03')));
    if (hasBefore) { const t = tOf(y, IX('s07')); const w = document.getElementById('wipe'); w.querySelector('.after').style.clipPath = `inset(0 ${(100 - t * 100).toFixed(2)}% 0 0)`; document.getElementById('wedge').style.left = `calc(${(t * 100).toFixed(2)}% - 1px)`; document.getElementById('w-before').style.opacity = t < .5 ? 1 : .35; document.getElementById('w-after').style.opacity = t < .5 ? .35 : 1; }
    const bars = document.getElementById('bars'); if (bars) bars.querySelectorAll('.bar').forEach(b => b.classList.toggle('on', inkEnd >= G.x[IX('s08')] + 48));
    const cur = curOf(x);
    const step = cur === 3 ? 3 + (morphT < .34 ? 0 : morphT < .67 ? 1 : 2) : scenes[cur].n;   // 단계 번호 01~10 (묶음 안은 t로)
    if (cur !== S.cur || step !== S.step) {
      S.cur = cur; S.step = step;
      strip.querySelectorAll('i').forEach((b, i) => { b.classList.toggle('on', i + 1 === step); b.classList.toggle('done', i + 1 < step); });
      document.getElementById('hd-pos').textContent = `${String(Math.max(1, step)).padStart(2, '0')} / 10`;
      const h = cur ? '#' + scenes[cur].id : location.pathname + location.search; if (location.hash !== (cur ? h : '')) history.replaceState(null, '', h);
    }
    if (y > 40) document.getElementById('hint').classList.add('off');
  }

  /* ---------- 입력 ---------- */
  // 정거장: 장 시작마다 하나, 묶음(03~05)은 t 0/.5/1 세 개(단계 03·04·05), 07 머무름은 t 0과 1 두 개. 키·스트립은 정거장 단위로 움직인다
  const stops = () => { const out = []; scenes.forEach((sc, i) => { const y0 = yOf(G.x[i]), dw = dwellPx(i); out.push({ y: y0, i, n: sc.n }); if (i === 3) { out.push({ y: y0 + dw / 2, i, n: 4 }); out.push({ y: y0 + dw, i, n: 5 }); } else if (dw) out.push({ y: y0 + dw, i, n: sc.n }); }); return out; };
  const scrollY_ = y => { if (V3.lenis) V3.lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }); };
  const go = (i, immediate) => { const y = yOf(G.x[clamp(i, 0, scenes.length - 1)]); if (immediate) { if (V3.lenis) V3.lenis.scrollTo(y, { immediate: true }); window.scrollTo(0, y); } else scrollY_(y); };
  const goStop = dir => { const st = stops(); let k = 0; st.forEach((s, j) => { if (s.y <= scrollY + 2) k = j; }); const t = st[clamp(k + dir, 0, st.length - 1)]; scrollY_(t.y); };
  const goStep = n => { const st = stops().find(s => s.n === n); if (st) scrollY_(st.y); };
  strip.addEventListener('click', e => { const b = e.target.closest('i'); if (b) goStep(+b.dataset.n); });
  addEventListener('keydown', e => {
    if (!desktop() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.getElementById('drawer') && document.getElementById('drawer').classList.contains('on')) return;
    const fwd = ['ArrowRight', 'ArrowDown', 'PageDown', ' '], back = ['ArrowLeft', 'ArrowUp', 'PageUp'];
    if (fwd.includes(e.key)) { e.preventDefault(); goStop(1); }
    else if (back.includes(e.key)) { e.preventDefault(); goStop(-1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(scenes.length - 1); }
  });
  document.getElementById('hd-back').addEventListener('click', e => { if (document.referrer && /projects\.html/.test(document.referrer) && history.length > 1) { e.preventDefault(); history.back(); } });

  /* ---------- 전환 종류 (docs/24 §4.3): 상세 → 상세는 왼쪽으로 밀림, 제목 morph 없음 ---------- */
  addEventListener('pageswap', e => { if (!e.viewTransition) return; const to = (e.activation && e.activation.entry && e.activation.entry.url) || ''; if (/case\.html/.test(to)) { e.viewTransition.types.add('to-case'); document.querySelector('.cover .h1').style.viewTransitionName = 'none'; } });
  addEventListener('pagereveal', e => { if (!e.viewTransition) return; const from = (e.activation && e.activation.from && e.activation.from.url) || ''; if (/case\.html/.test(from)) { e.viewTransition.types.add('to-case'); document.querySelector('.cover .h1').style.viewTransitionName = 'none'; e.viewTransition.finished.finally(() => { document.querySelector('.cover .h1').style.viewTransitionName = ''; }); } });

  /* ---------- 시작 ---------- */
  V3.initLenis();
  V3.drawer.init();
  layout();
  const hash = location.hash.replace('#', ''); const hi = /^s0[45]$/.test(hash) ? 3 : scenes.findIndex(s => s.id === hash);   // 04·05는 03 묶음 안
  if (hi > 0) go(hi, true);
  render(true);
  let raf = () => { render(); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const cur = S.cur; layout(); if (desktop()) { go(cur, true); render(true); } }, 80); });
  document.querySelectorAll('.shot.live iframe').forEach(f => f.addEventListener('load', fitShots));

  /* ---------- SDD 검증 (docs/26) ---------- */
  window.__spec = function () {
    const cs = el => getComputedStyle(el);
    const inside = (a, b) => a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    const sample = [0, 700, 2000, G.xMax / 2, G.xMax].map(x => Math.round(xOf(yOf(x))) === Math.round(x));
    return {
      C1: { sticky: cs(track).position === 'sticky', clip: cs(track).overflowX === 'clip', bodyClip: cs(document.documentElement).overflowX === 'clip', noHScroll: document.documentElement.scrollWidth <= innerWidth },
      C2: { scenes: els.length, title: document.getElementById('hd-title').textContent },
      C3: { range: G.yMax, wrapH: wrap.offsetHeight, expectWrapH: G.yMax + G.vh, roundTrip: sample.every(Boolean), dwell: scenes.map((s, i) => Math.round(dwellPx(i))) },
      C4: els.map(el => ({ id: el.id, w: el.offsetWidth, overflow: el.scrollHeight > el.clientHeight + 1 })),
      C5: { ly: G.ly, expect: Math.round(innerHeight * .62), dots: line.querySelectorAll('.dot').length },
      C6: [...document.querySelectorAll('.shot.live')].map(sh => ({ sc: sh.style.getPropertyValue('--sc'), inside: inside(sh.getBoundingClientRect(), sh.closest('.scene').getBoundingClientRect()) })),
      C7: { cells: strip.querySelectorAll('i').length, widths: [...strip.querySelectorAll('i')].map(b => b.offsetWidth), parentIsHdr: !!strip.closest('.hdr'), cur: S.cur, step: S.step, pos: document.getElementById('hd-pos').textContent },
      H: { hdrH: document.querySelector('.hdr').offsetHeight, vt: cs(document.querySelector('.hdr')).viewTransitionName, navH: document.querySelector('.hdr nav button').offsetHeight, topbar: !!document.querySelector('.topbar') },
      I7: document.getElementById('nums0').textContent.trim() === [...document.querySelectorAll('#nums8 b, #nums8 span')].map(e => e.textContent).join('').replace(/\s+/g, ' ').trim() || 'compare-manually',
      morphT, x: S.x, y: S.y
    };
  };
  window.__case = { xOf, yOf, tOf, go, goStop, goStep, stops, G, S, scenes };
})();
