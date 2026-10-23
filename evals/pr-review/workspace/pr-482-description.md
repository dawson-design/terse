# Save renewal drafts so applicants can finish later (#482)

Author: Sam Okafor

Applicants lose their answers when the Medicaid renewal form times out.
This adds a draft: the form saves to POST /renewals/:id/draft every 30
seconds, and GET /renewals/:id/draft restores it. Drafts expire after 30
days.

Tested with request specs for save and restore.
