import { test as base, expect } from "@playwright/test";
import { STORAGE_STATE } from "./seed-users";
import { SignInPage } from "../pages/SignInPage";
import { SignUpPage } from "../pages/SignUpPage";
import { SideNav } from "../pages/SideNav";
import { TransactionFeedPage } from "../pages/TransactionFeedPage";
import { NewTransactionPage } from "../pages/NewTransactionPage";
import { UserSettingsPage } from "../pages/UserSettingsPage";
import { OnboardingDialog } from "../pages/OnboardingDialog";

/**
 * Two test objects, exported side by side:
 *
 *   `test`     — already signed in as the primary seed user. Use for everything
 *                that is not about authentication.
 *   `anonTest` — a clean browser context with no session. Use for sign-in,
 *                sign-up and sign-out.
 *
 * Both inject page objects as fixtures. That removes a line of boilerplate per
 * object per test and — more usefully — lets a page object later grow a
 * dependency (an API client, a logger) without touching a single test.
 */
interface Pages {
  signInPage: SignInPage;
  signUpPage: SignUpPage;
  sideNav: SideNav;
  feedPage: TransactionFeedPage;
  newTransactionPage: NewTransactionPage;
  userSettingsPage: UserSettingsPage;
  onboarding: OnboardingDialog;
}

const testWithPages = base.extend<Pages>({
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },
  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page));
  },
  sideNav: async ({ page }, use) => {
    await use(new SideNav(page));
  },
  feedPage: async ({ page }, use) => {
    await use(new TransactionFeedPage(page));
  },
  newTransactionPage: async ({ page }, use) => {
    await use(new NewTransactionPage(page));
  },
  userSettingsPage: async ({ page }, use) => {
    await use(new UserSettingsPage(page));
  },
  onboarding: async ({ page }, use) => {
    await use(new OnboardingDialog(page));
  },
});

/** Authenticated: reuses the session written by fixtures/auth.setup.ts. */
export const test = testWithPages;
test.use({ storageState: STORAGE_STATE });

/**
 * Anonymous: derived from the same base, then overridden with an empty storage
 * state so the application treats the browser as a first-time visitor.
 */
export const anonTest = testWithPages.extend({});
anonTest.use({ storageState: { cookies: [], origins: [] } });

export { expect };
