import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadVerified, describeError } from '../scripts/build-materials.mjs';

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
