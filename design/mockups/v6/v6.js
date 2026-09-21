/* v6 — path engine: one curve in a fixed world; the camera (viewport centre) slides along it.
   t = distance along the path. Scenes sit at T[i]. & is fixed at the screen centre. (docs/22) */
window.V6 = (function () {
  const V = {};
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desktop = () => matchMedia('(min-width:1024px)').matches;
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- world & path (spec/07-path.html과 동일 좌표) ---------- */
  const W = 2800, H = 5100;
  const scenes = [
    { id: 'p00', n: 'Prologue', x: 1500, y: 520, knot: true },
    { id: 'p01', n: '처음', x: 2200, y: 1100, off: [376, -20] },              // 화면 오른쪽 가운데
    { id: 'p02', n: '&', x: 1300, y: 1600, off: [-376, -40] },               // 왼쪽, 자동(-95)보다 살짝 아래
    { id: 'p03', n: '끝까지', x: 2000, y: 2050 },
    { id: 'p04', n: '회사든, 개인이든', x: 1150, y: 2550, off: [-376, -68] },  // 왼쪽, 자동(-123)보다 살짝 아래
    { id: 'p05', n: '무엇을', x: 1700, y: 3000, group: [[1700, 3000], [1700, 3200], [1700, 3400]], off: [376, 220] },   // 점 3개는 세로로, 판은 오른쪽·가운데 점(옮기기) 옆 (3200 + 20)
    { id: 'p06', n: 'Projects', x: 1300, y: 3750, off: [-376, 0] },           // 왼쪽, 점과 같은 높이
    { id: 'p07', n: '문의', x: 2100, y: 4250 },
    { id: 'p08', n: '&', x: 1500, y: 4676, end: true }   // 선은 Prologue 글자 위(24px)에서 끝난다
  ];
  const knotBox = { x: 1150, y: 310, w: 700, h: 420 }, knotEnd = [1780, 700];
  const nodes = [knotEnd, [2200, 1100], [1300, 1600], [2000, 2050], [1150, 2550], [1700, 3000], [1700, 3200], [1700, 3400], [1300, 3750], [2100, 4250], [1500, 4676]];
  const PW = 640, PH = 420, GAP = 56, END_GAP = 0;   // END_GAP: 선 끝을 더 당길 때 쓰는 여유(끝점 자체가 Prologue 위이므로 0)   // 판은 화면 px 고정(글자는 세계 스케일에서 제외, docs/22 §12-1). 세계 안에서는 PW/scale × PH/scale
  const EDGE = 24, HDR = 84, LIFT = 20, PAD = 40, NGAP = 28, NDY = [24, 0, -24];   // 화면 px: 가장자리 여백, 헤더 높이, 선이 & 아래로 내려간 거리, 무엇을 칩과 점 사이, 칩의 세로 오프셋(고치기 아래·옮기기 중앙·만들기 위)
  const CAM0 = [1240, 600];   // 인트로 카메라: 꼬임과 헤드라인이 같이 보이는 자리. 첫 이동에서 &가 화면 중앙으로 온다
  const CAM_END = [1500, 4772];   // 끝 카메라: Prologue·&·캡션 묶음의 가운데. 마지막 구간에서 선 끝점 → 이 자리로 옮겨가 판이 화면 정중앙에 선다
  function crPath(p, k = 0.5) {
    let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p[i + 1];
      const c1 = [p1[0] + (p2[0] - p0[0]) * k / 3, p1[1] + (p2[1] - p0[1]) * k / 3], c2 = [p2[0] - (p3[0] - p1[0]) * k / 3, p2[1] - (p3[1] - p1[1]) * k / 3];
      d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  }
  const kb = knotBox, kx = f => kb.x + kb.w * f, ky = f => kb.y + kb.h * f;
  const knotD = `M${kx(-0.15)} ${ky(-0.1)} C ${kx(0.2)} ${ky(-0.05)}, ${kx(0.45)} ${ky(0.35)}, ${kx(0.7)} ${ky(0.15)} S ${kx(0.95)} ${ky(0.45)}, ${kx(0.6)} ${ky(0.6)} S ${kx(0.05)} ${ky(0.5)}, ${kx(0.3)} ${ky(0.25)} S ${kx(0.85)} ${ky(0.05)}, ${kx(0.8)} ${ky(0.5)} S ${kx(0.4)} ${ky(1.05)}, ${kx(0.15)} ${ky(0.75)} S ${kx(0.5)} ${ky(0.1)}, ${kx(0.55)} ${ky(0.45)} S ${kx(0.2)} ${ky(0.95)}, ${kx(0.7)} ${ky(0.85)} C ${kx(0.85)} ${ky(0.82)}, ${kx(0.86)} ${ky(0.9)}, ${knotEnd[0]} ${knotEnd[1]}`;
  const mainD = crPath(nodes);

  let world, svg, ink, main, L = 0, S = [], T = [], dots = [], launched = false, scale = 1;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pAt = t => { t = clamp(t, 0, L); const i = Math.min(S.length - 1, Math.max(0, Math.round(t / 4))); return S[i]; };   // 4px 샘플 표 (docs/22 §12-3)
  const tangentAt = t => { const a = pAt(t - 8), b = pAt(t + 8); const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1; return [dx / n, dy / n]; };
  const turnAt = t => { const a = tangentAt(t - 120), b = tangentAt(t + 120); return a[0] * b[1] - a[1] * b[0]; };

  /* ---------- 판 자리: 점에서 곡선 바깥쪽으로 GAP + 판 반폭. 판은 화면 px라 세계 안 크기가 scale에 따라 달라지므로 창·스케일이 바뀔 때마다 다시 잡는다 ---------- */
  function place() {
    const s = scale, pw = PW / s, ph = PH / s;
    const halfW = innerWidth / 2 / s, up = (innerHeight / 2 + LIFT) / s, down = (innerHeight / 2 - LIFT) / s, m = EDGE / s, hdr = HDR / s;   // 점이 화면 (중앙, 중앙+LIFT)에 올 때 창이 덮는 세계 범위
    const within = (v, a, b) => a > b ? (a + b) / 2 : clamp(v, a, b);   // 창이 좁아 다 못 들어오면 가운데로
    scenes[5].group.forEach((pt, i) => { const n = document.getElementById('n' + i); n.style.left = (pt[0] - NGAP / s) + 'px'; n.style.top = (pt[1] + NDY[i] / s) + 'px'; });   // 무엇을 칩: 점 왼쪽, 세로는 NDY
    scenes.forEach(sc => {
      if (!sc.el || !sc.el.classList.contains('pan')) return;
      const t = T[sc.firstIdx], tg = tangentAt(t), turn = turnAt(t);
      let cxp, cyp;
      if (sc.off) { cxp = sc.x + sc.off[0] / s; cyp = sc.y + sc.off[1] / s; }   // 직접 지정: 점이 화면 중앙에 있을 때 판 중심의 화면 px 오프셋
      else { let nx = -tg[1], ny = tg[0]; if (turn > 0) { nx = -nx; ny = -ny; } const ext = Math.abs(nx) * pw / 2 + Math.abs(ny) * ph / 2; cxp = sc.x + nx * (GAP + ext); cyp = sc.y + ny * (GAP + ext); }   // 자동: 곡선 바깥쪽
      // 창 안으로: 자동 배치는 640×420 상자 전체가 장면의 모든 점에서, 직접 지정(off)은 안쪽 내용 영역(패딩 제외)이 첫 점(도착 자리)에서 가장자리·헤더를 넘지 않게
      const pts = sc.off ? [[sc.x, sc.y]] : (sc.group || [[sc.x, sc.y]]), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const hw = (sc.off ? pw - 2 * PAD / s : pw) / 2, hh = (sc.off ? ph - 2 * PAD / s : ph) / 2;
      const lx = Math.max(...xs) - halfW + m + hw, hx = Math.min(...xs) + halfW - m - hw, ly = Math.max(...ys) - up + hdr + hh, hy = Math.min(...ys) + down - m - hh;
      cxp = within(cxp, lx, hx); cyp = within(cyp, ly, hy);
      // 선이 판을 지나면 접선 방향으로 밀어 피한다 — 창 안에 남는 자리만. 그런 자리가 없으면(작은 창) 창 안을 우선하고 선은 판 뒤로 지나간다
      const hits = (x, y) => S.some(q => q[0] >= x - 12 && q[0] <= x + pw + 12 && q[1] >= y - 12 && q[1] <= y + ph + 12);
      const inWin = (x, y) => x >= lx - 0.5 && x <= hx + 0.5 && y >= ly - 0.5 && y <= hy + 0.5;
      if (hits(cxp - pw / 2, cyp - ph / 2)) { for (let d = 20; d <= 400; d += 20) { let ok = false; for (const sg of [1, -1]) { const x = cxp + tg[0] * d * sg, y = cyp + tg[1] * d * sg; if (inWin(x, y) && !hits(x - pw / 2, y - ph / 2)) { cxp = x; cyp = y; ok = true; break; } } if (ok) break; } }
      sc.rect = { x: cxp - pw / 2, y: cyp - ph / 2, w: pw, h: ph };
      sc.el.style.left = sc.rect.x + 'px'; sc.el.style.top = sc.rect.y + 'px';
    });
  }
  function fit() { scale = clamp(Math.min(innerWidth / 1440, innerHeight / 900), 0.85, 1.2); world.style.setProperty('--inv', 1 / scale); place(); }   // --inv: 장면(글자)을 세계 스케일에서 되돌리는 값

  /* ---------- 이동: v5의 smoothDamp 엔진, 변수만 t ---------- */
  const anim = { pos: 0, target: 0, vel: 0, active: false, smooth: 0.32 };   // 도달 감각(초). 0.28 → 0.32 (2026-09-20 "살짝 느리게")
  const ZOOM = { max: 0.12, vel: 26, ease: 0.18, on: !reduced && LS.get('v6-zoom') === 'on' };
  const st = { z: 1 };
  function smoothDamp(cur, to, vel, smoothTime, dt) { const w = 2 / Math.max(0.0001, smoothTime), x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x); const ch = cur - to, tt = (vel + w * ch) * dt, nv = (vel - w * tt) * e; return { pos: to + (ch + tt) * e, vel: nv }; }
  function setTarget(t) { anim.target = clamp(t, 0, L); if (!anim.active) { anim.active = true; } }
  V.step = dir => { const at = anim.active ? anim.target : anim.pos; const t = dir > 0 ? T.find(v => v > at + 2) : [...T].reverse().find(v => v < at - 2); if (t === undefined) return false; setTarget(t); return true; };
  V.goTo = (t, immediate) => { if (immediate) { anim.active = false; anim.vel = 0; anim.pos = anim.target = clamp(t, 0, L); render(); } else setTarget(t); };

  function tick(time, dtMs) {
    if (!launched) return;
    const dt = clamp(dtMs / 1000, 0.001, 0.5);
    if (anim.active) {
      const r = smoothDamp(anim.pos, anim.target, anim.vel, anim.smooth, dt); anim.pos = r.pos; anim.vel = r.vel;
      if (Math.abs(anim.target - anim.pos) < 0.4 && Math.abs(anim.vel) < 6) { anim.pos = anim.target; anim.vel = 0; anim.active = false; }
    }
    const v = anim.active ? Math.abs(anim.vel) * dt : 0;
    const zt = ZOOM.on ? 1 - Math.min(1, v / ZOOM.vel) * ZOOM.max : 1;
    const zPrev = st.z; st.z += (zt - st.z) * ZOOM.ease; if (Math.abs(st.z - zt) < 0.0005) st.z = zt;
    // 멈춰 있을 때는 그리지 않는다 — 매 프레임 style을 다시 쓰면 시트(iframe) 위에서 커서가 화살표↔I빔으로 떨린다
    if (anim.active || st.z !== zPrev || dirty) { dirty = false; render(); }
  }
  let dirty = true;   // 입력·창 크기 변경 등으로 한 번 더 그려야 할 때

  // 무엇을: 세 점을 지나는 동안 카메라는 가운데 점(옮기기)에 고정, 선·점·칩만 진행.
  // 앞 구간(회사든 → 고치기)과 뒤 구간(만들기 → Projects)은 카메라를 일정 배속(약 1.3×)으로 선형 재매개 — t의 감속 곡선을 그대로 따르므로 도착 직전에 튀지 않는다
  function camT(t) {
    const f5 = scenes[5].firstIdx, a = T[f5], b = T[f5 + 1], c = T[f5 + 2], pre = T[f5 - 1], post = T[f5 + 3];
    if (t <= pre || t >= post) return t;
    if (t >= a && t <= c) return b;
    return t < a ? pre + (t - pre) * (b - pre) / (a - pre) : b + (t - c) * (post - b) / (post - c);
  }
  function render() {
    const p = pAt(camT(anim.pos)), s = scale * st.z, cx = innerWidth / 2;
    // 인트로 오프셋: t=0에서는 카메라가 CAM0에 서고(&는 꼬임 끝에), 첫 점까지 오프셋이 선형으로 0이 된다 (smoothstep이면 감속 중 카메라가 한 번 더 움직여 '휙'하고 튐)
    const e = clamp(anim.pos / T[1], 0, 1);
    // 끝 오프셋: 마지막 구간(문의 점 → 끝)에서 카메라가 선 끝점 대신 CAM_END로, LIFT도 0으로 — 도착하면 Prologue 묶음이 화면 정중앙
    const tEnd = T[T.length - 1], tPrev = T[T.length - 2], e2 = clamp((anim.pos - tPrev) / (tEnd - tPrev), 0, 1), pEnd = pAt(tEnd);
    const cy = innerHeight / 2 + LIFT * (1 - e2);
    const c = [p[0] + (CAM0[0] - knotEnd[0]) * (1 - e) + (CAM_END[0] - pEnd[0]) * e2, p[1] + (CAM0[1] - knotEnd[1]) * (1 - e) + (CAM_END[1] - pEnd[1]) * e2];
    world.style.transform = `translate(${cx}px, ${cy}px) scale(${s}) translate(${-c[0]}px, ${-c[1]}px)`;
    const marker = document.getElementById('marker');
    marker.style.transform = `translate(${cx + (p[0] - c[0]) * s - 22}px, ${cy + (p[1] - c[1]) * s - 42}px)`;
    ink.style.strokeDashoffset = L - Math.min(anim.pos, L - END_GAP);   // 잉크는 & 34px 앞에서 끝
    // 끝 장면: 선이 끝에 닿아 멈추면 Prologue 아래에 &가 떠오른다
    scenes[8].el.classList.toggle('arrive', anim.pos >= L - 2);
    dots.forEach(d => d.el.classList.toggle('on', anim.pos >= d.t - 2));
    // 판은 지금 장면(가장 가까운 장면)의 것만 보임 — 두 장면의 중간에서 지금 판 페이드 아웃, 다음 판 페이드 인. 되돌아오면 반대 (2026-09-20)
    const near = nearestScene();
    scenes.forEach((sc, i) => { if (sc.el && sc.el.classList.contains('pan')) sc.el.classList.toggle('show', i === near); });
    const f5 = scenes[5].firstIdx;   // 무엇을 칩: 같은 규칙, 점을 지나면 켜짐
    document.querySelectorAll('.scene.node').forEach((n, i) => { n.classList.toggle('vis', near === 5); n.classList.toggle('on', anim.pos >= T[f5 + i] - 2); });
    const cur = curScene(); document.querySelectorAll('#pmap i').forEach((b, i) => { b.classList.toggle('on', i === cur); b.classList.toggle('done', i < cur); });
    const id = scenes[cur].id; if (location.hash !== '#' + id) history.replaceState(null, '', cur ? '#' + id : location.pathname + location.search);
  }
  const curScene = () => { let i = 0; scenes.forEach((sc, k) => { if (anim.pos >= T[sc.firstIdx] - 40) i = k; }); return i; };
  // 장면까지의 경로 거리(점이 여럿이면 첫 점~끝 점 구간 안은 0), 가장 가까운 장면
  const sceneDist = sc => { const a = T[sc.firstIdx], b = T[sc.firstIdx + (sc.group ? sc.group.length - 1 : 0)]; return anim.pos < a ? a - anim.pos : anim.pos > b ? anim.pos - b : 0; };
  const nearestScene = () => { let bi = 0, bd = Infinity; scenes.forEach((sc, i) => { const d = sceneDist(sc); if (d < bd) { bd = d; bi = i; } }); return bi; };

  /* ---------- build ---------- */
  V.build = function () {
    world = document.getElementById('world'); svg = document.getElementById('pathsvg');
    document.getElementById('restN').textContent = V3.projects.length;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<path class="knot" id="knot" d="${knotD}"/><path class="guide" d="${mainD}"/><path class="ink" id="ink" d="${mainD}"/>`;
    ink = document.getElementById('ink'); main = svg.querySelector('.guide'); L = main.getTotalLength();
    for (let t = 0; t <= L + 4; t += 4) { const q = main.getPointAtLength(Math.min(t, L)); S.push([q.x, q.y]); }
    const tOf = (x, y) => { let bi = 0, bd = 1e12; S.forEach((q, i) => { const d = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi * 4; };
    // T (snap points)
    scenes.forEach(sc => {
      sc.el = document.getElementById(sc.id);
      const pts = sc.group || [[sc.x, sc.y]];
      sc.firstIdx = T.length;
      pts.forEach(([x, y]) => { const t = sc.knot ? 0 : tOf(x, y); T.push(t); if (!sc.knot && !sc.end) dots.push({ x, y, t }); });   // 끝 점은 점 없이 &가 자리를 맡음
    });
    fit();
    dots.forEach(d => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('class', 'dot'); c.setAttribute('cx', d.x); c.setAttribute('cy', d.y); c.setAttribute('r', 6); svg.appendChild(c); d.el = c; });
    ink.style.strokeDasharray = L; ink.style.strokeDashoffset = L;
    main.style.strokeDasharray = `${L - END_GAP} ${END_GAP + 10}`;   // 안내선도 & 앞에서 멈춤
    // progress map: 장면당 한 칸, 같은 폭
    document.getElementById('pmap').innerHTML = scenes.map((sc, i) => `<i data-i="${i}" data-l="${sc.n}"></i>`).join('');
    // sheets
    document.addEventListener('click', e => { const t = e.target.closest('[data-sheet]'); if (!t) return; e.preventDefault(); V.openSheet(t.dataset.sheet); });
    document.getElementById('sheet').querySelector('.close').addEventListener('click', () => V.closeSheet());
    document.getElementById('sheet-bd').addEventListener('click', () => V.closeSheet());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') V.closeSheet(); });
    const f = document.getElementById('sheet-frame'); f.addEventListener('load', sheetTitle);
    document.getElementById('sheetBack').addEventListener('click', () => { const w = f.contentWindow; try { if (w.history.length > 1) { w.history.back(); return; } } catch (e) {} f.src = '../v3/projects.html?embed=1&v=' + Date.now(); });
    if (!desktop()) { V3.initMobilePos(scenes.map(s => s.id)); scenes.forEach(sc => sc.el && sc.el.classList.add('show')); }
  };
  const sheetTitle = () => { const f = document.getElementById('sheet-frame'); let t = 'Projects', isCase = false; try { const d = f.contentDocument; if (d && d.title) t = d.title.replace(/^Prologue\s*&\s*/, '').replace(/\s*[—-]\s*Prologue&.*$/, ''); isCase = /case\.html/.test(f.contentWindow.location.pathname); } catch (e) {} document.getElementById('sheetTitle').textContent = t; document.getElementById('sheetBack').hidden = !isCase; };
  V.openSheet = src => { const f = document.getElementById('sheet-frame'); if (f.getAttribute('src') !== src) f.src = src; document.getElementById('sheet').classList.add('on'); document.getElementById('sheet-bd').classList.add('on'); sheetTitle(); };
  V.closeSheet = () => { document.getElementById('sheet').classList.remove('on'); document.getElementById('sheet-bd').classList.remove('on'); };

  /* ---------- init ---------- */
  V.init = function () {
    if (!desktop()) return;
    V3.lenis = null;
    gsap.ticker.lagSmoothing(0);
    addEventListener('resize', () => { fit(); dirty = true; render(); });
    // input
    document.getElementById('pmap').addEventListener('click', e => { const i = e.target.closest('i'); if (i) setTarget(T[scenes[+i.dataset.i].firstIdx]); });
    document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); setTarget(T[scenes[+a.dataset.go].firstIdx]); }));
    addEventListener('keydown', e => {
      if (document.getElementById('sheet').classList.contains('on')) return;
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', ' '].includes(e.key)) return;
      e.preventDefault();
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) V.step(1);
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) V.step(-1);
      else if (e.key === 'Home') setTarget(0); else if (e.key === 'End') setTarget(L);
    });
    const WHEEL = { gap: 100, first: 90, more: 480 };
    let acc = 0, lastEv = 0, pending = 0, lockUntil = 0, stepped = false, streamStart = 0;
    const request = dir => { const now = performance.now(); if (now < lockUntil) { pending += dir; return; } V.step(dir); lockUntil = now + 160; };
    document.getElementById('stage').addEventListener('wheel', e => {
      e.preventDefault();
      if (document.getElementById('sheet').classList.contains('on')) return;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX; if (!d) return;
      const now = performance.now(), gap = now - lastEv; lastEv = now;
      if (gap > WHEEL.gap) { acc = 0; stepped = false; streamStart = now; }
      acc += d;
      if (!stepped) { if (Math.abs(acc) >= WHEEL.first) { request(acc > 0 ? 1 : -1); acc = 0; stepped = true; } return; }
      if (now - streamStart > 300 && Math.abs(acc) >= WHEEL.more) { request(acc > 0 ? 1 : -1); acc = 0; }
    }, { passive: false });
    gsap.ticker.add(() => { if (pending && performance.now() >= lockUntil) { const dir = Math.sign(pending); pending -= dir; V.step(dir); lockUntil = performance.now() + 160; } });
    // zoom toggle
    const tg = document.getElementById('zoomToggle'), info = document.getElementById('zoomInfo');
    tg.checked = ZOOM.on; const upd = () => info.textContent = ZOOM.on ? `최대 ${Math.round(ZOOM.max * 100)}%` : '끔'; upd(); tg.addEventListener('change', () => { ZOOM.on = tg.checked; LS.set('v6-zoom', ZOOM.on ? 'on' : 'off'); upd(); });
    // hash → 가장 가까운 점, 인트로 생략
    const hash = location.hash.replace('#', ''); const hi = scenes.findIndex(s => s.id === hash);
    if (hi > 0) { anim.pos = anim.target = T[scenes[hi].firstIdx]; }
    gsap.ticker.add(tick);
    intro(hi > 0 || reduced);
  };

  function intro(skip) {
    const knot = document.getElementById('knot'), marker = document.getElementById('marker');
    const KL = knot.getTotalLength();
    if (skip || !window.gsap) { launched = true; marker.style.opacity = 1; render(); return; }
    knot.style.strokeDasharray = KL; knot.style.strokeDashoffset = KL;
    // 카메라는 꼬임 끝(선의 시작)에 서 있음. 꼬임이 그려진 뒤 &가 나타남
    launched = true; render();
    gsap.timeline({ delay: 0.2 })
      .to(knot, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' })
      .to(marker, { opacity: 1, duration: 0.4 });
  }
  V._dbg = () => ({ pos: anim.pos, target: anim.target, active: anim.active, T: T.slice(), L, rects: scenes.filter(s => s.rect).map(s => [s.id, s.rect, S.filter(q => q[0] >= s.rect.x - 8 && q[0] <= s.rect.x + s.rect.w + 8 && q[1] >= s.rect.y - 8 && q[1] <= s.rect.y + s.rect.h + 8).length]) });
  return V;
})();
