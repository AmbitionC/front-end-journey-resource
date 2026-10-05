// 按知识库一级分类生成会员资料 PDF，以私有 ACL 上传 OSS + 写 manifest。
// 内容源：knowledge/_tree.json（一级分类=顶层节点）；叶子文件 knowledge/<filePath>/<key>.md。
// 图片：拦截既有 OSS 图片地址，仅从同一已审提交读取本地图片，禁止外部可变内容。
// 运行：node scripts/build-materials.mjs；须有最终提交审查和同 SHA 同步成功证据。
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isDirectExecution, leafPath, readBounded, safeRelativePath, safeKey } from './resource-paths.mjs';
import { requireReviewedRelease } from './validate-release.mjs';
import { publicInventory, sha256 } from './content-review.mjs';
import MarkdownIt from 'markdown-it';
import puppeteer from 'puppeteer';
import OSS from 'ali-oss';
import parse5 from 'parse5';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KNOWLEDGE = join(ROOT, 'knowledge');
const DIST = join(ROOT, 'dist', 'materials');

const OSS_PREFIX = 'materials/knowledge/';
let approvedFiles;

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
  const path = leafPath('knowledge',leaf), bytes = readFileSync(join(ROOT,path));
  if (sha256(bytes)!==approvedFiles.get(path)) throw new Error('PDF 正文与已审版本不一致');
  return bytes.toString();
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

