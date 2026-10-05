// Reviewed, committed raster derivatives only. Rendering happens offline before release.
import MarkdownIt from 'markdown-it';
import parse5 from 'parse5';
import { posix } from 'node:path';
import { sha256 } from './content-review.mjs';
import { readBounded, leafPath, safeRelativePath } from './resource-paths.mjs';

export function configurePdfMarkdown(md) {
  for (const tag of ['th_open','td_open']) md.renderer.rules[tag]=(tokens,index,options,env,self)=>{
    const token=tokens[index],alignment=token.attrGet('style');
    if(alignment && /^text-align:(left|center|right)$/u.test(alignment)){
      token.attrs=token.attrs.filter(([name])=>name!=='style');
      token.attrJoin('class',`pdf-align-${alignment.slice(11)}`);
    }
    return self.renderToken(tokens,index,options);
  };
  return md;
}
const esc=s=>String(s).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ORIGIN='https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/';
const PIN=/^[a-f0-9]{64}$/u;

export async function createPdfStaticRenderer(root,approved,{sourceCommit}={}) {
  if(sourceCommit!==undefined&&!/^[a-f0-9]{40}$/u.test(sourceCommit))throw new Error('PDF 来源提交必须固定为完整 SHA');
  async function pinned(path,expected,module){
    if(!PIN.test(expected??'') || approved.get(path)!==expected)throw new Error('PDF 静态输入缺已审 SHA');
    const bytes=await readBounded(root,path,module);
    if(sha256(bytes)!==expected)throw new Error('PDF 静态输入与已审版本不一致');
    return bytes;
  }
  const manifestPath='knowledge/pdf-static-images.json';
  const manifest=JSON.parse(await pinned(manifestPath,approved.get(manifestPath),'knowledge'));
  if(manifest.schemaVersion!==1 || manifest.complete!==true || !Number.isSafeInteger(manifest.expectedCount)
      || !Array.isArray(manifest.entries) || manifest.entries.length!==manifest.expectedCount
      || !Array.isArray(manifest.literals))throw new Error('PDF 静态清单不完整');
  const byArticle=new Map(),ids=new Set();
  for(const entry of manifest.entries){
    if(!['mermaid','archify','svg'].includes(entry.kind) || typeof entry.sourceText!=='string'
        || sha256(entry.sourceText)!==entry.sourceSha256 || !Number.isSafeInteger(entry.line) || entry.line<1
        || typeof entry.id!=='string' || ids.has(entry.id))throw new Error('PDF 静态映射缺失或重复');
    ids.add(entry.id);safeRelativePath(entry.articlePath);safeRelativePath(entry.outputPath);
    if(!entry.articlePath.startsWith('knowledge/') || !entry.articlePath.endsWith('.md')
        || !entry.outputPath.startsWith('images/pdf-') || !entry.outputPath.endsWith('.png'))throw new Error('PDF 静态映射路径越界');
    await pinned(entry.articlePath,entry.articleSha256,'knowledge');
    const image=await pinned(entry.outputPath,entry.outputSha256,'images');
    const png=Buffer.from([137,80,78,71,13,10,26,10]);
    if(image.length<24 || !image.subarray(0,8).equals(png) || image.readUInt32BE(16)!==entry.width
        || image.readUInt32BE(20)!==entry.height || entry.width<=0 || entry.height<=0)throw new Error('PDF 静态图片格式或尺寸不一致');
    if(entry.panels!==undefined){
      if(!Array.isArray(entry.panels)||!entry.panels.length)throw new Error('PDF 细节面板清单不完整');
      const names=new Set();
      for(const panel of entry.panels){
        safeRelativePath(panel.outputPath);
        if(!panel.outputPath.startsWith('images/pdf-')||!panel.outputPath.endsWith('.png')||names.has(panel.outputPath))throw new Error('PDF 细节面板路径不受支持或重复');
        names.add(panel.outputPath);const bytes=await pinned(panel.outputPath,panel.outputSha256,'images');
        if(bytes.length<24||!bytes.subarray(0,8).equals(png)||bytes.readUInt32BE(16)!==panel.width||bytes.readUInt32BE(20)!==panel.height||panel.width<=0||panel.height<=0)throw new Error('PDF 细节面板字节或尺寸不匹配');
      }
    }
    if(entry.kind==='archify')entry.spec=JSON.parse(await pinned(entry.specPath,entry.specSha256,'knowledge'));
    if(entry.kind==='svg')await pinned(entry.vectorPath,entry.vectorSha256,'images');
    const rows=byArticle.get(entry.articlePath)??[];
    if(rows.some(x=>x.kind===entry.kind&&x.line===entry.line&&x.sourceSha256===entry.sourceSha256))throw new Error('PDF 静态节点映射重复');
    rows.push(entry);byArticle.set(entry.articlePath,rows);
  }
  for(const literal of manifest.literals){
    if(literal.sourceText!=='.agents/skills/<id>/')throw new Error('PDF 占位符不在固定转换范围');
    await pinned(literal.articlePath,literal.articleSha256,'knowledge');
  }
  const md=configurePdfMarkdown(new MarkdownIt({html:true,linkify:true,breaks:false}));
  return function render(leaf,text){
    const articlePath=leafPath('knowledge',leaf),entries=byArticle.get(articlePath)??[],used=new Set();
    if(entries.some(e=>sha256(text)!==e.articleSha256))throw new Error('PDF 正文与静态映射已审版本不一致');
    const literal=manifest.literals.find(x=>x.articlePath===articlePath);
    if(literal){
      if(sha256(text)!==literal.articleSha256 || text.split(literal.sourceText).length!==2)throw new Error('PDF 固定占位符源不匹配');
      text=text.replace(literal.sourceText,'.agents/skills/&lt;id&gt;/');
    }
    function match(kind,line,source){
      const row=entries.find(e=>e.kind===kind&&e.line===line&&e.sourceSha256===sha256(source)&&e.sourceText===source);
      if(!row || used.has(row.id))throw new Error('PDF 图解缺精确已审静态映射');
      used.add(row.id);return row;
    }
    function figure(e){
      let html=`<figure class="pdf-diagram"><img src="${ORIGIN}${esc(e.outputPath)}" alt="${esc(e.kind==='archify'?e.spec.meta?.title??'交互架构图':'原文图解')}" width="${e.width}" height="${e.height}">`;
      if(e.normalization?.kind==='legacy-left-join-regions-v1')for(const line of e.normalization.supplement??[])html+=`<p>${esc(line).replace(/\n/gu,'<br>')}</p>`;
      if(e.kind==='archify'){
        for(const view of e.spec.meta?.views??[])html+=`<p><strong>${esc(view.label)}</strong>：${esc(view.note??'')}</p>`;
        for(const card of e.spec.cards??[])html+=`<p><strong>${esc(card.title)}</strong></p><ul>${(card.items??[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`;
      }
      if(e.panels)html+=`<p>细节面板：按从上到下、从左到右阅读；相邻面板保留重叠区域，上方总览保留完整关系。</p>${e.panels.map((p,i)=>`<p>详图 ${i+1}/${e.panels.length}</p><img src="${ORIGIN}${esc(p.outputPath)}" alt="图解细节 ${i+1}" width="${p.width}" height="${p.height}">`).join('')}`;
      return html+'</figure>\n';
    }
    const tokens=md.parse(text,{});
    for(const token of tokens){
      if(token.type==='fence'&&/^mermaid(?:\s|$)/iu.test(token.info.trim())){
        const e=match('mermaid',token.map[0]+1,token.content);
        token.type='html_block';token.content=figure(e);
      }
      if(token.type==='html_block'){
        const fragment=parse5.parseFragment(token.content,{sourceCodeLocationInfo:true}),replacements=[];
        const walk=n=>{if(n.tagName==='iframe'){
          const l=n.sourceCodeLocation,raw=token.content.slice(l.startOffset,l.endOffset);
          replacements.push({start:l.startOffset,end:l.endOffset,html:figure(match('archify',token.map[0]+1,raw))});
        }for(const child of n.childNodes??[])walk(child);};walk(fragment);
        for(const r of replacements.sort((a,b)=>b.start-a.start))token.content=token.content.slice(0,r.start)+r.html+token.content.slice(r.end);
      }
      for(const child of token.children??[])if(child.type==='image'&&/\.svg$/iu.test(child.attrGet('src')??'')){
        const e=match('svg',token.map[0]+1,child.attrGet('src'));child.attrSet('src',ORIGIN+e.outputPath);
      }
    }
    if(used.size!==entries.length)throw new Error('PDF 静态映射存在未消费节点；源与清单不同步');
    const html=md.renderer.render(tokens,md.options,{});
    const fragment=parse5.parseFragment(html);
    function links(node){
      if(node.tagName==='a')for(const a of node.attrs??[])if(a.name==='href'&&!/^[a-z][a-z0-9+.-]*:|^#|^\/\//iu.test(a.value)){
        if(!sourceCommit)throw new Error('PDF 相对链接缺固定来源提交');
        const [target,fragment]=a.value.split('#'),path=posix.normalize(posix.join(posix.dirname(articlePath),decodeURIComponent(target)));
        safeRelativePath(path);
        a.value=`https://github.com/AmbitionC/front-end-journey-resource/blob/${sourceCommit}/${path}${fragment?'#'+fragment:''}`;
      }
      for(const c of node.childNodes??[])links(c);
    }links(fragment);
    return parse5.serialize(fragment);
  };
}
