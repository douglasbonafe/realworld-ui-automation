import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DEFAULT_PASSWORD, PRIMARY_USER, STORAGE_STATE } from "./seed-users";
import { SignInPage } from "../pages/SignInPage";

/**
 * Authentication setup — runs once per `playwright test` invocation.
 *
 * Deliberately logs in through the **UI**, not the API. The point is to store a
 * session that is indistinguishable from a real one: same cookies, same
 * localStorage, same XState machine state. An API shortcut is faster but can
 * drift from what the browser actually ends up holding, and then every test
 * inherits that drift.
 *
 * The cost is paid once. Individual tests start already authenticated.
 */
setup("authenticate as the primary seed user", async ({ page }) => {
  mkdirSync(dirname(STORAGE_STATE), { recursive: true });

  const signIn = new SignInPage(page);
  await signIn.goto();
  await signIn.signInAs(PRIMARY_USER.username, DEFAULT_PASSWORD);

  // Do not save state until the app has genuinely finished authenticating.
  // Saving too early stores a half-written session and produces failures in
  // unrelated tests that are very hard to trace back to here.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("sidenav-username")).toContainText(`@${PRIMARY_USER.username}`);

  await page.context().storageState({ path: STORAGE_STATE });
});
