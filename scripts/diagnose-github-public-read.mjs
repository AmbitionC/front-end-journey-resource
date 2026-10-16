import { diagnoseGithubRead } from './github-public-read.mjs';
import { isDirectExecution } from './resource-paths.mjs';

// Fixed historical scope of the failed PR58 PDF gate. No args, environment
// target, caller-supplied URL or response file can broaden this diagnostic.
const merge = '66e58daf5b855ca8e4a8ba1ef851c4d42a94f9d0';
const reviewedHead = '345adb7562f703de38eb8e7a51d27a72d62caa2e';
export const diagnosticEndpoints = Object.freeze([
  '',
  'branches/master',
  'commits/'+merge+'/pulls?per_page=100&page=1',
  'pulls/58',
  'pulls/58/reviews?per_page=100&page=1',
  'issues/58/comments?per_page=100&page=1',
  'actions/runs?head_sha='+reviewedHead+'&per_page=100',
  'actions/workflows/sync.yml/runs?head_sha='+merge+'&per_page=100',
]);

export async function diagnoseFailedPr58Gate(read=diagnoseGithubRead) {
  for (const endpoint of diagnosticEndpoints) await read(endpoint);
}

if (isDirectExecution(import.meta.url)) {
  if (process.argv.length!==2) {
    console.error('Diagnostic accepts no arguments');
    process.exitCode=1;
  } else {
    diagnoseFailedPr58Gate().catch(()=>{
      // The transport already emitted only bounded, allowlisted fields.
      // This is not a release approval and never retries a failed endpoint.
      process.exitCode=1;
    });
  }
}
