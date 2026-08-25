package dev.dsbon.realworld.support;

import dev.dsbon.realworld.pages.SideNav;
import dev.dsbon.realworld.pages.SignInPage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

/**
 * Lifecycle shared by every test class: one fresh browser per test method, and a
 * screenshot on the way out if the test failed.
 *
 * <p>A fresh browser per test is the expensive choice — Cypress reuses one and
 * Playwright reuses a browser with a fresh context — but it buys total isolation
 * without any of the cookie-clearing rituals that make suites subtly
 * order-dependent. {@link ScreenshotOnFailure} is what makes a CI failure
 * diagnosable, since there is no trace viewer in this stack.
 */
@ExtendWith(ScreenshotOnFailure.class)
public abstract class BaseTest {

  protected WebDriver driver;

  @BeforeEach
  void startBrowser() {
    driver = DriverFactory.create();
    ScreenshotOnFailure.register(driver);
  }

  @AfterEach
  void stopBrowser() {
    if (driver != null) {
      driver.quit();
    }
  }

  /**
   * Sign in through the UI, and do not return until the session actually exists.
   *
   * <p>The final {@code awaitVisible()} is the whole point. Clicking submit only
   * <i>starts</i> the login: the request is in flight, the XState machine has not
   * transitioned, and the app is still unauthenticated. A helper that returns
   * there lets the next line navigate to a protected route mid-login, get
   * redirected to /signin, and fail with "element never found" — a symptom that
   * looks nothing like its cause.
   *
   * <p>The first CI run on this repository showed exactly that: the feed tests
   * passed (they navigate to "/", which is where login lands anyway) while the
   * payment and settings tests failed, from one shared root cause.
   *
   * <p>Selenium has no equivalent of {@code cy.session()} or Playwright's
   * {@code storageState}, so every test that needs a session pays for a real
   * login. That cost is the honest trade-off of the stack — see
   * docs/framework-comparison.md.
   */
  protected void signInAsPrimaryUser() {
    new SignInPage(driver)
        .open()
        .signInAs(SeedUsers.primary().username(), SeedUsers.defaultPassword());
    new SideNav(driver).awaitVisible();
  }

  /** Saves a PNG under target/screenshots and returns its path. */
  static Path capture(WebDriver driver, String name) throws IOException {
    Path dir = Path.of("target", "screenshots");
    Files.createDirectories(dir);
    Path target = dir.resolve(name + ".png");
    Files.write(target, ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES));
    return target;
  }
}
