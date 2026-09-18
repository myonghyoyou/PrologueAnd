# -*- coding: utf-8 -*-
"""v5 단일 HTML 번들 생성기 — index.html + CSS 3개 + JS 3개를 한 파일로 인라인.
   폰트(Pretendard·Bodoni Moda)·GSAP·Lenis는 CDN 그대로(인터넷 필요). Projects·Case Study 시트(iframe)는 제외.
   사용: python build-single.py  →  prologue-v5-single.html
"""
import io, os, re
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, '..')
rd = lambda p: io.open(os.path.join(root, p), encoding='utf-8').read()

html = rd('v5/index.html')
css = '\n'.join(rd(p) for p in ['v3/v3.css', 'v4/v4.css', 'v5/v5.css'])
js = '\n'.join(rd(p) for p in ['v3/v3.js', 'v3/panels.js', 'v5/v5.js'])

# ---- sheets (iframe) → 시안 파일에는 포함하지 않음: 안내 문구로 대체 ----
js = js.replace("const f = document.getElementById('sheet-frame'); if (f.getAttribute('src') !== src) f.src = src; ", "")
html = html.replace('<iframe id="sheet-frame" title="상세"></iframe>',
                    '<div class="sheet-note"><span class="amp">&amp;</span><b>Projects · Case Study</b><p>이 단일 파일 시안에는 상세 시트가 포함되어 있지 않습니다.<br>전체 시안: design/mockups/v5/index.html</p></div>')
css += "\n.sheet-note{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px;color:var(--bone-700)}.sheet-note .amp{font-size:64px;line-height:1;margin-bottom:12px}.sheet-note b{font-size:18px;margin-bottom:8px}.sheet-note p{margin:0;font-size:14px;line-height:1.7}"

# ---- inline CSS/JS ----
html = re.sub(r'<link rel="stylesheet" href="(\.\./v3/v3\.css|\.\./v4/v4\.css|v5\.css)(\?v=[^"]*)?">\n?', '', html)
html = html.replace('</head>', '<style>\n' + css + '\n</style>\n</head>')
html = re.sub(r'<script src="(\.\./v3/v3\.js|\.\./v3/panels\.js|v5\.js)(\?v=[^"]*)?"></script>\n?', '', html)
html = html.replace('<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>',
                    '<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>\n<script>\n' + js.replace('</script>', '<\\/script>') + '\n</script>')
html = html.replace('<a class="brand" href="index.html"', '<a class="brand" href="#p00"')
html = html.replace('<title>Prologue& — v5 가로 전용</title>', '<title>Prologue& — 시안 (단일 파일)</title>')

out = os.path.join(here, 'prologue-v5-single.html')

# ---- artifact variant: no html/head/body skeleton, Google Fonts only (Pretendard → Noto Sans KR) ----
art = html
art = art.replace('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">\n', '')
art = art.replace('family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&display=swap', 'family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Noto+Sans+KR:wght@400;500;600&display=swap')
art = art.replace('--sans:"Pretendard","Apple SD Gothic Neo","Segoe UI",sans-serif;', '--sans:"Pretendard","Noto Sans KR","Apple SD Gothic Neo","Segoe UI",sans-serif;')
art = art.replace('<title>Prologue& — 시안 (단일 파일)</title>', '<title>Prologue& 가로 시안</title>')
head_start = art.index('<title>'); head_end = art.index('</head>'); body_start = art.index('<body>') + len('<body>'); body_end = art.index('</body>')
art = art[head_start:head_end] + '\n' + art[body_start:body_end]
io.open(os.path.join(here, 'prologue-v5-artifact.html'), 'w', encoding='utf-8', newline='\n').write(art)
io.open(out, 'w', encoding='utf-8', newline='\n').write(html)
print(out, len(html.encode('utf-8')) // 1024, 'KB')
