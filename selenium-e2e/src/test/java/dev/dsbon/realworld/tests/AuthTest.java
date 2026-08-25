package dev.dsbon.realworld.tests;

import static org.assertj.core.api.Assertions.assertThat;

import dev.dsbon.realworld.pages.OnboardingDialog;
import dev.dsbon.realworld.pages.SideNav;
import dev.dsbon.realworld.pages.SignInPage;
import dev.dsbon.realworld.pages.SignUpPage;
import dev.dsbon.realworld.support.BaseTest;
import dev.dsbon.realworld.support.SeedUsers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Authentication")
class AuthTest extends BaseTest {

  @Test
  @DisplayName("signs a seeded user in and lands on the transaction feed")
  void signsInSuccessfully() {
    var user = SeedUsers.primary();

    new SignInPage(driver).open().signInAs(user.username(), SeedUsers.defaultPassword());

    SideNav nav = new SideNav(driver).awaitVisible();
    assertThat(nav.username()).contains("@" + user.username());
    assertThat(nav.balance()).matches("\\$[\\d,]+\\.\\d{2}");
  }

  @Test
  @DisplayName("rejects a wrong password without revealing whether the user exists")
  void rejectsWrongPassword() {
    var user = SeedUsers.primary();

    SignInPage page =
        new SignInPage(driver).open().signInAs(user.username(), "definitely-not-the-password");

    // One generic message for both "no such user" and "wrong password" is a
    // deliberate enumeration defence. Asserting the exact string is what makes
    // this a regression test rather than a smoke test.
    assertThat(page.errorMessage()).isEqualTo("Username or password is invalid");
    assertThat(page.currentPath()).isEqualTo("/signin");
  }

  @Test
  @DisplayName("rejects an unknown username with the same generic message")
  void rejectsUnknownUser() {
    SignInPage page =
        new SignInPage(driver).open().signInAs("no-such-account-here", SeedUsers.defaultPassword());

    assertThat(page.errorMessage()).isEqualTo("Username or password is invalid");
  }

  @Test
  @DisplayName("keeps the submit button disabled until both fields are filled")
  void keepsSubmitDisabled() {
    SignInPage page = new SignInPage(driver).open();

    assertThat(page.isSubmitEnabled()).isFalse();

    page.fillUsername(SeedUsers.primary().username());
    assertThat(page.isSubmitEnabled()).isFalse();
  }

  @Test
  @DisplayName("signs out and blocks protected routes afterwards")
  void signsOutAndInvalidatesSession() {
    signInAsPrimaryUser();

    SideNav nav = new SideNav(driver).awaitVisible();
    nav.signOut();

    SignInPage signIn = new SignInPage(driver).awaitVisible();
    assertThat(signIn.currentPath()).isEqualTo("/signin");

    // Signing out must invalidate the session, not merely navigate away.
    // Requesting a protected route directly is the only way to prove that.
    driver.get(dev.dsbon.realworld.support.TestConfig.BASE_URL + "/user/settings");
    signIn.awaitVisible();
    assertThat(signIn.currentPath()).isEqualTo("/signin");
  }

  @Test
  @DisplayName("registers a new account and signs in with it")
  void registersAndSignsIn() {
    // A unique username per run keeps the test independent of previous runs
    // against the same non-reset database.
    String suffix = String.valueOf(System.currentTimeMillis()).substring(5);
    var account =
        new SignUpPage.NewAccount(
            "Bertha", "Tester", "se_bertha_" + suffix, SeedUsers.defaultPassword());

    new SignUpPage(driver).open().register(account);

    // Registration drops the visitor on the sign-in form rather than logging
    // them straight in, so the new credentials get exercised for real.
    new SignInPage(driver).awaitVisible().signInAs(account.username(), account.password());

    // A brand-new user has no bank account, so the app opens its onboarding
    // wizard instead of the feed.
    assertThat(new OnboardingDialog(driver).awaitTitle()).contains("Get Started");
    assertThat(new SideNav(driver).username()).contains("@" + account.username());
  }

  @Test
  @DisplayName("keeps the sign-up submit disabled while the form is incomplete")
  void keepsSignUpSubmitDisabled() {
    assertThat(new SignUpPage(driver).open().isSubmitEnabled()).isFalse();
  }
}
