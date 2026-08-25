package dev.dsbon.realworld.tests;

import static org.assertj.core.api.Assertions.assertThat;

import dev.dsbon.realworld.pages.NewTransactionPage;
import dev.dsbon.realworld.pages.TransactionFeedPage;
import dev.dsbon.realworld.pages.TransactionFeedPage.Feed;
import dev.dsbon.realworld.support.BaseTest;
import dev.dsbon.realworld.support.SeedUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("New transaction")
class NewTransactionTest extends BaseTest {

  @BeforeEach
  void signIn() {
    // Selenium has no session-caching equivalent, so this is a full UI login
    // before every test. That cost is the honest trade-off of the stack — see
    // docs/framework-comparison.md.
    signInAsPrimaryUser();
  }

  @Test
  @DisplayName("pays a contact and shows the payment in the sender's personal feed")
  void paysAContact() {
    var payee = SeedUsers.contact();
    // A unique description is what lets the assertion find *this* payment in a
    // feed that already holds hundreds of seeded ones.
    String description = "Selenium payment " + System.currentTimeMillis();

    new NewTransactionPage(driver)
        .open()
        .selectContact(payee.id(), payee.firstName())
        .enterDetails("25.50", description)
        .pay()
        .awaitConfirmation()
        .backToFeeds();

    var row =
        new TransactionFeedPage(driver).openFeed(Feed.MINE).findByDescription(description);

    assertThat(row).isPresent();
    // A payment leaves the sender's balance, so it renders negative.
    assertThat(row.orElseThrow().getText()).contains("-$25.50");
  }

  @Test
  @DisplayName("requests money from a contact and shows it as an incoming amount")
  void requestsMoney() {
    var payee = SeedUsers.contact();
    String description = "Selenium request " + System.currentTimeMillis();

    new NewTransactionPage(driver)
        .open()
        .selectContact(payee.id(), payee.firstName())
        .enterDetails("12.00", description)
        .request()
        .awaitConfirmation()
        .backToFeeds();

    var row = new TransactionFeedPage(driver).openFeed(Feed.MINE).findByDescription(description);

    assertThat(row).isPresent();
    // A request moves money towards the sender, so the sign flips.
    assertThat(row.orElseThrow().getText()).contains("+$12.00");
  }

  @Test
  @DisplayName("disables both submit buttons once the amount is touched and left empty")
  void disablesSubmitAfterInvalidAmount() {
    var payee = SeedUsers.contact();

    NewTransactionPage page =
        new NewTransactionPage(driver).open().selectContact(payee.id(), payee.firstName());

    // Pristine means ENABLED here — Formik starts with `isValid === true` and
    // the buttons are bound to `disabled={!isValid || isSubmitting}`.
    assertThat(page.isPaymentEnabled()).as("pristine payment button").isTrue();
    assertThat(page.isRequestEnabled()).as("pristine request button").isTrue();

    page.touchAndClearAmount();
    assertThat(page.isPaymentEnabled()).as("after clearing the amount").isFalse();
    assertThat(page.isRequestEnabled()).as("after clearing the amount").isFalse();
  }
}
