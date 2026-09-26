# envsync

envsync is a small command-line tool that keeps a local `.env` file in sync with a secret stored in a cloud secrets manager. It was built out of frustration with teams pasting API keys into Slack and losing track of which `.env` file was actually current. envsync treats the secrets manager as the source of truth by default, but it can push local changes up just as easily, so it works whether your team edits secrets centrally or locally.

## Features

- Two-way sync between `.env` and AWS Secrets Manager, Google Secret Manager, or HashiCorp Vault
- Dry-run mode that shows a diff before touching anything
- Per-key conflict resolution: local wins, remote wins, or an interactive prompt
- Optional encryption at rest for cached secrets on disk
- Multiple environments (`dev`, `staging`, `production`) via named profiles

## Installation

Install via npm:

```
npm install -g envsync-cli
```

Prebuilt binaries for macOS, Linux, and Windows are also available from the project's Releases page, for teams that would rather not add another global npm package.

## Quick start

First, authenticate with your cloud provider using its normal credential flow — envsync does not manage its own credentials, it reuses whatever AWS, GCP, or Vault session you already have configured. Then initialize a profile:

```
envsync init --provider aws --secret-name myapp/production
```

Pull the current secret down into a local `.env`:

```
envsync pull
```

Make changes locally, review them, and push:

```
envsync push --dry-run
envsync push
```

## Configuration

envsync reads a `.envsync.yml` file in the project root. A minimal config looks like:

```
provider: aws
secretName: myapp/production
region: us-east-1
```

Define multiple profiles under a `profiles:` key and select one at runtime with `--profile staging`. Each profile can point at a different provider, secret name, and region, which is handy for teams that split staging and production across different cloud accounts.

## Conflict handling

When both the local file and the remote secret have changed since the last sync, envsync will not silently overwrite either side. It shows a per-key diff and asks which value to keep, unless you pass `--strategy local` or `--strategy remote` to resolve automatically without a prompt. This generated more GitHub issues than anything else before we made prompting the default — we'd rather ask twice than quietly lose someone's key once.

## Security notes

envsync never writes secret values to shell history, stdout logs, or crash reports. Local caches live under `~/.envsync/cache` and can be encrypted with a passphrase using `--encrypt`. We strongly recommend keeping `.env` in `.gitignore`; envsync will warn on `push` if it detects the file is already tracked by git, since that's usually a mistake rather than an intentional choice.

## Contributing

Issues and pull requests are welcome. Please run `npm test` and `npm run lint` before opening a PR, and keep changes to the provider adapters isolated from changes to the core sync logic where possible — it makes review much faster. See `CONTRIBUTING.md` for details on cutting releases and updating the changelog.

## License

MIT
