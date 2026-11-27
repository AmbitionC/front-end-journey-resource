# 用法：python3 swap_anim.py key:old:new [...]（在资源仓根目录运行）
import json,hashlib,re,sys,glob
sha=lambda f: hashlib.sha256(open(f,'rb').read()).hexdigest()
pairs=[a.split(':') for a in sys.argv[1:]]
d=json.load(open('.codex/diagram-migration-history.json'))
recs={}
def walk(o):
  if isinstance(o,dict):
    if 'replacementAssets' in o and 'articlePath' in o: recs.setdefault(o['key'],[]).append(o)
    for v in o.values(): walk(v)
  elif isinstance(o,list):
    for v in o: walk(v)
walk(d)
manifest=open('knowledge/pdf-static-images.json').read()
for key,old,new in pairs:
  rec=recs[key][0]; art=rec['articlePath']
  t=open(art).read()
  n=t.count(f'{old}.dark.png')
  assert n==1, (key, old, n)
  open(art,'w').write(t.replace(f'{old}.dark.png',f'{new}.dark.png'))
  src=f'images/diagram-sources/{new}.aj.mjs'
  for r in recs[key]:
    r['replacementAssets']=[x for x in r['replacementAssets'] if not x['source'].endswith(f'/{old}.aj.mjs')]+[{"source":src,"sourceSha256":sha(src),"darkPng":f"images/{new}.dark.png","lightPng":f"images/{new}.light.png","darkSha256":sha(f"images/{new}.dark.png"),"lightSha256":sha(f"images/{new}.light.png"),"darkSvg":f"images/{new}.dark.svg","lightSvg":f"images/{new}.light.svg","darkSvgSha256":sha(f"images/{new}.dark.svg"),"lightSvgSha256":sha(f"images/{new}.light.svg")}]
    r['animated']=True
  manifest,c=re.subn(r'("articlePath": "'+re.escape(art)+r'",\s*"articleSha256": ")[a-f0-9]{64}',lambda m:m.group(1)+sha(art),manifest)
  print(key, art, 'manifest', c)
open('knowledge/pdf-static-images.json','w').write(manifest)
open('.codex/diagram-migration-history.json','w').write(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
