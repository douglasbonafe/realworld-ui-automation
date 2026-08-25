import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

/**
 * Playwright configuration for cypress-realworld-app.
 *
 * Two decisions here shape the whole suite:
 *
 * 1. `testIdAttribute: "data-test"` rewires `page.getByTestId()` onto the
 *    attribute this application actually uses (Playwright defaults to
 *    `data-testid`). Every page object can then read as `getByTestId("sidenav")`
 *    instead of carrying raw CSS strings.
 *
 * 2. A `setup` project logs in once and writes the session to disk; the test
 *    projects declare `dependencies: ["setup"]` and reuse it. Authentication is
 *    paid for once per run, not once per test.
 */
export default defineConfig({
  testDir: ".",
  outputDir: "test-results",

  // Real parallelism: Playwright runs each file in its own worker process.
  // Halved on CI because shared runners have fewer cores than a dev laptop.
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  // Fail the run if someone leaves a `test.only` in a committed file.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["junit", { outputFile: "test-results/junit.xml" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    // Traces are the single highest-value setting in this file: on the first
    // retry Playwright records a full DOM/network/console timeline you can step
    // through afterwards, which usually turns "flaky in CI" into a five-minute
    // diagnosis.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    testIdAttribute: "data-test",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  expect: {
    // Web-first assertions retry until this deadline, which is what removes the
    // need for explicit sleeps anywhere in the suite.
    timeout: 8_000,
  },

  projects: [
    {
      name: "setup",
      testMatch: /fixtures\/auth\.setup\.ts/,
    },
    {
      name: "chromium",
      testMatch: /tests\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 1000 } },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      testMatch: /tests\/.*\.spec\.ts/,
      use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 1000 } },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      testMatch: /tests\/.*\.spec\.ts/,
      use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 1000 } },
      dependencies: ["setup"],
    },
    {
      name: "mobile-chrome",
      testMatch: /tests\/.*\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
      dependencies: ["setup"],
    },
  ],

  /**
   * Optional: let Playwright start the application itself.
   *
   * Enabled by setting RWA_PATH to a checkout of cypress-realworld-app. Without
   * it the suite assumes the app is already running, which is the usual local
   * workflow (`yarn dev` in one terminal, tests in another).
   */
  ...(process.env.RWA_PATH
    ? {
        webServer: {
          command: "yarn dev",
          cwd: process.env.RWA_PATH,
          url: BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      }
    : {}),
});
