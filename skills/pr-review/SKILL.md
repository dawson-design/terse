---
name: pr-review
description: "Turn code review findings into comments on someone else's pull request: labeled inline comments and the overall review summary with a verdict. Use when the user asks to draft, write, word, or soften review comments, leave feedback on a PR, write the review summary, or check their review comments before posting. Shapes findings from the user or a code-review skill; it does not find defects itself."
---

# PR review comments

This skill words and arranges review findings. It doesn't discover them.
Asked to "review PR 123" with no findings in hand, run a code-review skill
first (`consult:code-review` or `/code-review`), then come back here.

The author must be able to tell from each comment alone whether it blocks
the merge. Every comment carries a label that says so, and the summary opens
on the verdict.

`<terse-root>` is the directory two levels above this file. Before drafting,
read `<terse-root>/references/principles.md` and the approved voice it
names. This skill sets structure and length; the voice sets tone and wording.

## Inputs

1. The findings, from the user or a code-review run: location, problem,
   impact, fix direction, severity.
2. The PR, read-only: `gh pr view <n>` for the stated intent, and
   `gh pr diff <n>` to anchor each finding to a changed line.
3. The team's convention: CONTRIBUTING and recent review comments. A team
   that uses `nit:`, Netlify's feedback ladder, or its own labels keeps
   them. Otherwise use Conventional Comments.

Ask the user, and never decide alone:
- whether a judgment-call finding blocks;
- the verdict, when any finding is a judgment call;
- whether an unverified finding is real. Until then, write it as a question.

## Labels

The format is `**label (decoration):** subject`, from Conventional Comments.
The reviewer's own words set severity. A finding they call a blocker or
say can't ship is blocking. When they name some findings as blockers, the
rest are non-blocking unless they say otherwise; "should" and "would like"
are requests, not blockers. The table covers findings whose severity the
reviewer left open. Add no findings, tests, or suggestions of your own.

| Finding | Label | Decoration |
|---|---|---|
| Wrong behavior, security, data loss, a broken contract | issue | blocking |
| Missing test for new behavior | todo | blocking only when the reviewer says so |
| A small required change: a style-guide rule, a changelog entry, a typo in a public string | todo | blocking |
| A better approach that isn't required | suggestion | non-blocking |
| Unsure it is a problem | question | blocking only if the answer could block; say which |
| A preference the style guide doesn't cover | nitpick | non-blocking |
| Outside the changed lines, or later work | note | non-blocking; offer a follow-up issue |
| A specific strength worth repeating | praise | none |

From code-review severities, Critical and High become issue (blocking).
Medium becomes issue (blocking) when it is likely to cause a defect, and
suggestion (non-blocking) otherwise. Low becomes a nitpick or is dropped.
Google's Nit:, Optional:, and FYI: map to nitpick, suggestion, and note.

## Inline comment

```markdown
**issue (blocking):** <the problem, with the code as the subject>

<The consequence for users, data, or the next reader.>
<The fix as a suggestion block, or one concrete question.>
```

- At most three sentences plus code. Needing more means a design discussion:
  one comment proposing a call, or a line in the summary.
- One finding per comment, on the changed line it concerns.
- The code is the subject ("this loop…", "we…"), never the author ("you
  forgot…").
- Use a suggestion block for any fix of a few lines, and two or three code
  examples per round at most.
- A repeated pattern gets one comment on the first instance. It lists the
  other locations and asks for the pattern to be fixed everywhere.
- A question asks for something the decision needs: "Can `items` be empty
  here? `items[0]` would throw." Not "Why did you do it this way?"
- State the problem plainly and let the label carry the softness. No
  "maybe", "perhaps consider", "just a thought", or "not a big deal, but".

## Review summary

```markdown
<Verdict and reason, in one line: Approve, Approve with comments,
Request changes, or Comment.>

Blocking:
- <one line per blocking item, with file:line>

<Non-blocking: the count and kind, and "take or leave them".>
```

- Any blocking item means Request changes. With none, Approve:
  non-blocking comments don't hold up approval. When an open question
  decides whether something blocks, use Comment and say what answer
  unblocks it.
- A design-level blocker changes the round: send the design comment and
  hold the line-level nits until the approach settles.
- Past about ten comments, or with a diff too large for one sitting, say so
  first and ask for a split or a walkthrough.
- Replies in a thread follow the same rules: the answer first, and a new
  label if the blocking status changed.

## Length

| Part | Budget | Source |
|---|---|---|
| Inline comment | three sentences plus code | convention; no study measures comment length |
| Summary | 60 words plus the blocking list | convention |
| Whole review | 350 words at most for a typical PR; past that, ask for a split or a design conversation | convention |
| Code examples | two or three per round | Lynch (convention) |

Bosu et al. (2015, 1.5 million comments at Microsoft, measured) found that
authors rated comments on defects, edge cases, and API or design guidance
useful, and rated praise and questions asked only to understand the code
not useful. Usefulness fell as the number of files in a change grew.

## Draft

1. Read the intent and the diff. Drop or relabel findings on untouched lines.
2. Label each finding, and ask about the judgment calls.
3. Order them: blocking by severity, then suggestions, then nits grouped.
4. Write the summary, verdict first, then each comment. GitHub shows the
   review's summary above its inline comments, so a written review keeps
   that order.
5. Check the length, then run the claudism scan from the principles.

## Review existing comments

- A comment with no label or no blocking status.
- A label that contradicts the content, such as a data-loss bug marked nit.
- Hedged until the author can't tell whether it blocks.
- Over three sentences without code.
- A wall of nits with no blocking split, or one nit repeated.
- A blocking comment on lines the PR doesn't touch.
- A summary that doesn't open on the verdict, or a verdict that contradicts
  the comments: Approve with a blocker, Request changes with only nits.
- Generic praise, or praise opening every comment.
- "You" aimed at the author, or demands phrased as questions.
Then run the claudism scan.

## Failure modes

| Agent habit | Countermeasure |
|---|---|
| "Great work! Just a few small thoughts…" before a blocker | the verdict first; one specific line of praise, last, if any |
| Hedges until blocking is unclear | a decoration on every comment and a plain sentence |
| Marks everything blocking, or nothing | the label table; ask about the judgment calls |
| A wall of nits | group them, drop Low, hold them behind a design blocker |
| Reviews the whole file | changed lines only; a note and a follow-up issue for the rest |
| Restates what the code does | the problem, the consequence, the fix |
| Adds findings to look thorough, or overstates certainty | only the findings given; unverified ones become questions |
| Paragraphs of principle | one sentence of why, and a link |

## Output and side effects

Don't run `gh pr review`, `gh pr comment`, an API POST, an approval, or a
thread resolution unless the user asked for that action. By default, give
the summary with the proposed verdict first, then each inline comment as
`path/to/file.ts:42` followed by the comment in a fenced `markdown` block.
When a comment holds a suggestion block, fence the comment with four
backticks or with tildes. When asked to post, post one batched review, with
the pending comments plus the summary, so the author gets one notification
and the verdict the user approved.
