# Claudisms

These phrases make a draft read as model-written while saying less than they
seem to. Read this list only after the draft is finished. Run
`scripts/claudisms.mjs` on the draft, or check it against the list by hand,
and rewrite each sentence that contains a match: state the claim plainly, or
cut the sentence if it only announced that something matters. Don't swap in a
synonym. Code, quotations, and blockquotes are exempt. An entry the voice
template allows is not a finding: its Exceptions section names the phrase, or
one of its "Theirs:" samples uses it.

Notation: words match whole and ignore case. A space also matches a line break
or a hyphen; a hyphen also matches a space or nothing; an apostrophe matches '
or ’. {a|b} matches one alternative, and an empty alternative makes the group
optional. word~ matches the word's inflections. * matches one to six words in
one clause. A leading ^ matches only at the start of a sentence, line, or list
item.

## Anthropomorphized code-speak

- `load-bearing`: name what depends on it
- `{do|does|did|doing} real work`: say what it does
- `earn~ {its|their} {place|keep|trust}`: state the benefit and what it costs
- `quietly {drop~|swallow~|ignore~|discard~|skip~|overwrite~|fail~|eat~}`: say what is lost, and when
- `silently swallow~`: name the error and where it goes
- `the {culprit|offending}`: name the cause, line, or commit
- `battle-tested`: say where it has run, and for how long
- `heavy lifting`: say which part does which work
- `carry~ the {weight|load|argument}`: say what supports what
- `{logic|config|state|truth|complexity|knowledge} {lives|live} in`: say where it is defined or stored
- `what makes {it|this|that} tick`: say how it works

## Self-important spotlighting

- `here's the thing`: cut; start with the thing
- `worth {noting|flagging|calling out|mentioning|highlighting|checking|stating plainly}`: cut the frame; state the fact
- `{please note|it should be noted|keep in mind|bear in mind}`: state the fact, or what to do differently
- `^note that`: cut "note that"
- `{at its core|in essence}`: state the claim
- `key {insight|insights|takeaway|takeaways}`: state the insight
- `the {crux|punchline|kicker|tell is|tell here}`: name the thing
- `the real {question|issue|story}`: ask or state it directly
- `{why this|why it|and that} matters`: state the consequence
- `{actually|really} matter~`: say who it matters to, and why
- `{bottom line:|the bottom line is}`: lead with the conclusion instead
- `{make no mistake|let that sink in}`: cut
- `this is where * comes in`: say what it does
- `{let's dive|let's dig|dive deeper|deep dive}`: cut; start with the content
- `walk~ you through`: give the steps
- `in this {document|doc|post|article|section|guide}, {we|I|you}`: cut; start with the content
- `this {section|document|doc|guide} {covers|describes|explains|outlines}`: cut; the heading says it
- `as {we'll see|we will see|noted above|mentioned above|discussed above}`: say it here, or link to it

## Performative candor

- `{let me be|I'll be} {blunt|direct|honest|clear|frank}`: cut; say it
- `^{honestly|frankly},`: cut
- `{the|my} honest {answer|take|read|version|truth|assessment}`: give the answer
- `{the short answer|straight answer}`: give the answer
- `{let me put it|to put it|stated|said} plainly`: cut; say it plainly
- `{real talk|no fluff|uncomfortable truth|sit with that}`: cut
- `full stop`: cut; the period ends it
- `^period.`: cut
- `hand-wav{e|es|ed|ing|y}`: say what is missing

## Unsolicited validation

- `{great|good|excellent|nice} {question|catch|instinct}`: cut; answer the substance
- `{exactly right|fair point|that's fair}`: say what you agree with and what follows
- `{valid concern|legitimate concern|perfectly reasonable|totally reasonable}`: address the concern
- `your {instinct|instincts|intuition} {is|are|was|were} {right|correct|good|sound}`: say what is right about it
- `you're {absolutely right|completely right|totally right|right to}`: state the correction or the fact
- `spot on{,|.|!}`: cut, or say what is correct
- `{that's|this is|it's} not nothing`: give the size
- `{that's|this is} real{.|!}`: give the evidence

## Adverb inflation

- `importantly`: cut; show the consequence
- `crucially`: cut; show the consequence
- `^{notably|fundamentally|critically},`: cut the opener
- `genuinely {useful|helpful|hard|difficult|interesting|new|different|important}`: cut "genuinely"; give the evidence
- `{truly|incredibly} {unique|remarkable|powerful|useful|valuable|important|simple}`: cut the adverb; give the evidence
- `{absolutely|critically|vitally} {critical|crucial|essential|important|vital}`: pick one word, or say what breaks without it

## The em-dash reframe

