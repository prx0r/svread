import json, os, sys, time, hashlib, subprocess, glob, re

_hits = glob.glob("/kaggle/input/**/blind-inputs.json", recursive=True)
IN = _hits[0] if _hits else ""
OUT = "/kaggle/working/results-mitra-mt.json"
MANIFEST = "/kaggle/working/results-mitra-mt.manifest.json"

MODEL = "buddhist-nlp/mitra-qwen35-translate"
REVISION = "66869d9b73f5180fa124b4975c52f5033517e101"
PROMPT = "Translate the following Sanskrit text into English:\n\n{text}"
MAX_NEW = 700
CHUNK_CHARS = 1500

os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

print("inputs:", IN, flush=True)
if not IN or not os.path.exists(IN):
    print("MISSING INPUTS — aborting before model load", flush=True)
    raise SystemExit(3)

for pkg in ("causal-conv1d", "flash-linear-attention"):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", pkg], check=False)

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

doc = json.load(open(IN))
items = doc["items"]
print(f"{len(items)} passages", flush=True)


def split_text(text, limit=CHUNK_CHARS):
    """Split on danda / sentence / word boundaries so nothing is cut mid-word."""
    text = text.strip()
    if len(text) <= limit:
        return [text]
    parts, cur = [], ""
    for seg in re.split(r"(?<=[|।])\s+", text):
        if len(cur) + len(seg) + 1 <= limit:
            cur = (cur + " " + seg).strip()
            continue
        if cur:
            parts.append(cur)
        while len(seg) > limit:
            cut = seg.rfind(" ", 0, limit)
            cut = cut if cut > limit // 2 else limit
            parts.append(seg[:cut])
            seg = seg[cut:].strip()
        cur = seg
    if cur:
        parts.append(cur)
    return parts


tok = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, trust_remote_code=True)
if tok.pad_token is None:
    tok.pad_token = tok.eos_token

quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                           bnb_4bit_compute_dtype=torch.bfloat16,
                           bnb_4bit_use_double_quant=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL, revision=REVISION, trust_remote_code=True,
    quantization_config=quant, device_map={"": 0})
model.eval()

results, errors = {}, {}
if os.path.exists(OUT):
    try:
        results = json.load(open(OUT))
    except ValueError:
        results = {}

t0 = time.time()
for n, it in enumerate(items, 1):
    if it["id"] in results:
        continue
    chunks = split_text(it["text"])
    outs = []
    try:
        for ci, chunk in enumerate(chunks):
            msg = [{"role": "user", "content": PROMPT.format(text=chunk)}]
            prompt = tok.apply_chat_template(msg, tokenize=False, add_generation_prompt=True)
            enc = tok(prompt, return_tensors="pt", truncation=True, max_length=4096).to(model.device)
            with torch.no_grad():
                gen = model.generate(**enc, max_new_tokens=MAX_NEW, do_sample=False,
                                     num_beams=1, repetition_penalty=1.0,
                                     pad_token_id=tok.pad_token_id)
            outs.append(tok.decode(gen[0, enc["input_ids"].shape[1]:],
                                   skip_special_tokens=True).strip())
            del enc, gen
            torch.cuda.empty_cache()
        text = " ".join(o for o in outs if o)
        if text:
            results[it["id"]] = text
        else:
            errors[it["id"]] = "empty generation"
    except torch.cuda.OutOfMemoryError as e:
        errors[it["id"]] = f"cuda oom: {e}"[:200]
        torch.cuda.empty_cache()
    except Exception as e:  # keep going; one bad passage must not kill the run
        errors[it["id"]] = f"{type(e).__name__}: {e}"[:200]
    json.dump(results, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"[{n}/{len(items)}] {it['id']} chunks={len(chunks)} "
          f"chars={len(results.get(it['id'], ''))} t={time.time()-t0:.0f}s", flush=True)

json.dump({
    "format": "svatantrya.eval-candidate/1",
    "candidate": "mitra-mt",
    "candidate_name": "MITRA-MT (Qwen3.5-9B fine-tune, WMT 2026)",
    "model": MODEL,
    "revision": REVISION,
    "prompt": PROMPT,
    "decoding": {"do_sample": False, "num_beams": 1, "max_new_tokens": MAX_NEW},
    "chunking": {"chars": CHUNK_CHARS, "split": "danda/sentence/word"},
    "quantization": "bitsandbytes nf4 4-bit, batch 1",
    "inputs_sha256": hashlib.sha256(open(IN, "rb").read()).hexdigest(),
    "outputs_sha256": hashlib.sha256(open(OUT, "rb").read()).hexdigest(),
    "translated": len(results),
    "errors": errors,
    "elapsed_sec": round(time.time() - t0, 1),
    "torch": torch.__version__,
}, open(MANIFEST, "w"), indent=1)
print(f"done {len(results)}/{len(items)} in {time.time()-t0:.0f}s", flush=True)
