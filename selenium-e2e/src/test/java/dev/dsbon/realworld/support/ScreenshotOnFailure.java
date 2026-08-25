package dev.dsbon.realworld.support;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.extension.AfterTestExecutionCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.openqa.selenium.WebDriver;

/**
 * Captures a screenshot, the current URL and the page source when a test fails.
 *
 * <p>---------------------------------------------------------------------------
 * WHY {@link AfterTestExecutionCallback} AND NOT {@code TestWatcher}
 * ---------------------------------------------------------------------------
 *
 * <p>The obvious implementation is {@code TestWatcher.testFailed}. It compiles,
 * it runs, and it captures nothing — because JUnit fires {@code testFailed}
 * <b>after</b> {@code @AfterEach}, and {@code @AfterEach} is where the browser is
 * quit. Every capture then throws on a dead session, and the {@code catch} that
 * exists so a screenshot problem cannot mask a real failure swallows it silently.
 *
 * <p>The result is the worst kind of diagnostic: a CI job that uploads an empty
 * artifact and looks like it is working. That is exactly what happened here —
 * three red runs produced zero screenshots before anyone looked at the folder.
 *
 * <p>{@link AfterTestExecutionCallback} fires immediately after the test method
 * and <b>before</b> {@code @AfterEach}, so the browser is still alive.
 *
 * <p>The driver comes from a {@link ThreadLocal} because JUnit constructs the
 * extension before the {@code @BeforeEach} that creates the browser, and because
 * parallel execution gives each test its own thread.
 */
public class ScreenshotOnFailure implements AfterTestExecutionCallback {

  private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();

  static void register(WebDriver driver) {
    DRIVER.set(driver);
  }

  @Override
  public void afterTestExecution(ExtensionContext context) {
    WebDriver driver = DRIVER.get();
    try {
      if (context.getExecutionException().isEmpty() || driver == null) {
        return;
      }

      String name =
          (context.getRequiredTestClass().getSimpleName()
                  + "."
                  + context.getRequiredTestMethod().getName())
              .replaceAll("[^A-Za-z0-9._-]", "_");

      System.out.println("FAILURE at URL: " + driver.getCurrentUrl());
      System.out.println("Screenshot: " + BaseTest.capture(driver, name));

      // The page source is what actually tells you whether an element was
      // missing, present but hidden, or present under a different selector —
      // which a screenshot alone cannot distinguish.
      Path html = Path.of("target", "screenshots", name + ".html");
      Files.writeString(html, driver.getPageSource());
      System.out.println("Page source: " + html);
    } catch (Exception ignored) {
      // Never let a diagnostics problem mask the assertion that actually failed.
    } finally {
      DRIVER.remove();
    }
  }
}