- `{it's|it is|this is|that's} not *, {it's|it is|this is|that's} {a|an|the|about}`: state what it is; drop the denial
- `{isn't|is not|aren't|wasn't} *, {it's|it is|they're|it was} {a|an|the|about}`: state what it is
- `{isn't|is not|wasn't} *. {it's|it is|it was} {a|an|the|about}`: state what it is
- `^not {a|an|the|just} *. {a|an|the}`: state what it is
- `not just`: make the full claim once
- `not only * but also`: list both; "and" will do
- `less about * {and |}more about`: say what it is about
- `— not`: state the positive claim
- `{and that's|and that is|which is} the point`: state the point
- `feature, not a bug`: say why the behavior is intended

## Hedging connective tissue

- `^that said`: use "but", or cut
- `{having said that|that being said}`: use "but"
- `to be fair`: state the counterpoint plainly
- `non-trivial`: say how big: days, files, or risk
- `if anything{,|.}`: cut; state the claim
- `{and it doesn't need to|and it does not need to|nor should it|and rightly so|and that's fine}`: give the reason, or cut
- `{in summary|in conclusion|to sum up|to summarize|all in all}`: cut the recap; end on the ask
- `{it's|it is} important to {note|remember|understand}`: cut; state the fact
- `{with that in mind|the reality is|at the end of the day}`: cut, or use "so"

## Metaphor soup

- `happy path`: name the case: valid input, the success case
- `blast radius`: say who or what is affected
- `sanity check~`: say what you check
- `guardrails {around|for|on|against}`: name the check, limit, or permission
- `{add|adding|added|put|set up|build|need|without|no} guardrails`: name the check, limit, or permission
- `under the hood`: say "inside", or name the component
- `{escape hatch|smoking gun|chicken and egg|belt and suspenders}`: name the override, the evidence, the dependency, or the second check
- `{spaghetti code|just plumbing}`: name the coupling or the integration work
- `{low-hanging fruit|secret sauce|table stakes|north star}`: name the fix, the advantage, the requirement, or the goal
- `{move~ the needle|boil~ the ocean|double-click on}`: give the metric, the scope, or the detail
- `{footgun~|linchpin~|workhorse~|gotchas}`: name the risk or the role
- `{one|a|another|the} gotcha`: name the pitfall
- `{testament to|rich tapestry|tapestry of|realm~ of|landscape of}`: say it directly
- `{competitive|digital|tech|security|regulatory|threat|vendor|evolving|changing|current} landscape`: name the market, rules, or threats
- `{customer|user|developer|learning} journey~`: name the steps
- `{developer|partner|product|data|tech|digital|platform|api} ecosystem~`: name the tools or partners
- `{orthogonal concern|orthogonal concerns|orthogonal question|orthogonal issue|is orthogonal|are orthogonal}`: say "separate" or "unrelated"

## Sign-off tics

- `{say the word|just let me know}`: cut
- `{let me know if you'd like|let me know if you want|would you like me to|do you want me to}`: cut; state the next step
- `want me to *?`: cut; state the next step
- `^shall I`: cut; state the next step
- `{happy to help|hope this helps|hope that helps}`: cut
- `{feel free to|don't hesitate to}`: say what to do
- `^verdict:`: state the decision as a sentence
- `tl{;|}dr`: put the summary first, without the label

## Puffery

- `delve~`: name the specific action
- `synerg{y|ies}`: name the shared benefit
- `{cutting-edge|state-of-the-art|best-in-class|world-class|next-level|paradigm shift|ever-evolving|blazing fast}`: give the measurement
- `game-chang{er|ers|ing}`: say what changes, and by how much
- `{transformative|multifaceted} {impact|change|approach|potential|problem|challenge}`: describe the change or the parts
- `navigate~ the {complexity|complexities}`: name the hard parts
- `in today's {fast-paced|ever-changing|rapidly evolving} {world|landscape|environment}`: cut
- `{say goodbye to|look no further|the possibilities are endless|this is just the beginning|can't wait to see}`: cut
- `{thrilled|excited|proud} to {announce|share|introduce}`: state the news
- `{harness~|unleash~} the {power|potential|full}`: say what it does
- `unlock~ {the |new |}{value|potential|possibilities|insights|growth|productivity}`: say what becomes possible, and for whom
- `empower~ {you|your|teams|users|developers|people|everyone}`: say what they can now do
- `{supercharge~|revolutionize~}`: give the measurement
- `foster~ {a culture|a sense|collaboration|innovation|trust|alignment}`: name the practice
- `underscore~ {the|its|their|how|why|that}`: state the evidence or consequence
- `seamless{ly|} integrat{e|es|ed|ing|ion}`: say what connects to what
- `robust and scalable`: give the load and failure numbers
- `no *, no *, {and |}no`: state the benefit once
