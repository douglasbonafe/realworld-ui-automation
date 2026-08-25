package dev.dsbon.realworld.support;

import java.util.List;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

/**
 * Builds the {@link WebDriver} for a test.
 *
 * <p>No driver binaries are managed here and none are committed: Selenium Manager
 * (bundled since Selenium 4.6) resolves and downloads the driver matching the
 * installed browser on first use. Deleting the old WebDriverManager dependency is
 * the single biggest simplification available to a Selenium suite in 2026.
 */
public final class DriverFactory {

  /**
   * Arguments that matter for CI stability rather than for the test itself.
   *
   * <ul>
   *   <li>{@code --no-sandbox} and {@code --disable-dev-shm-usage} — required
   *       inside most Linux containers, where the default /dev/shm is 64 MB and
   *       Chrome crashes without warning once it fills up.
   *   <li>{@code --window-size} — matches the 1280x1000 viewport the Cypress and
   *       Playwright suites use, so all three exercise the same responsive
   *       breakpoints and the same visible navigation.
   * </ul>
   */
  private static final List<String> CHROMIUM_ARGS =
      List.of(
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1280,1000",
          "--disable-search-engine-choice-screen");

  private DriverFactory() {}

  public static WebDriver create() {
    return switch (TestConfig.BROWSER.toLowerCase()) {
      case "chrome" -> chrome();
      case "firefox" -> firefox();
      case "edge" -> edge();
      default ->
          throw new IllegalArgumentException(
              "Unsupported browser \"%s\". Use chrome, firefox or edge."
                  .formatted(TestConfig.BROWSER));
    };
  }

  private static WebDriver chrome() {
    ChromeOptions options = new ChromeOptions();
    options.addArguments(CHROMIUM_ARGS);
    if (TestConfig.HEADLESS) {
      options.addArguments("--headless=new");
    }
    return new ChromeDriver(options);
  }

  private static WebDriver firefox() {
    FirefoxOptions options = new FirefoxOptions();
    options.addArguments("--width=1280", "--height=1000");
    if (TestConfig.HEADLESS) {
      options.addArguments("-headless");
    }
    return new FirefoxDriver(options);
  }

  private static WebDriver edge() {
    EdgeOptions options = new EdgeOptions();
    options.addArguments(CHROMIUM_ARGS);
    if (TestConfig.HEADLESS) {
      options.addArguments("--headless=new");
    }
    return new EdgeDriver(options);
  }
}
