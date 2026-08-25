import { test as base, expect } from "@playwright/test";
import { SignInPage } from "../pages/SignInPage";
import { SignUpPage } from "../pages/SignUpPage";
import { SideNav } from "../pages/SideNav";
import { TransactionFeedPage } from "../pages/TransactionFeedPage";
import { NewTransactionPage } from "../pages/NewTransactionPage";
import { UserSettingsPage } from "../pages/UserSettingsPage";
import { OnboardingDialog } from "../pages/OnboardingDialog";

/**
 * One `test` object, with the page objects injected as fixtures.
 *
 * That removes a line of boilerplate per object per test and — more usefully —
 * lets a page object later grow a dependency (an API client, a logger) without
 * touching a single test.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE SESSION COMES FROM, AND WHY NOT FROM HERE
 * ---------------------------------------------------------------------------
 * Authentication is applied in `playwright.config.ts`, where every browser
 * project declares `use: { storageState: STORAGE_STATE }`.
 *
 * The tempting alternative — exporting two objects from this file, one with
 * `test.use({ storageState })` and one without — does not work, and it fails
 * silently. `test.use()` only takes effect when it is called inside a **spec
 * file** (or a `describe` block). Called at the top level of an imported helper
 * module it is quietly ignored: no error, no warning, and every "authenticated"
 * test runs anonymous.
 *
 * The first CI run on this repository hit exactly that: the seven auth tests
 * (which want an anonymous context anyway) mostly passed, while all twelve
 * authenticated tests failed with "nav-transaction-tabs never found" — a
 * failure that looks like a broken app and is really a broken fixture.
 *
 * A spec that needs an anonymous context overrides it *in the spec file*:
 *
 *     test.use({ storageState: { cookies: [], origins: [] } });
 *
 * See `tests/auth.spec.ts`.
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

export const test = base.extend<Pages>({
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

export { expect };
