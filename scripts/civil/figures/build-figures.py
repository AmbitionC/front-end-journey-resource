"""生成考公冲刺速查·图形推理示意图（SVG 源文件）。

用法：python3 build-figures.py <输出目录>
每道题的规律在代码里直接构造（位置序列、对称轴数、黑白异或、区域数、奇点数、交点数），
避免手绘计数出错。SVG 再由 render-figures.mjs 渲染成 PNG。
"""
import math, os, sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
S = 120          # 每个小图边长
GAP = 24
INK = '#1f2328'
FONT = "font-family='WenQuanYi Zen Hei, sans-serif'"


def frame(x, y, body, label=None):
    s = f"<g transform='translate({x},{y})'><rect x='0' y='0' width='{S}' height='{S}' fill='white' stroke='{INK}' stroke-width='2'/>{body}</g>"
    if label:
        s += f"<text x='{x + S / 2}' y='{y + S + 26}' text-anchor='middle' font-size='20' {FONT} fill='{INK}'>{label}</text>"
    return s


def qmark():
    return f"<text x='{S/2}' y='{S/2+16}' text-anchor='middle' font-size='48' {FONT} fill='{INK}'>?</text>"


def sheet(name, rows):
    """rows: [(标题, [(body, label), ...]), ...]"""
    width = max(len(r[1]) for r in rows) * (S + GAP) + GAP
    parts, y = [], 16
    for title, cells in rows:
        parts.append(f"<text x='{GAP}' y='{y + 20}' font-size='20' {FONT} fill='{INK}'>{title}</text>")
        y += 34
        for i, (body, label) in enumerate(cells):
            parts.append(frame(GAP + i * (S + GAP), y, body, label))
        y += S + 44
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' width='{width}' height='{y}' viewBox='0 0 {width} {y}'><rect width='100%' height='100%' fill='white'/>{''.join(parts)}</svg>"
    open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf-8').write(svg)


def poly(pts, fill='none'):
    return f"<polygon points='{' '.join(f'{a:.1f},{b:.1f}' for a, b in pts)}' fill='{fill}' stroke='{INK}' stroke-width='2.5'/>"


def line(a, b):
    return f"<line x1='{a[0]:.1f}' y1='{a[1]:.1f}' x2='{b[0]:.1f}' y2='{b[1]:.1f}' stroke='{INK}' stroke-width='2.5'/>"


def circle(cx, cy, r, fill='none'):
    return f"<circle cx='{cx:.1f}' cy='{cy:.1f}' r='{r:.1f}' fill='{fill}' stroke='{INK}' stroke-width='2.5'/>"


def regular(n, r=40, rot=-90):
    return [(60 + r * math.cos(math.radians(rot + 360 * k / n)), 60 + r * math.sin(math.radians(rot + 360 * k / n))) for k in range(n)]


# ---------- 1. 位置：3×3 宫格，黑点顺时针每次 1 格，白圈逆时针每次 2 格 ----------
RING = [(0, 0), (0, 1), (0, 2), (1, 2), (2, 2), (2, 1), (2, 0), (1, 0)]  # (行, 列)，顺时针


def grid9(black, white):
    c = S / 3
    g = ''.join(line((c * k, 0), (c * k, S)) + line((0, c * k), (S, c * k)) for k in (1, 2))
    (rb, cb), (rw, cw) = RING[black], RING[white]
    g += circle(cb * c + c / 2, rb * c + c / 2, 11, INK)
    g += circle(cw * c + c / 2, rw * c + c / 2, 11, 'white')
    return g


seq = [grid9(t % 8, (5 - 2 * t) % 8) for t in range(4)]
opts = [grid9(4, 5), grid9(4, 3), grid9(3, 5), grid9(4, 1)]  # 正确答案 A
for a, b in [(4, 5), (4, 3), (3, 5), (4, 1)]:
    assert a != b
sheet('civil-sprint-figure-position-v1', [
    ('题干', [(b, None) for b in seq] + [(qmark(), None)]),
    ('选项', [(b, l) for b, l in zip(opts, 'ABCD')]),
])

