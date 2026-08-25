# Cypress vs Playwright vs Selenium

Written after implementing the same fourteen scenarios three times against the same application. Where the three suites differ, the difference is the framework — the fixtures, viewport, assertions and page-object boundary are identical by construction.

This is not a ranking. Each of these tools is the right answer to a different constraint.

---

## The one-paragraph version

**Playwright** is the strongest default for a new browser suite in 2026: genuine cross-browser support, free parallelism, auto-waiting assertions, and a trace viewer that turns a red CI run into a five-minute diagnosis. **Cypress** still has the best interactive debugging experience in the industry and the shortest write–run–fix loop, at the cost of an architecture that constrains multi-origin and multi-tab work. **Selenium** is the only one of the three that is a W3C standard, runs on any browser with a driver, and speaks every mainstream language — which is exactly why it still owns heterogeneous enterprise estates, even though writing tests in it takes visibly more code.

---

## Where the code actually differs

### Waiting

This is the deepest difference, and it shows up in every single test.

Cypress and Playwright both retry assertions automatically until a deadline. You describe the end state; the framework handles the timing:

```ts
// Cypress
cy.get('[data-test="transaction-list"]').should("be.visible");

// Playwright
await expect(page.getByTestId("transaction-list")).toBeVisible();
```

Selenium does not. `findElement` resolves once, and an assertion on the result is a snapshot. Waiting is something you do deliberately:

```java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
```

In this repository that is centralised in `BasePage`, so a Selenium test body ends up reading nearly as cleanly as the others. But the discipline is on you: forget the wait once and you have written a test that passes on a fast laptop and fails in CI. That single property is responsible for most of Selenium's reputation for flakiness — it is a property of how people use it, not of the tool.

A related trap the modern tools remove: **stale elements**. A Selenium `WebElement` is a handle to a specific DOM node; if React re-renders, the handle dies with `StaleElementReferenceException`. A Playwright `Locator` is a *query*, re-evaluated on every use, so the failure mode does not exist.

### Network awareness

Proving that a profile save was persisted requires knowing the PATCH finished.

```ts
// Cypress — subscribe, then assert on the response
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
// Selenium — no network hook; express the wait against the DOM
click(SUBMIT);
wait.until(d -> d.findElement(SUBMIT).isEnabled());
```

Selenium's version is still deterministic, but it asserts a *proxy* for the thing you care about. If the app someday re-enables the button before the request completes, that test silently becomes a race. Cypress and Playwright assert the thing itself.

Selenium 4 does expose CDP, which gets you some of this on Chromium — but it is Chromium-only and considerably more code, so it is not a like-for-like replacement.

### Authentication reuse

Fourteen tests × a full UI login is wasted time and, worse, gives every test a second way to fail.

| | Mechanism | Logins per run |
|---|---|---|
| Cypress | `cy.session()` with `cacheAcrossSpecs`, plus a `validate()` callback | 1 per user |
| Playwright | `setup` project writes `storageState`; test projects declare `dependencies` | 1 |
| Selenium | Full UI login in `@BeforeEach` | 14 |

Selenium has no equivalent primitive. You can hand-roll one by injecting cookies, but you then have to keep that injection in sync with however the app actually establishes a session — which in this app means an XState machine plus a cookie, and is exactly the kind of shortcut that drifts.

### Parallelism

Playwright ships it: `fullyParallel: true` runs each file in its own worker process, on one machine, free. For this suite — four spec files, no shared mutable state except the profile tests — that is one line of configuration and close to a 4× wall-clock reduction.

Selenium inherits whatever the test runner offers. Here JUnit runs test *classes* concurrently (`junit-platform.properties`), each with its own browser — effective, but you own the decision about what is safe to parallelise, because several classes mutate the same seeded account.

Cypress parallelises across machines through its dashboard (paid) or through manual spec sharding in CI. On a single machine, specs run in sequence.

### Cross-browser

Playwright bundles patched builds of Chromium, Firefox and WebKit and treats all three as first-class; adding WebKit here was four lines in `playwright.config.ts`. Cypress supports Chromium-family and Firefox well, with experimental WebKit. Selenium supports whatever has a WebDriver implementation — including browsers the other two will never reach, which is precisely why it survives in enterprises with a mandated browser matrix.

### Debugging

Different philosophies, both excellent:

- **Cypress** is best *live*. The runner shows every command, and hovering one replays the DOM at that moment. For writing a test against an unfamiliar app, nothing beats it.
- **Playwright** is best *after the fact*. `trace: "on-first-retry"` records a full DOM/network/console timeline of the failing run, which you open locally from a CI artifact. This is the difference between debugging a CI-only failure in minutes and never reproducing it.
- **Selenium** gives you screenshots and logs. This suite adds a `TestWatcher` extension to capture a PNG on failure, which is the practical floor.

### Language

Cypress is TypeScript/JavaScript only. Playwright offers JS/TS, Python, Java and .NET, though the JS/TS binding leads. Selenium covers Java, Python, C#, JavaScript, Ruby and more, at similar quality.

For a team whose services, tooling and hiring are all JVM, that is not a footnote — it is often the deciding factor, and it is why the Selenium suite here is written in Java rather than JavaScript.

---

## Verbosity, measured

Line counts for the same fourteen scenarios, excluding comments and blank lines:

| | Specs | Page objects | Support + config | Total |
|---|---:|---:|---:|---:|
| Cypress | 152 | 293 | 190 | **635** |
| Playwright | 178 | 321 | 156 | **655** |
| Selenium | 214 | 536 | 205 | **955** |

Counted with:

```bash
cat <files> | grep -vE '^\s*($|//|/\*|\*|\*/)' | wc -l
```

These are the numbers **after** all three suites went green against a live application — which matters, because the gap widened as they were stabilised. An earlier count, taken when the code merely looked right, had Selenium about 30% larger. Making it actually pass took it to ~50%, and **every line of that growth landed in the page-object layer**:

- `clickUntil` — click until a real outcome holds, for idempotent targets
- `clickThenSettle` — at most two dispatches, for buttons that move money
- `awaitEnabled` / `awaitDisabled` — because assertions do not retry
- a verified `fill` — because `sendKeys` is fire-and-forget
- a React-aware native value setter — because controlled inputs ignore plain assignment

Cypress and Playwright needed none of it. Re-resolving elements and retrying actionability is what their runtimes already do on every command, so the same fourteen scenarios simply never hit those failure modes. That is the honest cost of WebDriver's resolve-once-dispatch-once model, and it is invisible until you run the suite against a real React app on a loaded CI runner.

Java's syntax accounts for a little of the rest. Once the scaffolding exists, adding the *next* test costs roughly the same in all three.

Cypress and Playwright come out within 4% of each other, which is itself a finding — the ergonomic gap between them is real but small once page objects are in place, and the meaningful differences are architectural rather than syntactic.

---

## Feature matrix

| | Cypress | Playwright | Selenium |
|---|---|---|---|
| Auto-retrying assertions | ✅ | ✅ | ❌ explicit waits |
| Stale-element failures | Impossible | Impossible | Possible |
| Chromium / Firefox / WebKit | ✅ / ✅ / experimental | ✅ / ✅ / ✅ | driver-dependent |
| Mobile device emulation | Viewport only | Full device profiles | Window size only |
| Parallel on one machine | Paid / sharded | ✅ free | Via test runner |
| Network interception | ✅ excellent | ✅ excellent | CDP, Chromium only |
| Multiple tabs / origins | Constrained by design | ✅ native | ✅ native |
| Session reuse primitive | `cy.session()` | `storageState` | ❌ hand-rolled |
| Post-mortem trace | Video + screenshots | ✅ full trace viewer | Screenshots |
| Interactive debugging | ✅ best in class | Good (`--ui`) | Basic |
| Languages | JS/TS | JS/TS, Py, Java, .NET | Java, Py, C#, JS, Rb, … |
| Standard | Proprietary | Proprietary | W3C WebDriver |
| First release | 2015 | 2020 | 2004 |

---

## Choosing

**Pick Playwright** for a new suite unless something specific rules it out. Free parallelism, real cross-browser coverage and the trace viewer are a large, compounding advantage, and the API is the most consistent of the three.

**Pick Cypress** when the primary value is the developer feedback loop on a single web application, when the team is already fluent in it, or when component testing in the same tool matters. Its constraints — one origin at a time, no real multi-tab — are only constraints if your product needs them.

**Pick Selenium** when the environment decides for you: a mandated browser matrix, a Selenium Grid or a cloud provider standardised on WebDriver, a language the others do not support well, or an estate where WebDriver is already the lingua franca. Modern Selenium with Selenium Manager, explicit-wait helpers and a real test runner is a genuinely good tool — the failure mode is teams using it like it is still 2012.

**And note what does not differ:** all three produced clean, readable, non-flaky tests here. The framework matters far less than whether the suite has stable selectors, deterministic waits, isolated data and a page-object boundary. Get those four right and any of these tools will serve you; get them wrong and none of them will save you.
