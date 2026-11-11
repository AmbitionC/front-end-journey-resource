// 按内容模块生成会员资料 PDF，以私有 ACL 上传 OSS + 写 manifest。
// 默认 knowledge：内容源 knowledge/_tree.json，每个二级分类一册，产物与 OSS 路径保持原样（materials/knowledge/）。
// --module soe|civil：每个顶层分组一册，OSS 前缀 materials/<模块>/；「原创模拟题」的答案与解析
// 按 --answers 处理：appendix（默认，集中到本册末尾）、separate（另出一册「答案与解析」）、inline（不动）。
// 图片：拦截既有 OSS 图片地址，仅从同一已审提交读取本地图片，禁止外部可变内容。
// 运行：node scripts/build-materials.mjs；须有最终提交审查和同 SHA 同步成功证据。
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isDirectExecution, leafPath, readBounded, safeRelativePath, safeKey } from './resource-paths.mjs';
import { requireReviewedRelease } from './validate-release.mjs';
import { publicInventory, sha256 } from './content-review.mjs';
import MarkdownIt from 'markdown-it';
import puppeteer from 'puppeteer';
import OSS from 'ali-oss';
import parse5 from 'parse5';
import { configurePdfMarkdown, createPdfStaticRenderer } from './pdf-static-images.mjs';
import { renderPdfMath, splitQuestionAnswers } from './pdf-questions.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 可出会员 PDF 的模块；label 用作 manifest 分组名和封面副标题 */
export const MATERIAL_MODULES = { knowledge: '知识库', soe: '央国企备考', civil: '考公备考' };
const ANSWER_MODES = ['inline', 'appendix', 'separate'];

export function parseMaterialArgs(argv) {
  const get = (name) => {
    const i = argv.indexOf(name);
    if (i < 0) return undefined;
    const v = argv[i + 1];
    if (!v || v.startsWith('--')) throw new Error(`${name} 缺参数值`);
    return v;
  };
  const module = get('--module') ?? 'knowledge';
  if (!Object.hasOwn(MATERIAL_MODULES, module)) throw new Error(`不支持的 PDF 模块：${module}`);
  const answers = get('--answers') ?? (module === 'knowledge' ? 'inline' : 'appendix');
  if (!ANSWER_MODES.includes(answers)) throw new Error(`--answers 只能是 ${ANSWER_MODES.join(' / ')}`);
  return {
    module,
    answers,
    // knowledge 保持既有产物路径，已上线的下载不受影响
    dist: module === 'knowledge' ? join(ROOT, 'dist', 'materials') : join(ROOT, 'dist', 'materials', module),
    ossPrefix: `materials/${module}/`,
  };
}

let approvedFiles;
let MODULE = 'knowledge';

const md = configurePdfMarkdown(new MarkdownIt({ html: true, linkify: true, breaks: false }));

/** 递归收集某分类下已发布叶子（按树序），带层级面包屑 */
function collectLeaves(node, trail, out) {
  if (node.isLeaf) {
    if ((node.contentStatus || 'published') === 'published') out.push({ leaf: node, trail });
    return;
  }
  for (const c of node.children || []) collectLeaves(c, [...trail, node.label], out);
}