# ---------- 2. 对称：对称轴条数 1、2、3、4、？ ----------
iso = poly([(60, 14), (84, 104), (36, 104)])                    # 等腰三角形：1 条
rect = poly([(18, 38), (102, 38), (102, 82), (18, 82)])           # 长方形：2 条
tri = poly(regular(3, 46, -90))                                   # 正三角形：3 条
sq = poly(regular(4, 46, -45))                                    # 正方形：4 条
circ = circle(60, 60, 42)                                         # 圆：无数条
pent = poly(regular(5, 44, -90))                                  # 正五边形：5 条
hexa = poly(regular(6, 44, 0))                                    # 正六边形：6 条
para = poly([(20, 90), (42, 30), (100, 30), (78, 90)])            # 平行四边形：0 条
sheet('civil-sprint-figure-symmetry-v1', [
    ('题干', [(iso, None), (rect, None), (tri, None), (sq, None), (qmark(), None)]),
    ('选项', [(circ, 'A'), (pent, 'B'), (hexa, 'C'), (para, 'D')]),
])

# ---------- 3. 黑白：2×2 格，第三幅 = 前两幅去同存异 ----------
def cells(bits):
    h = S / 2
    out = ''
    for i, b in enumerate(bits):
        r, c = divmod(i, 2)
        out += f"<rect x='{c*h}' y='{r*h}' width='{h}' height='{h}' fill='{INK if b else 'white'}' stroke='{INK}' stroke-width='2'/>"
    return out


xor = lambda a, b: [x ^ y for x, y in zip(a, b)]
F1, F2 = [1, 0, 0, 1], [1, 1, 0, 0]
F4, F5 = [0, 1, 1, 0], [0, 1, 0, 1]
assert xor(F1, F2) == [0, 1, 0, 1]
ans = xor(F4, F5)
assert ans == [0, 0, 1, 1]
sheet('civil-sprint-figure-blackwhite-v1', [
    ('第一组', [(cells(F1), None), (cells(F2), None), (cells(xor(F1, F2)), None)]),
    ('第二组', [(cells(F4), None), (cells(F5), None), (qmark(), None)]),
    ('选项', [(cells(ans), 'A'), (cells([a | b for a, b in zip(F4, F5)]), 'B'),
             (cells([a & b for a, b in zip(F4, F5)]), 'C'), (cells([1 - a for a in ans]), 'D')]),
])

# ---------- 4. 数量·面：封闭区域数 1、2、3、4、？ ----------
c1 = circle(60, 60, 42)                                                    # 1
s2 = poly(regular(4, 46, -45)) + line((27.5, 27.5), (92.5, 92.5))          # 2
hw = math.sqrt(42 ** 2 - 15 ** 2)
c3 = circle(60, 60, 42) + line((60 - hw, 45), (60 + hw, 45)) + line((60 - hw, 75), (60 + hw, 75))  # 3（两条平行弦，端点落在圆上）
s4 = poly(regular(4, 46, -45)) + line((27.5, 27.5), (92.5, 92.5)) + line((92.5, 27.5), (27.5, 92.5))  # 4
pa = poly(regular(5, 46, -90))
pv = regular(5, 46, -90)
optA = pa + line(pv[0], pv[2]) + line(pv[0], pv[3])                        # 3
optB = circle(60, 60, 44) + line((16, 60), (104, 60)) + line((60, 16), (60, 104)) + circle(80, 40, 9)  # 5
optC = s4 + line((60, 27.5), (60, 92.5))                                    # 6
optD = poly([(60, 18), (102, 98), (18, 98)]) + poly([(39, 58), (81, 58), (60, 98)])  # 4
sheet('civil-sprint-figure-regions-v1', [
    ('题干', [(c1, None), (s2, None), (c3, None), (s4, None), (qmark(), None)]),
    ('选项', [(optA, 'A'), (optB, 'B'), (optC, 'C'), (optD, 'D')]),
])

