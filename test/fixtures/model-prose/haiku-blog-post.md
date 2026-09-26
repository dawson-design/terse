# How We Cut Our CI Build Time from 25 Minutes to 8 Minutes

At Manifest, developer productivity is core to our culture. In June, we noticed our CI pipeline was creeping toward 25 minutes per build—a noticeable drag on the feedback loop. A typical developer runs 10-15 builds a day, so shaving minutes off each one compounds quickly. Over the span of three weeks, our platform team reduced build time by 68%, down to 8 minutes. Here's what we did.

## The Problem

Our CI pipeline at the time was straightforward but unoptimized. Every commit triggered:

1. Full dependency install (npm install) — 4 minutes
2. TypeScript compilation — 6 minutes
3. Unit test suite — 7 minutes
4. Integration tests — 5 minutes
5. Linting and static analysis — 2 minutes

There was no parallelization, no caching, and no optimization of what actually needed to run. Developers complained in Slack. We listened.

## Investigation Phase

We started by measuring. We profiled a few builds, checked logs, and discovered:

- The dependency install was re-downloading the same packages every time despite using `npm ci`. We weren't persisting the npm cache across builds.
- TypeScript was recompiling everything, even files that hadn't changed.
- All tests ran serially, but our test runner supported parallelization out of the box.
- Integration tests spun up a fresh database every time, taking ~2 minutes just for setup.

## Our Three Wins

### 1. Persist Dependencies and Enable Caching (saves 4 minutes)

GitHub Actions offers built-in caching. We added:

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: node-${{ hashFiles('package-lock.json') }}
```

This brought npm install from 4 minutes down to 30 seconds on cache hits. We also started using `npm ci --prefer-offline` to further reduce network calls. This single change—which took 10 minutes to implement—cut 3–4 minutes per build.

### 2. Parallelize Tests (saves 5 minutes)

Our test suite has a test file per feature, and they don't interfere with each other. We split them across 4 parallel runners using a GitHub Actions matrix:

```yaml
strategy:
  matrix:
    test-group: [unit-a, unit-b, integration-a, integration-b]
```

Each group ran in ~3 minutes. This cut our test time from 12 minutes (7 unit + 5 integration) to 3 minutes on the slowest group. Real win.

### 3. Optimize TypeScript Incremental Compilation (saves 2 minutes)

By default, TypeScript recompiles everything. We enabled incremental mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

We also cached the build info file:

```yaml
- uses: actions/cache@v3
  with:
    path: .tsbuildinfo
    key: tsbuild-${{ github.sha }}
    restore-keys: tsbuild-
```

This dropped TypeScript compilation from 6 minutes to 3-4 minutes. On subsequent runs with minimal changes, it went to under 1 minute.

## Secondary Optimizations

Once we'd tackled the big three, we squeezed out a few more seconds:

- **Linting on modified files only**: We use `eslint-diff` to check only changed files during CI, skipping the full codebase. This cut linting time in half.
- **Skip tests for documentation-only changes**: If a commit only touches `*.md` files, we skip the test suite entirely using GitHub's conditional workflow logic.
- **Upgrade Node.js**: Moving from Node 18 to Node 20 gave us better npm and V8 performance, buying us ~15 seconds.

## Results and Lessons

| Stage | Before | After | Savings |
|---|---|---|---|
| Dependencies | 4:00 | 0:30 | 87% |
| TypeScript | 6:00 | 3:30 | 42% |
| Tests | 12:00 | 3:00 | 75% |
| Linting | 2:00 | 1:00 | 50% |
| Other | 1:00 | 0:20 | 67% |
| **Total** | **25:00** | **8:20** | **67%** |

The biggest lesson: measure first. We didn't guess where time was spent. We profiled, prioritized the long poles (dependencies and tests), and tackled them systematically. Caching and parallelization were low-hanging fruit that yielded outsized returns.

For developers, 8 minutes still feels long. We're eyeing a few more wins: containerizing the test database to skip setup, and exploring esbuild for faster TypeScript transpilation. If you're running a similar pipeline, start with dependency caching and parallel tests. That combination alone typically saves 30–40% of build time.
