import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, open, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { gitPublicationFiles } from '../scripts/content-review.mjs';
import { createImmutableGitReader } from '../scripts/git-immutable.mjs';
import { git } from './release-review-fixture.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function repository(run) {
  const root = await mkdtemp(join(tmpdir(), 'immutable-git-'));
  try {
    await mkdir(join(root, 'knowledge/topic'), { recursive: true });
    git(root, 'init', '-q');
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('1269 binary publication paths are hashed exactly with one real batched blob process', () => repository(async root => {
  const bytes = Buffer.from([0, 255, 10, 128, 13, 0, 195, 40]);
  await Promise.all(Array.from({ length: 1269 }, (_, i) => writeFile(join(root, `knowledge/topic/item-${i}.md`), bytes)));
  const other = Buffer.from([10, 0, 255, 10, 128, 0]);
  await writeFile(join(root, 'knowledge/topic/item-1.md'), Buffer.alloc(0));
  await writeFile(join(root, 'knowledge/topic/item-2.md'), other);
  git(root, 'add', '.'); git(root, 'update-index', '--chmod=+x', 'knowledge/topic/item-3.md'); git(root, 'commit', '-qm', 'binary snapshot');
  const commit = git(root, 'rev-parse', 'HEAD'), trace = join(root, 'git-trace.json');
  const previousTrace = process.env.GIT_TRACE2_EVENT;
  process.env.GIT_TRACE2_EVENT = trace;
  let inventory;
  try { inventory = gitPublicationFiles(root, commit); }
  finally {
    if (previousTrace === undefined) delete process.env.GIT_TRACE2_EVENT;
    else process.env.GIT_TRACE2_EVENT = previousTrace;
  }
  assert.equal(inventory.length, 1269);
  assert.equal(inventory.find(row => row.path === 'knowledge/topic/item-1.md').sha256, hash(Buffer.alloc(0)));
  assert.equal(inventory.find(row => row.path === 'knowledge/topic/item-2.md').sha256, hash(other));
  assert.ok(inventory.filter(row => !['knowledge/topic/item-1.md', 'knowledge/topic/item-2.md'].includes(row.path)).every(row => row.sha256 === hash(bytes)));
  assert.equal(new Set(inventory.map(row => row.path)).size, 1269);
  const starts = (await readFile(trace, 'utf8')).trim().split('\n').map(JSON.parse).filter(row => row.event === 'start');
  const catFiles = starts.filter(row => row.argv.includes('cat-file'));
  assert.equal(catFiles.filter(row => row.argv.includes('--batch')).length, 1);
  assert.ok(catFiles.length <= 2, `expected bounded Git processes, got ${catFiles.length}`);
  // A new invocation must still observe the immutable commit, never the worktree.
  await writeFile(join(root, 'knowledge/topic/item-0.md'), 'mutable bytes');
  assert.deepEqual(gitPublicationFiles(root, commit), inventory);
}));

test('immutable publication reads reject mutable refs, noncommits, unsafe paths and symlink blobs', () => repository(async root => {
  await writeFile(join(root, 'knowledge/topic/valid.md'), 'valid');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'valid');
  const commit = git(root, 'rev-parse', 'HEAD');
  for (const invalid of ['HEAD', commit.slice(0, 12), '0'.repeat(40), git(root, 'rev-parse', 'HEAD:knowledge/topic/valid.md')]) {
    assert.throws(() => gitPublicationFiles(root, invalid));
  }
  await writeFile(join(root, 'knowledge/topic/bad\tname.md'), 'invalid path');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'unsafe path');
  assert.throws(() => gitPublicationFiles(root, git(root, 'rev-parse', 'HEAD')), /路径/u);
  await rm(join(root, 'knowledge/topic/bad\tname.md'));
  await symlink('valid.md', join(root, 'knowledge/topic/link.md'));
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'symbolic link');
  assert.throws(() => gitPublicationFiles(root, git(root, 'rev-parse', 'HEAD')), /非普通/u);
}));

