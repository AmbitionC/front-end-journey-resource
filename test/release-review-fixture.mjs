import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { publicInventory, sha256, normalizedOriginal, changedPublicationPaths, gitPublicationFiles } from '../scripts/content-review.mjs';

export function git(root,...args) {
  return execFileSync('git',['-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false','-c','user.name=Fixture','-c','user.email=fixture@example.invalid',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}

// Synthetic reviewer authority is confined to tests. Production gets this
// pin from its independent reviewer and authenticated GitHub attestation.
export async function freezeFixtureReview(f) {
  const snapshot=await publicInventory(f.root);
  f.review.history=await f.pin(f.historyPath);
  f.review.questionLedger=await f.pin(f.ledgerPath);
  f.review.publicFiles=snapshot.files; f.review.publicationDigest=snapshot.digest;
  f.review.coveredPaths=changedPublicationPaths(gitPublicationFiles(f.root,f.baseCommit),snapshot.files);
  await writeFile(f.reviewPath,JSON.stringify(f.review));
  f.options.reviewSha256=sha256(await readFile(f.reviewPath));
}

export async function reviewFixture(run) {
  const folder=await mkdtemp(join(tmpdir(),'release-review-')),root=join(folder,'public');
  try {
    for (const p of ['interview/company','knowledge/topic','images']) await mkdir(join(root,p),{recursive:true});
    await writeFile(join(root,'interview/_tree.json'),'[]'); await writeFile(join(root,'knowledge/_tree.json'),'[]');
    git(root,'init','-q');git(root,'add','.');git(root,'commit','-qm','baseline');
    const baseCommit=git(root,'rev-parse','HEAD');
    const original='问题😀',url='https://www.nowcoder.com/discuss/123456789';
    const sourcePath=join(folder,'source.json');
    await writeFile(sourcePath,JSON.stringify({document:{canonicalUrl:url,text:original}}));
    const interview={key:'article',filePath:'company',isLeaf:true,contentFormat:'short-qa-v1'};
    const knowledge={key:'real-key',filePath:'topic',isLeaf:true,quickRead:{text:'独立速读与边界。'}};
    await writeFile(join(root,'interview/_tree.json'),JSON.stringify([interview]));
    await writeFile(join(root,'knowledge/_tree.json'),JSON.stringify([knowledge]));
    await writeFile(join(root,'interview/company/article.md'),'<details data-knowledge-key="real-key"><summary>（1）问题😀</summary></details>\n\n教学短答。\n');
    await writeFile(join(root,'knowledge/topic/real-key.md'),'知识原理。\n\n- [面经](../../interview/company/article.md)\n');
    await writeFile(join(root,'images/image.png'),'fixture asset bytes');
    const history={schemaVersion:1,updatedAt:'2026-10-05',records:{aaaaaaaaaaaa:{source:'nowcoder',url,contentHash:'1111111111111111',clusterId:'cluster-a',processUnitId:'process-a',evidenceGrade:'B',status:'prepared',articleKey:'article',publicFiles:['interview/company/article.md'],knowledgeKeys:['real-key'],processedAt:'2026-10-05T00:00:00Z'}}};
    history.records.aaaaaaaaaaaa.normalizedBodySha256=sha256(normalizedOriginal(original));
    const historyPath=join(folder,'history.json'),ledgerPath=join(folder,'questions.json'),independentPath=join(folder,'independent.json');
    await writeFile(historyPath,JSON.stringify(history));
    const ledger={rows:[{articleKey:'article',questions:[{sourceId:'aaaaaaaaaaaa',sourceSpan:[0,Array.from(original).length],sourceLiteral:original,publicQuestion:original,knowledgeKey:'real-key',teachingAnswer:'教学短答。',bindingStatus:'bound'}]}]};
    await writeFile(ledgerPath,JSON.stringify(ledger));await writeFile(independentPath,JSON.stringify({decision:'approved',reviewer:'synthetic independent reviewer fixture'}));
    const pin=async path=>({path,sha256:sha256(await readFile(path))});
    const snapshot=await publicInventory(root);
    const review={schemaVersion:1,kind:'resource-content-review',decision:'approved',baseCommit,coveredPaths:changedPublicationPaths(gitPublicationFiles(root,baseCommit),snapshot.files),history:await pin(historyPath),independentReview:await pin(independentPath),questionLedger:await pin(ledgerPath),publicFiles:snapshot.files,publicationDigest:snapshot.digest,articleKeys:['article'],sourceEvidence:[{...await pin(sourcePath),documentJson:true,sourceId:'aaaaaaaaaaaa',canonicalUrl:url,articleKey:'article',processUnitId:'process-a'}]};
    const reviewPath=join(folder,'review.json');await writeFile(reviewPath,JSON.stringify(review));
    const options={reviewPath,reviewSha256:sha256(await readFile(reviewPath))};
    await run({root,folder,history,historyPath,ledger,ledgerPath,review,reviewPath,options,sourcePath,interview,knowledge,baseCommit,pin});
  } finally {await rm(folder,{recursive:true,force:true});}
}
