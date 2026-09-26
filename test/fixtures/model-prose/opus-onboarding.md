# Welcome to the Mobile Team

Welcome aboard! This document covers what you need to get productive on the Fernway mobile app in your first couple of weeks. It won't answer every question, but it should point you in the right direction. If you spot something out of date, please fix it; this doc lives in the repo.

## What we build

The Fernway app lets customers book and manage home cleaning appointments. We ship to iOS and Android from a single React Native codebase, with a few native modules for payments and push notifications. The app has about 340,000 monthly active users, and roughly 60% of them are on iOS.

## Repo layout

Everything lives in the `fernway-mobile` repository. You'll spend most of your time in these folders:

- `app/`: the React Native application code, organised by feature (`booking/`, `account/`, `payments/`, and so on)
- `packages/`: shared libraries, including our design system (`@fernway/ui`) and the API client
- `ios/` and `android/`: native project files and custom native modules
- `e2e/`: Detox end-to-end tests
- `scripts/`: tooling for builds, releases, and generating API types

We try to keep features self-contained. If you find yourself importing deep into another feature's internals, the code probably belongs in `packages/`.

## Local setup

You'll need a Mac for iOS development. Setup takes about half a day, most of it spent waiting for Xcode to download.

1. Install Xcode 16 and the latest stable Android Studio.
2. Install Node 20 (the version in `.nvmrc`), then run `pnpm install` from the repo root.
3. Run `pnpm pods` to install iOS dependencies.
4. Copy `.env.example` to `.env.local` and ask your onboarding buddy for the staging API keys. Never commit this file.
5. Start the Metro bundler with `pnpm start`, then run `pnpm ios` or `pnpm android` in another terminal.

The app points at staging by default. You can log in with any test account in the team 1Password vault under "Mobile QA Accounts." If the iOS build fails with a signing error, you probably haven't been added to the Apple Developer team yet; ask in #mobile-help.

## How we work

We use trunk-based development. Create a short-lived branch, open a pull request against `main`, and get one approval before merging. CI runs lint, type checks, unit tests, and a subset of Detox tests on every PR in about 12 minutes. Please keep PRs under 400 lines so they stay reviewable.

We manage feature flags in LaunchDarkly. New features should ship behind a flag so we can merge code without exposing unfinished work.

## Release process

We release every other Tuesday. The release captain role rotates through the team, and the current captain is listed in the #mobile-releases channel topic.

- **Thursday before release:** we cut the release branch from `main`, and QA starts regression testing.
- **Monday:** only critical fixes get cherry-picked onto the release branch.
- **Tuesday:** we submit builds to the App Store and Google Play, starting with a 10% staged rollout.
- **Following week:** we ramp to 100% if crash-free sessions stay above 99.5%.

Urgent JavaScript-only fixes can go out through CodePush without store review, but check with the release captain first.

## Who to ask

- **Priya Raman** (engineering manager): priorities, career conversations, and how the team works
- **Marcus Ohene** (staff engineer): architecture and native modules
- **Jess Liu** (QA lead): test plans, device lab access, and release sign-off
- **#mobile-help** on Slack: quick questions of any kind

You'll also have an onboarding buddy for your first month. No question is too small; we'd much rather you ask than stay stuck.
