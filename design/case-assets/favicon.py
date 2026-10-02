"""사이트 파비콘 — 남색 칸 + 흰 P&(크게). 2026-10-02 사용자 선택(후보 D).
원본: data/images/logo/png/[mono]P&simple black.png(투명 바탕 검은 마크)의 모양만 쓴다.
만드는 것(web/app/ — Next 아이콘 파일 규칙):
  favicon.ico     16 · 32 · 48 묶음(브라우저 탭)
  icon.png        512 (안드로이드·검색 결과 등)
  apple-icon.png  180 (아이폰 홈 화면 — 투명·둥근 모서리 없이 꽉 찬 사각형. 모서리는 iOS 가 깎는다)
사용: python design/case-assets/favicon.py"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'data/images/logo/png/[mono]P&simple black.png'
APP = ROOT / 'web/app'
NAVY, BONE = (43, 49, 96), (250, 249, 246)   # --navy-800 · --bone-50
PAD, RADIUS = 0.10, 0.12                      # 마크 둘레 여백 · 칸 모서리(한 변 대비)

alpha = Image.open(SRC).convert('RGBA').getchannel('A')
alpha = alpha.crop(alpha.getbbox())


def mark(size):
    w, h = alpha.size
    s = size / max(w, h)
    a = alpha.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    im = Image.new('RGBA', a.size, BONE + (255,))
    im.putalpha(a)
    return im


def icon(size, rounded=True):
    """size 보다 크게(8배) 그린 뒤 줄여 가장자리를 매끈하게"""
    big = size * 8
    c = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    m = Image.new('L', (big, big), 0)
    if rounded:
        ImageDraw.Draw(m).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * RADIUS), fill=255)
    else:
        m.paste(255, (0, 0, big, big))
    c.paste(Image.new('RGBA', (big, big), NAVY + (255,)), (0, 0), m)
    g = mark(int(big * (1 - 2 * PAD)))
    c.alpha_composite(g, ((big - g.width) // 2, (big - g.height) // 2))
    return c.resize((size, size), Image.LANCZOS)


icon(48).save(APP / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
icon(512).save(APP / 'icon.png', optimize=True)
icon(180, rounded=False).convert('RGB').save(APP / 'apple-icon.png', optimize=True)
for f in ('favicon.ico', 'icon.png', 'apple-icon.png'):
    im = Image.open(APP / f)
    print(f, im.size, im.info.get('sizes', ''))
