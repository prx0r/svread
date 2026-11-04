#!/usr/bin/env python3
"""Project the pinned IPVV Pushing index into a navigable, non-authoritative catalogue."""
import argparse, json, re, subprocess
from pathlib import Path

REV='941ac2ecf1f8e5791a887d9d769159ecbffd7c04'

def build(repo):
    raw=subprocess.check_output(['git','-C',str(repo),'show',REV+':site/data/pushing/INDEX.json'])
    source=json.loads(raw); tree=subprocess.check_output(['git','-C',str(repo),'ls-tree','-rz',REV,'site/data/pushing'])
    blobs={}
    for item in tree.split(b'\0'):
        if not item:continue
        head,path=item.split(b'\t',1);mode,kind,digest=head.decode().split()
        if kind=='blob':blobs[path.decode()]=digest
    records=[]
    for row in source['records']:
        file=row.get('file','');path='site/data/pushing/'+file
        if not re.fullmatch(r'[A-Za-z0-9_./-]+\.md',file) or '..' in file.split('/') or path not in blobs:
            raise ValueError('Indexed session path missing or unsafe: '+str(file))
        questions=[q.get('q','').strip() for q in row.get('questions',[]) if isinstance(q.get('q'),str) and q.get('q','').strip()]
        records.append({'file':file,'title':row.get('title','').strip(),'work':row.get('work_hint',''),
                        'question':questions[0] if questions else row.get('title','').strip(),'git_blob':blobs[path]})
    return {'format':'svread-pushing-catalog/1','revision':REV,'records':records}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--ipvv',required=True);parser.add_argument('--output',default='data/pushing-catalog.json');a=parser.parse_args()
    result=build(Path(a.ipvv));Path(a.output).write_text(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)+'\n',encoding='utf-8')
    print('Indexed',len(result['records']),'prior enquiries at',REV[:12])
if __name__=='__main__':main()
