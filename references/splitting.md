# The split test

A long document often holds several documents, each with its own reader.
Run this test on a long document's skeleton before writing prose, and first
when reviewing one. It decides whether the document should split. Each
document that results follows its own skill's sections and budget.

## Measure

    node "<terse-root>/scripts/outline.mjs" <file>

It prints the document's prose words and pages, then each heading to three
levels with the prose words in its section and any words in code. Read the
outline before the document. For a skeleton, use the budget planned for
each heading. Without Node, count each section with `wc -w`.

## When to split

A length the voice or the repo's template sets for the type replaces the
split points below. Split when either of these holds:

- **The document is past its type's split point, and the cuts the
  principles call for wouldn't bring it under.** The split points are 1,000
  words for an ADR, 3,000 for a PRD, and 10,000 (20 pages) for a tech spec.
  Cut background, restated material, and anything a link carries first.
- **A part longer than a page (500 words) belongs to another document
  type**, as the table below shows. A part's own reader, approver, or
  schedule supports the case but doesn't make it alone: a rollout section
  stays in the spec even when SRE approves it.

The parts that belong elsewhere once they pass a page:

| Part | Where it goes |
|---|---|
| The problem, goals, and requirements, approved before the design | a PRD, which the spec links |
| One hard-to-reverse choice, argued at length | an ADR once the spec is approved; the spec keeps the options and links the ADR |
| A runbook: rollout or migration steps for each environment | a delivery plan |
| A task list with order, owners, or "done when" checks | a delivery plan |
| Test names and fixtures | the test code |
| Config, values files, schemas, and full interface definitions | the repo, linked where they matter |

A spec keeps its rollout approach (phases, flags, rollback) and how each
requirement will be proven. Only the step-by-step runbook and the task list
move. A delivery plan follows the repo's convention for its name, place, and
sections; Terse sets no structure for it.

A reading guide that sends different readers to different parts ("reviewers
read Part A; an agent building one task reads 6.4 and 14.1") is a sign that
the parts are separate documents.

Don't split:
- a document that cutting would bring under its split point. Cut it
  instead.
- by length alone into "part 1" and "part 2". A design that stays past its
  split point after the cuts splits by sub-problem, each with its own
  design.
- into a piece that can't be read alone. Each piece opens with its own
  answer.

## How to split

- Split by document type and reader.
- Give each fact one home. The other documents link to it and don't restate
  it.
- Link both ways: the spec to its PRD, ADRs, and delivery plan, and each of
  them back to the spec.
- Keep the original file name for the document most links already point to.

## The split plan

When the test calls for a split, report a plan before moving any text:

| Document | Takes | Reader or approver | Budget | Words now |
|---|---|---|---|---|
| <path> | <sections> | <who> | <its skill's budget, or none> | <from the outline> |

Then list what moves to the repo and what to cut. Restructure only after
the user approves the plan. When nobody can approve it (a headless run),
write the document the user asked for and give the plan in your reply.
