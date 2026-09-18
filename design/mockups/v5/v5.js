/* v5 — horizontal-only engine: Lenis horizontal on a native overflow-x wrapper, one straight line (S1) across the track,
   travelling & (S2) fixed at (50vw, 60vh), progress map in the header, Projects/Case Study as centred sheets. */
window.V5 = (function () {
  const V = {};
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desktop = () => matchMedia('(min-width:1024px)').matches;
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const LINE = () => { const p0 = document.getElementById('p00'); return p0.offsetTop + Math.round(p0.offsetHeight * 0.80); }; // 바닥선(L1): 패널 상단 + 80%
  let wrap, track, panels = [], hline, ink, guide, lineLen = 0, geo = {}, launched = false, animTip = 0, tipMin = 0;
  let snaps = [];
  /* 이동 중 축소 (V2 계승): 속도에 비례해 트랙을 최대 ZOOM.max 만큼 축소, 기준점은 매 프레임 화면 중심 */
  const ZOOM = { max: 0.12, vel: 28, ease: 0.18, on: !reduced && LS.get('v5-zoom') !== 'off' };   // 시안 조정: ?zoom=0.10&vel=30 (max = 최대 축소율, vel = 최대 축소에 이르는 속도 px/frame)
  { const q = new URLSearchParams(location.search); if (q.get('zoom')) ZOOM.max = +q.get('zoom'); if (q.get('vel')) ZOOM.vel = +q.get('vel'); if (q.get('zoom') === '0') ZOOM.on = false; }
  const st = { tipX: 0, s: 0, z: 1 };

  /* ---------- 자체 애니메이터 (B): 속도를 이어받는 임계감쇠 스무딩 — 이동 중 목표가 바뀌어도 끊기지 않고, 도착은 분명하게 ---------- */
  const anim = { pos: 0, target: 0, vel: 0, active: false, smooth: 0.26 };   // smooth: 도달 감각(초). 0.26 → 약 0.8초에 안착
  function smoothDamp(cur, to, vel, smoothTime, dt) {
    const w = 2 / Math.max(0.0001, smoothTime), x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const ch = cur - to, t = (vel + w * ch) * dt, nv = (vel - w * t) * e;
    return { pos: to + (ch + t) * e, vel: nv };
  }
  function setTarget(t) { anim.target = Math.max(0, Math.min(geo.W - innerWidth, t)); if (!anim.active) { anim.pos = sl(); anim.active = true; } }
  function animTick(dtMs) {
    if (!anim.active) return;
    const dt = Math.min(0.5, Math.max(0.001, dtMs / 1000));   // 백그라운드 탭(저 fps)에서도 실제 경과 시간만큼 진행
    const r = smoothDamp(anim.pos, anim.target, anim.vel, anim.smooth, dt);
    anim.pos = r.pos; anim.vel = r.vel;
    if (Math.abs(anim.target - anim.pos) < 0.4 && Math.abs(anim.vel) < 6) { anim.pos = anim.target; anim.vel = 0; anim.active = false; }
    wrap.scrollLeft = anim.pos;
    render();
  }
  V.step = dir => {                                                   // 다음/이전 점 — 현재 "목표" 기준이라 연속 입력이 정확히 한 점씩 쌓인다
    const at = anim.active ? anim.target : sl();
    const t = dir > 0 ? snaps.find(v => v > at + 2) : [...snaps].reverse().find(v => v < at - 2);
    if (t === undefined) return false; setTarget(t); return true;
  };

  function tick(time, dtMs) {
    if (!launched) return;
    animTick(dtMs);
    const v = anim.active ? Math.abs(anim.vel) * (dtMs / 1000) : 0;   // px/frame
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
  const sheetTitle = () => { const f = document.getElementById('sheet-frame'); let t = 'Projects'; try { const d = f.contentDocument; if (d && d.title) t = d.title.replace(/^Prologue\s*&\s*/, '').replace(/\s*[—-]\s*Prologue&.*$/, ''); } catch (e) {} document.getElementById('sheetTitle').textContent = t; const isCase = /case\.html/.test(f.getAttribute('src') || '') || (() => { try { return /case\.html/.test(f.contentWindow.location.pathname); } catch (e) { return false; } })(); document.getElementById('sheetBack').hidden = !isCase; };
  V.openSheet = src => { const f = document.getElementById('sheet-frame'); if (f.getAttribute('src') !== src) { f.src = src; } document.getElementById('sheet').classList.add('on'); document.getElementById('sheet-bd').classList.add('on'); sheetTitle(); };
  document.addEventListener('DOMContentLoaded', () => { const f = document.getElementById('sheet-frame'); if (f) f.addEventListener('load', sheetTitle); const b = document.getElementById('sheetBack'); if (b) b.addEventListener('click', () => { const w = f.contentWindow; try { if (w.history.length > 1) { w.history.back(); return; } } catch (e) {} f.src = '../v3/projects.html?embed=1&v=' + Date.now(); }); });
  V.closeSheet = () => { document.getElementById('sheet').classList.remove('on'); document.getElementById('sheet-bd').classList.remove('on'); };

  /* ---------- scrolling ---------- */
  const sl = () => wrap.scrollLeft;
  V.goTo = (x, immediate) => { if (immediate) { anim.active = false; anim.vel = 0; anim.pos = anim.target = x; wrap.scrollLeft = x; render(); } else setTarget(x); };

  V.init = function () {
    if (!desktop()) return;
    V3.lenis = null;                                                   // 데스크톱은 Lenis 없이 자체 애니메이터 (휠·키 = 점 단위)
    gsap.ticker.lagSmoothing(0);
    hline = document.getElementById('hline');
    { const k = LS.get('v5-size') || 'm', S = { s: ['min(960px,64vw)', 'min(580px,62vh)'], m: ['min(1100px,74vw)', 'min(680px,72vh)'], l: ['min(1240px,84vw)', 'min(760px,74vh)'], xl: ['min(1280px,84vw)', 'calc(100vh - 120px)'] }; document.documentElement.style.setProperty('--pw', S[k][0]); document.documentElement.style.setProperty('--ph', S[k][1]); }
    build();
    document.getElementById('pmap').addEventListener('click', e => { const i = e.target.closest('i'); if (!i) return; const p = panels[+i.dataset.i]; const ns = p.querySelector('.nodes span'); setTarget(ns ? +ns.dataset.x - innerWidth / 2 : (+i.dataset.i === 0 ? 0 : +i.dataset.i === panels.length - 1 ? geo.W - innerWidth : p._x + p._w / 2 - innerWidth / 2)); });
    document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const p = document.getElementById(a.dataset.go); setTarget(p.offsetLeft + p.offsetWidth / 2 - innerWidth / 2); }));
    addEventListener('keydown', e => {
      if (document.getElementById('sheet').classList.contains('on')) return;
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown', 'PageUp', ' '].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') V.step(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') V.step(-1);
      else if (e.key === 'Home') setTarget(0);
      else if (e.key === 'End') setTarget(snaps[snaps.length - 1]);
    });
    // wheel / trackpad (A): 이벤트 "스트림"(간격 50ms 이내의 연속 이벤트) 하나 = 노치 하나 = 점 하나.
    //   고해상도 휠·트랙패드는 노치 하나에 이벤트를 수십 개 보내므로, 스트림 시작에 한 번 진행하고 같은 스트림 안에서는 240px 누적마다 한 점만 더 진행.
    //   진행 요청은 버리지 않고 큐에 쌓아 순서대로(입력 유실 없음).
    const WHEEL = { gap: 100, first: 90, more: 480 };   // 감도: 스트림 묶음 간격(ms) / 첫 점까지 누적(px) / 같은 스트림에서 추가 점당 누적(px). 클수록 둔감
    let acc = 0, lastEv = 0, pending = 0, lockUntil = 0, stepped = false, streamStart = 0;
    const request = dir => { const now = performance.now(); if (now < lockUntil) { pending += dir; return; } V.step(dir); lockUntil = now + 160; };
    wrap.addEventListener('wheel', e => {
      e.preventDefault();
      if (document.getElementById('sheet').classList.contains('on')) return;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!d) return;
      const now = performance.now(), gap = now - lastEv; lastEv = now;
      if (gap > WHEEL.gap) { acc = 0; stepped = false; streamStart = now; }   // 새 스트림
      acc += d;
      if (!stepped) { if (Math.abs(acc) >= WHEEL.first) { request(acc > 0 ? 1 : -1); acc = 0; stepped = true; } return; }
      // 같은 스트림에서 추가 점: 마우스 노치는 짧게 끝나므로(300ms 미만) 한 점만. 300ms 넘게 이어지는 트랙패드 스와이프만 누적마다 한 점 더
      if (now - streamStart > 300 && Math.abs(acc) >= WHEEL.more) { request(acc > 0 ? 1 : -1); acc = 0; }
    }, { passive: false });
    gsap.ticker.add(() => { if (pending && performance.now() >= lockUntil) { const dir = Math.sign(pending); pending -= dir; V.step(dir); lockUntil = performance.now() + 160; } });
    // hash → start position (skip intro)
    const hash = location.hash.replace('#', ''); const target = hash && document.getElementById(hash);
    if (target) { wrap.scrollLeft = target.offsetLeft - 12; }
    intro(!!target || reduced || sl() > innerWidth * 0.3);
    wrap.addEventListener('scroll', () => { if (!anim.active) render(); }, { passive: true });
    gsap.ticker.add(tick);
    // panel size presets (mockup): s / m / l(V2 84vw×74vh)
    const SIZES = { s: ['min(960px,64vw)', 'min(580px,62vh)'], m: ['min(1100px,74vw)', 'min(680px,72vh)'], l: ['min(1240px,84vw)', 'min(760px,74vh)'], xl: ['min(1280px,84vw)', 'calc(100vh - 120px)'] };
    const applySize = k => { const [pw, ph] = SIZES[k] || SIZES.m; document.documentElement.style.setProperty('--pw', pw); document.documentElement.style.setProperty('--ph', ph); document.querySelectorAll('#sizeSeg button').forEach(b => b.classList.toggle('on', b.dataset.size === k)); LS.set('v5-size', k); };
    applySize(LS.get('v5-size') || 'm');
    document.getElementById('sizeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const cur = current(); applySize(b.dataset.size); build(); const p = panels[cur]; V.goTo(cur === 0 ? 0 : cur === panels.length - 1 ? geo.W - innerWidth : p._x + p._w / 2 - innerWidth / 2, true); });
    // zoom toggle (mockup)
    const tg = document.getElementById('zoomToggle'), info = document.getElementById('zoomInfo');
    if (tg) { tg.checked = ZOOM.on; const upd = () => info.textContent = ZOOM.on ? `최대 ${Math.round(ZOOM.max * 100)}% · 속도 ${ZOOM.vel} · ease ${ZOOM.ease}` : '끔'; upd(); tg.addEventListener('change', () => { ZOOM.on = tg.checked; LS.set('v5-zoom', ZOOM.on ? 'on' : 'off'); upd(); }); }
    addEventListener('resize', () => { build(); render(); });
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
      else snaps.push(i === 0 ? 0 : Math.round(p._x + p._w / 2 - vw / 2));   // 점 없는 패널은 패널 중앙이 & 아래에
    });
    snaps = [...new Set(snaps.map(v => Math.max(0, Math.min(limit, Math.round(v)))))].sort((a, b) => a - b);
    tipMin = 0;
  }
  const current = () => { const c = launched ? st.tipX : sl() + innerWidth * 0.5; let i = 0; panels.forEach((p, k) => { if (p._x <= c) i = k; }); return i; };   // 현재 패널 = &가 있는 패널 (넓은 창에서 끝 패널이 화면 중앙에 못 미쳐도 맞도록)

  function render() {
    const s = sl(), vw = innerWidth, maxS = geo.W - vw;
    let tipX;
    if (!launched) tipX = geo.nodeX + animTip;
    else {
      const sPrev = snaps.length > 1 ? snaps[snaps.length - 2] : maxS - vw;                // 끝: 마지막 직전 스냅부터 & 자리까지 달려감(그 전 스냅에서는 정확히 중앙)
      const k = Math.max(0, Math.min(1, (s - sPrev) / Math.max(1, maxS - sPrev)));
      const leadEnd = (snaps[1] || 600), lead = (vw * 0.5 - geo.nodeX) * Math.max(0, 1 - s / leadEnd);   // 시작: 첫 스냅 지점까지 선의 시작점 → 화면 중앙으로 옮겨감
      tipX = s + vw * 0.5 - lead + k * (geo.endX - (maxS + vw * 0.5));
      tipX = Math.max(geo.nodeX + tipMin, Math.min(geo.endX, tipX));
    }
    const len = tipX - geo.nodeX;
    ink.style.strokeDashoffset = lineLen - len; const dkInk = document.querySelector('#hline-dark .ink'); if (dkInk) dkInk.style.strokeDashoffset = lineLen - len;
    hline.querySelectorAll('.pd').forEach(g => PANELS.progress(g, Math.min(1, Math.max(0, (tipX - +g.dataset.x0) / (+g.dataset.x1 - +g.dataset.x0)))));
    hline.querySelectorAll('.n6').forEach(n => n.style.fill = tipX >= +n.dataset.x ? '#2B3160' : '#FAF9F6');
    document.querySelectorAll('.nodes span').forEach(n => n.classList.toggle('on', tipX >= +n.dataset.x));
    const marker = document.getElementById('marker'); st.tipX = tipX; st.s = s; if (!launched) marker.style.transform = `translate(${tipX - s}px, ${geo.y}px)`;
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
    if (skip || !window.gsap) { launched = true; marker.style.opacity = 1; render(); return; }
    srcs.forEach(sp => { const L = sp.getTotalLength(); sp.style.strokeDasharray = L; sp.style.strokeDashoffset = L; }); texts.forEach(t => t.style.opacity = 0);
    gsap.timeline({ delay: 0.2 })
      .to(srcs, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' })
      .to(texts, { opacity: 1, duration: 0.3 }, '-=0.3')
      .call(() => { animTip = 0; launched = true; render(); gsap.fromTo(marker, { opacity: 0 }, { opacity: 1, duration: 0.4 }); });   // &는 선의 시작점에서 그냥 나타남 (떨어지는 연출 없음)
  }
  V.zoom = ZOOM;
  return V;
})();
