import { expect, type Locator, type Page } from "@playwright/test";

export interface ProfileFields {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

/** Page object for /user/settings. */
export class UserSettingsPage {
  readonly form: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly phoneNumber: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId("user-settings-form");
    // No `.locator("input")` here: all four settings fields pass the attribute
    // through `inputProps`, so it already sits on the <input> itself. Six fields
    // in this app do that — see the list in the Cypress selectors file.
    this.firstName = page.getByTestId("user-settings-firstName-input");
    this.lastName = page.getByTestId("user-settings-lastName-input");
    this.email = page.getByTestId("user-settings-email-input");
    this.phoneNumber = page.getByTestId("user-settings-phoneNumber-input");
    this.submit = page.getByTestId("user-settings-submit");
  }

  async goto(): Promise<void> {
    await this.page.goto("/user/settings");
    await expect(this.form).toBeVisible();
  }

  async fill(fields: ProfileFields): Promise<void> {
    await this.firstName.fill(fields.firstName);
    await this.lastName.fill(fields.lastName);
    await this.email.fill(fields.email);
    await this.phoneNumber.fill(fields.phoneNumber);
  }

  /**
   * Save, wait for the PATCH, then wait for the client to reflect it.
   *
   * `waitForResponse` is armed *before* the click, so there is no window in
   * which the response could arrive before anyone is listening — the classic
   * way this pattern is written wrong.
   *
   * The second wait was added after a WebKit-only failure: 16 tests passed and
   * `persistsProfile` failed, because a `page.reload()` fired immediately after
   * the 204 re-rendered the form from a user object the client had not yet
   * refreshed. Chromium and Firefox happened to win that race; WebKit did not.
   *
   * The navigation drawer showing the new first name proves the client has the
   * updated user, not just the server. It is the same signal the Selenium suite
   * waits on, which keeps the three implementations comparable.
   */
  async save(expectedFirstName: string): Promise<void> {
    const response = this.page.waitForResponse(
      (r) => r.request().method() === "PATCH" && /\/users\/[^/]+$/.test(new URL(r.url()).pathname),
    );
    await this.submit.click();
    expect((await response).status()).toBe(204);

    await expect(this.page.getByTestId("sidenav-user-full-name")).toContainText(expectedFirstName);
  }

  async expectValues(fields: ProfileFields): Promise<void> {
    await expect(this.firstName).toHaveValue(fields.firstName);
    await expect(this.lastName).toHaveValue(fields.lastName);
    await expect(this.email).toHaveValue(fields.email);
    await expect(this.phoneNumber).toHaveValue(fields.phoneNumber);
  }

  async clearFirstName(): Promise<void> {
    await this.firstName.fill("");
    await this.firstName.blur();
  }

  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submit).toBeDisabled();
  }
}
