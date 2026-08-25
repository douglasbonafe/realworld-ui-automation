import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Page object for /signin.
 *
 * Locators are declared once in the constructor as *lazy* `Locator` objects.
 * A Playwright locator is a query, not a resolved element — it is re-evaluated
 * on every use, so a locator built before a re-render still points at the right
 * node afterwards. That is why the classic "stale element" failure mode simply
 * does not exist here.
 *
 * Note the `.locator("input")` suffixes: this application puts `data-test` on
 * the Material UI `TextField` wrapper, not on the field itself.
 */
export class SignInPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly rememberMe: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly signUpLink: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByTestId("signin-username").locator("input");
    this.password = page.getByTestId("signin-password").locator("input");
    this.rememberMe = page.getByTestId("signin-remember-me").locator("input");
    this.submit = page.getByTestId("signin-submit");
    this.error = page.getByTestId("signin-error");
    this.signUpLink = page.getByTestId("signup");
  }

  async goto(): Promise<void> {
    await this.page.goto("/signin");
    await expect(this.username).toBeVisible();
  }

  async signInAs(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.error).toBeVisible();
    await expect(this.error).toHaveText(message);
  }

  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submit).toBeDisabled();
  }

  async expectSubmitEnabled(): Promise<void> {
    await expect(this.submit).toBeEnabled();
  }

  /**
   * Touch a field and leave it invalid, so Formik marks the form invalid.
   *
   * The button is bound to `disabled={!isValid || isSubmitting}`, and Formik
   * starts with `isValid === true` — so a pristine form has an ENABLED button.
   * It only becomes disabled after a field has been touched and failed
   * validation. Typing, clearing and blurring is the shortest route there.
   */
  async touchAndClearUsername(): Promise<void> {
    await this.username.fill("x");
    await this.username.fill("");
    await this.username.blur();
  }

  async typeShortPasswordAndBlur(): Promise<void> {
    await this.password.fill("abc");
    await this.password.blur();
  }

  async expectUsernameRequired(): Promise<void> {
    await expect(this.page.locator("#username-helper-text")).toContainText("Username is required");
  }

  async expectPasswordTooShort(): Promise<void> {
    await expect(this.page.locator("#password-helper-text")).toContainText(
      "Password must contain at least 4 characters",
    );
  }

  async expectVisible(): Promise<void> {
    await expect(this.username).toBeVisible();
    await expect(this.submit).toBeVisible();
  }
}
