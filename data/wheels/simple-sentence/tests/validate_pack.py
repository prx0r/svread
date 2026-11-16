#!/usr/bin/env python3
"""Standard library-only consistency checks for Simple Sentence Wheel educational data.
Runs from tests/, no network needed. Does NOT establish morphological correctness."""
from pathlib import Path
import json,collections,sys
root=Path(__file__).resolve().parents[1]
load=lambda p: json.loads((root/p).read_text(encoding='utf-8'))
lex=load('data/lexicon_20.json');verbs=load('data/roots_10_three_tenses.json');cards=load('exercises/full_practice_bank.json');w=load('data/wheel_contract.json')
assert len(lex)==20 and len(verbs)==10
assert len({x['id'] for x in lex})==20
assert len({x['id'] for x in verbs})==10
assert len(w['rings'])==5 and [x['id'] for x in w['levels']]==['1.1','1.2','1.3','1.4']
assert len({x['id'] for x in cards})==len(cards)
assert len(cards)>=200
for v in verbs:
 assert set(v['forms'])=={'present','imperfect','future'}
 assert all(set(v['forms'][t])=={'first_sg','second_sg','third_sg'} for t in v['forms'])
 assert all(v['forms'][t][p] for t in v['forms'] for p in v['forms'][t])
 assert all(x in {n['id'] for n in lex} for x in v['object_ids'])
for x in cards:
 assert x.get('stage') and x.get('type') and x.get('answer_dev') and x.get('prompt_en')
 if x.get('root'):
  v=next(v for v in verbs if v['id']==x['root'])
  if x.get('object'): assert x['object'] in v['object_ids']
  if x.get('person') and x.get('tense'):
   assert v['forms'][x['tense']][x['person']] in x['answer_dev']
assert next(v for v in verbs if v['id']=='shru')['forms']['imperfect']['first_sg']=='अशृणवम्'
assert next(v for v in verbs if v['id']=='kr')['forms']['imperfect']['first_sg']=='अकरवम्'
assert next(v for v in verbs if v['id']=='da')['forms']['imperfect']['third_sg']=='अददात्'
assert next(n for n in lex if n['id']=='teacher')['forms']['ins_sg']=='गुरुणा'
assert next(n for n in lex if n['id']=='ashram')['forms']['loc_sg']=='आश्रमे'
print('PASS: 20-word lexicon, 10 roots, 90 conjugations, five dependent rings, four levels,')
print('      '+str(len(cards))+' practice cards, vocabulary compatibility and irregular-form spot checks.')
print('Practice stages:', dict(collections.Counter(c['stage'] for c in cards)))
