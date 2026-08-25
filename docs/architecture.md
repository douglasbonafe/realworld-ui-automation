# Architecture

The patterns every suite in this repository follows, and the reasoning behind each. Where a framework forced a different shape, that is called out rather than smoothed over.

---

## The four layers

```
  spec / test class     "pay a contact and see it in my feed"
        │                business language only — zero selectors
        ▼
  page object           signInAs(), selectContact(), expectTransaction()
        │                intent, plus assertions about the page itself
        ▼
  locator layer         data-test attributes, one file per suite
        │                the only place markup knowledge lives
        ▼
  framework runtime     cy.*, Locator, WebDriver
```

**The rule that keeps it honest: a selector never appears in a spec file.** If you catch yourself writing one, the page object is missing a method. That single constraint is what makes a markup change a one-file edit instead of a grep-and-pray.

---

## Page objects: intent, not fields

The classic Page Object Model degenerates into a bag of getters — `usernameField()`, `passwordField()`, `submitButton()` — and the test ends up doing the orchestration anyway. The version here exposes *what a user is trying to do*:

```ts
signInPage.visit().signInAs(user.username, password);
```

not

```ts
signInPage.usernameField().type(user.username);
signInPage.passwordField().type(password);
signInPage.submitButton().click();
```

The second version leaks the page's structure into every test that uses it. Adding a "confirm your identity" step would then mean editing every test; with the first, it means editing one method.

**Assertions are split by subject.** An assertion about the *page* — "the error banner shows this text", "the submit button is disabled" — belongs in the page object, because it needs the locator. An assertion about the *business outcome* — "the payment appears in my feed with the right sign" — belongs in the spec, because that is what the test is about. Getting this split wrong is how page objects turn into a second, worse copy of the test suite.

**Methods return `this`.** Chaining reads well and, more importantly, makes an incomplete flow obvious at a glance.

---

## One fixture, three readers

`shared/seed-users.json` is the only place test accounts are defined.

```
shared/seed-users.json
   ├── cypress-e2e/cypress.config.ts     reads with fs, exposes via Cypress.env
   ├── playwright-e2e/fixtures/seed-users.ts   reads with fs, exports constants
   └── selenium-e2e/…/support/SeedUsers.java   Jackson, walks up to find the file
```

Tests refer to **roles**, never to literal usernames:

```ts
const user = primaryUser();      // not "Heath93"
const payee = contactUser();     // not "Arvilla_Hegmann"
```

Two reasons. First, an upstream re-seed becomes a one-file fix rather than a repository-wide find-and-replace. Second, `primaryUser()` states the account's *purpose*; `"Heath93"` states nothing at all.

`SeedUsers.java` searches upward from the working directory for `shared/seed-users.json` because Surefire runs with the module directory as CWD while IDEs often use the repository root. Searching makes both work without a configuration flag — a small thing that removes a recurring "works on my machine" report.

---

## Test data: unique per run, never cleaned up

Every test that *writes* data generates a unique value:

```ts
const description = `Playwright payment ${Date.now()}`;
const username = `pw_bertha_${Date.now().toString().slice(-8)}`;
```

No teardown, no database reset between tests. The reasoning:

- The app has no per-test reset hook that is safe to call while other tests are running in parallel.
- Unique values make each test independent of every previous run against the same database, which is the property teardown is usually trying to buy.
- Feed assertions scope to the unique description, so a feed with a thousand rows in it is not a problem.

The cost is accumulating junk in a long-lived database. For a local dev database that is re-seeded with one command, that is the right trade. For a shared environment it would not be — there you would want a per-run tenant or a reset endpoint.

---

## Isolation model, per framework

| | Browser | Session | Test data |
|---|---|---|---|
| Cypress | One browser, state cleared per test | `cy.session()` cache, validated | Unique per test |
| Playwright | One browser, **fresh context** per test | `storageState` from the setup project | Unique per test |
| Selenium | **Fresh browser** per test | Full UI login per test | Unique per test |

