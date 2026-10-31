import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { git } from './release-review-fixture.mjs';
import { requireReviewedRelease } from '../scripts/validate-release.mjs';

for (const trees of ['missing', 'malformed']) test(`release preflight rejects bad range and HEAD before ${trees} public trees or API reads`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'release-preflight-'));
  const oldActions = process.env.GITHUB_ACTIONS, oldSha = process.env.GITHUB_SHA;
  delete process.env.GITHUB_ACTIONS; delete process.env.GITHUB_SHA;
  try {
    git(root, 'init', '-q');
    await writeFile(join(root, 'README.md'), 'Real Git release fixture.');
    git(root, 'add', '.'); git(root, 'commit', '-qm', 'baseline');
    const head = git(root, 'rev-parse', 'HEAD');
    if (trees === 'malformed') for (const module of ['interview', 'knowledge']) {
      await mkdir(join(root, module));
      await writeFile(join(root, module, '_tree.json'), '[malformed public tree');
    }
    let apiReads = 0;
    const options = { read: async () => { apiReads += 1; throw new Error('API must not be reached'); } };
    for (const [before, after, reason] of [
      [head, '0'.repeat(40), /未检出待发布最终提交/u],
      [undefined, head, /完整 commit SHA/u],
      [head, undefined, /完整 commit SHA/u],
      ['HEAD', head, /完整 commit SHA/u],
      [head, head.slice(0, 12), /完整 commit SHA/u],
      ['0'.repeat(40), head, /非有效祖先链/u],
    ]) await assert.rejects(requireReviewedRelease(root, before, after, options), reason);
    process.env.GITHUB_ACTIONS = 'true'; process.env.GITHUB_SHA = 'e'.repeat(40);
    await assert.rejects(requireReviewedRelease(root, head, head, options), /跨提交重放/u);
    delete process.env.GITHUB_ACTIONS; delete process.env.GITHUB_SHA;
    // Correct immutable inputs still run the original public content gate.
    await assert.rejects(requireReviewedRelease(root, head, head, options), /公开结构校验失败/u);
    assert.equal(apiReads, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
    if (oldActions === undefined) delete process.env.GITHUB_ACTIONS; else process.env.GITHUB_ACTIONS = oldActions;
    if (oldSha === undefined) delete process.env.GITHUB_SHA; else process.env.GITHUB_SHA = oldSha;
  }
});
