---
name: adr
description: "Write or review an architecture decision record (ADR). Use when the user asks to write an ADR, record or log a decision, document why we chose X over Y, capture a decision from a PR thread, meeting, or spec, or supersede an earlier ADR. Also use when the user hands over an ADR to review, tighten, or check."
---

# ADR

An ADR records one architecturally significant decision: the forces that
made it necessary, what we decided, and what we accepted with it. Its reader
is an engineer a year from now asking "why is it like this, and can I change
it?"

`<terse-root>` is the directory two levels above this file. Before drafting,
read `<terse-root>/references/principles.md` and the approved voice it
names. This skill sets structure and length; the voice sets tone and wording.

## Write one, or don't

Write one when the decision shapes structure, quality attributes (security,
availability, performance), dependencies, interfaces, or how the team builds
software, and it is costly to reverse, crosses teams, or will make a later
engineer ask why.

Don't when it is cheap to reverse, local to one module, temporary, or
already settled by a standard or an earlier ADR. Say so and suggest a PR
description or a code comment instead. Route elsewhere when:
- the options are still open and the design unexplored: the tech-spec skill;
- the draft covers a whole system or several decisions: one ADR per
  decision, or a tech spec;
- the user need itself is disputed: the prd skill.

## Repo convention first

Look for a decision log: `doc/adr/` (adr-tools), `docs/adr/`,
`docs/decisions/` (MADR), `docs/architecture/decisions/`, `adr/`, an
`.adr-dir` file, a template (`template.md`, `adr-template.md`, `0000-*.md`),
or ADR notes in CONTRIBUTING or the README. When one exists, match its
location, file names, numbering, headings, front matter, status words, and
title style, even where they differ from the default below. Use exactly the
sections the existing records use, and add none of the optional ones below.
Take the next
unused number and never reuse one. With no log, use
`docs/adr/NNNN-<decision-in-kebab-case>.md` from `0001`, and tell the user
you started one.

## Gather before drafting

Read the issue, PR thread, spec, related ADRs, and the code the decision
touches. Take facts about the current system from the code. Ask for every
missing input in one batch, before drafting.

| Input | Source | If missing |
|---|---|---|
| The decision, in one sentence | user, spec, thread | ask; no decision, no ADR |
| Drivers: constraints, quality goals, deadlines | user, spec | ask; never infer motives |
| Options the team weighed, and why each lost | user, thread | ask; never add an option nobody weighed |
| Costs, risks, follow-up work | user, spec | ask "what gets harder?" |
| Deciders and date | user | ask; leave blank rather than guess |
| Status | user | default `Proposed` |
| Related ADRs, specs, issues | repo | search and link |

A gap the user can't fill becomes `[TBD: what is missing]` where the fact
belongs and a line under Open questions. An ADR with an open question about
its own decision stays Proposed.

## Sections

The title states the decision, not the problem: "Use Postgres for the event
store", not "Event store database". One decision per record.

| Section | Purpose | Need |
|---|---|---|
| Status, date, deciders | lifecycle and accountability | required |
| Context | the forces at play, as facts, in prose | required |
| Decision | what we will do, as "We will …" | required |
| Options considered | the alternatives the team weighed, and why each lost; the status quo only when it was a real option | required |
| Consequences | what gets easier, what gets harder or costs more, the work it creates | required |
| Confirmation | how we'll know it's followed: a review, a test, a fitness function | optional, only when the inputs name one and the repo has no template |
| Revisit when | the signal that should reopen it | optional, only when the inputs name one and the repo has no template |
| Open questions | gaps, while Proposed | only with gaps; with a repo template, put them where it does, or in Consequences |