# ---------- 5. 数量·笔画：哪个能一笔画成 ----------
sqA = poly(regular(4, 46, -45))
tl, tr, br, bl = (27.5, 27.5), (92.5, 27.5), (92.5, 92.5), (27.5, 92.5)
A = sqA + line(tl, br) + line(tr, bl)                                      # 4 个奇点
hs = [(27.5, 50), (92.5, 50), (92.5, 108), (27.5, 108)]
B = poly(hs) + poly([(27.5, 50), (60, 14), (92.5, 50)]) + line(hs[0], hs[2]) + line(hs[1], hs[3])  # 2 个奇点
C = circle(36, 60, 22) + circle(86, 60, 22)                                 # 不连通
D = line((60, 18), (60, 102)) + line((18, 60), (102, 60))                   # 4 个奇点
sheet('civil-sprint-figure-stroke-v1', [
    ('选项', [(A, 'A'), (B, 'B'), (C, 'C'), (D, 'D')]),
])

# ---------- 6. 数量·交点：直线与圆的交点数 1、2、3、4、？ ----------
def cl(lines):
    out = circle(60, 60, 34)
    for a, b in lines:
        out += line(a, b)
    return out


tangent_top = ((12, 26), (108, 26))     # 与圆相切（y = 60 - 34）
tangent_left = ((26, 12), (26, 108))    # x = 60 - 34
tangent_right = ((94, 12), (94, 108))
# v2：坐标由穷举挑出——交点数不变（直线与圆 1/2/3/4，选项 5/6/2/4；全部交点 7/9/2/6），
# 同一幅图里任意两个交点相距 ≥ 8 个单位，且线与线的交点不落在线段两端。
# v1 里 B 三线近乎共点、A/D 的交点贴着切点或圆周，读者容易数错。
sec1 = ((10, 84), (110, 84))
sec2 = ((90, 10), (65, 110))
sec3 = ((10, 10), (110, 95))
seq = [cl([tangent_top]), cl([sec1]), cl([sec1, tangent_top]), cl([sec1, sec2])]
opts = [cl([sec1, sec2, tangent_top]), cl([sec1, sec2, sec3]), cl([tangent_left, tangent_right]), cl([sec1, tangent_left, tangent_right])]
sheet('civil-sprint-figure-intersections-v2', [
    ('题干', [(b, None) for b in seq] + [(qmark(), None)]),
    ('选项', [(b, l) for b, l in zip(opts, 'ABCD')]),
])


# =====================================================================
# 第二批（2026-11-17）：旋转翻转、遍历、线条去同存异、黑白运算、曲直、对称轴方向、分组分类
# 图元用相对小图中心 (60,60) 的坐标描述，便于做旋转 / 翻转，并用集合比较确认选项互不相同。
# =====================================================================

def tf(prims, ang=0, flip=None):
    """先翻转（'h' 左右 / 'v' 上下），再绕中心顺时针旋转 ang 度（SVG 坐标系 y 向下）。"""
    a = math.radians(ang)
    def p(x, y):
        if flip == 'h':
            x = -x
        elif flip == 'v':
            y = -y
        return (x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a))
    out = []
    for pr in prims:
        if pr[0] == 'poly':
            out.append(('poly', [p(*q) for q in pr[1]], pr[2]))
        elif pr[0] == 'dot':
            out.append(('dot', p(*pr[1]), pr[2], pr[3]))
        elif pr[0] == 'seg':
            out.append(('seg', p(*pr[1]), p(*pr[2])))
    return out


def draw(prims):
    out = ''
    for pr in prims:
        if pr[0] == 'poly':
            out += poly([(60 + x, 60 + y) for x, y in pr[1]], pr[2])
        elif pr[0] == 'dot':
            out += circle(60 + pr[1][0], 60 + pr[1][1], pr[2], pr[3])
        elif pr[0] == 'seg':
            out += line((60 + pr[1][0], 60 + pr[1][1]), (60 + pr[2][0], 60 + pr[2][1]))
    return out


