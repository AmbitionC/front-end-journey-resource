import assert from 'node:assert/strict';
import test from 'node:test';
import { githubRead } from '../scripts/github-release-review.mjs';

const base='https://api.github.com/repos/AmbitionC/front-end-journey-resource';
const sha='a'.repeat(40);

async function capture(transport,run) {
  const beforeFetch=globalThis.fetch,beforeError=console.error,calls=[],logs=[];
  globalThis.fetch=async(...args)=>{calls.push(args);return transport(...args);};
  console.error=(...args)=>logs.push(args);
  try {await run({calls,logs});}
  finally {globalThis.fetch=beforeFetch;console.error=beforeError;}
}

function failure(status,body,headers={}) {
  const response=new Response(body,{status});
  return {ok:false,status,body:response.body,headers:{get:name=>headers[name]??null}};
}

test('successful public reads preserve JSON, use only GET+Accept, and emit no diagnostic',async()=>{
  const paths=['','branches/master',`commits/${sha}/pulls?per_page=100&page=100`,
    'pulls/58','pulls/58/reviews?per_page=100&page=1','issues/58/comments?per_page=100&page=2',
    `actions/runs?head_sha=${sha}&per_page=100`,`actions/workflows/sync.yml/runs?head_sha=${sha}&per_page=100`];
  const oldToken=process.env.GITHUB_TOKEN,oldGhToken=process.env.GH_TOKEN;
  process.env.GITHUB_TOKEN='ghp_TEST_NEVER_TRANSMIT';process.env.GH_TOKEN='github_pat_TEST_NEVER_TRANSMIT';
  try {
    await capture(()=>Response.json({ok:true}),async({calls,logs})=>{
      for(const path of paths) assert.deepEqual(await githubRead(path),{ok:true});
      assert.equal(calls.length,paths.length);assert.deepEqual(logs,[]);
      for(const [index,[url,options]] of calls.entries()) {
        assert.equal(url,base+(paths[index]?`/${paths[index]}`:''));
        assert.equal(options.method,'GET');
        assert.deepEqual(options.headers,{Accept:'application/vnd.github+json'});
        assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);
        assert.deepEqual(Object.keys(options).sort(),['headers','method','redirect','signal']);
      }
    });
  } finally {
    if(oldToken===undefined)delete process.env.GITHUB_TOKEN;else process.env.GITHUB_TOKEN=oldToken;
    if(oldGhToken===undefined)delete process.env.GH_TOKEN;else process.env.GH_TOKEN=oldGhToken;
  }
});

test('403/429 log only fixed safe headers and canonical message; fail closed with one request',async()=>{
  for(const status of [403,429]) {
    await capture(()=>failure(status,JSON.stringify({message:'API rate limit exceeded for 192.0.2.5. TOKEN_SECRET',
      documentation_url:'SECRET_BODY_URL',errors:[{message:'SECRET_NESTED_BODY'}]}),{
      'x-github-request-id':'C123:ABCD:123:6789:DEADBEEF','x-ratelimit-limit':'60',
      'x-ratelimit-remaining':'0','x-ratelimit-reset':'1792148400','x-ratelimit-used':'60',
      'x-ratelimit-resource':'core','retry-after':'120','authorization':'Bearer SECRET_HEADER',
      'set-cookie':'SECRET_COOKIE','x-ratelimit-secret':'SECRET_ARBITRARY_RATE_HEADER',
    }),async({calls,logs})=>{
      await assert.rejects(githubRead('branches/master'),new RegExp(`HTTP ${status}`));
      assert.equal(calls.length,1);assert.equal(logs.length,1);assert.equal(logs[0].length,1);
      assert.deepEqual(JSON.parse(logs[0][0]),{endpoint:'/repos/AmbitionC/front-end-journey-resource/branches/master',status,
        'x-github-request-id':'C123:ABCD:123:6789:DEADBEEF','x-ratelimit-limit':'60','x-ratelimit-remaining':'0',
        'x-ratelimit-reset':'1792148400','x-ratelimit-used':'60','x-ratelimit-resource':'core',
        'retry-after':'120',message:'API rate limit exceeded'});
      assert.doesNotMatch(JSON.stringify(logs),/SECRET|192\.0\.2\.5|Bearer|documentation|cookie|authorization/u);
    });
  }
});

test('oversized/control/injected headers and message text cannot become log fields',async()=>{
  const unsafe=[['x-github-request-id','ABCD\n::error::INJECT'],['x-github-request-id','A'.repeat(81)],
    ['x-ratelimit-limit','1'.repeat(21)],['x-ratelimit-remaining','0\r\nINJECT'],
    ['x-ratelimit-reset','1792148400\u001b[31m'],['x-ratelimit-used','\u202e123'],
    ['x-ratelimit-resource','ghp_SECRET'],['retry-after','1\t2'],['retry-after','9'.repeat(81)]];
  for(const [name,value] of unsafe) {
    await capture(()=>failure(403,JSON.stringify({message:'ghp_SECRET\n::warning::INJECT'+'x'.repeat(10000)}),{[name]:value}),
      async({calls,logs})=>{
        await assert.rejects(githubRead('pulls/58'),/HTTP 403/u);assert.equal(calls.length,1);
        const record=JSON.parse(logs[0][0]);assert.equal(record[name],undefined);assert.equal(record.message,'[omitted]');
        assert.ok(logs[0][0].length<200);assert.doesNotMatch(logs[0][0],/SECRET|INJECT|\r|\n|\u001b|\u202e/u);
      });
  }
});

