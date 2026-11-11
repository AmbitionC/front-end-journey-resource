// 把 build-figures.py 生成的 SVG 渲染成 PNG：node render-figures.mjs <svg目录> <png目录>
// 本仓库未装 playwright 时，用 PLAYWRIGHT=<playwright/index.js 的绝对路径> 指定
const pw = await import(process.env.PLAYWRIGHT || 'playwright');
const chromium = pw.chromium || pw.default.chromium;
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const [src, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const f of readdirSync(src).filter((n) => n.endsWith('.svg'))) {
  const svg = readFileSync(join(src, f), 'utf8');
  const [, w, h] = svg.match(/width='(\d+)' height='(\d+)'/);
  await page.setViewportSize({ width: +w, height: +h });
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: join(out, basename(f, '.svg') + '.png'), clip: { x: 0, y: 0, width: +w, height: +h } });
}
await browser.close();
