---
name: tech-spec
description: "Write or review a technical spec, design doc, or RFC: how we'll build something and why this design beats the alternatives. Use when the user asks for a design doc, tech spec, technical design, RFC or RFD, or an engineering proposal, says 'spec this out', 'write up the design', or 'how should we build X', or hands over a spec to review, tighten, or check."
---

# Tech spec

A tech spec proposes how to build something and records the trade-offs
behind the design, so reviewers catch problems while changing course is
cheap. Its readers are the reviewers deciding whether to approve it and the
engineer who inherits the system. It isn't an implementation manual: a
design with no trade-offs to weigh doesn't need a doc.

`<terse-root>` is the directory two levels above this file. Before drafting,
read `<terse-root>/references/principles.md` and the approved voice it
names. This skill sets structure and length; the voice sets tone and wording.

## Write one, or don't

Write one when the problem or the solution is ambiguous, when the change
touches several teams, services, public APIs, or data contracts, or when the
work runs long enough that a flaw caught in review saves weeks.

Don't, and say why, when:
- building it would take less time than writing it up;
- the doc would only list steps, with no alternatives or trade-offs;
- feasibility is still unknown: prototype first, then write;
- it comes down to one decision: the adr skill;
- the problem, users, or measure of success aren't agreed: the prd skill.

## Repo convention first

Look for `docs/design/`, `docs/rfcs/`, `rfcs/`, `rfd/`, `docs/specs/`,
`design-docs/`, a numbered template (`0000-template.md`), an RFC issue
template, or a process note in CONTRIBUTING. When one exists, use its
headings, header fields, numbering, status words, and location. The sections
below are defaults for a repo with none.

## Gather before drafting

Read the PRD or issue, earlier specs and ADRs, and the code the design
touches. Take the current architecture, APIs, data model, and call sites
from the code, citing paths. Ask for the rest in one batch.

| Input | Source | If missing |
|---|---|---|
| Problem and why now | PRD, issue, user | ask, or offer the prd skill |
| Goals in priority order; non-goals | PRD, user | ask; scope is the owner's call |
| Constraints: SLOs, volume, latency, cost, deadline, compliance | user, PRD, dashboards | ask; never invent a number |
| How the current system works | code, docs | derive; cite files |
| Options already weighed, and why they lost | user, threads | ask; never invent a rejected option |
| Approvers and affected teams | user | ask |
| Rollout limits: migration, compatibility, flags, on-call | user, code | ask for what the code doesn't show |

Gaps become `[TBD: what is missing]` in place and an Open questions entry,
with an owner when one is known. Label each assumption as one and list it
there too.

## Sections

Choose the size first. Start with a mini spec, and grow it to a full one only
when the work crosses teams or a section needs the room.

| Section | Purpose | Mini | Full |
|---|---|---|---|
| Header | a status that names the review wanted; authors, approvers, date, links | required | required |
| Summary | what we'll build and the recommendation; a reader can stop here | required | required |
| Context | the facts a newcomer needs to see why; link, don't retell | required | required |
| Goals and non-goals | what success requires; plausible goals we exclude | required | required |
| Design | an overview, then the parts and their trade-offs | required | required |
| Alternatives considered | the options the team weighed, and why each lost; doing nothing only when it was a real option | a paragraph | required |
| Risks | the case against, and what could go wrong | inside Design | required |
| Cross-cutting concerns | security, privacy, observability, reliability, migration: those that apply | a line each | a short section each |
| Rollout and testing | phases, flags, migration, rollback, how we'll know it works | if it ships | if it ships |
| Open questions | unresolved points, with owners | while in review | while in review |

```markdown
# <What we're building>

Status: Draft. <The review you want, e.g. "Is the approach sound?">
Authors: <names>   Approvers: <names or roles>   Updated: YYYY-MM-DD
Links: <PRD>, <issue>, <ADRs>

## Summary
## Context
## Goals and non-goals
## Design
## Alternatives considered
## Risks
## Cross-cutting concerns
## Rollout and testing
## Open questions
- <question> (owner)
```

Context and Design reasoning stay in prose. Use subsections inside Design
only where the design has parts: the system context, an API sketch, the
data, the key flows. Put each trade-off where it arises. Sketch APIs and
schemas and link the full definitions; include code only for a novel
algorithm. Draw only what the code or the user confirms.

## Length

| Size | Budget | Source |
|---|---|---|
| Mini spec, the default | 500 to 1,500 words of prose, one to three pages | Ubl, "Design Docs at Google": the mini design doc (documented convention) |
| Full spec | up to 10 to 20 pages for a large project; split into sub-specs past that | Ubl (documented convention) |
| Summary | one or two paragraphs | HashiCorp RFC template (originator guidance); Rust RFC template: one paragraph |
| Context | a paragraph or two, a page at most | HashiCorp RFC template and writing guide (originator guidance) |

Words per page (about 500) is a convention, and code and diagrams don't
count. Ask before going past 1,500 words. Build a full spec from a skeleton
the user approves, with a word budget for each section.

## Draft

1. Decide which document this is: a spec, an ADR, a PRD, or nothing.
2. Resolve the convention, the size, and the path.
3. Gather, ask in one batch, and mark the gaps.
4. For a full spec, write a skeleton first: each heading with a one-line
   claim and a word budget. Get it approved before writing prose.
5. Write Design and Alternatives first, then the Context they need. Write
   the Summary last, stating the recommendation.
6. Add a sentence only where a reviewer would otherwise have to ask.
7. Check the length, then run the claudism scan from the principles.

## Review an existing spec

Report each structural finding with its fix, then run the claudism scan.
Leave sentence style to the voice.
- The Summary describes the doc ("This document covers…") instead of
  recommending.
- The status doesn't say what review is wanted, or there are no approvers.
- The Context fails the newcomer test, or retells the PRD instead of linking.
- Goals or non-goals are missing, or the non-goals only negate goals.
- The Design lists steps with no trade-offs.
- No real alternative, or rejections not tied to goals.
- No risks.
- Security, privacy, and observability are neither addressed nor marked as
  not applying.
- A production change has no rollout or rollback.
- Pasted schemas, interface definitions, or code that should be linked.
- Open questions settled by assertion.
- A section depends on one that comes later.
- Over budget, or past 20 pages.

## Failure modes

| Agent habit | Countermeasure |
|---|---|
| A task list posing as a design | for each major choice, say why it beats the alternative |
| Invented SLOs, traffic, latency, or cost | ask, or write a TBD and an open question |
| Strawman alternatives, or options nobody weighed | the options the team weighed, each at its best |
| Every optional section filled | omit empty sections; one line for a concern that doesn't apply |
| Pasted schemas, configs, or code | sketch the part that matters and link the rest |
| A heading on every paragraph, Context as bullets | headings per section, reasoning in prose |
| A Summary that previews the outline | the recommendation, in two sentences |
| PRD content copied in | one sentence and a link |
| Diagrams of a system the agent hasn't read | draw only what the code or the user confirms |

## Hand-offs

- From a PRD: link it in the header, trace each goal to a PRD goal, and
  answer the PRD's questions for engineering in Design.
- To ADRs: once the spec is approved, offer the adr skill for each
  hard-to-reverse decision, and link each ADR from Design.
- Back to the PRD when review disputes the problem rather than the design.
- Offer follow-up documents; never draft one unasked.
