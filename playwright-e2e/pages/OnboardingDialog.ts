import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The modal first-run wizard shown to a user with no bank account.
 *
 * It blocks every other interaction until completed, so any test that registers
 * a fresh account has to expect it.
 */
export class OnboardingDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly next: Locator;

  constructor(page: Page) {
    this.dialog = page.getByTestId("user-onboarding-dialog");
    this.title = page.getByTestId("user-onboarding-dialog-title");
    this.next = page.getByTestId("user-onboarding-next");
  }

  async expectVisible(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await expect(this.title).toContainText("Get Started");
  }

  async expectAbsent(): Promise<void> {
    await expect(this.dialog).toHaveCount(0);
  }
}
