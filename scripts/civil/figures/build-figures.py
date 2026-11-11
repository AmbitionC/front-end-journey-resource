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
print('ok')
