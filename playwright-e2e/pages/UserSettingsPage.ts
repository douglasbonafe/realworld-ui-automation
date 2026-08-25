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
    this.firstName = page.getByTestId("user-settings-firstName-input").locator("input");
    this.lastName = page.getByTestId("user-settings-lastName-input").locator("input");
    this.email = page.getByTestId("user-settings-email-input").locator("input");
    this.phoneNumber = page.getByTestId("user-settings-phoneNumber-input").locator("input");
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
   * Save and wait for the PATCH to complete.
   *
   * `waitForResponse` is armed *before* the click, so there is no window in
   * which the response could arrive before anyone is listening — the classic
   * way this pattern is written wrong.
   */
  async save(): Promise<void> {
    const response = this.page.waitForResponse(
      (r) => r.request().method() === "PATCH" && /\/users\/[^/]+$/.test(new URL(r.url()).pathname),
    );
    await this.submit.click();
    expect((await response).status()).toBe(204);
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
