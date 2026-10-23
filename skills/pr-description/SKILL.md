---
name: pr-description
description: "Write, update, or review a pull request title and description. Use when the user asks to write or draft the PR description, PR body, or PR title, to open, create, or raise a PR or merge request, to update a description after review changes, or to check or tighten an existing PR description. Reads the diff, commits, linked issue, and the repo's PR template. Not for commit messages or for comments on someone else's PR."
---

# PR description

A PR description has two readers: the reviewer deciding what to check now,
and the engineer reading `git blame` later. Both need the why. Neither needs
a list of files, because the diff is one. People write a median of 56
words; Claude Code writes 355. Write like the people.

`<terse-root>` is the directory two levels above this file. Before drafting,
read `<terse-root>/references/principles.md` and the approved voice it
names. This skill sets structure and length; the voice sets tone and wording.

## Inputs

Gather these yourself; never ask for what the repo can tell you.
1. The base: the open PR's base (`gh pr view --json baseRefName,body`), else
   the default branch (`gh repo view --json defaultBranchRef`).
2. The change: `git log --oneline <base>..HEAD`, `git diff --stat
   <base>...HEAD`, then the diff. Describe the final diff, not the history.
3. Linked work: an issue key in the branch name, the commit messages, or the
   request. Read the issue (`gh issue view`) for the why.
4. The template: `.github/pull_request_template.md`,
   `pull_request_template.md`, `docs/pull_request_template.md`,
   `.github/PULL_REQUEST_TEMPLATE/*.md`, or
   `.gitlab/merge_request_templates/*.md`, in any case. With several, ask
   which one.
5. The title convention: `gh pr list --state merged --limit 15 --json title`.
   Match ticket prefixes or `feat:` and `fix:` if the repo uses them.
6. Evidence: the commands run in this session and their output, and
   `gh pr checks`.

Ask the user, and never invent:
- the why, when neither the issue nor the commits state it;
- what was tested, when nothing ran in this session and CI has no result;
- rollout facts: flag names, deploy order, migration timing, who to tell;
- issue numbers, metrics, benchmarks, screenshots.

If the diff holds something that looks accidental, such as debug output,
unrelated files, or a secret, tell the user before describing it.

## Structure

With a repo template, the template wins. Fill its sections in order, keep
its headings and checkboxes, tick a box only when it is true, and write
"N/A" under a section that doesn't apply. The budget covers only the prose
you add.

Without one:

```markdown
<Title: imperative and specific, about 50 to 72 characters, no period>

<Why: the problem or goal and who it affects, in one to three sentences.>
<Closes #123, or Refs #123; see below.>

<What changed: the approach and any decision a reviewer would question,
described as behavior. Prose, or a list only for three or more parallel
changes.>

Tested: <what ran and what it showed; manual steps; a screenshot for UI>

<Risk and rollout, only if any: migration, flag, compatibility, rollback.>
<Review focus, only if it helps: the part to check hardest, the feedback
wanted, a reading order for a large PR.>
```

- The title completes "If merged, this PR will…": "Retry S3 uploads on
  503", not "Fix bug" or "Update upload service".
- The body opens on the why; the title already said what.
- Name a file only to direct attention: a migration, a public API, an auth
  check.
- A breaking change is the body's first line: "Breaking: …".
- `Closes #N` closes the issue on merge. Use it only when the PR fully
  resolves the issue and targets the default branch, and otherwise write
  `Refs #N`. When the commits already say which, follow them.
- Under about 100 words, use no headings and a plain "Tested:" lead-in.
  Over that, use `##` headings for Why, Changes, Testing, and Rollout.

## Length

Count prose words only: not code, commands, logs, checklists, template
text, or URLs.

| Change | Budget |
|---|---|
| Trivial: a typo, dependency bump, config change, or revert | a title and up to 30 words |
| A typical fix or feature | 150 words at most |
| A migration, or a risky, cross-team, or large change, including one that changes how the code calls another team's service or only partly fixes its issue | 300 words at most, plus rollout and rollback steps; link the design doc |

The human median is 56 words and the agent median 355 (measured, Watanabe
et al. 2025). Longer descriptions go with longer review times, but length
marks complexity, so that alone doesn't show brevity speeds review
(measured correlation, Zhang et al. 2022). Google sets no number. The
budgets are conventions. A PR that needs more than 300 words usually needs
splitting: Google's guide calls about 100 changed lines reasonable and
1,000 usually too large. Say so instead of writing more.

## Draft

1. Gather the inputs. Compare what the diff does with what the issue asks
   for and what the commits and issue say was confirmed. Each gap (a part of
   the issue left unfixed, a behavior nobody confirmed is safe) is a risk
   line for the reviewer. Then write the why in one sentence, and the title.
2. Fill the template, or the structure above, at one line per section.
3. Add a sentence only where a reviewer would otherwise ask in a comment.
4. Check the length, then run the claudism scan from the principles.
5. Present it as the Output section says.

## Review an existing description

Report the findings, then offer a rewrite:
- the title is vague, in the past tense, or a branch name;
- there is no why, or the why restates the what;
- a file-by-file changelog, or bullets that mirror the diff;
- test claims with no evidence, or boxes ticked without proof;
- headings on a body under 100 words, or template sections deleted;
- over budget for the change size, or it would read better as two PRs;
- out of date with the diff after review changes;
- a migration, auth change, public API change, or data deletion with no
  risk or rollout line.
Then run the claudism scan.

## Failure modes

| Agent habit | Countermeasure |
|---|---|
| Lists every changed file | behavior and decisions; a file only to direct attention |
| Summary, Changes, and Testing headings on a two-line change | no headings under about 100 words |
| Claims tests that never ran, or "all tests pass" from memory | only commands run in this session or CI results; otherwise "Not yet run:" and ask |
| Retells the commit log | describe the end state of the diff |
| Explains how the code works | the why and the decisions; the code shows how |
| Marketing words, emoji headers, a closing summary | plain facts; end on the last fact |
| Invents the motivation or a ticket number | take it from the issue or the user, or ask |
| Adds a footer of its own | add no footer the harness or the user didn't ask for |

## Output and side effects

Don't run `gh pr create`, `gh pr edit`, `git push`, or any API write unless
the user asked for that action. "Write the PR description" asks for text.
"Open a PR" authorizes creating it once, with the title and body shown in
the reply. It doesn't authorize requesting reviewers, marking the PR ready,
or merging. When the user names a file, write the title and body there with
no fence. Otherwise put the title on its own line, then the body in a
fenced `markdown` block so the raw Markdown copies cleanly. When creating
the PR with `gh`, pass the body with `--body-file` so shell quoting can't
mangle backticks.
