# Writing-tell research

This note records how Terse chooses the phrases in
`references/claudisms.md`. The list doesn't try to detect who wrote a
passage. A match marks wording worth rewriting, and it can't prove its
source.

## Sources

- The claudism lists collected on the Claude subreddits supply the nine
  families the list is organized by: anthropomorphized code-speak,
  self-important spotlighting, performative candor, unsolicited validation,
  adverb inflation, the em-dash reframe, hedging connective tissue, metaphor
  soup, and sign-off tics. Puffery is the tenth family.
- Kobak et al., the [PubMed corpus
  study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12219543/), measures word
  use in more than 15 million PubMed abstracts. Its 2024 style list includes
  forms of `delve` and `underscore`.
- Russell et al., the [expert detection
  study](https://aclanthology.org/2025.acl-long.267/), examines 300 nonfiction
  articles from GPT-4o, Claude, o1, and human writers. Experts noted repeated
  structures, stiff formality, low originality, and uniform prose. Those broad
  judgments don't map to safe phrase rules.

## Admission method

A phrase enters the list only when it meets all three conditions:

1. A published source or the subreddit lists link it to model-written text.
2. It is a phrase, or a word with no everyday literal sense (`delve`,
   `synergy`). A word with a literal sense enters only inside a frame that
   rules the literal sense out: `underscores the`, not `underscore`.
3. It produces no match in the committed human-prose corpus
   (`test/fixtures/human-prose/`) or in the innocent lookalikes in
   `test/claudisms.test.js`.

Quoted text, code, and blockquotes stay exempt. An approved voice template
keeps any phrase its Exceptions section or its "Theirs:" samples use.

## Kept out of the list

| Candidate | Reason |
|---|---|
| Plain-word preferences (`leverage`, `utilize`, `robust`, `showcase`) | They are word choices with plain synonyms, not tells, and the voice decides word choice. |
| Em dashes | A punctuation habit, which belongs to the voice. Only the reframe uses (`— not`) are listed. |
| Figurative verbs (`holds`, `buys you`) and pointer nouns (`this approach`) | Too common in human technical writing. The shared principles ask writers to name the thing instead. |
| Layout: bold-label bullet runs, closing-summary headings, emoji headers, slogan openers | Structure, so the shared principles and each document skill cover them. |
| `intricate`, `meticulous` | Each has an ordinary sense with no safe frame or replacement. |
| Formulaic structure, formality, low originality | Each needs document context and judgment, not a phrase match. |
| The "isn't X, it's Y" reframe without an article or "about" after "it's" | The bare pattern matched causal clauses in the user's own writing ("as the work is not repeatable, it's hard to automate"). |

## Deterministic evidence

`test/claudisms.test.js` covers the list. It checks that every labelled tell
matches and every innocent lookalike stays silent. It also checks that the
human-prose corpus stays silent, that each notation feature compiles as
documented, and that a voice template's kept phrases are allowed.
