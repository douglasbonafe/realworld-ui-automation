# The application under test

Everything on this page was read out of the [cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app) source on the `develop` branch, not inferred. Where a value could change upstream, the file that owns it is named so you can re-check it.

---

## What the app is

A payment application — a Venmo clone. Users have a balance, send and request money from contacts, and see three feeds of transactions. It exists to be a realistic test target, so it deliberately includes the things that make E2E automation hard: a modal onboarding wizard, debounced search, infinite scroll, optimistic UI updates, and a state machine (XState) driving authentication.

**Stack:** React + Vite front end, Express + a JSON file database back end, Material UI components, Formik + Yup forms, XState machines.

---

## Processes and ports

| Process | Port | Started by |
|---|---|---|
| React front end (Vite) | `3000` | `yarn start:react` |
| Express API | `3001` | `yarn start:api` |

`yarn dev` runs both concurrently. Source: `package.json` scripts, `vite.config.ts` (`server.port: 3000`), `backend/app.ts`.

The front end talks to the API cross-origin. That matters for network interception: a Cypress `cy.intercept("PATCH", "/users/*")` written without a leading `**` will not match, because the request goes to `http://localhost:3001`, not to the origin under test.

---

## Routes

From `src/containers/AppContainer` route definitions:

| Path | Screen |
|---|---|
| `/` and `/public` | "Everyone" transaction feed |
| `/contacts` | "Friends" feed |
| `/personal` | "Mine" feed |
| `/signin` | Sign in |
| `/signup` | Sign up |
| `/transaction/new` | Three-step payment wizard |
| `/transaction/:transactionId` | Transaction detail |
| `/user/settings` | Profile settings |
| `/bankaccounts*` | Bank accounts |
| `/notifications` | Notifications |

Unauthenticated access to any protected route redirects to `/signin`. That redirect is what the sign-out test asserts on — navigating away is not proof that a session was invalidated.

---

## Seeded data

`yarn db:seed:dev` copies `data/database-seed.json` over `data/database.json`. It is a **fixed** dataset:

| Username | User id | Name |
|---|---|---|
| `Heath93` | `uBmeaz5pX` | Ted Parisian |
| `Arvilla_Hegmann` | `GjWovtg2hr` | Kristian Bradtke |
| `Dina20` | `_XblMqbuoP` | Darrel Ortiz |
| `Reyes.Osinski` | `M1ty1gR8B3` | Ruthie Prosacco |
| `Judah_Dietrich50` | `WHjJ4qR2R2` | Lia Rosenbaum |

Every seeded account has the password **`s3cret`**. The seed file stores a bcrypt hash; the plaintext is confirmed by the application's own specs (`cypress/tests/ui/auth.spec.ts`).

`shared/seed-users.json` in this repository mirrors that table and tags two accounts with roles — `primary` (the account tests log in as) and `contact` (the payment counterparty). Tests refer to roles, never to literal usernames, so a change upstream is a one-file fix.

> **`yarn db:seed` is a different command and will break the suite.** It *regenerates* the dataset with random names and ids. Only `db:seed:dev` restores the fixed set.

---

## The `data-test` attributes

The app annotates components for testing. `grep -rn 'data-test' src/` produces the authoritative list; the ones this suite uses are mirrored into each framework's locator layer.

Three placement patterns exist, and telling them apart is the whole game:

**1. On the element itself** — buttons, links, list items, text nodes:
```jsx
<Button data-test="signin-submit">Sign In</Button>
```
Select directly: `[data-test="signin-submit"]`.

**2. On the Material UI wrapper** — nearly all form fields:
```jsx
<TextField id="username" data-test="signin-username" ... />
```
The attribute lands on a `div.MuiFormControl-root`. The real control is a descendant, so you need `[data-test="signin-username"] input`. Clearing or typing into the wrapper fails.

**3. Passed through `inputProps`** — exactly one field:
```jsx
<TextField inputProps={{ "data-test": "user-list-search-input" }} />
```
Here the attribute *is* on the `<input>`, and adding ` input` would match nothing.

There are exactly **six** fields in category 3, and the authoritative list comes from the source rather than from guesswork:

```bash
grep -rn 'inputProps=' src/components/*.tsx
```

| Field | Component |
|---|---|
| `user-list-search-input` | UserListSearchForm |
| `user-settings-firstName-input` | UserSettingsForm |
| `user-settings-lastName-input` | UserSettingsForm |
| `user-settings-email-input` | UserSettingsForm |
| `user-settings-phoneNumber-input` | UserSettingsForm |
| `transaction-comment-input-<id>` | CommentForm |

Everything else that is a text field belongs to category 2 and needs the ` input` suffix. Getting this backwards costs a full CI run: the settings suite fails with `[data-test="user-settings-firstName-input"] input never found`, which reads like a missing element rather than one selector too many.

**4. Interpolated with a runtime id** — list rows:
```jsx
data-test={`transaction-item-${transaction.id}`}
data-test={`user-list-item-${user.id}`}
data-test={`transaction-amount-${transaction.id}`}
```
These cannot be constants. Each suite exposes them as small builder functions.

---

## The three traps that cost us a CI run

Each of these was found by an actual red build, not by reading the source. They are listed first because each one produces a symptom that looks nothing like its cause.

### 1. A valid backend session is not enough — the client rehydrates from localStorage

