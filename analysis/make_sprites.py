"""Clean pixel-art Zuzu sprites. Drawn as masks at native size, outlined by dilation, exported 1x PNG + contact sheet."""
from PIL import Image, ImageDraw, ImageFilter
import os, sys
OUT = "/home/claude/paws-and-pantries/assets/sprites"
os.makedirs(OUT, exist_ok=True)
K = (46, 45, 51, 255)     # outline
G = (158, 157, 166, 255)  # body gray
D = (94, 92, 102, 255)    # stripes
W = (247, 246, 243, 255)  # white patches
P = (233, 138, 143, 255)  # pink
E = (168, 184, 92, 255)   # eye green-yellow
Y = (242, 194, 48, 255)   # toy
B = (180, 121, 60, 255)   # treat
T = (0, 0, 0, 0)

class Sprite:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.mask = Image.new("L", (w, h), 0)
        self.m = ImageDraw.Draw(self.mask)
        self.col = Image.new("RGBA", (w, h), T)
        self.c = ImageDraw.Draw(self.col)
        self.top = []  # (x,y,color) drawn last
    # shapes added to silhouette, filled gray
    def ell(self, box): self.m.ellipse(box, 255); self.c.ellipse(box, G)
    def rect(self, box): self.m.rectangle(box, 255); self.c.rectangle(box, G)
    def poly(self, pts): self.m.polygon(pts, 255); self.c.polygon(pts, G)
    def line(self, pts, w=2): self.m.line(pts, 255, w); self.c.line(pts, G, w)
    # color details clipped to silhouette
    def paint(self, fn, color):
        lay = Image.new("RGBA", (self.w, self.h), T); d = ImageDraw.Draw(lay); fn(d, color)
        clip = Image.new("RGBA", (self.w, self.h), T); clip.paste(lay, (0, 0), self.mask)
        self.col.alpha_composite(clip)
    def px(self, x, y, color): self.top.append((x, y, color))
    def render(self):
        dil = self.mask.filter(ImageFilter.MaxFilter(3))
        out = Image.new("RGBA", (self.w, self.h), T)
        o = Image.new("RGBA", (self.w, self.h), K); out.paste(o, (0, 0), dil)
        out.paste(self.col, (0, 0), self.mask)
        for x, y, c in self.top:
            if 0 <= x < self.w and 0 <= y < self.h: out.putpixel((x, y), c)
        return out

def stripes(s, segs):
    s.paint(lambda d, c: [d.line(seg, c, 1) for seg in segs], D)

def face_side(s, hx, hy, eyes_closed=False):
    """hx,hy = head circle center (front-facing right)."""
    # muzzle + chin white
    s.paint(lambda d, c: d.ellipse((hx + 2, hy + 1, hx + 6, hy + 4), c), W)
    if eyes_closed:
        s.px(hx + 1, hy, K); s.px(hx + 2, hy, K)
    else:
        s.px(hx + 1, hy - 1, E); s.px(hx + 2, hy - 1, E); s.px(hx + 2, hy, E); s.px(hx + 1, hy, E); s.px(hx + 2, hy, K)
    s.px(hx + 5, hy + 1, P)  # nose
    s.px(hx + 6, hy + 2, K)  # mouth corner

def head_side(s, hx, hy, lowered=False):
    s.ell((hx - 5, hy - 5, hx + 5, hy + 5))
    s.poly([(hx - 4, hy - 3), (hx - 3, hy - 9), (hx, hy - 4)])      # back ear
    s.poly([(hx + 1, hy - 4), (hx + 3, hy - 9), (hx + 5, hy - 3)])  # front ear
    s.px(hx - 3, hy - 6, P); s.px(hx + 3, hy - 6, P)
    stripes(s, [((hx - 2, hy - 4), (hx - 2, hy - 2)), ((hx, hy - 5), (hx, hy - 3)), ((hx + 2, hy - 4), (hx + 2, hy - 2))])

