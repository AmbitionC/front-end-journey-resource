// Anonymous transport shared by release checks and a strictly read-only diagnostic.
const REPOSITORY = 'AmbitionC/front-end-journey-resource';

function publicReviewEndpoint(path) {
  const sha='[a-f0-9]{40}',number='[1-9][0-9]{0,15}',page='(?:[1-9]|[1-9][0-9]|100)';
  const allowed=[/^$/u,/^branches\/master$/u,
    new RegExp(`^commits/${sha}/pulls\\?per_page=100&page=${page}$`,'u'),
    new RegExp(`^pulls/${number}$`,'u'),
    new RegExp(`^pulls/${number}/reviews\\?per_page=100&page=${page}$`,'u'),
    new RegExp(`^issues/${number}/comments\\?per_page=100&page=${page}$`,'u'),
    new RegExp(`^actions/(?:workflows/sync\\.yml/)?runs\\?head_sha=${sha}&per_page=100$`,'u')];
  if(typeof path!=='string' || !allowed.some(pattern=>pattern.test(path))
      || /^(?:pulls|issues)\//u.test(path) && !Number.isSafeInteger(Number(path.split('/')[1]))) {
    throw new Error('GitHub 审核 API 路径不在公开读取白名单');
  }
  return `/repos/${REPOSITORY}${path?`/${path}`:''}`;
}

async function publicErrorMessage(response) {
  // Parse only a small error envelope. Never log arbitrary body text or the
  // dynamic tail of a GitHub message (which can contain IPs or other data).
  const reader=response.body?.getReader();
  if(!reader) return '[omitted]';
  try {
    const chunks=[];let size=0;
    while(true) {
      const {done,value}=await reader.read();if(done) break;
      size+=value.byteLength;if(size>8192) return '[omitted]';chunks.push(value);
    }
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.byteLength;}
    const message=JSON.parse(new TextDecoder().decode(bytes)).message;
    if(typeof message!=='string') return '[omitted]';
    const prefix=message.slice(0,160);
    for(const known of ['API rate limit exceeded','You have exceeded a secondary rate limit',
      'You have triggered an abuse detection mechanism','Resource not accessible by integration',
      'Resource not accessible by personal access token','Bad credentials','Forbidden','Not Found']) {
      if(prefix===known || prefix.startsWith(`${known}.`) || prefix.startsWith(`${known} `)) return known;
    }
    return '[omitted]';
  } catch {return '[omitted]';}
  finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
}

function publicErrorHeaders(response) {
  const fields={};
  for(const name of ['x-github-request-id','x-ratelimit-limit','x-ratelimit-remaining',
    'x-ratelimit-reset','x-ratelimit-used','x-ratelimit-resource','retry-after']) {
    const value=response.headers.get(name);
    // Reject controls, oversized or unexpected values instead of reflecting
    // arbitrary server headers. Only fixed header names can reach the log.
    if(typeof value!=='string' || value.length>80 || /[^\x20-\x7e]/u.test(value)) continue;
    const valid=name==='x-github-request-id'?/^[a-f0-9]{1,16}(?::[a-f0-9]{1,16}){0,5}$/iu.test(value)
      :name==='x-ratelimit-resource'?['core','search','graphql','integration_manifest','code_search',
        'dependency_snapshots','code_scanning_upload','actions_runner_registration','source_import',
        'scim','audit_log','code_scanning_autofix'].includes(value)
      :/^[0-9]{1,20}$/u.test(value);
    if(valid) fields[name]=value;
  }
  return fields;
}

async function readPublicReview(path, diagnoseSuccess) {
  // This repository uses public read endpoints. No token, new permission,
  // configurable API host or caller-supplied response file is accepted.
  const endpoint=publicReviewEndpoint(path);
  let response;
  try {
    response = await fetch(`https://api.github.com${endpoint}`, {
      method:'GET',headers: { Accept:'application/vnd.github+json' }, redirect:'error',
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    console.error(JSON.stringify({endpoint,status:'network_error',message:'Network request failed'}));
    throw new Error('GitHub 审核证据无法读取（网络错误）');
  }
  if (!response.ok) {
    console.error(JSON.stringify({endpoint,status:response.status,...publicErrorHeaders(response),
      message:await publicErrorMessage(response)}));
    throw new Error(`GitHub 审核证据无法读取（HTTP ${response.status}）`);
  }
  if (diagnoseSuccess) console.log(JSON.stringify({endpoint,status:response.status,...publicErrorHeaders(response)}));
  try {return await response.json();}
  catch {throw new Error('GitHub 审核证据格式无效');}
}


// Normal release reads stay silent on success. The standalone diagnostic
// requests the same allowlisted public endpoint without returning body data.
export async function githubRead(path) { return readPublicReview(path,false); }
export async function diagnoseGithubRead(path) { await readPublicReview(path,true); }
