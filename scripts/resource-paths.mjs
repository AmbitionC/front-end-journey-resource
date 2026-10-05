import { readFile, realpath, readdir, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep, posix } from 'node:path';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function isDirectExecution(url) {
  try { return !!process.argv[1] && url === pathToFileURL(realpathSync(process.argv[1])).href; }
  catch { return false; }
}

export function safeRelativePath(value) {
  if (value === '.codex/image-resync.txt') return value;
  if (typeof value !== 'string' || !value || value.includes('\\') || isAbsolute(value)
      || value.split('/').some(part => !/^[A-Za-z0-9_][A-Za-z0-9._-]*$/u.test(part))) {
    throw new Error('资源路径必须由安全的相对路径组件组成');
  }
  return value;
}

export function leafPath(module, leaf) {
  if (!['interview', 'knowledge'].includes(module)) throw new Error('不支持的内容模块');
  safeRelativePath(leaf.key);
  if (leaf.key.includes('/')) throw new Error('key 必须是单个路径组件');
  safeRelativePath(leaf.filePath);
  return `${module}/${leaf.filePath}/${leaf.key}.md`;
}

export async function boundedPath(root, requested, module) {
  safeRelativePath(requested);
  if (module && !requested.startsWith(`${module}/`)) throw new Error('资源模块边界不符');
  const base = await realpath(root), target = await realpath(resolve(base, requested));
  const inside = relative(base, target);
  if (!inside || inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) {
    throw new Error('资源真实路径越界');
  }
  if (module) {
    const moduleRoot = resolve(base, module), location = relative(moduleRoot, target);
    if (location === '..' || location.startsWith(`..${sep}`) || isAbsolute(location)) throw new Error('资源真实模块越界');
  }
  // Content assets must be ordinary repository files, including every ancestor.
  let cursor = base;
  for (const part of requested.split('/')) {
    cursor = resolve(cursor, part);
    if ((await lstat(cursor)).isSymbolicLink()) throw new Error('公开资源不得使用符号链接');
  }
  if (!(await lstat(target)).isFile()) throw new Error('资源必须是普通文件');
  return target;
}

export async function readBounded(root, requested, module) {
  return readFile(await boundedPath(root, requested, module));
}

export async function boundedFiles(root, module) {
  const output = [];
  const modulePath = resolve(root, module);
  if ((await lstat(modulePath)).isSymbolicLink()) throw new Error('公开模块不得使用符号链接');
  async function walk(folder, prefix) {
    for (const item of await readdir(folder, { withFileTypes: true })) {
      const name = `${prefix}/${item.name}`;
      safeRelativePath(name);
      if (item.isSymbolicLink()) throw new Error('公开资源不得使用符号链接');
      if (item.isDirectory()) await walk(resolve(folder, item.name), name);
      else if (item.isFile()) { await boundedPath(root, name, module); output.push(name); }
      else throw new Error('公开资源不是普通文件');
    }
  }
  await walk(modulePath, module);
  return output.sort();
}

export function relativeLinkTarget(from, href) {
  if (typeof href !== 'string' || !href || /^[a-z][a-z0-9+.-]*:/iu.test(href) || href.startsWith('//')) return null;
  if (href.startsWith('#') || href.startsWith('?')) return null;
  const decoded = decodeURIComponent(href.split('#')[0].split('?')[0]);
  if (!decoded || decoded.includes('\\') || decoded.startsWith('/')) throw new Error('反链路径无效');
  return safeRelativePath(posix.normalize(posix.join(posix.dirname(from), decoded)));
}
