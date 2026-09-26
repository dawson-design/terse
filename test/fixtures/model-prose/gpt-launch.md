# Introducing QueueLens 1.0

Dead-letter queues are useful—until diagnosing them turns into a scavenger hunt. Today we’re releasing QueueLens 1.0, a local command-line tool for inspecting RabbitMQ dead-letter queues without sending message data to a hosted service.

QueueLens groups failures by exception type so recurring problems stand out quickly. For each group, it shows the first and latest occurrence, helping you distinguish a one-off incident from an active regression. When you need deeper analysis, select messages and export them as newline-delimited JSON for use with familiar scripts and data tools.

QueueLens can also replay selected messages, but only when you explicitly provide the `--confirm` flag. That guardrail keeps investigation and recovery separate, making accidental replays less likely during routine debugging.

Connection settings live in `~/.queuelens.toml`, and everything runs on your machine. There is no account to create, agent to deploy, or hosted control plane to trust with payloads.

Install it today:

```sh
brew install queuelens
```

QueueLens 1.0 is MIT licensed. Try it on your messiest dead-letter queue, inspect the patterns, export what matters, and replay only when you’re ready.