test('immutable reads do not leak snapshots between real repositories', () => repository(async first => repository(async second => {
  for (const [root, body] of [[first, 'first repository'], [second, 'second repository']]) {
    await writeFile(join(root, 'knowledge/topic/item.md'), body);
    git(root, 'add', '.'); git(root, 'commit', '-qm', 'snapshot');
  }
  const a = gitPublicationFiles(first, git(first, 'rev-parse', 'HEAD'));
  const b = gitPublicationFiles(second, git(second, 'rev-parse', 'HEAD'));
  assert.deepEqual(a, [{ path: 'knowledge/topic/item.md', sha256: hash('first repository') }]);
  assert.deepEqual(b, [{ path: 'knowledge/topic/item.md', sha256: hash('second repository') }]);
})));

test('one immutable reader reuses exact baseline bodies without exposing a mutable cache', () => repository(async root => {
  const path = 'knowledge/topic/item.md', bytes = Buffer.from([10, 255, 0, 128]);
  await writeFile(join(root, path), bytes);
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'baseline');
  const commit = git(root, 'rev-parse', 'HEAD'), reader = createImmutableGitReader(root);
  assert.deepEqual(reader.publicationFiles(commit), [{ path, sha256: hash(bytes) }]);
  const trace = join(root, 'reuse-trace.json'), previousTrace = process.env.GIT_TRACE2_EVENT;
  process.env.GIT_TRACE2_EVENT = trace;
  try {
    reader.readFile(commit, path).fill(0); // The caller cannot mutate cached bytes.
    await writeFile(join(root, path), 'mutable working body');
    assert.deepEqual(reader.readFile(commit, path), bytes);
    assert.deepEqual(reader.publicationFiles(commit), [{ path, sha256: hash(bytes) }]);
    assert.throws(() => reader.readFile('HEAD', path));
    assert.throws(() => reader.readFile(commit, '../private.txt'));
    assert.throws(() => reader.readFile(commit, 'private.txt'));
  } finally {
    if (previousTrace === undefined) delete process.env.GIT_TRACE2_EVENT;
    else process.env.GIT_TRACE2_EVENT = previousTrace;
  }
  await assert.rejects(readFile(trace), { code: 'ENOENT' });
}));

test('oversized immutable blobs are rejected from metadata before any content read', () => repository(async root => {
  const handle = await open(join(root, 'knowledge/topic/oversized.md'), 'w');
  try { await handle.truncate(64 * 1024 * 1024 + 1); }
  finally { await handle.close(); }
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'oversized blob');
  assert.throws(() => gitPublicationFiles(root, git(root, 'rev-parse', 'HEAD')), /大小限制/u);
}));

test('full commit snapshots ignore mutable replacement refs', () => repository(async root => {
  const path = 'knowledge/topic/item.md';
  await writeFile(join(root, path), 'original immutable body');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'original');
  const original = git(root, 'rev-parse', 'HEAD');
  await writeFile(join(root, path), 'mutable replacement body');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'replacement');
  git(root, 'replace', original, git(root, 'rev-parse', 'HEAD'));
  assert.deepEqual(gitPublicationFiles(root, original), [{ path, sha256: hash('original immutable body') }]);
}));

test('large valid inventories split into bounded batches without losing binary hashes', () => repository(async root => {
  const size = 16 * 1024 * 1024, expected = [];
  for (let i = 0; i < 5; i += 1) {
    const path = `knowledge/topic/large-${i}.md`, handle = await open(join(root, path), 'w');
    try { await handle.truncate(size); await handle.write(Buffer.from([i]), 0, 1, size - 1); }
    finally { await handle.close(); }
    expected.push({ path, sha256: createHash('sha256').update(Buffer.alloc(size - 1)).update(Buffer.from([i])).digest('hex') });
  }
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'bounded aggregate');
  const commit = git(root, 'rev-parse', 'HEAD'), trace = join(root, 'bounded-trace.json'), previousTrace = process.env.GIT_TRACE2_EVENT;
  process.env.GIT_TRACE2_EVENT = trace;
  try { assert.deepEqual(gitPublicationFiles(root, commit), expected); }
  finally {
    if (previousTrace === undefined) delete process.env.GIT_TRACE2_EVENT;
    else process.env.GIT_TRACE2_EVENT = previousTrace;
  }
  const starts = (await readFile(trace, 'utf8')).trim().split('\n').map(JSON.parse).filter(row => row.event === 'start');
  assert.equal(starts.filter(row => row.argv.includes('--batch')).length, 2);
}));
