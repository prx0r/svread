#!/usr/bin/env python3
"""Local stdio MCP bridge to bundled evidence and the authenticated Scholar API."""
import difflib, hashlib, importlib.metadata, json, os, re, sys, tempfile, urllib.error, urllib.parse, urllib.request
from pathlib import Path
import audit as draft_audit
import claims as claim_table
import search as corpus_search
try:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'tools'))
    import lingua as lingua_resolver
except ImportError:
    lingua_resolver = None
try:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'tools'))
    import certlib
except ImportError:
    certlib = None

ROOT = Path(__file__).resolve().parent.parent
IDENT = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$')
WORK = re.compile(r'^[a-z0-9][a-z0-9_-]{0,79}$')

def canonical(x):
    return json.dumps(x, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()

def projection(work):
    if not isinstance(work, str) or not WORK.fullmatch(work): raise ValueError('Invalid work ID')
    if work == 'ghatakarpara': raise ValueError('Evidence withheld: source alignment needs upstream repair')
    p = ROOT / 'data' / 'scholar' / (work + '.json')
    try: d = json.loads(p.read_text(encoding='utf-8'))
    except FileNotFoundError: raise ValueError('Work has no bundled Scholar projection')
    claimed = d.get('projection_sha256')
    if d.get('work') != work or claimed != hashlib.sha256(canonical({k:v for k,v in d.items() if k != 'projection_sha256'})).hexdigest():
        raise ValueError('Projection hash or work ID mismatch')
    return d

def evidence(a, data=None):
    work, target = a.get('work'), a.get('target')
    if not isinstance(target, str) or not IDENT.fullmatch(target): raise ValueError('Invalid target ID')
    d = data if data is not None else projection(work); song = re.sub(r'-v\d+$', '', target)
    if song in d.get('withheld_songs', []) or not d.get('source_verses', {}).get(target) or not d.get('originals', {}).get('t1', {}).get(target):
        raise ValueError('Passage unavailable or withheld')
    layers = {}
    for layer in ('t1','l0','argmap','l2','c1','l3','l4','c2'):
        key = song if layer in ('c1','c2') else target
        value = d.get('originals', {}).get(layer, {}).get(key)
        if value is not None:
            expected = d.get('original_hashes', {}).get(layer, {}).get(key)
            if expected != hashlib.sha256(canonical(value)).hexdigest(): raise ValueError('Layer hash mismatch')
            layers[layer] = value
    return {'work':work, 'target':target, 'source':d['source_verses'][target], 'layers':layers,
            'l4_craft':d.get('l4_craft', {}).get(target, []), 'projection_sha256':d['projection_sha256'],
            'warning':'Bundled snapshot; hashes establish integrity, not philological correctness or human review.'}

def bundled_claim_revision(marker):
    """Resolve only an actual available passage in the local verified bundle."""
    match = draft_audit.CHUNK_MARKER_RE.fullmatch(marker)
    if not match:
        raise ValueError('Not a bundled passage reference')
    return evidence({'work': match.group(1), 'target': match.group(2)})['projection_sha256']

def versions(a, include_content=False):
    work, target, layer = a.get('work'), a.get('target'), a.get('layer')
    if layer not in ('t1','l0','argmap','l2','c1','l3','l4','c2'): raise ValueError('Invalid layer')
    d=projection(work); evidence(a,d)
    key=re.sub(r'-v\d+$','',target) if layer in ('c1','c2') else target
    original=d.get('originals',{}).get(layer,{}).get(key)
    if original is None: raise ValueError('Layer unavailable for this passage')
    original_hash=d.get('original_hashes',{}).get(layer,{}).get(key)
    if hashlib.sha256(canonical(original)).hexdigest()!=original_hash: raise ValueError('Original layer hash mismatch')
    rows=[{'version_id':'original','author':None,'author_kind':'unknown','status':'canonical-source-layer',
           'parent':None,'content_sha256':original_hash,'content':original}]
    for v in d.get('versions',[]):
        if v.get('work')!=work or v.get('target')!=key or v.get('layer')!=layer: continue
        content=v.get('content');digest=v.get('content_sha256')
        if not isinstance(content,dict) or hashlib.sha256(canonical(content)).hexdigest()!=digest: raise ValueError('Version content hash mismatch')
        rows.append({'version_id':v.get('version_id'),'author':v.get('author'),'author_kind':v.get('author_kind','unknown'),
                     'status':v.get('status','unknown'),'parent':v.get('parent'),'content_sha256':digest,'content':content})
    if not include_content:
        rows=[{k:v for k,v in row.items() if k!='content'} for row in rows]
    return {'work':work,'target':target,'layer_target':key,'layer':layer,'projection_sha256':d['projection_sha256'],
            'versions':rows,'warning':'A stored version or hash does not establish human review or approval.'}

def compare_versions(a):
    result=versions(a,True); left=a.get('left');right=a.get('right')
    if not isinstance(left,str) or not isinstance(right,str): raise ValueError('Choose two version IDs')
    lookup={v['version_id']:v for v in result['versions']}
    if left not in lookup or right not in lookup: raise ValueError('Version not found for this passage and layer')
    one=json.dumps(lookup[left]['content'],ensure_ascii=False,sort_keys=True,indent=2).splitlines(keepends=True)
    two=json.dumps(lookup[right]['content'],ensure_ascii=False,sort_keys=True,indent=2).splitlines(keepends=True)
    diff=''.join(difflib.unified_diff(one,two,fromfile=left,tofile=right))
    result.pop('versions');result.update({'left':{k:v for k,v in lookup[left].items() if k!='content'},
      'right':{k:v for k,v in lookup[right].items() if k!='content'},'diff':diff[:60000],'truncated':len(diff)>60000})
    return result

def vidyut_candidates(a):
    ev=evidence(a)
    source=ev['source'].get('text') if isinstance(ev['source'],dict) else None
    if not isinstance(source,str) or not source.strip(): raise ValueError('Source text unavailable')
    try:
        version=importlib.metadata.version('vidyut')
        from vidyut.lipi import Scheme,transliterate
    except (ImportError,importlib.metadata.PackageNotFoundError) as exc:
        raise ValueError('Install the optional vidyut==0.4.0 package') from exc
    if version!='0.4.0': raise ValueError('Expected vidyut 0.4.0')
    scheme=a.get('scheme','iast');src={'iast':Scheme.Iast,'devanagari':Scheme.Devanagari}.get(scheme)
    if src is None: raise ValueError('Choose iast or devanagari')
    slp=transliterate(source,src,Scheme.Slp1)
    result={'work':ev['work'],'target':ev['target'],'projection_sha256':ev['projection_sha256'],
            'source_text_sha256':hashlib.sha256(source.encode()).hexdigest(),'source_scheme':scheme,
            'slp1_candidate':slp,'generator':{'name':'vidyut','version':version},
            'status':'machine-generated-unreviewed','warning':'Verify source coverage, script and analysis independently.'}
    if a.get('meter') is True:
        meter=os.environ.get('SCHOLAR_VIDYUT_METERS','')
        if not meter: raise ValueError('Set SCHOLAR_VIDYUT_METERS to a licensed meter file')
        try: raw=Path(meter).read_bytes()
        except OSError as exc: raise ValueError('Meter file unavailable') from exc
        if not raw or len(raw)>2_000_000: raise ValueError('Meter file must be nonempty and no larger than 2 MB')
        from vidyut.chandas import Chandas
        with tempfile.NamedTemporaryFile() as pinned:
            pinned.write(raw);pinned.flush();match=Chandas(pinned.name).classify(slp)
        result['meter_candidate']={'name_slp1':match.padya,'meter_data_sha256':hashlib.sha256(raw).hexdigest(),
          'syllables':[[{'text':x.text,'weight':x.weight} for x in row] for row in match.aksharas],
          'warning':'Experimental; not a verified metre.'}
    return result

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None

def api(method, path, data=None):
    origin = os.environ.get('SCHOLAR_API_ORIGIN', '')
    cookie = os.environ.get('SCHOLAR_SESSION_COOKIE', '')
    parsed = urllib.parse.urlsplit(origin)
    if (not parsed.hostname or parsed.username or parsed.password or parsed.path not in ('','/') or parsed.query or parsed.fragment or
        not (parsed.scheme == 'https' or (parsed.scheme == 'http' and parsed.hostname in ('localhost','127.0.0.1','::1')))):
        raise ValueError('Configure SCHOLAR_API_ORIGIN as HTTPS or a loopback HTTP origin')
    if not cookie or '\n' in cookie or '\r' in cookie: raise ValueError('Configure SCHOLAR_SESSION_COOKIE privately')
    raw = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(origin.rstrip('/') + path, data=raw, method=method,
                                 headers={'Cookie':cookie, 'Content-Type':'application/json', 'Accept':'application/json',
                                          'User-Agent':'svread-scholar-mcp/0.1'})
    try:
        with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as response:
            payload = response.read(1024*1024+1)
            if len(payload)>1024*1024: raise ValueError('Scholar response too large')
            return json.loads(payload)
    except urllib.error.HTTPError as exc:
        try: msg=json.loads(exc.read(16384)).get('error','Request failed')
        except (ValueError, AttributeError): msg='Request failed'
        raise ValueError('Scholar API %s: %s' % (exc.code, str(msg)[:500]))
    except urllib.error.URLError: raise ValueError('Scholar API unavailable')

def ident(v):
    if not isinstance(v,str) or not IDENT.fullmatch(v): raise ValueError('Invalid ID')
    return v


def _wheel_norm(t):
    import unicodedata
    t = (t or '').lower()
    t = ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    return ''.join(c for c in t if c.isalnum())

def _wheel_pack():
    return json.loads((ROOT / 'data' / 'grammar' / 'wheel-pack.json').read_text(encoding='utf-8'))

def _wheel_harness():
    return json.loads((ROOT / 'data' / 'wheels' / 'harness.json').read_text(encoding='utf-8'))

def _wheel_find(form):
    pack = _wheel_pack()
    nq = _wheel_norm(form)
    if not nq: raise ValueError('Empty form')
    for e in pack.get('entries', []):
        cands = {_wheel_norm(e.get('iast', '')), _wheel_norm(e.get('deva', ''))}
        cands.update(_wheel_norm(x.get('iast', '')) for x in (e.get('all_surfaces') or []))
        cands.update(_wheel_norm(x.get('deva', '')) for x in (e.get('all_surfaces') or []))
        if nq in cands or (e.get('deva', '') or '').strip() == (form or '').strip():
            return e
    raise ValueError('Form not on file: no pack entry matches (closed world: unlisted forms never render)')

def wheel_lookup(a):
    e = _wheel_find(a.get('form'))
    links = json.loads((ROOT / 'data' / 'grammar' / 'wheel-links.json').read_text(encoding='utf-8')).get('links', {})
    lk = links.get(e['id'], {})
    return {'id': e['id'], 'kind': e.get('kind'), 'iast': e.get('iast'), 'deva': e.get('deva'),
            'status': e.get('status'), 'teaching_sutra': e.get('teaching_sutra'),
            'curated_note': e.get('curated_note'),
            'machine_rules': e.get('machine_rules', []),
            'prakriya': e.get('prakriya', [])[:12],
            'lessons': (lk.get('lessons') or [])[:4],
            'verses': (lk.get('verses') or [])[:6],
            'warning': 'Machine trace is unreviewed computation; CURATED notes are teaching entries, not derivations.'}

def wheel_verify(a):
    e = _wheel_find(a.get('form'))
    cc = json.loads((ROOT / 'data' / 'grammar' / 'crosscheck.json').read_text(encoding='utf-8'))
    rows = {r['id']: r for r in cc.get('rows', [])}
    attr2end = {'tral': 'place', 'da': 'time', 'tasil': 'source', 'thal': 'manner'}
    row = None
    if e['id'] == 'kim-katham':
        row = dict(rows.get('kim-manner', {})); row['crosscheck_id'] = 'kim-manner'
    else:
        parts = e['id'].split('-')
        if len(parts) == 2 and parts[1] in attr2end:
            rid = parts[0] + '-' + attr2end[parts[1]]
            if rid in rows:
                row = dict(rows[rid]); row['crosscheck_id'] = rid
    verdict = 'UNVERIFIED'
    if e.get('status') == 'DERIVED': verdict = 'MACHINE_DERIVED'
    if e.get('kind') == 'curated-note' or e.get('status') == 'CURATED': verdict = 'CURATED_ONLY'
    if row is not None:
        if row.get('agree') is True: verdict = 'AGREE'
        elif row.get('agree') is False: verdict = 'DISAGREE_STANDS'
        else: verdict = 'MACHINE_GAP'
    return {'form': a.get('form'), 'pack_id': e['id'], 'verdict': verdict,
            'iast': e.get('iast'), 'deva': e.get('deva'),
            'evidence': {'machine_rules': e.get('machine_rules', []),
                         'machine_surfaces': (row or {}).get('machine_surfaces'),
                         'note': (row or {}).get('note') or e.get('curated_note'),
                         'verses': (json.loads((ROOT / 'data' / 'grammar' / 'wheel-links.json').read_text(encoding='utf-8')).get('links', {}).get(e['id'], {}).get('verses') or [])[:4]},
            'rule': 'AGREE = machine confirms curated. DISAGREE_STANDS = teach curated, name the special. MACHINE_GAP = say the machine cannot derive it. Never invent a trace.'}

def wheel_certificate(a):
    """Mechanics stamp: the stored certificate + a live tier-2 recompute
    (recompute from the pack, never trust the stored bytes)."""
    if certlib is None:
        raise ValueError('certlib unavailable')
    e = _wheel_find(a.get('form'))
    pack = _wheel_pack()
    entry = next((x for x in pack.get('entries', []) if x['id'] == e['id']), None)
    if not entry or not entry.get('prakriya'):
        return {'form': e.get('iast'), 'pack_id': e['id'], 'certificate': None,
                'reason': 'no derivation trace on file — a certificate is not applicable'}
    cp = ROOT / 'data' / 'grammar' / 'certificates.json'
    if not cp.exists():
        return {'form': e.get('iast'), 'pack_id': e['id'], 'certificate': None,
                'reason': 'certificates not generated — run tools/emit_certificates.py'}
    certs = {c['pack_id']: c for c in json.loads(cp.read_text(encoding='utf-8')).get('entries', [])}
    cert = certs.get(e['id'])
    if cert is None:
        return {'form': e.get('iast'), 'pack_id': e['id'], 'certificate': None,
                'reason': 'certificate missing for this traced entry — regenerate'}
    tier2 = certlib.verify(entry, cert)
    # Independent Lean check (external review of svread #15): never trust the
    # certificate's own lean_status. Re-bind it to the vendored receipt and the
    # current pack bytes.
    lean_independent = {'checked': False, 'reason': 'no receipt'}
    rp = ROOT / 'data' / 'grammar' / 'prakriya-receipt.json'
    if rp.exists():
        try:
            rec = json.loads(rp.read_text(encoding='utf-8'))
            pack_sha = __import__('hashlib').sha256(
                (ROOT / 'data' / 'grammar' / 'wheel-pack.json').read_bytes()).hexdigest()
            lean = cert.get('lean') or {}
            problems = []
            if rec.get('exit_code') != 0:
                problems.append('receipt records a failed lean run')
            if rec.get('pack_sha256') != pack_sha:
                problems.append('receipt is stale (pack changed)')
            if lean.get('pack_sha256') != pack_sha:
                problems.append('certificate binding does not match this pack')
            if lean.get('file_sha256') != rec.get('file_sha256'):
                problems.append('certificate binding does not match the receipt file')
            if cert.get('lean_status') != 'checked':
                problems.append('certificate does not claim checked')
            lean_independent = ({'checked': True,
                                 'lean_version': rec.get('lean_version'),
                                 'scope': rec.get('scope')}
                                if not problems else
                                {'checked': False, 'reason': '; '.join(problems)})
        except Exception as exc:
            lean_independent = {'checked': False, 'reason': f'receipt unreadable: {exc}'}
    return {'form': e.get('iast'), 'pack_id': e['id'], 'certificate': cert,
            'tier2': tier2,
            'lean_status': cert.get('lean_status'),
            'lean_independent': lean_independent,
            'note': ('Tier-2 recomputes from the pack; lean_independent re-binds the '
                     'certificate to the vendored receipt and the pack bytes. Even when '
                     'checked, the scope is structural well-formedness over the rule '
                     'set — never a derivation from the Aṣṭādhyāyī, never meaning.')}

def wheel_level(a):
    n = a.get('level')
    if not isinstance(n, int) or not 1 <= n <= 6: raise ValueError('level must be 1-6')
    h = _wheel_harness()
    t = h['tutor'][n - 1]
    text = (ROOT / 'data' / 'wheels' / 'tutor' / t['file']).read_text(encoding='utf-8')
    stages = h['decision_tree']['stages']
    return {'level': n, 'title': t['title'], 'covers': t['covers'], 'url': t['url'],
            'prompt': text, 'gate': stages[n - 1],
            'display': h['display']['anchors'].get(f'level-{n}')}

TWROOT = Path(os.environ.get('TRANSLATION_WORK', '/root/translation-work'))
LAYER8 = ('t1', 'l0', 'argmap', 'l2', 'l3', 'l4', 'c1', 'c2')

def _tw():
    if not TWROOT.is_dir() or not (TWROOT / 'REGISTRY.json').exists():
        raise ValueError('Canonical layer corpus unavailable here (no translation-work checkout)')
    return TWROOT

def _layers_index_doc():
    p = ROOT / 'data' / 'layers-index.json'
    try:
        d = json.loads(p.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        raise ValueError('Layers index not emitted here')
    if d.get('format') != 'svread-layers-index/1':
        raise ValueError('Layers index format unsupported')
    return d

def layers_index(a):
    w = a.get('work')
    d = _layers_index_doc()
    if w is not None:
        if not isinstance(w, str) or not WORK.fullmatch(w):
            raise ValueError('Invalid work ID')
        hit = next((x for x in d['works'] if x['work'] == w), None)
        if hit is None:
            raise ValueError('Work has no canonical layer data')
        return {'work': hit, 'provenance': d['provenance'],
                'warning': 'Read-only map of another lane. Hashes identify bytes; gold means machine-proposed unless a human signed it.'}
    rows = []
    for x in d['works']:
        have = sorted({L for s in x['songs'] for L in s['layers']})
        rows.append({'work': x['work'], 'registry_status': x['registry_status'],
                     'gold': x['gold'], 'site_bundle': x['site_bundle'],
                     'songs': len(x['songs']), 'layers_present': have,
                     'verse_ids': sum(len(s['verse_ids']) for s in x['songs'])})
    return {'counts': d['counts'], 'works': rows, 'provenance': d['provenance'],
            'warning': 'Read-only map of another lane. Hashes identify bytes; gold means machine-proposed unless a human signed it.'}

def _song_hits(tw, work, target):
    """Find canonical layer records for one target across work dirs.

    Target is a verse id (e.g. tsa-a22-v01). If it names a song instead,
    returns the song's layers as summaries, not full dumps."""
    dirs = [tw / work] if (tw / work / 'data').is_dir() else sorted(
        p for p in tw.iterdir() if p.is_dir() and (p / 'data').is_dir())
    verse, songs = [], {}
    for d in dirs:
        for f in sorted((d / 'data').glob('*.json')):
            parts = f.name.split('.')
            if len(parts) < 3 or parts[-1] != 'json' or parts[-2] not in LAYER8:
                continue
            song, layer = '.'.join(parts[:-2]), parts[-2]
            try:
                doc = json.loads(f.read_text(encoding='utf-8'))
            except (OSError, ValueError):
                continue
            recs = doc if isinstance(doc, list) else [doc]
            match = [r for r in recs if isinstance(r, dict)
                     and (r.get('verse_id') == target or r.get('song') == target)]
            sha = hashlib.sha256(canonical(doc)).hexdigest()
            meta = {'workdir': d.name, 'song': song, 'file': f'data/{f.name}',
                    'sha256': sha, 'rows': len(recs)}
            if match:
                verse.append((meta, recs if song == target else match))
            elif song == target:
                songs.setdefault(song, {})[layer] = dict(meta, rows=len(recs))
    return verse, songs

def _registry_note(tw, workdir):
    try:
        reg = json.loads((tw / 'REGISTRY.json').read_text(encoding='utf-8'))
        row = next((w for w in reg.get('works', []) if w.get('work') == workdir), {})
    except (OSError, ValueError):
        row = {}
    status = None
    try:
        s = json.loads((tw / workdir / 'STATUS.json').read_text(encoding='utf-8'))
        status = {'counts': s.get('counts'), 'needs': s.get('needs')}
    except (OSError, ValueError):
        pass
    return {'status': row.get('status'), 'gold': bool(row.get('gold', False)),
            'review': status}

def passage_layers(a):
    work, target = a.get('work'), a.get('target')
    if not isinstance(work, str) or not WORK.fullmatch(work):
        raise ValueError('Invalid work ID')
    if not isinstance(target, str) or not IDENT.fullmatch(target):
        raise ValueError('Invalid target ID')
    layer = a.get('layer')
    if layer is not None and layer not in LAYER8:
        raise ValueError('Invalid layer')
    tw = _tw()
    verse, songs = _song_hits(tw, work, target)
    if not verse and not songs:
        raise ValueError('Passage unavailable in the canonical layer corpus')
    layers = {}
    for meta, recs in verse:
        f = tw / meta['workdir'] / meta['file']
        try:
            doc = json.loads(f.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            continue
        L = f.name.split('.')[-2]
        if layer is not None and L != layer:
            continue
        recs = doc if isinstance(doc, list) else [doc]
        got = [r for r in recs if isinstance(r, dict)
               and (r.get('verse_id') == target or r.get('song') == target)]
        if not got:
            continue
        layers[L] = {'data': got, 'sha256': hashlib.sha256(canonical(doc)).hexdigest(),
                     'file': meta['file'], 'workdir': meta['workdir']}
    if not layers:
        if songs:
            s = songs.get(target, {})
            return {'work': work, 'target': target, 'song_scope': True,
                    'layers': {L: {'summary_only': True, **m} for L, m in s.items()},
                    'note': 'Target names a whole song; verse-level data needs a verse id. verse_ids live in scholar__layers_index.'}
        raise ValueError('Passage unavailable in the canonical layer corpus')
    src = None
    for L in ('t1', 'l2'):
        for r in layers.get(L, {}).get('data', []):
            if isinstance(r, dict) and (r.get('source_file') or r.get('source_lines') is not None or r.get('sanskrit_cite')):
                src = {'source_file': r.get('source_file'),
                       'source_lines': r.get('source_lines'),
                       'sanskrit_cite': (r.get('sanskrit_cite') or '')[:400]}
                break
        if src:
            break
    dirs = sorted({layers[L]['workdir'] for L in layers})
    return {'work': work, 'target': target,
            'source': src, 'layers': layers,
            'review': {d: _registry_note(tw, d) for d in dirs},
            'warning': ('Canonical translation-work files, not the site projection. '
                        'Machine-proposed unless a human signed it; hashes identify bytes.')}

def translation_forks(a):
    work, target = a.get('work'), a.get('target')
    if not isinstance(work, str) or not WORK.fullmatch(work):
        raise ValueError('Invalid work ID')
    if not isinstance(target, str) or not IDENT.fullmatch(target):
        raise ValueError('Invalid target ID')
    tw = _tw()
    verse, _ = _song_hits(tw, work, target)
    l0_recs, am_recs, f_fork = [], [], None
    for meta, recs in verse:
        f = tw / meta['workdir'] / meta['file']
        L = f.name.split('.')[-2]
        if L == 'l0':
            for r in recs:
                if not isinstance(r, dict) or r.get('verse_id') != target:
                    continue
                opts = r.get('options') or []
                l0_recs.append({'surface': r.get('surface'), 'status': r.get('status'),
                                'fork': r.get('fork'), 'chosen_index': r.get('chosen_index'),
                                'morph': r.get('morph'),
                                'options': [{'gloss': o.get('gloss'), 'rank': o.get('rank'),
                                             'source': o.get('source')} for o in opts
                                            if isinstance(o, dict)]})
            f_fork = meta['file']
        elif L == 'argmap':
            for r in recs:
                if not isinstance(r, dict) or r.get('verse_id') != target:
                    continue
                am_recs.append({'question': r.get('question'),
                                'option_choices': r.get('option_choices'),
                                'uncertainties': r.get('uncertainties'),
                                'inference': (r.get('inference') or '')[:600]})
    if not l0_recs and not am_recs:
        raise ValueError('No L0/ARGMAP fork data for this passage here')
    forked = sum(1 for r in l0_recs if (r.get('fork') or 'none') != 'none'
                 or (r.get('status') or '') in ('AMBIGUOUS', 'FAILED')
                 or len(r.get('options') or []) > 1)
    return {'work': work, 'target': target,
            'tokens': len(l0_recs), 'forked_tokens': forked,
            'l0': l0_recs, 'argmap': am_recs,
            'warning': ('Ambiguity lives here by design; a fork is a question, '
                        'not a verdict. Machine-proposed unless reviewed.')}

def wheel_harness(a):
    h = _wheel_harness()
    return {'format': h['format'], 'origin': h['origin'], 'display': h['display'],
            'decision_tree': h['decision_tree'],
            'tutor': h['tutor'], 'verify_summary': h['verify']['crosscheck_summary'],
            'disagreements': h['verify']['disagreements'], 'gaps': h['verify']['gaps'],
            'pronunciation': h['pronunciation'], 'trika': h['trika'],
            'note': 'Full datasets + pack index: fetch data/wheels/harness.json (101KB, one fetch). This tool returns the map, not the territory.'}

def call(name,a):
    if not isinstance(a,dict): raise ValueError('Arguments must be an object')
    if name=='list_works':
        index=json.loads((ROOT/'data/scholar/index.json').read_text(encoding='utf-8'))
        return {'works':sorted(index), 'note':'Bundled projections; Ghaṭakarpara is withheld pending source repair.'}
    if name=='passage_evidence': return evidence(a)
    if name=='list_versions': return versions(a)
    if name=='compare_versions': return compare_versions(a)
    if name=='vidyut_candidates': return vidyut_candidates(a)
    if name=='list_documents':
        w=a.get('work');
        if not isinstance(w,str) or not WORK.fullmatch(w): raise ValueError('Invalid work ID')
        return api('GET','/api/scholar/documents?'+urllib.parse.urlencode({'work':w,'offset':a.get('offset',0)}))
    if name=='document_history': return api('GET','/api/scholar/documents/'+ident(a.get('document_id'))+'/history')
    if name=='list_reviews': return api('GET','/api/scholar/reviews')
    if name=='list_review_annotations': return api('GET','/api/scholar/reviews/'+ident(a.get('review_id'))+'/annotations')
    if name=='add_review_annotation':
        review=ident(a.get('review_id')); return api('POST','/api/scholar/reviews/'+review+'/annotations',{k:v for k,v in a.items() if k!='review_id'})
    if name=='list_style_examples': return api('GET','/api/scholar/style-examples')
    if name=='list_source_links': return api('GET','/api/scholar/source-links')
    if name=='save_source_link': return api('POST','/api/scholar/source-links',a)
    if name=='delete_source_link': return api('DELETE','/api/scholar/source-links/'+ident(a.get('link_id')),{})
    if name=='list_published_essays':
        w=a.get('work')
        if not isinstance(w,str) or not WORK.fullmatch(w): raise ValueError('Invalid work ID')
        return api('GET','/api/scholar/published-essays?'+urllib.parse.urlencode({'work':w}))
    if name=='list_sources': return api('GET','/api/scholar/sources')
    if name=='save_source': return api('POST','/api/scholar/sources',a)
    if name=='prepare_citations': return api('POST','/api/scholar/citations/prepare',a)
    if name=='delete_source': return api('DELETE','/api/scholar/sources/'+ident(a.get('source_id')),{})
    if name=='list_decisions': return api('GET','/api/scholar/decisions')
    if name=='save_decision': return api('POST','/api/scholar/decisions',a)
    if name=='delete_decision': return api('DELETE','/api/scholar/decisions/'+ident(a.get('decision_id')),{})
    if name=='save_document': return api('PUT','/api/scholar/documents/'+ident(a.get('document_id')),a.get('document'))
    if name=='request_review': return api('POST','/api/scholar/reviews',a)
    if name=='draft_with_qwen': return api('POST','/api/scholar/assist',a)
    if name=='search_texts':
        return corpus_search.search_texts(a.get('query'),work=a.get('work'),kind=a.get('kind'),
            top_k=a.get('top_k',8) if a.get('top_k') is not None else 8,gates=a.get('gates'))
    if name=='text_themes':
        return corpus_search.text_themes(work=a.get('work'),ref=a.get('ref'),query=a.get('query'))
    if name=='audit_draft':
        return draft_audit.audit(a.get('text'),refs=a.get('refs'),sources=a.get('sources'),
            identity=a.get('identity') or 'scholar-mcp/audit',model=a.get('model') or '')
    if name=='link_claims':
        return claim_table.link(a.get('text'),refs=a.get('refs'),
            essay_rev=a.get('essay_rev') or '',source_revs=a.get('source_revs') or {},
            resolver=bundled_claim_revision)
    if name=='check_claim_staleness':
        return claim_table.check_stale(a.get('record'),a.get('text'),source_revs=a.get('source_revs') or {},
            resolver=bundled_claim_revision)
    if name=='pushback':
        # Revision-bound candidate issues: failed quotes, uncited paragraphs,
        # unresolved links. An agent report until a human adopts it; interpretive
        # disagreement is reviewable, never auto-false.
        issues = []
        try:
            receipt = draft_audit.audit(a.get('text'),refs=a.get('refs'),
                sources=a.get('sources'),identity='scholar-mcp/pushback')
            for c in receipt.get('checks', []):
                if c.get('status') == 'fail':
                    issues.append({'category': c.get('check'), 'scope': 'same-paragraph sources',
                                   'reason': c.get('detail'), 'status': 'CANDIDATE'})
                elif c.get('status') == 'warn':
                    issues.append({'category': c.get('check'), 'scope': 'whole draft',
                                   'reason': c.get('detail'), 'status': 'CANDIDATE'})
        except ValueError as exc:
            issues.append({'category': 'input', 'scope': 'request',
                           'reason': str(exc), 'status': 'CANDIDATE'})
        table = claim_table.link(a.get('text'),refs=a.get('refs'),
            source_revs=(a.get('sources') or {}).get('revs', {}),resolver=bundled_claim_revision)
        for c in table.get('claims', []):
            if c.get('citation') == 'UNCITED' and len(' '.join(c.get('quotes', [])).split()) > 0:
                pass
            if c.get('citation') == 'UNCITED':
                issues.append({'category': 'uncited-claim', 'scope': f"para {c.get('para')}",
                               'reason': 'paragraph carries no citation marker', 'status': 'CANDIDATE'})
            for l in c.get('links', []):
                if l.get('status') == 'UNRESOLVED':
                    issues.append({'category': 'unresolved-link', 'scope': f"para {c.get('para')}",
                                   'reason': f"[{l.get('marker')}] cannot be resolved against an available bundled passage",
                                   'status': 'CANDIDATE'})
                elif l.get('status') == 'STALE':
                    issues.append({'category': 'stale-link', 'scope': f"para {c.get('para')}",
                                   'reason': f"[{l.get('marker')}] differs from the current bundled projection",
                                   'status': 'CANDIDATE'})
        return {'format': 'scholar-pushback/1', 'issues': issues,
                'note': 'Candidate issues for author accept/reject/revise/defer. Not entailment, not peer review.'}
    if name=='wheel_harness': return wheel_harness(a)
    if name=='wheel_lookup': return wheel_lookup(a)
    if name=='wheel_verify': return wheel_verify(a)
    if name=='wheel_certificate': return wheel_certificate(a)
    if name=='wheel_level': return wheel_level(a)
    if name=='layers_index': return layers_index(a)
    if name=='passage_layers': return passage_layers(a)
    if name=='translation_forks': return translation_forks(a)
    if name in ('resolve_ref','ref_links'):
        if lingua_resolver is None: raise ValueError('Shared-language resolver unavailable')
        ident(a.get('id'))
        if name=='resolve_ref':
            try: return lingua_resolver.resolve(a.get('id'))
            except lingua_resolver.Unresolvable as e: raise ValueError(str(e))
        try: return {'id':a.get('id'),'links':lingua_resolver.links(a.get('id'))}
        except lingua_resolver.Unresolvable as e: raise ValueError(str(e))
    raise ValueError('Unknown tool')

S= lambda props, required=[]: {'type':'object','properties':props,'required':required,'additionalProperties':False}
T={'type':'string'}
TOOLS=[
 ('list_works','List available bundled Scholar projections.',S({})),
 ('passage_evidence','Read hash-checked Sanskrit and editorial layers for a passage.',S({'work':T,'target':T},['work','target'])),
 ('list_versions','List stored versions for an exact passage and layer.',S({'work':T,'target':T,'layer':T},['work','target','layer'])),
 ('compare_versions','Compare two hash-checked versions for an exact passage and layer.',S({'work':T,'target':T,'layer':T,'left':T,'right':T},['work','target','layer','left','right'])),
 ('vidyut_candidates','Generate unreviewed transliteration and optional metre candidates from a bundled passage.',S({'work':T,'target':T,'scheme':{'type':'string','enum':['iast','devanagari']},'meter':{'type':'boolean'}},['work','target'])),
 ('list_documents','List this account’s private documents for a work.',S({'work':T,'offset':{'type':'integer','minimum':0}},['work'])),
 ('document_history','Read this account’s private document revision history.',S({'document_id':T},['document_id'])),
 ('list_reviews','List reviews accessible to this account.',S({})),
 ('list_review_annotations','List private selected-text comments for an accessible review.',S({'review_id':T},['review_id'])),
 ('add_review_annotation','Comment on exact UTF-16 offsets in an immutable review snapshot.',S({'review_id':T,'start':{'type':'integer','minimum':0},'end':{'type':'integer','minimum':1},'quote':T,'body':T},['review_id','start','end','quote','body'])),
 ('list_style_examples','List this account’s explicitly saved private edit examples.',S({})),
 ('list_source_links','List your private typed source relationships.',S({})),
 ('save_source_link','Save a private relationship between two owned sources.',S({'from_source_id':T,'to_source_id':T,'relation':{'type':'string','enum':['comments_on','quotes','parallels','responds_to','possibly_related']},'note':T},['from_source_id','to_source_id','relation','note'])),
 ('delete_source_link','Remove an owned private source relationship.',S({'link_id':T},['link_id'])),
 ('list_published_essays','List published essay versions and their author-approved AI use scopes.',S({'work':T},['work'])),
 ('list_sources','List your private source notebook.',S({})),
 ('save_source','Save a hash-pinned private source reference.',S({'work':T,'target':T,'note':T},['work','target','note'])),
 ('prepare_citations','Prepare citation references from selected notebook sources and/or explicit passages.',S({'source_ids':{'type':'array','items':T,'maxItems':10},'passages':{'type':'array','items':S({'work':T,'target':T},['work','target']),'maxItems':10}})),
 ('delete_source','Remove an owned source reference.',S({'source_id':T},['source_id'])),
 ('list_decisions','List your private revision-bound editorial decisions.',S({})),
 ('save_decision','Save a private editorial decision against an owned revision.',S({'document_id':T,'revision':{'type':'integer'},'subject':T,'before':T,'after':T,'reason':T},['document_id','revision','subject','before','after','reason'])),
 ('delete_decision','Remove an owned private editorial decision.',S({'decision_id':T},['decision_id'])),
 ('save_document','Save a private draft with expected_revision; conflicts are rejected.',S({'document_id':T,'document':{'type':'object'}},['document_id','document'])),
 ('request_review','Request private review of an exact saved revision.',S({'document_id':T,'reviewer_id':T,'revision':{'type':'integer'}},['document_id','reviewer_id','revision'])),
 ('draft_with_qwen','Request an agent draft; the Scholar API requires explicit consent and configured quotas.',S({'work':T,'target':T,'layer':T,'kind':T,'instruction':T,'consent_to_ai':{'type':'boolean'},'use_style':{'type':'boolean'},'style_example_ids':{'type':'array','items':T},'decision_ids':{'type':'array','items':T},'source_ids':{'type':'array','items':T},'scholar_essays':{'type':'array','items':S({'work':T,'essay_id':T},['work','essay_id']),'maxItems':3},'review_ids':{'type':'array','items':T},'document_id':T,'revision':{'type':'integer'}},['work','target','layer','kind','instruction','consent_to_ai'])),
 ('search_texts','Semantic search over the gate-labeled corpus (passages, probes, essays, themes). BLOCKED English is never returned.',S({'query':T,'work':T,'kind':T,'top_k':{'type':'integer'},'gates':{'type':'array','items':T}},['query'])),
 ('text_themes','Themes evidence for a work or ref: labels, core claims, certificates, members.',S({'work':T,'ref':T,'query':T})),
  ('audit_draft','Check markers and quotes against same-paragraph sources. Supplied sources are not authenticated and claim support is not assessed. Returns a content-hash receipt.',S({'text':T,'refs':{'type':'array','items':{'type':'object'}},'sources':{'type':'object'},'identity':T,'model':T},['text'])),
  ('link_claims','Build a revision-bound claim table. CURRENT means the recorded hash matches a locally verified bundled projection, not textual authority or the latest online version.',S({'text':T,'refs':{'type':'array','items':{'type':'object'}},'essay_rev':T,'source_revs':{'type':'object'}},['text'])),
  ('check_claim_staleness','Recheck a claim table against the essay and local bundled projections; caller-provided revisions do not establish freshness.',S({'record':{'type':'object'},'text':T,'source_revs':{'type':'object'}},['record','text'])),
  ('pushback','Revision-bound candidate issues (failed quotes, uncited paragraphs, unresolved links) for author accept/reject/revise/defer. Agent report, not peer review.',S({'text':T,'refs':{'type':'array','items':{'type':'object'}},'sources':{'type':'object'}},['text'])),
 ('wheel_harness','Learning-harness map: stages, gates, tutor files, verify summary, trika links (fetch harness.json for the full one-fetch program).',S({})),
 ('wheel_lookup','Look up one Sanskrit form in the vendored grammar pack: gloss layer, derivation trace, lessons, verses.',S({'form':T},['form'])),
 ('wheel_verify','Prove one form fast: AGREE / DISAGREE_STANDS / MACHINE_GAP / CURATED_ONLY with evidence.',S({'form':T},['form'])),
  ('wheel_level','Get one tutor level prompt (goal, rules, drills, gate) by number 1-6.',S({'level':{'type':'integer','minimum':1,'maximum':6}},['level'])),
  ('layers_index','Map of the canonical translation-work layer corpus: per work, per song, which of t1/l0/argmap/l2/l3/l4/c1/c2 exist, with file hashes, verse-id unions, registry status and review state.',S({'work':T})),
  ('passage_layers','One passage full layer stack from the canonical translation-work files (not the site projection): source, per-layer data and hashes, registry status. Unavailable passages error explicitly, never empty success.',S({'work':T,'target':T,'layer':{'type':'string','enum':['t1','l0','argmap','l2','l3','l4','c1','c2']}},['work','target'])),
  ('translation_forks','Where this passage translation forks: L0 token options/fork state and ARGMAP option choices/uncertainties. A fork is a question, not a verdict.',S({'work':T,'target':T},['work','target'])),
 ('wheel_certificate','Derivation certificate for one form: stored cert + live tier-2 recompute (never trusts stored bytes).',S({'form':T},['form'])),
 ('resolve_ref','Resolve any shared-language ID (work/chunk/tension/crux/essay/pack/aoc) to bytes, status and license. Fails closed.',S({'id':T},['id'])),
 ('ref_links','Every ID connected to the given one — tension is the hub, links are verified both directions.',S({'id':T},['id']))]

def handle(req):
    method=req.get('method'); params=req.get('params') or {}
    if method=='initialize': return {'protocolVersion':'2025-06-18','capabilities':{'tools':{}},'serverInfo':{'name':'svread-scholar','version':'0.1.0'}}
    if method=='ping': return {}
    if method=='tools/list': return {'tools':[{'name':n,'description':d,'inputSchema':s} for n,d,s in TOOLS]}
    if method=='tools/call':
        try: result=call(params.get('name'),params.get('arguments',{})); return {'content':[{'type':'text','text':json.dumps(result,ensure_ascii=False)}]}
        except (ValueError,TypeError,KeyError,json.JSONDecodeError) as e: return {'isError':True,'content':[{'type':'text','text':str(e)}]}
    raise NotImplementedError()

def main():
    for line in sys.stdin:
        try:
            if len(line)>262144: raise ValueError('Request too large')
            req=json.loads(line)
            if not isinstance(req,dict) or req.get('jsonrpc')!='2.0': raise ValueError('Invalid request')
            if 'id' not in req: continue
            try: out={'jsonrpc':'2.0','id':req['id'],'result':handle(req)}
            except NotImplementedError: out={'jsonrpc':'2.0','id':req['id'],'error':{'code':-32601,'message':'Method not found'}}
        except (ValueError,TypeError,json.JSONDecodeError): out={'jsonrpc':'2.0','id':None,'error':{'code':-32600,'message':'Invalid request'}}
        print(json.dumps(out,ensure_ascii=False),flush=True)
if __name__=='__main__': main()
