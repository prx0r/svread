# Errors hit while wiring the MITRA-MT benchmark (2026-11-11)

Every entry is a real failure observed in this session, the exact symptom, the
diagnosis, and the fix that is now in the repository. Order is chronological.
Nothing here is hypothetical.

---

## E1 — Kaggle dataset create: "title must be between 6 and 50 characters"

Symptom
```
kaggle datasets create -p .
The dataset title must be between 6 and 50 characters
```

The title in `dataset-metadata.json` was
`Svatantrya blind Sanskrit eval (50 passages, inputs only)` — 55 characters.

Fix: `Svatantrya blind Sanskrit eval (50)`. The title is now fixed; do not
lengthen it without re-pushing.

Lesson: Kaggle validates `title` for length, not for meaning. The **slug** is
derived from the title, which is why the mount path later surprised us (E3).

---

## E2 — kernel push: "title does not resolve to the specified id"

Symptom
```
Your kernel title does not resolve to the specified id.
Kernel version 1 successfully pushed.
... kaggle.com/code/priortrades/svatantrya-eval-mitra-mt-on-blind-50
```

`kernel-metadata.json` declared `id: priortrades/svatantrya-eval-mitra` but the
title `Svatantrya eval: MITRA-MT on blind 50` slugifies to
`svatantrya-eval-mitra-mt-on-blind-50`. Kaggle created the kernel under the
**title slug**, so the declared id pointed at nothing:

```
Cannot access kernel 'priortrades/svatantrya-eval-mitra' (Permission denied)
```

Fix: set `id` to `priortrades/svatantrya-eval-mitra-mt-on-blind-50`, matching
the title slug. Renaming now creates a second kernel, so keep both fields in
sync.

Lesson: the id is not authoritative; the slug is.

---

## E3 — `FileNotFoundError: /kaggle/input/svatantrya-blind-50/blind-inputs.json`

Symptom: the kernel starts, then dies on `json.load(open(IN))`. The dataset was
created and reported `ready`.

Fix: don't guess the mount path. The probe printed the actual layout:

```
/kaggle/input/datasets/priortrades/svatantrya-blind-50/blind-inputs.json
```

Kaggle now nests dataset mounts under `input/datasets/<owner>/<slug>/` in at
least some runtime images. Resolve by glob, recursively:

```python
_hits = glob.glob("/kaggle/input/**/blind-inputs.json", recursive=True)
IN = _hits[0] if _hits else ""
if not IN or not os.path.exists(IN):
    raise SystemExit(3)          # fail before loading a 9B model
```

Lesson: never hardcode a Kaggle mount path. Probe, then abort early.

---

## E4 — Qwen3.5 fell back to reference kernels (578 s for 4 passages)

Symptom in the log:

```
`causal_conv1d_fn` is falling back to its reference PyTorch implementation
because `causal_conv1d` is not installed. This is correct but much slower.
`chunk_gated_delta_rule` is falling back ... `flash-linear-attention` not installed
[4/50] 578s
```

Qwen3.5 uses a hybrid linear-attention stack. Without `causal-conv1d` and
`flash-linear-attention` it runs, but at roughly 145 s per long passage —
5–6 hours for the set.

Attempted fix and why it was abandoned: installing the two packages with
`pip install -q causal-conv1d flash-linear-attention` broke bitsandbytes (E6)
and cost ~31 minutes of build time before failing. Abandoned.

Real fix: **remove the need for fast kernels** by chunking. Attention cost is
quadratic; 8192-token sequences were what made it slow. Splitting at danda
boundaries into ≤1500-character chunks (~500 tokens) makes the reference
implementation acceptable, and batch 1 removes the OOM too.

If it ever matters again, the correct install is a pinned wheel matching the
image's torch/CUDA, not a source build.

---

## E5 — `torch.OutOfMemoryError: Tried to allocate 16.00 GiB` (T4, 14.56 GiB)

Symptom

```
torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 16.00 GiB.
GPU 0 has a total capacity of 14.56 GiB of which 5.53 GiB is free.
[4/50] printed, then the run dies on batch 2
```

