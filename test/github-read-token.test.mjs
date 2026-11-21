import test from 'node:test';
import assert from 'node:assert/strict';
import { githubRead, githubReadHeaders } from '../scripts/github-release-review.mjs';

test('githubRead stays anonymous when no read token is set', async () => {
  let seen;
  const fetchImpl = async (url, init) => { seen = {url, init}; return {ok:true, json:async()=>({ok:1})}; };
  assert.deepEqual(await githubRead('pulls/1', {env:{}, fetchImpl}), {ok:1});
  assert.equal(seen.url, 'https://api.github.com/repos/AmbitionC/front-end-journey-resource/pulls/1');
  assert.equal(seen.init.redirect, 'error');
  assert.equal('Authorization' in seen.init.headers, false);
  assert.equal('Authorization' in githubReadHeaders({GITHUB_RELEASE_READ_TOKEN:'   '}), false);
});

test('githubRead sends the optional read token only to the fixed API host', async () => {
  let seen;
  const fetchImpl = async (url, init) => { seen = {url, init}; return {ok:true, json:async()=>[]}; };
  await githubRead('issues/2/comments?per_page=100&page=1', {env:{GITHUB_RELEASE_READ_TOKEN:'t0k'}, fetchImpl});
  assert.match(seen.url, /^https:\/\/api\.github\.com\/repos\/AmbitionC\/front-end-journey-resource\//u);
  assert.equal(seen.init.headers.Authorization, 'Bearer t0k');
});

test('githubRead stays fail-closed with a token and never echoes it', async () => {
  const fetchImpl = async () => ({ok:false, status:403, json:async()=>({})});
  await assert.rejects(githubRead('', {env:{GITHUB_RELEASE_READ_TOKEN:'secret-value'}, fetchImpl}), err => {
    assert.match(err.message, /HTTP 403/u);
    assert.doesNotMatch(err.message, /secret-value/u);
    return true;
  });
});
