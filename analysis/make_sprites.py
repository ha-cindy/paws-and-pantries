"""Hand-placed pixel Zuzu. Each sprite is an ASCII grid, one character per pixel.
Run: python3 analysis/make_sprites.py  (writes assets/sprites/*.png and a preview sheet)

Legend: . clear  K outline  G gray  L light gray  D tabby stripe  W white  P pink
        E eye  H eye shine  Y yellow toy  B treat  S shadow
"""
from PIL import Image
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "sprites")
os.makedirs(OUT, exist_ok=True)
PAL = {
    ".": (0, 0, 0, 0), "K": (46, 45, 51, 255), "G": (158, 157, 168, 255), "L": (196, 195, 204, 255),
    "D": (104, 102, 114, 255), "W": (250, 249, 246, 255), "P": (240, 150, 160, 255), "E": (46, 45, 51, 255),
    "H": (255, 255, 255, 255), "Y": (242, 194, 48, 255), "B": (196, 132, 66, 255), "S": (0, 0, 0, 60),
}

def grid(rows, name):
    w = max(len(r) for r in rows)
    im = Image.new("RGBA", (w, len(rows)), (0, 0, 0, 0))
    for y, r in enumerate(rows):
        for x, c in enumerate(r.ljust(w, ".")):
            if c not in PAL: sys.exit(f"{name}: bad char {c!r} at {x},{y}")
            im.putpixel((x, y), PAL[c])
    return im

# Front-facing head, 22 x 17. Big eyes, tabby M, pink nose, white muzzle.
HEAD = [
    "..KK..............KK..",
    "..KPK............KPK..",
    "..KPPK..........KPPK..",
    "..KGPPKKKKKKKKKKPPGK..",
    ".KGGGGGGDGGGGDGGGGGGK.",
    ".KGGGGGGDDGGDDGGGGGGK.",
    "KGGGGGGGDGDDGDGGGGGGGK",
    "KDGGGGGGGGGGGGGGGGGGDK",
    "KGGGKKKGGGGGGGGGKKKGGK",
    "KDGKHKEKGGGGGGGKHKEKDK",
    "KGGKEEEKGGGGGGGKEEEKGK",
    "KGGGKKKGGWWWWWGGKKKGGK",
    "KGGPGGGGWWWPPWWGGGGPGK",
    ".KGGGGGWWKWKKWKWWGGGK.",
    ".KGGGGGWWWKWWKWWWGGGK.",
    "..KKGGGGWWWWWWWWGGKK..",
    "....KKKKKKKKKKKKKK....",
]
# 2-row sleepy eyes version of rows 8-10
def sleepy(head):
    h = list(head)
    h[8] = "KGGGGGGGGGGGGGGGGGGGGK"
    h[9] = "KDGGKKKGGGGGGGGGKKKGDK"
    h[10] = "KGGGGGGGGGGGGGGGGGGGGK"
    return h

ICON = HEAD

SIT = HEAD[:16] + [
    "...KGGGGGWWWWWWWWGGK..",
    "...KGGDGWWWWWWWWWGDK..",
    "..KGGGGGWWWWWWWWWGGGK.",
    "..KGDGGWWWWWWWWWWGDGK.",
    "..KGGGGWWWWWWWWWWGGGKKK",
    "..KGDGGWWWWWWWWWWGDGKGK",
    "..KGGGKWWWWKKWWWWKGGKGK",
    "..KGGGKWWWWKKWWWWKGGKGK",
    "..KGGKWWWWK..KWWWWKGKGK",
    "...KKKKKKK....KKKKKKKK.",
]

