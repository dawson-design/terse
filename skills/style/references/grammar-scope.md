# Grammar scope

The mechanics stage of the findings contract covers correctness errors
and nothing else. It must leave style, structure, and voice as found.
The checker catches a tested subset: the errors that edits leave in a
model's draft. The model owns the rest of this scope. A clean checker
run proves nothing here, since the checker finds about half the errors
in its held-out suite.

The native checker reads narrow frames where only one form is correct:

- a subject whose number changed while its verb did not (`the
  artifacts is`, `each request take`, `there is three`)
- a homophone in its one grammatical frame (`it's own`, `your going
  to`, `to complex to`, `might loose`)
- a compound noun in a verb slot (`setup the server`, `need to login
  to`)
- a comma splice before `however` or `therefore`, a question closed
  with a period, and a clause with no main clause
- a wrong form after a modal or `to` (`will fixed`, `to runs`), `could
  of`, doubled words, and misspellings with one correct form

The combined document check adds 30 pinned Harper 2.7.0 rules. Terse
keeps each one to the context where its fix is certain, and every other
Harper rule stays off. Both engines report ordinary `grammar` findings.

Broad spelling is off by default. A project may opt in with an explicit
dialect and its own dictionary:

```json
{
  "grammar": {
    "spelling": true,
    "dialect": "american",
    "words": ["Terse", "ProseMirror"]
  }
}
```

The supported dialects are `american`, `british`, `australian`,
`canadian`, and `indian`. Spelling findings may offer several choices;
the hint asks the editor to check them rather than asserting one fix.

The model still checks:

- spelling and typos outside the checker's list and the opt-in
  spelling check
- agreement across a phrase (`the list of issues are`) or where a
  noun also reads as a verb (`each stage run`)
- tense and pronoun agreement
- homophones outside their frames: `there` or `you're` before a noun,
  `whose` and `who's`, `effect` as a verb, and `then` after a
  comparative
- articles and prepositions beyond `a/an` (a missing `the`, a wrong
  preposition)
- punctuation: run-ons, comma splices with no linking word, quotes or
  brackets left open, and stray apostrophes
- dropped words

Do not touch: word choice, sentence length, passive voice, tone,
hedges, structure. A sentence that is grammatical but bad leaves this
scope unchanged.

Safeguards:

- Make the smallest edit that makes the sentence correct.
- Without an explicit spelling dialect, keep the author's spelling as
  found. A document that agrees with itself beats either standard.
- Leave prose inside code blocks, inline code, and URLs alone.
- Quoted material keeps its original errors; note them instead of
  editing quotes.
- Report every correction as before -> after with a `file:line`
  reference. If nothing needed fixing, say so.
