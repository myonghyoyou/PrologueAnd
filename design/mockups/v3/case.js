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
  // 판 = 화면 한 장(.pan). 글(.txt) 위, 그림(.dw)은 남는 높이를 채움. 머무름 판은 .g-dwell로 감싼다
  const TXT = (n, h, body) => `<div class="txt"><span class="nlab">${n}</span><h2>${h}</h2>${body}</div>`;
  document.getElementById('main').innerHTML = `
    <section class="pan cover" id="s00">
      <div class="dw">${pic(D.hero, 'hero')}<span class="capn">${esc(D.hero.cap)}</span></div>
      <div class="g-title">
        <div><span class="cap">Prologue <span class="amp" style="font-size:14px">&amp;</span> ${esc(pj.title)} · ${esc(D.cap)}${sample ? ' · <span style="color:var(--warning)">본문은 Por favor, Harry 예시(시안)</span>' : ''}</span>
          <h1 class="h1x">${title}</h1>
          <div class="metarow">${D.meta.map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join('')}</div></div>
        <div class="knums" id="nums0">${nums}</div>
      </div>
    </section>
    <section class="pan" id="s01">${TXT('01 OVERVIEW', D.s01.h || '업무 요청을 받아 처리하는 담당자를 위한 도구', P(D.s01.p))}<div class="dw"><div class="dia" data-morph data-t="0"></div></div></section>
    <section class="pan" id="s02">${TXT('02 PROBLEM', D.s02.h || '네 갈래로 흩어져 들어온 요청', P(D.s02.p))}<div class="dw">${hasBefore ? pic(D.s07.before) + `<span class="capn">${esc(D.s07.before.cap)}</span>` : pic(D.hero)}</div></section>
    <div class="g-dwell" data-dwell><section class="pan" id="s03">${TXT('03 · 04 · 05 &nbsp;EXISTING WORKFLOW → INSIGHT → REDESIGN', esc(D.s04.q), `<p>${D.s03.p[0]} ${D.s05.flow.join(' → ')}.</p>`)}<div class="dw"><div class="dia" data-morph data-scrub></div></div></section></div>
    <section class="pan" id="s06">${TXT('06 SOLUTION', D.s06.h || '필수 항목을 채워야 보낼 수 있는 양식', P(D.s06.p) + (D.s06.spots ? `<ul class="spots" id="spots">${D.s06.spots.map((sp, i) => `<li data-i="${i}"><b>${i + 1}</b><span>${esc(sp.cap)}</span></li>`).join('')}</ul>` : ''))}<div class="dw" id="solbox">${pic(D.s06.screen, 'spotted')}<span class="capn">${esc(D.s06.screen.cap)}</span></div></section>
    ${hasBefore
      ? `<div class="g-dwell" data-dwell data-wipe><section class="pan" id="s07">${TXT('07 BEFORE &amp; AFTER', D.s07.h || '길 네 개가 하나로', P(D.s07.p))}<div class="dw"><div class="stack">${pic(D.s07.before)}${pic(D.s07.after, 'after')}<i class="edge"></i></div><div class="wcaps"><span class="wb">${esc(D.s07.before.cap)}</span><span class="wa" style="opacity:.35">${esc(D.s07.after.cap)}</span></div></div></section></div>`
      : `<section class="pan" id="s07">${TXT('07 BEFORE &amp; AFTER', D.s07.h || '길 네 개가 하나로', P(D.s07.p))}<div class="dw">${pic(D.s07.after)}<span class="capn">${esc(D.s07.after.cap)}</span></div></section>`}
    <section class="pan" id="s08"><div class="txt"><span class="nlab">08 IMPACT</span>
      <div class="impact2" id="nums8">${D.numbers.map(n => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span><small>${esc(n.small || '')}</small></div>`).join('')}</div>
      ${D.s08.bars && D.s08.bars.some(b => b.before > 0) ? `<div class="bars" id="bars">${D.s08.bars.filter(b => b.before > 0).map(b => `<div class="bar" style="--w:${Math.round(b.after / b.before * 100)}%"><div class="lbl"><span>${esc(b.label)}</span><span>${b.before}${esc(b.unit || '')} → ${b.after}${esc(b.unit || '')}</span></div><div class="tr"><i></i></div></div>`).join('')}</div>` : ''}</div></section>
    <section class="pan last" id="s09">
      <div class="two-col"><div class="txt"><span class="nlab">09 WHAT I LEARNED</span><h2>${D.s09.h || '도구보다 길부터'}</h2>${P(D.s09.p)}</div>
        <div class="txt" id="s10"><span class="nlab">10</span><h2>비슷한 문제가 있다면</h2>${P(D.s10.p)}<div class="cta"><a class="btn" href="#" data-open-drawer data-project="${pj.slug}">이 프로젝트를 보고 문의하기 <i class="tri"></i></a><a class="mail link" href="mailto:hello@prologue.and">hello@prologue.and</a></div></div></div>
      <div class="teaser"><div><span class="cap">다음 이야기</span><a class="big" href="case.html?p=${next.slug}" id="next-link">${esc(next.title)}</a><p style="margin:0;color:var(--bone-700)">${esc(next.tagline)}</p></div><a href="case.html?p=${next.slug}" class="shot img teaser-img"><img src="${V3.img(next)}" alt="${esc(next.title)}" loading="lazy" onerror="this.remove()"></a></div>
    </section>
    <footer class="ft"><nav><a href="projects.html">Projects</a><a href="mailto:hello@prologue.and">hello@prologue.and</a><a href="#" data-open-drawer>문의</a></nav><span>© 2026 Prologue&amp;</span></footer>`;

  /* ---------- 라이브 화면: 폭에 맞춰 축소(원본보다 키우지 않음), 화면에 가까워지면 로드 ---------- */
  function fit() { document.querySelectorAll('.shot.live').forEach(el => { const w = el.clientWidth - 12; if (w <= 0) return; const sc = Math.min(1, w / 1280); el.style.setProperty('--sc', sc.toFixed(4)); el.style.height = (800 * sc + 12) + 'px'; }); }
  function lazy() { document.querySelectorAll('.shot.live').forEach(el => { if (el.querySelector('iframe')) return; const r = el.getBoundingClientRect(); if (r.top < innerHeight * 2 && r.bottom > -innerHeight) el.insertAdjacentHTML('afterbegin', `<iframe src="${el.dataset.src}" tabindex="-1" aria-label="${esc(el.title)}" loading="lazy"></iframe>`); }); }
  // 모든 판: 글 아래 남는 높이를 그림이 다 쓰게 폭을 정한다 (다이어그램 640:220 + 여백·캡션, 화면 1280:800 + 캡션). 표지는 화면 높이의 52%
  function fitPans() {
    document.querySelectorAll('.pan').forEach(pan => {
      if (pan.classList.contains('last')) { const tz = pan.querySelector('.teaser'), img = pan.querySelector('.teaser-img'), tc = pan.querySelector('.two-col'); if (img) { const h = desktop() ? Math.max(160, pan.clientHeight - 56 - tc.offsetHeight - 64) : 0; img.style.height = h ? Math.min(h, 420) + 'px' : ''; img.style.width = h ? Math.min(tz.clientWidth / 2 - 24, Math.min(h, 420) * 1.6) + 'px' : ''; } return; }
      const box = pan.querySelector('.dw'); if (!box) return;
      const targets = box.querySelectorAll(':scope > .dia, :scope > .stack, :scope > .shot');
      if (!desktop()) { targets.forEach(e => e.style.removeProperty('--dw')); return; }
      let h;
      if (pan.classList.contains('cover')) { const tt = pan.querySelector('.g-title'); h = Math.min(pan.clientHeight * 0.56, pan.clientHeight - 88 - 32 - 28 - (tt ? tt.offsetHeight : 0)); }
      else { const txt = pan.querySelector('.txt'); h = pan.clientHeight - 56 - (txt ? txt.offsetHeight : 0); }
      targets.forEach(t => {
        let w;
        if (t.classList.contains('dia')) { const cap = t.querySelector('.dcap'); w = (h - 48 - (cap ? cap.offsetHeight + 12 : 0)) * 640 / 220; }
        else { const cap = box.querySelector(':scope > .capn, :scope > .wcaps'); w = (h - (cap ? cap.offsetHeight + 8 : 0) - 12) * 1280 / 800; }
        t.style.setProperty('--dw', Math.max(320, Math.min(box.clientWidth, w)) + 'px');
      });
    });
    fit();
  }
  fit(); lazy(); fitPans(); addEventListener('resize', () => { fitPans(); onScroll(); });
  setTimeout(fitPans, 300); addEventListener('load', fitPans);

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
  function pin(el) { const r = el.getBoundingClientRect(); const st = el.querySelector('.pan'); const range = Math.max(1, r.height - st.offsetHeight); const off = desktop() ? clamp(64 - r.top, 0, range) : 0; st.style.transform = off ? `translate3d(0,${off.toFixed(1)}px,0)` : ''; return off / range; }
  function tDwell(el) { let t = pin(el); if (reduced) t = t >= .5 ? 1 : 0; return t; }
  function tWipe() { return wipe ? tDwell(wipe) : 0; }
  function onScroll() {
    lazy();
    document.querySelectorAll('[data-scrub]').forEach(d => { const dw = d.closest('[data-dwell]'); d._morph(desktop() ? tDwell(dw) : 1); });
    if (wipe && desktop()) { const t = tWipe(); wipe.querySelector('.after').style.clipPath = `inset(0 ${(100 - t * 100).toFixed(2)}% 0 0)`; wipe.querySelector('.edge').style.left = `calc(${(t * 100).toFixed(2)}% - 1px)`; wipe.querySelector('.wb').style.opacity = t < .5 ? 1 : .35; wipe.querySelector('.wa').style.opacity = t < .5 ? .35 : 1; }
    const bars = document.getElementById('bars'); if (bars && bars.getBoundingClientRect().top < innerHeight * .85) bars.querySelectorAll('.bar').forEach(b => b.classList.add('on'));
  }
  /* ---------- 정거장: 휠 한 칸 = 한 판 (v5 엔진). 머무름 판은 03→04→05 / Before→After 가 각각 한 칸 (docs/28 B2 개정 2026-09-22) ---------- */
  const panels = () => [...document.querySelectorAll('.pan')];
  // 정거장 목록: 판마다 하나(top − 64). 머무름 판은 구간 안 t 0/.5/1 (03~05) 또는 0/1 (07)
  function stops() {
    const out = [];
    panels().forEach(p => {
      const dw = p.closest('[data-dwell]');
      if (!dw) { out.push({ y: p.getBoundingClientRect().top + scrollY - 64, el: p }); return; }
      const y0 = dw.getBoundingClientRect().top + scrollY, range = dw.offsetHeight - p.offsetHeight;
      const ks = dw.hasAttribute('data-wipe') ? [0, 1] : [0, .5, 1];
      ks.forEach(k => out.push({ y: y0 + range * k, el: p }));
    });
    return out;
  }
  const anim = { pos: scrollY, target: scrollY, vel: 0, active: false, smooth: 0.28 };
  function smoothDamp(cur, to, vel, smoothTime, dt) { const w = 2 / Math.max(0.0001, smoothTime), x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x); const ch = cur - to, tt = (vel + w * ch) * dt, nv = (vel - w * tt) * e; return { pos: to + (ch + tt) * e, vel: nv }; }
  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  function setTarget(y) { anim.target = clamp(y, 0, maxY()); if (!anim.active) { anim.pos = scrollY; anim.vel = 0; anim.active = true; } }
  let lastT = performance.now();
  function tick(now) {
    const dt = clamp((now - lastT) / 1000, 0.001, 0.05); lastT = now;
    if (anim.active) {
      const r = smoothDamp(anim.pos, anim.target, anim.vel, anim.smooth, dt); anim.pos = r.pos; anim.vel = r.vel;
      if (Math.abs(anim.target - anim.pos) < 0.5 && Math.abs(anim.vel) < 8) { anim.pos = anim.target; anim.vel = 0; anim.active = false; }
      scrollTo(0, anim.pos); onScroll();
    }
    requestAnimationFrame(tick);
  }
  const curStop = () => { const st = stops(); let k = 0; st.forEach((s, i) => { if (s.y <= (anim.active ? anim.target : scrollY) + 2) k = i; }); return { st, k }; };
  const goStop = dir => { const { st, k } = curStop(); setTarget(st[clamp(k + dir, 0, st.length - 1)].y); };
  const goTo = (el, immediate) => { const dw = el.closest && el.closest('[data-dwell]'); const y = (dw || el).getBoundingClientRect().top + scrollY - (dw ? 0 : 64); if (immediate || reduced) { anim.active = false; scrollTo(0, y); onScroll(); } else setTarget(y); };
  if (desktop() && !reduced) {
    // 휠: 스트림 하나(간격 100ms 안) = 한 칸. 90px부터 반응, 300ms 넘게 이어지면 480px마다 한 칸 더 (v5·v6과 같은 값)
    const WHEEL = { gap: 100, first: 90, more: 480 }; let acc = 0, lastEv = 0, stepped = false, streamStart = 0, lockUntil = 0, pending = 0;
    const request = dir => { const now = performance.now(); if (now < lockUntil) { pending += dir; return; } goStop(dir); lockUntil = now + 160; };
    addEventListener('wheel', e => {
      const dr = document.getElementById('drawer'); if (dr && dr.classList.contains('on')) return;
      e.preventDefault();
      const d = e.deltaY; if (!d) return;
      const now = performance.now(), gap = now - lastEv; lastEv = now;
      if (gap > WHEEL.gap) { acc = 0; stepped = false; streamStart = now; }
      acc += d;
      if (!stepped) { if (Math.abs(acc) >= WHEEL.first) { request(acc > 0 ? 1 : -1); acc = 0; stepped = true; } return; }
      if (now - streamStart > 300 && Math.abs(acc) >= WHEEL.more) { request(acc > 0 ? 1 : -1); acc = 0; }
    }, { passive: false });
    setInterval(() => { if (pending && performance.now() >= lockUntil) { const dir = Math.sign(pending); pending -= dir; goStop(dir); lockUntil = performance.now() + 160; } }, 40);
    requestAnimationFrame(tick);
  }
  addEventListener('scroll', () => { if (!anim.active) onScroll(); }, { passive: true });
  onScroll();

  /* ---------- 키·해시·뒤로가기 ---------- */
  addEventListener('keydown', e => {
    if (!desktop() || e.altKey || e.ctrlKey || e.metaKey) return;
    const dr = document.getElementById('drawer'); if (dr && dr.classList.contains('on')) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goStop(1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goStop(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setTarget(0); } else if (e.key === 'End') { e.preventDefault(); setTarget(maxY()); }
  });
  const hash = location.hash.replace('#', ''); const target = hash && document.getElementById(hash);
  if (target) setTimeout(() => goTo(target.closest('.pan') || target, true), 50);
  document.getElementById('hd-back').addEventListener('click', e => { if (document.referrer && /projects\.html/.test(document.referrer) && history.length > 1) { e.preventDefault(); history.back(); } });

  /* ---------- 전환 종류: 상세 → 상세는 제목 morph 없이 (docs/28 B5) ---------- */
  addEventListener('pageswap', e => { if (!e.viewTransition) return; const to = (e.activation && e.activation.entry && e.activation.entry.url) || ''; if (/case\.html/.test(to)) e.viewTransition.types.add('to-case'); });
  addEventListener('pagereveal', e => { if (!e.viewTransition) return; const from = (e.activation && e.activation.from && e.activation.from.url) || ''; if (/case\.html/.test(from)) e.viewTransition.types.add('to-case'); });

  V3.drawer.init();

  /* ---------- 검증 (docs/28) ---------- */
  window.__spec = function () {
    const cs = el => getComputedStyle(el);
    const L = el => Math.round(el.getBoundingClientRect().left);
    const cover = document.querySelector('#s00 .shot'), panelsEl = document.querySelectorAll('.pan'), fulls = document.querySelectorAll('.pan .dw');
    return {
      G1: { lefts: [L(cover), ...[...panelsEl].map(L), ...[...fulls].map(L)], scMax: Math.max(...[...document.querySelectorAll('.shot.live')].map(s => +s.style.getPropertyValue('--sc'))) },
      G2: { order: ['#s00', '.g-title .h1x', '.g-title .knums'].map(q => !!document.querySelector(q)) },
      G3: { panels: panelsEl.length, heights: [...panelsEl].map(p => p.offsetHeight), vh: innerHeight, fill: [...panelsEl].map(p => { const ks = [...p.querySelectorAll('.txt, .dw > .dia, .dw > .stack, .dw > .shot, .g-title')].map(k => k.getBoundingClientRect()); return Math.round((Math.max(...ks.map(r => r.bottom)) - Math.min(...ks.map(r => r.top))) / p.offsetHeight * 100); }), overflow: [...panelsEl].filter(p => p.scrollHeight > p.clientHeight + 1).map(p => p.id) },
      G4: { fullW: [...fulls].map(f => Math.round(f.getBoundingClientRect().width)), gridW: Math.round(document.getElementById('main').clientWidth - 152) },
      G6: { hasWipe: !!wipe, t: wipe ? +tWipe().toFixed(2) : null, pinned: wipe ? Math.round(wipe.querySelector('.pan').getBoundingClientRect().top) : null, dwells: document.querySelectorAll('[data-dwell]').length },

      G7: { bars: document.querySelectorAll('.bar').length, on: document.querySelectorAll('.bar.on').length },
      G8: { next: document.getElementById('next-link').textContent, ft: !!document.querySelector('.ft'), cta: !!document.querySelector('#s10 .btn[data-project]') },
      G10: { title: document.getElementById('hd-title').textContent, notSelf: document.getElementById('next-link').getAttribute('href').indexOf(pj.slug) < 0 },
      B1: { html: cs(document.documentElement).overflowX, body: cs(document.body).overflow, stops: stops().length },
      B6: { drawer: !!document.getElementById('drawer'), hdrProject: document.getElementById('hd-ask').dataset.project },
      H: { hdrH: document.querySelector('.hdr').offsetHeight, vt: cs(document.querySelector('.hdr')).viewTransitionName, strip: !!document.querySelector('.pmap'), pos: !!document.querySelector('.hdr .pos') },
      noHScroll: document.documentElement.scrollWidth <= innerWidth
    };
  };
  window.__case = { goTo, goStop, stops, panels, tWipe, anim };
})();
