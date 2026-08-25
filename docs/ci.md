# Continuous integration

`.github/workflows/ci.yml` plus the composite action in `.github/actions/start-app`.

---

## The problem this pipeline solves

The application under test lives in a **different repository**. Every job therefore has to check it out, install it, seed it, start it and wait for it before it can run a single test. Doing that inline in four jobs would be four copies of the same forty lines, drifting apart within a month.

So it is a composite action, used identically by each suite job:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/start-app     # ← the whole app, ready on :3000 and :3001
  - …run one suite…
```

---

## Job layout

| Job | Runs | Why separate |
|---|---|---|
| `static-checks` | `tsc --noEmit` on both TypeScript suites | Fails in seconds; no browser or app needed |
| `cypress` | Full Cypress suite, headless | |
| `playwright` | Matrix: chromium, firefox, webkit | `fail-fast: false` — a WebKit-only bug should not hide a Chromium pass |
| `selenium` | Full Selenium suite, headless Chrome, JDK 25 | |

They run in parallel. A red build names the framework that broke rather than making you read a log to find out.

---

## Starting the application

The composite action does five things, and each one has a reason:

**1. Check out `cypress-io/cypress-realworld-app@develop`.** `develop` is the repository's default branch — not `main`. The ref is an input, so pinning to a tag when upstream churn becomes annoying is a one-line change.

**2. `yarn install --frozen-lockfile`.** The app pins Yarn classic and runs a `postinstall` that applies patches via `patch-package`. npm does not reproduce that.

**3. `yarn db:seed:dev`.** Copies the fixed `data/database-seed.json` over `data/database.json`.

> This is the most load-bearing line in the pipeline. `yarn db:seed` — no `:dev` — regenerates the dataset with **random** users, which invalidates every test that names an account. The action carries a comment saying exactly that, because the two commands are one character apart.

**4. Start it in the background**, redirecting output to `app.log` in the workspace so it can be dumped if the boot fails.

**5. Poll until both ports answer**, up to 90 seconds:

```bash
for i in $(seq 1 90); do
  if curl -sf http://localhost:3000 > /dev/null \
  && curl -sf http://localhost:3001/testData/users > /dev/null; then
    echo "Application is up after ${i}s."; exit 0
  fi
  sleep 1
done
tail -n 100 "$GITHUB_WORKSPACE/app.log"; exit 1
```

Polling rather than a fixed `sleep 60`: Vite's first compile takes anywhere from fifteen to sixty seconds depending on the runner, so a fixed sleep is either wasteful on a fast run or flaky on a slow one — the same reasoning that keeps sleeps out of the tests themselves.

Checking **both** ports matters. The React dev server answers on `:3000` well before the API is ready on `:3001`, and a suite that starts in that window fails on the first login with an error that looks nothing like a startup problem. Hitting `/testData/users` also confirms the seed actually loaded.

On failure the last hundred log lines are printed with `::error::`, so a boot failure is diagnosable from the summary without downloading anything.

---

## Artifacts

Each job uploads its own diagnostics on failure only, with a seven-day retention:

| Job | Artifact | Contains |
|---|---|---|
| `cypress` | `cypress-artifacts` | Screenshots and video of failing specs |
| `playwright` | `playwright-report-<browser>` | HTML report **including traces** |
| `selenium` | `selenium-artifacts` | Failure screenshots, Surefire XML |

The Playwright trace is the one that changes how you work. `trace: "on-first-retry"` records a full DOM, network and console timeline of the failing attempt; downloading the artifact and running `npx playwright show-trace` replays it step by step. A CI-only failure goes from "cannot reproduce" to a five-minute diagnosis.

Recording only on the first retry keeps the cost off the happy path: a passing run produces no trace at all.

---

## Retries

Both retrying frameworks are configured `retries: 2` in CI and `0` locally.

Locally, a flake should be loud enough that you fix it. In CI, a retry stops an unrelated pull request from being blocked by a runner hiccup. Crucially, retries are *reported* in both tools' output, so a test that only ever passes on attempt three stays visible instead of being laundered into a green check.

Selenium has no framework-level retry here on purpose: adding one would hide the exact class of timing bug that an explicit-wait suite is most prone to, which is precisely what you want to see while the suite is young.

---

## Running the same thing locally

```bash
# terminal 1 — the app
cd ~/cypress-realworld-app && yarn db:seed:dev && yarn dev

# terminal 2 — any suite
cd cypress-e2e     && npm test
cd playwright-e2e  && npm test
cd selenium-e2e    && mvn test
```

Playwright can also start the app itself:

```bash
RWA_PATH=~/cypress-realworld-app npx playwright test
```

which activates the `webServer` block in `playwright.config.ts` and reuses an already-running instance if it finds one.

---

## Pointing at another environment

Every suite reads the same two overrides:

```bash
CYPRESS_BASE_URL=https://rwa.staging.example npm test                    # Cypress
BASE_URL=https://rwa.staging.example npx playwright test                 # Playwright
mvn test -Dbase.url=https://rwa.staging.example -Dapi.url=…              # Selenium
```

No code changes, in any of the three. That property is worth protecting — the moment an environment URL is hard-coded in a page object, running the suite anywhere new becomes a pull request.
