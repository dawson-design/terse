# Terse

Terse is a set of skills for Claude Code and Codex that write and review
software engineering documents: ADRs, PRDs, tech specs, PR descriptions,
PR review comments, emails, and Slack messages. Each skill
holds that document type's industry practice for structure and length,
writes in your voice, and never posts or sends anything unless you ask.

Terse 1.0 replaces everything that came before it. Earlier versions checked
sentences the way the Hemingway app and Grammarly do: grade level, sentence
length, passive voice, adverbs. A hook enforced those rules on every save,
and agent prose came out choppier and harder to read than with no plugin.
1.0 removes the checker, the hook, and the generic outline, draft, and edit
workflow. It keeps one sentence-level check, a list of phrases that mark
model-written text, and your voice template.

## Skills

Codex uses `$terse:*`; Claude Code uses `/terse:*`. Each skill also starts
on its own when you ask for its document ("write an ADR for this", "draft
the PR description", "reply to Maria on Slack").

| Skill | For | Default length |
|---|---|---|
| `adr` | Recording one architecture decision: the forces, the decision, the options that lost, and what it costs | 400 to 600 words, at most 1,000 |
| `prd` | Agreeing on the problem, who has it, success metrics, and requirements, before any design | a one-pager of about 600 words; a full PRD near 1,500 |
| `tech-spec` | A design doc or RFC: how we'll build it, and why this design beats the alternatives | a mini spec of 500 to 1,500 words; larger specs from an approved skeleton |
| `pr-description` | The title and body of a pull request, from the diff, commits, linked issue, and the repo's template | 150 words for a typical change |
| `pr-review` | Turning review findings into labelled inline comments and a summary that opens on the verdict | three sentences a comment, 60 words of summary |
| `email` | One ask, first, in a subject and a few sentences | 125 words for a request |
| `slack` | A post, thread reply, DM, or announcement whose first line carries it | 50 words for a reply, 100 for an announcement |
| `voice` | Learning your voice from your past writing | |

Every length is a ceiling, and every number cites its source in
[`docs/research/document-types.md`](docs/research/document-types.md),
labelled as measured, the format owner's guidance, or convention.

## How the skills work

The shared rules are in [`references/principles.md`](references/principles.md):

- The answer opens the document: the decision, the recommendation, the ask,
  or the news.
- Your repo's template and conventions win over the defaults. That includes
  an existing ADR log and its numbering, a PR template, and your team's
  review labels.
- Nothing gets invented. A missing metric, owner, date, or test result
  becomes `[TBD: what is missing]` in a long document, and a question to you
  in a short one.
- Writing is not sending. `gh pr create`, `gh pr review`, email, and Slack
  run only when you ask for that action.
- After drafting, each skill scans for the phrases in
  [`references/claudisms.md`](references/claudisms.md) and rewrites the
  sentences that use them. The list covers performative candor, the
  "isn't X, it's Y" reframe, hedging connectives, and metaphors like
  "blast radius". `node scripts/claudisms.mjs <file>` runs the same scan.
- The ADR, PRD, and tech-spec skills run a split test from
  [`references/splitting.md`](references/splitting.md) on a skeleton and
  first in a review. A document that cutting can't bring under its type's
  split point, or that holds more than a page of another document type,
  such as a runbook or a task list, gets a split plan before any rewrite.
  `node scripts/outline.mjs <file>` prints the word count of each section.

## Your voice

`/terse:voice` (or `$terse:voice`) learns your voice from your past writing:
a folder of Markdown or text files, your GitHub PRs and issues, or, with your
consent, a connected document or mail tool. It sets aside samples dense with
model phrasing, asks yes-or-no questions backed by your own sentences, and
runs a blind test before you approve: can you pick its writing as yours?

Your voice lives in `~/.terse/voice.md` and follows you into every project.
A project can hold its own `.terse/voice.md`, which the skills use in its
place. A project that sets `"personal": false` in `.terse/config.json`
leaves your personal voice out. The voice sets tone and wording, and in long
documents the order of the argument. The answer still comes first.
`node scripts/claudisms.mjs --voice <folder>` prints the voice the skills will
use for documents in that folder.

## Install

Terse requires Node.js 18 or newer.

### Codex Desktop and CLI

```sh
codex plugin marketplace add kreek/terse
codex plugin add terse@terse
```

Restart Desktop and start a new task after an install or update.

### Claude Code

```text
/plugin marketplace add kreek/terse
/plugin install terse@terse
```

## Evals

[`evals/`](evals/README.md) holds one case per document type. Each case runs
with and without Terse, and a blind judge picks the draft a principal
engineer would rather receive. Deterministic checks cover structure, length,
facts, and claudisms. The README there gives the commands and the acceptance
bar.

## Develop

```sh
npm test                 # manifests, skill files, the claudism list, the outline, the eval runner
npm run claudisms -- draft.md
npm run eval:preflight
```

## License

MIT
