import { anonTest as test, expect } from "../fixtures/test";
import { DEFAULT_PASSWORD, PRIMARY_USER } from "../fixtures/seed-users";

/**
 * Authentication.
 *
 * Uses `anonTest`, which starts from an empty storage state — otherwise every
 * test here would begin already logged in via the shared session and prove
 * nothing.
 */
test.describe("Authentication", () => {
  test("signs a seeded user in and lands on the transaction feed", async ({
    page,
    signInPage,
    sideNav,
  }) => {
    await signInPage.goto();
    await signInPage.signInAs(PRIMARY_USER.username, DEFAULT_PASSWORD);

    await expect(page).toHaveURL(/\/$/);
    await sideNav.expectSignedInAs(PRIMARY_USER.username);
    await sideNav.expectFormattedBalance();
  });

  test("rejects a wrong password without revealing whether the user exists", async ({
    page,
    signInPage,
  }) => {
    await signInPage.goto();
    await signInPage.signInAs(PRIMARY_USER.username, "definitely-not-the-password");

    // One generic message for both "no such user" and "wrong password" is a
    // deliberate enumeration defence. Asserting the exact string is what makes
    // this a regression test rather than a smoke test.
    await signInPage.expectError("Username or password is invalid");
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("rejects an unknown username with the same generic message", async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.signInAs("no-such-account-here", DEFAULT_PASSWORD);

    await signInPage.expectError("Username or password is invalid");
  });

  test("keeps the submit button disabled until both fields are filled", async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.expectSubmitDisabled();

    await signInPage.username.fill(PRIMARY_USER.username);
    await signInPage.expectSubmitDisabled();
  });

  test("signs out and blocks protected routes afterwards", async ({
    page,
    signInPage,
    sideNav,
  }) => {
    await signInPage.goto();
    await signInPage.signInAs(PRIMARY_USER.username, DEFAULT_PASSWORD);
    await sideNav.expectSignedInAs(PRIMARY_USER.username);

    await sideNav.clickSignOut();
    await expect(page).toHaveURL(/\/signin$/);

    // Signing out must invalidate the session, not merely navigate away.
    // Requesting a protected route directly is the only way to prove that.
    await page.goto("/user/settings");
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("registers a new account and signs in with it", async ({
    signUpPage,
    signInPage,
    sideNav,
    onboarding,
  }) => {
    const suffix = Date.now().toString().slice(-8);
    const account = {
      firstName: "Bertha",
      lastName: "Tester",
      username: `pw_bertha_${suffix}`,
      password: DEFAULT_PASSWORD,
    };

    await signUpPage.goto();
    await signUpPage.register(account);

    // Registration drops the visitor on the sign-in form rather than logging
    // them straight in, so the new credentials get exercised for real.
    await signInPage.expectVisible();
    await signInPage.signInAs(account.username, account.password);

    // A brand-new user has no bank account, so the app opens its onboarding
    // wizard instead of the feed. Asserting that pins down real behaviour.
    await onboarding.expectVisible();
    await sideNav.expectSignedInAs(account.username);
  });

  test("keeps the sign-up submit disabled while the form is incomplete", async ({ signUpPage }) => {
    await signUpPage.goto();
    await signUpPage.expectSubmitDisabled();
  });
});
