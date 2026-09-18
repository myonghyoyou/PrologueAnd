/* v5 — horizontal-only engine: Lenis horizontal on a native overflow-x wrapper, one straight line (S1) across the track,
   travelling & (S2) fixed at (50vw, 60vh), progress map in the header, Projects/Case Study as centred sheets. */
window.V5 = (function () {
  const V = {};
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desktop = () => matchMedia('(min-width:1024px)').matches;
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const LINE = () => { const p0 = document.getElementById('p00'); return p0.offsetTop + Math.round(p0.offsetHeight * 0.80); }; // 바닥선(L1): 패널 상단 + 80%
  let wrap, track, lenis = null, panels = [], hline, ink, guide, lineLen = 0, geo = {}, launched = false, animTip = 0, tipMin = 0;
  let snaps = [], snapping = false, moving = false, idleSince = 0, gestureFrom = null, lastDir = 0;
  /* 이동 중 축소 (V2 계승): 속도에 비례해 트랙을 최대 ZOOM.max 만큼 축소, 기준점은 매 프레임 화면 중심 */
  const ZOOM = { max: 0.12, vel: 28, ease: 0.18, on: !reduced && LS.get('v5-zoom') !== 'off' };   // 시안 조정: ?zoom=0.10&vel=30 (max = 최대 축소율, vel = 최대 축소에 이르는 속도 px/frame)
  { const q = new URLSearchParams(location.search); if (q.get('zoom')) ZOOM.max = +q.get('zoom'); if (q.get('vel')) ZOOM.vel = +q.get('vel'); if (q.get('zoom') === '0') ZOOM.on = false; }
  const st = { tipX: 0, s: 0, z: 1 };
  /* 스냅: 손을 떼면 가장 가까운 점(노드)이 & 아래에 오도록. 같은 점으로 되돌아가지 않고, 움직인 방향의 다음 점으로 */
  function pickSnap(sl) {
    if (!snaps.length) return null;
    let nearest = snaps.reduce((a, b) => Math.abs(b - sl) < Math.abs(a - sl) ? b : a);
    if (gestureFrom !== null && Math.abs(nearest - gestureFrom) < 2 && Math.abs(sl - gestureFrom) > 24 && lastDir) {
      const i = snaps.indexOf(nearest), j = Math.max(0, Math.min(snaps.length - 1, i + lastDir));
      nearest = snaps[j];
    }
    return nearest;
  }
  function doSnap() {
    const sl0 = sl(), t = pickSnap(sl0);
    moving = false; gestureFrom = null;
    if (t === null || Math.abs(t - sl0) < 2) return;
    snapping = true;
    lenis.scrollTo(t, { duration: 0.55, onComplete: () => { snapping = false; } });
  }
  function tick() {
    if (!launched) return;
    const vRaw = lenis ? (lenis.velocity || 0) : 0;
    if (lenis && !snapping) {
      if (Math.abs(vRaw) > 0.3) { if (!moving) { moving = true; gestureFrom = pickSnap(sl()); } lastDir = vRaw > 0 ? 1 : -1; idleSince = 0; }
      else if (moving) { if (!idleSince) idleSince = performance.now(); else if (performance.now() - idleSince > 140) doSnap(); }
    }
    const v = Math.abs(vRaw);
    const zt = ZOOM.on ? 1 - Math.min(1, v / ZOOM.vel) * ZOOM.max : 1;
    st.z += (zt - st.z) * ZOOM.ease; if (Math.abs(st.z - zt) < 0.0005) st.z = zt;
    const cx = st.s + innerWidth / 2, cy = innerHeight / 2, z = st.z;
    track.style.transformOrigin = `${cx}px ${cy}px`; track.style.transform = z < 0.9995 ? `scale(${z})` : '';
    const mx = innerWidth / 2 + (st.tipX - st.s - innerWidth / 2) * z, my = cy + (geo.y - cy) * z;
    document.getElementById('marker').style.transform = `translate(${mx}px, ${my}px) scale(${z})`;
  }

  /* ---------- markup: 진행 지도 ---------- */
  V.build = function () {
    wrap = document.getElementById('hwrap'); track = document.getElementById('htrack');
    document.getElementById('restN').textContent = V3.projects.length;
    panels = [...track.querySelectorAll('.hp')];
    const labels = ['Prologue', '처음', '&', '끝까지', '누구를 위해', '무엇을', 'Projects', '문의', '&'];
    document.getElementById('pmap').innerHTML = panels.map((el, i) => `<i data-i="${i}" data-l="${labels[i] || ''}"></i>`).join('');
    if (!desktop()) V3.initMobilePos(panels.map(p => p.id));
    // sheets
    document.addEventListener('click', e => { const t = e.target.closest('[data-sheet]'); if (!t) return; e.preventDefault(); V.openSheet(t.dataset.sheet); });
    document.getElementById('sheet').querySelector('.close').addEventListener('click', () => V.closeSheet());
    document.getElementById('sheet-bd').addEventListener('click', () => V.closeSheet());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') V.closeSheet(); });
  };
  V.openSheet = src => { const f = document.getElementById('sheet-frame'); if (f.getAttribute('src') !== src) f.src = src; document.getElementById('sheet').classList.add('on'); document.getElementById('sheet-bd').classList.add('on'); if (lenis) lenis.stop(); };
  V.closeSheet = () => { document.getElementById('sheet').classList.remove('on'); document.getElementById('sheet-bd').classList.remove('on'); if (lenis) lenis.start(); };

  /* ---------- scrolling ---------- */
  const sl = () => wrap.scrollLeft;
  V.goTo = (x, immediate) => { if (lenis) { snapping = !immediate; moving = false; gestureFrom = null; lenis.scrollTo(x, { duration: immediate ? 0 : 1.1, immediate: !!immediate, onComplete: () => { snapping = false; } }); } else wrap.scrollTo({ left: x, behavior: immediate ? 'auto' : 'smooth' }); };

  V.init = function () {
    if (!desktop()) return;
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ wrapper: wrap, content: track, orientation: 'horizontal', gestureOrientation: 'both', lerp: 0.1, smoothWheel: true, wheelMultiplier: 1.4 });
      V3.lenis = lenis; // drawer stop/start
      gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    }
    hline = document.getElementById('hline');
    { const k = LS.get('v5-size') || 'm', S = { s: ['min(960px,64vw)', 'min(580px,62vh)'], m: ['min(1100px,74vw)', 'min(680px,72vh)'], l: ['min(1240px,84vw)', 'min(760px,74vh)'], xl: ['min(1280px,84vw)', 'calc(100vh - 120px)'] }; document.documentElement.style.setProperty('--pw', S[k][0]); document.documentElement.style.setProperty('--ph', S[k][1]); }
    build();
    const marker = document.getElementById('marker');
    document.getElementById('pmap').addEventListener('click', e => { const i = e.target.closest('i'); if (i) V.goTo(panels[+i.dataset.i].offsetLeft - (panels[+i.dataset.i].classList.contains('page') ? 12 : 0)); });
    document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); V.goTo(document.getElementById(a.dataset.go).offsetLeft - 12); }));
    const idxAt = x => { const c = x + innerWidth * 0.5; let i = 0; panels.forEach((p, k) => { if (p._x <= c) i = k; }); return i; };
    addEventListener('keydown', e => {
      if (document.getElementById('sheet').classList.contains('on')) return;
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown', 'PageUp', ' '].includes(e.key)) return;
      e.preventDefault();                                             // 네이티브 가로 스크롤 + 우리 이동이 겹치지 않게
      const at = lenis ? lenis.targetScroll : sl();                    // 애니메이션 중이면 목표 위치 기준 → 한 번에 한 점
      const go = t => { snapping = true; moving = false; gestureFrom = null; lenis ? lenis.scrollTo(t, { duration: 1.5, onComplete: () => { snapping = false; } }) : V.goTo(t); };
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { const t = snaps.find(v => v > at + 2); if (t !== undefined) go(t); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { const t = [...snaps].reverse().find(v => v < at - 2); if (t !== undefined) go(t); }
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(snaps[snaps.length - 1]);
    });
    // hash → start position (skip intro)
    const hash = location.hash.replace('#', ''); const target = hash && document.getElementById(hash);
    if (target) { wrap.scrollLeft = target.offsetLeft - 12; }
    intro(!!target || reduced || sl() > innerWidth * 0.3);
    (lenis ? lenis.on.bind(lenis) : wrap.addEventListener.bind(wrap))('scroll', render);
    if (lenis) gsap.ticker.add(tick);
    // panel size presets (mockup): s / m / l(V2 84vw×74vh)
    const SIZES = { s: ['min(960px,64vw)', 'min(580px,62vh)'], m: ['min(1100px,74vw)', 'min(680px,72vh)'], l: ['min(1240px,84vw)', 'min(760px,74vh)'], xl: ['min(1280px,84vw)', 'calc(100vh - 120px)'] };
    const applySize = k => { const [pw, ph] = SIZES[k] || SIZES.m; document.documentElement.style.setProperty('--pw', pw); document.documentElement.style.setProperty('--ph', ph); document.querySelectorAll('#sizeSeg button').forEach(b => b.classList.toggle('on', b.dataset.size === k)); LS.set('v5-size', k); };
    applySize(LS.get('v5-size') || 'm');
    document.getElementById('sizeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const cur = current(); applySize(b.dataset.size); build(); if (lenis) lenis.resize(); V.goTo(panels[cur].offsetLeft - 12, true); render(); });
    // zoom toggle (mockup)
    const tg = document.getElementById('zoomToggle'), info = document.getElementById('zoomInfo');
    if (tg) { tg.checked = ZOOM.on; const upd = () => info.textContent = ZOOM.on ? `최대 ${Math.round(ZOOM.max * 100)}% · 속도 ${ZOOM.vel} · ease ${ZOOM.ease}` : '끔'; upd(); tg.addEventListener('change', () => { ZOOM.on = tg.checked; LS.set('v5-zoom', ZOOM.on ? 'on' : 'off'); upd(); }); }
    addEventListener('resize', () => { build(); render(); if (lenis) lenis.resize(); });
    if (lenis) lenis.resize();
  };

  function build() {
    const W = track.scrollWidth, H = innerHeight, y = LINE();
    document.documentElement.style.setProperty('--ly', (y - document.getElementById('p00').offsetTop) + 'px');
    panels.forEach(p => { p._x = p.offsetLeft; p._w = p.offsetWidth; });
    const p00 = panels[0], p08 = panels.find(p => p.classList.contains('dark')), p09 = panels[panels.length - 1];
    const pt = p00.offsetTop, nodeL = Math.round(p00._w * 0.56), nodeX = p00._x + nodeL, yl = y - pt;   // panel-local coords for the hero svg
    // hero sources (in the track svg, panel 00 coordinates == track coordinates)
    // S1: 엉킨 선 뭉치(복잡한 업무)에서 한 가닥이 풀려 나와 바닥선(단순한 제품)이 된다 — docs/19 §3
    const heroDia = document.getElementById('hero-dia');
    const ph = p00.offsetHeight; heroDia.setAttribute('viewBox', `0 0 ${p00._w} ${ph}`); heroDia.setAttribute('width', p00._w); heroDia.setAttribute('height', ph);
    const k = nodeL / 100; // knot spans x 0 → nodeL
    const txtB = p00.querySelector('.txt').getBoundingClientRect().bottom - p00.getBoundingClientRect().top;   // headline block bottom (panel-local)
    const up = Math.max(14, Math.min(52, yl - txtB - 12)), dn = Math.min(84, ph - yl - 44);                      // knot amplitude: never into the text, never out of the panel
    const knot = `M0 ${yl - up * 0.4} C ${16 * k} ${yl - up}, ${44 * k} ${yl + dn * 0.9}, ${28 * k} ${yl - up * 0.2} S ${8 * k} ${yl + dn}, ${40 * k} ${yl + dn * 0.5} S ${66 * k} ${yl - up}, ${50 * k} ${yl - up * 0.5} S ${30 * k} ${yl + dn * 0.8}, ${64 * k} ${yl + dn * 0.4} S ${86 * k} ${yl - up * 0.9}, ${78 * k} ${yl - up * 0.15} C ${84 * k} ${yl + dn * 0.25}, ${90 * k} ${yl}, ${100 * k} ${yl}`;
    heroDia.innerHTML = `<path class="knot" d="${knot}"/>`;
    // the line: node → seat in 09
    const seat = p09.querySelector('.seat'), ampX = Math.round(p09._x + p09._w / 2), endX = ampX;
    const d = `M${nodeX} ${y} H${endX}`;
    hline.setAttribute('width', W); hline.setAttribute('height', H); hline.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // shared diagrams on project panels + five nodes in 06
    const dia = panels.filter(p => p.dataset.slug).map(p => `<g class="pd" data-x0="${Math.round(p._x + p._w * 0.40)}" data-x1="${Math.round(p._x + p._w * 0.9)}">${PANELS.diagramSVG(p.dataset.slug, { shared: true, y, x0: Math.round(p._x + p._w * 0.40), node: Math.round(p._x + p._w * 0.56), x1: Math.round(p._x + p._w - 56) })}</g>`).join('');
    const nodes = panels.flatMap(p => [...p.querySelectorAll('.nodes span')].map(s => { const r = s.getBoundingClientRect(), x = Math.round(p._x + (r.left + r.width / 2 - p.getBoundingClientRect().left)); s.dataset.x = x; return `<circle class="d-node n6" data-x="${x}" cx="${x}" cy="${y}" r="5"/>`; })).join('');
    hline.innerHTML = `<path class="guide" d="${d}"/><path class="ink" d="${d}"/>${dia}${nodes}`;
    ink = hline.querySelector('.ink'); lineLen = ink.getTotalLength(); ink.style.strokeDasharray = lineLen; ink.style.strokeDashoffset = lineLen;
    hline.querySelectorAll('.pd').forEach(g => PANELS.prep(g));
    // dark clone over 08
    const dk = document.getElementById('hline-dark'); dk.style.left = p08._x + 'px'; dk.style.width = p08._w + 'px';
    dk.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:${-p08._x}px"><path class="guide" d="${d}"/><path class="ink" d="${d}" style="stroke-dasharray:${lineLen};stroke-dashoffset:${lineLen}"/></svg>`;
    // 09 rules
    const ruleLen = Math.min(260, p09._w / 2 - 60), rr = p09.querySelector('.rule.r'); rr.style.left = (p09._w / 2 + 14) + 'px'; rr.style.width = ruleLen + 'px';
    geo = { W, H, y, nodeX, endX, ampX, darkL: p08._x, darkR: p08._x + p08._w };
    // snap targets (scrollLeft values): panels with nodes → each node under the marker (50vw); others → panel start; last → end
    const vw = innerWidth, limit = W - vw;
    snaps = [];
    panels.forEach((p, i) => {
      const ns = [...p.querySelectorAll('.nodes span')];
      if (i === panels.length - 1) snaps.push(limit);
      else if (ns.length) ns.forEach(n => snaps.push(+n.dataset.x - vw / 2));
      else snaps.push(i === 0 ? 0 : p._x - 12);
    });
    snaps = [...new Set(snaps.map(v => Math.max(0, Math.min(limit, Math.round(v)))))].sort((a, b) => a - b);
    tipMin = 0;
  }
  const current = () => { const c = sl() + innerWidth * 0.5; let i = 0; panels.forEach((p, k) => { if (p._x <= c) i = k; }); return i; };

  function render() {
    const s = sl(), vw = innerWidth, maxS = geo.W - vw;
    let tipX;
    if (!launched) tipX = geo.nodeX + animTip;
    else {
      const k = Math.max(0, Math.min(1, (s - (maxS - vw)) / vw));                       // 끝: 마지막 화면에서 & 자리까지 달려감
      const lead = (vw * 0.5 - geo.nodeX) * Math.max(0, 1 - s / 600);                   // 시작: 첫 600px 동안 선의 시작점에서 화면 중앙으로 옮겨감
      tipX = s + vw * 0.5 - lead + k * (geo.endX - (maxS + vw * 0.5));
      tipX = Math.max(geo.nodeX + tipMin, Math.min(geo.endX, tipX));
    }
    const len = tipX - geo.nodeX;
    ink.style.strokeDashoffset = lineLen - len; const dkInk = document.querySelector('#hline-dark .ink'); if (dkInk) dkInk.style.strokeDashoffset = lineLen - len;
    hline.querySelectorAll('.pd').forEach(g => PANELS.progress(g, Math.min(1, Math.max(0, (tipX - +g.dataset.x0) / (+g.dataset.x1 - +g.dataset.x0)))));
    hline.querySelectorAll('.n6').forEach(n => n.style.fill = tipX >= +n.dataset.x ? '#2B3160' : '#FAF9F6');
    document.querySelectorAll('.nodes span').forEach(n => n.classList.toggle('on', tipX >= +n.dataset.x));
    const marker = document.getElementById('marker'); st.tipX = tipX; st.s = s; if (!launched || !lenis) marker.style.transform = `translate(${tipX - s}px, ${geo.y}px)`;
    marker.classList.toggle('dark', tipX >= geo.darkL && tipX < geo.darkR);
    const rest = tipX >= geo.endX - 0.5; marker.classList.toggle('rest', rest); panels[panels.length - 1].classList.toggle('done', rest);
    const hdr = document.querySelector('.hdr'); hdr.classList.toggle('on-dark', s + 40 >= geo.darkL && s + 40 < geo.darkR - vw * 0.2);
    const cur = current(); document.querySelectorAll('#pmap i').forEach((b, i) => { b.classList.toggle('on', i === cur); b.classList.toggle('done', i < cur); });
    const id = panels[cur].id; if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  }

  function intro(skip) {
    const heroDia = document.getElementById('hero-dia'), marker = document.getElementById('marker'), brand = document.querySelector('.hdr .brand'), bamp = brand.querySelector('.bamp');
    const srcs = heroDia.querySelectorAll('.knot'), texts = heroDia.querySelectorAll('text, .node');
    // progress map widths ∝ panel widths
    const tot = panels.reduce((a, p) => a + p._w, 0); document.querySelectorAll('#pmap i').forEach((b, i) => b.style.width = Math.max(6, Math.round(panels[i]._w / tot * 260)) + 'px');
    if (skip || !window.gsap) { launched = true; marker.style.opacity = 1; brand.classList.add('amp-gone'); render(); return; }
    srcs.forEach(sp => { const L = sp.getTotalLength(); sp.style.strokeDasharray = L; sp.style.strokeDashoffset = L; }); texts.forEach(t => t.style.opacity = 0);
    gsap.timeline({ delay: 0.2 })
      .to(srcs, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' })
      .to(texts, { opacity: 1, duration: 0.3 }, '-=0.3')
      .call(() => { animTip = 0; render(); })
      .call(() => {
        const from = bamp.getBoundingClientRect(), ghost = marker.cloneNode(true); ghost.id = 'marker-ghost'; ghost.style.opacity = 1; document.body.appendChild(ghost); brand.classList.add('amp-gone');
        gsap.fromTo(ghost, { x: from.left + from.width / 2, y: from.top + from.height / 2, scale: 0.75 }, { x: geo.nodeX + tipMin - sl(), y: geo.y, scale: 1, duration: 0.9, ease: 'power3.inOut', onComplete() { ghost.remove(); marker.style.opacity = 1; launched = true; render(); } });
      });
  }
  V.zoom = ZOOM;
  return V;
})();
