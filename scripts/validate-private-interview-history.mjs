import { isDirectExecution } from './resource-paths.mjs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateContentReview } from './content-review.mjs';

export async function validatePrivateInterviewHistory(root, historyPath, options = {}) {
  return validateContentReview(root, historyPath, options.reviewPath, options.reviewSha256);
}

if (isDirectExecution(import.meta.url)) {
  const errors = await validatePrivateInterviewHistory(resolve(import.meta.dirname, '..'), process.argv[2], {
    reviewPath: process.argv[3], reviewSha256: process.argv[4],
  });
  // Never print source URLs, authors, paths or private record contents to CI.
  if (errors.length) { console.error(`私有最终版本审核失败：${errors.length} 项`); process.exitCode = 1; }
  else console.log('私有审核绑定通过；本地指纹不认证发布身份，CI 仍需最终提交的可信审查。');
}