function readLeafMd(leaf) {
  const path = leafPath(MODULE,leaf), bytes = readFileSync(join(ROOT,path));
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
  pre { background:#f7f7f4; border:1px solid #e6e5e0; border-radius:8px; padding:12px; overflow:visible; white-space:pre-wrap; overflow-wrap:anywhere; page-break-inside:auto; }
  pre code { background:none; padding:0; }
  table { border-collapse:collapse; width:100%; margin:12px 0; page-break-inside:avoid; }
  th,td { border:1px solid #dcdcd6; padding:6px 10px; text-align:left; vertical-align:top; }
  th { background:#f2f6f2; font-weight:600; }
  .pdf-align-left { text-align:left; } .pdf-align-center { text-align:center; } .pdf-align-right { text-align:right; }
  img { max-width:100%; max-height:235mm; object-fit:contain; height:auto; display:block; margin:12px auto; page-break-inside:avoid; }
  figure.pdf-diagram { margin:12px 0; } figure.pdf-diagram p { font-size:12px; }
  blockquote { margin:12px 0; padding:6px 14px; border-left:3px solid #40b35d; background:#f6faf7; color:#5a5852; }
  ul,ol { padding-left:22px; }
  .foot { margin-top:8px; text-align:center; color:#b8b6ad; font-size:11px; }
  .pdf-toc { page-break-after:always; } .pdf-toc li { margin:4px 0; }
  h3, article :is(h1,h2,h3,h4,h5,h6) { break-after:avoid; } tr { break-inside:avoid; }
  .pdf-math { font-family:"Times New Roman","Noto Serif CJK SC",serif; font-style:italic; white-space:nowrap; }
  .pdf-math-block { font-family:"Times New Roman","Noto Serif CJK SC",serif; font-style:italic; text-align:center; margin:12px 0; }
  .pdf-answers h4 { font-size:14px; font-weight:600; margin:14px 0 4px; color:#26251e; }
`;

const wrapHtml = (body) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

/**
 * 为某个分类节点构建整册 HTML（封面=分类名，章节=更深层目录）。
 * answers 为 appendix / separate 时，把「原创模拟题」的答案与解析从题目后挪走：
 * appendix 集中到本册末尾；separate 另返回一册 answersBook。
 */
export function buildHtml(sub, parentLabel, readArticle=readLeafMd, renderArticle=(_leaf,text)=>md.render(text), {answers='inline'}={}) {
  const out = [];
  collectLeaves(sub, [], out);
  if (!out.length) return null;
  const answersLabel = `${sub.label} · 答案与解析`;
  const hint = answers === 'separate' ? `答案与解析见《${answersLabel}》。` : '答案与解析见本册末尾。';
  let body =
    `<h1 class="cover">${esc(sub.label)}` +
    `<div class="sub">${esc(parentLabel)}</div>` +
    `<div class="foot">Agent Journey · 会员资料</div></h1>`;
  const collected = [];
  let lastSection = '';
  let articles = '';
  for (const { leaf, trail } of out) {
    const section = trail.slice(1).join(' · '); // 去掉本分类名，保留更深层目录
    if (section && section !== lastSection) {
      articles += `<h2 class="section">${esc(section)}</h2>`;
      lastSection = section;
    }
    let mdText = readArticle(leaf);
    if (answers !== 'inline') {
      const split = splitQuestionAnswers(mdText, { hint });
      mdText = split.body;
      if (split.answers.length) collected.push({ leaf, answers: split.answers });
    }
    articles += `<article id="pdf-${esc(leaf.key)}"><h3>${esc(leaf.label)}</h3>${renderArticle(leaf,mdText)}</article>`;
  }
  const answerBlocks = collected.map(({ leaf, answers: list }) =>
    `<h3>${esc(leaf.label)}</h3>` + list.map((a) => `<h4>${esc(a.title)}</h4>${renderArticle(leaf, a.text)}`).join(''));
  const tocItems = out.map(({leaf})=>`<li><a href="#pdf-${esc(leaf.key)}">${esc(leaf.label)}</a></li>`);
  if (answers === 'appendix' && collected.length) tocItems.push(`<li><a href="#pdf-answers">答案与解析</a></li>`);
  body += `<nav class="pdf-toc"><h2>目录</h2><ol>${tocItems.join('')}</ol></nav>` + articles;
  if (answers === 'appendix' && collected.length)
    body += `<h2 class="section" id="pdf-answers">答案与解析</h2><section class="pdf-answers">${answerBlocks.join('')}</section>`;
  const html = wrapHtml(body);
  validatePdfHtml(html);
  const built = { html, count: out.length };
  if (answers === 'separate' && collected.length) {
    const aBody =
      `<h1 class="cover">${esc(answersLabel)}<div class="sub">${esc(parentLabel)}</div><div class="foot">Agent Journey · 会员资料</div></h1>` +
      `<nav class="pdf-toc"><h2>目录</h2><ol>${collected.map(({leaf})=>`<li><a href="#pdf-${esc(leaf.key)}">${esc(leaf.label)}</a></li>`).join('')}</ol></nav>` +
      collected.map(({ leaf, answers: list }) =>
        `<article id="pdf-${esc(leaf.key)}" class="pdf-answers"><h3>${esc(leaf.label)}</h3>${list.map((a) => `<h4>${esc(a.title)}</h4>${renderArticle(leaf, a.text)}`).join('')}</article>`).join('');
    const aHtml = wrapHtml(aBody);
    validatePdfHtml(aHtml);
    built.answersBook = { html: aHtml, count: collected.length, label: answersLabel };
  }
  return built;
}

/**
 * soe / civil 的正文渲染：公式转静态文本；相对链接指向同册文章时改成册内锚点，
 * 否则固定到来源提交的 GitHub 地址（与 knowledge 的处理一致，PDF 里不留相对链接）。
 */
export function createModuleRenderer(module, { sourceCommit, bookKeys = new Set() } = {}) {
  if (!/^[a-f0-9]{40}$/u.test(sourceCommit ?? '')) throw new Error('PDF 来源提交必须固定为完整 SHA');
  const renderer = configurePdfMarkdown(new MarkdownIt({ html: true, linkify: true, breaks: false }));
  return function render(leaf, text) {
    const articlePath = leafPath(module, leaf);
    const fragment = parse5.parseFragment(renderer.render(renderPdfMath(text)));
    (function links(node) {
      if (node.tagName === 'a') for (const a of node.attrs ?? []) if (a.name === 'href' && !/^[a-z][a-z0-9+.-]*:|^#|^\/\//iu.test(a.value)) {
        const [target, frag] = a.value.split('#');
        const path = posix.normalize(posix.join(posix.dirname(articlePath), decodeURIComponent(target)));
        safeRelativePath(path);
        const key = posix.basename(path, '.md');
        a.value = path.startsWith(`${module}/`) && bookKeys.has(key)
          ? `#pdf-${key}`
          : `https://github.com/AmbitionC/front-end-journey-resource/blob/${sourceCommit}/${path}${frag ? `#${frag}` : ''}`;
      }
      for (const c of node.childNodes ?? []) links(c);
    })(fragment);
    return parse5.serialize(fragment);
  };
}

const PDF_HTML_TAGS = new Set('html head meta style body article h1 h2 h3 h4 h5 h6 p div span section header footer main aside nav address blockquote pre code kbd samp var strong em b i u s del ins small sub sup mark br hr wbr a img ul ol li dl dt dd table caption colgroup col thead tbody tfoot tr th td details summary figure figcaption'.split(' '));

export function validatePdfHtml(html) {
  function visit(node) {
    if(node.tagName && !PDF_HTML_TAGS.has(node.tagName)) throw new Error('PDF 含无已核验静态回退的媒体；禁止静默丢失图解');
    const attrs=Object.fromEntries((node.attrs??[]).map(a=>[a.name,a.value]));
    if(node.tagName==='meta' && (node.parentNode?.tagName!=='head' || (node.attrs??[]).length!==1
        || attrs.charset?.toLowerCase()!=='utf-8') || 'background' in attrs) throw new Error('PDF 含未支持的资源或导航入口；禁止静默丢失图解');
    if(node.tagName==='code' && attrs.class?.split(/\s+/u).includes('language-mermaid')) throw new Error('PDF 不具备已核验 Mermaid 静态图解；禁止将阅读端图解静默降为代码');
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
  if (!['https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com','https://fe-static-oss.ai-fe-nexus.com'].includes(url.origin)
      || !url.pathname.startsWith('/images/') || url.search || url.hash) return null;
  return safeRelativePath(decodeURIComponent(url.pathname.slice(1)));
}

// Compound formats can hide dependencies behind an outer image that reports
// complete. Only explicit raster formats are supported, with real magic bytes.
export function reviewedRasterImageType(path, bytes) {
  const ext=path.slice(path.lastIndexOf('.')).toLowerCase();
  const png=Buffer.from([137,80,78,71,13,10,26,10]);
  if(ext==='.png' && bytes.subarray(0,8).equals(png)) return 'image/png';
  if(['.jpg','.jpeg'].includes(ext) && bytes.length>=3 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  if(ext==='.webp' && bytes.length>=12 && bytes.subarray(0,4).toString()==='RIFF'
      && bytes.subarray(8,12).toString()==='WEBP') return 'image/webp';
  throw new Error('PDF 图片格式或字节头不受支持；SVG 等复合图解须有独立核验的静态产物');
}

export async function preflightPdfImages(root, html, approved) {
  validatePdfHtml(html);
  const sources=[];
  function visit(node) {
    if(node.tagName==='img') sources.push(Object.fromEntries((node.attrs??[]).map(a=>[a.name,a.value])).src);
    for(const child of node.childNodes??[])visit(child);
  }
  visit(parse5.parse(html));
  for(const src of sources) {
    let path;
    try { path=localReviewedImagePath(src); } catch { path=null; }
    if(!path) throw new Error('PDF 图片不在已固定的资源输入范围');
    const bytes=await readBounded(root,path,'images');
    if(sha256(bytes)!==approved.get(path)) throw new Error('PDF 图片与已审版本不一致');
    reviewedRasterImageType(path,bytes);
  }
  return sources.length;
}

export async function renderPdfBook(browser,root,approved,built) {
  const requiredImages=await preflightPdfImages(root,built.html,approved);
  const page=await browser.newPage();
  try{
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request',async request=>{
      try{
        const path=localReviewedImagePath(request.url());
        if(!path||request.resourceType()!=='image'){await request.abort();return;}
        const bytes=await readBounded(root,path,'images');
        if(sha256(bytes)!==approved.get(path))throw new Error('PDF 图片与已审版本不一致');
        await request.respond({status:200,body:bytes,contentType:reviewedRasterImageType(path,bytes)});
      }catch{await request.abort();}
    });
    await page.setContent(built.html,{waitUntil:'networkidle0',timeout:120000});
    const acceptance=await page.evaluate(()=>({
      images:[...document.images].map(i=>({src:i.getAttribute('src'),complete:i.complete&&i.naturalWidth>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight})),
      brokenContents:[...document.querySelectorAll('.pdf-toc a')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).length,
      relativeLinks:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>!/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(h)),
      articleCount:document.querySelectorAll('article').length,
    }));
    if(acceptance.images.length!==requiredImages||acceptance.images.some(i=>!i.complete)||acceptance.brokenContents||acceptance.relativeLinks.length||acceptance.articleCount!==built.count)throw new Error('PDF 图片、目录或正文完整性校验失败');
    const bytes=Buffer.from(await page.pdf({format:'A4',printBackground:true,outline:true,margin:{top:'18mm',bottom:'18mm',left:'16mm',right:'16mm'}}));
    return {bytes,acceptance};
  }finally{await page.close();}
}

const OSS_TIMEOUT_MS = 5 * 60 * 1000;
// 库内超时在 CI 上实测不可靠（#83 后一次 put 挂了 1 小时无任何报错），这里再加一道硬看门狗
const ATTEMPT_TIMEOUT_MS = 6 * 60 * 1000;

function withDeadline(promise, ms, label) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`${label} 超过 ${Math.round(ms / 1000)} 秒未完成`), { name: 'WatchdogTimeout' })), ms);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

