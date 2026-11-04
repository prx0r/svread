#!/usr/bin/env python3
"""Index pinned research paths and Git blob IDs without copying research content."""
import argparse, json, subprocess
from pathlib import Path

SOURCES = {
    'patalacheckpoints': {'revision':'634d3cc46909b8a57f7061ed297902d07c539f78',
      'include': lambda p: p.startswith('docs/vision/') or p in (
        'machinelearning/research/patala_ml/pushing.py', 'machinelearning/research/patala_ml/essay.py',
        'machinelearning/research/patala_ml/essay_compiler.py','pipeline/essay_worker.py') or
        (p.startswith('benchmarks/v0/review/') and 'ESSAY' in p)},
    'the-library': {'revision':'088b73f2e6498cdc8b2e8997ca091d04dbcb4556',
      'include': lambda p: p.startswith('research-library/pushing/') or
        (p.startswith('research-library/') and p.count('/')==1 and 'ESSAY' in p.upper()) or
        p in ('research-library/recognition/r2-audio-transcripts/logicvid3.md',
              'research-library/recognition/r2-audio-transcripts/logicvidsmethod.md')},
    'ipvv': {'revision':'941ac2ecf1f8e5791a887d9d769159ecbffd7c04',
      'include': lambda p: p.startswith('site/data/pushing/') or p in
        ('process/PUSHING-QUESTION-CRAFT.md','specs/use-cases/pushing-copilot.md',
         'specs/use-cases/pushing-graph.md','specs/use-cases/curriculum.md')},
}

def build(paths):
    result={'format':'svread-pushing-research-index/1','repositories':{}}
    for name,settings in SOURCES.items():
        repo=Path(paths[name]);rev=settings['revision'];raw=subprocess.check_output(['git','-C',str(repo),'ls-tree','-rz','--full-tree',rev])
        files=[]
        for item in raw.split(b'\0'):
            if not item: continue
            head,path=item.split(b'\t',1);mode,kind,blob=head.decode().split();path=path.decode()
            if kind=='blob' and settings['include'](path):files.append({'path':path,'git_blob':blob})
        result['repositories'][name]={'revision':rev,'files':sorted(files,key=lambda x:x['path'])}
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in SOURCES:parser.add_argument('--'+name,required=True)
    parser.add_argument('--output',default='data/pushing-source-index.json')
    args=parser.parse_args();result=build({name:getattr(args,name.replace('-','_')) for name in SOURCES})
    Path(args.output).write_text(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)+'\n',encoding='utf-8')
    for name,repo in result['repositories'].items():print(name,len(repo['files']),'files at',repo['revision'][:12])
if __name__=='__main__':main()
