---
type: regex
target: { source: file, path: draft.md }
pattern: "\\b(robust|seamless|transformative|multifaceted|cutting-edge|pivotal|synergy|ecosystem|landscape|realm|tapestry|testament|journey|crucial|delves?|leverages?|fosters?|showcas(?:e|es|ing)|streamlines?|elevates?|unlocks?|underscores?)\\b"
flags: i
match: not_contains
---
The edited draft must contain none of the banned vocabulary.