/** 私有上传并读回校验；失败或超时最多重试 3 次（同一 key、同一字节，幂等）。 */
export async function uploadVerified(client, key, bytes, contentType, { attempts = 3, attemptTimeoutMs = ATTEMPT_TIMEOUT_MS, wait = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  for (let i = 1; ; i++) {
    const started = Date.now();
    try {
      const result = await withDeadline((async () => {
        await client.put(key, bytes, { headers: { 'Content-Type': contentType, 'x-oss-object-acl': 'private' } });
        return verifyUploadedMaterial(client, key, bytes);
      })(), attemptTimeoutMs, `上传 ${key}`);
      console.log(`[build-materials] 已上传 ${key}（${(bytes.length / 1024 / 1024).toFixed(2)}MB，${((Date.now() - started) / 1000).toFixed(1)} 秒）`);
      return result;
    } catch (err) {
      if (i >= attempts) throw err;
      console.warn(`[build-materials] 上传 ${key} 第 ${i} 次失败（${describeError(err)}），重试`);
      await wait(2000 * i);
    }
  }
}

/** 只取错误类型、代码和首行信息，并抹掉任何环境变量里的密钥值，供 CI 日志定位原因。 */
export function describeError(err, env = process.env) {
  const parts = [err?.name, err?.code, err?.status && `HTTP ${err.status}`, String(err?.message ?? err).split('\n')[0].slice(0, 300)].filter(Boolean);
  let text = parts.join(' · ');
  for (const name of ['OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET']) if (env[name]) text = text.split(env[name]).join('***');
  return text;
}

export async function verifyUploadedMaterial(client,key,bytes) {
  const actual=await client.get(key),acl=await client.getACL(key);
  if(!Buffer.isBuffer(actual.content)||sha256(actual.content)!==sha256(bytes)||acl.acl!=='private')throw new Error('PDF 商品上传读回字节或私有 ACL 不匹配');
  return {key,sha256:sha256(bytes),sizeBytes:bytes.length,acl:'private'};
}

/**
 * 要出的册：knowledge 每个二级分类一册（分组=一级分类，保持既有 manifest 形状）；
 * soe / civil 每个顶层分组一册，整个模块是一个 manifest 分组。
 */
export function planBooks(module, tree, { read, render, answers }) {
  const groups = [];
  if (module === 'knowledge') {
    for (const cat of tree) {
      safeKey(cat.key);
      const books = [];
      for (const sub of cat.children ?? []) {
        safeKey(sub.key);
        const built = buildHtml(sub, cat.label, read, render, { answers });
        if (built) books.push({ key: sub.key, label: sub.label, built });
        else console.log(`skip ${cat.key}/${sub.key}: 无已发布文章`);
      }
      if (books.length) groups.push({ key: cat.key, label: cat.label, books });
    }
    return groups;
  }
  const books = [];
  for (const node of tree) {
    safeKey(node.key);
    const built = buildHtml(node, MATERIAL_MODULES[module], read, render(node), { answers });
    if (!built) { console.log(`skip ${module}/${node.key}: 无已发布文章`); continue; }
    books.push({ key: node.key, label: node.label, built });
    if (built.answersBook) books.push({ key: `${node.key}-answers`, label: built.answersBook.label, kind: 'answers', built: built.answersBook });
  }
  if (books.length) groups.push({ key: module, label: MATERIAL_MODULES[module], books });
  return groups;
}

function leafKeys(node, out = new Set()) {
  if (node.isLeaf) out.add(node.key);
  else for (const c of node.children ?? []) leafKeys(c, out);
  return out;
}

async function main() {
  const opts = parseMaterialArgs(process.argv.slice(2));
  MODULE = opts.module;
  const head = spawnSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).stdout.trim();
  const before = process.env.RELEASE_BEFORE_SHA || spawnSync('git',['rev-parse','HEAD^1'],{cwd:ROOT,encoding:'utf8'}).stdout.trim();
  const approval = await requireReviewedRelease(ROOT,before,process.env.RELEASE_AFTER_SHA || head,{requireSync:true});
  const snapshot = await publicInventory(ROOT);
  if (snapshot.digest!==approval.publicationDigest) throw new Error('PDF 输入在最终审核后改变');
  approvedFiles = new Map(snapshot.files.map(x=>[x.path,x.sha256]));
  const treePath = `${MODULE}/_tree.json`;
  const treeBytes = await readBounded(ROOT,treePath,MODULE);
  if (sha256(treeBytes)!==approvedFiles.get(treePath)) throw new Error('PDF 目录与已审版本不一致');
  const tree = JSON.parse(treeBytes);
  let render;
  if (MODULE === 'knowledge') render = await createPdfStaticRenderer(ROOT,approvedFiles,{sourceCommit:head});
  else render = (node) => createModuleRenderer(MODULE, { sourceCommit: head, bookKeys: leafKeys(node) });
  // Freeze and inspect every book before browser startup or OSS client use.
  const plan = planBooks(MODULE, tree, { read: readLeafMd, render, answers: opts.answers });
  for (const g of plan) for (const b of g.books) await preflightPdfImages(ROOT,b.built.html,approvedFiles);
  mkdirSync(opts.dist,{recursive:true});
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
      // 单册 PDF 可达数十 MB，ali-oss 默认 60 秒超时会在 CI 上把上传截断
      timeout: OSS_TIMEOUT_MS,
    });
  } else {
    console.warn('[build-materials] 未配置 OSS_ACCESS_KEY_ID/SECRET，仅本地产出 dist，不上传。');
  }

  const now = new Date().toISOString();
  const groups = [];
  let total = 0;
  const uploads = [];
  for (const g of plan) {
    const items = [];
    for (const book of g.books) {
      const {bytes:buf,acceptance}=await renderPdfBook(browser,ROOT,approvedFiles,book.built);
      writeFileSync(join(opts.dist, `${book.key}.pdf`), buf);
      writeFileSync(join(opts.dist, `${book.key}.acceptance.json`),JSON.stringify({sourceCommit:head,publicationDigest:snapshot.digest,pdfSha256:sha256(buf),...acceptance},null,2));
      uploads.push({key:book.key,buf});
      items.push({
        key: book.key,
        label: book.label,
        ...(book.kind ? { kind: book.kind } : {}),
        updatedAt: now,
        sizeBytes: buf.length,
        articleCount: book.built.count,
      });
      total += 1;
      console.log(`built ${MODULE}/${g.key}/${book.key}: ${book.built.count} 篇, ${(buf.length / 1024 / 1024).toFixed(2)}MB`);
    }
    if (items.length) groups.push({ key: g.key, label: g.label, items });
  }

  const manifest = { generatedAt: now, version: 2, groups };
  const manifestStr = JSON.stringify(manifest, null, 2);
  writeFileSync(join(opts.dist, 'manifest.json'), manifestStr);
  if (client) {
    const readback=[];
    for (const {key,buf} of uploads) {
      readback.push(await uploadVerified(client,`${opts.ossPrefix}${key}.pdf`,buf,'application/pdf'));
    }
    readback.push(await uploadVerified(client,`${opts.ossPrefix}manifest.json`,Buffer.from(manifestStr),'application/json; charset=utf-8'));
    writeFileSync(join(opts.dist,'upload-readback.json'),JSON.stringify({sourceCommit:head,publicationDigest:snapshot.digest,objects:readback},null,2));
  }

  console.log(`done: ${MODULE} ${groups.length} 个分组 / ${total} 册 PDF${client ? ' 已上传 OSS' : '（本地）'}。`);
  } finally { await browser.close(); }
}

if (isDirectExecution(import.meta.url)) {
  // 被看门狗放弃的请求可能还挂着 socket，显式退出，避免进程空等到 CI 上限
  main().then(() => process.exit(0), (err) => { console.error(`正式 PDF 生成/上传失败；审核、同 SHA 同步及图片条件必须全部满足。原因：${describeError(err)}`); process.exit(1); });
}
