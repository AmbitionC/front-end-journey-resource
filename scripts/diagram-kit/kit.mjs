// Agent Journey 配图组件库：所有知识库配图都从这里取颜色、字号和图元，
// 保证深浅两套主题、全站一个风格。用法见 .claude/skills/aj-diagrams/SKILL.md。

export const CANVAS_WIDTH = 960; // 文章正文最宽约 820px，960 宽的画布在桌面上缩放约 0.85
export const MIN_FONT = 15; // 渲染检查的下限：缩放后桌面上仍 ≥ 12.8px

// 色值取自 front-end-journey/src/styles/journey.css 的 --aj-* 令牌。
export const THEMES = {
  dark: {
    name: 'dark',
    page: '#000000', bg: '#111214', box: '#191b1d', boxStrong: '#222527',
    text: '#f2f3f4', sec: '#b2b5b9', muted: '#858a91',
    line: 'rgba(255,255,255,0.30)', faint: 'rgba(255,255,255,0.13)',
    accent: '#c1d4c8', ok: '#87bf9f', bad: '#e99497', warn: '#d6b36a', info: '#92b6cf',
    onAccent: '#101b15', tint: 0.12,
  },
  light: {
    name: 'light',
    page: '#e8ebe7', bg: '#f6f7f4', box: '#ffffff', boxStrong: '#edefeb',
    text: '#1b1e1c', sec: '#3f4642', muted: '#646c67',
    line: 'rgba(30,45,37,0.34)', faint: 'rgba(30,45,37,0.13)',
    accent: '#4a7862', ok: '#2f8a4e', bad: '#b4232f', warn: '#a35a00', info: '#1f6aa8',
    onAccent: '#ffffff', tint: 0.08,
  },
};