```markdown
# NNNN. <Decision as a short phrase>

Status: Proposed
Date: YYYY-MM-DD
Deciders: <names or roles>

## Context

<The background, the problem as we meet it, and the forces pulling against
each other. Facts, not advocacy.>

## Decision

We will <decision>. <Its scope, and the rule that follows from it.>

## Options considered

- <Chosen option>: <why it wins against the drivers>.
- <Alternative>: <its best case, and why it lost>.
- <The status quo, if the team weighed it>: <what happens if we change nothing>.

## Consequences

<What gets easier, only as far as the inputs show, with the limits they
name. What gets harder or costs more. The decisions and work this creates,
linked when they exist.>
```

Context and Decision are prose. Bullets hold parallel items such as options
and consequences, never reasoning cut into fragments. A contained decision
may be a single Y-statement under the header, but only when every slot is
known: "In the context of <use case>, facing <concern>, we decided for
<option> and against <alternatives>, to achieve <quality>, accepting
<downside>."

## Length

| Part | Budget | Source |
|---|---|---|
| Whole record | 400 to 600 words, with a ceiling of 1,000 words of prose; code, diagrams, and links don't count | Nygard: "one or two pages" (originator guidance); Fowler: a single page (convention); about 500 words a page (convention) |
| Context | two or three sentences to start, three short paragraphs at most | MADR template (originator guidance) |
| Options | at least two real options, one to three sentences each | Zimmermann's definition of done (originator guidance) |

Scale with the cost of reversal: a Y-statement for a contained choice, two
pages at most for a complex one. Past 1,000 words it is a design doc under
an ADR's name. Move the detail to a spec, or split the decision.

## Draft

1. Confirm the decision warrants a record and the record holds one decision.
2. Resolve the location, number, and template from the repo.
3. Gather, ask in one batch, and mark what stays unknown.
4. Write the title and Decision first, then the Context that makes the
   decision necessary, then Options and Consequences.
5. Add a sentence only where the future reader would otherwise have to ask.
6. Check the length, then run the claudism scan from the principles.
7. Return the record as Proposed, with open questions listed. Never mark it
   Accepted yourself.

To supersede, write a new ADR whose Context says what changed, set the old
one's status to `Superseded by NNNN`, and link both ways. Don't rewrite an
accepted record's body unless the repo amends ADRs with dated notes.

## Review an existing ADR

Report each structural finding with its fix, then run the claudism scan.
Leave sentence style to the voice.
- The title names the problem, not the decision, or the record holds more
  than one decision.
- The Decision isn't a commitment, or it sits below the options.
- The Context argues for the answer instead of stating the forces.
- Fewer than two real options, or an option nobody would pick.
- A rejected option has no reason tied to the drivers.
- The Consequences list only benefits.
- The status is missing or off-vocabulary, or a superseded record lacks
  links both ways.
- The number, file name, or location breaks the repo's convention.
- How-to steps, pasted code, or config that belongs in a spec.
- A summary, or a section that restates the title.
- Over 1,000 words, or a driver, number, or name with no source.

## Failure modes

| Agent habit | Countermeasure |
|---|---|
| Alternatives invented to lose | only options the user or a source names; ask for the rest |
| Consequences that are all upside | at least one cost; ask what gets harder |
| Context as a wall of bullet fragments | prose: background, problem, why |
| Accepted status, deciders, or dates guessed | Proposed, blanks, and a question |
| Generic pros and cons ("scalable", "learning curve") | tie each to a named driver, or cut it |
| A benefit stretched past the inputs ("keeps working through an outage" when a miss still fails) | the benefit in the inputs' terms, with the limit they name |
| A weighted scoring matrix with made-up weights | drop it unless the user supplies the weights |
| Several decisions in one record | split them, cross-linked |
| An accepted ADR edited in place | a superseding ADR |

## Hand-offs

- From a tech spec: each hard-to-reverse choice in an approved spec becomes
  its own ADR, and the two link to each other.
- From a PRD: a decision forced by a product requirement cites it.
- To a tech spec: if the options need design work, stop and offer the
  tech-spec skill. Offer follow-up documents; never draft one unasked.
