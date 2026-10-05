import { isDirectExecution } from './resource-paths.mjs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateSyncResult(result) {
  if (!result || result.success!==true || !result.data || !Array.isArray(result.data.errors) || result.data.errors.length) throw new Error('内容同步返回失败或错误列表无效');
  for (const field of ['manifests','articles','images','deleted']) if (!Number.isInteger(result.data[field]) || result.data[field]<0) throw new Error('内容同步计数无效');
  return result.data;
}

if (isDirectExecution(import.meta.url)) {
  try { validateSyncResult(JSON.parse(await readFile(process.argv[2],'utf8'))); console.log('同步返回结构通过；该返回尚不证明 FaaS 按 afterSha 固定读取字节。'); }
  catch { console.error('内容同步终态核验失败'); process.exitCode=1; }
}
