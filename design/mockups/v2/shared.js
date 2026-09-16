/* Prologue& v2 mockups — shared runtime.
   Stands in for: Notion DB (P.projects), global contact drawer, crosshair cursor,
   progress strip, Lenis bootstrap, work list renderer. Each concept page decides what to call. */
window.P = (function () {
  const P = {};

  /* ---------- data: same schema as the planned Notion DB (docs/10 §2.3) ---------- */
  P.problems = [
    { key: 'scattered', name: '흩어진 요청', desc: '엑셀, 메신저, 이메일, 구두 요청으로 업무가 흩어져 있어요.' },
    { key: 'legacy',    name: '불편한 기존 시스템', desc: '기능은 있는데 직원들이 쓰기 어렵고 화면이 복잡해요.' },
    { key: 'paper',     name: '종이·수작업', desc: '디지털화하고 싶지만 그대로 옮기면 안 될 것 같아요.' },
    { key: 'idea',      name: '제품이 필요한 아이디어', desc: '아이디어는 있는데 구조와 화면이 없어요.' }
  ];
  P.projects = [
    { slug: 'por-favor-harry', title: 'Por favor, Harry', tagline: '흩어진 업무 요청을 하나의 Workflow로', problem: 'scattered',
      tags: ['Workflow Design', 'Product Thinking', 'Internal Tool'], role: '기획·설계·개발', period: '2025', disclosure: 'full', order: 1, featured: true,
      insight: 'ToDo 관리의 문제가 아니라 요청 Workflow의 문제였습니다.',
      before: ['전화', '메신저', '이메일', '직접 방문'], after: ['개인 링크', '구조화된 요청폼', '하나의 심사 Queue', '약속일 확정', '상태 자동 공유'] },
    { slug: 'daeryun-learning-hub', title: 'Daeryun Learning Hub', tagline: '1,220개의 종이 문제를 새로운 학습 경험으로', problem: 'paper',
      tags: ['Digital Transformation', 'UX', 'Web Application'], role: '기획·설계·개발', period: '2025', disclosure: 'anonymized', order: 2, featured: true,
      insight: '디지털 전환은 복사가 아니라, 매체 때문에 생긴 제약을 걷어내는 일입니다.',
      before: ['문제', '문제', '문제', '정답지'], after: ['문제', '답변', '즉시 채점', '해설·재도전', '다음 문제'] },
    { slug: 'hospital-ux', title: '병원 UI/UX 고도화', tagline: '복잡한 업무 화면을 더 빠르게 읽고 처리하도록', problem: 'legacy',
      tags: ['Enterprise UX', 'Legacy Improvement', 'UI Redesign'], role: 'UX 설계·프론트', period: '2024–2025', disclosure: 'mockup', order: 3, featured: true,
      insight: '업무 시스템에서는 예쁨보다 읽는 순서와 업무 맥락이 먼저입니다.',
      before: ['정보 과밀', '위계 없음', '입력 동선 길다'], after: ['읽는 순서대로 배치', '위계 3단계', '입력 동선 절반'] },
    { slug: 'custom-commerce', title: 'Custom Commerce', tagline: '기성 쇼핑몰 프레임워크 없이 처음부터 구축한 Commerce Product', problem: 'idea',
      tags: ['Product Engineering', 'Commerce', 'End-to-End Flow'], role: '설계·개발', period: '2025', disclosure: 'full', order: 4, featured: true,
      insight: '쇼핑몰은 상품 페이지 하나가 아니라 탐색 → 구매 → 주문 → 운영이 이어진 하나의 흐름입니다.',
      before: ['아이디어', '기성 솔루션의 한계'], after: ['탐색', '구매', '주문', '운영', '관리자'] },
    /* non-featured: appear in the Projects list only, never on the main strip */
    { slug: 'quote-sheet', title: '견적서 자동화', tagline: '엑셀 견적서 12종을 입력 한 번으로', problem: 'paper',
      tags: ['Automation', 'Internal Tool'], role: '설계·개발', period: '2024', disclosure: 'anonymized', order: 5, featured: false,
      insight: '양식이 12개인 게 아니라 입력이 12번인 게 문제였습니다.',
      before: ['양식 고르기', '복사', '수정', '검토'], after: ['입력 1회', '자동 생성'] },
    { slug: 'shift-board', title: '교대 근무표', tagline: '카톡으로 돌던 근무표를 한 화면으로', problem: 'scattered',
      tags: ['Workflow Design', 'Mobile'], role: '기획·개발', period: '2024', disclosure: 'mockup', order: 6, featured: false,
      insight: '근무표는 문서가 아니라 알림이어야 했습니다.',
      before: ['카톡 공지', '캡처', '개인 메모'], after: ['한 화면', '변경 알림'] }
  ];
  P.featured = () => P.projects.filter(p => p.featured).sort((a, b) => a.order - b.order);
  P.projectFor = key => P.projects.find(p => p.problem === key && p.featured) || P.projects.find(p => p.problem === key);
  P.project = slug => P.projects.find(p => p.slug === slug);
  P.problem = key => P.problems.find(p => p.key === key);

  /* tiny abstract thumbnail per project: before-lines converging to one line (the & flag) */
  P.thumb = (p, stroke) => {
    const s = stroke || 'rgba(255,255,255,.75)';
    const n = p.before.length;
    const paths = p.before.map((_, i) => { const y = 20 + i * (80 / Math.max(n - 1, 1)); return `<path d="M10 ${y} C 60 ${y}, 70 60, 120 60" fill="none" stroke="${s}" stroke-width="1"/>`; }).join('');
    return `<svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice">${paths}<line x1="120" y1="60" x2="142" y2="60" stroke="${s}" stroke-width="2"/><polygon points="142,54 154,60 142,66" fill="${s}"/></svg>`;
  };

  /* ---------- crosshair cursor ---------- */
  P.initCrosshair = function (opts) {
    opts = opts || {};
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return null;
    if (matchMedia('(prefers-reduced-motion:reduce)').matches && !opts.force) return null;
    const el = document.createElement('div'); el.id = 'p-crosshair';
    el.innerHTML = '<div class="lx"></div><div class="ly"></div><div class="cl"></div>' + (opts.coords ? '<div class="coord"></div>' : '');
    document.body.appendChild(el);
    const lx = el.querySelector('.lx'), ly = el.querySelector('.ly'), lbl = el.querySelector('.cl'), coord = el.querySelector('.coord');
    let shown = false;
    document.addEventListener('mousemove', e => {
      if (!shown) { document.documentElement.classList.add('has-crosshair'); shown = true; }
      lx.style.top = e.clientY + 'px'; ly.style.left = e.clientX + 'px';
      lbl.style.left = e.clientX + 'px'; lbl.style.top = e.clientY + 'px';
      const t = e.target.closest && e.target.closest('[data-view],a,button');
      const overText = e.target.closest && e.target.closest('p,h1,h2,h3,li,td,label,textarea,input');
      el.classList.toggle('is-clickable', !!t);
      el.classList.toggle('over-text', !!overText && !t);
      if (t) lbl.textContent = t.dataset.view || (t.tagName === 'A' || t.tagName === 'BUTTON' ? '열기' : '보기');
      if (coord) coord.textContent = (opts.coordFn ? opts.coordFn(e) : `${e.clientX}, ${e.clientY}`);
    });
    document.addEventListener('mouseleave', () => { document.documentElement.classList.remove('has-crosshair'); shown = false; });
    return el;
  };

  /* ---------- progress strip ---------- */
  P.progress = function (container, count, onSelect) {
    container.classList.add('p-progress');
    let html = '';
    for (let i = 0; i < count; i++) html += `<button type="button" data-i="${i}" aria-label="${i + 1}"><i></i></button>`;
    container.innerHTML = html + '<b></b>';
    const bars = [...container.querySelectorAll('i')]; const box = container.querySelector('b');
    box.style.position = 'absolute'; if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    if (onSelect) container.addEventListener('click', e => { const b = e.target.closest('button'); if (b) onSelect(+b.dataset.i); });
    const api = { set(i) { bars.forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); }); const t = bars[i]; if (t) { box.style.left = (t.offsetLeft - 10) + 'px'; box.style.top = '0'; } } };
    api.set(0); return api;
  };

  /* ---------- Lenis ---------- */
  P.initLenis = function (opts) {
    if (!window.Lenis || matchMedia('(prefers-reduced-motion:reduce)').matches) return null;
    const lenis = new Lenis(Object.assign({ lerp: 0.1, wheelMultiplier: 1, syncTouch: false }, opts || {}));
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    }
    document.documentElement.classList.add('lenis-on');
    P.lenis = lenis; return lenis;
  };
  P.scrollTo = (target, opts) => { if (P.lenis) P.lenis.scrollTo(target, Object.assign({ offset: 0, duration: 1.1 }, opts || {})); else (typeof target === 'string' ? document.querySelector(target) : target).scrollIntoView({ behavior: 'smooth' }); };

  /* ---------- drawer ---------- */
  P.initDrawer = function () {
    const dim = document.createElement('div'); dim.id = 'p-dim';
    const d = document.createElement('aside'); d.id = 'p-drawer'; d.setAttribute('aria-label', '프로젝트 문의');
    d.innerHTML = `
      <div class="hd"><h2>프로젝트 문의</h2><button type="button" data-close>닫기</button></div>
      <div class="bd">
        <div class="ctx" hidden><b></b><span>을(를) 보고 문의합니다</span><button type="button" data-unlink>첨부 해제</button></div>
        <form id="p-form">
          <div data-step="1">
            <label for="f1">현재 어떤 업무를 하고 있나요?</label>
            <textarea id="f1" name="work" placeholder="예: 거래처 단가표를 엑셀로 관리하고 카톡으로 요청을 받아요"></textarea>
            <label>지금 어떤 도구를 사용하고 있나요?</label>
            <div class="chips">
              <label><input type="checkbox" name="tool" value="엑셀">엑셀</label>
              <label><input type="checkbox" name="tool" value="종이">종이</label>
              <label><input type="checkbox" name="tool" value="카톡·메신저">카톡·메신저</label>
              <label><input type="checkbox" name="tool" value="이메일">이메일</label>
              <label><input type="checkbox" name="tool" value="기존 시스템">기존 시스템</label>
            </div>
            <label for="f3">가장 불편한 부분은 무엇인가요?</label>
            <textarea id="f3" name="pain"></textarea>
            <label for="f4">이 업무를 몇 명이 사용하나요?</label>
            <select id="f4" name="users"><option>1~5명</option><option>6~20명</option><option>21~100명</option><option>100명 이상</option></select>
          </div>
          <div data-step="2" hidden>
            <label for="f7">원하는 결과는 무엇인가요?</label>
            <textarea id="f7" name="goal"></textarea>
            <label for="f8">희망 일정</label>
            <select id="f8" name="when"><option>1개월 내</option><option>3개월 내</option><option>6개월 내</option><option>미정</option></select>
            <label for="f10">이메일</label>
            <input id="f10" type="email" name="email" placeholder="답변 받을 주소">
            <p class="note">보내주신 내용은 이메일과 문의 시트에 저장되고, 2영업일 안에 답변드립니다.</p>
          </div>
        </form>
        <div class="done" hidden><div class="flag"></div><h3>접수됐습니다</h3><p>내용을 읽고 2영업일 안에 답변드리겠습니다.<br>지금 하시는 업무가 조금은 단순해질 수 있는지 함께 살펴보겠습니다.</p></div>
      </div>
      <div class="ft"><span class="step">1 / 2 — 현재 업무</span><button type="button" class="btn" data-prev hidden>이전</button><button type="button" class="btn primary" data-next>다음</button></div>`;
    document.body.append(dim, d);
    const ctx = d.querySelector('.ctx'), s1 = d.querySelector('[data-step="1"]'), s2 = d.querySelector('[data-step="2"]'), done = d.querySelector('.done'),
      stepLbl = d.querySelector('.step'), prev = d.querySelector('[data-prev]'), next = d.querySelector('[data-next]'), form = d.querySelector('#p-form');
    let step = 1;
    const render = () => { s1.hidden = step !== 1; s2.hidden = step !== 2; done.hidden = step !== 3; form.hidden = step === 3; prev.hidden = step !== 2; next.hidden = step === 3;
      stepLbl.textContent = step === 1 ? '1 / 2 — 현재 업무' : step === 2 ? '2 / 2 — 목표와 연락처' : '접수됨'; next.textContent = step === 2 ? '문의 보내기' : '다음'; };
    next.addEventListener('click', () => { if (step === 1) step = 2; else if (step === 2) step = 3; render(); });
    prev.addEventListener('click', () => { step = 1; render(); });
    d.querySelector('[data-close]').addEventListener('click', () => P.closeDrawer());
    d.querySelector('[data-unlink]').addEventListener('click', () => { ctx.hidden = true; });
    dim.addEventListener('click', () => P.closeDrawer());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') P.closeDrawer(); });
    document.addEventListener('click', e => { const b = e.target.closest('[data-open-drawer]'); if (b) { e.preventDefault(); P.openDrawer({ project: b.dataset.project, message: b.dataset.message }); } });
    P.openDrawer = function (o) { o = o || {}; step = 1; render();
      if (o.project) { const p = P.project(o.project); if (p) { ctx.hidden = false; ctx.querySelector('b').textContent = p.title; } } else ctx.hidden = true;
      if (o.message) form.work.value = o.message;
      document.documentElement.classList.add('drawer-open'); if (P.lenis) P.lenis.stop(); setTimeout(() => form.work.focus(), 450); };
    P.closeDrawer = function () { document.documentElement.classList.remove('drawer-open'); if (P.lenis) P.lenis.start(); };
    render();
  };

  /* ---------- work list ---------- */
  P.renderWork = function (container, opts) {
    opts = opts || {}; let mode = opts.mode || 'grid';
    container.classList.add('p-work');
    const draw = () => {
      const items = P.projects.slice().sort((a, b) => a.order - b.order).map(p => mode === 'grid'
        ? `<a class="it" href="#" data-view="보기" data-slug="${p.slug}"><div class="thumb">${P.thumb(p)}</div><h3>${p.title}</h3><p>${p.tagline}</p></a>`
        : `<a class="it" href="#" data-view="보기" data-slug="${p.slug}"><div class="thumb">${P.thumb(p)}</div><div><h3>${p.title}</h3><p>${p.tagline}</p></div><div class="meta"><b>${P.problem(p.problem).name}</b>${p.period} · ${p.role}</div></a>`).join('');
      container.innerHTML = `<div class="tools"><span class="src">Notion DB · ${P.projects.length}개 프로젝트 · 1시간마다 갱신</span><div class="toggle"><button type="button" data-mode="grid" class="${mode === 'grid' ? 'on' : ''}">GRID</button><button type="button" data-mode="list" class="${mode === 'list' ? 'on' : ''}">LIST</button></div></div><div class="${mode}">${items}</div>`;
    };
    container.addEventListener('click', e => { const t = e.target.closest('[data-mode]'); if (t) { mode = t.dataset.mode; draw(); return; }
      const it = e.target.closest('[data-slug]'); if (it) { e.preventDefault(); if (opts.onOpen) opts.onOpen(it.dataset.slug); } });
    draw();
  };

  /* ---------- theme (mockup only): ?theme=product|blueprint|editorial, switcher at bottom ---------- */
  P.THEMES = [['product', '제품 UI풍'], ['blueprint', '설계도풍'], ['editorial', '편집물풍']];
  P.initTheme = function (fallback) {
    const q = new URLSearchParams(location.search).get('theme');
    let t = q || (function () { try { return localStorage.getItem('p-theme'); } catch (e) { return null; } })() || fallback || 'product';
    if (!P.THEMES.some(x => x[0] === t)) t = fallback || 'product';
    document.documentElement.dataset.theme = t;
    const el = document.createElement('div'); el.id = 'p-theme';
    el.innerHTML = '<span>시각 언어</span>' + P.THEMES.map(x => `<button type="button" data-theme-set="${x[0]}" class="${x[0] === t ? 'on' : ''}">${x[1]}</button>`).join('');
    document.body.appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-theme-set]'); if (!b) return; const u = new URL(location.href); u.searchParams.set('theme', b.dataset.themeSet); try { localStorage.setItem('p-theme', b.dataset.themeSet); } catch (err) {} location.href = u.toString(); });
    return t;
  };

  /* ---------- case study markup (Por favor, Harry), shared by every concept ---------- */
  P.caseHTML = function () { return `
    <h1>흩어진 업무 요청을 하나의 Workflow로</h1>
    <p class="tags">Workflow Design · Product Thinking · Internal Tool</p>
    <section><h2>Overview<small>01</small></h2><div><p>사내 업무 요청을 받아 처리하는 담당자를 위한 요청 관리 도구. 기획·설계·개발 전부를 혼자 맡았습니다.</p></div></section>
    <section><h2>Problem<small>02</small></h2><div><p>업무 요청이 전화, 메신저, 이메일, 직접 방문으로 흩어져 들어왔습니다. 요청자는 요구를 충분히 정리하지 않은 채 전달하는 경우가 많았고, 받는 사람은 그것을 다시 정리하거나 기억해야 했습니다.</p></div></section>
    <section><h2>Existing Workflow<small>03</small></h2><div><div class="flow"><span>전화</span><span>메신저</span><span>이메일</span><span>직접 방문</span><em>→</em><span>담당자가 정리·기억</span><em>→</em><span>몰입 중단</span></div></div></section>
    <section><h2>Insight<small>04</small></h2><div><p class="q">ToDo 관리의 문제가 아니라 요청 Workflow의 문제였습니다.</p></div></section>
    <section><h2>Redesign<small>05</small></h2><div><div class="flow"><span>개인 링크</span><em>→</em><span>구조화된 요청폼</span><em>→</em><span>하나의 심사 Queue</span><em>→</em><span>약속일 확정</span><em>→</em><span class="g">상태 자동 공유</span></div><p>요청 단계에서 필수 정보를 채우게 해 되묻는 일을 없앴고, 심사 Queue에서 한 번에 판단합니다.</p></div></section>
    <section><h2>Solution<small>06</small></h2><div><p>요청폼 · 심사 Queue · 진행 상태 · 약속일 · Dashboard · 요청자 조회 화면. (화면은 공개 범위 확인 후 게시)</p></div></section>
    <section><h2>Before / After<small>07</small></h2><div><p>요청 경로 4개 → 1개. 진행상황 문의 반복 → 요청자가 직접 확인.</p></div></section>
    <section><h2>Impact<small>08</small></h2><div><p>업무 중 끊김이 줄고, 요청자가 먼저 요구사항을 정리해서 보내게 되었습니다.</p></div></section>
    <section><h2>What I Learned<small>09</small></h2><div><p>도구를 만들기 전에 요청이 들어오는 구조를 바꾸는 것이 먼저였습니다.</p></div></section>
    <section><h2>CTA<small>10</small></h2><div><p>비슷한 문제가 있다면 지금 쓰는 방식과 가장 불편한 점을 알려주세요.</p><a class="btn" href="#" data-open-drawer data-project="por-favor-harry" data-view="문의">이 프로젝트를 보고 문의하기 <i class="tri"></i></a></div></section>
    <p class="built">Built with Next.js · TypeScript · PostgreSQL</p>`; };

  return P;
})();
