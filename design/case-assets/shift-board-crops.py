"""교대 근무표 주석 그림 — 캡처 원본(data/images/captures/duty-roster, 커밋 안 함)을 잘라 web/public/screens/shift/ 에 둔다.
명세 4장. 아래 끝은 표의 가로 구분선에 맞춰 잘라 반쯤 걸린 행이 남지 않게 한다(snap)."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'data/images/captures/duty-roster'
DST = ROOT / 'web/public/screens/shift'
COV = ROOT / 'web/public/screens/covers'


def is_line(im, x0, x1, y):
    """y 줄이 표의 가로 구분선인가: x0~x1 에서 4px 마다 본 점의 70% 이상이 같은 옅은 회색(흰 바탕보다 어둡고 글자보다 밝음)"""
    px = im.load()
    pts = [px[x, y][:3] for x in range(x0, x1, 4)]
    hits = sum(1 for (r, g, b) in pts if 205 <= (r + g + b) / 3 <= 240 and max(r, g, b) - min(r, g, b) <= 12)
    return hits >= 0.7 * len(pts)


def snap(im, x0, x1, y, up=90):
    """y 에서 위로 올라가며 처음 만나는 구분선 바로 아래 줄을 돌려준다(그 줄까지 자른다)"""
    for yy in range(y, y - up, -1):
        if is_line(im, x0, x1, yy):
            return yy + 1
    raise SystemExit(f'구분선을 찾지 못함: y={y}')


def fit(im, x0, x1, y0, h, up=90):
    """높이 h 를 지키며 아래 끝이 구분선에 오도록 위 끝을 올린다(전환 두 그림을 같은 크기로 둘 때)"""
    for d in range(0, up):
        if is_line(im, x0, x1, y0 - d + h - 1):
            return y0 - d
    raise SystemExit(f'구분선을 찾지 못함: y0={y0} h={h}')


def load(name):
    return Image.open(SRC / f'{name}.png').convert('RGB')


def save(im, box, name, size=None):
    out = im.crop(box)
    if size and out.size != size:
        out = out.resize(size, Image.LANCZOS)
    out.save(DST / f'{name}.png', optimize=True)
    print(name, box, out.size)
    return out.size


DST.mkdir(parents=True, exist_ok=True)

# 1 자동 편성 — 근무표 카드(범위 탭 ~ 3/11)
im = load('01-roster-owner')
save(im, (529, 361, 2391, snap(im, 1000, 2380, 1776)), 'roster')
# 2 보기 전용 — 같은 폭(탭 ~ 표 윗부분)
im = load('10-readonly')
save(im, (529, 361, 2391, snap(im, 1000, 2380, 1677)), 'readonly')
# 3 전환: 날짜 맞바꾸기 / 다른 분으로 — 1634 × 1496, 같은 크기.
#   오른쪽 끝은 토 추가① 열 경계(그 뒤 열 조각이 걸리지 않게), 위는 월 이동 단추 위 여백까지
W3, H3 = 1634, 1496
im = load('03-swap')
y = fit(im, 1000, 2100, 214, H3)
s3 = save(im, (529, y, 529 + W3, y + H3), 'swap')
im = load('04-picker')
save(im, (862, 300, 862 + W3, 300 + H3), 'picker', s3)   # 모달 가운데(원본 x 1679)에 맞춤
# 4 전환: 내려받기 전 / 미편성 미리보기 — 같은 크기.
#   미리보기를 먼저 열 경계(A권역 C조 왼쪽 선 1390 — "A권역 휴일 당직" 머리 글자 1505~1657 가 다 들어온다 ~ 주간 대기 B조 오른쪽 선 3711),
#   머리 윗선(796), 3/15 행 아래 구분선(2238, 3/18 퇴사자 칸은 들어오지 않는다)으로 자르고,
#   확인 창은 그 가로세로 비율로 모달 가운데(원본 1679, 1050)에서 잘라 같은 크기로 맞춘다
im = load('06-unassigned-full')
un = im.crop((1390, 796, 3712, 2240))
im = load('05-export-check')
w4 = 1452; h4 = round(w4 * un.height / un.width)
s4 = save(im, (1679 - w4 // 2, 1050 - h4 // 2, 1679 - w4 // 2 + w4, 1050 - h4 // 2 + h4), 'export-check')
un.resize(s4, Image.LANCZOS).save(DST / 'unassigned.png', optimize=True)
print('unassigned', un.size, '->', s4)
# 5 누적 패널 — 표 A조 ~ 패널 끝, 3/9 까지
im = load('07-highlight')
save(im, (529, 361, 3318, snap(im, 1000, 2380, 1776)), 'panel')   # 카드 전체 폭 — 표 A조부터 자르면 왼쪽에 도구줄 조각이 걸린다. 01 과 같은 행(3/11 아래)
# 6 휴일 관리 — 카드(제목 ~ 2026-05-24 행)
im = load('12-holidays')
save(im, (529, 575, 1929, snap(im, 560, 1900, 1798)), 'holidays')
# 다음 이야기 표지
Image.open(SRC / '01-roster-owner.png').convert('RGB').resize((1280, 800), Image.LANCZOS).save(COV / 'shift-board.png', optimize=True)
print('covers/shift-board (1280, 800)')
