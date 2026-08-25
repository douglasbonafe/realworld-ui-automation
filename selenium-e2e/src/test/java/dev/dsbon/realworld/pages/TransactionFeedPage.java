package dev.dsbon.realworld.pages;

import java.util.List;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

/** The three transaction feeds behind the tabs on the home screen. */
public class TransactionFeedPage extends BasePage {

  private static final By TABS = testId("nav-transaction-tabs");
  private static final By LIST = testId("transaction-list");
  private static final By SKELETON = testId("list-skeleton");
  private static final By ITEMS = By.cssSelector("[data-test='transaction-list'] li");
  private static final By DETAIL_HEADER = testId("transaction-detail-header");
  private static final By NEW_TRANSACTION = testId("nav-top-new-transaction");

  public TransactionFeedPage(WebDriver driver) {
    super(driver);
  }

  public enum Feed {
    EVERYONE("nav-public-tab", "/"),
    FRIENDS("nav-contacts-tab", "/contacts"),
    MINE("nav-personal-tab", "/personal");

    private final String testId;
    private final String path;

    Feed(String testId, String path) {
      this.testId = testId;
      this.path = path;
    }

    By locator() {
      return By.cssSelector("[data-test='%s']".formatted(testId));
    }

    String path() {
      return path;
    }
  }

  public TransactionFeedPage open() {
    navigateTo("/");
    visible(TABS);
    return this;
  }

  /**
   * Switch feeds, and verify the switch actually happened.
   *
   * <p>A plain click here produced the single most misleading failure of this
   * whole suite. The tab click was swallowed by a React re-render, the app stayed
   * on "Everyone", and a payment test then searched the PUBLIC feed for a
   * transaction that was sitting in the personal one. The screenshot showed the
   * money had moved correctly and the balance was right — the test was simply
   * looking in the wrong place, and said "transaction not found".
   *
   * <p>Switching tabs is idempotent, so the looping variant is safe, and the URL
   * is an unambiguous outcome to settle on.
   */
  public TransactionFeedPage openFeed(Feed feed) {
    clickUntil(feed.locator(), d -> feed.path().equals(pathOf(d.getCurrentUrl())));
    awaitList();
    return this;
  }

  private static String pathOf(String url) {
    String path = java.net.URI.create(url).getPath();
    return path == null || path.isEmpty() ? "/" : path;
  }

  /**
   * The list renders a skeleton placeholder while data is in flight, so its
   * disappearance is a deterministic "rendering finished" signal — which is why
   * this suite contains no {@code Thread.sleep}.
   */
  public TransactionFeedPage awaitList() {
    waitUntilAbsent(SKELETON);
    visible(LIST);
    return this;
  }

  public int itemCount() {
    return allOf(ITEMS).size();
  }

  /** The row whose text contains the given description, or empty if absent. */
  public java.util.Optional<WebElement> findByDescription(String description) {
    return wait.until(
        d -> {
          List<WebElement> matches =
              d.findElements(ITEMS).stream().filter(e -> e.getText().contains(description)).toList();
          // Returning empty would end the wait immediately; returning null keeps
          // WebDriverWait polling until the row renders or the timeout expires.
          return matches.isEmpty() ? null : java.util.Optional.of(matches.getFirst());
        });
  }

  /**
   * Open the first row in the current feed.
   *
   * <p>The feed is an infinite list that re-renders as more rows stream in, so a
   * single dispatched click can hit a row React is replacing. Clicking until the
   * detail header appears verifies the real outcome instead of the dispatch.
   */
  public TransactionFeedPage openFirstTransaction() {
    awaitList();
    clickUntil(ITEMS, d -> isVisible(d, DETAIL_HEADER));
    return this;
  }

  public void startNewTransaction() {
    click(NEW_TRANSACTION);
  }
}