def key(prims):
    r = lambda q: (round(q[0], 1) + 0.0, round(q[1], 1) + 0.0)
    ks = []
    for pr in prims:
        if pr[0] == 'poly':
            ks.append(('poly', frozenset(r(q) for q in pr[1]), pr[2]))
        elif pr[0] == 'dot':
            ks.append(('dot', r(pr[1]), pr[2], pr[3]))
        else:
            ks.append(('seg', frozenset([r(pr[1]), r(pr[2])])))
    return frozenset(ks)


def distinct(*figs):
    ks = [key(f) for f in figs]
    assert len(set(ks)) == len(ks), '选项或题干出现重复图形'


# ---------- 7. 旋转：旗子每次绕中心顺时针转 45° ----------
FLAG = [('seg', (0, 0), (0, -44)), ('poly', [(0, -44), (24, -36), (0, -28)], INK), ('dot', (0, 0), 5, INK)]
seq = [tf(FLAG, 45 * t) for t in range(4)]
ans = tf(FLAG, 180)
opts = [tf(FLAG, 225), ans, tf(FLAG, 180, 'h'), tf(FLAG, 270)]       # 正确答案 B
distinct(*seq, *opts)
sheet('civil-sprint-figure-rotate-v1', [
    ('题干', [(draw(f), None) for f in seq] + [(qmark(), None)]),
    ('选项', [(draw(f), l) for f, l in zip(opts, 'ABCD')]),
])

# ---------- 8. 翻转 + 旋转：每组第二幅 = 第一幅左右翻转，第三幅 = 第二幅顺时针转 90° ----------
G = [('poly', [(-36, -40), (-16, -40), (-16, 16), (22, 16), (22, 36), (-36, 36)], 'none'), ('dot', (20, -22), 9, INK)]
H = [('poly', [(-38, -38), (-38, 36), (24, 36)], 'none'), ('dot', (24, -22), 9, INK), ('seg', (-38, -6), (-4, -6))]
g2, g3 = tf(G, 0, 'h'), tf(tf(G, 0, 'h'), 90)
h2 = tf(H, 0, 'h')
ans = tf(h2, 90)
opts = [tf(h2, 270), tf(h2, 180), tf(H, 90), ans]                     # 正确答案 D
distinct(G, g2, g3, H, h2, *opts)
sheet('civil-sprint-figure-flip-v1', [
    ('第一组', [(draw(G), None), (draw(g2), None), (draw(g3), None)]),
    ('第二组', [(draw(H), None), (draw(h2), None), (qmark(), None)]),
    ('选项', [(draw(f), l) for f, l in zip(opts, 'ABCD')]),
])

# ---------- 9. 遍历：九宫格每行每列形状各出现一次，每行每列个数 1、2、3 各出现一次 ----------
def shp(kind, n):
    xs = {1: [0], 2: [-22, 22], 3: [-34, 0, 34]}[n]
    out = []
    for x in xs:
        if kind == '圆':
            out.append(('dot', (x, 0), 14, 'none'))
        elif kind == '三角':
            out.append(('poly', [(x, -15), (x + 15, 12), (x - 15, 12)], 'none'))
        else:
            out.append(('poly', [(x - 13, -13), (x + 13, -13), (x + 13, 13), (x - 13, 13)], 'none'))
    return out


GRID = [[('圆', 1), ('三角', 2), ('方', 3)],
        [('三角', 3), ('方', 1), ('圆', 2)],
        [('方', 2), ('圆', 3), None]]
missing = ('三角', 1)
full = [row[:] for row in GRID]
full[2][2] = missing
for i in range(3):
    assert len({full[i][j][0] for j in range(3)}) == 3 and len({full[j][i][0] for j in range(3)}) == 3
    assert {full[i][j][1] for j in range(3)} == {1, 2, 3} == {full[j][i][1] for j in range(3)}
optsk = [('三角', 2), ('方', 1), missing, ('圆', 1)]                    # 正确答案 C
assert optsk.count(missing) == 1
sheet('civil-sprint-figure-traverse-v1', [
    ('第一行', [(draw(shp(*c)), None) for c in GRID[0]]),
    ('第二行', [(draw(shp(*c)), None) for c in GRID[1]]),
    ('第三行', [(draw(shp(*c)), None) for c in GRID[2][:2]] + [(qmark(), None)]),
    ('选项', [(draw(shp(*c)), l) for c, l in zip(optsk, 'ABCD')]),
])

