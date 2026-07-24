// 按知识库一级分类生成会员资料 PDF，以私有 ACL 上传 OSS + 写 manifest。
// 内容源：knowledge/_tree.json（一级分类=顶层节点）；叶子文件 knowledge/<filePath>/<key>.md。
// 图片：markdown 内已是公网 OSS 绝对地址，puppeteer 直接联网加载，无需重写。
// 运行：node scripts/build-materials.mjs   （CI 里带 OSS_* 环境变量即上传；无则只产出本地 dist）
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import puppeteer from 'puppeteer';
import OSS from 'ali-oss';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KNOWLEDGE = join(ROOT, 'knowledge');
const DIST = join(ROOT, 'dist', 'materials');
mkdirSync(DIST, { recursive: true });

const OSS_PREFIX = 'materials/knowledge/';
const tree = JSON.parse(readFileSync(join(KNOWLEDGE, '_tree.json'), 'utf8'));

const md = new MarkdownIt({ html: true, linkify: true, breaks: false });

/** 递归收集某分类下已发布叶子（按树序），带层级面包屑 */
function collectLeaves(node, trail, out) {
  if (node.isLeaf) {
    if ((node.contentStatus || 'published') === 'published') out.push({ leaf: node, trail });
    return;
  }
  for (const c of node.children || []) collectLeaves(c, [...trail, node.label], out);
}

function readLeafMd(leaf) {
  const p = join(KNOWLEDGE, leaf.filePath || '', `${leaf.key}.md`);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

const CSS = `
  * { box-sizing: border-box; }
  body { font-family: "Noto Sans CJK SC","Noto Sans SC","PingFang SC","Microsoft YaHei",-apple-system,sans-serif;
    color:#1f2328; font-size:13px; line-height:1.75; margin:0; }
  h1.cover { font-size:30px; font-weight:700; margin:40vh 0 0; text-align:center; page-break-after:always; color:#26251e; }
  h2.section { font-size:20px; font-weight:600; margin:28px 0 12px; padding-bottom:6px; border-bottom:2px solid #40b35d; color:#26251e; page-break-before:always; }
  article { page-break-inside:auto; margin:0 0 22px; }
  article > h3 { font-size:16px; font-weight:600; margin:18px 0 8px; color:#111; }
  p { margin:8px 0; }
  a { color:#369e50; text-decoration:none; }
  code { background:#f2f2ef; border-radius:3px; padding:1px 4px; font-family:"SFMono-Regular",Consolas,monospace; font-size:12px; }
  pre { background:#f7f7f4; border:1px solid #e6e5e0; border-radius:8px; padding:12px; overflow:auto; page-break-inside:avoid; }
  pre code { background:none; padding:0; }
  table { border-collapse:collapse; width:100%; margin:12px 0; page-break-inside:avoid; }
  th,td { border:1px solid #dcdcd6; padding:6px 10px; text-align:left; vertical-align:top; }
  th { background:#f2f6f2; font-weight:600; }
  img { max-width:100%; height:auto; display:block; margin:12px auto; page-break-inside:avoid; }
  blockquote { margin:12px 0; padding:6px 14px; border-left:3px solid #40b35d; background:#f6faf7; color:#5a5852; }
  ul,ol { padding-left:22px; }
  .foot { margin-top:8px; text-align:center; color:#b8b6ad; font-size:11px; }
`;

function buildHtml(cat) {
  const out = [];
  collectLeaves(cat, [], out);
  if (!out.length) return null;
  let body = `<h1 class="cover">${esc(cat.label)}<div class="foot">FrontEnd Journey · 会员资料</div></h1>`;
  let lastSection = '';
  for (const { leaf, trail } of out) {
    const section = trail.slice(1).join(' · '); // 去掉顶层分类名
    if (section && section !== lastSection) {
      body += `<h2 class="section">${esc(section)}</h2>`;
      lastSection = section;
    }
    const mdText = readLeafMd(leaf);
    body += `<article><h3>${esc(leaf.label)}</h3>${md.render(mdText)}</article>`;
  }
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;
  return { html, count: out.length };
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let client = null;
  const { OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET } = process.env;
  if (OSS_ACCESS_KEY_ID && OSS_ACCESS_KEY_SECRET) {
    client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: OSS_ACCESS_KEY_ID,
      accessKeySecret: OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET || 'font-end-journey-resources',
    });
  } else {
    console.warn('[build-materials] 未配置 OSS_ACCESS_KEY_ID/SECRET，仅本地产出 dist，不上传。');
  }

  const categories = [];
  for (const cat of tree) {
    const built = buildHtml(cat);
    if (!built) {
      console.log(`skip ${cat.key}: 无已发布文章`);
      continue;
    }
    const page = await browser.newPage();
    await page.setContent(built.html, { waitUntil: 'networkidle0', timeout: 120000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
    });
    await page.close();

    const buf = Buffer.from(pdf);
    writeFileSync(join(DIST, `${cat.key}.pdf`), buf);
    const updatedAt = new Date().toISOString();

    if (client) {
      await client.put(`${OSS_PREFIX}${cat.key}.pdf`, buf, {
        headers: { 'Content-Type': 'application/pdf', 'x-oss-object-acl': 'private' },
      });
    }
    categories.push({
      key: cat.key,
      label: cat.label,
      updatedAt,
      sizeBytes: buf.length,
      articleCount: built.count,
    });
    console.log(`built ${cat.key}: ${built.count} 篇, ${(buf.length / 1024 / 1024).toFixed(2)}MB`);
  }

  const manifest = { generatedAt: new Date().toISOString(), categories };
  const manifestStr = JSON.stringify(manifest, null, 2);
  writeFileSync(join(DIST, 'manifest.json'), manifestStr);
  if (client) {
    await client.put(`${OSS_PREFIX}manifest.json`, Buffer.from(manifestStr), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'x-oss-object-acl': 'private' },
    });
  }

  await browser.close();
  console.log(`done: ${categories.length} 个分类 PDF${client ? ' 已上传 OSS' : '（本地）'}。`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
