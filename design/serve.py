# -*- coding: utf-8 -*-
"""로컬 시안 서버 — 캐시 없음 (브라우저가 옛 HTML/CSS/JS를 재사용하지 않도록 Cache-Control: no-store).
사용: python design/serve.py  →  http://127.0.0.1:8765/design/mockups/v5/index.html  (프로젝트 루트에서 실행)"""
import http.server, os, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, *a): pass
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
