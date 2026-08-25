package dev.dsbon.realworld.support;

import java.time.Duration;

/**
 * Every knob the suite reads, resolved once.
 *
 * <p>System properties win over environment variables, and both win over the
 * defaults. That order is what lets the same jar run unchanged on a laptop
 * ({@code mvn test}), in CI (environment variables) and against a remote
 * environment ({@code -Dbase.url=...}).
 */
public final class TestConfig {

  public static final String BASE_URL = resolve("base.url", "BASE_URL", "http://localhost:3000");
  public static final String API_URL = resolve("api.url", "API_URL", "http://localhost:3001");
  public static final String BROWSER = resolve("browser", "BROWSER", "chrome");
  public static final boolean HEADLESS =
      Boolean.parseBoolean(resolve("headless", "HEADLESS", "true"));

  /**
   * The single explicit wait budget for the whole suite.
   *
   * <p>Selenium, unlike Cypress and Playwright, has no automatic retry built into
   * its assertions — waiting is something this suite has to do on purpose. One
   * shared budget keeps that decision in a single place rather than scattering
   * magic numbers across page objects.
   */
  public static final Duration TIMEOUT = Duration.ofSeconds(15);

  private TestConfig() {}

  private static String resolve(String systemProperty, String envVar, String fallback) {
    String fromProperty = System.getProperty(systemProperty);
    if (fromProperty != null && !fromProperty.isBlank()) {
      return fromProperty;
    }
    String fromEnv = System.getenv(envVar);
    if (fromEnv != null && !fromEnv.isBlank()) {
      return fromEnv;
    }
    return fallback;
  }
}
