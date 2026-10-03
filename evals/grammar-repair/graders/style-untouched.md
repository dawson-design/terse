---
type: regex
target: { source: file, path: notes.md }
pattern: "decided to separate the config from the code|previous release|error rate"
flags: i
match: contains
---
The fix stays inside grammar scope: these grammatical phrasings from the
original must survive unrewritten, showing the pass did not restyle the
document.