def cat_side(s, legs, tail="up", head_dy=0, head_dx=0, paw_fwd=False, closed=False):
    """32x24 canvas. legs: list of (x, lift) for back1, back2, front1, front2."""
    bx0, by0, bx1, by1 = 7, 9, 24, 19
    s.ell((bx0, by0, bx1, by1))
    # tail
    if tail == "up":
        s.line([(8, 13), (4, 9), (3, 4)], 2)
    elif tail == "swish":
        s.line([(8, 13), (3, 11), (1, 6)], 2)
    else:
        s.line([(8, 15), (3, 17), (1, 13)], 2)
    # legs
    for i, (x, lift) in enumerate(legs):
        s.rect((x, 16 - lift, x + 2, 21 - lift))
    if paw_fwd:
        s.rect((22, 13, 28, 15))
    hx, hy = 25 + head_dx, 8 + head_dy
    head_side(s, hx, hy)
    # white chest/belly + paws
    s.paint(lambda d, c: d.ellipse((15, 14, 23, 19), c), W)
    s.paint(lambda d, c: [d.rectangle((x, 20 - lift, x + 2, 21 - lift), c) for x, lift in legs], W)
    if paw_fwd: s.paint(lambda d, c: d.rectangle((26, 13, 28, 15), c), W)
    stripes(s, [((11, 10), (11, 13)), ((14, 9), (14, 13)), ((17, 9), (17, 12)), ((20, 9), (20, 11)), ((5, 7), (6, 7)), ((3, 10), (5, 10))])
    face_side(s, hx, hy, closed)
    return s

def walk_frames():
    fr = []
    L = [[(9, 0), (12, 1), (19, 1), (22, 0)], [(10, 1), (12, 0), (18, 0), (22, 1)], [(9, 0), (13, 1), (19, 1), (23, 0)], [(10, 1), (13, 0), (19, 0), (22, 1)]]
    tails = ["up", "swish", "up", "swish"]
    for i, legs in enumerate(L):
        s = Sprite(32, 24); cat_side(s, legs, tails[i], head_dy=(0 if i % 2 == 0 else 1)); fr.append(s.render())
    return fr

def stand():
    s = Sprite(32, 24); cat_side(s, [(9, 0), (12, 0), (19, 0), (22, 0)], "up"); return s.render()

def eat_frames():
    out = []
    for k in range(2):
        s = Sprite(32, 24)
        cat_side(s, [(9, 0), (12, 0), (19, 0), (22, 0)], "down", head_dy=4 + k, head_dx=1, closed=(k == 1))
        for xx in (29,30,31):
            s.px(xx, 20, B); s.px(xx, 21, B)
        if k == 1: s.px(29, 20, T); s.px(29, 21, T)
        out.append(s.render())
    return out

def play_frames():
    out = []
    for k in range(2):
        s = Sprite(32, 24)
        cat_side(s, [(9, 0), (12, 0), (19, 0), (21, 0)], "swish" if k else "up", paw_fwd=(k == 0))
        im = s.render()
        d = ImageDraw.Draw(im)
        ty = 17 if k == 0 else 14
        for yy in range(ty, ty + 5, 2): d.line((28, yy, 31, yy), Y)
        d.line((28, ty + 1, 28, ty + 3), Y)
        out.append(im)
    return out

def sit_front():
    s = Sprite(24, 28)
    s.ell((5, 12, 19, 27))                      # body
    s.line([(18, 24), (22, 26), (23, 21)], 2)   # tail
    s.rect((7, 20, 9, 27)); s.rect((14, 20, 16, 27))  # front legs
    s.ell((5, 2, 19, 15))                       # head
    s.poly([(6, 6), (6, 0), (11, 4)]); s.poly([(13, 4), (18, 0), (18, 6)])
    s.px(7, 2, P); s.px(17, 2, P)
    s.paint(lambda d, c: d.ellipse((8, 9, 16, 14), c), W)       # muzzle
    s.paint(lambda d, c: d.ellipse((8, 16, 16, 26), c), W)      # chest
    s.paint(lambda d, c: [d.rectangle((7, 25, 9, 27), c), d.rectangle((14, 25, 16, 27), c)], W)
    stripes(s, [((10, 3), (10, 6)), ((12, 2), (12, 6)), ((14, 3), (14, 6)), ((5, 15), (5, 19)), ((19, 15), (19, 19)), ((21, 24), (21, 25))])
    for x in (9, 14):
        s.px(x, 8, E); s.px(x + 1, 8, E); s.px(x, 9, E); s.px(x + 1, 9, E); s.px(x + 1, 9, K)
    s.px(12, 11, P); s.px(11, 12, K); s.px(13, 12, K)
    return s.render()