# ---------- 10. 线条去同存异：第三幅 = 前两幅相同的线去掉、不同的线保留 ----------
L = {'上': ((-40, -40), (40, -40)), '下': ((-40, 40), (40, 40)), '左': ((-40, -40), (-40, 40)), '右': ((40, -40), (40, 40)),
     '竖': ((0, -40), (0, 40)), '横': ((-40, 0), (40, 0)), '撇': ((40, -40), (-40, 40)), '捺': ((-40, -40), (40, 40))}


def lines(names):
    return [('dot', (x, y), 3, INK) for x in (-40, 0, 40) for y in (-40, 0, 40)] + [('seg', *L[n]) for n in sorted(names)]


A1, A2 = {'上', '左', '捺', '横'}, {'上', '右', '捺', '竖'}
B1, B2 = {'下', '左', '撇', '竖'}, {'下', '上', '捺', '竖'}
assert A1 ^ A2 not in (A1 | A2, A1 & A2)
ans = B1 ^ B2
optsl = [ans, B1 | B2, B1 & B2, ans | {'下'}]                           # 正确答案 A
assert len({frozenset(o) for o in optsl}) == 4
sheet('civil-sprint-figure-lines-xor-v1', [
    ('第一组', [(draw(lines(A1)), None), (draw(lines(A2)), None), (draw(lines(A1 ^ A2)), None)]),
    ('第二组', [(draw(lines(B1)), None), (draw(lines(B2)), None), (qmark(), None)]),
    ('选项', [(draw(lines(o)), l) for o, l in zip(optsl, 'ABCD')]),
])

# ---------- 11. 黑白运算：黑+黑=白，白+白=黑，黑+白=黑 ----------
def dots9(bits):
    return [('dot', (x, y), 13, INK if bits[3 * r + c] else 'white')
            for r, y in enumerate((-36, 0, 36)) for c, x in enumerate((-36, 0, 36))]


op = lambda a, b: [0 if (x and y) else 1 for x, y in zip(a, b)]  # 只有两黑相加才得白
P1 = [1, 1, 0, 0, 1, 0, 1, 0, 0]
P2 = [1, 0, 1, 0, 1, 1, 0, 0, 0]
pairs = {(x, y) for x, y in zip(P1, P2)}
assert pairs == {(0, 0), (0, 1), (1, 0), (1, 1)}   # 第一组把四种组合都演示到
Q1 = [0, 1, 1, 1, 0, 0, 0, 1, 0]
Q2 = [1, 1, 0, 1, 0, 1, 0, 0, 1]
ans = op(Q1, Q2)
optsb = [[x ^ y for x, y in zip(Q1, Q2)], [x | y for x, y in zip(Q1, Q2)], ans, [1 - v for v in ans]]  # 正确答案 C
assert len({tuple(o) for o in optsb}) == 4
sheet('civil-sprint-figure-bw-op-v1', [
    ('第一组', [(draw(dots9(P1)), None), (draw(dots9(P2)), None), (draw(dots9(op(P1, P2))), None)]),
    ('第二组', [(draw(dots9(Q1)), None), (draw(dots9(Q2)), None), (qmark(), None)]),
    ('选项', [(draw(dots9(o)), l) for o, l in zip(optsb, 'ABCD')]),
])


# ---------- 12. 曲直：全直、全曲交替 ----------
def arc_path(d):
    return f"<path d='{d}' fill='none' stroke='{INK}' stroke-width='2.5'/>"


