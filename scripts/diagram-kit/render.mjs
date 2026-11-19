#!/usr/bin/env node
// 渲染并检查配图：每个源文件导出深、浅两张 PNG，并跑可读性检查。
//   node scripts/diagram-kit/render.mjs images/diagram-sources/<name>.aj.mjs [...more] [--preview <out.png>]
// 源文件：export const meta = { name, alt }; export default (k) => k.figure({...})
// 输出：images/<name>.dark.png、images/<name>.light.png（2 倍图）。
// 依赖：puppeteer（仓库已有）+ 字体 @fontsource/noto-sans-sc（见 SKILL.md 安装方式）。
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer';
import { createKit, MIN_FONT, THEMES } from './kit.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const previewIdx = args.indexOf('--preview');
const preview = previewIdx >= 0 ? resolve(args[previewIdx + 1]) : null;
const sources = args.filter((a, i) => !a.startsWith('--') && !(previewIdx >= 0 && i === previewIdx + 1));
if (!sources.length) { console.error('用法：render.mjs <source.aj.mjs> [...] [--preview out.png]'); process.exit(2); }

const fontDir = [process.env.AJ_FONT_DIR, join(ROOT, 'node_modules/@fontsource/noto-sans-sc')].find((d) => d && existsSync(join(d, '400.css')));
if (!fontDir) {
  console.error('缺字体：先运行 npm i --no-save --ignore-scripts @fontsource/noto-sans-sc@5.3.1，或设置 AJ_FONT_DIR');
  process.exit(2);
}
const chrome = [process.env.AJ_CHROME, process.env.PUPPETEER_EXECUTABLE_PATH, '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && existsSync(p));

const fontCss = ['400', '600', '700'].map((w) => `<link rel="stylesheet" href="${pathToFileURL(join(fontDir, `${w}.css`)).href}">`).join('');

// 在页面里跑的检查：字号下限、出界、文字互相重叠、文字超出所属方框。
function lint(minFont) {
  const svg = document.querySelector('svg');
  const W = svg.viewBox.baseVal.width, H = svg.viewBox.baseVal.height;
  const problems = [];
  const texts = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim());
  const boxes = texts.map((t) => {
    const b = t.getBBox();
    return { t, x: b.x, y: b.y, w: b.width, h: b.height, s: t.textContent.trim().slice(0, 24) };
  });
  for (const b of boxes) {
    const fs = parseFloat(b.t.getAttribute('font-size'));
    if (fs < minFont) problems.push(`字号 ${fs} < ${minFont}：「${b.s}」`);
    if (b.x < 8 || b.y < 4 || b.x + b.w > W - 8 || b.y + b.h > H - 4) problems.push(`出界：「${b.s}」`);
    const owner = b.t.getAttribute('data-box');
    if (owner) {
      const r = svg.querySelector(`[data-box-id="${owner}"]`).getBBox();
      if (b.x < r.x + 5 || b.x + b.w > r.x + r.width - 5 || b.y < r.y + 2 || b.y + b.h > r.y + r.height - 2) problems.push(`超出方框：「${b.s}」`);
    }
  }
  const shrink = 2;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.t.hasAttribute('data-badge') || b.t.hasAttribute('data-badge')) continue;
    if (a.x + shrink < b.x + b.w - shrink && b.x + shrink < a.x + a.w - shrink && a.y + shrink < b.y + b.h - shrink && b.y + shrink < a.y + a.h - shrink)
      problems.push(`文字重叠：「${a.s}」×「${b.s}」`);
  }
  // 线条（箭头、边、方框描边）穿过文字：沿每条几何图形取点，落进文字框就报。
  const geoms = [...svg.querySelectorAll('path,line,rect,circle,polyline')].filter((g) => !g.closest('defs') && !g.closest('marker'));
  const bg = svg.querySelector(':scope > rect');
  for (const g of geoms) {
    if (g === bg) continue;
    const ownId = g.getAttribute('data-box-id');
    let len = 0;
    try { len = g.getTotalLength(); } catch { continue; }
    if (!len) continue;
    const pts = [];
    for (let d = 0; d <= len; d += 2) pts.push(g.getPointAtLength(d));
    for (const b of boxes) {
      if (ownId && b.t.getAttribute('data-box') === ownId) continue;
      if (b.t.hasAttribute('data-badge')) continue;
      const inset = 1.5;
      if (pts.some((p) => p.x > b.x + inset && p.x < b.x + b.w - inset && p.y > b.y + inset && p.y < b.y + b.h - inset)) {
        // 文字本来就画在填充的格子/节点里不算（格子、节点、柱子内部的文字）
        const r = g.getBBox();
        const inside = b.x >= r.x - 1 && b.x + b.w <= r.x + r.width + 1 && b.y >= r.y - 1 && b.y + b.h <= r.y + r.height + 1;
        if (inside && g.tagName !== 'path' && g.tagName !== 'line') continue;
        problems.push(`线条压字：「${b.s}」（${g.tagName} ${Math.round(g.getBBox().x)},${Math.round(g.getBBox().y)} ${Math.round(g.getBBox().width)}×${Math.round(g.getBBox().height)}）`);
      }
    }
  }
  return { W, H, problems: [...new Set(problems)] };
}

