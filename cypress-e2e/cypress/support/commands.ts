import { SEL } from "./selectors";
import { defaultPassword } from "./types";

/**
 * Log in through the user interface.
 *
 * This is the honest path: it exercises the real form, the real validation and
 * the real redirect, exactly as a person would. Use it in the tests that are
 * *about* authentication.
 */
Cypress.Commands.add("loginByUi", (username: string, password = defaultPassword()) => {
  cy.visit("/signin");
  cy.get(SEL.signIn.username).type(username);
  cy.get(SEL.signIn.password).type(password, { log: false });
  cy.get(SEL.signIn.submit).click();
});

/**
 * Log in through the backend API and drop the resulting session cookie into the
 * browser.
 *
 * Use this in every test that is *not* about authentication. A test about making
 * a payment should fail because the payment broke, never because the login form
 * changed — and it should not spend three seconds re-proving that login works.
 *
 * Wrapped in `cy.session()`, so the work happens once per username per spec file
 * and is replayed from cache afterwards.
 */
Cypress.Commands.add("loginByApi", (username: string, password = defaultPassword()) => {
  cy.session(
    ["api-login", username],
    () => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/login`,
        body: { username, password },
      })
        .its("status")
        .should("eq", 200);
    },
    {
      // Prove the restored session is actually usable before handing it to the
      // test. Without this, an expired cookie would surface as a confusing
      // failure deep inside the test body instead of here.
      validate() {
        cy.request({ url: `${Cypress.env("apiUrl")}/checkAuth`, failOnStatusCode: false })
          .its("status")
          .should("eq", 200);
      },
      cacheAcrossSpecs: true,
    },
  );
});

/**
 * Dismiss the first-run onboarding dialog if the app decides to show it.
 *
 * A freshly registered user has no bank account, so the app opens a modal that
 * covers the page. Seeded users normally do not see it — hence the conditional.
 * Conditional logic in a test is usually a smell; here the branch is genuinely
 * part of the product's behaviour, not a workaround for a race.
 */
Cypress.Commands.add("dismissOnboardingIfPresent", () => {
  cy.get("body").then(($body) => {
    if ($body.find(SEL.onboarding.dialog).length > 0) {
      cy.get(SEL.onboarding.next).click();
    }
  });
});

/**
 * Wait for the transaction list to finish loading.
 *
 * The list renders a skeleton placeholder while data is in flight. Asserting
 * that the skeleton is gone is a deterministic signal that rendering finished —
 * far better than `cy.wait(2000)`, which is both slower on a fast machine and
 * still flaky on a slow one.
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
      loginByApi(username: string, password?: string): Chainable<void>;
      dismissOnboardingIfPresent(): Chainable<void>;
      waitForTransactionList(): Chainable<void>;
    }
  }
}

export {};
