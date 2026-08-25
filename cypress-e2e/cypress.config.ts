import { defineConfig } from "cypress";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Read the shared fixture with `fs` rather than `import ... from "*.json"`.
 * JSON module imports need an import attribute under Node ESM but not under the
 * CommonJS transpile some tooling still applies, and the config file is the one
 * place where that difference bites. Reading the file sidesteps the question.
 */
const seed = JSON.parse(
  readFileSync(fileURLToPath(new URL("../shared/seed-users.json", import.meta.url)), "utf8"),
) as {
  defaultPassword: string;
  users: Array<{ id: string; username: string; firstName: string; lastName: string; role: string }>;
};

/**
 * The app under test is cypress-realworld-app running locally:
 *   - React dev server on http://localhost:3000  (the UI we drive)
 *   - Express API on     http://localhost:3001  (used only for the fast login path)
 *
 * Both are started by a single `yarn dev` inside the app repo. Override either
 * URL from the environment so the same suite can run against a container, a
 * preview deployment, or a colleague's machine without editing this file:
 *
 *   CYPRESS_BASE_URL=http://rwa.local:3000 npm test
 *   CYPRESS_apiUrl=http://rwa.local:3001   npm test
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    fixturesFolder: "cypress/fixtures",

    // The app ships a 1280x1000 viewport in its own config; matching it keeps the
    // responsive breakpoints (and therefore the visible navigation) identical.
    viewportWidth: 1280,
    viewportHeight: 1000,

    video: false,
    screenshotOnRunFailure: true,

    // Two retries in CI, none locally. Locally a flake should be loud so you fix
    // it; in CI a retry keeps an unrelated PR from being blocked by infrastructure
    // noise. Every retry is still reported, so persistent flake stays visible.
    retries: { runMode: 2, openMode: 0 },

    // Default 4s. The RWA dev server is Vite + an in-memory JSON database, so
    // most interactions settle well under a second; 8s covers the cold first
    // paint after the dev server compiles a route on demand.
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,

    env: {
      apiUrl: process.env.CYPRESS_apiUrl ?? "http://localhost:3001",
      // Seed users are shared with the Playwright and Selenium suites through
      // ../shared/seed-users.json, so all three run against the same accounts.
      defaultPassword: seed.defaultPassword,
      seedUsers: seed.users,
    },

    setupNodeEvents(on) {
      // Surface `cy.task("log", ...)` output in the terminal during headless runs,
      // where the browser console is not visible.
      on("task", {
        log(message: string) {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
        },
      });
    },
  },
});