def loaf(closed=True):
    s = Sprite(32, 20)
    s.ell((1, 6, 31, 19))
    s.ell((19, 2, 31, 14))
    s.poly([(20, 6), (21, 0), (24, 4)]); s.poly([(26, 4), (29, 0), (30, 6)])
    s.px(21, 2, P); s.px(29, 2, P)
    s.line([(4, 16), (10, 18), (16, 17)], 2)
    s.paint(lambda d, c: d.ellipse((22, 9, 28, 13), c), W)
    s.paint(lambda d, c: d.rectangle((6, 17, 20, 18), c), W)
    stripes(s, [((6, 8), (6, 12)), ((10, 7), (10, 12)), ((14, 7), (14, 11)), ((23, 4), (23, 6)), ((25, 3), (25, 6)), ((27, 4), (27, 6))])
    if closed:
        s.px(23, 8, K); s.px(24, 8, K); s.px(27, 8, K); s.px(28, 8, K)
    else:
        for x in (23, 27): s.px(x, 7, E); s.px(x + 1, 7, E); s.px(x, 8, E); s.px(x + 1, 8, E); s.px(x + 1, 8, K)
    s.px(25, 10, P); s.px(26, 10, P)
    return s.render()

def icon():
    s = Sprite(20, 16)
    s.ell((2, 3, 17, 15))
    s.poly([(3, 7), (3, 0), (8, 4)]); s.poly([(11, 4), (16, 0), (16, 7)])
    s.px(4, 2, P); s.px(15, 2, P)
    s.paint(lambda d, c: d.ellipse((6, 9, 13, 14), c), W)
    stripes(s, [((8, 4), (8, 6)), ((10, 3), (10, 6)), ((12, 4), (12, 6))])
    for x in (6, 11): s.px(x, 8, E); s.px(x + 1, 8, E); s.px(x + 1, 9, E); s.px(x, 9, E); s.px(x + 1, 9, K)
    s.px(9, 11, P); s.px(10, 11, P); s.px(8, 12, K); s.px(11, 12, K)
    return s.render()

def sheet(items, scale=4):
    pad = 8; W_ = sum(i.width * scale + pad for _, i in items) + pad; H_ = max(i.height for _, i in items) * scale + pad * 2
    im = Image.new("RGBA", (W_, H_), (255, 224, 122, 255)); x = pad
    for name, i in items:
        im.paste(i.resize((i.width * scale, i.height * scale), Image.NEAREST), (x, pad), i.resize((i.width * scale, i.height * scale), Image.NEAREST)); x += i.width * scale + pad
    return im

items = []
for i, f in enumerate(walk_frames()): items.append((f"walk{i+1}", f))
items.append(("stand", stand()))
for i, f in enumerate(eat_frames()): items.append((f"eat{i+1}", f))
for i, f in enumerate(play_frames()): items.append((f"play{i+1}", f))
items.append(("sit", sit_front())); items.append(("loaf", loaf(True))); items.append(("loaf-awake", loaf(False))); items.append(("icon", icon()))
for n, im in items: im.save(f"{OUT}/zuzu-{n}.png")
sheet(items, 5).save("/tmp/claude-0/-home-claude/76654a35-2659-5882-8200-080ad5e77b70/scratchpad/sheet.png")
print([(n, im.size) for n, im in items])
