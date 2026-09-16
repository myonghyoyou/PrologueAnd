/* v5 — horizontal-only engine: Lenis horizontal on a native overflow-x wrapper, one straight line (S1) across the track,
   travelling & (S2) fixed at (50vw, 60vh), progress map in the header, Projects/Case Study as centred sheets. */
window.V5 = (function () {
  const V = {};
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desktop = () => matchMedia('(min-width:1024px)').matches;
  const LINE = () => Math.round(innerHeight * 0.60);
  let wrap, track, lenis = null, panels = [], hline, ink, guide, lineLen = 0, geo = {}, launched = false, animTip = 0, tipMin = 0;
  /* 이동 중 축소 (V2 계승): 속도에 비례해 트랙을 최대 ZOOM.max 만큼 축소, 기준점은 매 프레임 화면 중심 */
  const ZOOM = { max: 0.12, vel: 28, ease: 0.18, on: !reduced && localStorage.getItem('v5-zoom') !== 'off' };   // 시안 조정: ?zoom=0.10&vel=30 (max = 최대 축소율, vel = 최대 축소에 이르는 속도 px/frame)
  { const q = new URLSearchParams(location.search); if (q.get('zoom')) ZOOM.max = +q.get('zoom'); if (q.get('vel')) ZOOM.vel = +q.get('vel'); if (q.get('zoom') === '0') ZOOM.on = false; }
  const st = { tipX: 0, s: 0, z: 1 };
  function tick() {
    if (!launched) return;
    const v = lenis ? Math.abs(lenis.velocity || 0) : 0;
    const zt = ZOOM.on ? 1 - Math.min(1, v / ZOOM.vel) * ZOOM.max : 1;
    st.z += (zt - st.z) * ZOOM.ease; if (Math.abs(st.z - zt) < 0.0005) st.z = zt;
    const cx = st.s + innerWidth / 2, cy = innerHeight / 2, z = st.z;
    track.style.transformOrigin = `${cx}px ${cy}px`; track.style.transform = z < 0.9995 ? `scale(${z})` : '';
    const mx = innerWidth / 2 + (st.tipX - st.s - innerWidth / 2) * z, my = cy + (geo.y - cy) * z;
    document.getElementById('marker').style.transform = `translate(${mx}px, ${my}px) scale(${z})`;
  }

  /* ---------- markup: project panels 02~05, panel 07 list, progress map ---------- */
  V.build = function () {
    wrap = document.getElementById('hwrap'); track = document.getElementById('htrack');
    const feats = V3.featured(), N = feats.length, p06 = document.getElementById('p06');
    feats.forEach((p, i) => {
      const pr = V3.problem(p.problem), d = PANELS.get(p.slug), lg = p.title.length > 16 ? 'lg' : '';
      const el = document.createElement('a'); el.className = `hp page pan pj ${lg}`; el.id = 'p' + String(i + 2).padStart(2, '0'); el.href = `../v3/case.html?p=${p.slug}`; el.dataset.slug = p.slug; el.dataset.sheet = el.href;
      el.innerHTML = `<span class="pcap">${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')} · ${pr.name}</span><span class="cs">Case Study →</span>
        <div class="shape-area">${PANELS.shapeHTML(d.shape)}</div><h2><span class="amp">&amp;</span>${p.title}</h2>
        <div class="mdia">${PANELS.diagramSVG(p.slug, { w: 360, h: 130, x0: 64 })}</div>
        <div class="prob"><b>문제 ${String(i + 1).padStart(2, '0')}<span class="amp">&amp;</span>${pr.name}</b><span>${pr.desc}</span></div>${PANELS.numsHTML(p.slug)}`;
      track.insertBefore(el, p06);
    });
    const rest = V3.projects.filter(p => !p.featured);
    document.getElementById('restN').textContent = rest.length;
    document.getElementById('restList').innerHTML = rest.map(p => `<li><span class="amp">&amp;</span>${p.title} <span class="cap">· ${p.year}</span></li>`).join('');
    panels = [...track.querySelectorAll('.hp')];
    const labels = ['Prologue', '01', ...feats.map((p, i) => `문제 0${i + 1} · ${p.title}`), '다섯 단계', 'Projects', '문의', '&'];
    document.getElementById('pmap').innerHTML = panels.map((el, i) => `<i data-i="${i}" data-l="${labels[i] || ''}"></i>`).join('');
    if (!desktop()) {
      track.querySelectorAll('.mdia').forEach(m => PANELS.prep(m));
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const m = e.target, t0 = performance.now(); const step = now => { const t = Math.min(1, (now - t0) / 1100); PANELS.progress(m, t); if (t < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); io.unobserve(m); } }), { threshold: 0.4 });
      track.querySelectorAll('.mdia').forEach(m => io.observe(m));
      V3.initMobilePos(panels.map(p => p.id));
    } else track.querySelectorAll('.mdia').forEach(m => m.style.display = 'none');
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
  V.goTo = (x, immediate) => { if (lenis) lenis.scrollTo(x, { duration: immediate ? 0 : 1.1, immediate: !!immediate }); else wrap.scrollTo({ left: x, behavior: immediate ? 'auto' : 'smooth' }); };

  V.init = function () {
    if (!desktop()) return;
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ wrapper: wrap, content: track, orientation: 'horizontal', gestureOrientation: 'both', lerp: 0.1, smoothWheel: true, wheelMultiplier: 1.4 });
      V3.lenis = lenis; // drawer stop/start
      gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    }
    hline = document.getElementById('hline');
    build();
    const marker = document.getElementById('marker');
    document.getElementById('pmap').addEventListener('click', e => { const i = e.target.closest('i'); if (i) V.goTo(panels[+i.dataset.i].offsetLeft - (panels[+i.dataset.i].classList.contains('page') ? 12 : 0)); });
    document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); V.goTo(document.getElementById(a.dataset.go).offsetLeft - 12); }));
    addEventListener('keydown', e => { if (document.getElementById('sheet').classList.contains('on')) return; const cur = current(); if (e.key === 'ArrowRight' && cur < panels.length - 1) V.goTo(panels[cur + 1].offsetLeft - 12); if (e.key === 'ArrowLeft' && cur > 0) V.goTo(panels[cur - 1].offsetLeft - 12); if (e.key === 'Home') V.goTo(0); if (e.key === 'End') V.goTo(track.scrollWidth); });
    // hash → start position (skip intro)
    const hash = location.hash.replace('#', ''); const target = hash && document.getElementById(hash);
    if (target) { wrap.scrollLeft = target.offsetLeft - 12; }
    intro(!!target || reduced || sl() > innerWidth * 0.3);
    (lenis ? lenis.on.bind(lenis) : wrap.addEventListener.bind(wrap))('scroll', render);
    if (lenis) gsap.ticker.add(tick);
    // zoom toggle (mockup)
    const tg = document.getElementById('zoomToggle'), info = document.getElementById('zoomInfo');
    if (tg) { tg.checked = ZOOM.on; const upd = () => info.textContent = ZOOM.on ? `최대 ${Math.round(ZOOM.max * 100)}% · 속도 ${ZOOM.vel} · ease ${ZOOM.ease}` : '끔'; upd(); tg.addEventListener('change', () => { ZOOM.on = tg.checked; localStorage.setItem('v5-zoom', ZOOM.on ? 'on' : 'off'); upd(); }); }
    addEventListener('resize', () => { build(); render(); if (lenis) lenis.resize(); });
    if (lenis) lenis.resize();
  };

  function build() {
    const W = track.scrollWidth, H = innerHeight, y = LINE();
    panels.forEach(p => { p._x = p.offsetLeft; p._w = p.offsetWidth; });
    const p00 = panels[0], p08 = panels.find(p => p.classList.contains('p08')), p09 = panels[panels.length - 1];
    const pt = p00.offsetTop, nodeL = Math.round(p00._w * 0.56), nodeX = p00._x + nodeL, yl = y - pt;   // panel-local coords for the hero svg
    // hero sources (in the track svg, panel 00 coordinates == track coordinates)
    const srcX = Math.round(p00._w - 100), ys = [-96, -32, 32, 96].map(d => y + d), names = ['전화', '메신저', '이메일', '직접 방문'];
    const heroDia = document.getElementById('hero-dia');
    const ph = p00.offsetHeight; heroDia.setAttribute('viewBox', `0 0 ${p00._w} ${ph}`); heroDia.setAttribute('width', p00._w); heroDia.setAttribute('height', ph);
    heroDia.innerHTML = ys.map(yy => `<path class="src" d="M${srcX} ${yy - pt} C ${srcX - 140} ${yy - pt}, ${nodeL + 120} ${yl}, ${nodeL} ${yl}"/>`).join('') + ys.map((yy, i) => `<text x="${srcX + 10}" y="${yy - pt + 4}">${names[i]}</text>`).join('') + `<circle class="node" cx="${nodeL}" cy="${yl}" r="4"/><text x="${nodeL}" y="${yl - 14}" text-anchor="middle">하나의 흐름</text>`;
    // the line: node → seat in 09
    const seat = p09.querySelector('.seat'), ampX = Math.round(p09._x + p09._w / 2), endX = ampX - 14;
    const d = `M${nodeX} ${y} H${endX}`;
    hline.setAttribute('width', W); hline.setAttribute('height', H); hline.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // shared diagrams on project panels + five nodes in 06
    const dia = panels.filter(p => p.dataset.slug).map(p => `<g class="pd" data-x0="${Math.round(p._x + p._w * 0.40)}" data-x1="${Math.round(p._x + p._w * 0.9)}">${PANELS.diagramSVG(p.dataset.slug, { shared: true, y, x0: Math.round(p._x + p._w * 0.40), node: Math.round(p._x + p._w * 0.56), x1: Math.round(p._x + p._w - 56) })}</g>`).join('');
    const p06 = document.getElementById('p06'), steps = [...p06.querySelectorAll('.step')];
    const nodes = steps.map((s, i) => { const r = s.getBoundingClientRect(), x = Math.round(p06._x + (r.left + r.width / 2 - p06.getBoundingClientRect().left)); return `<circle class="d-node n6" data-x="${x}" cx="${x}" cy="${y}" r="5"/>`; }).join('');
    hline.innerHTML = `<path class="guide" d="${d}"/><path class="ink" d="${d}"/>${dia}${nodes}`;
    ink = hline.querySelector('.ink'); lineLen = ink.getTotalLength(); ink.style.strokeDasharray = lineLen; ink.style.strokeDashoffset = lineLen;
    hline.querySelectorAll('.pd').forEach(g => PANELS.prep(g));
    // dark clone over 08
    const dk = document.getElementById('hline-dark'); dk.style.left = p08._x + 'px'; dk.style.width = p08._w + 'px';
    dk.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:${-p08._x}px"><path class="guide" d="${d}"/><path class="ink" d="${d}" style="stroke-dasharray:${lineLen};stroke-dashoffset:${lineLen}"/></svg>`;
    // 09 rules
    const ruleLen = Math.min(260, p09._w / 2 - 60), rr = p09.querySelector('.rule.r'); rr.style.left = (p09._w / 2 + 14) + 'px'; rr.style.width = ruleLen + 'px';
    // flag in 08: line → drop → button
    const btn = p08.querySelector('.btn'), br = btn.getBoundingClientRect(), pr = p08.getBoundingClientRect(), bx = br.left - pr.left, by = br.top - pr.top + br.height / 2, flag = document.getElementById('flag');
    const p8h = p08.offsetHeight; flag.setAttribute('viewBox', `0 0 ${p08._w} ${p8h}`); flag.setAttribute('width', p08._w); flag.setAttribute('height', p8h);
    const fx = bx - 60, y8 = y - p08.offsetTop; flag.innerHTML = `<path d="M${fx} ${y8} V${by} H${bx - 26}"/><polygon points="${bx - 26},${by - 6} ${bx - 12},${by} ${bx - 26},${by + 6}"/>`;
    geo = { W, H, y, nodeX, endX, ampX, darkL: p08._x, darkR: p08._x + p08._w, flagX: p08._x + fx };
    tipMin = 120;
  }
  const current = () => { const c = sl() + innerWidth * 0.5; let i = 0; panels.forEach((p, k) => { if (p._x <= c) i = k; }); return i; };

  function render() {
    const s = sl(), vw = innerWidth, maxS = geo.W - vw;
    let tipX;
    if (!launched) tipX = geo.nodeX + animTip;
    else { const k = Math.max(0, Math.min(1, (s - (maxS - vw)) / vw)); tipX = s + vw * 0.5 + k * (geo.endX - (maxS + vw * 0.5)); tipX = Math.max(geo.nodeX + tipMin, Math.min(geo.endX, tipX)); }
    const len = tipX - geo.nodeX;
    ink.style.strokeDashoffset = lineLen - len; const dkInk = document.querySelector('#hline-dark .ink'); if (dkInk) dkInk.style.strokeDashoffset = lineLen - len;
    hline.querySelectorAll('.pd').forEach(g => PANELS.progress(g, Math.min(1, Math.max(0, (tipX - +g.dataset.x0) / (+g.dataset.x1 - +g.dataset.x0)))));
    hline.querySelectorAll('.n6').forEach(n => n.style.fill = tipX >= +n.dataset.x ? '#2B3160' : '#FAF9F6');
    const marker = document.getElementById('marker'); st.tipX = tipX; st.s = s; if (!launched || !lenis) marker.style.transform = `translate(${tipX - s}px, ${geo.y}px)`;
    marker.classList.toggle('dark', tipX >= geo.darkL && tipX < geo.darkR);
    const rest = tipX >= geo.endX - 0.5; marker.classList.toggle('rest', rest); panels[panels.length - 1].classList.toggle('done', rest);
    document.getElementById('flag').classList.toggle('on', tipX >= geo.flagX - 2);
    const hdr = document.querySelector('.hdr'); hdr.classList.toggle('on-dark', s + 40 >= geo.darkL && s + 40 < geo.darkR - vw * 0.2);
    const cur = current(); document.querySelectorAll('#pmap i').forEach((b, i) => { b.classList.toggle('on', i === cur); b.classList.toggle('done', i < cur); });
    const id = panels[cur].id; if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  }

  function intro(skip) {
    const heroDia = document.getElementById('hero-dia'), marker = document.getElementById('marker'), brand = document.querySelector('.hdr .brand'), bamp = brand.querySelector('.bamp');
    const srcs = heroDia.querySelectorAll('.src'), texts = heroDia.querySelectorAll('text, .node');
    // progress map widths ∝ panel widths
    const tot = panels.reduce((a, p) => a + p._w, 0); document.querySelectorAll('#pmap i').forEach((b, i) => b.style.width = Math.max(6, Math.round(panels[i]._w / tot * 260)) + 'px');
    if (skip || !window.gsap) { launched = true; marker.style.opacity = 1; brand.classList.add('amp-gone'); render(); return; }
    srcs.forEach(sp => { const L = sp.getTotalLength(); sp.style.strokeDasharray = L; sp.style.strokeDashoffset = L; }); texts.forEach(t => t.style.opacity = 0);
    gsap.timeline({ delay: 0.2 })
      .to(srcs, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.06 })
      .to(texts, { opacity: 1, duration: 0.3 }, '-=0.3')
      .to({ v: 0 }, { v: tipMin, duration: 1.0, ease: 'power2.inOut', onUpdate() { animTip = this.targets()[0].v; render(); } }, '-=0.2')
      .call(() => {
        const from = bamp.getBoundingClientRect(), ghost = marker.cloneNode(true); ghost.id = 'marker-ghost'; ghost.style.opacity = 1; document.body.appendChild(ghost); brand.classList.add('amp-gone');
        gsap.fromTo(ghost, { x: from.left + from.width / 2, y: from.top + from.height / 2, scale: 0.75 }, { x: geo.nodeX + tipMin - sl(), y: geo.y, scale: 1, duration: 0.9, ease: 'power3.inOut', onComplete() { ghost.remove(); marker.style.opacity = 1; launched = true; render(); } });
      });
  }
  V.zoom = ZOOM;
  return V;
})();