straight1 = poly(regular(3, 44, -90)) + line((60, 16), (60, 82))
curve1 = circle(60, 60, 40) + circle(60, 60, 18)
straight2 = poly([(18, 30), (102, 30), (102, 90), (18, 90)]) + line((18, 30), (60, 90)) + line((102, 30), (60, 90))
curve2 = arc_path('M 20 60 A 40 40 0 0 1 100 60') + arc_path('M 20 60 A 20 20 0 0 0 60 60 A 20 20 0 0 1 100 60')
pv = regular(5, 44, -90)
optA = circle(60, 60, 40) + line((20, 60), (100, 60))                         # 曲直混合
optB = poly(pv) + line(pv[0], pv[2]) + line(pv[0], pv[3])                      # 全直 ✔
optC = arc_path('M 18 76 A 42 42 0 0 1 102 76') + line((18, 76), (102, 76))   # 曲直混合
optD = circle(42, 60, 24) + circle(78, 60, 24)                                 # 全曲
sheet('civil-sprint-figure-curve-v1', [
    ('题干', [(straight1, None), (curve1, None), (straight2, None), (curve2, None), (qmark(), None)]),
    ('选项', [(optA, 'A'), (optB, 'B'), (optC, 'C'), (optD, 'D')]),
])


# ---------- 13. 对称轴方向：每幅只有 1 条对称轴，轴每次顺时针转 45° ----------
def centroid(pts):
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def axes(pts):
    """返回多边形顶点集的全部对称轴方向（SVG 数学角度，0=横，90=竖，45=\\，135=/）。"""
    cx, cy = centroid(pts)
    vs = {(round(x - cx, 1) + 0.0, round(y - cy, 1) + 0.0) for x, y in pts}
    found = []
    for k in range(360):
        t = math.radians(k / 2)
        c2, s2 = math.cos(2 * t), math.sin(2 * t)
        img = {(round(x * c2 + y * s2, 1) + 0.0, round(x * s2 - y * c2, 1) + 0.0) for x, y in vs}
        if img == vs:
            found.append(k / 2)
    return found


def central(pts):
    cx, cy = centroid(pts)
    vs = {(round(x - cx, 1) + 0.0, round(y - cy, 1) + 0.0) for x, y in pts}
    return {(round(-x, 1) + 0.0, round(-y, 1) + 0.0) for x, y in vs} == vs


def rot(pts, ang):
    a = math.radians(ang)
    return [(x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a)) for x, y in pts]


iso_t = [(0, -42), (26, 34), (-26, 34)]                                 # 等腰三角形，轴竖直
kite = [(0, -44), (24, -12), (0, 40), (-24, -12)]                        # 筝形，轴竖直
trap = [(-40, 24), (40, 24), (20, -24), (-20, -24)]                      # 等腰梯形，轴竖直
arrow = [(0, -42), (30, -8), (12, -8), (12, 36), (-12, 36), (-12, -8), (-30, -8)]  # 箭头，轴竖直
house = [(0, -40), (34, -10), (34, 36), (-34, 36), (-34, -10)]          # 房子形，轴竖直
para4 = [(-40, 26), (-14, -26), (40, -26), (14, 26)]                     # 平行四边形，无轴
stem = [rot(iso_t, 0), rot(kite, 45), rot(trap, 90), rot(arrow, 135)]
exp = [90, 135, 0, 45]
for s, e in zip(stem, exp):
    assert axes(s) == [e], (axes(s), e)
optsp = [rot(iso_t, 90), rot(arrow, 45), para4, house]                   # 正确答案 D
assert axes(optsp[3]) == [90] and axes(optsp[2]) == [] and axes(optsp[0]) == [0] and axes(optsp[1]) == [135]
P = lambda pts: draw([('poly', pts, 'none')])
sheet('civil-sprint-figure-axis-dir-v1', [
    ('题干', [(P(s), None) for s in stem] + [(qmark(), None)]),
    ('选项', [(P(s), l) for s, l in zip(optsp, 'ABCD')]),
])


