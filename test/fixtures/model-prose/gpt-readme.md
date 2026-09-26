# logsift

`logsift` is a single-binary command-line filter for newline-delimited JSON
(NDJSON) logs. It reads records from standard input or one or more files,
applies level, timestamp, and field filters, and writes the matching records as
JSON, plain text, or a count.

It is designed to fit into shell pipelines without requiring a runtime or a log
shipping service.

## Installation

### Homebrew

```sh
brew install logsift
```

### Release binary

Download the binary for your operating system and architecture from the
project's releases page, make it executable, and place it on your `PATH`:

```sh
chmod +x logsift
sudo mv logsift /usr/local/bin/logsift
```

Confirm the installation:

```sh
logsift --help
```

## Usage

```text
logsift [OPTIONS] [FILE ...]

Options:
  --level LEVEL          Filter by log level
  --since TIME           Include records at or after TIME
  --until TIME           Include records at or before TIME
  --where KEY=VALUE      Match a field value; may be repeated
  --format FORMAT        Output format: json, text, or count
  --config PATH          Read configuration from PATH
```

With no files, `logsift` reads NDJSON from standard input. When file paths are
provided, it reads those files instead. Each input line must contain one JSON
log record.

### Filter a pipeline

Show error records from a running service:

```sh
my-service 2>&1 | logsift --level error
```

### Filter a file by time

Use `--since` and `--until` to constrain the time range:

```sh
logsift --since 2026-08-25T09:00:00Z \
  --until 2026-08-25T10:00:00Z app.ndjson
```

### Match fields

Use `--where` for a field matcher. Repeat the option to require additional
matches:

```sh
logsift \
  --where service=payments \
  --where environment=production \
  logs/*.ndjson
```

Quote matchers when either side contains characters interpreted by your shell:

```sh
logsift --where 'request.path=/v1/orders?status=open' access.ndjson
```

### Select an output format

JSON output is useful for further structured processing:

```sh
logsift --level warn --format json app.ndjson | jq '.message'
```

Plain-text output is convenient for terminals and line-oriented tools:

```sh
logsift --where component=worker --format text app.ndjson | less
```

Count matching records without printing them:

```sh
logsift --since 2026-08-25T00:00:00Z --format count app.ndjson
```

Filters can be combined with any output format:

```sh
gzip -cd app.ndjson.gz | logsift \
  --level error \
  --where service=api \
  --format count
```

## Configuration

By default, `logsift` reads `~/.logsift.toml`. The file can define default
filters and an output format. Configuration keys mirror the corresponding
long-form command-line flags:

```toml
level = "warn"
since = "2026-08-25T00:00:00Z"
until = "2026-08-25T23:59:59Z"
where = ["environment=production", "service=api"]
format = "text"
```

Use `--config` to load a different file:

```sh
logsift --config ./config/logsift.toml app.ndjson
```

Command-line options may be used to adjust the configured defaults for an
individual invocation.

## Exit codes

`logsift` uses its exit status to distinguish matches from empty results and
errors, which makes it suitable for scripts and CI jobs.

| Code | Meaning |
| ---: | --- |
| `0` | One or more matching records were found |
| `1` | No matching records were found |
| `2` | Invalid usage or an input read error |

For example:

```sh
if logsift --level error --format count app.ndjson; then
  echo "errors found"
else
  case $? in
    1) echo "no errors found" ;;
    2) echo "logsift could not read the input" >&2 ;;
  esac
fi
```

## License

`logsift` is licensed under the MIT License.
