import json, os, sys, time, hashlib, subprocess

import glob
_hits = glob.glob("/kaggle/input/*/blind-inputs.json")
IN = _hits[0] if _hits else "/kaggle/input/svatantrya-blind-50/blind-inputs.json"
print("inputs:", IN, flush=True)
OUT = "/kaggle/working/results-mitra-mt.json"
MANIFEST = "/kaggle/working/results-mitra-mt.manifest.json"

MODEL = "buddhist-nlp/mitra-qwen35-translate"
REVISION = "66869d9b73f5180fa124b4975c52f5033517e101"
PROMPT = "Translate the following Sanskrit text into English:\n\n{text}"
MAX_NEW = 2048

subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-U",
                "transformers", "accelerate", "bitsandbytes"], check=False)

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

doc = json.load(open(IN))
items = doc["items"]
print(f"{len(items)} passages", flush=True)

tok = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, trust_remote_code=True)
if tok.pad_token is None:
    tok.pad_token = tok.eos_token
tok.padding_side = "left"

quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                           bnb_4bit_compute_dtype=torch.bfloat16,
                           bnb_4bit_use_double_quant=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL, revision=REVISION, trust_remote_code=True,
    quantization_config=quant, device_map="auto")
model.eval()

results, errors = {}, {}
t0 = time.time()
BATCH = 4
for i in range(0, len(items), BATCH):
    batch = items[i:i + BATCH]
    prompts = []
    for it in batch:
        msg = [{"role": "user", "content": PROMPT.format(text=it["text"])}]
        prompts.append(tok.apply_chat_template(msg, tokenize=False, add_generation_prompt=True))
    enc = tok(prompts, return_tensors="pt", padding=True, truncation=True, max_length=8192).to(model.device)
    with torch.no_grad():
        gen = model.generate(**enc, max_new_tokens=MAX_NEW, do_sample=False,
                             temperature=None, top_p=None, top_k=None,
                             num_beams=1, repetition_penalty=1.0)
    new = gen[:, enc["input_ids"].shape[1]:]
    for it, seq in zip(batch, new):
        text = tok.decode(seq, skip_special_tokens=True).strip()
        if text:
            results[it["id"]] = text
        else:
            errors[it["id"]] = "empty generation"
    print(f"[{min(i+BATCH,len(items))}/{len(items)}] {(time.time()-t0):.0f}s", flush=True)

json.dump(results, open(OUT, "w"), ensure_ascii=False, indent=1)
json.dump({
    "format": "svatantrya.eval-candidate/1",
    "candidate": "mitra-mt",
    "candidate_name": "MITRA-MT (Qwen3.5-9B fine-tune, WMT 2026)",
    "model": MODEL,
    "revision": REVISION,
    "prompt": PROMPT,
    "decoding": {"do_sample": False, "num_beams": 1, "max_new_tokens": MAX_NEW},
    "quantization": "bitsandbytes nf4 4-bit",
    "inputs_sha256": hashlib.sha256(open(IN, "rb").read()).hexdigest(),
    "outputs_sha256": hashlib.sha256(open(OUT, "rb").read()).hexdigest(),
    "translated": len(results),
    "errors": errors,
    "elapsed_sec": round(time.time() - t0, 1),
    "torch": torch.__version__,
}, open(MANIFEST, "w"), indent=1)
print(f"done {len(results)}/{len(items)} in {time.time()-t0:.0f}s", flush=True)
