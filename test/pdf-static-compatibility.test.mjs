import test from 'node:test';
import assert from 'node:assert/strict';
import * as materials from '../scripts/build-materials.mjs';
const { buildHtml, localReviewedImagePath }=materials;
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sha256 } from '../scripts/content-review.mjs';
let createPdfStaticRenderer;
try { ({createPdfStaticRenderer}=await import('../scripts/pdf-static-images.mjs')); } catch {}

test('historic raster alias maps to the same local reviewed path without query or hash',()=>{
  assert.equal(localReviewedImagePath('https://fe-static-oss.ai-fe-nexus.com/images/a.png'),'images/a.png');
  for(const suffix of ['?v=2','#fragment'])assert.equal(localReviewedImagePath(`https://fe-static-oss.ai-fe-nexus.com/images/a.png${suffix}`),null);
});

async function fixture(run){
  const root=await mkdtemp(join(tmpdir(),'pdf-static-test-'));
  try{
    await mkdir(join(root,'knowledge/topic'),{recursive:true});await mkdir(join(root,'images'));
    const text='```mermaid\ngraph LR\n A --> B\n```\n',sourceText='graph LR\n A --> B\n';
    const image=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(image);image.writeUInt32BE(100,16);image.writeUInt32BE(80,20);
    const articlePath='knowledge/topic/sample.md',outputPath='images/pdf-sample.png';
    const entry={id:'sample:mermaid:1',kind:'mermaid',articlePath,articleSha256:sha256(text),sourceText,sourceSha256:sha256(sourceText),line:1,outputPath,outputSha256:sha256(image),width:100,height:80};
    const manifest={schemaVersion:1,complete:true,expectedCount:1,entries:[entry],literals:[]};
    const approved=new Map([[articlePath,sha256(text)],[outputPath,sha256(image)]]);
    const save=async()=>{const bytes=Buffer.from(JSON.stringify(manifest));await writeFile(join(root,'knowledge/pdf-static-images.json'),bytes);approved.set('knowledge/pdf-static-images.json',sha256(bytes));};
    await writeFile(join(root,articlePath),text);await writeFile(join(root,outputPath),image);await save();
    await run({root,text,manifest,approved,save,entry,leaf:{key:'sample',filePath:'topic',isLeaf:true,label:'例图'}});
  }finally{await rm(root,{recursive:true,force:true});}
}
test('exact reviewed Mermaid becomes a local raster while an altered source fails closed',()=>fixture(async f=>{
  assert.equal(typeof createPdfStaticRenderer,'function');
  const render=await createPdfStaticRenderer(f.root,f.approved);
  const html=render(f.leaf,f.text);assert.match(html,/images\/pdf-sample.png/);assert.doesNotMatch(html,/language-mermaid/);
  assert.throws(()=>render(f.leaf,f.text.replace('B','C')),/静态|已审/);
}));
test('missing, duplicate, stale and unsafe mappings cannot authorize conversion',()=>fixture(async f=>{
  assert.equal(typeof createPdfStaticRenderer,'function');
  for(const change of [
    ()=>{f.manifest.complete=false;},
    ()=>{f.manifest.entries.push({...f.entry});},
    ()=>{f.entry.outputSha256='0'.repeat(64);},
    ()=>{f.entry.outputPath='images/../secret.png';},
  ]){
    const old=JSON.stringify(f.manifest);change();await f.save();
    await assert.rejects(createPdfStaticRenderer(f.root,f.approved));
    Object.assign(f.manifest,JSON.parse(old));f.entry=f.manifest.entries[0];
  }
}));
test('unused mapping and unknown new media fail instead of silently dropping diagrams',()=>fixture(async f=>{
  assert.equal(typeof createPdfStaticRenderer,'function');
  f.entry.line=8;await f.save();const render=await createPdfStaticRenderer(f.root,f.approved);
  assert.throws(()=>render(f.leaf,f.text));
}));
test('detail panels retain the overview and require approved matching bytes',()=>fixture(async f=>{
  f.entry.panels=[{...f.entry,outputPath:'images/pdf-detail.png'}];
  await writeFile(join(f.root,'images/pdf-detail.png'),await (await import('node:fs/promises')).readFile(join(f.root,f.entry.outputPath)));
  f.approved.set('images/pdf-detail.png',f.entry.outputSha256);await f.save();
  const render=await createPdfStaticRenderer(f.root,f.approved),html=render(f.leaf,f.text);
  assert.match(html,/pdf-sample.png/);assert.match(html,/pdf-detail.png/);
  f.entry.panels[0].outputSha256='0'.repeat(64);await f.save();
  await assert.rejects(createPdfStaticRenderer(f.root,f.approved));
}));
test('book contents are clickable in article order with stable internal destinations',()=>{
  const html=buildHtml({label:'书',children:[{key:'one',label:'一',isLeaf:true},{key:'two',label:'二',isLeaf:true}]},'类',()=> '正文。').html;
  assert.match(html,/href="#pdf-one"/);assert.match(html,/id="pdf-two"/);
  assert.ok(html.indexOf('href="#pdf-one"')<html.indexOf('href="#pdf-two"'));
});
test('relative content links point to the immutable public source instead of a local PDF path',()=>fixture(async f=>{
  f.text+='\n[来源](../../topic.md)\n';f.entry.articleSha256=sha256(f.text);f.approved.set(f.entry.articlePath,sha256(f.text));
  await writeFile(join(f.root,f.entry.articlePath),f.text);await f.save();
  const render=await createPdfStaticRenderer(f.root,f.approved,{sourceCommit:'a'.repeat(40)});
  assert.match(render(f.leaf,f.text),/href="https:\/\/github.com\/AmbitionC\/front-end-journey-resource\/blob\/a{40}\/topic.md"/);
}));
test('uploaded product bytes and private ACL must both be verified before manifest delivery',async()=>{
  assert.equal(typeof materials.verifyUploadedMaterial,'function');
  const bytes=Buffer.from('%PDF-1.7\nfixed product');
  const store={get:async()=>({content:Buffer.from('%PDF-1.7\nwrong')}),getACL:async()=>({acl:'private'})};
  await assert.rejects(materials.verifyUploadedMaterial(store,'materials/knowledge/a.pdf',bytes));
  store.get=async()=>({content:bytes});store.getACL=async()=>({acl:'public-read'});
  await assert.rejects(materials.verifyUploadedMaterial(store,'materials/knowledge/a.pdf',bytes));
  store.getACL=async()=>({acl:'private'});
  assert.equal((await materials.verifyUploadedMaterial(store,'materials/knowledge/a.pdf',bytes)).sha256,sha256(bytes));
});
test('Markdown-generated table alignment remains visible without permitting author inline CSS',()=>{
  const sub={label:'HTTP',isLeaf:true};
  const html=buildHtml(sub,'网络',()=> '| 参数 | 值 |\n| :--- | :---: |\n| Accept | JSON |').html;
  assert.match(html,/class="pdf-align-center"/);
  assert.throws(()=>buildHtml(sub,'网络',()=>'<table><tr><td style="text-align:center">原始样式</td></tr></table>'));
});
