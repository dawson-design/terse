---
type: regex
target: { source: file, path: explainer.md }
pattern: "—|\\b(robust|seamless|powerful|crucial|pivotal|delves?|leverages?|journey|landscape|realm)\\b|worth noting|here['’]s the thing|at its core|(?:it|this|that)['’]s not (?:just |only )?[^,;.]{1,40}[,;] (?:it|this|that)['’]s|not only [^.;]{1,60}but also"
flags: i
match: not_contains
---
The explainer contains no em dashes, inflated vocabulary, tell phrases, or
tell constructions.
