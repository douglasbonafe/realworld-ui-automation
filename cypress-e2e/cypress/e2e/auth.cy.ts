import { signInPage } from "../pages/SignInPage";
import { signUpPage } from "../pages/SignUpPage";
import { sideNav } from "../pages/SideNav";
import { onboarding } from "../pages/OnboardingDialog";
import { defaultPassword, primaryUser } from "../support/types";

/**
 * Authentication.
 *
 * These are the only tests that log in through the form. Everything else uses
 * the API shortcut, because re-testing the login form in every spec buys nothing
 * and costs seconds per test.
 */
describe("Authentication", () => {
  it("signs a seeded user in and lands on the transaction feed", () => {
    const user = primaryUser();

    signInPage.visit().signInAs(user.username, defaultPassword());

    cy.location("pathname").should("equal", "/");
    sideNav.shouldBeVisible().shouldShowUsername(user.username).shouldShowFormattedBalance();
  });

  it("rejects a wrong password without revealing whether the user exists", () => {
    const user = primaryUser();

    signInPage.visit().signInAs(user.username, "definitely-not-the-password");

    // The app deliberately returns one generic message for both "no such user"
    // and "wrong password" — an enumeration defence. Asserting the exact string
    // is what turns that into a regression test rather than a smoke test.
    signInPage.shouldShowError("Username or password is invalid");
    cy.location("pathname").should("equal", "/signin");
  });

  it("rejects an unknown username with the same generic message", () => {
    signInPage.visit().signInAs("no-such-account-here", defaultPassword());

    signInPage.shouldShowError("Username or password is invalid");
  });

  it("keeps the submit button disabled until both fields are filled", () => {
    signInPage.visit().shouldHaveDisabledSubmit();

    signInPage.fillUsername(primaryUser().username).shouldHaveDisabledSubmit();
  });

  it("signs the user out and blocks access to protected routes afterwards", () => {
    const user = primaryUser();

    cy.loginByUi(user.username);
    sideNav.shouldBeVisible().signOut();

    cy.location("pathname").should("equal", "/signin");

    // Signing out must invalidate the session, not just navigate away. Asking
    // for a protected route directly is the only way to prove that.
    cy.visit("/user/settings");
    cy.location("pathname").should("equal", "/signin");
  });

  it("registers a new account and signs in with it", () => {
    // A unique username per run keeps the test independent of previous runs
    // against the same non-reset database.
    const suffix = Date.now().toString().slice(-8);
    const account = {
      firstName: "Bertha",
      lastName: "Tester",
      username: `qa_bertha_${suffix}`,
      password: defaultPassword(),
    };

    signUpPage.visit().register(account);

    // Registration does not log the user in — it drops them on the sign-in form,
    // so the new credentials get exercised for real.
    signInPage.shouldBeVisible().signInAs(account.username, account.password);

    // A brand-new user has no bank account, so the app opens its onboarding
    // wizard instead of the transaction feed. Asserting that is stronger than
    // dismissing it: it pins down real product behaviour for new accounts.
    onboarding.shouldBeVisible();
    sideNav.shouldShowUsername(account.username);
  });

  it("keeps the sign-up submit disabled while the form is incomplete", () => {
    signUpPage.visit().shouldHaveDisabledSubmit();
  });
});
