import { SEL } from "./selectors";
import { defaultPassword } from "./types";

/**
 * Log in through the user interface.
 *
 * The honest path: the real form, the real validation, the real redirect. Used
 * directly by the tests that are *about* authentication.
 */
Cypress.Commands.add("loginByUi", (username: string, password = defaultPassword()) => {
  cy.visit("/signin");
  cy.get(SEL.signIn.username).type(username);
  cy.get(SEL.signIn.password).type(password, { log: false });
  cy.get(SEL.signIn.submit).click();
  cy.get(SEL.sideNav.root).should("be.visible");
});

/**
 * Log in once and reuse the session for every later test.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS DRIVES THE UI INSTEAD OF CALLING THE LOGIN API
 * ---------------------------------------------------------------------------
 * The obvious optimisation is `cy.request("POST", apiUrl + "/login")`: one HTTP
 * call, no rendering, session cookie set. It does not work against this
 * application, and the way it fails is worth understanding.
 *
 * The backend session is genuinely valid — `GET /checkAuth` returns 200. But the
 * front end does not decide whether you are logged in from the cookie. Its
 * XState auth machine rehydrates from localStorage (`src/machines/authMachine.ts`):
 *
 *     const stateDefinition = JSON.parse(localStorage.getItem("authState"));
 *
 * An API-only login never writes `authState`, so the machine boots
 * unauthenticated and every protected route redirects to /signin — while the
 * server happily considers you signed in. The symptom is baffling: a login that
 * "succeeded", followed by "element [data-test=nav-transaction-tabs] never found".
 *
 * This is also why the application's own suite reaches for `loginByXstate` and
 * barely uses the `loginByApi` command it defines.
 *
 * `cy.session()` snapshots cookies AND localStorage, so caching a UI login gives
 * a session that is indistinguishable from a real one — the same choice the
 * Playwright suite makes with its `storageState` setup project.
 *
 * The cost is one real login per user per run instead of one HTTP request.
 * Correctness first.
 */
Cypress.Commands.add("login", (username: string, password = defaultPassword()) => {
  cy.session(
    ["ui-login", username],
    () => {
      cy.visit("/signin");
      cy.get(SEL.signIn.username).type(username);
      cy.get(SEL.signIn.password).type(password, { log: false });
      cy.get(SEL.signIn.submit).click();
      // Do not let the session be snapshotted until the app has genuinely
      // finished authenticating. Caching a half-written state produces failures
      // in unrelated tests that are very hard to trace back to here.
      cy.get(SEL.sideNav.root).should("be.visible");
      cy.get(SEL.sideNav.username).should("contain.text", `@${username}`);
    },
    {
      validate() {
        // Check both halves, because either one alone can be stale: the server
        // session, and the client state the front end actually reads.
        cy.request({ url: `${Cypress.env("apiUrl")}/checkAuth`, failOnStatusCode: false })
          .its("status")
          .should("eq", 200);
        cy.window().then((win) => {
          expect(win.localStorage.getItem("authState"), "persisted authState").to.not.be.null;
        });
      },
      cacheAcrossSpecs: true,
    },
  );
});

/**
 * Wait for the transaction list to finish loading.
 *
 * The list renders a skeleton placeholder while data is in flight, so its
 * disappearance is a deterministic "rendering finished" signal — far better than
 * `cy.wait(2000)`, which is both slower on a fast machine and still flaky on a
 * slow one.
 */
Cypress.Commands.add("waitForTransactionList", () => {
  cy.get(SEL.transactions.skeleton).should("not.exist");
  cy.get(SEL.transactions.list).should("be.visible");
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginByUi(username: string, password?: string): Chainable<void>;
      login(username: string, password?: string): Chainable<void>;
      waitForTransactionList(): Chainable<void>;
    }
  }
}

export {};
