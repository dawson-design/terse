# Context for the email to Maria

- Maria Chen is the agency product owner for the address-change release.
- Release is scheduled for Friday, June 4, 2027.
- The ATO security scan on May 24 found two high-severity findings: an old TLS
  configuration on the public load balancer, and an unpatched PDF library in
  the document service. High findings block release under our ATO.
- Fixes are in progress. The ISSO needs a clean rescan before sign-off, and
  the earliest rescan slot is June 14. That puts release at Friday, June 18.
- We need Maria's approval to move the date by Thursday, May 27. The call
  center needs five business days' notice to update their scripts, and they
  have already been told June 4.
- We could ship June 4 with the document upload turned off, but that doesn't
  clear the TLS finding, so it isn't an option.
- Engineer notes from standup: "happy path works, it's only the scan."