export const SIZE = { title: 24, heading: 19, body: 17, label: 16, note: 15 };
export const FONT = "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif";
export const MONO = "'JetBrains Mono','SFMono-Regular',Menlo,Consolas,'Noto Sans SC',monospace";
const TONES = ['line', 'accent', 'ok', 'bad', 'warn', 'info', 'muted'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;

function hexToRgba(hex, a) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function createKit(theme) {
  const t = typeof theme === 'string' ? THEMES[theme] : theme;
  if (!t) throw new Error(`未知主题：${theme}`);
  const color = (tone) => (tone === 'default' || !tone ? t.line : t[tone] ?? tone);
  const fill = (tone) => (tone === 'default' || !tone ? t.box : hexToRgba(t[tone], t.tint));
  const textTone = (tone) => (tone === 'default' || !tone ? t.text : tone === 'muted' ? t.muted : t[tone] ?? t.text);
  let uid = 0;

  const k = { t, SIZE, color };

  /** 单行或多行文字。lines 用 \n 分隔。 */
  k.text = ({ x, y, text, size = 'body', tone, anchor = 'start', weight = 400, mono = false, box, lineGap = 1.35 }) => {
    const px = typeof size === 'number' ? size : SIZE[size];
    const lines = String(text).split('\n');
    const c = tone ? (t[tone] ?? tone) : t.text;
    const tsp = lines.map((l, i) => `<tspan x="${r1(x)}" dy="${i ? r1(px * lineGap) : 0}">${esc(l)}</tspan>`).join('');
    return `<text x="${r1(x)}" y="${r1(y)}" font-size="${px}" font-weight="${weight}" fill="${c}" text-anchor="${anchor}"${mono ? ` font-family="${MONO}"` : ''}${box ? ` data-box="${box}"` : ''}>${tsp}</text>`;
  };

  /** 圆角方框：title 必填，sub 可选（小一号、次要色）。tone 决定描边和浅色底。 */
  k.box = ({ x, y, w, h, title, sub, tone = 'default', strong = false, titleSize = 'heading', align = 'center', dashed = false }) => {
    const id = `b${++uid}`;
    const stroke = color(tone);
    const bg = strong ? t.boxStrong : fill(tone);
    let s = `<rect data-box-id="${id}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="10" fill="${bg}" stroke="${stroke}" stroke-width="1.5"${dashed ? ' stroke-dasharray="6 5"' : ''}/>`;
    const tp = SIZE[titleSize] ?? titleSize;
    const lp = SIZE.label;
    const tl = String(title).split('\n').length;
    const sl = sub ? String(sub).split('\n').length : 0;
    // 字形框按 Noto Sans SC 的 ascent 1.16em / descent 0.29em 估算，多行行距 1.35em
    const titleH = (tl - 1) * tp * 1.35 + tp * 1.45;
    const subH = sub ? 4 + (sl - 1) * lp * 1.35 + lp * 1.45 : 0;
    const top = y + (h - titleH - subH) / 2;
    const tx = align === 'center' ? x + w / 2 : x + 16;
    const anchor = align === 'center' ? 'middle' : 'start';
    s += k.text({ x: tx, y: top + tp * 1.16, text: title, size: tp, tone: tone === 'default' ? undefined : textTone(tone), weight: 600, anchor, box: id });
    if (sub) s += k.text({ x: tx, y: top + titleH + 4 + lp * 1.16, text: sub, size: 'label', tone: 'muted', anchor, box: id });
    return s;
  };

  /** 折线箭头。points: [[x,y],...]；label 写在 labelAt（默认第一段中点）。 */
  k.arrow = ({ points, tone = 'line', dashed = false, label, labelAt, labelAnchor = 'middle', head = true, both = false, width = 1.7 }) => {
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])},${r1(p[1])}`).join(' ');
    const m = `m-${TONES.includes(tone) ? tone : 'line'}`;
    let s = `<path d="${d}" fill="none" stroke="${color(tone)}" stroke-width="${width}"${dashed ? ' stroke-dasharray="6 5"' : ''}${head ? ` marker-end="url(#${m})"` : ''}${both ? ` marker-start="url(#${m})"` : ''} stroke-linejoin="round"/>`;
    if (label) {
      const [a, b] = [points[0], points[1]];
      const at = labelAt ?? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 8];
      s += k.text({ x: at[0], y: at[1], text: label, size: 'label', tone: tone === 'line' ? 'muted' : tone, anchor: labelAnchor });
    }
    return s;
  };

  /** 虚线分组框，label 写在左上角框内。 */
  k.frame = ({ x, y, w, h, label, tone = 'faint', labelPos = 'top' }) => {
    let s = `<rect data-frame="1" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="14" fill="none" stroke="${t[tone] ?? tone}" stroke-width="1.4" stroke-dasharray="6 6"/>`;
    if (label) s += k.text({ x: x + 16, y: labelPos === 'top' ? y + 26 : y + h - 14, text: label, size: 'label', tone: 'muted' });
    return s;
  };

  /** 实线面板：内放图表或多个元素，label 写在左上角。 */
  k.panel = ({ x, y, w, h, label, tone = 'default' }) => {
    const id = `p${++uid}`;
    let s = `<rect data-panel="1" data-box-id="${id}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="10" fill="${fill(tone)}" stroke="${color(tone)}" stroke-width="1.5"/>`;
    if (label) s += k.text({ x: x + 14, y: y + 26, text: label, size: 'label', tone: 'muted', box: id });
    return s;
  };

  /** 圆形节点（树、图）。badge 是右上角的小序号。 */
  k.node = ({ x, y, label, r = 22, tone = 'accent', badge, badgeTone = 'accent', filled = false }) => {
    let s = `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${filled ? fill(tone) : t.box}" stroke="${color(tone)}" stroke-width="1.8"/>`;
    s += k.text({ x, y: y + 6, text: label, size: 'heading', weight: 600, anchor: 'middle' });
    if (badge !== undefined) {
      const bx = x + r * 0.9, by = y - r * 0.82;
      s += `<circle cx="${r1(bx)}" cy="${r1(by)}" r="11.5" fill="${color(badgeTone)}"/>`;
      s += `<text x="${r1(bx)}" y="${r1(by + 5)}" font-size="${SIZE.note}" font-weight="700" fill="${t.onAccent}" text-anchor="middle" data-badge="1">${esc(badge)}</text>`;
    }
    return s;
  };

  /** 两个圆节点之间的边，自动裁到圆周。 */
  k.edge = ({ from, to, r = 22, tone = 'line', dashed = false, arrow = false, width }) => {
    const [x1, y1] = from, [x2, y2] = to;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const pad = arrow ? r + 3 : r;
    return k.arrow({ points: [[x1 + ux * r, y1 + uy * r], [x2 - ux * pad, y2 - uy * pad]], tone, dashed, head: arrow, width: width ?? (tone === 'line' ? 1.4 : 2.2) });
  };

  /** 数组格子。values 为字符串/数字；mark: {下标: tone}；pointers: [{i, label, tone, side:'top'|'bottom'}]。 */
  k.cells = ({ x, y, values, cw = 52, ch = 46, mark = {}, indices = true, pointers = [], dim = [], textSize = 'body' }) => {
    let s = '';
    values.forEach((v, i) => {
      const tone = mark[i];
      const cx = x + i * cw;
      const id = `c${++uid}`;
      s += `<rect data-box-id="${id}" x="${r1(cx)}" y="${r1(y)}" width="${cw}" height="${ch}" fill="${tone ? fill(tone) : t.box}" stroke="${tone ? color(tone) : t.line}" stroke-width="${tone ? 1.8 : 1.2}"/>`;
      s += k.text({ x: cx + cw / 2, y: y + ch / 2 + 6, text: v, size: textSize, anchor: 'middle', weight: 600, box: id, tone: dim.includes(i) ? 'muted' : (tone ? textTone(tone) : undefined) });
      if (indices) s += k.text({ x: cx + cw / 2, y: y - 10, text: i, size: 'note', anchor: 'middle', tone: 'muted' });
    });
    for (const p of pointers) {
      const px = x + p.i * cw + cw / 2;
      const top = (p.side ?? 'bottom') === 'top';
      const y0 = top ? y - 58 : y + ch + 52, y1 = top ? y - 26 : y + ch + 8;
      s += k.arrow({ points: [[px, y0], [px, y1]], tone: p.tone ?? 'accent' });
      s += k.text({ x: px, y: top ? y0 - 8 : y0 + 20, text: p.label, size: 'label', anchor: 'middle', tone: p.tone ?? 'accent', weight: 600 });
    }
    return s;
  };

  /** 方格矩阵（注意力掩码、DP 表）。cell(r,c) 返回 {tone, text} 或 null。 */
  k.matrix = ({ x, y, rows, cols, size = 34, cell, rowLabels, colLabels }) => {
    let s = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = cell(r, c) ?? {};
      s += `<rect x="${x + c * size}" y="${y + r * size}" width="${size}" height="${size}" fill="${v.tone ? hexToRgba(t[v.tone], v.alpha ?? 0.55) : t.box}" stroke="${t.faint}" stroke-width="1"/>`;
      if (v.text !== undefined) s += k.text({ x: x + c * size + size / 2, y: y + r * size + size / 2 + 5, text: v.text, size: 'note', anchor: 'middle', tone: v.textTone });
    }
    rowLabels?.forEach((l, r) => { s += k.text({ x: x - 10, y: y + r * size + size / 2 + 5, text: l, size: 'note', anchor: 'end', tone: 'muted' }); });
    colLabels?.forEach((l, c) => { s += k.text({ x: x + c * size + size / 2, y: y - 10, text: l, size: 'note', anchor: 'middle', tone: 'muted' }); });
    return s;
  };

  /** 求和节点 ⊕（残差相加等）。 */
  k.sum = ({ x, y, r = 14, tone = 'line' }) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.box}" stroke="${color(tone)}" stroke-width="1.6"/>` +
    `<path d="M${x - r * 0.5},${y} H${x + r * 0.5} M${x},${y - r * 0.5} V${y + r * 0.5}" stroke="${t.text}" stroke-width="1.8"/>`;

  /** 底部提示条：一句话结论。 */
  k.note = ({ x, y, w, h = 52, text, lead }) => {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${hexToRgba(t.accent, t.tint)}"/>`;
    const id = `n${++uid}`;
    s = s.replace('<rect ', `<rect data-box-id="${id}" `);
    const ty = y + h / 2 + 6;
    if (lead) s += `<text x="${x + 20}" y="${ty}" font-size="${SIZE.body}" fill="${t.sec}" data-box="${id}"><tspan font-weight="600" fill="${t.text}">${esc(lead)}</tspan>${esc(text)}</text>`;
    else s += k.text({ x: x + 20, y: ty, text, size: 'body', tone: 'sec', box: id });
    return s;
  };

  /** 图例：items [{tone, label, dashed}] 横排。 */
  k.legend = ({ x, y, items, gap = 28 }) => {
    let s = '', cx = x;
    for (const it of items) {
      s += `<line x1="${cx}" y1="${y - 5}" x2="${cx + 28}" y2="${y - 5}" stroke="${color(it.tone)}" stroke-width="2"${it.dashed ? ' stroke-dasharray="5 4"' : ''}/>`;
      s += k.text({ x: cx + 36, y, text: it.label, size: 'note', tone: 'muted' });
      cx += 36 + [...it.label].reduce((a, ch) => a + (ch.charCodeAt(0) > 255 ? SIZE.note : SIZE.note * 0.58), 0) + gap;
    }
    return s;
  };

  /** 折线图：series [{label, tone, points:[[x,y]...], dashed}]；坐标轴 xDomain/yDomain，可选 logY。 */
  k.lineChart = ({ x, y, w, h, series, xDomain, yDomain, xTicks = [], yTicks = [], xLabel, yLabel, logY = false, endLabels = true }) => {
    const sy = (v) => { const [a, b] = yDomain; const f = logY ? (Math.log10(v) - Math.log10(a)) / (Math.log10(b) - Math.log10(a)) : (v - a) / (b - a); return y + h - Math.max(0, Math.min(1, f)) * h; };
    const sx = (v) => x + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * w;
    let s = `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${t.line}"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${t.line}"/>`;
    for (const v of yTicks) { const yy = sy(v.value ?? v); s += `<line x1="${x}" y1="${r1(yy)}" x2="${x + w}" y2="${r1(yy)}" stroke="${t.faint}" stroke-dasharray="3 5"/>` + k.text({ x: x - 10, y: yy + 5, text: v.label ?? v, size: 'note', anchor: 'end', tone: 'muted' }); }
    for (const v of xTicks) { const xx = sx(v.value ?? v); s += k.text({ x: xx, y: y + h + 24, text: v.label ?? v, size: 'note', anchor: 'middle', tone: 'muted' }); }
    for (const se of series) {
      const pts = se.points.filter(([, v]) => !logY || v > 0).map(([a, b]) => [sx(a), sy(b)]);
      s += `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="none" stroke="${color(se.tone)}" stroke-width="2.4"${se.dashed ? ' stroke-dasharray="6 5"' : ''}/>`;
      if (endLabels) { const p = pts[pts.length - 1]; s += k.text({ x: p[0] + 10, y: p[1] + 5, text: se.label, size: 'label', tone: se.tone, weight: 600 }); }
    }
    if (xLabel) s += k.text({ x: x + w, y: y + h + 50, text: xLabel, size: 'label', anchor: 'end', tone: 'muted' });
    if (yLabel) s += k.text({ x, y: y - 16, text: yLabel, size: 'label', anchor: 'start', tone: 'muted' });
    return s;
  };

  /** 柱状图：bars [{label, value, tone, valueLabel}]。 */
  k.barChart = ({ x, y, w, h, bars, max, gap = 14, showValues = true }) => {
    const m = max ?? Math.max(...bars.map((b) => b.value));
    const bw = (w - gap * (bars.length - 1)) / bars.length;
    let s = `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${t.line}"/>`;
    bars.forEach((b, i) => {
      const bh = (b.value / m) * h, bx = x + i * (bw + gap);
      s += `<rect x="${r1(bx)}" y="${r1(y + h - bh)}" width="${r1(bw)}" height="${r1(bh)}" rx="4" fill="${hexToRgba(color(b.tone ?? 'accent'), b.tone === 'muted' ? 0.35 : 0.75)}"/>`;
      s += k.text({ x: bx + bw / 2, y: y + h + 24, text: b.label, size: 'label', anchor: 'middle', tone: b.tone === 'muted' ? 'muted' : undefined });
      if (showValues) s += k.text({ x: bx + bw / 2, y: y + h - bh - 8, text: b.valueLabel ?? b.value, size: 'note', anchor: 'middle', tone: 'muted' });
    });
    return s;
  };

  /** 整张图：标题 + 副标题 + 内容。h 由作者给定；宽固定 CANVAS_WIDTH（或 width 覆盖）。 */
  k.figure = ({ h, width = CANVAS_WIDTH, title, subtitle, body }) => {
    const markers = TONES.map((tn) => `<marker id="m-${tn}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color(tn)}"/></marker>`).join('');
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${h}" width="${width}" height="${h}" font-family="${FONT}" data-theme="${t.name}"><defs>${markers}</defs>`;
    s += `<rect width="${width}" height="${h}" rx="14" fill="${t.bg}"/>`;
    if (title) s += k.text({ x: 40, y: 50, text: title, size: 'title', weight: 600 });
    if (subtitle) s += k.text({ x: 40, y: 80, text: subtitle, size: 'label', tone: 'muted' });
    // 面板是底板：不管源码里先写哪个，面板矩形一律最先画，免得盖住穿进面板的箭头
    const panels = [];
    const rest = body.replace(/<rect data-panel="1"[^>]*\/>/g, (m) => { panels.push(m); return ''; });
    return s + panels.join('') + rest + '</svg>';
  };

  return k;
}
