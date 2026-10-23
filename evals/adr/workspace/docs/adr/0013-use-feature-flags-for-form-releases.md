# 13. Use feature flags for form releases

Status: Accepted
Date: 2026-08-19
Deciders: Dana Reyes, Marcus Lee

## Context

Each new form version has shipped with a full deploy, so a defect found after
launch needed a rollback of everything in that deploy. Two rollbacks in July
took down unrelated fixes with them.

## Decision

We will release each new form version behind a feature flag in the existing
Flipper setup, turned on per form after a smoke test in production.

## Options considered

- Feature flags per form: lets us turn a form off without a deploy. Chosen.
- Separate deploys per form: isolates forms but doubles pipeline time.
- Keep shipping with the deploy: the status quo, and the cause of the July
  rollbacks.

## Consequences

A form can be turned off in minutes. Each flag is one more thing to clean
up: we remove a form's flag two weeks after it reaches 100%.
