import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({ linkify: true });

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
