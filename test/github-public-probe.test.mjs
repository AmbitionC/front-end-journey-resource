import assert from 'node:assert/strict';
import test from 'node:test';
import { githubRead, diagnoseGithubRead } from '../scripts/github-public-read.mjs';
import { diagnosticEndpoints, diagnoseFailedPr58Gate } from '../scripts/diagnose-github-public-read.mjs';

test('fixed historical probe visits each original gate endpoint once and stops on first failure',async()=>{
  const calls=[];
  await diagnoseFailedPr58Gate(async path=>{calls.push(path);});
  assert.deepEqual(calls,[...diagnosticEndpoints]);
  assert.equal(new Set(calls).size,8);
  assert.equal(Object.isFrozen(diagnosticEndpoints),true);
  assert.deepEqual(calls,[
    '', 'branches/master',
    'commits/66e58daf5b855ca8e4a8ba1ef851c4d42a94f9d0/pulls?per_page=100&page=1',
    'pulls/58','pulls/58/reviews?per_page=100&page=1','issues/58/comments?per_page=100&page=1',
    'actions/runs?head_sha=345adb7562f703de38eb8e7a51d27a72d62caa2e&per_page=100',
    'actions/workflows/sync.yml/runs?head_sha=66e58daf5b855ca8e4a8ba1ef851c4d42a94f9d0&per_page=100',
  ]);
  const failed=[];
  await assert.rejects(diagnoseFailedPr58Gate(async path=>{
    failed.push(path);if(path==='branches/master')throw new Error('HTTP403');
  }),/HTTP403/u);
  assert.deepEqual(failed,['','branches/master']);
});

test('diagnostic success logs bounded headers and no body, while normal release reads remain silent',async()=>{
  const oldFetch=globalThis.fetch,oldLog=console.log,oldError=console.error;
  const calls=[],logs=[],errors=[];
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    return Response.json({privateBody:'NEVER_EMIT',token:'SECRET_SENTINEL'},{
      headers:{'x-github-request-id':'ABCD:1234','x-ratelimit-limit':'60',
        'x-ratelimit-remaining':'55','x-ratelimit-reset':'1792155600',
        'x-ratelimit-used':'5','x-ratelimit-resource':'core','retry-after':'3',
        authorization:'Bearer SECRET_HEADER','set-cookie':'SECRET_COOKIE'},
    });
  };
  console.log=(...x)=>logs.push(x);console.error=(...x)=>errors.push(x);
  try {
    assert.deepEqual(await githubRead('pulls/58'),{privateBody:'NEVER_EMIT',token:'SECRET_SENTINEL'});
    assert.deepEqual(logs,[]);
    assert.equal(await diagnoseGithubRead('pulls/58'),undefined);
    assert.equal(calls.length,2);assert.equal(logs.length,1);assert.deepEqual(errors,[]);
    const row=JSON.parse(logs[0][0]);
    assert.deepEqual(row,{endpoint:'/repos/AmbitionC/front-end-journey-resource/pulls/58',status:200,
      'x-github-request-id':'ABCD:1234','x-ratelimit-limit':'60','x-ratelimit-remaining':'55',
      'x-ratelimit-reset':'1792155600','x-ratelimit-used':'5','x-ratelimit-resource':'core','retry-after':'3'});
    assert.doesNotMatch(JSON.stringify(logs),/NEVER_EMIT|SECRET|authorization|set-cookie/u);
    for(const call of calls) {
      assert.equal(call.options.method,'GET');assert.equal(call.options.redirect,'error');
      assert.deepEqual(call.options.headers,{Accept:'application/vnd.github+json'});
    }
  } finally {globalThis.fetch=oldFetch;console.log=oldLog;console.error=oldError;}
});

test('diagnostic does not reflect unsafe headers or retry a403 response',async()=>{
  const oldFetch=globalThis.fetch,oldLog=console.log,oldError=console.error;
  let calls=0;const logs=[],errors=[];
  console.log=(...x)=>logs.push(x);console.error=(...x)=>errors.push(x);
  globalThis.fetch=async()=>{
    calls++;
    return Response.json({message:'Forbidden secret dynamic tail',secret:'HIDDEN'},{
      status:403,headers:{'x-github-request-id':'invalid value','x-ratelimit-limit':'-2',
        authorization:'Bearer HIDDEN','retry-after':'200'},
    });
  };
  try{
    await assert.rejects(diagnoseGithubRead('branches/master'),/HTTP 403/u);
    assert.equal(calls,1);assert.deepEqual(logs,[]);
    assert.deepEqual(JSON.parse(errors[0][0]),{endpoint:'/repos/AmbitionC/front-end-journey-resource/branches/master',
      status:403,'retry-after':'200',message:'Forbidden'});
    assert.doesNotMatch(JSON.stringify(errors),/secret|HIDDEN|dynamic/u);
  } finally {globalThis.fetch=oldFetch;console.log=oldLog;console.error=oldError;}
});
