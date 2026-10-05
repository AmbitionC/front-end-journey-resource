import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { buildHtml, localReviewedImagePath, validatePdfHtml } from '../scripts/build-materials.mjs';
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
