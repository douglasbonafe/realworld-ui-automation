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