const browser = await puppeteer.launch({ headless: true, executablePath: chrome, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
let failed = 0;
const rendered = [];
try {
  for (const src of sources) {
    const mod = await import(pathToFileURL(resolve(src)).href);
    const name = mod.meta?.name;
    if (!name || !/^[a-z0-9-]+$/.test(name)) throw new Error(`${src}：meta.name 必须是小写字母、数字和短横线`);
    for (const theme of Object.keys(THEMES)) {
      const svg = mod.default(createKit(theme));
      const html = join(tmpdir(), `aj-diagram-${process.pid}.html`);
      writeFileSync(html, `<!doctype html><meta charset="utf-8">${fontCss}<style>body{margin:0;background:${THEMES[theme].page}}</style>${svg}`);
      await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
      await page.evaluate(async () => { await document.fonts.ready; });
      const ok = await page.evaluate(() => [...document.fonts].some((f) => f.family.includes('Noto Sans SC') && f.status === 'loaded'));
      if (!ok) throw new Error('Noto Sans SC 没有加载，渲染结果不可信');
      const { W, H, problems } = await page.evaluate(lint, MIN_FONT);
      await page.setViewport({ width: Math.ceil(W), height: Math.ceil(H), deviceScaleFactor: 2 });
      const out = join(ROOT, 'images', `${name}.${theme}.png`);
      mkdirSync(dirname(out), { recursive: true });
      await (await page.$('svg')).screenshot({ path: out, omitBackground: true });
      rendered.push({ name, theme, out, W, H });
      const tag = problems.length ? '✗' : '✓';
      console.log(`${tag} ${name}.${theme}.png ${W}×${H}${problems.length ? '\n   ' + problems.join('\n   ') : ''}`);
      if (problems.length) failed++;
    }
  }
  if (preview) {
    // 预览：模拟文章页（正文宽 820px）深浅两种主题，用来判断实际阅读大小。
    const rows = [...new Set(rendered.map((r) => r.name))].map((n) => {
      const cell = (theme) => { const r = rendered.find((x) => x.name === n && x.theme === theme); return `<div style="background:${THEMES[theme].page};padding:24px 32px"><img style="width:100%;border-radius:8px;display:block" src="${pathToFileURL(r.out).href}"></div>`; };
      return `<div style="display:grid;grid-template-columns:884px 884px">${cell('dark')}${cell('light')}</div>`;
    }).join('');
    const html = join(tmpdir(), `aj-preview-${process.pid}.html`);
    writeFileSync(html, `<!doctype html><meta charset="utf-8"><body style="margin:0;width:1768px">${rows}</body>`);
    await page.setViewport({ width: 1768, height: 800, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await page.screenshot({ path: preview, fullPage: true });
    console.log(`预览：${preview}`);
  }
} finally {
  await browser.close();
}
if (failed) { console.error(`${failed} 张图没通过检查，先修再提交`); process.exit(1); }
