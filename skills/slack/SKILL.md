---
name: slack
description: "Write or tighten a Slack, Teams, or chat message: channel posts, thread replies, DMs, questions, status updates, and announcements. Use when the user asks to post or announce in a #channel, message, DM, or ping someone, reply in a thread, tell the team something on Slack, or check a chat message before posting. Slack-formatted text to paste. Never posts."
---

# Slack

People read a chat message in a notification preview, between other work,
so the first line has to carry it. People's Slack messages average 6 to 23
words, depending on the channel; a model's run to memo length.

`<terse-root>` is the directory two levels above this file. Before drafting,
read `<terse-root>/references/principles.md` and the approved voice it
names. This skill sets structure and length; the voice sets tone and wording.

## Inputs

- Where it goes: a DM, a channel post, a thread reply, or an announcement,
  and which channel.
- The ask or the news, the time, who it affects, and who must act.
- The source of truth to link: the issue, PR, doc, or incident page.
- For a reply, the message or thread being answered.

Ask the user for a missing ask, time, or owner. Never invent times, owners,
ticket numbers, status, or the next update time. Add @here or @channel only
when the user says it is urgent.

## Types and budgets

| Type | Budget |
|---|---|
| DM or thread reply | 50 words at most; most need under 25 |
| Channel question | 75 words at most, plus a code block |
| Status or incident update, or a reply that changes a date or a plan | 75 words at most |
| Announcement | 100 words at most, plus a link |
| Anything longer | a one- or two-sentence summary and a link, or the detail in the thread |

Wang et al. (measured, 100 hand-coded channels at one company) found mean
message lengths of 5.8 to 23.0 words by channel type. Announcement channels
averaged 20.7 words, but that figure comes from two channels. Slack
publishes no length data. The budgets are conventions.

## Structure

```text
<The ask or the news, with the time and who it affects.>
<Why, in one sentence, only if the reader needs it to act.>
<What readers do and by when. @mention only the people who must act.>
<Link>
```

- DM: the greeting and the question in one message ("Hi Sam, which branch
  is the release cut from?"), never "hi" alone.
- Channel question: ask the actual question, not "anyone know Kafka?". Then
  what you tried, the error in a code block, and a link.
- Thread reply: the answer first. A yes-or-no question gets "yes" or "no"
  in so many words, then what replaces the plan ("No, not Friday. We can
  ship Tuesday, June 8."). Don't @mention people already in the thread. Use
  "Also send to channel" only for a decision the channel needs.
- More than two sentences go in short paragraphs: the answer, the reason,
  the ask.
- Dates carry the day and the date ("Monday, June 7"). Keep each fact the
  reader would otherwise reply to ask about, such as whether a dependency
  moves too; cut words, not those facts.
- Announcement: what changed and when, what readers do, then the link. The
  issue or doc is the record, and the message points to it.
- Status or incident: the status, the impact, the next step, and the time of
  the next update.
- One message, not several, because each message notifies.
- Approvals and decisions belong in the issue or PR, and Slack links to them.

## Formatting

- No headings: Slack has none, and `#` shows as written.
- No bold in a reply or a DM. In an announcement, bold one fact at most,
  such as the time or the deadline, with single asterisks.
- A list only for three or more parallel items, such as steps. No bullets
  that open on a bold label ("*Impact:* …", "*Next steps:* …").
- Code in backticks or a fenced block, and links as bare URLs.
- Emoji only where the channel's convention or the voice uses them.
- No greeting on a channel post, and no sign-off anywhere.

## Draft

1. Write the first line: the ask or the news, with its time. If you can't,
   ask the user.
2. Add the why, the action, and the link, each only if a reader would
   otherwise reply to ask for it.
3. Check the budget. Over it, move the detail to the thread or a link.
4. Run the claudism scan from the principles.
5. Present it as the Output section says.

## Review an existing message

- The first line isn't the ask or the news, or the opener is a greeting
  alone.
- Split across several messages, or "anyone around?".
- Headings, section labels, bold-label bullets, or a wall of bullets.
- Over budget, or a pasted document instead of a link.
- @here or @channel without urgency, or @mentions of people with nothing to
  do.
- A time with no time zone, or an action with no owner.
- An approval or decision that belongs in the tracker.
Then run the claudism scan.

## Failure modes

| Agent habit | Countermeasure |
|---|---|
| Memo structure: headers, "Summary:", "Next steps:" | plain sentences, news first |
| A wall of bold-label bullets | one bold fact, and prose |
| A greeting and preamble before the point | the first line is the point |
| Several messages in a row | one message, with detail in the thread |
| Re-explains context the link holds | link the source |
| An emoji on every line | none, unless the channel does it |
| "Thanks! Let me know if you have questions" | end on the action |
| "Soon", or times with no zone | the absolute time and zone the user gave |

## Output and side effects

Never post, DM, schedule, react, or edit through a Slack tool, connector,
webhook, or CLI unless the user asked for that action, and never DM people
on the user's behalf. When the user names a file, write the message there
as it would be posted, with no fence. Otherwise give the message in a
fenced `text` block in Slack syntax: `*bold*`, `_italic_`, backticks, `>` quotes, bare URLs, and
`@name` as plain text for the user to resolve. Keep it readable unformatted,
because text pasted in markup mode stays plain. Teams and Discord take the
same structure in their own syntax.
