import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { publicInventory, sha256, normalizedOriginal, changedPublicationPaths, gitPublicationFiles } from '../scripts/content-review.mjs';
import { leaves } from '../scripts/validate-tree.mjs';
import { KNOWLEDGE_SKILL_PATH } from '../scripts/interview-knowledge-processing.mjs';

export function git(root,...args) {
  return execFileSync('git',['-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false','-c','user.name=Fixture','-c','user.email=fixture@example.invalid',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}

// Synthetic reviewer authority is confined to tests. Production gets this
// pin from its independent reviewer and authenticated GitHub attestation.
export async function freezeFixtureReview(f, { refreshKnowledgeEvidence = true } = {}) {
  const snapshot=await publicInventory(f.root);
  if (refreshKnowledgeEvidence) {
    const tree = leaves(JSON.parse(await readFile(join(f.root, 'knowledge/_tree.json'), 'utf8')));
    const baseline = gitPublicationFiles(f.root, f.review.baseCommit);
    const skill = { name: 'generate-knowledge-docs', path: KNOWLEDGE_SKILL_PATH, sha256: sha256(await readFile(join(f.root, KNOWLEDGE_SKILL_PATH))) };
    const quality = [];
    for (const row of f.ledger.rows) for (const [questionIndex, question] of row.questions.entries()) {
      if (question.bindingStatus !== 'bound' || !question.knowledgeKey) continue;
      const leaf = tree.find(node => node.key === question.knowledgeKey);
      if (!leaf) continue;
      const path = `knowledge/${leaf.filePath}/${leaf.key}.md`, previous = baseline.find(file => file.path === path);
      const action = previous ? 'reuse' : 'create';
      const tracePath = join(f.folder, `synthetic-trace-${row.articleKey}-${questionIndex}.txt`);
      await writeFile(tracePath, 'TEST ONLY: synthetic runner read the actual skill, searched candidate bodies and reviewed the teaching outcome.');
      const executionPath = join(f.folder, `synthetic-execution-${row.articleKey}-${questionIndex}.json`);
      await writeFile(executionPath, JSON.stringify({ schemaVersion: 1, kind: 'knowledge-skill-execution', status: 'completed', stage: 'processing', skill,
        sourceId: question.sourceId, articleKey: row.articleKey, knowledgeKey: question.knowledgeKey, action,
        output: { path, sha256: snapshot.files.find(file => file.path === path).sha256 }, trace: await f.pin(tracePath) }));
      question.knowledgeAssociation = { action, searchQuery: question.publicQuestion, rationale: 'TEST ONLY: synthetic semantic decision.',
        candidates: previous ? [{ key: question.knowledgeKey, sha256: previous.sha256 }] : [], skillExecution: await f.pin(executionPath) };
      quality.push({ articleKey: row.articleKey, sourceId: question.sourceId, questionIndex, knowledgeKey: question.knowledgeKey,
        skillExecutionSha256: question.knowledgeAssociation.skillExecution.sha256, decision: 'approved',
        accuracy: true, pedagogy: true, sources: true, semanticReuse: true, rationale: 'TEST ONLY: synthetic independent knowledge reviewer.' });
    }
    await writeFile(f.ledgerPath, JSON.stringify(f.ledger));
    const independent = JSON.parse(await readFile(f.review.independentReview.path, 'utf8'));
    independent.knowledgeQuality = { publicationDigest: snapshot.digest, questionLedgerSha256: (await f.pin(f.ledgerPath)).sha256, questions: quality };
    await writeFile(f.review.independentReview.path, JSON.stringify(independent));
    f.review.independentReview = await f.pin(f.review.independentReview.path);
  }
  f.review.history=await f.pin(f.historyPath);
  f.review.questionLedger=await f.pin(f.ledgerPath);
  f.review.publicFiles=snapshot.files; f.review.publicationDigest=snapshot.digest;
  f.review.coveredPaths=changedPublicationPaths(gitPublicationFiles(f.root,f.baseCommit),snapshot.files);
  await writeFile(f.reviewPath,JSON.stringify(f.review));
  f.options.reviewSha256=sha256(await readFile(f.reviewPath));
}

export async function reviewFixture(run) {
  const originalActions=process.env.GITHUB_ACTIONS,originalSha=process.env.GITHUB_SHA;
  delete process.env.GITHUB_ACTIONS;delete process.env.GITHUB_SHA;
  const folder=await mkdtemp(join(tmpdir(),'release-review-')),root=join(folder,'public');
  try {
    for (const p of ['interview/company','knowledge/topic','images','.codex/skills/generate-knowledge-docs']) await mkdir(join(root,p),{recursive:true});
    await writeFile(join(root, KNOWLEDGE_SKILL_PATH), await readFile(new URL(`../${KNOWLEDGE_SKILL_PATH}`, import.meta.url)));
    await writeFile(join(root,'interview/_tree.json'),'[]'); await writeFile(join(root,'knowledge/_tree.json'),'[]');
    git(root,'init','-q');git(root,'add','.');git(root,'commit','-qm','baseline');
    const baseCommit=git(root,'rev-parse','HEAD');
    const original='问题😀',url='https://www.nowcoder.com/discuss/123456789';
    const sourcePath=join(folder,'source.json');
    await writeFile(sourcePath,JSON.stringify({document:{canonicalUrl:url,text:original}}));
    const interview={key:'article',filePath:'company',isLeaf:true,contentFormat:'short-qa-v1'};
    const knowledge={key:'real-key',filePath:'topic',isLeaf:true,interviewBaseHeat:0,quickRead:{text:'独立速读与边界。'}};
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
    const fixture={root,folder,history,historyPath,ledger,ledgerPath,review,reviewPath,options,sourcePath,interview,knowledge,baseCommit,pin};
    await freezeFixtureReview(fixture);
    await run(fixture);
  } finally {
    await rm(folder,{recursive:true,force:true});
    if(originalActions===undefined)delete process.env.GITHUB_ACTIONS;else process.env.GITHUB_ACTIONS=originalActions;
    if(originalSha===undefined)delete process.env.GITHUB_SHA;else process.env.GITHUB_SHA=originalSha;
  }
}
