package dev.dsbon.realworld.support;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;
import org.openqa.selenium.WebDriver;

/**
 * Captures a screenshot when a test fails.
 *
 * <p>The driver is held in a {@link ThreadLocal} rather than passed in, because
 * JUnit creates the extension before the {@code @BeforeEach} that builds the
 * browser, and because parallel execution gives each test its own thread. The
 * same field therefore works whether the suite runs on one thread or eight.
 *
 * <p>Screenshot capture is best-effort: a browser that crashed hard cannot be
 * photographed, and swallowing that secondary failure keeps the *real* failure
 * as the one reported.
 */
public class ScreenshotOnFailure implements TestWatcher {

  private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();

  static void register(WebDriver driver) {
    DRIVER.set(driver);
  }

  @Override
  public void testFailed(ExtensionContext context, Throwable cause) {
    WebDriver driver = DRIVER.get();
    if (driver == null) {
      return;
    }
    String name =
        (context.getRequiredTestClass().getSimpleName()
                + "."
                + context.getRequiredTestMethod().getName())
            .replaceAll("[^A-Za-z0-9._-]", "_");
    try {
      System.out.println("Screenshot written to " + BaseTest.capture(driver, name));
    } catch (Exception ignored) {
      // Never let a screenshot problem mask the assertion that actually failed.
    }
  }

  @Override
  public void testSuccessful(ExtensionContext context) {
    DRIVER.remove();
  }
}