LOAF_BODY = [
    "......................KKKKKKKKKK",
    "...................KKKGGGGGGGGGGK",
    "................KKKGGGDGGGDGGGGGK",
    "...............KGGGGDGGGDGGGDGGGK",
    "..............KGGDGGGDGGGDGGGGGGK",
    ".............KGGGGDGGGGDGGGGDGGGK",
    "............KGGGGGGGGGGGGGGGGGGGK",
    "...........KWWWWWGGGGGGGGGGGGGGGK",
    "...........KWWWWWWWWWWWWWWWWWWWK.",
    "............KKKKKKKKKKKKKKKKKKK..",
]
def _ellipse_rows(w, h, x0, y0, x1, y1):
    from PIL import ImageDraw, ImageFilter
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).ellipse((x0, y0, x1, y1), 255)
    o = m.filter(ImageFilter.MaxFilter(3))
    rows = []
    for y in range(h):
        r = ""
        for x in range(w):
            r += "G" if m.getpixel((x, y)) else ("K" if o.getpixel((x, y)) else ".")
        rows.append(r)
    return rows

def loaf(awake):
    W_, H_ = 38, 19
    body = [list(r) for r in _ellipse_rows(W_, H_, 9, 5, 36, 18)]
    # white belly line and tabby stripes
    for y in range(H_):
        for x in range(W_):
            if body[y][x] == "G" and y >= 16: body[y][x] = "W"
    for x, y0 in [(18, 6), (22, 6), (26, 6), (30, 7), (33, 9)]:
        for y in range(y0, y0 + 4):
            if body[y][x] == "G": body[y][x] = "D"
    # tail wrapped along the bottom front
    for x in range(14, 30):
        if body[17][x] in "GW": body[17][x] = "G"
        if body[18][x] == "K": pass
    head = HEAD if awake else sleepy(HEAD)
    for y, r in enumerate(head):
        for x, c in enumerate(r):
            if c != "." and y + 1 < H_: body[y + 1][x] = c
    # front paws peeking out under the chin
    for x in (6, 7, 8, 12, 13, 14):
        body[18][x] = "K"
    return ["".join(r) for r in body]

def _old_loaf(awake):
    head = HEAD if awake else sleepy(HEAD)
    rows = []
    # head on the left, body to the right; tail curls round the front
    body = LOAF_BODY
    top = len(head) - len(body) + 1
    for y in range(len(head) + 1):
        hrow = head[y] if y < len(head) else "." * 22
        brow = body[y - top] if y >= top else "." * 33
        merged = []
        for x in range(33):
            hc = hrow[x] if x < len(hrow) else "."
            bc = brow[x] if x < len(brow) else "."
            merged.append(hc if hc != "." else bc)
        rows.append("".join(merged))
    return rows

# --- side walk cycle: body in profile, face turned to the viewer (reads better at small sizes)
SMALL = [  # 14 x 12 face
    ".KK........KK.",
    ".KPK......KPK.",
    ".KGPKKKKKKPGK.",
    "KGGGDGDDGDGGGK",
    "KGGGGDGGDGGGGK",
    "KGGEHGGGGEHGGK",
    "KGGEEGGGGEEGGK",
    "KDGGGWWWWGGGDK",
    "KGPGWWPPWWGPGK",
    ".KGGWWWWWWGGK.",
    "..KKGWWWWGKK..",
    "....KKKKKK....",
]
def _canvas(w, h): return [["."] * w for _ in range(h)]
def _put(cv, rows, ox, oy):
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != "." and 0 <= y + oy < len(cv) and 0 <= x + ox < len(cv[0]):
                cv[y + oy][x + ox] = c

TAILS = [
    ["..KK", ".KGK", "KGK.", "KGK.", "KGGK", ".KGG"],
    [".KK.", "KGGK", "KGK.", "KGK.", ".KGK", "..KG"],
    ["KK..", "KGK.", "KGK.", ".KGK", ".KGG", "..KG"],
]
BODY = [
    "..KKKKKKKKKKKKKKKKK..",
    ".KGGGDGGGDGGGDGGGGGK.",
    "KGGGGDGGGDGGGDGGGGGGK",
    "KGGGGGGGGGGGGGGGGGGGK",
    "KGGGGGGGGGGGWWWWWWGGK",
    ".KGGGGGGGGWWWWWWWWWK.",
    "..KKKKKKKKKKKKKKKKK..",
]
LEG = {  # name -> rows, drawn from y=14
    "down": ["KGGK", "KGGK", "KGGK", "KWWK", "KKKK"],
    "fwd":  ["KGGK", "KGGK", ".KGGK", ".KWWK", ".KKKK"],
    "back": ["KGGK", "KGGK", "KGGK.", "KWWK.", "KKKK."],
    "up":   ["KGGK", "KGGK", "KWWK", "KKKK", "...."],
}
def _legs(frame):
    # back pair x=6,10  front pair x=17,21
    return {
        0: [(5, "down"), (10, "up"), (16, "up"), (22, "down")],
        1: [(6, "down"), (10, "down"), (17, "down"), (21, "down")],
        2: [(6, "up"), (11, "down"), (17, "down"), (21, "up")],
        3: [(6, "down"), (10, "down"), (17, "down"), (21, "down")],
    }[frame]