`src/machines/authMachine.ts` ends with:

```js
const stateDefinition = JSON.parse(localStorage.getItem("authState"));
```

The front end decides whether you are signed in from **its own persisted XState snapshot**, not from the session cookie. So the obvious test shortcut —

```js
cy.request("POST", "http://localhost:3001/login", { username, password })
```

— produces a session the *server* accepts (`GET /checkAuth` returns 200) while the *client* boots unauthenticated and redirects every protected route to `/signin`. The symptom is a login that "succeeded" followed by `[data-test="nav-transaction-tabs"] never found`.

This is why the application's own suite reaches for `loginByXstate` (which drives the machine inside the browser) and barely uses the `loginByApi` command it also defines.

**What this suite does:** Cypress caches a *UI* login inside `cy.session()` — which snapshots localStorage as well as cookies — and Playwright's setup project does a UI login and saves `storageState`. Correctness over speed.

### 2. Submit buttons start ENABLED on some forms and DISABLED on others

Every form in the app binds its button identically:

```jsx
<Button disabled={!isValid || isSubmitting}>
```

…and yet they behave in opposite ways, because of a single prop:

| Form | `validateOnMount` | Pristine button |
|---|---|---|
| Sign in | not set | **enabled** |
| Sign up | not set | **enabled** |
| User settings | not set | **enabled** |
| Transaction wizard (step two) | `true` | **disabled** |

Formik initialises `isValid` to `true` and only recomputes it after an interaction — unless `validateOnMount` forces validation before any interaction, which is what `TransactionCreateStepTwo` does.

So `expect(submit).toBeDisabled()` on a freshly loaded sign-in form fails, and `expect(submit).toBeEnabled()` on a freshly opened payment form fails. Both fail in the direction that reads like an app bug rather than a wrong expectation, and no amount of reading one form tells you about the other.

**What this suite does:** asserts the pristine state explicitly for each form — enabled for the auth and settings forms, disabled for the transaction wizard — then drives the transition and asserts the other side. Both halves of the real behaviour get pinned down instead of one being assumed.

### 3. Clicking the hamburger on desktop *closes* the drawer

`sidenav-toggle` exists and is visible at every viewport, but on desktop the drawer is already open. The natural-looking guard —

```ts
if (await toggle.isVisible()) await toggle.click();   // WRONG
await signOut.click();
```

— closes the drawer on desktop and makes `sidenav-signout` unreachable, producing a click timeout that only appears in CI.

**What this suite does:** checks whether *the target* is reachable, not whether the hamburger exists:

```ts
if (!(await this.signOut.isVisible())) await toggle.click();
```

Correct at every viewport, mobile included.

---

## Behaviours worth knowing before you write a test

**Registration does not log you in.** Submitting `/signup` leaves the visitor on the sign-in form. The suite signs in explicitly afterwards, which is better anyway — it exercises the new credentials for real.

**A new user gets a blocking onboarding wizard.** A user without a bank account sees a modal (`user-onboarding-dialog`, titled "Get Started with Real World App") that covers the page until they complete a three-step bank-account flow. Any test that registers an account hits this. The suite asserts the dialog appears rather than dismissing it — that is the actual product behaviour for a new account.

**Login failure returns one generic message.** Both "no such user" and "wrong password" render `Username or password is invalid` in `signin-error`. That is a deliberate user-enumeration defence, and the suite asserts the exact string in both cases so a future change that leaks the difference fails a test.

**Amounts are cents server-side and formatted client-side.** `formatAmount` in `src/utils/transactionUtils.ts` produces a localized USD string, e.g. `$1,509.53`. Feed rows carry a sign: a payment you sent shows `-$25.50`, a request you made shows `+$12.00`.

**Names are abbreviated in the drawer.** `sidenav-user-full-name` renders `Ted P`, not `Ted Parisian`. Assertions check the first name plus the surname initial.

**Saving a profile returns HTTP 204.** `PATCH /users/:userId` (`backend/user-routes.ts`) responds with no content. Anything waiting on that request should expect 204, not 200.

**The feed shows a skeleton while loading.** `list-skeleton` is present until data arrives. Its disappearance is the deterministic "ready" signal every suite waits on.

**The drawer collapses on narrow viewports.** Below the Material UI breakpoint, `sidenav` hides behind `sidenav-toggle`. The Playwright and Selenium page objects open the toggle if it is visible, so one page object serves every viewport.

---

## API endpoints used by the suite

Only two, both from the Cypress fast-login path:

| Endpoint | Purpose |
|---|---|
| `POST http://localhost:3001/login` with `{ username, password }` | Establish a session without the form |
| `GET http://localhost:3001/checkAuth` | Confirm a cached session is still valid |

`GET http://localhost:3001/testData/:entity` is used by CI to confirm the app finished booting with the expected data.

---

## Re-verifying this page

If the app changes upstream, these commands regenerate everything above:

```bash
# selectors
grep -rhoE 'data-test="[^"]+"' src/ | sort -u
grep -rhoE 'data-test=\{`[^`]+`\}' src/ | sort -u

# seeded users
node -e "console.log(require('./data/database-seed.json').users.map(u=>[u.username,u.id,u.firstName,u.lastName]))"

# routes
grep -rhoE 'path="[^"]+"' src/containers/*.tsx | sort -u
```