Playwright's browser-context model is the sweet spot: a context is cheap to create and gives complete cookie/storage isolation without paying for a browser launch. Selenium's fresh-browser-per-test is the expensive end, but it buys total isolation without any of the state-clearing rituals that make suites subtly order-dependent.

---

## Waiting

There is no `cy.wait(2000)`, no `page.waitForTimeout()` and no `Thread.sleep()` in this repository. Every wait is on a signal the application actually emits:

| Situation | Signal waited on |
|---|---|
| Feed loading | `list-skeleton` disappears |
| Payment saved | Confirmation screen renders |
| Profile saved | The `PATCH` response lands (Cypress, Playwright) / the submit button re-enables (Selenium) |
| Contact search | The specific `user-list-item-<id>` appears |

The contact-search case is the instructive one. The search is debounced, so "wait for the list to change" is wrong twice over — the list may already contain the target, and it may change more than once. Waiting for the *specific row you are about to click* is both correct and faster.

**Selenium's implicit waits are deliberately not configured.** Mixing implicit and explicit waits produces timeouts that are the sum of both and are very hard to reason about, and it makes negative assertions ("this element must not exist") pay the full implicit timeout every time. One explicit `WebDriverWait` in `BasePage`, one budget in `TestConfig.TIMEOUT`.

---

## Framework-specific shapes

### Cypress: custom commands over a base class

There is no base class, because Cypress does not construct your tests. Shared behaviour goes into `Cypress.Commands.add`:

```ts
cy.loginByApi(username);
cy.dismissOnboardingIfPresent();
cy.waitForTransactionList();
```

`loginByApi` wraps `cy.session()` with a `validate()` callback. The callback matters more than it looks: without it, a stale cached cookie surfaces as a confusing failure deep inside an unrelated test rather than at the point where the session was restored.

### Playwright: fixtures over inheritance

Page objects are injected as fixtures rather than constructed in each test:

```ts
test("...", async ({ signInPage, sideNav }) => { … });
```

Two exports exist: `test` (carries `storageState`, already signed in) and `anonTest` (empty storage state). Authentication tests use `anonTest` — using `test` there would start every case already logged in and prove nothing.

The `setup` project deliberately logs in through the **UI** rather than the API. An API shortcut is faster but can drift from what the browser actually ends up holding, and every test then inherits that drift.

### Selenium: a base class, because there is nowhere else

`BaseTest` owns the browser lifecycle and the `@ExtendWith(ScreenshotOnFailure.class)` registration. `ScreenshotOnFailure` keeps the driver in a `ThreadLocal` because JUnit constructs the extension before the `@BeforeEach` that creates the browser, and because parallel execution gives each test its own thread — the same field works at any level of concurrency.

`BasePage.fill()` deserves a note. WebDriver's `clear()` wipes the DOM value without firing the events React listens for, so a controlled component's state can stay stale and validation can disagree with what is on screen. Selecting all and typing over the selection produces the same key events a person would, and is the reliable way to replace text in a React form.

---

## What is deliberately absent

- **A BDD layer (Cucumber, Gherkin).** It adds a translation step and a step-definition registry. Worth it when non-engineers genuinely author scenarios; pure overhead when they do not. Nobody outside engineering reads this suite.
- **A reporting service.** Cypress writes screenshots and video, Playwright an HTML report with traces, Selenium screenshots and Surefire XML. All three are uploaded as CI artifacts. A hosted dashboard is a good thing to add when a team needs history and flake tracking — it is not needed to demonstrate the suites.
- **Retries as a local default.** Both retrying frameworks retry only in CI. Locally a flake should be loud so you fix it; in CI a retry keeps an unrelated pull request from being blocked by infrastructure noise. Every retry is still reported, so persistent flake stays visible.
- **Visual regression, accessibility and performance axes.** Separate concerns, separate tools, and they would muddy a framework comparison.
