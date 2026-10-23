---
name: email
description: "Write, reply to, or tighten an email. Use when the user asks to draft or write an email, reply or respond to an email or thread, follow up with someone, or email a request, update, introduction, or escalation, or asks to check an email draft before sending. One ask per email, with the ask first, as plain text to paste. Never sends."
---

# Email

A busy reader decides from the subject and the first sentence whether to
act now, later, or never, so the ask goes there. In a randomized test, a
49-word request drew nearly twice the responses of a 127-word one.

`<terse-root>` is the directory two levels above this file. Before drafting,
read `<terse-root>/references/principles.md` and the approved voice it
names. This skill sets structure and length; the voice sets tone and wording.

## Inputs

From the request or the thread:
- the reader, and whether they are inside or outside the organization;
- the one thing needed from them (a decision, an approval, information, an
  action), or the one thing they need to know;
- the deadline, and what it depends on;
- what they need in hand to act: the options, a link, a figure;
- for a reply, the message being answered.

Ask the user for a missing ask or deadline. Never invent dates, amounts,
names, commitments, reasons, or attachments. With two asks, ask whether to
split them.

## Types and budgets

| Type | Sentence 1 | Budget |
|---|---|---|
| Request | the ask and the deadline | 125 words at most |
| Reply | the answer | five sentences at most |
| Update or FYI | the news, and "no action needed" when true | 200 words at most; headings only for three or more separate topics |
| Introduction | who, and why they should talk | 100 words at most |
| Bad news or escalation | what happened and the impact | 150 words at most, then what you're doing and what you need |
| Follow-up | the original ask and the new deadline | 60 words at most |

The evidence:
- Boomerang (measured, correlational, more than 40 million emails): replies
  peaked at 50 to 125 words, three- and four-word subjects drew the most
  replies, and asking one to three questions beat asking none by 50%.
- Rogers and Lasky-Fink (measured, randomized): among 7,002 school board
  members, a 49-word email drew nearly twice the responses of a 127-word
  one, and headings doubled clicks on the lower half of a nine-paragraph
  message.
- Five sentences per reply is a convention (five.sentenc.es).

The budgets count the body, not the subject line, and are conventions
resting on that evidence.

## Structure

```text
Subject: <the ask or the news in 3 to 8 words, with the date if any>

<Name>,

<The ask or the news, with the deadline.>
<Why, or what it depends on: one or two sentences.>
<What they need to act: the options, a link, the fact they'd look up.>

<Name>
```

- The subject states the ask, not the topic: "Approve load-test budget by
  Thu?", not "Load testing". If the organization uses subject keywords
  (ACTION, INFO, DECISION, REQUEST), prefix one.
- One ask per email; each added ask lowers the odds that any gets done. When
  two must travel together, number them and say which matters more.
- Make responding easy: a yes-or-no question, the exact options, or a
  default ("If I don't hear by Friday, I'll book it").
- Background follows the ask, and only what the decision needs. Longer
  background goes in a link or an attachment.
- The greeting is the name line or nothing, with no pleasantry sentence. The
  sign-off is the name, or "Thanks," and the name; the voice decides.

## Draft

1. Write the subject and sentence 1 first. If you can't, the ask is
   unknown: ask the user.
2. Add the why and what the reader needs, one sentence for each question
   the reader would ask.
3. Check the budget for the type, cutting background first.
4. Run the claudism scan from the principles.
5. Present it as the Output section says.

## Review an existing draft

- The ask isn't in the first two sentences, or the subject names only a
  topic.
- More than one ask, or none in a request.
- A missing deadline, or a deadline with no reason.
- Opens on pleasantries, context, or "I'm writing to"; closes on
  boilerplate.
- Background before the ask, or over budget for its type.
- Headings or bold on a short email, or Markdown that will show as symbols.
- A reply that doesn't answer in its first sentence.
- Facts the user didn't supply.
Then run the claudism scan.

## Failure modes

| Agent habit | Countermeasure |
|---|---|
| "I hope this email finds you well", "I wanted to reach out" | sentence 1 is the ask |
| Background first and the ask in the last paragraph | move the ask up; cut the background to what the decision needs |
| Several asks in one email | split them, or number and rank them |
| Padding of thanks and praise | one clause of thanks if wanted; praise in its own note |
| "Please let me know if you have any questions" | end on the ask or the default |
| Markdown headings and bold | plain text, with a hyphen list at most |
| An invented deadline or reason | ask the user |
| The subject repeated as sentence 1 | sentence 1 adds the deadline or the detail |

## Output and side effects

Never send, schedule, or save a draft through a mail tool, connector, or
CLI unless the user asked for that action. When the user names a file,
write the email there as it would be sent, with no fence. Otherwise give
plain text in a fenced `text` block, with `Subject:` on line 1, a blank
line, then the body.
Use no Markdown, because mail clients show `**` and `#` as written. Give
URLs bare and lists as lines starting "- ". For a reply, give the body only,
unless the subject should change.
