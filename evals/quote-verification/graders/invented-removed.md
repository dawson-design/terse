---
type: regex
target: { source: file, path: article.md }
pattern: "owes the author one question"
flags: i
match: not_contains
---
The invented quote appears nowhere in the source, so it must not survive as
a quotation.
