# RealWorld UI Automation

> The same end-to-end suite written three times — in **Cypress**, **Playwright** and **Selenium** — against the same application, with the same test cases, the same fixtures and the same assertions. Built so the three stacks can be compared on evidence instead of opinion.

Choosing a browser automation tool is usually argued from habit. This repository replaces the argument with a control group: one application under test, one set of scenarios, three implementations that differ only in the framework. Everything else — the seeded accounts, the selectors, the assertions, the CI shape — is held constant on purpose.

The application under test is [**cypress-realworld-app**](https://github.com/cypress-io/cypress-realworld-app), a payment app (a Venmo clone) built with React, Express and an XState-driven front end. It is a realistic target: modal onboarding wizards, debounced search, infinite-scroll feeds, optimistic updates and a Material UI component tree that does not put test attributes where you would expect.

```
# illustrative — shape of the output, not a recorded run (see Honest limits)
$ cd playwright-e2e && npx playwright test --project=chromium

Running 14 tests using 4 workers

  ✓  auth.spec.ts:13 › signs a seeded user in and lands on the transaction feed (2.1s)
  ✓  auth.spec.ts:26 › rejects a wrong password without revealing whether the user exists (1.4s)
  ✓  new-transaction.spec.ts:12 › pays a contact and shows the payment in the personal feed (3.8s)
  ✓  transaction-feeds.spec.ts:9 › renders the "everyone" feed with at least one transaction (1.2s)
  ✓  user-settings.spec.ts:15 › persists an updated profile across a reload (2.6s)
  …

  14 passed (21.3s)
```

---

## Table of contents

- [What is in here](#what-is-in-here)
- [The scenarios, and why these](#the-scenarios-and-why-these)
- [Requirements](#requirements)
- [Start the application under test](#start-the-application-under-test)
- [Run each suite](#run-each-suite)
- [How the three suites are kept comparable](#how-the-three-suites-are-kept-comparable)
- [Architecture](#architecture)
- [The selector trap in this application](#the-selector-trap-in-this-application)
- [Handling waits without sleeping](#handling-waits-without-sleeping)
- [Authentication strategy per framework](#authentication-strategy-per-framework)
- [Continuous integration](#continuous-integration)
- [Framework comparison](#framework-comparison)
- [Adding a new test](#adding-a-new-test)
- [Honest limits](#honest-limits)
- [Further reading](#further-reading)
- [License](#license)

---

## What is in here

```
realworld-ui-automation/
├── shared/
│   └── seed-users.json          ← ONE fixture, read by all three suites
├── cypress-e2e/                 ← Cypress 15 + TypeScript
├── playwright-e2e/              ← Playwright 1.62 + TypeScript
├── selenium-e2e/                ← Selenium 4.47 + Java 25 + JUnit + Maven
├── docs/
│   ├── app-under-test.md        ← how the target app behaves, and what surprised us
│   ├── framework-comparison.md  ← the actual comparison, feature by feature
│   ├── architecture.md          ← patterns used, and why
│   └── ci.md                    ← how the pipeline starts the app and runs the suites
└── .github/
    ├── actions/start-app/       ← composite action: check out, seed and boot the app
    └── workflows/ci.yml
```

Three languages appear on purpose: Cypress and Playwright in TypeScript, Selenium in Java. Selenium's centre of gravity is the JVM enterprise world, and writing it in JavaScript would produce a comparison nobody actually faces in practice.

---

## The scenarios, and why these

All three suites implement the same fourteen cases, grouped into four areas. They were chosen because each one exercises a *different* thing a browser automation tool has to be good at:

| Area | Cases | What it really tests about the framework |
|---|---|---|
| **Authentication** | sign in, wrong password, unknown user, disabled submit, sign out invalidates the session, register, disabled sign-up | Form interaction, redirect handling, session teardown, and negative assertions |
| **New transaction** | pay a contact, request money, submit stays disabled while incomplete | A multi-step wizard, a **debounced** search, and reading a value back out of a long feed |
| **Transaction feeds** | three feeds render, open a detail page, drawer shows identity and balance | List rendering behind a loading skeleton, parameterized cases, and URL assertions |
| **User settings** | profile survives a reload, required field blocks submit | Waiting on a **network** call, and proving persistence rather than local state |

The payment and profile cases are the interesting ones. Both require knowing that an asynchronous write finished before asserting — and that is precisely where the three frameworks diverge most sharply. See [Handling waits without sleeping](#handling-waits-without-sleeping).

---

## Requirements

| | Version | Needed for |
|---|---|---|
| Node.js | 22 or newer | The application under test, Cypress, Playwright |
| Java | 25 (any JDK 17+ works if you lower `maven.compiler.release`) | Selenium suite |
| Maven | 3.9+ | Selenium suite |
| Yarn (classic) | 1.x | The application under test only |
| Chrome / Firefox / WebKit | current | Playwright installs its own; Cypress and Selenium use what is installed |

No browser drivers need to be downloaded or committed. Selenium 4.6+ ships **Selenium Manager**, which resolves and fetches the matching driver on first use.

---

## Start the application under test

The suites do not bundle the application; they drive a real instance of it.

```bash
git clone https://github.com/cypress-io/cypress-realworld-app.git
cd cypress-realworld-app
yarn install
yarn db:seed:dev
yarn dev
```

That gives you the React front end on `http://localhost:3000` and the Express API on `http://localhost:3001`.

> **`yarn db:seed:dev`, never `yarn db:seed`.**
> `db:seed:dev` copies the fixed `data/database-seed.json` into place — the deterministic five-user dataset that `shared/seed-users.json` mirrors. `db:seed` *regenerates* random users, which silently invalidates every test that refers to an account by name. This is the single most common way to break the suite.

Verify you got the expected dataset:

```bash
curl -s http://localhost:3001/testData/users | head -c 200
```

You should see `Heath93`, `Arvilla_Hegmann`, `Dina20`, `Reyes.Osinski` and `Judah_Dietrich50`. Every seeded account uses the password `s3cret`.

---

## Run each suite

### Cypress

```bash
cd cypress-e2e
npm install
npm test                 # headless, all specs
npm run open             # interactive runner with time-travel debugging
npm run test:firefox     # different browser
```

### Playwright

```bash
cd playwright-e2e
npm install              # postinstall fetches the Chromium build
npm test                 # chromium, firefox, webkit and mobile-chrome
npm run test:ui          # watch-mode UI with a trace timeline
npm run report           # open the last HTML report
```

### Selenium

```bash
cd selenium-e2e
mvn test                                  # headless Chrome
mvn test -Dheadless=false                 # watch it drive the browser
mvn test -Dbrowser=firefox
mvn test -Dbase.url=http://rwa.local:3000 # point at another environment
```

All three read the same `BASE_URL`/`API_URL` overrides, so pointing the whole repository at a staging deployment is three environment variables, not three code changes.

---

## How the three suites are kept comparable

A comparison is only worth reading if the two sides are genuinely equivalent. Four things are deliberately held constant:

1. **One fixture file.** `shared/seed-users.json` is the only place test accounts are defined. Cypress reads it in `cypress.config.ts`, Playwright in `fixtures/seed-users.ts`, Selenium in `SeedUsers.java` (which walks up the directory tree to find it). Duplicating it per framework is how three suites quietly drift until two of them are testing an account that no longer exists.
2. **The same viewport.** 1280×1000 everywhere, matching the application's own configuration, so all three hit the same responsive breakpoints and see the same navigation.
3. **The same assertions.** Where one suite asserts `-$25.50`, so do the other two. Where one asserts an exact error string, so do the others.
4. **The same page-object boundary.** Page objects expose intent (`signInAs`, `selectContact`); specs contain no selectors. This is the only way to see how much of the ergonomic difference between frameworks is real, and how much of it disappears once you put a layer in front.

What is *not* held constant is the framework-idiomatic part: Cypress uses `cy.session()`, Playwright uses `storageState` and fixtures, Selenium uses a base class and explicit waits. Forcing those into a common shape would produce three bad suites instead of three good ones.

---

## Architecture

Every suite has the same four layers:

```
  spec / test class        "pay a contact and see it in my feed"
        │                   ← business language only, zero selectors
  page object              signInAs(), selectContact(), expectTransaction()
        │                   ← intent, plus assertions about the page itself
  locator layer            data-test attributes, in one file per suite
        │                   ← the only place markup knowledge lives
  framework runtime        cy.*, Locator, WebDriver
```

The rule that keeps this honest: **a selector never appears in a spec file**. If you find yourself writing one, the page object is missing a method.

Full details, including why Selenium's base class exists and Playwright's does not, are in [docs/architecture.md](docs/architecture.md).

---

## The selector trap in this application

This is worth its own section because it is the thing most likely to make a first attempt at this app fail.

cypress-realworld-app marks its components with `data-test` attributes — good practice, and the reason this suite never uses CSS classes or XPath. But for form fields, the attribute lands on the **Material UI `TextField` wrapper**, not on the `<input>`:

```jsx
<TextField id="username" data-test="signin-username" ... />
```

renders as

```html
<div data-test="signin-username" class="MuiFormControl-root">
  <div class="MuiInputBase-root">
    <input id="username" />     ← the element you actually need
  </div>
</div>
```

Typing into or clearing that `<div>` fails. Every text-field selector in this repository therefore ends in ` input`:

```ts
// Cypress
username: dtInput("signin-username")          // → [data-test="signin-username"] input

// Playwright
page.getByTestId("signin-username").locator("input")
```

```java
// Selenium
private static final By USERNAME = testIdInput("signin-username");
```

**And there is exactly one exception.** The contact search box passes the attribute through `inputProps`, so it lands on the real `<input>` and must *not* get the suffix:

```jsx
<TextField inputProps={{ "data-test": "user-list-search-input" }} />
```

A blanket "always append ` input`" rule breaks that one field. Each suite documents the exception at the point of use.

---

## Handling waits without sleeping

There is no `cy.wait(2000)`, no `page.waitForTimeout()` and no `Thread.sleep()` anywhere in this repository. Fixed sleeps are simultaneously too slow on a fast machine and too short on a loaded CI runner — they trade a real fix for a slower flake.

Three problems come up in this application, and each framework solves them differently:

**1. The feed renders a loading skeleton.** All three wait for `list-skeleton` to disappear, which is a deterministic signal from the app itself:

```ts
// Cypress
cy.get('[data-test="list-skeleton"]').should("not.exist");

// Playwright
await expect(this.skeleton).toHaveCount(0);
```
```java
// Selenium
waitUntilAbsent(SKELETON);
```

**2. Saving a profile is an asynchronous PATCH.** Reloading the page before it lands produces a failure that has nothing to do with the feature. Here the frameworks genuinely differ:

```ts
// Cypress — subscribe to the network, assert the status
cy.intercept("PATCH", "**/users/*").as("updateUser");
cy.wait("@updateUser").its("response.statusCode").should("eq", 204);
```
```ts
// Playwright — arm the listener BEFORE the click, or you race the response
const response = page.waitForResponse(r => r.request().method() === "PATCH" && …);
await this.submit.click();
expect((await response).status()).toBe(204);
```
```java
// Selenium — no network hook, so express the wait against the DOM instead
click(SUBMIT);
wait.until(d -> d.findElement(SUBMIT).isEnabled());
```

Selenium's version is still deterministic; it is just one level less direct, because WebDriver has no first-class view of the network. That difference is the single clearest practical distinction between the classic and modern generations of these tools.

**3. React controlled inputs ignore a plain `clear()`.** WebDriver's `clear()` wipes the DOM value without firing the events React listens for, so component state can stay stale. `BasePage.fill()` selects all and types over the selection instead, producing the same key events a person would.

---

## Authentication strategy per framework

Fourteen tests × one full UI login each is a lot of wasted seconds — and worse, it makes every test able to fail for a reason unrelated to what it is testing. Each framework has a different answer:

| Framework | Mechanism | Cost | Notes |
|---|---|---|---|
| **Cypress** | `cy.session()` around a **UI** login, `cacheAcrossSpecs: true` | Once per user, per run | `validate()` checks both the server session and the persisted `authState`, so a stale one fails *here* rather than deep inside an unrelated test |
| **Playwright** | A `setup` project performs a **UI** login and saves `storageState`; test projects declare `dependencies: ["setup"]` | Once per run | `storageState` is applied in **project config** — `test.use()` inside a helper module is silently ignored |
| **Selenium** | Full UI login in `@BeforeEach`, waiting for the drawer before returning | Every single test | WebDriver has no session-caching primitive; this is simply what the stack costs |

> **Both caching suites deliberately cache a UI login rather than an API call.** The obvious `cy.request("POST", "/login")` shortcut produces a session the *server* accepts and the *client* ignores: the app rehydrates its XState auth machine from `localStorage["authState"]`, which an API login never writes. See [trap #1](docs/app-under-test.md#1-a-valid-backend-session-is-not-enough--the-client-rehydrates-from-localstorage).

The authentication *tests themselves* always use the real form in all three suites — shortcutting there would test nothing.

---

## Continuous integration

`.github/workflows/ci.yml` runs five parallel jobs: a type-check job, Cypress, Playwright (matrixed across Chromium, Firefox and WebKit), and Selenium.

Each job needs a running instance of an application that lives in a different repository, so a composite action — `.github/actions/start-app` — checks out `cypress-io/cypress-realworld-app@develop`, installs it, seeds it with `db:seed:dev`, starts it in the background and then **polls** until both ports answer. Polling rather than sleeping matters here: Vite's first compile takes anywhere from fifteen to sixty seconds depending on the runner, and a fixed sleep is either wasteful or flaky.

On failure each job uploads its own diagnostics — Cypress screenshots and video, Playwright's HTML report including traces, Selenium screenshots and Surefire XML. The Playwright trace is the most valuable of the three: it replays the DOM, network and console at every step.

Details in [docs/ci.md](docs/ci.md).

---

## Framework comparison

The full write-up is in **[docs/framework-comparison.md](docs/framework-comparison.md)**. The short version:

| | Cypress | Playwright | Selenium |
|---|---|---|---|
| Auto-retrying assertions | Yes | Yes | No — explicit waits |
| Cross-browser | Chromium, Firefox, Electron, WebKit (experimental) | Chromium, Firefox, WebKit — all first-class | Whatever has a WebDriver |
| Parallelism | Paid dashboard, or sharding | Free, built in, per-file workers | Via the test runner (JUnit here) |
| Network interception | `cy.intercept`, excellent | `route`/`waitForResponse`, excellent | Not natively |
| Debugging | Time-travel runner, best-in-class interactive | Trace viewer, best-in-class post-mortem | Screenshots and logs |
| Multi-tab / multi-origin | Constrained by design | Native | Native |
| Language options | JS/TS only | JS/TS, Python, Java, .NET | Java, Python, C#, JS, Ruby, and more |
| Ecosystem maturity | 2015 → | 2020 → | 2004 →, a W3C standard |
| Best at | Developer feedback loop on a single web app | Broad, fast, reliable cross-browser E2E | Heterogeneous enterprise estates, legacy browsers, JVM shops |

**In one line each:** Playwright is the strongest default for a new browser suite in 2026; Cypress still owns the interactive debugging experience; Selenium remains the right answer when the constraint is the environment (a browser matrix, a language, or a grid) rather than the ergonomics.

---

## Adding a new test

1. Add the case to **all three** suites, or the comparison stops being valid.
2. If it needs a new element, add the selector to the locator layer of each suite — never inline in a spec.
3. If it needs a new account, add it to `shared/seed-users.json` with a distinct `role`, and confirm the account exists in the app's seed data.
4. Do not add a sleep. If something is not ready, find the signal the application already emits (a skeleton disappearing, a button re-enabling, a response landing) and wait for that.

---

## Honest limits

- **The first CI run was red, and the three root causes are documented rather than hidden.** Selectors and seeded data were all read out of `cypress-io/cypress-realworld-app` and held up; what did not hold up were three *behavioural* assumptions — API login being sufficient, submit buttons starting disabled, and the hamburger being safe to click on desktop. All three are written up in [docs/app-under-test.md](docs/app-under-test.md#the-three-traps-that-cost-us-a-ci-run), because how a suite fails the first time is more instructive than a repository that pretends it never did.
- **The seed data is a moving target.** These tests pin five specific usernames. If upstream changes `database-seed.json`, `shared/seed-users.json` needs the same change.
- **No visual regression, no accessibility axis, no performance budget.** Those are separate concerns with separate tools and would muddy a framework comparison.
- **The Selenium suite runs three browser instances in parallel at most** (`junit-platform.properties`). Raising that on a laptop mostly buys you swap.
- **Mobile coverage is Playwright-only** (the `mobile-chrome` project). Cypress can do it with a viewport override and Selenium with a window size, but device emulation proper is not comparable across the three.

---

## Further reading

- [docs/app-under-test.md](docs/app-under-test.md) — the application's routes, seeded data, and the behaviours that surprised us
- [docs/architecture.md](docs/architecture.md) — patterns, layer boundaries, and the reasoning behind each
- [docs/framework-comparison.md](docs/framework-comparison.md) — the detailed comparison
- [docs/ci.md](docs/ci.md) — pipeline design

## License

MIT
