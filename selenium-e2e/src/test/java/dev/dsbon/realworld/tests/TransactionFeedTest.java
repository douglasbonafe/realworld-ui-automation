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

    assertThat(nav.username()).contains("@" + user.username());
    // The drawer abbreviates the surname to an initial, e.g. "Ted P".
    assertThat(nav.fullName())
        .contains(user.firstName())
        .contains(user.lastName().substring(0, 1));
    assertThat(nav.balance()).matches("\\$[\\d,]+\\.\\d{2}");
  }
}
