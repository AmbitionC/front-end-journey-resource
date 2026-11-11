// 会员 PDF 的两个文本变换，只用于 soe / civil 这类带「原创模拟题」的模块：
// 1) splitQuestionAnswers：把每道题的答案与解析从题目后面挪走，题目册里只留题干和选项；
// 2) renderPdfMath：PDF 渲染时页面禁用脚本，$…$ 公式不能交给 KaTeX，这里转成可读的静态文本。
// 两者都只做确定的、可逆读的变换；认不出来的内容原样保留，绝不丢字。

const QUESTION_HEADING = /^(#{2,4})\s+原创模拟题\s*([A-Za-z]{0,2}\d+)?\s*[：:]\s*(.+?)\s*$/u;
const ANY_HEADING = /^(#{1,6})\s+(.+?)\s*$/u;
const ANSWER_START = /^\*\*(?:答案[：:]\s*[A-H]\s*。?|答案与解析[：:]|参考答案[：:]|参考解答[：:])\*\*/u;
const ANSWER_KEY_TITLE = /^答案速查/u;
const FENCE = /^\s*(```|~~~)/u;

/**
 * 把一篇文章拆成「题目正文」和「答案」两部分。
 * 返回 { body, answers: [{ title, text }] }；没有题目的文章 answers 为空、body 原样返回。
 * body 里每道题原答案的位置换成一行提示，告诉读者去哪里看答案。
 */
export function splitQuestionAnswers(markdown, { hint = '答案与解析见文末。' } = {}) {
  const lines = markdown.split('\n');
  const inCode = [];
  let fence = false;
  for (const line of lines) {
    const isFence = FENCE.test(line);
    inCode.push(fence || isFence);
    if (isFence) fence = !fence;
  }
  const body = [];
  const answers = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const q = !inCode[i] && QUESTION_HEADING.exec(line);
    const h = !inCode[i] && ANY_HEADING.exec(line);
    if (h && ANSWER_KEY_TITLE.test(h[2])) {
      // 整卷的「答案速查」表：整段挪进答案
      const level = h[1].length;
      let j = i + 1;
      while (j < lines.length && !(!inCode[j] && (ANY_HEADING.exec(lines[j])?.[1].length ?? 99) <= level)) j++;
      answers.push({ title: h[2], text: lines.slice(i + 1, j).join('\n').trim() });
      i = j;
      continue;
    }
    if (!q) {
      body.push(line);
      i++;
      continue;
    }
    // 题块：到下一个同级或更高级标题为止
    const level = q[1].length;
    let end = i + 1;
    while (end < lines.length && !(!inCode[end] && (ANY_HEADING.exec(lines[end])?.[1].length ?? 99) <= level)) end++;
    let a = -1;
    for (let k = i + 1; k < end; k++) if (!inCode[k] && ANSWER_START.test(lines[k])) { a = k; break; }
    if (a < 0) {
      body.push(...lines.slice(i, end));
    } else {
      body.push(...lines.slice(i, a));
      while (body.length && body[body.length - 1].trim() === '') body.pop();
      body.push('', `*${hint}*`, '');
      answers.push({ title: `原创模拟题${q[2] ? ` ${q[2]}` : ''}：${q[3]}`, text: lines.slice(a, end).join('\n').trim() });
    }
    i = end;
  }
  return { body: body.join('\n'), answers };
}

const SYMBOLS = {
  times: '×', div: '÷', approx: '≈', to: '→', lnot: '¬', neg: '¬', geq: '≥', ge: '≥', leq: '≤', le: '≤',
  neq: '≠', ne: '≠', pm: '±', cdot: '·', cdots: '⋯', ldots: '…', dots: '…', infty: '∞', pi: 'π',
  sigma: 'σ', Sigma: 'Σ', sum: 'Σ', Theta: 'Θ', theta: 'θ', alpha: 'α', beta: 'β', lambda: 'λ', mu: 'μ',
  Delta: 'Δ', delta: 'δ', omega: 'ω', Omega: 'Ω', log: 'log', ln: 'ln', max: 'max', min: 'min',
  lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', prec: '≺', succ: '≻', bowtie: '⋈', cup: '∪', cap: '∩',
  in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', land: '∧', wedge: '∧', lor: '∨', vee: '∨',
  rightarrow: '→', Rightarrow: '⇒', leftrightarrow: '↔', Leftrightarrow: '⇔', forall: '∀', exists: '∃',
  quad: ' ', qquad: '  ', ' ': ' ', ',': ' ', ';': ' ', '!': '', '%': '%', '{': '{', '}': '}', '_': '_', '#': '#', '&': '&',
};

const escHtml = (s) => s.replace(/[&<>"']/gu, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 读一个 {…} 组或单个字符，返回 [内容, 下一个位置] */
function readGroup(s, i) {
  while (s[i] === ' ') i++;
  if (s[i] !== '{') {
    if (s[i] === '\\') {
      const m = /^\\([A-Za-z]+|.)/u.exec(s.slice(i));
      return [m[0], i + m[0].length];
    }
    return [s[i] ?? '', i + 1];
  }
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1];
  }
  throw new Error('PDF 公式括号不配对');
}

const isAtom = (t) => /^[\p{L}\p{N}.%′']+$/u.test(t);

/** LaTeX 子集 → HTML 片段（已转义；只用 sup/sub 标签） */
export function latexToHtml(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const m = /^\\([A-Za-z]+|.)/u.exec(src.slice(i));
      const name = m[1];
      i += m[0].length;
      // 命令名后面的空格只是分隔符
      if (/^[A-Za-z]+$/u.test(name)) while (src[i] === ' ') i++;
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
        const [num, a] = readGroup(src, i);
        const [den, b] = readGroup(src, a);
        i = b;
        const n = latexToHtml(num), d = latexToHtml(den);
        const plain = (h) => h.replace(/<[^>]+>/gu, '');
        out += `${isAtom(plain(n)) ? n : `(${n})`}/${isAtom(plain(d)) ? d : `(${d})`}`;
      } else if (name === 'text' || name === 'mathrm' || name === 'textrm' || name === 'mathbf' || name === 'operatorname') {
        const [t, a] = readGroup(src, i);
        i = a;
        out += escHtml(t);
      } else if (name === 'bar' || name === 'overline') {
        const [t, a] = readGroup(src, i);
        i = a;
        out += `${latexToHtml(t)}̄`;
      } else if (name === 'sqrt') {
        const [t, a] = readGroup(src, i);
        i = a;
        out += `√(${latexToHtml(t)})`;
      } else if (name === 'left' || name === 'right' || name === 'displaystyle' || name === 'limits') {
        // 尺寸指令：去掉，括号本身照常输出
      } else if (Object.hasOwn(SYMBOLS, name)) {
        const sym = SYMBOLS[name];
        const spaced = /^[×÷≈→¬≥≤≠±⇒↔⇔∈∉⊂⊆∧∨∪∩≺≻⋈]$/u.test(sym) && sym !== '¬';
        const word = /^(log|ln|max|min)$/u.test(name);
        if (word && out && !/[\s(]$/u.test(out)) out += ' ';
        out += spaced ? ` ${escHtml(sym)} ` : escHtml(sym);
        if (word) out += ' ';
      } else {
        throw new Error(`PDF 公式含未支持的命令 \\${name}`);
      }
    } else if (c === '^' || c === '_') {
      const [t, a] = readGroup(src, i + 1);
      i = a;
      const tag = c === '^' ? 'sup' : 'sub';
      out += `<${tag}>${latexToHtml(t)}</${tag}>`;
    } else if (c === '{' || c === '}') {
      i++;
    } else {
      out += escHtml(c);
      i++;
    }
  }
  return out.replace(/ {2,}/gu, ' ').replace(/\( /gu, '(').replace(/ \)/gu, ')');
}

/**
 * 把 Markdown 里的 $…$ 和 $$…$$ 换成静态 HTML（代码块、行内代码里的不动）。
 * 行内公式包成 <span class="pdf-math">，块公式包成 <p class="pdf-math-block">。
 */
export function renderPdfMath(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE.test(line)) {
      fence = !fence;
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }
    if (/^\s*\$\$/u.test(line)) {
      let text = line.replace(/^\s*\$\$/u, '');
      let j = i;
      while (!/\$\$\s*$/u.test(text) || (j === i && line.trim() === '$$')) {
        j++;
        if (j >= lines.length) throw new Error('PDF 块公式未闭合');
        text += `\n${lines[j]}`;
      }
      text = text.replace(/\$\$\s*$/u, '');
      out.push('', `<p class="pdf-math-block">${latexToHtml(text.replace(/\n/gu, ' ').trim())}</p>`, '');
      i = j;
      continue;
    }
    // 行内：跳过 `code`
    out.push(line.split(/(`[^`]*`)/u).map((part) =>
      part.startsWith('`') ? part : part.replace(/\$(?!\s)([^$\n]+?)(?<!\s)\$/gu, (_m, tex) => `<span class="pdf-math">${latexToHtml(tex)}</span>`),
    ).join(''));
  }
  return out.join('\n');
}
