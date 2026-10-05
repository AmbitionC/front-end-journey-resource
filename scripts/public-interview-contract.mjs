import MarkdownIt from 'markdown-it';
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import parse5 from 'parse5';
import { leafPath, readBounded, relativeLinkTarget } from './resource-paths.mjs';

const markdown = new MarkdownIt({ linkify: true });
const htmlMarkdown = new MarkdownIt({ html: true });

function renderedDocument(contents) {
  const errors = [];
  const tree = parse5.parseFragment(htmlMarkdown.render(contents), {
    sourceCodeLocationInfo: true,
    onParseError: error => { if (error.code === 'duplicate-attribute') errors.push(error); },
  });
  const nodes = [], activeStyleNodes = [];
  // Global styles still apply when their owner is hidden or inside SVG.
  // Inspect the complete parsed tree before pruning invisible text nodes.
  function collectStyles(node) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
    if (node.tagName==='style' || node.tagName==='link' && attrs.rel?.split(/\s/u).includes('stylesheet')) activeStyleNodes.push(node);
    for (const child of node.childNodes ?? []) collectStyles(child);
    if (node.content) collectStyles(node.content);
  }
  collectStyles(tree);
  function visit(node) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
    if (['pre','code','script','style','template','noscript','svg','math'].includes(node.tagName)
        || 'hidden' in attrs || attrs['aria-hidden'] === 'true'
        || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/iu.test(attrs.style ?? '')) return;
    if (node.tagName) nodes.push({ node, attrs });
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(tree);
  return { nodes, errors, activeStyleNodes };
}

function nodeText(node) {
  const attrs = Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
  if ('hidden' in attrs || attrs['aria-hidden'] === 'true'
      || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/iu.test(attrs.style ?? '')) return '';
  if (node.nodeName === '#text') return node.value;
  if (['script','style','template'].includes(node.tagName)) return '';
  return (node.childNodes ?? []).map(nodeText).join('');
}

function unprovenVisibility(node) {
  const uncertain=n=>(n.attrs??[]).some(a=>['style','class','hidden','inert','color'].includes(a.name)
    || a.name==='aria-hidden' && a.value==='true');
  function subtree(n) { return uncertain(n) || (n.childNodes??[]).some(subtree); }
  if(subtree(node)) return true;
  for(let ancestor=node.parentNode;ancestor;ancestor=ancestor.parentNode) if(uncertain(ancestor)) return true;
  return false;
}

export function questionStructure(contents) {
  const { nodes, errors, activeStyleNodes } = renderedDocument(contents);
  const questions = nodes.filter(n => n.node.tagName === 'details').map(({ node, attrs }) => {
    const children = (node.childNodes ?? []).filter(n => n.tagName);
    const siblings = (node.parentNode?.childNodes ?? []).filter(n => n.tagName);
    const answer = siblings[siblings.indexOf(node) + 1];
    let nested = false;
    for (let ancestor = node.parentNode; ancestor; ancestor = ancestor.parentNode) if (ancestor.tagName === 'details') nested = true;
    const duplicate = errors.some(e => e.startOffset >= node.sourceCodeLocation?.startTag.startOffset
      && e.startOffset < node.sourceCodeLocation?.startTag.endOffset);
    const key = duplicate ? null : attrs['data-knowledge-key'] ?? null;
    return { key, hasBinding: 'data-knowledge-key' in attrs, duplicate,
      summary: nodeText(children[0] ?? {}), answer: nodeText(answer ?? {}),
      valid: children[0]?.tagName === 'summary'
        && children.filter(n => n.tagName === 'summary').length === 1
        && !nested && !unprovenVisibility(node) && !unprovenVisibility(answer??{}) && !!nodeText(children[0]).trim()
        && answer?.tagName === 'p' && !!nodeText(answer).trim() };
  });
  return { questions, duplicateAttributes: errors.length, activeStyles: activeStyleNodes.length };
}

export function inlineKnowledgeBindings(contents) {
  return questionStructure(contents).questions.map(({key}) => ({key}));
}

export function visibleLinkTargets(contents, from) {
  const document=renderedDocument(contents);
  if(document.activeStyleNodes.length) throw new Error('知识正文注入样式，无法证明反链可见');
  const targets = new Set();
  for (const {node,attrs} of document.nodes.filter(n=>n.node.tagName==='a')) {
    if(!nodeText(node).trim() || unprovenVisibility(node)) continue;
    const target=relativeLinkTarget(from,attrs.href);
    if(target) targets.add(target);
  }
  return targets;
}

