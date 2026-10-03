---
type: regex
target: { source: file, path: draft.md }
pattern: "here['’]s the thing|worth noting|importantly|at its core|load[- ]bearing|doing real work|in conclusion"
flags: i
match: not_contains
---
The edited draft must contain no signpost or tell phrases.
