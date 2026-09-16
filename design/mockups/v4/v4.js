/* v4 — hybrid engine: v3 vertical skeleton + pinned horizontal strip for section 01.
   Line S1 in three segments: ① page (hero → strip top), ② track (inside the pinned strip), ③ page (strip bottom → footer). */
window.V4 = (function () {
  const V = {};
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desktop = () => matchMedia('(min-width:1024px)').matches;
  const railX = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rail-x')) || 48;
  const HDR = 64, R = 24;

  /* ---------- markup ---------- */
  V.buildStrip = function () {
    const feats = V3.featured(), N = feats.length;
    const track = document.getElementById('track');
    const pan = (p, i) => {
      const pr = V3.problem(p.problem), d = PANELS.get(p.slug);
      const words = p.title.split(' ').length, lines = p.title.length > 16 ? 'lg' : '';
      return `<a class="pan pj ${lines}" href="../v3/case.html?p=${p.slug}" data-slug="${p.slug}">
        <span class="pcap">${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')} · ${pr.name}</span>
        <span class="cs">Case Study →</span>
        <div class="shape-area">${PANELS.shapeHTML(d.shape)}</div>
        <h2><span class="amp">&amp;</span>${p.title}</h2>
        <div class="mdia">${PANELS.diagramSVG(p.slug, { w: 360, h: 130, x0: 64 })}</div>
        <div class="prob"><b>문제 ${String(i + 1).padStart(2, '0')}<span class="amp">&amp;</span>${pr.name}</b><span>${pr.desc}</span></div>
        ${PANELS.numsHTML(p.slug)}
      </a>`;
    };
    track.innerHTML = `<div class="pan title"><span class="num">01</span><div class="h1">이런 문제를<br>이렇게 풀었습니다</div><div class="hint"><span class="cap">오른쪽으로 넘기세요 →</span><a class="cap link" href="#how" data-skip>02 일하는 방식으로 →</a></div></div>`
      + feats.map(pan).join('')
      + `<div class="pan tail"><a class="link" href="../v3/projects.html">Projects 전체 보기 →</a><a class="cap link" href="#how" data-skip>02 일하는 방식으로 →</a></div>`;
    document.getElementById('prog').innerHTML = feats.map(() => '<i></i>').join('');
    // mobile: draw self-contained diagrams when visible
    if (!desktop()) {
      track.querySelectorAll('.mdia').forEach(m => PANELS.prep(m));
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const m = e.target, t0 = performance.now(); const step = now => { const t = Math.min(1, (now - t0) / 1100); PANELS.progress(m, t); if (t < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); io.unobserve(m); } }), { threshold: 0.4 });
      track.querySelectorAll('.mdia').forEach(m => io.observe(m));
    } else { track.querySelectorAll('.mdia').forEach(m => m.style.display = 'none'); }
  };

  /* ---------- scrolling ---------- */
  V.lenis = null; V.st = null;
  V.scrollTo = (el, offset) => { if (V.lenis) V.lenis.scrollTo(el, { offset: offset || 0, duration: 1.1 }); else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + (offset || 0), behavior: 'smooth' }); };

  V.init = function () {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduced && window.Lenis) {
      V.lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1.4 }); // 140px per notch (docs/16 §7-① 임시값)
      V3.lenis = V.lenis;
      document.documentElement.classList.add('lenis');
      V.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => V.lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    if (!desktop()) return;
    initPinnedStrip();
    initLine();
  };

  /* ---------- ② pinned strip ---------- */
  let strip, track, tl, tlPath, tlInk, maxX = 0, trackW = 0, lineY = 0, stripH = 0, tlLen = 0, p = 0, panels = [];
  function initPinnedStrip() {
    strip = document.getElementById('strip'); track = document.getElementById('track'); tl = document.getElementById('tl');
    layoutStrip();
    V.st = ScrollTrigger.create({
      trigger: strip, start: 'top ' + HDR + 'px', end: () => '+=' + maxX, pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: self => { p = self.progress; renderStrip(); if (V.renderLine) V.renderLine(); },
      onRefresh: () => { layoutStrip(); renderStrip(); if (V.rebuildLine) V.rebuildLine(); }
    });
    document.querySelectorAll('[data-skip]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); V.scrollTo(document.getElementById('how'), -64); }));
  }
  function layoutStrip() {
    stripH = strip.querySelector('.strip-pin').clientHeight;
    trackW = track.scrollWidth; maxX = Math.max(0, trackW - innerWidth);
    lineY = Math.round(HDR + (stripH - HDR - 24) * 0.58); // within the pinned box
    panels = [...track.querySelectorAll('.pan')].map(el => ({ el, x: el.offsetLeft, w: el.offsetWidth, slug: el.dataset.slug }));
    const tail = panels[panels.length - 1], exitX = Math.round(tail.x + tail.w / 2);
    const rx = railX();
    // track path: (rx, 0) stub down → corner → across → corner at tail → down to strip bottom
    const d = `M${rx} 0 V${lineY - R} Q${rx} ${lineY} ${rx + R} ${lineY} H${exitX - R} Q${exitX} ${lineY} ${exitX} ${lineY + R} V${stripH}`;
    // shared diagrams per project panel, in track coordinates
    const dia = panels.filter(q => q.slug).map(q => `<g class="pd" data-slug="${q.slug}">${PANELS.diagramSVG(q.slug, { shared: true, y: lineY, x0: Math.round(q.x + q.w * 0.40), node: Math.round(q.x + q.w * 0.56), x1: Math.round(q.x + q.w - 56) })}</g>`).join('');
    tl.setAttribute('width', trackW); tl.setAttribute('height', stripH); tl.setAttribute('viewBox', `0 0 ${trackW} ${stripH}`);
    tl.innerHTML = `<path class="guide" d="${d}"/><path class="ink" d="${d}"/>${dia}`;
    tlPath = tl.querySelector('.ink'); tlLen = tlPath.getTotalLength(); tlPath.style.strokeDasharray = tlLen;
    tl.querySelectorAll('.pd').forEach(g => PANELS.prep(g));
    V.geo2 = { exitX, rx };
  }
  function tipLen2() {
    // ease in: from the stub point where ① handed over (viewport 50vh) to viewport x = 50vw; ease out: to the end of the path
    const start = Math.max(0, Math.min(innerHeight * 0.5 - HDR, lineY - R));
    const base = innerWidth * 0.5 + p * maxX;               // track x under viewport centre
    const inLen = (lineY - R) + R * 1.57 + (base - (V.geo2.rx + R)); // path length to that x (stub + corner + horizontal)
    let len = start + (inLen - start) * Math.min(1, p / 0.05);
    if (p > 0.95) len = len + (tlLen - len) * ((p - 0.95) / 0.05);
    return Math.max(0, Math.min(tlLen, len));
  }
  function renderStrip() {
    const tx = -p * maxX;
    track.style.transform = `translateX(${tx}px)`; tl.style.transform = `translateX(${tx}px)`;
    const len = tipLen2(); tlPath.style.strokeDashoffset = tlLen - len;
    // diagrams draw as the tip crosses their panel
    const tipX = tlPath.getPointAtLength(len).x;
    tl.querySelectorAll('.pd').forEach(g => { const q = panels.find(z => z.slug === g.dataset.slug); PANELS.progress(g, Math.min(1, Math.max(0, (tipX - (q.x + q.w * 0.40)) / (q.w * 0.5)))); });
    // current panel: last project panel whose left edge passed viewport centre
    const cur = panels.filter(q => q.slug).reduce((acc, q, i) => (q.x + tx <= innerWidth * 0.5 ? i : acc), -1);
    document.querySelectorAll('#prog i').forEach((b, i) => { b.classList.toggle('on', i === cur); b.classList.toggle('done', i < cur); });
    // stub (fixed layer) fades as the strip starts moving
    document.getElementById('stub').style.opacity = 1 - Math.min(1, p / 0.05);
    V.p = p;
  }

  /* ---------- ① and ③ page segments + marker ---------- */
  function initLine() {
    const hero = document.getElementById('hero'), heroDia = document.getElementById('hero-dia');
    const line = document.getElementById('line'), dark = document.getElementById('line-dark'), marker = document.getElementById('marker');
    const contact = document.getElementById('contact'), seat = document.querySelector('.logo-bottom .seat'), logoBottom = document.querySelector('.logo-bottom');
    const flag = document.getElementById('flag'), brand = document.querySelector('.hdr .brand'), hdr = document.querySelector('.hdr'), stub = document.getElementById('stub');
    let pathA, pathC, darkPath, lenA, lenC, geo = {}, animTip = 0, launched = false, tipMin = 0;
    const docRect = el => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };

    function build() {
      const rx = railX(), W = document.documentElement.clientWidth, H = document.documentElement.scrollHeight;
      const hr = docRect(hero), lineYh = Math.round(hr.y + hr.h * 0.72), nodeX = Math.round(W * 0.56);
      document.documentElement.style.setProperty('--hero-line-y', (hr.h * 0.72) + 'px');
      // hero sources (same as v3)
      const srcX = Math.round(W - 100), ys = [-96, -32, 32, 96].map(d => lineYh + d), names = ['전화', '메신저', '이메일', '직접 방문'], ly = y => y - hr.y;
      heroDia.setAttribute('viewBox', `0 0 ${W} ${hr.h}`); heroDia.setAttribute('width', W); heroDia.setAttribute('height', hr.h);
      heroDia.innerHTML = ys.map(y => `<path class="src" d="M${srcX} ${ly(y)} C ${srcX - 140} ${ly(y)}, ${nodeX + 120} ${ly(lineYh)}, ${nodeX} ${ly(lineYh)}"/>`).join('') + ys.map((y, i) => `<text x="${srcX + 10}" y="${ly(y) + 4}">${names[i]}</text>`).join('') + `<circle class="node" cx="${nodeX}" cy="${ly(lineYh)}" r="4"/><text x="${nodeX}" y="${ly(lineYh) - 14}" text-anchor="middle">하나의 흐름</text>`;
      // strip doc positions from ScrollTrigger
      const pinStart = V.st.start, pinEnd = V.st.end;
      const stripTopA = pinStart + HDR;                 // doc y of strip top when the pin starts
      const stripBottomC = pinEnd + HDR + stripH;       // doc y of strip bottom after the pin ends
      // ① hero node → rail → down to strip top (hidden under the strip after that)
      const handY = stripTopA + Math.min(innerHeight * 0.5 - HDR, lineY - R);   // where ② takes over (hidden under the strip)
      const dA = `M${nodeX} ${lineYh} H${rx + R} Q${rx} ${lineYh} ${rx} ${lineYh + R} V${handY}`;
      // ③ exit at tail x (viewport x at p=1 = exitX - maxX) → down → back to rail → down → footer seat
      const exitVX = V.geo2.exitX - maxX, sr = docRect(seat), ampX = Math.round(sr.x + sr.w / 2), ampY = Math.round(sr.y + sr.h / 2);
      const yBack = stripBottomC + 48;
      const dC = `M${exitVX} ${stripBottomC - 4} V${yBack - R} Q${exitVX} ${yBack} ${exitVX - R} ${yBack} H${rx + R} Q${rx} ${yBack} ${rx} ${yBack + R} V${ampY - R} Q${rx} ${ampY} ${rx + R} ${ampY} H${ampX - 30}`;
      line.setAttribute('width', W); line.setAttribute('height', H); line.setAttribute('viewBox', `0 0 ${W} ${H}`);
      line.innerHTML = `<path class="guide" d="${dA}"/><path class="ink a" d="${dA}"/><path class="guide" d="${dC}"/><path class="ink c" d="${dC}"/>`;
      pathA = line.querySelector('.ink.a'); pathC = line.querySelector('.ink.c');
      lenA = pathA.getTotalLength(); lenC = pathC.getTotalLength();
      pathA.style.strokeDasharray = lenA; pathC.style.strokeDasharray = lenC; pathC.style.strokeDashoffset = lenC;
      tipMin = (nodeX - rx) + R * 0.6 + 36;
      // stub inside the strip (fixed layer): from strip top down to the corner, matches the track path start
      stub.setAttribute('viewBox', `0 0 120 ${stripH}`); stub.setAttribute('height', stripH);
      stub.innerHTML = `<path class="g" d="M${rx} 0 V${lineY - R}"/><path class="ink" d="M${rx} 0 V${lineY - R}" style="stroke-dasharray:${lineY - R};stroke-dashoffset:${lineY - R}"/>`;
      // dark clone for ③
      const cr = docRect(contact);
      dark.style.top = cr.y + 'px'; dark.style.height = cr.h + 'px';
      dark.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="top:${-cr.y}px"><path class="guide" d="${dC}"/><path class="ink" d="${dC}" style="stroke-dasharray:${lenC};stroke-dashoffset:${lenC}"/></svg>`;
      darkPath = dark.querySelector('.ink');
      // footer rules, flag, labels (as v3)
      const rr = logoBottom.querySelector('.rule.r'), rl = logoBottom.querySelector('.rule.l'), lbr = docRect(logoBottom), ruleLen = Math.min(260, (ampX - lbr.x) - 40);
      rr.style.left = (ampX + 30 - lbr.x) + 'px'; rr.style.width = ruleLen + 'px'; rl.style.left = (ampX - 30 - ruleLen - lbr.x) + 'px'; rl.style.width = ruleLen + 'px';
      const btn = contact.querySelector('.btn'), br = docRect(btn), fy = br.y + br.h / 2 - cr.y, fx = br.x - cr.x;
      flag.setAttribute('viewBox', `0 0 ${W} ${cr.h}`); flag.setAttribute('width', W); flag.setAttribute('height', cr.h);
      flag.innerHTML = `<path d="M${rx} ${fy} H${fx - 26}"/><polygon points="${fx - 26},${fy - 6} ${fx - 12},${fy} ${fx - 26},${fy + 6}"/>`;
      document.querySelectorAll('.rail-lbl').forEach(l => { const s = document.getElementById(l.dataset.for); if (!s) return; const y = docRect(s).y + (parseFloat(l.dataset.offset) || 0); l.style.top = y + 'px'; l.dataset.y = y; l.classList.toggle('dark', y >= cr.y && y < cr.y + cr.h); });
      geo = { rx, lineYh, nodeX, pinStart, pinEnd, stripTopA, stripBottomC, ampX, ampY, darkTop: cr.y, darkBottom: cr.y + cr.h, flagY: br.y + br.h / 2, H,
        lenAAt: y => (nodeX - rx) + R * 0.57 + (y - lineYh - R),                       // ① doc y → length
        lenCAt: y => {                                                                   // ③ doc y → length, piecewise: stub down / horizontal return / rail down
          const s0 = stripBottomC - 4, v1 = yBack - R - s0, horiz = (exitVX - rx) + R * 1.14, span = 2 * R + 160;
          if (y <= s0) return 0;
          if (y <= yBack - R) return y - s0;
          if (y <= yBack - R + span) return v1 + horiz * (y - (yBack - R)) / span;
          return v1 + horiz + (y - (yBack - R + span)); } };
      geo.stubLen = lineY - R;
    }

    function render() {
      const sy = scrollY, vh = innerHeight;
      let mx, my, phase;
      if (sy < geo.pinStart) {                                    // ① — tip at viewport centre, capped at the strip top
        phase = 1;
        const tipA = launched ? Math.max(tipMin, Math.min(lenA, geo.lenAAt(sy + vh * 0.5))) : animTip;
        pathA.style.strokeDashoffset = lenA - tipA; pathC.style.strokeDashoffset = lenC; darkPath.style.strokeDashoffset = lenC;
        const pt = pathA.getPointAtLength(tipA); mx = pt.x; my = pt.y - sy;
        const stripTopV = document.getElementById('strip').getBoundingClientRect().top; stub.querySelector('.ink').style.strokeDashoffset = geo.stubLen - Math.max(0, Math.min(geo.stubLen, my - stripTopV));
      } else if (sy < geo.pinEnd) {                               // ② — marker rides the track path
        phase = 2;
        pathA.style.strokeDashoffset = 0; pathC.style.strokeDashoffset = lenC; darkPath.style.strokeDashoffset = lenC; stub.querySelector('.ink').style.strokeDashoffset = 0;
        const pt = tlPath.getPointAtLength(tipLen2()); mx = pt.x - V.p * maxX; my = HDR + pt.y;
      } else {                                                    // ③ — waits at the strip bottom until the centre catches up, then rides down
        phase = 3;
        pathA.style.strokeDashoffset = 0;
        const maxS = geo.H - vh, k = Math.max(0, Math.min(1, (sy - (maxS - vh)) / vh));
        const ty = sy + vh * 0.5 + k * (geo.ampY - (maxS + vh * 0.5));
        let tipC = geo.lenCAt(Math.min(ty, geo.ampY)) + k * (lenC - geo.lenCAt(geo.ampY));
        tipC = Math.max(0, Math.min(lenC, tipC));
        pathC.style.strokeDashoffset = lenC - tipC; darkPath.style.strokeDashoffset = lenC - tipC;
        const pt = pathC.getPointAtLength(tipC); mx = pt.x; my = pt.y - sy;
        const rest = tipC >= lenC - 0.5; marker.classList.toggle('rest', rest); logoBottom.classList.toggle('done', rest);
        flag.classList.toggle('on', pt.y >= geo.flagY - 4);
      }
      if (phase !== 3) { marker.classList.remove('rest'); logoBottom.classList.remove('done'); flag.classList.remove('on'); }
      marker.style.transform = `translate(${mx}px, ${my}px)`;
      const docY = my + sy;
      marker.classList.toggle('dark', phase === 3 && docY >= geo.darkTop && docY < geo.darkBottom);
      hdr.classList.toggle('on-dark', sy + 32 >= geo.darkTop && sy + 32 < geo.darkBottom);
      document.querySelectorAll('.rail-lbl').forEach(l => l.classList.toggle('on', phase === 3 && docY >= parseFloat(l.dataset.y) - 8));
    }
    V.renderLine = render;
    V.rebuildLine = () => { build(); render(); };
    build();
    document.querySelectorAll('.rail-lbl').forEach(l => l.addEventListener('click', () => V.scrollTo(document.getElementById(l.dataset.for), -64)));

    /* intro (as v3): sources draw → ① to tipMin → & flies from the wordmark */
    const srcs = heroDia.querySelectorAll('.src'); srcs.forEach(s => { const L = s.getTotalLength(); s.style.strokeDasharray = L; s.style.strokeDashoffset = L; });
    const texts = heroDia.querySelectorAll('text, .node'); texts.forEach(t => t.style.opacity = 0);
    const bamp = brand.querySelector('.bamp');
    if (reduced || scrollY > innerHeight * 0.3) {
      srcs.forEach(s => s.style.strokeDashoffset = 0); texts.forEach(t => t.style.opacity = 1);
      animTip = tipMin; launched = true; marker.style.opacity = 1; brand.classList.add('amp-gone'); render();
    } else {
      gsap.timeline({ delay: 0.2 })
        .to(srcs, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.06 })
        .to(texts, { opacity: 1, duration: 0.3 }, '-=0.3')
        .to({ v: 0 }, { v: tipMin, duration: 1.2, ease: 'power2.inOut', onUpdate() { animTip = this.targets()[0].v; render(); } }, '-=0.2')
        .call(() => {
          const from = bamp.getBoundingClientRect(), pt = pathA.getPointAtLength(animTip);
          const ghost = marker.cloneNode(true); ghost.id = 'marker-ghost'; ghost.style.opacity = 1; document.body.appendChild(ghost); brand.classList.add('amp-gone');
          gsap.fromTo(ghost, { x: from.left + from.width / 2, y: from.top + from.height / 2, scale: 0.75 }, { x: pt.x, y: pt.y - scrollY, scale: 1, duration: 0.9, ease: 'power3.inOut', onComplete() { ghost.remove(); marker.style.opacity = 1; launched = true; render(); } });
        });
    }
    if (V.lenis) V.lenis.on('scroll', render); else addEventListener('scroll', render, { passive: true });
    addEventListener('resize', () => { ScrollTrigger.refresh(); });
    ScrollTrigger.addEventListener('refresh', () => { build(); render(); });
  }

  return V;
})();