export async function validatePublicKnowledgeRelations(resourceRoot, interviewLeaves, knowledgeLeaves) {
  const errors = [];
  const knowledgeByKey = new Map(knowledgeLeaves.map(leaf => [leaf.key, leaf]));
  for (const leaf of knowledgeLeaves) {
    if (leaf.quickRead !== undefined && (
      typeof leaf.quickRead !== 'object' || leaf.quickRead === null
      || typeof leaf.quickRead.text !== 'string' || !leaf.quickRead.text.trim()
      || /[\r\n]/u.test(leaf.quickRead.text)
    )) errors.push(`知识点 ${leaf.key} 的 quickRead.text 必须是非空单段文本`);
  }
  for (const leaf of interviewLeaves) {
    let contents, interviewFile;
    try { interviewFile = leafPath('interview', leaf); contents = (await readBounded(resourceRoot, interviewFile, 'interview')).toString(); }
    catch { errors.push(`面经正文不存在：${leaf.key}`); continue; }
    const structure = questionStructure(contents), bindings = structure.questions;
    if (structure.activeStyles) errors.push(`面经 ${leaf.key} 不得注入改变可见结构的样式`);
    if (structure.duplicateAttributes) errors.push(`面经 ${leaf.key} 含重复 HTML 属性`);
    if (leaf.contentFormat === 'short-qa-v1' && bindings.length === 0) errors.push(`面经 ${leaf.key} 的短问答正文没有问题 details`);
    for (const binding of bindings) {
      if (!binding.valid) errors.push(`面经 ${leaf.key} 问题必须有真实首个 summary 和相邻独立短答`);
      if (binding.key === null) {
        if (leaf.contentFormat === 'short-qa-v1') errors.push(`面经 ${leaf.key} 的短问答缺少唯一知识 key`);
        continue;
      }
      const knowledgeLeaf = knowledgeByKey.get(binding.key);
      if (!knowledgeLeaf) { errors.push(`面经 ${leaf.key} 的知识点不存在：${binding.key}`); continue; }
      if (typeof knowledgeLeaf.quickRead?.text !== 'string' || !knowledgeLeaf.quickRead.text.trim()
          || /[\r\n]/u.test(knowledgeLeaf.quickRead.text)) errors.push(`知识点 ${binding.key} 缺少有效 quickRead.text`);
      let knowledgeBody, knowledgeFile;
      try { knowledgeFile = leafPath('knowledge', knowledgeLeaf); knowledgeBody = (await readBounded(resourceRoot, knowledgeFile, 'knowledge')).toString(); }
      catch { errors.push(`知识点正文不存在：${binding.key}`); continue; }
      let linked = false;
      try { linked=visibleLinkTargets(knowledgeBody,knowledgeFile).has(interviewFile); }
      catch { errors.push(`知识点 ${binding.key} 含越界、无效或不可证明可见的反链`); }
      if (!linked) {
        errors.push(`知识点 ${binding.key} 缺少面经反链：${leaf.key}`);
      }
    }
  }
  return errors;
}

function renderedInlineText(token) {
  return (token.children ?? [])
    .filter(child => child.type === 'text' || child.type === 'code_inline' || child.type === 'html_inline')
    .map(child => child.content)
    .join('');
}

function decodePercentEncoding(value) {
  let decoded = value;
  for (let pass = 0; pass < 3; pass++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function isNowcoderDestination(value) {
  const decoded = decodePercentEncoding(value);
  let url;
  try {
    url = new URL(decoded.startsWith('//') ? `https:${decoded}` : decoded);
  } catch {
    return false;
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/u, '');
  return hostname === 'nowcoder.com' || hostname.endsWith('.nowcoder.com');
}

export function publicInterviewDisclosures(contents) {
  const disclosures = new Set();
  // Raw HTML blocks and code examples are also public content. Markdown's
  // inline-link pass alone does not cover details/a/img blocks or fences.
  for (const token of htmlMarkdown.parse(contents, {})) {
    if (!['html_block', 'fence', 'code_block'].includes(token.type)) continue;
    const decoded = decodePercentEncoding(markdown.utils.unescapeAll(token.content));
    if ((markdown.linkify.match(decoded) ?? []).some(match => isNowcoderDestination(match.url))) {
      disclosures.add('nowcoder-destination');
    }
    for (const attr of decoded.matchAll(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu)) {
      if (isNowcoderDestination(attr[1] ?? attr[2] ?? attr[3])) disclosures.add('nowcoder-destination');
    }
    for (const heading of decoded.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2\s*>/giu)) {
      if (heading[1].replace(/<[^>]*>/gu, '').trim() === '来源') disclosures.add('source-heading');
    }
  }
  const tokens = markdown.parse(contents, {});
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'heading_open' && token.tag === 'h2') {
      const heading = renderedInlineText(tokens[index + 1] ?? {}).replace(/\s+/gu, ' ').trim();
      if (heading === '来源') disclosures.add('source-heading');
    }
    if (token.type !== 'inline') continue;
    const renderedText = decodePercentEncoding(renderedInlineText(token));
    const renderedDestinations = markdown.linkify.match(renderedText) ?? [];
    if (renderedDestinations.some(match => isNowcoderDestination(match.url))) {
      disclosures.add('nowcoder-destination');
    }
    for (const child of token.children ?? []) {
      for (const attribute of ['href', 'src']) {
        const destination = child.attrGet?.(attribute);
        if (destination && isNowcoderDestination(destination)) {
          disclosures.add('nowcoder-destination');
        }
      }
    }
  }
  return disclosures;
}
