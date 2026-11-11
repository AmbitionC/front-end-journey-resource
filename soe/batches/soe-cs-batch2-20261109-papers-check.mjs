// Run from any directory: node soe/batches/soe-cs-batch2-20261109-papers-check.mjs
// Recompute from question inputs, then bind results to the selected option.
// Does not alter articles, Git state, the manifest, or the history ledger.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const json = (name) => JSON.parse(read(name));
const hashes = (name) => createHash('sha256').update(read(name)).digest('hex');
const calculations = [];
const parsed = new Map();
const normalized = (s) => s.replace(/[`$\s]/g, '');

for (const paper of ['A', 'B']) {
  const articlePath = `soe/practice/soe-cs-self-test-${paper.toLowerCase()}.md`;
  const body = read(articlePath);
  assert(!/^# /m.test(body), `${paper}: body-only convention`);
  assert(!/\u771f\u9898|DIAGRAM_PENDING|IMAGE2_PENDING/.test(body), `${paper}: forbidden or pending text`);
  const sections = [...body.matchAll(/^### 原创模拟题 ([AB]\d{2})：([^\n]+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)];
  assert.equal(sections.length, 30, `${paper}: question count`);
  const localLinks = new Set();
  const answerCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const [index, section] of sections.entries()) {
    const [, id, title, content] = section;
    assert.equal(id, `${paper}${String(index + 1).padStart(2, '0')}`);
    const options = [...content.matchAll(/^- ([ABCD])\. (.+)$/gm)];
    assert.deepEqual(options.map((m) => m[1]), ['A', 'B', 'C', 'D'], `${id}: four options`);
    const answers = [...content.matchAll(/\*\*答案：([ABCD])。\*\*/g)];
    assert.equal(answers.length, 1, `${id}: unique answer marker`);
    const answer = answers[0][1];
    answerCounts[answer]++;
    assert(content.includes('**解析：**'), `${id}: explanation`);
    assert(content.includes('**对应文章：**'), `${id}: article links`);
    const links = [...content.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    const local = links.filter((url) => !/^https?:\/\//.test(url));
    assert(local.length > 0, `${id}: existing local article association`);
    for (const link of local) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(articlePath), link.split('#')[0]));
      assert(fs.statSync(path.join(root, target)).isFile(), `${id}: missing ${target}`);
      localLinks.add(target);
    }
    assert(body.includes(`| ${id} | ${answer} |`), `${id}: answer summary mismatch`);
    parsed.set(id, { title, answer, options: Object.fromEntries(options.map((m) => [m[1], m[2]])) });
  }
  parsed.set(paper, { articlePath, questions: sections.length, answerCounts, localLinks: [...localLinks].sort() });
}

function record(id, observed, expected, optionText, method) {
  assert.deepEqual(observed, expected, `${id}: independently recomputed result`);
  const question = parsed.get(id);
  const matching = Object.entries(question.options).filter(([, text]) => normalized(text) === normalized(optionText));
  assert.equal(matching.length, 1, `${id}: result must identify exactly one option`);
  assert.equal(matching[0][0], question.answer, `${id}: answer differs from computation`);
  calculations.push({ question: id, answer: question.answer, method, result: observed });
}

const signedByte = new DataView(new Uint8Array([Number.parseInt('11010110', 2)]).buffer).getInt8(0);
record('A02', signedByte, -42, String(signedByte).replace('-', '−'), 'Decode byte with signed DataView semantics.');

const lineCount = (8 * 1024) / 32;
const offsetBits = Math.log2(32);
const indexBits = Math.log2(lineCount);
const tagBits = 32 - offsetBits - indexBits;
record('A03', [tagBits, indexBits, offsetBits], [19, 8, 5], `${tagBits}、${indexBits}、${offsetBits}`, 'Derive line count and bit budget from capacity/block size.');

function subsets(values) {
  return Array.from({ length: 2 ** values.length }, (_, mask) => values.filter((_, bit) => mask & (1 << bit)));
}
function closure(attrs, dependencies) {
  const result = new Set(attrs);
  let previous;
  do {
    previous = result.size;
    for (const [left, right] of dependencies) if (left.every((a) => result.has(a))) right.forEach((a) => result.add(a));
  } while (result.size !== previous);
  return result;
}
function analyzeNormalForm(attrs, dependencies) {
  const sets = subsets(attrs);
  const superkeys = sets.filter((s) => closure(s, dependencies).size === attrs.length);
  const keys = superkeys.filter((s) => !superkeys.some((t) => t.length < s.length && t.every((a) => s.includes(a))));
  const prime = new Set(keys.flat());
  let second = true, third = true, bcnf = true;
  for (const left of sets) {
    const determined = closure(left, dependencies);
    const isSuperkey = determined.size === attrs.length;
    for (const right of determined) {
      if (left.includes(right)) continue;
      if (!isSuperkey) bcnf = false;
      if (!isSuperkey && !prime.has(right)) third = false;
      if (!prime.has(right) && keys.some((key) => left.length < key.length && left.every((a) => key.includes(a)))) second = false;
    }
  }
  return { keys, normalForm: bcnf ? 'BCNF' : third ? '3NF' : second ? '2NF' : '1NF' };
}
const aForm = analyzeNormalForm(['order_no', 'item_no', 'item_name', 'qty'], [[['order_no', 'item_no'], ['qty']], [['item_no'], ['item_name']]]);
record('A04', aForm, { keys: [['order_no', 'item_no']], normalForm: '1NF' }, aForm.normalForm, 'Enumerate every subset, closure, candidate key and implied dependency.');

function replacement(sequence, capacity, mode) {
  const pages = new Map();
  const faultSteps = [];
  for (const [tick, page] of sequence.entries()) {
    if (!pages.has(page)) {
      faultSteps.push(tick + 1);
      if (pages.size === capacity) {
        const victim = [...pages].sort((a, b) => a[1] - b[1])[0][0];
        pages.delete(victim);
      }
      pages.set(page, tick);
    } else if (mode === 'LRU') pages.set(page, tick);
  }
  return faultSteps;
}
const refs = [1, 2, 3, 1, 4, 1, 2, 5, 2, 1];
const fifo = replacement(refs, 3, 'FIFO'), lru = replacement(refs, 3, 'LRU');
record('A07', { FIFO: fifo, LRU: lru }, { FIFO: [1, 2, 3, 5, 6, 7, 8], LRU: [1, 2, 3, 5, 7, 8] }, `${fifo.length}、${lru.length}`, 'Simulate resident pages and choose minimum load/access timestamp.');

function ipv4Block(octets, prefix) {
  const address = octets.reduce((acc, n) => acc * 256 + n, 0);
  const size = 2 ** (32 - prefix);
  const first = Math.floor(address / size) * size;
  const dotted = (n) => [24, 16, 8, 0].map((shift) => Math.floor(n / 2 ** shift) % 256).join('.');
  return { network: dotted(first), broadcast: dotted(first + size - 1), hosts: size - 2 };
}
const ipv4 = ipv4Block([198, 51, 100, 219], 28);
record('A10', ipv4, { network: '198.51.100.208', broadcast: '198.51.100.223', hosts: 14 }, `${ipv4.network}、${ipv4.broadcast}、${ipv4.hosts}`, 'Use integer block boundaries, independent of dotted-decimal shortcut.');

const array = [3, 6, 9, 12, 15], pointerIndex = 1;
record('A12', [array[pointerIndex + 2], array.length - pointerIndex], [12, 4], `${array[pointerIndex + 2]}、${array.length - pointerIndex}`, 'Index an explicit array and subtract legal element positions.');

function layout(members) {
  let end = 0;
  const offsets = [];
  const alignment = Math.max(...members.map((m) => m.alignment));
  for (const { size, alignment: memberAlignment } of members) {
    while (end % memberAlignment !== 0) end++;
    offsets.push(end);
    end += size;
  }
  while (end % alignment !== 0) end++;
  return { offsets, size: end };
}
const structure = layout([{ size: 1, alignment: 1 }, { size: 8, alignment: 8 }, { size: 2, alignment: 2 }]);
record('A13', structure, { offsets: [0, 8, 16], size: 24 }, `${structure.offsets[2]}、${structure.size} B`, 'Allocate each member at the next allowed alignment, then add tail padding.');

function postorder(pre, inorder) {
  if (!pre.length) return [];
  const [rootNode] = pre;
  const leftSize = inorder.indexOf(rootNode);
  assert(leftSize >= 0);
  return [...postorder(pre.slice(1, leftSize + 1), inorder.slice(0, leftSize)), ...postorder(pre.slice(leftSize + 1), inorder.slice(leftSize + 1)), rootNode];
}
const post = postorder('Q M H P W T Z'.split(' '), 'H M P Q T W Z'.split(' ')).join(' ');
record('A17', post, 'H P M T Z W Q', post, 'Reconstruct subtrees by distinct-root positions and traverse recursively.');

function optimalMergeCost(weights) {
  if (weights.length < 2) return 0;
  let best = Infinity;
  for (let i = 0; i < weights.length; i++) for (let j = i + 1; j < weights.length; j++) {
    const merged = weights[i] + weights[j];
    const rest = weights.filter((_, k) => k !== i && k !== j);
    best = Math.min(best, merged + optimalMergeCost([...rest, merged]));
  }
  return best;
}
const weights = [3, 5, 8, 10, 14], minWpl = optimalMergeCost(weights);
record('A18', { minimumBits: minWpl, fixedLengthBits: weights.reduce((a, b) => a + b, 0) * Math.ceil(Math.log2(weights.length)) }, { minimumBits: 88, fixedLengthBits: 120 }, String(minWpl), 'Exhaustively try every pair-merge tree, independently of greedy Huffman steps.');

const t = (n) => n === 1 ? 1 : 2 * t(n / 2) + n;
const s = (n) => n === 1 ? 1 : s(n / 2) + 1;
for (let k = 0; k <= 10; k++) {
  const n = 2 ** k;
  assert.equal(t(n), n * (k + 1));
  assert.equal(s(n), k + 1);
}
record('A19', { T64: t(64), S64: s(64) }, { T64: 448, S64: 7 }, 'Θ(n log n)、Θ(log n)', 'Evaluate recurrences on powers of two and check exact closed forms; asymptotic argument is in the explanation.');

const decisionOutcomes = new Set(), conditionOutcomes = new Set();
for (const [x, y] of [[1, 1], [-1, 1]]) {
  const first = x >= 0;
  conditionOutcomes.add(`x:${first}`);
  if (first) conditionOutcomes.add(`y:${y >= 0}`);
  decisionOutcomes.add(first && y >= 0);
}
const coverage = [decisionOutcomes.size / 2 * 100, conditionOutcomes.size / 4 * 100];
record('A22', coverage, [100, 75], `${coverage[0]}%、${coverage[1]}%`, 'Track only evaluated atomic conditions under short-circuit execution.');

const cpuMs = 6_000_000 * 1.5 / 3_000_000_000 * 1000;
record('B02', cpuMs, 3, `${cpuMs} ms`, 'Convert retired instruction count to cycles, seconds and milliseconds.');
const capacityMiB = 2 ** 24 / 2 ** 20;
record('B03', capacityMiB, 16, `${capacityMiB} MiB`, 'Count byte addresses, then convert bytes to MiB.');

const bForm = analyzeNormalForm(['A', 'B', 'C'], [[['A'], ['B']], [['B'], ['A']]]);
record('B04', bForm, { keys: [['A', 'C'], ['B', 'C']], normalForm: '3NF' }, '候选键为 AC、BC；关系满足 3NF，但 A、B 都不是超键，故不满足 BCNF', 'Enumerate all candidate keys and all implied nontrivial dependencies.');

const partitions = [['P1', '2026-01-01', '2026-02-01'], ['P2', '2026-02-01', '2026-03-01'], ['P3', '2026-03-01', '2026-04-01']];
const overlaps = partitions.filter(([, lower, upper]) => lower < '2026-03-01' && upper > '2026-02-01').map(([name]) => name);
record('B06', overlaps, ['P2'], '只有 P2；上界不包含在前一个分区内', 'Intersect half-open DATE intervals, excluding touching endpoints.');

function simulateSrtf(jobs) {
  const remaining = jobs.map((j) => j.service), completion = Array(jobs.length).fill(null), timeline = [];
  let clock = 0, current = -1;
  while (remaining.some((n) => n > 0)) {
    const ready = jobs.map((_, i) => i).filter((i) => jobs[i].arrival <= clock && remaining[i] > 0);
    if (!ready.length) { clock++; current = -1; continue; }
    ready.sort((a, b) => remaining[a] - remaining[b] || Number(b === current) - Number(a === current) || jobs[a].arrival - jobs[b].arrival || a - b);
    current = ready[0];
    if (timeline.at(-1)?.process === jobs[current].name) timeline.at(-1).end++;
    else timeline.push({ start: clock, end: clock + 1, process: jobs[current].name });
    remaining[current]--;
    clock++;
    if (remaining[current] === 0) completion[current] = clock;
  }
  const waiting = jobs.map((j, i) => completion[i] - j.arrival - j.service);
  return { timeline, completion, waiting, mean: `${waiting.reduce((a, b) => a + b, 0)}/${jobs.length}` };
}
const scheduling = simulateSrtf([{ name: 'P1', arrival: 0, service: 8 }, { name: 'P2', arrival: 1, service: 3 }, { name: 'P3', arrival: 2, service: 2 }]);
record('B07', scheduling, { timeline: [{ start: 0, end: 1, process: 'P1' }, { start: 1, end: 4, process: 'P2' }, { start: 4, end: 6, process: 'P3' }, { start: 6, end: 13, process: 'P1' }], completion: [13, 4, 6], waiting: [5, 0, 2], mean: '7/3' }, scheduling.mean, 'Simulate each CPU time unit, keeping the running process on remaining-time ties.');

const virtual = 0x2BCD, pageBytes = 1024, page = Math.floor(virtual / pageBytes), offset = virtual % pageBytes, physical = 5 * pageBytes + offset;
record('B08', { page, offset, physical }, { page: 10, offset: 973, physical: 6093 }, `0x${physical.toString(16).toUpperCase()}`, 'Divide virtual address into page number/remainder and apply frame mapping.');

const feasiblePrefixes = Array.from({ length: 31 }, (_, prefix) => prefix).filter((prefix) => 2 ** (32 - prefix) - 2 >= 50);
const smallestPrefix = Math.max(...feasiblePrefixes);
record('B10', { prefix: smallestPrefix, allocatableHosts: 2 ** (32 - smallestPrefix) - 2 }, { prefix: 26, allocatableHosts: 62 }, `/${smallestPrefix}`, 'Enumerate ordinary broadcast prefixes and select the smallest sufficient address block.');

const newThreshold = Math.max(10 / 2, 2), timeoutWindow = 1;
record('B11', [newThreshold, timeoutWindow], [5, 1], `${newThreshold}、${timeoutWindow}`, 'Use FlightSize rather than cwnd in the explicitly stated timeout model.');
const rowBytes = 3 * 2;
record('B12', { rowBytes, advancedBytes: 2 * rowBytes, wholeArrayBytes: 4 * rowBytes }, { rowBytes: 6, advancedBytes: 12, wholeArrayBytes: 24 }, `${rowBytes}、${2 * rowBytes}`, 'Count short objects per row and rows advanced.');
const cString = [...Buffer.from('cash', 'ascii'), 0];
record('B13', [cString.length, cString.indexOf(0)], [5, 4], `${cString.length}、${cString.indexOf(0)}`, 'Construct explicit character bytes including the terminating zero.');

const edges = [['A', 'B', 2], ['A', 'C', 6], ['B', 'C', 3], ['B', 'D', 5], ['C', 'D', 4], ['C', 'E', 7], ['D', 'E', 1], ['B', 'E', 8]];
const spanningTrees = subsets(edges).filter((es) => es.length === 4).filter((es) => {
  const reached = new Set(['A']);
  for (let round = 0; round < 5; round++) for (const [u, v] of es) if (reached.has(u) || reached.has(v)) { reached.add(u); reached.add(v); }
  return reached.size === 5;
}).map((es) => ({ edges: es.map(([u, v]) => `${u}${v}`).sort(), weight: es.reduce((sum, [, , weight]) => sum + weight, 0) }));
const mstWeight = Math.min(...spanningTrees.map((tree) => tree.weight));
const minimumTrees = spanningTrees.filter((tree) => tree.weight === mstWeight);
record('B17', { weight: mstWeight, trees: minimumTrees }, { weight: 10, trees: [{ edges: ['AB', 'BC', 'CD', 'DE'], weight: 10 }] }, String(mstWeight), 'Enumerate every four-edge subset and retain connected spanning trees, independently of Kruskal.');

const keys = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47], visited = [];
let low = 0, high = keys.length - 1;
while (low <= high) {
  const middle = Math.floor((low + high) / 2);
  visited.push(keys[middle]);
  if (keys[middle] === 35) break;
  if (keys[middle] < 35) low = middle + 1;
  else high = middle - 1;
}
record('B18', visited, [23, 35], `依次访问 ${visited.join('、')}，共 ${visited.length} 次`, 'Execute the specified closed-interval search and count visited midpoint keys.');

const fileBlocks = 180, memoryBlocks = 6, mergeFanIn = memoryBlocks - 1;
let runs = [];
for (let remaining = fileBlocks; remaining > 0; remaining -= memoryBlocks) runs.push(Math.min(remaining, memoryBlocks));
let blockIo = 2 * runs.reduce((a, b) => a + b, 0);
const runCounts = [runs.length];
while (runs.length > 1) {
  const outputs = [];
  for (let start = 0; start < runs.length; start += mergeFanIn) {
    const blocks = runs.slice(start, start + mergeFanIn).reduce((a, b) => a + b, 0);
    blockIo += 2 * blocks;
    outputs.push(blocks);
  }
  runs = outputs;
  runCounts.push(runs.length);
}
record('B19', { runCounts, mergePasses: runCounts.length - 1, blockIo }, { runCounts: [30, 6, 2, 1], mergePasses: 3, blockIo: 1440 }, `${runCounts.length - 1} 轮、${blockIo}`, 'Simulate every run group, including copying one-run tails and writing the final output.');

const boundary = [...new Set([21 - 1, 21, 21 + 1, 55 - 1, 55, 55 + 1])].sort((a, b) => a - b);
record('B22', boundary, [20, 21, 22, 54, 55, 56], boundary.join('、'), 'Enumerate endpoints and one integer step on each side.');
const voters = 5, quorum = Math.floor(voters / 2) + 1, survivors = voters - 2;
record('B26', { quorum, survivors, hasMajority: survivors >= quorum }, { quorum: 3, survivors: 3, hasMajority: true }, '剩下 3 个达到多数，满足其余条件时可继续推进；这不推出任意作恶容错保证', 'Compute a strict majority and compare surviving voters; no BFT inference.');

// The ledger/tree check is enabled after registration; arithmetic can be rerun alone.
if (!process.argv.includes('--arithmetic-only')) {
  const manifest = json('soe/batches/soe-cs-batch2-20261109.json');
  const history = json('.codex/knowledge-update-history.json');
  const flatten = (nodes) => nodes.flatMap((n) => n.isLeaf ? [n] : flatten(n.children ?? []));
  const leaves = flatten(json('soe/_tree.json'));
  for (const paper of ['A', 'B']) {
    const key = `soe-cs-self-test-${paper.toLowerCase()}`;
    const leaf = leaves.filter((n) => n.key === key);
    assert.equal(leaf.length, 1, `${key}: unique navigation leaf`);
    assert.equal(leaf[0].filePath, 'practice');
    assert.equal(manifest.items.filter((n) => n.key === key).length, 1, `${key}: manifest record`);
    const records = history.records.filter((n) => n.module === 'soe' && n.key === key);
    assert.equal(records.length, 1, `${key}: history record`);
    assert.equal(records[0].status, 'pending', `${key}: not yet published`);
  }
}

const requiredCalculations = ['A02', 'A03', 'A04', 'A07', 'A10', 'A12', 'A13', 'A17', 'A18', 'A19', 'A22', 'B02', 'B03', 'B04', 'B06', 'B07', 'B08', 'B10', 'B11', 'B12', 'B13', 'B17', 'B18', 'B19', 'B22', 'B26'];
assert.deepEqual(calculations.map((c) => c.question).sort(), requiredCalculations);
console.log(JSON.stringify({
  schemaVersion: 1,
  batchId: 'soe-cs-batch2-20261109',
  status: 'passed',
  originalQuestions: 60,
  arithmeticQuestions: calculations.length,
  articles: ['A', 'B'].map((paper) => ({ ...parsed.get(paper), sha256: hashes(parsed.get(paper).articlePath) })),
  calculations,
  registrationChecked: !process.argv.includes('--arithmetic-only'),
}, null, 2));
