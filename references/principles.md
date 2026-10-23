# Principles for work documents

Every Terse document skill follows these rules. They govern structure and
length. How sentences sound belongs to the voice.

## Precedence

1. What the user asks for in this request.
2. The repo's or team's template and conventions.
3. The approved voice: tone, wording, the order of the argument, and any
   length it sets for this genre.
4. The document skill's defaults.

One rule holds at every level: the answer opens the document. The decision,
recommendation, ask, or news sits in the title, the subject line, or the
first two sentences. After that, the voice decides how the case unfolds.

## The voice

Find the approved voice before drafting, passing the folder the document
belongs to (the repo or the working folder, never `<terse-root>`):

    node "<terse-root>/scripts/claudisms.mjs" --voice <folder>

It prints the voice file's path, or nothing when no voice applies. Read that
file and no other. The rule it applies: the project's `.terse/voice.md` when
approved, otherwise `~/.terse/voice.md` when approved, unless the project's
`.terse/config.json` sets `"personal": false`. Without Node, apply that rule
yourself. A length the voice sets for this genre replaces the skill's
budget. Phrases listed under its Exceptions belong to the author and stay.

## Shape

- Name the reader and what they must decide or do. If no reader has to
  decide or do anything, there is no document to write.
- One purpose per document: one decision, one problem, one design, one ask.
  Two purposes make two linked documents.
- Size the document to the cost of being wrong and the number of people who
  must agree, not to how much you know. Every budget is a ceiling, not a
  target: a draft near its ceiling usually has something to cut.
- Format enough to navigate and no more. Headings go on sections, never on
  single paragraphs. Lists hold parallel items. Reasoning stays in prose,
  where "because" and "so" survive.
- Link the source instead of pasting it. Don't restate: leave out closing
  summaries, sections that repeat the title, and paragraphs that retell a
  link or a diagram.
- Name the thing: "the retry policy", not "this approach" or "the solution".
- No emoji headers, no closing "Summary", "Conclusion", or "Key takeaways"
  heading, and no runs of bullets that each open on a bold label, unless
  the voice keeps that habit for proposals.
- Make responding easy: say what you need, from whom, and by when.
- A claimed benefit stops where the evidence stops. When the input names a
  limit (a case the change doesn't cover, a cost it keeps), state the limit
  with the benefit.
- Count the prose words before you finish (`wc -w` on the file, leaving out
  code), and cut to the budget: background first, then anything a link or
  the diff already shows.

## Unknowns

Never invent metrics, baselines, decision drivers, alternatives, owners,
dates, deadlines, ticket numbers, quotes, or test results. Each comes from
the user, the repo, or a source you read. Mark a gap only when the reader
needs that fact to decide or act. A fact nobody raised gets neither a number
nor a placeholder. In a long document, write `[TBD: what is missing]` where
the fact belongs and list it under Open questions. The document stays Draft
or Proposed while any remain. In a short one, ask the user before drafting.

When nobody can answer (a headless or one-shot run), don't stop, and
continue past any step that waits for the user's sign-off. A long document
uses `[TBD: …]` as above. A short one leaves the fact out or says plainly
that it isn't known yet, with no bracketed placeholder in the message. Name
the gaps in your reply.

## Side effects

Writing is not sending. Never run `gh pr create`, `gh pr edit`,
`gh pr review`, or `gh pr comment`, never send or schedule email, and never
post to Slack unless the user asked for that action in this request. Hand
back short documents as text in a fenced block that pastes cleanly. Write
long documents as Markdown files at the repo's conventional path, or where
the user says. When the user names a file, write the document there as it
would be sent, with no fence around it.

## The claudism scan

Draft first, without reading the list. Then scan the draft:

    node "<terse-root>/scripts/claudisms.mjs" <file>

For text bound for chat, pipe it in with `-` in place of the file, from the
document's folder. Rewrite
each whole sentence that matched: state the claim plainly, or cut the
sentence. Never swap in a synonym. Scan once more, then stop, keeping a
remaining hit only when a rewrite would lose meaning. Never mention the scan
in the document or the reply. Without Node, read
`<terse-root>/references/claudisms.md` and check the draft against it.