const CSS = `
  * { box-sizing: border-box; }
  body { font-family: "Noto Sans CJK SC","Noto Sans SC","PingFang SC","Microsoft YaHei",-apple-system,sans-serif;
    color:#1f2328; font-size:13px; line-height:1.75; margin:0; }
  h1.cover { font-size:30px; font-weight:700; margin:38vh 0 0; text-align:center; page-break-after:always; color:#26251e; }
  h1.cover .sub { font-size:15px; font-weight:500; color:#7a8a7d; margin-top:14px; }
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

/** 为某个二级分类节点构建整册 HTML（封面=二级分类名，章节=更深层目录） */
export function buildHtml(sub, parentLabel, readArticle=readLeafMd) {
  const out = [];
  collectLeaves(sub, [], out);
  if (!out.length) return null;
  let body =
    `<h1 class="cover">${esc(sub.label)}` +
    `<div class="sub">${esc(parentLabel)}</div>` +
    `<div class="foot">FrontEnd Journey · 会员资料</div></h1>`;
  let lastSection = '';
  for (const { leaf, trail } of out) {
    const section = trail.slice(1).join(' · '); // 去掉本二级分类名，保留更深层目录
    if (section && section !== lastSection) {
      body += `<h2 class="section">${esc(section)}</h2>`;
      lastSection = section;
    }
    const mdText = readArticle(leaf);
    body += `<article><h3>${esc(leaf.label)}</h3>${md.render(mdText)}</article>`;
  }
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;
  validatePdfHtml(html);
  return { html, count: out.length };
}

export function validatePdfHtml(html) {
  function visit(node) {
    if(['iframe','object','embed','video','audio','canvas','picture','source','svg','image','use','foreignObject','script'].includes(node.tagName)) throw new Error('PDF 含无已核验静态回退的媒体；禁止静默丢失图解');
    const attrs=Object.fromEntries((node.attrs??[]).map(a=>[a.name,a.value]));
    // The builder owns its only stylesheet. Author CSS/SVG resource loading
    // is not covered by document.images readiness and must fail closed.
    if (node.tagName==='style' && ((node.childNodes??[]).map(n=>n.value??'').join('')!==CSS || node.parentNode?.tagName!=='head')
        || node.tagName==='link' || 'style' in attrs || 'srcset' in attrs
        || (node.attrs??[]).some(a=>a.name.startsWith('on'))) throw new Error('PDF 含未受支持的样式或资源入口；禁止静默丢失图解');
    for(const child of node.childNodes??[])visit(child);
    if(node.content)visit(node.content);
  }
  visit(parse5.parse(html));
}

export function localReviewedImagePath(value) {
  const url = new URL(value);
  if (url.origin!=='https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com'
      || !url.pathname.startsWith('/images/') || url.search || url.hash) return null;
  return safeRelativePath(decodeURIComponent(url.pathname.slice(1)));
}

async function main() {
  const head = spawnSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).stdout.trim();
  const before = process.env.RELEASE_BEFORE_SHA || spawnSync('git',['rev-parse','HEAD^1'],{cwd:ROOT,encoding:'utf8'}).stdout.trim();
  const approval = await requireReviewedRelease(ROOT,before,process.env.RELEASE_AFTER_SHA || head,{requireSync:true});
  const snapshot = await publicInventory(ROOT);
  if (snapshot.digest!==approval.publicationDigest) throw new Error('PDF 输入在最终审核后改变');
  approvedFiles = new Map(snapshot.files.map(x=>[x.path,x.sha256]));
  const treeBytes = await readBounded(ROOT,'knowledge/_tree.json','knowledge');
  if (sha256(treeBytes)!==approvedFiles.get('knowledge/_tree.json')) throw new Error('PDF 目录与已审版本不一致');
  const tree = JSON.parse(treeBytes);
  mkdirSync(DIST,{recursive:true});
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
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

  const now = new Date().toISOString();
  const groups = [];
  let total = 0;
  const uploads = [];

  // 按「一级分类 → 二级分类」拆分：每个二级分类一册 PDF（控制单册体积）
  for (const cat of tree) {
    safeKey(cat.key);
    const subs = Array.isArray(cat.children) ? cat.children : [];
    const items = [];
    for (const sub of subs) {
      safeKey(sub.key);
      // 二级节点本身可能直接是叶子（无更深分层）——也按一册处理
      const built = buildHtml(sub, cat.label);
      if (!built) {
        console.log(`skip ${cat.key}/${sub.key}: 无已发布文章`);
        continue;
      }
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request',async request=>{
        try {
          const path = localReviewedImagePath(request.url());
          if (!path || request.resourceType()!=='image') { await request.abort(); return; }
          const bytes = await readBounded(ROOT,path,'images');
          if (sha256(bytes)!==approvedFiles.get(path)) throw new Error('PDF 图片与已审版本不一致');
          await request.respond({status:200,body:bytes});
        } catch { await request.abort(); }
      });
      await page.setContent(built.html, { waitUntil: 'networkidle0', timeout: 120000 });
      const imagesReady = await page.evaluate(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
      if (!imagesReady) throw new Error('PDF 必需图片缺失或未通过审核绑定');
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
      });
      await page.close();

      const buf = Buffer.from(pdf);
      writeFileSync(join(DIST, `${sub.key}.pdf`), buf);

      uploads.push({key:sub.key,buf});
      items.push({
        key: sub.key,
        label: sub.label,
        updatedAt: now,
        sizeBytes: buf.length,
        articleCount: built.count,
      });
      total += 1;
      console.log(
        `built ${cat.key}/${sub.key}: ${built.count} 篇, ${(buf.length / 1024 / 1024).toFixed(2)}MB`,
      );
    }
    if (items.length) groups.push({ key: cat.key, label: cat.label, items });
  }

  const manifest = { generatedAt: now, version: 2, groups };
  const manifestStr = JSON.stringify(manifest, null, 2);
  writeFileSync(join(DIST, 'manifest.json'), manifestStr);
  if (client) {
    for (const {key,buf} of uploads) await client.put(`${OSS_PREFIX}${key}.pdf`,buf, {
      headers:{'Content-Type':'application/pdf','x-oss-object-acl':'private'},
    });
    await client.put(`${OSS_PREFIX}manifest.json`, Buffer.from(manifestStr), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'x-oss-object-acl': 'private' },
    });
  }

  console.log(
    `done: ${groups.length} 个一级分类 / ${total} 册二级 PDF${client ? ' 已上传 OSS' : '（本地）'}。`,
  );
  } finally { await browser.close(); }
}

if (isDirectExecution(import.meta.url)) {
  main().catch(() => { console.error('正式 PDF 生成/上传失败；审核、同 SHA 同步及图片条件必须全部满足'); process.exitCode=1; });
}
