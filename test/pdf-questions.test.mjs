import test from 'node:test';
import assert from 'node:assert/strict';
import { latexToHtml, renderPdfMath, splitQuestionAnswers } from '../scripts/pdf-questions.mjs';
import { buildHtml, parseMaterialArgs, planBooks } from '../scripts/build-materials.mjs';

const ARTICLE = `导语

## 原创模拟题 1：基期量

题干 $B=\\dfrac{A}{1+r}$

- A. 一
- B. 二

**答案：A。**

**解析：** 因为 $A\\times 2$。

## 原创模拟题 2：申论

材料

**参考答案：** ①要点

## 常见陷阱

\`\`\`text
## 原创模拟题 9：代码里的不算
**答案：B。**
\`\`\`
`;

test('拆出答案：题目册只留题干和选项，答案按题收集，代码块不动', () => {
  const { body, answers } = splitQuestionAnswers(ARTICLE, { hint: '见文末' });
  assert.equal(answers.length, 2);
  assert.equal(answers[0].title, '原创模拟题 1：基期量');
  assert.match(answers[0].text, /^\*\*答案：A。\*\*/u);
  assert.match(answers[0].text, /解析/u);
  assert.match(answers[1].text, /^\*\*参考答案：\*\* ①要点$/u);
  assert.doesNotMatch(body, /答案：A|解析：|①要点/u);
  assert.match(body, /- B\. 二\n\n\*见文末\*/u);
  assert.match(body, /## 常见陷阱/u);
  assert.match(body, /## 原创模拟题 9：代码里的不算\n\*\*答案：B。\*\*/u);
});

test('答案速查整段挪进答案', () => {
  const { body, answers } = splitQuestionAnswers('## 第一部分\n题\n\n## 答案速查\n\n| 1 | A |\n\n## 结尾\n');
  assert.equal(answers.length, 1);
  assert.equal(answers[0].title, '答案速查');
  assert.doesNotMatch(body, /\| 1 \| A \|/u);
  assert.match(body, /## 结尾/u);
});

test('公式转静态文本', () => {
  assert.equal(latexToHtml('B=\\dfrac{A}{1+r}'), 'B=A/(1+r)');
  assert.equal(latexToHtml('\\dfrac{\\text{部分}}{\\text{整体}}'), '部分/整体');
  assert.equal(latexToHtml('A\\to B'), 'A → B');
  assert.equal(latexToHtml('\\lnot A'), '¬A');
  // 函数名下标紧贴；求和号和前面的分数隔开
  assert.equal(latexToHtml('\\log_2 n'), 'log<sub>2</sub> n');
  assert.equal(latexToHtml('O(n\\log n)'), 'O(n log n)');
  assert.equal(latexToHtml('\\frac{1}{n}\\sum_{i=1}^{n} x_i'), '1/n Σ<sub>i=1</sub><sup>n</sup> x<sub>i</sub>');
  assert.equal(latexToHtml('a+\\sum x'), 'a+Σx');
  assert.equal(latexToHtml('(1+r)^{n}'), '(1+r)<sup>n</sup>');
  assert.equal(latexToHtml('a<b'), 'a&lt;b');
  assert.throws(() => latexToHtml('\\unknowncmd'), /未支持的命令/u);
  const md = renderPdfMath('价格 $A\\times B$，代码 `$x$` 不动\n\n$$\nO(n\\log n)\n$$\n');
  assert.match(md, /<span class="pdf-math">A × B<\/span>/u);
  assert.match(md, /`\$x\$`/u);
  assert.match(md, /<p class="pdf-math-block">O\(n log n\)<\/p>/u);
});

test('参数：默认 knowledge 保持原产物路径', () => {
  const k = parseMaterialArgs([]);
  assert.equal(k.module, 'knowledge');
  assert.equal(k.answers, 'inline');
  assert.equal(k.ossPrefix, 'materials/knowledge/');
  assert.match(k.dist, /dist\/materials$/u);
  const c = parseMaterialArgs(['--module', 'civil']);
  assert.equal(c.answers, 'appendix');
  assert.equal(c.ossPrefix, 'materials/civil/');
  assert.match(c.dist, /dist\/materials\/civil$/u);
  assert.equal(parseMaterialArgs(['--module', 'soe', '--answers', 'separate']).answers, 'separate');
  assert.throws(() => parseMaterialArgs(['--module', 'interview']), /不支持/u);
  assert.throws(() => parseMaterialArgs(['--module']), /缺参数值/u);
});

const TREE = [{ key: 'grp', label: '分组', children: [
  { key: 'a1', label: '文章一', isLeaf: true, filePath: 'x' },
  { key: 'a2', label: '文章二', isLeaf: true, filePath: 'x' },
] }];
const read = (leaf) => (leaf.key === 'a1' ? ARTICLE : '没有题目的文章');
const render = () => (_leaf, text) => `<p>${text.replace(/[<>&]/gu, '')}</p>`;

test('appendix：答案集中在本册末尾，目录指向答案节', () => {
  const [g] = planBooks('civil', TREE, { read, render, answers: 'appendix' });
  assert.equal(g.key, 'civil');
  assert.equal(g.books.length, 1);
  const { html, count } = g.books[0].built;
  assert.equal(count, 2);
  assert.match(html, /href="#pdf-answers"/u);
  assert.match(html, /id="pdf-answers"/u);
  assert.ok(html.indexOf('答案：A') > html.indexOf('id="pdf-answers"'));
  assert.match(html, /答案与解析见本册末尾/u);
});

test('separate：另出一册答案与解析', () => {
  const [g] = planBooks('soe', TREE, { read, render, answers: 'separate' });
  assert.deepEqual(g.books.map((b) => [b.key, b.kind]), [['grp', undefined], ['grp-answers', 'answers']]);
  assert.doesNotMatch(g.books[0].built.html, /答案：A/u);
  assert.match(g.books[0].built.html, /答案与解析见《分组 · 答案与解析》/u);
  assert.equal(g.books[1].built.count, 1);
  assert.match(g.books[1].built.html, /答案：A/u);
});

test('inline：与原来一致，不拆答案', () => {
  const built = buildHtml(TREE[0], '父级', read, (_l, t) => `<p>${t.replace(/[<>&]/gu, '')}</p>`);
  assert.match(built.html, /答案：A/u);
  assert.equal(built.answersBook, undefined);
});
