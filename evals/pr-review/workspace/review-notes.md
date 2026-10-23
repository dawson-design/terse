my notes on 482, turn these into the actual review

- drafts_controller.rb:41 logs applicant.ssn. absolutely can't ship, SSN in
  plaintext logs that go to Splunk. drop it, renewal id is enough
- drafts_controller.rb:18 show doesn't scope to current_user. any signed-in
  user can read anyone's draft by guessing the renewal id. create does it right
  (current_user.renewals.find), show should do the same. blocker
- draft_serializer.rb:18 household_members -> income_sources is an N+1. fine
  for small households but some have 10+ members. includes(household_members:
  :income_sources). not blocking, but would like it fixed in this PR if easy
- no spec for an expired draft (older than 30 days -> 404). should have one,
  it's the only branch in show that isn't covered
- nit: draft_data is a weird name, the schema calls it answers. take or leave
- question: why 30 days? renewals are due within 60 days of the notice, so
  someone who starts early could lose their draft before the deadline. ask
  Sam, maybe there's a policy reason
- the RenewalSchema.valid_partial? check is nice, reuse of the form schema