# ---------- 14–16. 分组分类：六幅图分成两组 ----------
def graph(segs):
    """线段集合 → 平面图：在所有交点处切开，返回 (顶点数, 边数, 连通块数, 奇点数)。"""
    def inter(p, q, r, s):
        d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0])
        if abs(d) < 1e-9:
            return None
        t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d
        u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d
        if -1e-9 <= t <= 1 + 1e-9 and -1e-9 <= u <= 1 + 1e-9:
            return (p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]))
        return None
    R = lambda q: (round(q[0], 3) + 0.0, round(q[1], 3) + 0.0)
    edges, verts = set(), set()
    for i, (p, q) in enumerate(segs):
        pts = [p, q]
        for j, (r, s) in enumerate(segs):
            if i != j:
                x = inter(p, q, r, s)
                if x:
                    pts.append(x)
                for e in (r, s):   # 另一条线段的端点落在本线段上
                    cr = (q[0] - p[0]) * (e[1] - p[1]) - (q[1] - p[1]) * (e[0] - p[0])
                    if abs(cr) < 1e-6 and min(p[0], q[0]) - 1e-6 <= e[0] <= max(p[0], q[0]) + 1e-6 and min(p[1], q[1]) - 1e-6 <= e[1] <= max(p[1], q[1]) + 1e-6:
                        pts.append(e)
        L2 = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2
        pts = sorted({R(x) for x in pts}, key=lambda x: ((x[0] - p[0]) * (q[0] - p[0]) + (x[1] - p[1]) * (q[1] - p[1])) / L2)
        verts.update(pts)
        for a, b in zip(pts, pts[1:]):
            edges.add(frozenset([a, b]))
    parent = {v: v for v in verts}
    def f(v):
        while parent[v] != v:
            v = parent[v]
        return v
    deg = {v: 0 for v in verts}
    for e in edges:
        a, b = tuple(e)
        deg[a] += 1
        deg[b] += 1
        parent[f(a)] = f(b)
    comps = len({f(v) for v in verts})
    return len(verts), len(edges), comps, sum(1 for v in verts if deg[v] % 2)


def faces(segs):
    V, E, C, _ = graph(segs)
    return E - V + C


