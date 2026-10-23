---
name: prd
description: "Write or review a product requirements document (PRD): the problem, who has it, what success looks like, and what the product must do, without the technical design. Use when the user asks for a PRD, product spec, requirements doc, one-pager, problem statement, feature brief, or PR/FAQ, or hands over one to review, tighten, or check."
---

# PRD

A PRD gets the team to agree on the problem, who has it, what success looks
like, and what the product must do, before anyone designs how. Its readers
are the people who must agree on scope, then the engineer who writes the
spec from it. It says what and why; the tech spec says how.

`<terse-root>` is the directory two levels above this file. Before drafting,
read `<terse-root>/references/principles.md` and the approved voice it
names. This skill sets structure and length; the voice sets tone and wording.

## Write one, or don't

Write one when the problem is ambiguous and several functions must agree on
it, when the work is big enough to phase, or when a spec writer needs agreed
requirements to design against.

Don't, and say why, when:
- the problem is agreed and small: an issue or an epic will do;
- nobody has evidence the problem is real: write a one-page problem
  statement, or prototype and test first;
- the change is purely technical: the tech-spec skill;
- the user wants one decision recorded: the adr skill.

Two variants on request. A one-pager holds Problem, Goals, Non-goals, and an
outline of requirements on one page. A PR/FAQ is a press release under one
page, then FAQs of five pages or fewer.

## Repo convention first

Look for a PRD or product-spec template in the repo or the docs the user
points to (`docs/prd/`, `docs/product/`, `.github/ISSUE_TEMPLATE/`), and
earlier PRDs from the same team. When one exists, use its headings, header
fields, status words, and location.

## Gather before drafting

Read the issue, research notes, support tickets, analytics the user shares,
and earlier PRDs. Summarize the evidence; never create it.

| Input | Source | If missing |
|---|---|---|
| Who has the problem, the outcome they want, the pain today | research, user | ask |
| Evidence: interviews, tickets, data | user, links | ask; never invent a quote, persona, or figure |
| Why now | user | ask |
| Success metrics: baseline, target, date, data source | user, dashboards | ask; never invent a number |
| Non-goals | user | ask; scope is the owner's call |
| Requirement priority or phases | user | ask |
| Owner, approvers, dates | user | ask; leave blank rather than guess |
| Constraints: legal, accessibility, platform, deadline, dependencies | user | ask |

Gaps become `[TBD: what is missing]` in place and an Open questions entry. A
metric with no baseline reads `[TBD: baseline]`, never an estimate. The
requirements stay Draft while the Problem has a TBD.

## Sections

| Section | Purpose | One-pager | Full |
|---|---|---|---|
| Header | one-line description, status, owner, approvers, date, links | required | required |
| Problem | who, the outcome they want, and what hurts now, in one or two sentences; then why now, with evidence linked | required | required |
| Users | who has the problem, drawn from research | a line | required |
| Goals and success metrics | prioritized; each metric with a baseline, target, and date | required | required |
| Non-goals | plausible scope we're excluding, and why | required | required |
| Requirements | what the product must do, by phase, with acceptance criteria | an outline | required |
| Evidence | links to research, a paragraph per source of insight | links | required |
| Approach and key flows | the rough shape of the solution; linked designs or prototype | optional | optional |
| Launch plan | phases, the criteria to advance, dependencies | omit | optional |
| Questions for engineering | technical unknowns for the spec, as questions | optional | optional |
| Open questions | gaps, with owners | while Draft | while Draft |

```markdown
# <Name>: <one-line description>

Status: Draft
Owner: <name>   Approvers: <names or roles>   Updated: YYYY-MM-DD
Links: <research>, <designs>, <tech spec>

## Problem
## Users
## Goals and success metrics
| Goal | Metric | Baseline | Target | By |
|---|---|---|---|---|
## Non-goals
## Requirements
### Phase 1: <objective, for whom>
- <What the product must do.> Acceptance: <a checkable condition>.
## Open questions
- <question> (owner)
```

Requirements describe behavior, not design. Everything in a phase is
required; what matters less moves to a later phase, and each phase delivers
value end to end. Write plain requirements rather than "As a user, I want…"
unless the team's template uses stories.

## Length

| Kind | Budget | Source |
|---|---|---|
| Problem statement | one or two sentences | Yien's PRD template at Square (originator guidance for that template) |
| One-pager, the default for a single feature | about 600 words | one page to start (Adam Thomas, via Lenny Rachitsky; convention); about 500 words a page (convention) |
| Full PRD | about 1,500 words; past 3,000, split by phase or into child PRDs | convention; Figma's template warns that thoroughness yields a 20-page doc nobody reads |
| PR/FAQ | a press release under one page, FAQs of five pages or fewer | Bryar and Carr, Amazon (originator guidance) |

No study measures PRD length. Acceptance criteria count toward the budget;
linked research doesn't.

## Draft

1. Decide which document this is: a PRD, a problem statement, an issue, a
   spec, or nothing.
2. Resolve the template and location.
3. Gather, ask in one batch, and mark the gaps.
4. Write the Problem first and show it to the user. If they don't agree with
   it, nothing below it matters.
5. Then write Goals and metrics, Non-goals, and Requirements, in that order.
   Write the one-line description last.
6. Add a sentence only where a reader would otherwise have to ask.
7. Check the length, then run the claudism scan from the principles.

## Review an existing PRD

Report each structural finding with its fix, then run the claudism scan.
Leave sentence style to the voice.
- The Problem isn't on the first screen, or runs past two sentences.
- The Problem names a feature ("users need a dashboard") instead of an
  outcome and a pain.
- Claims of user need with no evidence, or personas not drawn from research.
- Goals without priority, or a metric without a baseline, target, or date.
- Non-goals missing, or written as negated goals.
- Requirements that can't be tested, no acceptance criteria, everything a
  must-have, or a phase that delivers nothing end to end.
- Requirements that dictate the design with no stated constraint; move them
  to Questions for engineering.
- A summary that repeats the body, or boilerplate sections with no content.
- TBDs with no Open questions section, or over budget.

## Failure modes

| Agent habit | Countermeasure |
|---|---|
| Invented metrics ("lift engagement 20%") | ask; `[TBD: baseline]`, `[TBD: target]` |
| Invented personas, quotes, or survey figures | only research the user supplied; otherwise a TBD |
| A solution written as the problem | rewrite it as an outcome and a pain; move the solution to Approach |
| "As a user, I want…" on every line | plain requirements |
| Technical design inside the PRD | turn it into a question for engineering |
| Every launch and operations section filled | a section only when it has content |
| Generic non-goals ("not boiling the ocean") | a plausible scope item, and why it's out |
| Problem and background as bullet walls | prose: background, problem, why |
| Made-up dates and owners | blanks, and a question |

## Hand-offs

- To a tech spec: once the PRD is approved, offer the tech-spec skill. The
  spec links the PRD, traces its goals, and answers the questions for
  engineering.
- To ADRs: a requirement that forces an architectural decision is cited in
  that ADR's Context.
- Back from the spec: when review disputes the problem, fix the PRD.
- Offer follow-up documents; never draft one unasked.
