/* Prologue& — project panel visuals shared by v3 (rows), v4 (pinned strip), v5 (horizontal strip).
   No screenshots on Home panels (2026-09-16 decision): shape (problem impression, navy-100)
   + before→after mini diagram on the line + 1~2 result numbers. */
window.PANELS = (function () {
  const D = {
    'por-favor-harry': { shape: 'circles', before: ['전화', '메신저', '이메일', '직접 방문'], after: ['개인 링크', '심사 Queue', '약속일'], end: '상태 공유',
      nums: [['4 → 1', '요청 경로'], ['0회', '진행 상황 문의']] },
    'hospital-ux': { shape: 'grid', before: ['정보 과밀', '위계 없음', '긴 입력 동선'], after: ['읽는 순서', '위계 3단계'], end: '처리',
      nums: [['3단계', '화면 위계'], ['½', '입력 동선']] },
    'daeryun-learning-hub': { shape: 'papers', before: ['문제집', '정답지', '채점'], after: ['문제', '즉시 채점', '해설·재도전'], end: '다음 문제',
      nums: [['1,220', '종이 문제'], ['즉시', '채점·해설']] },
    'custom-commerce': { shape: 'ring', before: ['아이디어', '기성 솔루션 한계'], after: ['탐색', '구매', '주문', '운영'], end: '관리자',
      nums: [['5', '이어진 흐름'], ['0', '기성 프레임워크']] },
    'quote-sheet': { shape: 'papers', before: ['양식 고르기', '복사', '수정'], after: ['입력 1회'], end: '자동 생성', nums: [['12 → 1', '입력 횟수']] },
    'shift-board': { shape: 'circles', before: ['카톡 공지', '캡처', '개인 메모'], after: ['한 화면'], end: '변경 알림', nums: [['1', '화면']] }
  };
  const get = slug => D[slug] || D['por-favor-harry'];

  /* ---- shape: light navy-100 area behind the text. Positions are % of the container ---- */
  const shapeHTML = kind => {
    if (kind === 'circles') return `<div class="shape circles"><i style="width:46%;padding-top:46%;left:34%;top:-12%"></i><i style="width:24%;padding-top:24%;left:74%;top:30%"></i><i style="width:16%;padding-top:16%;left:26%;top:58%"></i><i style="width:30%;padding-top:30%;left:52%;top:62%"></i></div>`;
    if (kind === 'grid') return `<div class="shape grid"><i style="left:38%;top:8%;width:58%;height:84%"></i></div>`;
    if (kind === 'papers') return `<div class="shape papers"><i class="a" style="left:44%;top:6%;width:30%;height:70%"></i><i class="b" style="left:56%;top:22%;width:30%;height:70%"></i></div>`;
    return `<div class="shape ring"><i style="width:44%;padding-top:44%;left:48%;top:14%"></i></div>`;
  };

  /* ---- mini diagram: before curves (left) → node → after nodes on the line → flag (right)
     Draws into its own SVG (v3 rows) or contributes to a shared track line (v4/v5: pass {shared:true}). */
  const diagramSVG = (slug, o) => {
    const d = get(slug); o = o || {};
    const W = o.w || 320, H = o.h || 120, y = o.y || Math.round(H * 0.55);
    const x0 = o.x0 || 28, node = o.node || Math.round(W * 0.38), x1 = o.x1 || W - 10;
    const nB = d.before.length, spread = Math.min(H * 0.34, 18 * (nB - 1) + 6);
    const src = d.before.map((n, i) => { const yy = y - spread / 2 + (nB > 1 ? i * spread / (nB - 1) : 0); return { n, yy }; });
    const before = src.map(s => `<path class="d-before" d="M${x0} ${s.yy} C ${x0 + (node - x0) * 0.55} ${s.yy}, ${x0 + (node - x0) * 0.6} ${y}, ${node} ${y}"/>`).join('');
    const bl = src.map(s => `<text class="d-lbl" x="${x0 - 6}" y="${s.yy + 3.5}" text-anchor="end">${s.n}</text>`).join('');
    const nA = d.after.length, step = (x1 - 18 - node) / (nA + 1);
    const after = o.shared ? '' : `<path class="d-after" d="M${node} ${y} H${x1 - 16}"/>`;
    const nodes = `<circle class="d-node" cx="${node}" cy="${y}" r="3.5"/>` + d.after.map((n, i) => { const x = node + step * (i + 1); return `<circle class="d-node" cx="${x}" cy="${y}" r="3.5"/><text class="d-lbl" x="${x}" y="${y + (i % 2 ? -10 : 18)}" text-anchor="middle">${n}</text>`; }).join('');
    const flag = `<polygon class="d-flag" points="${x1 - 16},${y - 6} ${x1},${y} ${x1 - 16},${y + 6}"/><text class="d-lbl" x="${x1 - 8}" y="${y + 20}" text-anchor="middle">${d.end}</text>`;
    const inner = before + bl + after + nodes + flag;
    return o.shared ? inner : `<svg class="dia-mini" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  };

  /* progress 0..1 → before curves draw (0~.45), after line (.45~1); works on any element containing the classes */
  const prep = root => { root.querySelectorAll('.d-before,.d-after').forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.dataset.len = L; }); root.querySelectorAll('.d-node,.d-flag').forEach(n => n.style.opacity = 0); };
  const progress = (root, t) => {
    const tb = Math.min(1, Math.max(0, t / 0.45)), ta = Math.min(1, Math.max(0, (t - 0.45) / 0.55));
    root.querySelectorAll('.d-before').forEach(p => p.style.strokeDashoffset = p.dataset.len * (1 - tb));
    root.querySelectorAll('.d-after').forEach(p => p.style.strokeDashoffset = p.dataset.len * (1 - ta));
    const nodes = root.querySelectorAll('.d-node'); nodes.forEach((n, i) => n.style.opacity = ta >= i / nodes.length ? 1 : 0);
    root.querySelectorAll('.d-flag').forEach(f => f.style.opacity = ta >= 0.98 ? 1 : 0);
  };

  const numsHTML = slug => `<div class="nums">${get(slug).nums.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;

  return { data: D, get, shapeHTML, diagramSVG, prep, progress, numsHTML };
})();
