import boto3, subprocess, os, json
def load(p):
    d={}
    for l in open(p):
        l=l.strip()
        if l and '=' in l and not l.startswith('#'):
            k,v=l.split('=',1); d[k.strip()]=v.strip()
    return d
e=load('/root/.r2-env')
s3=boto3.client('s3',endpoint_url=e['R2_ENDPOINT'],aws_access_key_id=e['R2_ACCESS_KEY'],aws_secret_access_key=e['R2_SECRET_KEY'],region_name='auto')
B='svread-audio'
JOBS={'bhairavastava':'bhairavastava','anuttarashtika':'anuttarashtika_trad','stavacintamani':'stavacintamani','dehastha':'dehastha','bodhapanadasika':'bodhapanadasika','mahopadeshavimshatika':'mahopadeshavimshatika','rahasyapanchadashika':'rahasyapanchadashika','paramadvayadvadashika':'paramadvayadvadashika','pancashloki':'pancashloki','kramastotra':'kramastotra'}
man={}
for wid,dd in JOBS.items():
    src=f'/root/kashaudio/{dd}'
    wavs=sorted(f for f in os.listdir(src) if f.endswith('.wav'))
    os.makedirs('/tmp/mp3/'+wid, exist_ok=True)
    n=0
    for wv in wavs:
        base=os.path.splitext(wv)[0]
        out=f'/tmp/mp3/{wid}/{base}.mp3'
        if not os.path.exists(out) or os.path.getsize(out)==0:
            subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'{src}/{wv}','-codec:a','libmp3lame','-b:a','96k',out],check=True)
        s3.upload_file(out,B,f'audio/{wid}/{base}.mp3',ExtraArgs={'ContentType':'audio/mpeg','CacheControl':'public, max-age=31536000, immutable'})
        n+=1
    tj=json.load(open(f'{src}/word_timings.json'))
    assert isinstance(tj,list) and tj and 'words' in tj[0], dd
    s3.put_object(Bucket=B,Key=f'karaoke/{wid}.json',Body=json.dumps(tj,ensure_ascii=False).encode(),ContentType='application/json',CacheControl='public, max-age=86400')
    man[wid]={'clips':n,'timings':len(tj)}
    print(wid,n,'clips + timings OK',flush=True)
s3.put_object(Bucket=B,Key='works.json',Body=json.dumps(man,ensure_ascii=False,indent=1).encode(),ContentType='application/json',CacheControl='public, max-age=86400')
print('MANIFEST',json.dumps(man))
