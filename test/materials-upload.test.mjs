import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadVerified, describeError, attemptTimeoutFor } from '../scripts/build-materials.mjs';

function fakeClient({ failPuts = 0 } = {}) {
  const store = new Map();
  let puts = 0;
  return {
    get puts() { return puts; },
    async put(key, bytes) { puts++; if (puts <= failPuts) throw Object.assign(new Error('ResponseTimeoutError: timeout\nstack'), { name: 'ResponseTimeoutError' }); store.set(key, Buffer.from(bytes)); },
    async get(key) { return { content: store.get(key) }; },
    async getACL() { return { acl: 'private' }; },
  };
}

test('上传超时后重试，读回校验通过即成功', async () => {
  const client = fakeClient({ failPuts: 2 });
  const r = await uploadVerified(client, 'materials/civil/a.pdf', Buffer.from('%PDF'), 'application/pdf', { wait: async () => {} });
  assert.equal(client.puts, 3);
  assert.equal(r.acl, 'private');
});

test('重试用尽仍失败则抛出原错误', async () => {
  const client = fakeClient({ failPuts: 5 });
  await assert.rejects(uploadVerified(client, 'k', Buffer.from('x'), 'application/pdf', { wait: async () => {} }), /ResponseTimeoutError/u);
  assert.equal(client.puts, 3);
});

test('错误描述只取首行，并抹掉密钥', () => {
  const env = { OSS_ACCESS_KEY_ID: 'AKIDsecret', OSS_ACCESS_KEY_SECRET: 'verysecret' };
  const text = describeError(Object.assign(new Error('bad AKIDsecret verysecret\nmore'), { code: 'X', status: 403 }), env);
  assert.equal(text, 'Error · X · HTTP 403 · bad *** ***');
});

test('一次上传挂住不返回时，看门狗放弃并重试', async () => {
  const client = fakeClient();
  let calls = 0;
  const realPut = client.put.bind(client);
  client.put = (...args) => (++calls === 1 ? new Promise(() => {}) : realPut(...args));
  const r = await uploadVerified(client, 'materials/soe/a.pdf', Buffer.from('%PDF'), 'application/pdf', { attemptTimeoutMs: 20, wait: async () => {} });
  assert.equal(calls, 2);
  assert.equal(r.acl, 'private');
});

test('大文件走分片上传并带私有 ACL，小文件仍用 put', async () => {
  const client = fakeClient();
  const calls = [];
  client.multipartUpload = async (key, bytes, opts) => { calls.push(['multi', opts.headers['x-oss-object-acl'], opts.partSize]); await client.put(key, bytes); };
  const realPut = client.put.bind(client);
  client.put = async (...a) => { calls.push(['put']); return realPut(...a); };
  await uploadVerified(client, 'big.pdf', Buffer.alloc(5 * 1024 * 1024, 1), 'application/pdf', { wait: async () => {} });
  await uploadVerified(client, 'small.pdf', Buffer.alloc(1024, 1), 'application/pdf', { wait: async () => {} });
  assert.deepEqual(calls[0], ['multi', 'private', 1024 * 1024]);
  assert.deepEqual(calls.slice(-1), [['put']]);
});

test('单次时限随文件大小放宽', () => {
  assert.equal(attemptTimeoutFor(1024), 6 * 60 * 1000);
  assert.equal(attemptTimeoutFor(17.3 * 1024 * 1024), 18 * 60 * 1000);
});
