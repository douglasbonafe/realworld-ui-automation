import { expect, type Locator, type Page } from "@playwright/test";

export interface NewAccount {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

/** Page object for /signup. */
export class SignUpPage {
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId("signup-title");
    this.firstName = page.getByTestId("signup-first-name").locator("input");
    this.lastName = page.getByTestId("signup-last-name").locator("input");
    this.username = page.getByTestId("signup-username").locator("input");
    this.password = page.getByTestId("signup-password").locator("input");
    this.confirmPassword = page.getByTestId("signup-confirmPassword").locator("input");
    this.submit = page.getByTestId("signup-submit");
  }

  async goto(): Promise<void> {
    await this.page.goto("/signup");
    await expect(this.title).toBeVisible();
  }

  async register(account: NewAccount): Promise<void> {
    await this.firstName.fill(account.firstName);
    await this.lastName.fill(account.lastName);
    await this.username.fill(account.username);
    await this.password.fill(account.password);
    await this.confirmPassword.fill(account.password);
    await this.submit.click();
  }

  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submit).toBeDisabled();
  }
}
