package dev.dsbon.realworld.tests;

import static org.assertj.core.api.Assertions.assertThat;

import dev.dsbon.realworld.pages.SideNav;
import dev.dsbon.realworld.pages.TransactionFeedPage;
import dev.dsbon.realworld.pages.TransactionFeedPage.Feed;
import dev.dsbon.realworld.support.BaseTest;
import dev.dsbon.realworld.support.SeedUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

@DisplayName("Transaction feeds")
class TransactionFeedTest extends BaseTest {

  @BeforeEach
  void signIn() {
    signInAsPrimaryUser();
  }

  /**
   * One parameterized test covering all three feeds. JUnit reports each enum
   * constant as its own case, so a failure names the feed that broke instead of
   * hiding inside a loop.
   */
  @ParameterizedTest(name = "renders the {0} feed with at least one transaction")
  @EnumSource(Feed.class)
  void rendersFeed(Feed feed) {
    assertThat(new TransactionFeedPage(driver).open().openFeed(feed).itemCount())
        .isGreaterThanOrEqualTo(1);
  }

  @Test
  @DisplayName("opens a transaction from the public feed and shows its detail page")
  void opensTransactionDetail() {
    TransactionFeedPage page =
        new TransactionFeedPage(driver).open().openFeed(Feed.EVERYONE).openFirstTransaction();

    assertThat(page.currentPath()).matches("/transaction/.+");
  }

  @Test
  @DisplayName("shows the signed-in user's identity and balance in the drawer")
  void showsUserIdentity() {
    var user = SeedUsers.primary();
    new TransactionFeedPage(driver).open();

    SideNav nav = new SideNav(driver).awaitVisible();

    // Username, NOT the seeded first and last name.
    //
    // This test used to assert the drawer showed "Ted P", and it broke the
    // moment UserSettingsTest started working: that test renames the shared
    // seeded account, JUnit runs the two classes concurrently, and a screenshot
    // caught the drawer reading "New069687 N" while this assertion demanded
    // "Ted". The account was not corrupt — this test was asserting a value
    // another test legitimately owns.
    //
    // The username is immutable in this app, so it identifies the session
    // without depending on data any other test may rewrite. The full-name
    // rendering is worth covering, but it belongs to a test that owns the
    // profile — which is exactly what UserSettingsTest does.
    assertThat(nav.username()).contains("@" + user.username());
    assertThat(nav.fullName()).isNotBlank();
    assertThat(nav.balance()).matches("\\$[\\d,]+\\.\\d{2}");
  }
}