def strokes(segs):
    _, _, C, odd = graph(segs)
    return max(odd // 2, C)


def closed(pts):
    return [(pts[i], pts[(i + 1) % len(pts)]) for i in range(len(pts))]


def segdraw(segs):
    return ''.join(line((60 + a[0], 60 + a[1]), (60 + b[0], 60 + b[1])) for a, b in segs)


NUM = '①②③④⑤⑥'
SQ = [(-38, -38), (38, -38), (38, 38), (-38, 38)]
TR = [(0, -40), (40, 34), (-40, 34)]
PEN = [(x - 60, y - 60) for x, y in regular(5, 44, -90)]
HEX = [(x - 60, y - 60) for x, y in regular(6, 42, 0)]


def partition_options(groups, order):
    """groups: 六个图的组别（0/1）；order: 4 个选项里正确答案的位置。返回选项文字列表。"""
    first = [i for i in range(6) if groups[i] == groups[0]]
    import itertools
    cands = [c for c in itertools.combinations(range(6), 3) if 0 in c and list(c) != first]
    picks = [cands[k] for k in (1, 4, 7)]
    opts = [tuple(x) for x in picks]
    opts.insert(order, tuple(first))
    fmt = lambda c: ''.join(NUM[i] for i in c) + '，' + ''.join(NUM[i] for i in range(6) if i not in c)
    return opts, [fmt(c) for c in opts]


def check_partition(values, correct_first):
    """values 是某一种量的取值；返回按该量能分出的「含①的三元组」（若能均分为两类）。"""
    a = [i for i in range(6) if values[i] == values[0]]
    return tuple(a) if len(a) == 3 and len(set(values)) == 2 else None


# 14. 按封闭区域数分：2 个面 / 3 个面（外形混搭，避免按外形分）
C1 = [
    closed(SQ) + [(SQ[0], SQ[2])],                                         # 正方形 + 对角线
    closed(SQ) + [((-13, -38), (-13, 38)), ((13, -38), (13, 38))],          # 正方形 + 两条竖线
    closed(TR) + [((0, -40), (0, 34))],                                     # 三角形 + 中线
    closed(PEN) + [(PEN[0], PEN[2]), (PEN[0], PEN[3])],                    # 五边形 + 同一顶点两条对角线
    closed(HEX) + [(HEX[0], HEX[3])],                                       # 六边形 + 一条长对角线
    closed(TR) + [((0, -40), (-14, 34)), ((0, -40), (14, 34))],             # 三角形 + 顶点两条线
]
fv = [faces(s) for s in C1]
assert fv == [2, 3, 2, 3, 2, 3], fv
grp = [0 if v == 2 else 1 for v in fv]
opts14, txt14 = partition_options(grp, 1)                                # 正确答案 B
sv = [strokes(s) for s in C1]
assert check_partition(sv, None) not in opts14, sv                       # 按笔画分不出任何一个选项
open(os.path.join(OUT, 'civil-sprint-figure-group-faces-v1.txt'), 'w').write('\n'.join(f'{l}. {t}' for l, t in zip('ABCD', txt14)) + '\n')
sheet('civil-sprint-figure-group-faces-v1', [
    ('', [(segdraw(s), NUM[i]) for i, s in enumerate(C1)]),
])

# 15. 按笔画分：一笔画 / 两笔画
house_env = closed(SQ) + [(SQ[0], SQ[2]), (SQ[1], SQ[3])]  # 正方形 + 两条对角线：4 个奇点
star = [(PEN[i], PEN[(i + 2) % 5]) for i in range(5)]       # 五角星：0 个奇点
C2 = [
    star,
    house_env,
    closed(SQ) + [((-38, 0), (38, 0)), ((0, -38), (0, 38))],                # 田字：4 个奇点
    closed(TR) + [((0, -40), (0, 34))],                                     # 三角形 + 中线：2 个奇点
    closed(SQ) + [((-38, -38), (-50, -50)), ((38, 38), (50, 50))],          # 正方形两角各伸出一段：4 个奇点
    closed(HEX) + [(HEX[1], HEX[4]), (HEX[2], HEX[5])],                     # 六边形 + 两条交叉对角线：4 个奇点，交点为偶点
]
sv = [strokes(s) for s in C2]
assert sv == [1, 2, 2, 1, 2, 2], sv
# 调整成三对三：把第 6 幅换成一笔画图形
C2[5] = closed(HEX) + [(HEX[0], HEX[3])]                                # 六边形 + 一条长对角线：2 个奇点
sv = [strokes(s) for s in C2]
assert sv == [1, 2, 2, 1, 2, 1], sv
grp = [0 if v == 1 else 1 for v in sv]
opts15, txt15 = partition_options(grp, 0)                                # 正确答案 A
fv = [faces(s) for s in C2]
assert check_partition(fv, None) not in opts15, fv
open(os.path.join(OUT, 'civil-sprint-figure-group-strokes-v1.txt'), 'w').write('\n'.join(f'{l}. {t}' for l, t in zip('ABCD', txt15)) + '\n')
sheet('civil-sprint-figure-group-strokes-v1', [
    ('', [(segdraw(s), NUM[i]) for i, s in enumerate(C2)]),
])

# 16. 按对称性分：只是轴对称 / 只是中心对称
zt = [(-40, -30), (8, -30), (8, -6), (40, -6), (40, 30), (-8, 30), (-8, 6), (-40, 6)]  # Z 形
hx = [(-40, -10), (-5, -38), (38, -24), (40, 10), (5, 38), (-38, 24)]   # 不规则中心对称六边形
C3 = [trap, para4, zt, PEN, arrow, hx]
ax = [len(axes(p)) > 0 for p in C3]
ce = [central(p) for p in C3]
assert ax == [True, False, False, True, True, False] and ce == [False, True, True, False, False, True], (ax, ce)
grp = [0 if a else 1 for a in ax]
opts16, txt16 = partition_options(grp, 3)                                # 正确答案 D
open(os.path.join(OUT, 'civil-sprint-figure-group-symmetry-v1.txt'), 'w').write('\n'.join(f'{l}. {t}' for l, t in zip('ABCD', txt16)) + '\n')
sheet('civil-sprint-figure-group-symmetry-v1', [
    ('', [(P(p), NUM[i]) for i, p in enumerate(C3)]),
])
print('ok')
