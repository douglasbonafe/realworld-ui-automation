package dev.dsbon.realworld.pages;

import dev.dsbon.realworld.support.TestConfig;
import java.util.List;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Shared plumbing for the page objects.
 *
 * <p>Two things live here that Cypress and Playwright give you for free, and that
 * a Selenium suite must build once and then use everywhere:
 *
 * <ol>
 *   <li><b>Explicit waits.</b> Selenium's assertions do not retry. Every read
 *       goes through {@link #wait} so that "element not yet rendered" is handled
 *       in one place instead of by a {@code Thread.sleep} sprinkled per test.
 *       Implicit waits are deliberately <i>not</i> configured: mixing implicit
 *       and explicit waits produces unpredictable timeouts, and negative
 *       assertions ("this must not exist") become needlessly slow.
 *   <li><b>Test-id locators.</b> {@link #testId} and {@link #testIdInput} encode
 *       the application's one inconsistency — {@code data-test} usually sits on
 *       the Material UI wrapper, not on the {@code <input>} — so no page object
 *       has to remember it.
 * </ol>
 */
public abstract class BasePage {

  protected final WebDriver driver;
  protected final WebDriverWait wait;

  protected BasePage(WebDriver driver) {
    this.driver = driver;
    this.wait = new WebDriverWait(driver, TestConfig.TIMEOUT);
  }

  /** Matches the element carrying the attribute itself (buttons, links, text). */
  protected static By testId(String id) {
    return By.cssSelector("[data-test='%s']".formatted(id));
  }

  /** Matches the real control inside a Material UI TextField/Checkbox wrapper. */
  protected static By testIdInput(String id) {
    return By.cssSelector("[data-test='%s'] input".formatted(id));
  }

  protected void navigateTo(String path) {
    driver.get(TestConfig.BASE_URL + path);
  }

  protected WebElement visible(By locator) {
    return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
  }

  protected WebElement clickable(By locator) {
    return wait.until(ExpectedConditions.elementToBeClickable(locator));
  }

  protected void click(By locator) {
    clickable(locator).click();
  }

  /**
   * Click, check whether it took effect, and click again until it did.
   *
   * <p>This exists because of a difference between Selenium and the other two
   * frameworks that only shows up against a React app. Cypress and Playwright
   * re-resolve an element and re-check actionability on every retry, so a click
   * that lands in the middle of a re-render is retried transparently. WebDriver
   * resolves once and dispatches once: if React swaps the node out between the
   * lookup and the dispatch, the click hits a detached element and is silently
   * lost. No exception, no navigation — just a later timeout somewhere else.
   *
   * <p>This is bounded by the same {@link #wait} budget as everything else, and
   * it verifies a real outcome rather than sleeping, so it is a retry with a
   * condition rather than a blind one. It is used on the two interactions in
   * this app where the target re-renders as it is clicked: the debounced contact
   * list, and the navigation drawer while it animates.
   *
   * @param locator what to click
   * @param settled the outcome that means the click worked
   */
  protected void clickUntil(By locator, java.util.function.Predicate<WebDriver> settled) {
    wait.until(
        d -> {
          if (settled.test(d)) {
            return true;
          }
          WebElement target =
              d.findElements(locator).stream()
                  .filter(WebElement::isDisplayed)
                  .findFirst()
                  .orElse(null);
          if (target != null) {
            // Scroll first. WebDriver scrolls an element into view before
            // clicking, but inside a scrollable MUI list its idea of "into view"
            // can still leave the click point under a sticky header — which
            // surfaces as ElementClickInterceptedException, or worse, as a click
            // that silently lands on the wrong element.
            scrollIntoView(d, target);
            try {
              target.click();
            } catch (org.openqa.selenium.WebDriverException nativeClickFailed) {
              // Documented fallback, not a blanket workaround. A JS click
              // dispatches a real bubbling MouseEvent, so React's delegated
              // handler still fires, but it bypasses WebDriver's actionability
              // checks — meaning it would also mask a genuinely obscured
              // element. It runs only after a native click has already failed,
              // so the honest signal is tried first.
              jsClick(d, target);
            }
          }
          return settled.test(d);
        });
  }

  private static void scrollIntoView(WebDriver driver, WebElement element) {
    ((org.openqa.selenium.JavascriptExecutor) driver)
        .executeScript("arguments[0].scrollIntoView({block:'center'});", element);
  }

  private static void jsClick(WebDriver driver, WebElement element) {
    ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
  }

  /** True when at least one element matching the locator is rendered and visible. */
  protected static boolean isVisible(WebDriver driver, By locator) {
    return driver.findElements(locator).stream().anyMatch(WebElement::isDisplayed);
  }

  /**
   * Replace a field's contents.
   *
   * <p>{@code clear()} alone is not enough for a controlled React input: it wipes
   * the DOM value without firing the events React listens for, so the component's
   * state can stay stale. Selecting all and typing over the selection produces
   * the same key events a person would.
   */
  protected void fill(By locator, String value) {
    WebElement field = visible(locator);
    field.click();
    field.sendKeys(org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.CONTROL, "a"));
    field.sendKeys(org.openqa.selenium.Keys.DELETE);
    if (!value.isEmpty()) {
      field.sendKeys(value);
    }
  }

  protected String textOf(By locator) {
    return visible(locator).getText();
  }

  protected String valueOf(By locator) {
    return visible(locator).getDomProperty("value");
  }

  protected boolean isEnabled(By locator) {
    return visible(locator).isEnabled();
  }

  /**
   * Wait for a control to become enabled or disabled.
   *
   * <p>This pair exists because of the sharpest practical difference between
   * Selenium and the other two frameworks. {@code expect(button).toBeDisabled()}
   * in Playwright and {@code should("be.disabled")} in Cypress <b>retry</b> until
   * a deadline. {@link #isEnabled} reads once.
   *
   * <p>So a test that blurs a field and immediately asserts on the button is
   * reading the DOM before React has re-rendered — and it fails on a loaded CI
   * runner while passing on a fast laptop. That is not a flaky app; it is an
   * assertion with no wait in a framework that does not supply one.
   *
   * <p>Use {@link #isEnabled} only for a state that is already settled (a freshly
   * loaded form). Use these for any state reached through an interaction.
   */
  protected void awaitEnabled(By locator) {
    wait.until(d -> d.findElement(locator).isEnabled());
  }

  protected void awaitDisabled(By locator) {
    wait.until(d -> !d.findElement(locator).isEnabled());
  }

  /** Wait until an element's text contains the given fragment. */
  protected void awaitTextContains(By locator, String fragment) {
    wait.until(ExpectedConditions.textToBePresentInElementLocated(locator, fragment));
  }

  protected boolean isPresent(By locator) {
    return !driver.findElements(locator).isEmpty();
  }

  protected List<WebElement> allOf(By locator) {
    wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    return driver.findElements(locator);
  }

  protected void waitUntilAbsent(By locator) {
    wait.until(ExpectedConditions.invisibilityOfElementLocated(locator));
  }

  protected void waitForUrlMatching(String regex) {
    wait.until(d -> d.getCurrentUrl() != null && d.getCurrentUrl().matches(regex));
  }

  public String currentPath() {
    return java.net.URI.create(driver.getCurrentUrl()).getPath();
  }
}