def cat(frame=1, bob=None, face_dy=0, face_dx=0, legs=None, tail=None, face=None):
    cv = _canvas(32, 22)
    b = (1 if frame in (1, 3) else 0) if bob is None else bob
    _put(cv, TAILS[tail if tail is not None else frame % 3], 1, 4 + b)
    _put(cv, BODY, 5, 8 + b)
    for x, kind in (legs or _legs(frame)):
        _put(cv, LEG[kind], x + 1, 14 + b)
    _put(cv, face or SMALL, 18 + face_dx, 0 + b + face_dy)
    return cv

def walk(frame):
    return ["".join(r) for r in cat(frame)]

def stand():
    return ["".join(r) for r in cat(1, bob=0, legs=[(6, "down"), (10, "down"), (17, "down"), (21, "down")], tail=1)]

HAPPY = list(SMALL)
HAPPY[5] = "KGGGGGGGGGGGGK"
HAPPY[6] = "KGKKGGGGGGKKGK"

def eat(k):
    stand_legs = [(6, "down"), (10, "down"), (17, "down"), (21, "down")]
    cv = cat(1, bob=0, legs=stand_legs, tail=k, face=(HAPPY if k else SMALL), face_dy=6 + k, face_dx=0)
    treat = [(29, 19), (30, 19), (31, 19), (29, 20), (30, 20), (31, 20)]
    for x, y in (treat if k == 0 else treat[1:4]):
        cv[y][x] = "B"
    return ["".join(r) for r in cv]

BALL = [".KKK.", "KYYYK", "KYYYK", "KYYYK", ".KKK."]
def play(k):
    if k == 0:  # crouched, ball on the floor in front
        cv = cat(1, bob=1, legs=[(6, "down"), (10, "down"), (17, "down"), (21, "fwd")], tail=0, face_dy=1)
        _put(cv, BALL, 26, 16)
    else:  # paw lifted, ball rolled a step away
        cv = cat(1, bob=0, legs=[(6, "down"), (10, "down"), (17, "down"), (21, "up")], tail=2)
        _put(cv, BALL, 27, 16)
    return ["".join(r) for r in cv]

SPRITES = {
    "icon": ICON, "sit": SIT, "loaf": loaf(False), "loaf-awake": loaf(True),
    "walk1": walk(0), "walk2": walk(1), "walk3": walk(2), "walk4": walk(3), "stand": stand(),
    "eat1": eat(0), "eat2": eat(1), "play1": play(0), "play2": play(1),
}

if __name__ == "__main__":
    ims = {}
    for n, rows in SPRITES.items():
        im = grid(rows, n); ims[n] = im; im.save(os.path.join(OUT, f"zuzu-{n}.png"))
        print(n, im.size)
    if len(sys.argv) > 1:
        sc = 8; pad = 10
        items = list(ims.values())
        Wt = sum(i.width * sc + pad for i in items) + pad; Ht = max(i.height for i in items) * sc + 2 * pad
        sheet = Image.new("RGBA", (Wt, Ht), (255, 224, 122, 255)); x = pad
        for i in items:
            r = i.resize((i.width * sc, i.height * sc), Image.NEAREST); sheet.paste(r, (x, Ht - pad - r.height), r); x += r.width + pad
        sheet.save(sys.argv[1])
