import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {writeFile} from 'node:fs/promises';
import {reviewFixture} from './release-review-fixture.mjs';
import {sha256} from '../scripts/content-review.mjs';
import { buildHtml, localReviewedImagePath, validatePdfHtml, reviewedRasterImageType, preflightPdfImages } from '../scripts/build-materials.mjs';
import { validateSyncResult } from '../scripts/validate-sync-result.mjs';

test('PDF HTML keeps published leaf order, escapes labels and reads actual supplied Markdown',()=>{
  const sub={label:'二级 <unsafe>',children:[{key:'yes',label:'已发布 & title',isLeaf:true},{key:'draft',label:'草稿',isLeaf:true,contentStatus:'draft'}]};
  const calls=[];
  const result=buildHtml(sub,'一级 > title',leaf=>{calls.push(leaf.key);return '# 真实内容\n\n短文。';});
  assert.deepEqual(calls,['yes']);assert.equal(result.count,1);
  assert.match(result.html,/二级 &lt;unsafe&gt;/u);assert.match(result.html,/已发布 &amp; title/u);assert.match(result.html,/<h1>真实内容<\/h1>/u);
  assert.equal(buildHtml({label:'空',children:[]},'一级'),null);
});

test('PDF image request permits only reviewed repository images from the established OSS origin',()=>{
  const origin='https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com';
  assert.equal(localReviewedImagePath(`${origin}/images/image.png`),'images/image.png');
  for(const value of ['https://evil.invalid/images/image.png',`${origin}/other/image.png`,`${origin}/images/image.png?change=1`,`${origin}/images/../secret`,`${origin}/images/image.png#other`]) assert.equal(localReviewedImagePath(value),null);
  assert.throws(()=>localReviewedImagePath(`${origin}/images/%2e%2e%2fsecret`));
});

test('FaaS result parser checks actual contract and rejects nested errors or merely textual success',()=>{
  assert.deepEqual(validateSyncResult({success:true,data:{manifests:1,articles:2,images:3,deleted:0,errors:[]}}),{manifests:1,articles:2,images:3,deleted:0,errors:[]});
  for(const value of [{success:false,data:{errors:[]}},{success:true,data:{errors:['failed article'],manifests:0,articles:0,images:0,deleted:0}},{success:true,errors:[]},{message:'success: true'},{success:true,data:{errors:[],manifests:0,articles:-1,images:0,deleted:0}}]) assert.throws(()=>validateSyncResult(value));
});

test('direct PDF CLI fails before browser launch or upload when genuine final proof is missing',()=>{
  const result=spawnSync(process.execPath,[join(import.meta.dirname,'../scripts/build-materials.mjs')],{encoding:'utf8',timeout:20000,env:{...process.env,RELEASE_AFTER_SHA:'0'.repeat(40)}});
  assert.equal(result.status,1);assert.match(result.stderr,/正式 PDF 生成\/上传失败/u);
  assert.doesNotMatch(result.stdout,/built |已上传 OSS/u);
});

test('unsupported iframe or active media cannot silently vanish from approved PDF',()=>{
  for(const tag of ['iframe','object','embed','video','audio','canvas']) assert.throws(()=>validatePdfHtml(`<${tag}></${tag}>`),/禁止静默丢失图解/u);
  assert.throws(()=>buildHtml({label:'章节',isLeaf:true},'类别',()=>'<iframe src="https://example.invalid/chart.html"></iframe>'),/静态回退/u);
  assert.doesNotThrow(()=>validatePdfHtml('<p>正文</p><img src="reviewed-image.png">'));
});


test('SVG resources and CSS images cannot bypass required PDF media readiness',()=>{
  for(const body of [
    '<svg><image href="https://example.invalid/diagram.png"></image></svg>',
    '<svg><use href="https://example.invalid/sprite.svg#diagram"></use></svg>',
    '<div style="background-image:url(https://example.invalid/diagram.png)">图解</div>',
    '<style>.diagram {background-image:image-set(url(https://example.invalid/chart.png) 1x)}</style><div class="diagram"></div>',
    '<picture><source srcset="https://example.invalid/chart.png"><img src="fallback.png"></picture>',
  ]) assert.throws(()=>buildHtml({label:'图解',isLeaf:true},'类别',()=>body),/静默丢失图解/u);
  assert.throws(()=>buildHtml({label:'待核验静态矢量',isLeaf:true},'类别',()=>'<svg viewBox="0 0 10 10"><path d="M0 0L10 10"></path></svg>'),/静态回退/u);
});


test('PDF rejects every unsupported non-img resource and navigation entry before rendering',()=>{
  for(const body of [
    '<input type="image" src="https://example.invalid/diagram.png">',
    '<body background="https://example.invalid/diagram.png"><p>正文</p></body>',
    '<math><mglyph src="https://example.invalid/diagram.png"></mglyph></math>',
    '<meta http-equiv="refresh" content="0;url=https://example.invalid/other">',
  ]) assert.throws(()=>buildHtml({label:'不支持入口',isLeaf:true},'类别',()=>body),/静默丢失图解/u);
  assert.doesNotThrow(()=>buildHtml({label:'受支持正文',isLeaf:true},'类别',()=>'<details><summary>原理</summary><p>静态正文。</p></details>'));
});

test('reader Mermaid diagrams require reviewed static PDF conversion instead of becoming code',()=>{
  const diagram='```mermaid\ngraph LR\n A --> B\n```';
  assert.throws(()=>buildHtml({label:'流程',isLeaf:true},'类别',()=>diagram),/Mermaid 静态图解/u);
  assert.doesNotThrow(()=>buildHtml({label:'代码示例',isLeaf:true},'类别',()=> '````markdown\n'+diagram+'\n````'));
});


test('PDF preflight rejects compound SVG and disguised bytes despite a matching outer file hash',()=>reviewFixture(async f=>{
  const origin='https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/';
  for(const body of [
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.invalid/chart.png"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(https://example.invalid/style.css);</style></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><script>externalCall()</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>other content</div></foreignObject></svg>',
  ]) {
    for(const name of ['compound.svg','disguised.png']) {
      const path='images/'+name,bytes=Buffer.from(body);
      await writeFile(join(f.root,path),bytes);
      const html=buildHtml({label:'图解',isLeaf:true},'类别',()=>`![图解](${origin}${name})`).html;
      await assert.rejects(preflightPdfImages(f.root,html,new Map([[path,sha256(bytes)]])),/图片格式或字节头不受支持/u);
    }
  }
}));

test('PDF preflight requires canonical local bytes with the exact approved hash and explicit MIME',()=>reviewFixture(async f=>{
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR7cAAAAASUVORK5CYII=','base64');
  const path='images/image.png';await writeFile(join(f.root,path),bytes);
  const html=buildHtml({label:'图片',isLeaf:true},'类别',()=>`![图解](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/${path})`).html;
  assert.equal(await preflightPdfImages(f.root,html,new Map([[path,sha256(bytes)]])),1);
  assert.equal(reviewedRasterImageType(path,bytes),'image/png');
  await assert.rejects(preflightPdfImages(f.root,html,new Map([[path,'0'.repeat(64)]])),/已审版本不一致/u);
  await assert.rejects(preflightPdfImages(f.root,html.replace('/images/image.png','/other/image.png'),new Map([[path,sha256(bytes)]])),/固定的资源输入范围/u);
}));
