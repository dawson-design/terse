# #address-change, thread

Maria Chen (product owner), Tuesday June 1, 10:12:
> Can we still ship address change on Friday?

# What I know (not in the thread)

- QA found a bug yesterday: addresses with a ZIP+4 code are rejected by the
  validation step. About 30% of addresses on file have a ZIP+4.
- The fix is in review (PR #219). It should merge Monday, June 7.
- The pen test window on Thursday June 3 is booked and doesn't move, and it
  can run against the fixed build on Monday instead.
- With the fix merged Monday, we can ship Tuesday, June 8.
- Maria will need to tell the call center about the new date.
