/* Prologue& v3 — shared runtime.
   Data stands in for the Notion DB (docs/10 §2.3). Drawer, Lenis, page line (S1/S2), case-study helpers. */
window.V3 = (function () {
  const V = {};
  if (location.search.includes('embed=1')) document.documentElement.classList.add('embed');   // 시트(모달) 안: 페이지 헤더 숨김, 상단 여백 축소
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desktop = () => matchMedia('(min-width:1024px)').matches;

  /* ---------- data ---------- */
  V.problems = [
    { key: 'scattered', name: '흩어진 요청', desc: '엑셀, 메신저, 이메일, 구두 요청으로 업무가 흩어져 있어요.' },
    { key: 'legacy', name: '불편한 기존 시스템', desc: '기능은 있는데 직원들이 쓰기 어렵고 화면이 복잡해요.' },
    { key: 'paper', name: '종이·수작업', desc: '디지털화하고 싶지만 그대로 옮기면 안 될 것 같아요.' },
    { key: 'idea', name: '제품이 필요한 아이디어', desc: '아이디어는 있는데 구조와 화면이 없어요.' }
  ];
  V.projects = [
    { slug: 'por-favor-harry', title: 'Por favor, Harry', tagline: '흩어진 업무 요청을 하나의 Workflow로', problem: 'scattered', tags: ['Workflow Design', 'Internal Tool'], year: '2025', disclosure: 'full', order: 1, featured: true,
      result: ['요청 경로 4개 → 1개', '진행 상황 문의를 요청자가 직접 확인'] },
    { slug: 'daeryun-learning-hub', title: 'Daeryun Learning Hub', tagline: '1,220개의 종이 문제를 새로운 학습 경험으로', problem: 'paper', tags: ['Digital Transformation', 'Web Application'], year: '2025', disclosure: 'anonymized', order: 2, featured: true,
      result: ['채점·해설이 즉시', '문제집 1권 → 반복 학습 흐름'] },
    { slug: 'hospital-ux', title: '병원 UI/UX 고도화', tagline: '복잡한 업무 화면을 더 빠르게 읽고 처리하도록', problem: 'legacy', tags: ['Enterprise UX', 'UI Redesign'], year: '2024–2025', disclosure: 'mockup', order: 3, featured: true,
      result: ['읽는 순서대로 재배치', '입력 동선 절반'] },
    { slug: 'custom-commerce', title: 'Custom Commerce', tagline: '기성 쇼핑몰 프레임워크 없이 처음부터 구축한 Commerce Product', problem: 'idea', tags: ['Product Engineering', 'Commerce'], year: '2025', disclosure: 'full', order: 4, featured: true,
      result: ['탐색 → 구매 → 주문 → 운영 한 흐름', '관리자 화면까지 처음부터'] },
    { slug: 'quote-sheet', title: '견적서 자동화', tagline: '엑셀 견적서 12종을 입력 한 번으로', problem: 'paper', tags: ['Automation', 'Internal Tool'], year: '2024', disclosure: 'anonymized', order: 5, featured: false,
      result: ['입력 12번 → 1번'] },
    { slug: 'shift-board', title: '교대 근무표', tagline: '카톡으로 돌던 근무표를 한 화면으로', problem: 'scattered', tags: ['Workflow Design', 'Mobile'], year: '2024', disclosure: 'mockup', order: 6, featured: false,
      result: ['근무표는 문서가 아니라 알림'] }
  ];
  V.featured = () => V.projects.filter(p => p.featured).sort((a, b) => a.order - b.order);
  V.projectFor = key => V.projects.find(p => p.problem === key && p.featured);
  V.project = slug => V.projects.find(p => p.slug === slug);
  V.problem = key => V.problems.find(p => p.key === key);
  V.img = p => `../v2/img/${p.slug}.png`;
  V.shot = (p, extra) => `<div class="shot${p.disclosure === 'mockup' ? ' mock' : ''}${extra ? ' ' + extra : ''}"><img src="${V.img(p)}" alt="${p.title} — ${p.tagline}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{textContent:'${p.title}',style:'display:flex;align-items:center;justify-content:center;height:100%;font-size:13px;color:#8A857A'}))"></div>`;

  /* ---------- Lenis ---------- */
  V.lenis = null;
  V.initLenis = function () {
    if (reduced || !window.Lenis) return null;
    const l = new Lenis({ lerp: 0.1, smoothWheel: true });
    document.documentElement.classList.add('lenis');
    function raf(t) { l.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    V.lenis = l;
    return l;
  };
  V.scrollTo = (target, opts) => {
    if (V.lenis) V.lenis.scrollTo(target, Object.assign({ duration: 1.1 }, opts || {}));
    else { const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY - (opts && opts.offset ? -opts.offset : 0); window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }); }
  };

  /* ---------- drawer (S3: "Prologue & 당신의 업무" → "Prologue & {프로젝트명}") ---------- */
  V.drawer = {
    el: null, attached: null, baseTitle: document.title,
    html() {
      return `
      <div id="backdrop"></div>
      <aside id="drawer" data-step="1" aria-label="프로젝트 문의">
        <div class="dh"><div class="brand">Prologue<span class="amp">&amp;</span><span class="who">문의</span></div><button class="close" aria-label="닫기">×</button></div>
        <div class="db">
          <div class="attach"><span><span class="amp" style="font-size:15px">&amp;</span> <b class="pj"></b>를 보고 문의합니다</span><button type="button" class="detach">빼기</button></div>
          <div class="form">
            <div class="s1">
              <div class="stepc"><span class="num">1 / 2</span><div class="h2">지금 하는 일</div></div>
              <div class="fld"><label>어떤 일을 하고 계세요?</label><textarea placeholder="예) 병동마다 비품 요청을 카톡이랑 엑셀로 받고 있어요"></textarea></div>
              <div class="fld"><label>지금 쓰는 것</label><div class="chips">${['엑셀', '종이', '카톡', '이메일', '기존 시스템', '없음'].map(t => `<label><input type="checkbox"><span>${t}</span></label>`).join('')}</div></div>
              <div class="fld"><label>무엇이 가장 불편하세요?</label><textarea placeholder="한 줄이면 됩니다"></textarea></div>
              <div class="fld grid">
                <div><label>쓰는 사람</label><select><option>1~5명</option><option>6~20명</option><option>21~100명</option><option>100명 이상</option></select></div>
                <div><label>얼마나 자주</label><select><option>매일</option><option>매주</option><option>매월</option><option>가끔</option></select></div>
                <div><label>고치기 / 새로 만들기</label><select><option>쓰던 걸 고치기</option><option>새로 만들기</option><option>잘 모르겠어요</option></select></div>
              </div>
            </div>
            <div class="s2">
              <div class="stepc"><span class="num">2 / 2</span><div class="h2">바라는 것과 연락처</div></div>
              <div class="fld"><label>이렇게 됐으면 (선택)</label><textarea placeholder="예) 요청이 한 곳으로 모이고, 진행 상황을 서로 물어보지 않아도 되게"></textarea></div>
              <div class="fld grid" style="grid-template-columns:1fr 1fr">
                <div><label>언제까지</label><select><option>아직 정하지 않았어요</option><option>한 달 안</option><option>세 달 안</option><option>올해 안</option></select></div>
                <div><label>예산</label><select><option>이야기 나눠 보고</option><option>300만 원 이하</option><option>300~1,000만 원</option><option>1,000만 원 이상</option></select></div>
              </div>
              <div class="fld"><label>이메일 (필수)</label><input type="email" placeholder="name@company.com"></div>
              <div class="fld"><label>전화 (선택)</label><input type="tel" placeholder="010-"></div>
            </div>
          </div>
          <div class="done">
            <span class="amp">&amp;</span>
            <div class="h2">여기서부터 함께합니다</div>
            <p>잘 받았습니다. 이틀 안에 <b>hello@prologue.and</b>로 답장드리겠습니다.</p>
          </div>
        </div>
        <div class="df">
          <button class="btn o prev" type="button" style="display:none">이전</button>
          <button class="btn next" type="button">다음 <i class="tri"></i></button>
          <span class="cap">보내면 메일과 문의 목록에 남습니다<br>이틀 안에 답장</span>
        </div>
      </aside>`;
    },
    init() {
      document.body.insertAdjacentHTML('beforeend', this.html());
      const d = this.el = document.getElementById('drawer');
      const bd = document.getElementById('backdrop');
      d.querySelector('.close').addEventListener('click', () => this.close());
      bd.addEventListener('click', () => this.close());
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && d.classList.contains('on')) this.close(); });
      d.querySelector('.detach').addEventListener('click', () => this.attach(null));
      d.querySelector('.next').addEventListener('click', () => {
        if (d.dataset.step === '1') { d.dataset.step = '2'; d.querySelector('.prev').style.display = ''; d.querySelector('.next').innerHTML = '보내기 <i class="tri"></i>'; d.querySelector('.db').scrollTop = 0; }
        else if (d.dataset.step === '2') { d.dataset.step = 'done'; }
      });
      d.querySelector('.prev').addEventListener('click', () => { d.dataset.step = '1'; d.querySelector('.prev').style.display = 'none'; d.querySelector('.next').innerHTML = '다음 <i class="tri"></i>'; });
      document.addEventListener('click', e => {
        const t = e.target.closest('[data-open-drawer]'); if (!t) return;
        e.preventDefault();
        this.open(t.dataset.project ? V.project(t.dataset.project) : null);
      });
      if (location.search.includes('contact=open')) this.open(null);
    },
    attach(p) {
      this.attached = p;
      const d = this.el;
      d.querySelector('.attach').classList.toggle('on', !!p);
      d.querySelector('.who').textContent = p ? p.title : '문의';
      if (p) d.querySelector('.attach .pj').textContent = p.title;
    },
    open(p) {
      this.attach(p);
      this.el.classList.add('on'); document.getElementById('backdrop').classList.add('on');
      this.baseTitle = document.title; document.title = `Prologue & ${p ? p.title : '문의'}`;
      if (V.lenis) V.lenis.stop(); document.documentElement.style.overflow = 'hidden';
      setTimeout(() => { const f = this.el.querySelector('textarea'); if (f) f.focus(); }, 380);
    },
    close() {
      this.el.classList.remove('on'); document.getElementById('backdrop').classList.remove('on');
      document.title = this.baseTitle;
      if (V.lenis) V.lenis.start(); document.documentElement.style.overflow = '';
    }
  };

  /* ---------- S1 + S2: page line & travelling ampersand (Home only) ---------- */
  V.initLine = function (cfg) {
    if (!desktop()) return;
    const railX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rail-x')) || 48;
    const hero = document.getElementById('hero');
    const heroDia = document.getElementById('hero-dia');
    const line = document.getElementById('line');
    const dark = document.getElementById('line-dark');
    const marker = document.getElementById('marker');
    const contact = document.getElementById('contact');
    const seat = document.querySelector('.logo-bottom .seat');
    const logoBottom = document.querySelector('.logo-bottom');
    const flag = document.getElementById('flag');
    const brand = document.querySelector('.hdr .brand');
    const hdr = document.querySelector('.hdr');
    let path, guide, darkPath, darkGuide, total, tipMin, geo = {};
    let animTip = 0, launched = false;

    function docRect(el) { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }

    function build() {
      const H = document.documentElement.scrollHeight;
      const W = document.documentElement.clientWidth;
      const hr = docRect(hero);
      const lineY = Math.round(hr.y + hr.h * 0.72);
      document.documentElement.style.setProperty('--hero-line-y', (hr.h * 0.72) + 'px');
      const nodeX = Math.round(W * 0.56);
      const sr = docRect(seat);
      const ampX = Math.round(sr.x + sr.w / 2), ampY = Math.round(sr.y + sr.h / 2);
      geo = { lineY, nodeX, ampX, ampY, W, H };

      /* hero: 4 sources converge into the node (drawn on load) */
      const srcX = Math.round(W - 40 - 60);
      const ys = [-96, -32, 32, 96].map(d => lineY + d);
      const names = ['전화', '메신저', '이메일', '직접 방문'];
      heroDia.setAttribute('viewBox', `0 0 ${W} ${hr.h}`);
      heroDia.setAttribute('width', W); heroDia.setAttribute('height', hr.h);
      const ly = y => y - hr.y;
      heroDia.innerHTML = ys.map((y, i) => `<path class="src" d="M${srcX} ${ly(y)} C ${srcX - 140} ${ly(y)}, ${nodeX + 120} ${ly(lineY)}, ${nodeX} ${ly(lineY)}"/>`).join('')
        + ys.map((y, i) => `<text x="${srcX + 10}" y="${ly(y) + 4}">${names[i]}</text>`).join('')
        + `<circle class="node" cx="${nodeX}" cy="${ly(lineY)}" r="4"/>`
        + `<text x="${nodeX}" y="${ly(lineY) - 14}" text-anchor="middle">하나의 흐름</text>`
        ;

      /* page line: node → left → down the rail → footer seat (left rule) */
      const r = 24;
      const d = `M${nodeX} ${lineY} H${railX + r} Q${railX} ${lineY} ${railX} ${lineY + r} V${ampY - r} Q${railX} ${ampY} ${railX + r} ${ampY} H${ampX - 30}`;
      line.setAttribute('width', W); line.setAttribute('height', H); line.setAttribute('viewBox', `0 0 ${W} ${H}`);
      line.innerHTML = `<path class="guide" d="${d}"/><path class="ink" d="${d}"/>`;
      guide = line.querySelector('.guide'); path = line.querySelector('.ink');
      total = path.getTotalLength();
      path.style.strokeDasharray = total; path.style.strokeDashoffset = total;
      tipMin = (nodeX - railX) + r * 1.6 + 36; // horizontal + corner + short stub drawn on load

      /* dark clone clipped to contact section */
      const cr = docRect(contact);
      dark.style.top = cr.y + 'px'; dark.style.height = cr.h + 'px';
      dark.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="top:${-cr.y}px"><path class="guide" d="${d}"/><path class="ink" d="${d}" style="stroke-dasharray:${total};stroke-dashoffset:${total}"/></svg>`;
      darkPath = dark.querySelector('.ink');
      geo.darkTop = cr.y; geo.darkBottom = cr.y + cr.h;

      /* footer rules: left = the line itself, right = static rule */
      const rr = logoBottom.querySelector('.rule.r'), rl = logoBottom.querySelector('.rule.l');
      const lbr = docRect(logoBottom);
      const ruleLen = Math.min(260, (ampX - lbr.x) - 40);
      rr.style.left = (ampX + 30 - lbr.x) + 'px'; rr.style.width = ruleLen + 'px';
      rl.style.left = (ampX - 30 - ruleLen - lbr.x) + 'px'; rl.style.width = ruleLen + 'px';

      /* S4 flag branch in contact: rail → button */
      const btn = contact.querySelector('.btn'); const br = docRect(btn);
      const fy = br.y + br.h / 2 - cr.y, fx = br.x - cr.x;
      flag.setAttribute('viewBox', `0 0 ${W} ${cr.h}`); flag.setAttribute('width', W); flag.setAttribute('height', cr.h);
      flag.innerHTML = `<path d="M${railX} ${fy} H${fx - 26}"/><polygon points="${fx - 26},${fy - 6} ${fx - 12},${fy} ${fx - 26},${fy + 6}"/>`;
      geo.flagY = br.y + br.h / 2;

      /* rail labels */
      document.querySelectorAll('.rail-lbl').forEach(l => {
        const s = document.getElementById(l.dataset.for); if (!s) return;
        const y = docRect(s).y + (l.dataset.offset ? parseFloat(l.dataset.offset) : 0);
        l.style.top = y + 'px'; l.dataset.y = y;
        l.classList.toggle('dark', y >= geo.darkTop && y < geo.darkBottom);
      });
      // rail labels: distance along the path for a given doc y on the vertical segment
      geo.lenAt = y => (nodeX - railX) + r * 0.57 + (y - lineY - r);
    }

    let lastTip = -1;
    function render() {
      const sy = scrollY;
      let tip = animTip;
      if (launched) {
        // tip rides at viewport centre; over the last viewport of scroll it runs ahead to the footer seat
        const maxS = geo.H - innerHeight;
        const k = Math.max(0, Math.min(1, (sy - (maxS - innerHeight)) / innerHeight));
        const ty = sy + innerHeight * 0.5 + k * (geo.ampY - (maxS + innerHeight * 0.5));
        tip = Math.max(tipMin, Math.min(total, geo.lenAt(Math.min(ty, geo.ampY)) + k * (total - geo.lenAt(geo.ampY))));
      }
      if (tip !== lastTip) {
        path.style.strokeDashoffset = total - tip; if (darkPath) darkPath.style.strokeDashoffset = total - tip; lastTip = tip;
      }
      const p = path.getPointAtLength(tip);
      marker.style.transform = `translate(${p.x}px, ${p.y - sy}px)`;
      const inDark = p.y >= geo.darkTop && p.y < geo.darkBottom;
      marker.classList.toggle('dark', inDark);
      const rest = tip >= total - 0.5;
      marker.classList.toggle('rest', rest);
      logoBottom.classList.toggle('done', rest);
      flag.classList.toggle('on', p.y >= geo.flagY - 4);
      hdr.classList.toggle('on-dark', sy + 32 >= geo.darkTop && sy + 32 < geo.darkBottom);
      document.querySelectorAll('.rail-lbl').forEach(l => l.classList.toggle('on', p.y >= parseFloat(l.dataset.y) - 8));
    }

    build();
    addEventListener('resize', () => { build(); render(); });
    document.querySelectorAll('.rail-lbl').forEach(l => l.addEventListener('click', () => V.scrollTo(document.getElementById(l.dataset.for), { offset: -64 })));

    /* load sequence: sources draw → main line to tipMin → & flies from wordmark to the tip */
    const srcs = heroDia.querySelectorAll('.src');
    srcs.forEach(s => { const L = s.getTotalLength(); s.style.strokeDasharray = L; s.style.strokeDashoffset = L; });
    const texts = heroDia.querySelectorAll('text, .node'); texts.forEach(t => t.style.opacity = 0);
    const bamp = brand.querySelector('.bamp');

    if (reduced || !window.gsap || scrollY > innerHeight * 0.3) { // reduced motion, or reloaded mid-page: skip the intro
      srcs.forEach(s => s.style.strokeDashoffset = 0); texts.forEach(t => t.style.opacity = 1);
      animTip = tipMin; launched = true; marker.style.opacity = 1; brand.classList.add('amp-gone'); render();
    } else {
      gsap.ticker.lagSmoothing(0); // background/occluded tabs: keep time-based progress instead of crawling
      const tl = gsap.timeline({ delay: 0.2 });
      tl.to(srcs, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.06 })
        .to(texts, { opacity: 1, duration: 0.3 }, '-=0.3')
        .to({ v: 0 }, { v: tipMin, duration: 1.2, ease: 'power2.inOut', onUpdate() { animTip = this.targets()[0].v; render(); } }, '-=0.2')
        .call(() => flyAmp());
    }

    /* fly: animate a separate clone so render() can keep owning #marker */
    function flyAmp() {
      const from = bamp.getBoundingClientRect();
      const p = path.getPointAtLength(animTip);
      const to = { x: p.x, y: p.y - scrollY };
      const ghost = marker.cloneNode(true); ghost.id = 'marker-ghost'; ghost.style.opacity = 1; ghost.style.transition = 'none';
      document.body.appendChild(ghost);
      brand.classList.add('amp-gone');
      gsap.fromTo(ghost, { x: from.left + from.width / 2, y: from.top + from.height / 2, scale: 0.75 },
        { x: to.x, y: to.y, scale: 1, duration: 0.9, ease: 'power3.inOut', onComplete() { ghost.remove(); marker.style.opacity = 1; launched = true; render(); } });
    }

    if (V.lenis) V.lenis.on('scroll', render); else addEventListener('scroll', render, { passive: true });
    V.renderLine = render;
  };

  /* ---------- mobile header position "02 / 04" ---------- */
  V.initMobilePos = function (ids) {
    const el = document.querySelector('.hdr .mob-pos'); if (!el) return;
    const upd = () => { let i = 0; ids.forEach((id, k) => { const s = document.getElementById(id); if (s && s.getBoundingClientRect().top <= innerHeight * 0.4) i = k; }); el.textContent = `${String(i + 1).padStart(2, '0')} / ${String(ids.length).padStart(2, '0')}`; };
    addEventListener('scroll', upd, { passive: true }); upd();
  };

  return V;
})();