Batch of 4 × 8192 tokens, 32 layers of attention. The 9B model at 4-bit is
~6 GB; the attention activations were the rest.

Fix (both, not either):

- `BATCH = 1`
- truncate the *input* to 4096 tokens and chunk the source first, so no single
  forward pass needs an 8192-token attention matrix
- `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`
- `torch.cuda.empty_cache()` after each chunk and `del enc, gen`

A per-passage `try/except torch.cuda.OutOfMemoryError` now records the failure
and continues instead of killing 49 other passages.

---

## E6 — `ImportError: Using bitsandbytes 4-bit quantization requires bitsandbytes>=0.46.1`

Symptom, after the E4 pip experiment:

```
ImportError: Using `bitsandbytes` 4-bit quantization requires bitsandbytes:
`pip install -U bitsandbytes>=0.46.1`
```

Installing `causal-conv1d` / `flash-linear-attention` from source pulled a
dependency set that downgraded or shadowed bitsandbytes in the image.

Fix: do not install unrelated packages into the same interpreter. Check first,
install only if absent:

```python
def _have(mod, minver=None): ...
if not _have("bitsandbytes", (0, 46)):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-U",
                    "bitsandbytes>=0.46.1"], check=False)
```

Lesson: on Kaggle, each `pip install` can silently change a working stack.
Verify the quant backend immediately before the model load.

---

## E7 — kernel slug drift in documentation

Symptom: `BENCHMARK-PLAN.md` and the PR body referenced
`priortrades/svatantrya-eval-mitra`, which does not exist (E2). A reader would
follow a dead link.

Fix: every reference now uses the real slug
`priortrades/svatantrya-eval-mitra-mt-on-blind-50`.

Lesson: after a push warning about title/id resolution, grep the repo for the
old slug before declaring the change done.

---

## E8 — coverage report was silently wrong (24/50, actually 40/50)

Symptom: `eval_export_ours.py` exported only 24 passages. No error was raised,
which is the dangerous part.

Diagnosis: the exporter looked only for
`translation-work/<work>/data/<blind-target>.l2.json`. Several works store
their translation under a different slug:

| blind target | actual file |
|---|---|
| `para-p01` | `paratrimshika/data/ptv-p01.l2.json` |
| `sivs-p01` | `sivasutra/data/span-p01.l2.json` |
| `tal-aNN-p01` | `tantraloka-aNN/data/tal-aNN.l2.json` |

Fix: fall back to citation alignment — a file is only accepted if its own
`sanskrit_cite` strings (normalised, ≥10 chars) appear inside the blind
passage — and join only the matched rows. First attempt at this joined all 159
rows of a file that matched one cite, producing 19k characters for a 923-char
passage; filtering to matched rows fixed it.

Result: 40/50 (27 full, 4 partial below 0.6 coverage, 9 unmeasurable because
the layer has no cites, 10 genuinely untranslated).

Lesson: "no error" is not "correct". The exporter now records a per-passage
coverage ratio and a `partial` flag, and the test asserts
`full + partial + unmeasured == with_text`.

---

## E9 — worksheet leak check false positive

Symptom: the first identity-leak guard scanned the whole worksheet markdown, so
the English word "ours" inside a *translated passage* would have tripped it.

Fix: only structural lines (everything not part of a quoted passage, i.e. not
starting with `> `) are scanned for `mitra` / `ours` / `qwen`.

Lesson: guard the artefact's metadata, not the content it is meant to carry.

---

## Still open at the time of writing

| # | State | What we do about it |
|---|---|---|
| A | Kernel v5 status RUNNING; no output yet | wait for completion, then `eval_fetch_candidate.py` verifies sha256 |
| B | If v5 is slow, expect hours on reference kernels | chunking was sized for this; a pinned `causal-conv1d` wheel is the next lever |
| C | 10 blind passages have no translation of ours (Tantrāloka a01–a16) | stay missing; they are a coverage fact, not a defect |
| D | 4 passages flagged partial (ptvmadhyama, saktavijnana, spanda, svabodhasiddhi) | scored but reported separately, never as a win |
