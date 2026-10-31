import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { safeRelativePath } from './resource-paths.mjs';

const MAX_BLOB_BYTES = 64 * 1024 * 1024;
const MAX_BATCH_BYTES = 64 * 1024 * 1024;
const PUBLIC_PATHS = ['interview', 'knowledge', 'images', 'class', '.codex/image-resync.txt'];

// One reader belongs to one invocation and one real repository. Only immutable
// commit/blob data is memoized; callers never put working files or decisions here.
export function createImmutableGitReader(root) {
  const cwd = realpathSync(root), snapshots = new Map(), hashes = new Map(), bodies = new Map();
  let cachedBytes = 0;
  function git(args, options = {}) {
    const result = spawnSync('git', ['--no-replace-objects', ...args], { cwd, maxBuffer: MAX_BATCH_BYTES, ...options });
    if (result.status !== 0 || result.error) throw new Error('审核基线文件不可读');
    return result.stdout;
  }
  function entriesAt(commit) {
    if (!/^[a-f0-9]{40}$/u.test(commit ?? '')) throw new Error('审核基线必须是完整 commit SHA');
    if (snapshots.has(commit)) return snapshots.get(commit);
    if (git(['cat-file', '-t', commit]).toString().trim() !== 'commit') throw new Error('审核 commit 不可读');
    const listing = git(['ls-tree', '-rlz', commit, '--', ...PUBLIC_PATHS]);
    const entries = new Map();
    let start = 0;
    while (start < listing.length) {
      const end = listing.indexOf(0, start);
      if (end < 0) throw new Error('审核基线资源清单无效');
      const record = listing.subarray(start, end), tab = record.indexOf(9);
      if (tab < 0) throw new Error('审核基线资源清单无效');
      const metadata = /^(\d{6}) ([a-z]+) ([a-f0-9]{40}) +(\d+|-)$/u.exec(record.subarray(0, tab).toString('ascii'));
      const path = record.subarray(tab + 1).toString('utf8');
      safeRelativePath(path);
      if (!metadata || !['100644', '100755'].includes(metadata[1]) || metadata[2] !== 'blob') throw new Error('审核基线包含非普通资源');
      const size = Number(metadata[4]);
      if (!Number.isSafeInteger(size) || size < 0 || size > MAX_BLOB_BYTES) throw new Error('审核基线文件超过大小限制');
      if (entries.has(path)) throw new Error('审核基线资源路径重复');
      entries.set(path, { path, oid: metadata[3], size });
      start = end + 1;
    }
    snapshots.set(commit, entries);
    return entries;
  }
  function remember(oid, bytes) {
    hashes.set(oid, createHash('sha256').update(bytes).digest('hex'));
    if (bodies.has(oid)) { cachedBytes -= bodies.get(oid).length; bodies.delete(oid); }
    while (cachedBytes + bytes.length > MAX_BATCH_BYTES && bodies.size) {
      const oldest = bodies.keys().next().value;
      cachedBytes -= bodies.get(oldest).length; bodies.delete(oldest);
    }
    // Copy each body so a tiny slice cannot retain an entire batch buffer.
    bodies.set(oid, Buffer.from(bytes)); cachedBytes += bytes.length;
  }
  function readBatch(batch) {
    if (!batch.length) return;
    const expectedBytes = batch.reduce((total, entry) => total + entry.size + 96, 0);
    const output = git(['cat-file', '--batch'], { input: batch.map(entry => `${entry.oid}\n`).join(''), maxBuffer: expectedBytes });
    let offset = 0;
    for (const entry of batch) {
      const end = output.indexOf(10, offset);
      if (end < 0) throw new Error('审核基线批量文件头无效');
      const header = /^([a-f0-9]{40}) blob (\d+)$/u.exec(output.subarray(offset, end).toString('ascii'));
      if (!header || header[1] !== entry.oid || Number(header[2]) !== entry.size) throw new Error('审核基线批量文件类型或大小不一致');
      offset = end + 1;
      if (offset + entry.size >= output.length || output[offset + entry.size] !== 10) throw new Error('审核基线批量文件内容不完整');
      remember(entry.oid, output.subarray(offset, offset + entry.size));
      offset += entry.size + 1;
    }
    if (offset !== output.length) throw new Error('审核基线批量文件含多余数据');
  }
  function load(entries) {
    const unique = new Map(entries.map(entry => [entry.oid, entry]));
    let batch = [], size = 0;
    for (const entry of unique.values()) {
      const cost = entry.size + 96;
      if (batch.length && size + cost > MAX_BATCH_BYTES) { readBatch(batch); batch = []; size = 0; }
      batch.push(entry); size += cost;
    }
    readBatch(batch);
  }
  return {
    publicationFiles(commit) {
      const entries = [...entriesAt(commit).values()];
      load(entries.filter(entry => !hashes.has(entry.oid)));
      return entries.map(entry => ({ path: entry.path, sha256: hashes.get(entry.oid) })).sort((a, b) => a.path.localeCompare(b.path, 'en'));
    },
    readFile(commit, path) {
      safeRelativePath(path);
      const entry = entriesAt(commit).get(path);
      if (!entry) throw new Error('审核基线文件不在普通公开资源清单');
      if (!bodies.has(entry.oid)) load([entry]);
      const bytes = bodies.get(entry.oid);
      bodies.delete(entry.oid); bodies.set(entry.oid, bytes);
      return Buffer.from(bytes);
    },
  };
}
