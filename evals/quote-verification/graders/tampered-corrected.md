---
type: regex
target: { source: file, path: article.md }
pattern: "catches the bug the first read"
flags: i
match: not_contains
---
The altered quote ("catches" for the source's "finds") must not survive:
either corrected to the source wording or removed.
