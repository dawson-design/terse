# Document type research

This note records where each skill's structure and length rules come from.
Every number is labelled:

- **measured**: a study counted it;
- **originator guidance**: the person or organization that owns the format
  stated it;
- **convention**: practice with no measurement behind it, including every
  budget Terse sets above a measured median.

A budget is a ceiling, set above the typical length so a writer with more to
say still fits, and low enough that a model's default length fails it. No
study measures the length of an ADR, PRD, or tech spec. Every budget for
those three is guidance or convention, and pages convert to words at about
500 a page, which is itself a convention.

## ADR

| Rule | Source | Label |
|---|---|---|
| Sections: Title, Context, Decision, Status, Consequences; Context is value-neutral facts; the Decision reads "We will…"; Consequences list every outcome, not only the good ones; one decision per record; numbers never reused | [Nygard, "Documenting Architecture Decisions" (2011)](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | originator guidance |
| "The whole document should be one or two pages long." | [Nygard (2011)](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions#:~:text=The%20whole%20document%20should%20be%20one%20or%20two%20pages%20long) | originator guidance |
| MADR 4.0 sections (Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Consequences, Confirmation); `docs/decisions/NNNN-title.md`; Context in two or three sentences | [MADR](https://adr.github.io/madr/) | originator guidance |
| Nygard's template outperformed MADR in a controlled experiment | [Nogueira, Silva and Conte (2026)](https://arxiv.org/abs/2604.27333) | measured |
| At least two real alternatives before a decision is done | [Zimmermann, "A Definition of Done for Architectural Decisions"](https://www.ozimmer.ch/practices/2020/05/22/ADDefinitionOfDone.html) | originator guidance |
| Anti-patterns (Fairy Tale, Sales Pitch, Dummy Alternative, Mega-ADR, Blueprint in Disguise); length from one slide to a few pages | [Zimmermann, "How to create ADRs, and how not to"](https://www.ozimmer.ch/practices/2023/04/03/ADRCreation.html) | originator guidance |
| Y-statement form | [ADR templates](https://adr.github.io/adr-templates/) | originator guidance |
| A single page; inverted pyramid; serious alternatives; superseded, not reopened | [Fowler, "Architecture Decision Record"](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) | convention |
| The title names the decision, not the problem; an open PR means Proposed and main means Accepted | [GDS Way, "Architecture decisions"](https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html) | convention |
| What makes a decision architecturally significant; immutable once accepted | [AWS Prescriptive Guidance, "ADR process"](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html) | convention |
| Default directory `doc/adr`; `adr new`; superseding with `-s` | [adr-tools](https://github.com/npryce/adr-tools) | originator guidance |

## Tech spec

| Rule | Source | Label |
|---|---|---|
| Sections: context and scope, goals and non-goals, the design, alternatives, cross-cutting concerns; non-goals are plausible goals left out on purpose; sketch APIs rather than paste them; skip the doc when it would only be an implementation manual | [Ubl, "Design Docs at Google"](https://www.industrialempathy.com/posts/design-docs-at-google/) | convention (documented practice) |
| 10 to 20 pages for a large project, split past that; a one-to-three-page mini design doc | [Ubl](https://www.industrialempathy.com/posts/design-docs-at-google/) | convention |
| An overview of one or two paragraphs; a background a newcomer can follow; keep abandoned ideas | [HashiCorp RFC template](https://www.hashicorp.com/en/how-hashicorp-works/articles/rfc-template) | originator guidance |
| Background a paragraph or two, the proposal one, implementation a couple of pages; skip the doc if building is quicker | [HashiCorp, "Writing Practices and Culture"](https://www.hashicorp.com/en/how-hashicorp-works/articles/writing-practices-and-culture) | originator guidance |
| A one-paragraph Summary; Drawbacks; alternatives including the cost of doing nothing; unresolved questions | [Rust RFC template](https://raw.githubusercontent.com/rust-lang/rfcs/master/0000-template.md) | originator guidance |
| Document states; "timely rather than polished" | [Oxide, RFD 1](https://rfd.shared.oxide.computer/rfd/0001) | originator guidance |
| The status names the review wanted; named approvers | [Reilly, "The Power of 'Yes, if'"](https://engineering.squarespace.com/blog/2019/the-power-of-yes-if) | convention |
| "Do Nothing" as an alternative; no task lists; a two-page first version | [Calçado, "A Structured RFC Process"](https://philcalcado.com/2018/11/19/a_structured_rfc_process.html) | convention |
| The sections most company templates share | [Orosz, "Companies Using RFCs or Design Docs"](https://blog.pragmaticengineer.com/rfcs-and-design-docs/) | convention |

## PRD

| Rule | Source | Label |
|---|---|---|
| The problem is the heart of the document; personas from real interviews; each phase delivers value end to end; acceptance criteria read like test cases; technical considerations become questions for the RFC | [HashiCorp PRD template](https://www.hashicorp.com/en/how-hashicorp-works/articles/prd-template) | originator guidance |
| The problem in one or two sentences, with sign-off before the rest; goals "short and sweet"; non-goals | [Yien, PRD template (Square)](https://docs.google.com/document/d/1mEMDcHmtQ6twzNlpvF-9maNlAcezpWDtCnyIqWkODZs/edit) | originator guidance for that template |
| The press release under one page, the FAQ five pages or fewer; "no awards for extra pages" | [Bryar and Carr, Amazon](https://www.aboutamazon.com/news/workplace/an-insider-look-at-amazons-culture-and-processes) | originator guidance |
| One page, at least to start | [Rachitsky's template roundup](https://www.lennysnewsletter.com/i/683946/strategy), citing Adam Thomas | convention |
| A thorough template yields a 20-page doc nobody reads | [Yamashita, "Figma's approach to PRDs"](https://docs.superhuman.com/@yuhki/figmas-approach-to-product-requirement-docs) | convention |
| A problem statement gives the outcome, why the customer wants it, and the pain of the status quo | [Allan, Intercom (2021)](https://www.intercom.com/blog/how-to-write-problem-statements/) | convention |
| A PRD after discovery, never instead of it | [Cagan, "Discovery vs. Documentation"](https://www.svpg.com/discovery-vs-documentation/) | convention |

## PR description

| Rule | Source | Label |
|---|---|---|
| The description records what and why; a short, imperative first line that stands alone; "Fix bug" is a bad description | [Google, "Writing good CL descriptions"](https://google.github.io/eng-practices/review/developer/cl-descriptions.html) | originator guidance |
| About 100 changed lines is reasonable, 1,000 usually too large | [Google, "Small CLs"](https://google.github.io/eng-practices/review/developer/small-cls.html) | originator guidance |
| Give the problem, approach, and result; point reviewers to the key files and the feedback wanted | [GitHub, "Helping others review your changes"](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes) | originator guidance |
| Template locations | [GitHub, PR templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository) | originator guidance |
| Closing keywords work only on PRs into the default branch | [GitHub, linking a PR to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue) | originator guidance |
| An imperative subject; a body that explains what and why; 50 characters as a rule of thumb | [Beams, "How to Write a Git Commit Message"](https://cbea.ms/git-commit/) | convention |
| Human descriptions had a median of 56 words; Claude Code's had 355 | [Watanabe et al. (2025)](https://arxiv.org/html/2509.14745v3#:~:text=a%20median%20of%20355%20words%2C%20compared%20to%2056%20words%20in%20HPRs) | measured |
| Description length explained the most variance in review latency (46.3%), but the authors read length as a marker of a complex change | [Zhang et al. (2022)](https://zhangxunhui.github.io/files/ESE_2022_zxh.pdf) | measured, correlation |
| Developers value the purpose, the reason, and the link to the issue most; most element effects were negligible | [Pirouzkhah, Wurzel Gonçalves and Bacchelli (2026)](https://arxiv.org/html/2602.14611v1) | measured |

The 30, 150, and 300-word budgets are conventions above the human median.

## Review comments

| Rule | Source | Label |
|---|---|---|
| Explain why; comment on the code, not the person; label severity with Nit:, Optional:, and FYI: | [Google, "How to write code review comments"](https://google.github.io/eng-practices/review/reviewer/comments.html) | originator guidance |
| Approve once the change improves code health; "LGTM with comments" | [Google, "The Standard of Code Review"](https://google.github.io/eng-practices/review/reviewer/standard.html), ["Speed of code reviews"](https://google.github.io/eng-practices/review/reviewer/speed.html) | originator guidance |
| `<label> [decorations]: <subject>`; labels praise, nitpick, suggestion, issue, todo, question, thought, chore, note; decorations blocking and non-blocking | [Conventional Comments](https://conventionalcomments.org/) | originator guidance |
| Mountain, Boulder, Pebble, Sand, Dust | [Netlify, "Feedback Ladders"](https://www.netlify.com/blog/2020/03/05/feedback-ladders-how-we-encode-code-reviews-at-netlify/) | convention |
| Never say "you"; two or three code examples per round; stay inside the change | [Lynch, "How to Do Code Reviews Like a Human"](https://mtlynch.io/human-code-reviews-1/) | convention |
| Mark optional points non-blocking; post a summary after the line comments | [GitLab code review guidelines](https://docs.gitlab.com/development/code_review/) | convention |
| A pending review sends one notification | [GitHub, "Commenting on a pull request"](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/commenting-on-a-pull-request) | originator guidance |
| 65.5% of 1.5 million comments rated useful; defects, edge cases, and design guidance useful; praise and questions asked only to understand the code not useful; usefulness falls as the number of files grows | [Bosu, Greiler and Bird (2015)](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bosu2015useful.pdf) | measured |

Neither the Microsoft study nor [Google's case
study](https://sback.it/publications/icse2018seip.pdf) reports comment
length. The three-sentence, 60-word, and 350-word budgets are conventions.

## Email

| Rule | Source | Label |
|---|---|---|
| Subject keywords (ACTION, SIGN, INFO, DECISION, REQUEST, COORD); a bottom line up front that states the action required | [Sehgal, "How to Write Email with Military Precision" (HBR 2016; author's repost)](https://kabir.cc/?p=2433) | convention |
| Replies peaked at 50 to 125 words ("The sweet spot for email length is between 50-125 words"); three- and four-word subjects drew the most replies; one to three questions beat none by 50% | [Boomerang (2016)](https://blog.boomerangapp.com/2016/02/7-tips-for-getting-more-responses-to-your-emails-with-data/#:~:text=The%20sweet%20spot%20for%20email%20length%20is%20between%2050-125%20words) | measured, one vendor, correlation |
| A 49-word email drew nearly twice the responses of a 127-word one among 7,002 school board members; headings doubled clicks on the lower half of a long message | [Rogers and Lasky-Fink, book bite](https://nextbigideaclub.com/magazine/writing-busy-readers-communicate-effectively-real-world-bookbite/45483/) | measured, randomized |
| Fewer words, fewer ideas, fewer requests | [Harvard Gazette interview with Rogers (2023)](https://news.harvard.edu/gazette/story/2023/10/tips-on-how-to-connect-with-people-who-dont-have-time-to-read) | originator guidance |
| Six principles, including "use enough formatting but no more" and "make responding easy" | [Writing for Busy Readers](https://writingforbusyreaders.com/ai-prompt/) | originator guidance |
| Replies of five sentences or fewer | [five.sentenc.es](http://five.sentenc.es/) | convention |

Rejected: a figure of 75 to 100 words and 51% for email circulates on
secondary sites but is not on the Boomerang page. The Enron corpus papers
give no typical email length.

## Slack

| Rule | Source | Label |
|---|---|---|
| Don't send "hi" alone; put the question in the first message | [nohello](https://nohello.net/en/) | convention |
| Don't ask to ask; just ask | [dontasktoask](https://dontasktoask.com/) | convention |
| Avoid DMs; one topic, one message; use threads; @here only for urgent and important; Slack is not the record for decisions | [GitLab Handbook, Communication](https://handbook.gitlab.com/handbook/communication/) | convention |
| One message means one notification; reserve @mentions for specific requests | [Slack blog, etiquette tips](https://slack.com/blog/collaboration/etiquette-tips-in-slack) | originator guidance |
| mrkdwn syntax; no headings | [Slack, formatting message text](https://docs.slack.dev/messaging/formatting-message-text) | originator guidance |
| Mean words per message by channel type, from 100 hand-coded channels at one company: Test 5.8, Event 9.8, Social 12.8, Project 16.4, Bot 18.5, Employee Support 20.8, Announcement 20.7 (two channels only), IT Support 23.0 | [Wang et al. (CSCW 2022)](https://arxiv.org/pdf/1906.01756v5) | measured |

An earlier version of this note gave the range as 12.8 to 23.0 words and
omitted the two-channel caveat. The 50, 75, and 100-word budgets are
conventions above the measured range.

## Shared principles

| Rule | Source | Label |
|---|---|---|
| Lead with the answer | Minto, *The Pyramid Principle* | convention |
| State scope and non-scope, name the audience, put the key points first | [Google Technical Writing One, "Documents"](https://developers.google.com/tech-writing/one/documents) | originator guidance |
| Outline first; task-based headings | [Google Technical Writing Two, "Organizing large documents"](https://developers.google.com/tech-writing/two/large-docs) | originator guidance |
| Less is more; design for easy navigation; enough formatting but no more; make responding easy | [Rogers and Lasky-Fink, *Writing for Busy Readers*](https://www.hks.harvard.edu/publications/writing-busy-readers) | originator guidance, drawn from randomized experiments |
