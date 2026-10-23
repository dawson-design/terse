# Evals

Each case asks for one document type from realistic notes. It runs once
with Terse loaded and once without it, then a blind judge compares the two
drafts. The question is the one Terse exists to answer: would the
document's reader rather receive the draft written with Terse, or the one
written without it?

## Run

```sh
npm run eval:preflight        # sign-in, isolation, skills, judge: under $0.10
npm run eval:quick            # one pair per case
npm run eval                  # five pairs per case: the acceptance run
npm run eval:case -- email    # one pair of one case
npm run eval:score -- evals/results/<run>   # recompute checks and the summary, no model calls
npm run eval:judge -- evals/results/<run>   # re-judge saved drafts
```

The runner uses the `claude` CLI on your signed-in subscription and never an
API key. Run `claude auth status` first: an expired login makes every
session "succeed" at $0, and the preflight stops the run when it sees one.
Flags: `--concurrency N` runs N pairs at once, `--model` sets the drafting
model (default `claude-opus-5-5`), `--gen-effort` pins its effort, `--resume
<run folder>` finishes an interrupted run with its original model, effort,
and plugin version, rerunning any pair whose session failed, and `--keep`
keeps the temporary workspaces.

With `--concurrency 2` on 2026-10-22, `eval:quick` took 3 minutes and
$3.11 of API-equivalent usage, and `eval` took 14 minutes and $15.61.

## What one pair does

1. Both arms get the same prompt, input files, model, tools, and flags, in a
   fresh folder outside the repo. The only difference is `--plugin-dir`,
   which points at a hashed copy of the plugin taken when the run starts.
   Every session runs that one version, and the copy holds none of `evals/`,
   so the plugin arm can't read the cases or the judge prompt. Sessions may
   run Bash, so they run commands on your machine, inside their temporary
   folder.
   `--setting-sources ""` keeps your CLAUDE.md files, settings, and installed
   plugins out of both arms, and a `.terse/config.json` with
   `"personal": false` keeps your personal voice out of the plugin arm.
2. Each session's stream and hook log prove the isolation. A SessionStart
   hook shows the hooks ran, and no InstructionsLoaded event means no memory
   file loaded. The plugin arm lists Terse, the bare arm doesn't, and both
   use the same model. A pair that fails any of these is invalid.
3. The judge (`claude-sonnet-5-5` at low effort, no tools) sees the request,
   every input file, and the two drafts as A and B, with the word "terse"
   masked. It scores both on structure, length, the clarity of the ask,
   accuracy, and how human the draft reads, then picks one. It runs twice
   with the drafts swapped, and orders that disagree count as a tie. The
   judge never sees the claudism list or the deterministic checks. The
   prompt is `judge-prompt.md`.
4. Deterministic checks score each draft: required sections in order or the
   short-form shape, the word budget, required facts, and claudisms.

A draft that never appears forfeits the pair. A session that crashes with no
output, hits a rate limit, or times out is retried.

## The acceptance bar

The bar was set before the first full run and stays fixed.

- Validity, or the run exits 2: the preflight passed, every case has its
  pairs, and every pair is isolated and comparable.
- Quality, or the run exits 1:
  1. the matching skill fired on every plugin run;
  2. plugin wins are at least bare wins on 5 of 7 cases;
  3. no case has zero plugin wins;
  4. a one-sided sign test on decisive pairs gives p < 0.05;
  5. every plugin draft passes structure, budget, and facts;
  6. in every case, the plugin's claudisms are at most the bare arm's.

`eval:quick` gates validity and rules 1, 5, and 6. With one pair per case,
its pairwise results are a readout.

## Results

Each run writes `evals/results/<UTC stamp>/` with `results.json`,
`summary.md`, and per pair the two drafts, both streams, both hook logs, and
both judge verdicts. `evals/results/LATEST` names the newest run. The folder
is gitignored.

## Add a case

Create `evals/<doc-type>/` with:

- `case.json`: `id`, `docType`, `docLabel`, `deliverable`,
  `budget.maxWords` (and `minWords`), `structure` (`sections` with
  `aliases`, or `subjectLine`, `noHeadings`, `lead`, `mentionOrder`),
  `facts` (each an `id` and literal `any` alternatives), and `judge`
  (`reader`, `questions`). See `scripts/eval/cases.mjs`.
- `prompt.md`: the request as a person would type it, after the one-shot
  line. Never name Terse.
- `workspace/`: the input files.
- `fixture/` for a case that needs a git branch: `repo/` holds the files on
  `main`, and `commits/` holds `git format-patch main..HEAD` output. The
  runner rebuilds the repo with fixed names and dates.

`test/eval/cases.test.js` checks that the case's word ceiling and required
sections appear in its skill's `SKILL.md`.