test('message extraction emits only bounded known prefixes and never arbitrary error envelope',async()=>{
  for(const [body,expected] of [
    [JSON.stringify({message:'You have exceeded a secondary rate limit. '+'ghp_SECRET'.repeat(400)}),'You have exceeded a secondary rate limit'],
    [JSON.stringify({message:'Forbidden\n::error::INJECT'}),'[omitted]'],
    [JSON.stringify({message:'Bad credentials SECRET_SUFFIX'}),'Bad credentials'],
    [JSON.stringify({message:{token:'SECRET'}}),'[omitted]'],
    ['<html>SECRET_HTML</html>','[omitted]'],
    ['null','[omitted]'],
    [JSON.stringify({message:'Not Found',arbitrary:'SECRET'}),'Not Found'],
    [JSON.stringify({message:'API rate limit exceeded',padding:'x'.repeat(8192)}),'[omitted]'],
  ]) {
    await capture(()=>failure(429,body),async({calls,logs})=>{
      await assert.rejects(githubRead(''),/HTTP 429/u);assert.equal(calls.length,1);
      assert.equal(JSON.parse(logs[0][0]).message,expected);
      assert.doesNotMatch(JSON.stringify(logs),/SECRET|INJECT|padding|arbitrary/u);
      assert.ok(JSON.parse(logs[0][0]).message.length<=160);
    });
  }
});

test('error envelope reading stops and cancels once the fixed 8 KiB bound is exceeded',async()=>{
  let reads=0,cancels=0,releases=0;
  const reader={read:async()=>{reads++;return {done:false,value:new Uint8Array(4096)};},
    cancel:async()=>{cancels++;},releaseLock:()=>{releases++;}};
  await capture(()=>({ok:false,status:403,headers:{get:()=>null},body:{getReader:()=>reader}}),async({calls,logs})=>{
    await assert.rejects(githubRead(''),/HTTP 403/u);assert.equal(calls.length,1);
    assert.equal(reads,3);assert.equal(cancels,1);assert.equal(releases,1);
    assert.equal(JSON.parse(logs[0][0]).message,'[omitted]');
  });
});

test('network/redirect/timeouts stay fail closed and never echo exception details or retry',async()=>{
  for(const name of ['TypeError','TimeoutError','AbortError']) {
    await capture(()=>{throw Object.assign(new Error('Bearer SECRET_FETCH\n::error::INJECT'),{name});},async({calls,logs})=>{
      await assert.rejects(githubRead('branches/master'),/GitHub 审核证据无法读取（网络错误）/u);
      assert.equal(calls.length,1);assert.equal(logs.length,1);
      assert.deepEqual(JSON.parse(logs[0][0]),{endpoint:'/repos/AmbitionC/front-end-journey-resource/branches/master',
        status:'network_error',message:'Network request failed'});
      assert.doesNotMatch(JSON.stringify(logs),/SECRET|INJECT|Bearer/u);
    });
  }
});

test('malformed successful JSON remains fail closed without echoing response text',async()=>{
  await capture(()=>new Response('SECRET_INVALID_JSON\n::error::INJECT',{status:200}),async({calls,logs})=>{
    await assert.rejects(githubRead(''),error=>{
      assert.equal(error.message,'GitHub 审核证据格式无效');return true;
    });
    assert.equal(calls.length,1);assert.deepEqual(logs,[]);
  });
});

test('non-public/unrecognized paths, injected queries and unsafe IDs are rejected before fetch',async()=>{
  await capture(()=>{throw new Error('unexpected network call');},async({calls,logs})=>{
    for(const path of [undefined,null,{},'https://evil.example/x','//evil.example','../other',
      'branches/master\nTOKEN','branches/master?access_token=SECRET','branches/%6daster',
      'pulls/0','pulls/01','pulls/9007199254740992','pulls/58/reviews?per_page=100&page=101',
      'issues/58/comments?per_page=100&page=1&token=SECRET',`actions/runs?head_sha=${sha}&per_page=100&host=evil`,
      `actions/workflows/build-materials.yml/runs?head_sha=${sha}&per_page=100`,
      'pulls/58/../59','pulls/58%0aSECRET']) {
      await assert.rejects(githubRead(path),/公开读取白名单/u);
    }
    assert.equal(calls.length,0);assert.deepEqual(logs,[]);
  });
});
