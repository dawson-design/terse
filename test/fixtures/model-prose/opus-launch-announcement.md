# Introducing Service Maps: See Your Whole System at a Glance

Today we're excited to launch Service Maps, a new view in the Beacon observability dashboard. It shows how your services connect, where requests flow, and where things are going wrong. Service Maps is available now for all customers on Team and Enterprise plans at no extra cost.

## Why we built it

When an incident starts, the first question is usually "what's actually broken?" Answering it means jumping between dashboards, traces, and logs while you piece together how dozens of services depend on each other. Many of you told us this was the slowest part of incident response, especially for on-call engineers covering services they didn't build.

Service Maps gives you that picture automatically, built from the trace data you already send us.

## What you can do with Service Maps

Service Maps draws a live, interactive graph of your architecture. Each node is a service, database, queue, or third-party API, and each edge represents traffic between them. From there, you can:

- **Spot problems right away.** We color nodes and edges by health, so a spike in errors or latency stands out as soon as you open the map.
- **Follow the blast radius.** Select any service to highlight everything upstream and downstream of it, so you can see who a failing dependency affects.
- **Drill into details.** Click an edge to see request rate, error rate, and p50, p95, and p99 latency for that connection, with one-click links to the related traces and logs.
- **Compare over time.** Use the time slider to replay how your system looked during an incident, or compare it with the same window last week.
- **Filter by what matters.** Narrow the map by environment, team, namespace, or custom tag, so each team can focus on the part of the system it owns.

## Built for real-world scale

During our beta, more than 180 customers tried Service Maps on systems ranging from a handful of services to over 2,000. The map stays fast and readable at that size by grouping related services, and you can expand a cluster when you need detail.

Beta customers saw real results. Kettleby Freight runs around 400 microservices, and its median time to find the root cause of an incident dropped from 23 minutes to 9. "Service Maps is now the first tab our on-call engineers open," said Dana Whitfield, platform engineering lead at Kettleby. "It's replaced a lot of tribal knowledge about how things fit together."

## Getting started

If you already send distributed traces to Beacon through OpenTelemetry or one of our agents, there's nothing to set up. Choose **Service Maps** in the left navigation, and your map will be waiting. Services that don't emit traces yet still appear as inferred nodes, based on calls from your instrumented services, so you see the full picture while you roll out instrumentation.

Service Maps respects your existing access controls, so team members only see the services they have permission to view.

## What's next

We're already working on the next round of improvements:

- Alert overlays that show active alerts directly on the map
- Deployment markers that help you connect changes to incidents
- An API for exporting your topology to other tools

We expect to ship these over the coming quarter.

We'd love to hear what you think. Use the feedback button on the Service Maps page, or reach out to your account team. To learn more, read the documentation or join our live walkthrough on October 15.

Happy debugging!
