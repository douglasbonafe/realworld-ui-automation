import { expect, type Locator, type Page } from "@playwright/test";

/** The left navigation drawer, present on every authenticated screen. */
export class SideNav {
  readonly root: Locator;
  readonly username: Locator;
  readonly fullName: Locator;
  readonly balance: Locator;
  readonly signOut: Locator;
  readonly settings: Locator;
  readonly home: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId("sidenav");
    this.username = page.getByTestId("sidenav-username");
    this.fullName = page.getByTestId("sidenav-user-full-name");
    this.balance = page.getByTestId("sidenav-user-balance");
    this.signOut = page.getByTestId("sidenav-signout");
    this.settings = page.getByTestId("sidenav-user-settings");
    this.home = page.getByTestId("sidenav-home");
  }

  async expectSignedInAs(username: string): Promise<void> {
    await expect(this.username).toContainText(`@${username}`);
  }

  /** The drawer abbreviates the surname to an initial, e.g. "Ted P". */
  async expectFullName(firstName: string, lastName: string): Promise<void> {
    await expect(this.fullName).toContainText(firstName);
    await expect(this.fullName).toContainText(lastName.charAt(0));
  }

  /** Balances render as a localized USD string, e.g. "$1,509.53". */
  async expectFormattedBalance(): Promise<void> {
    await expect(this.balance).toHaveText(/^\$[\d,]+\.\d{2}$/);
  }

  async clickSignOut(): Promise<void> {
    // The drawer collapses behind a hamburger on narrow viewports, which the
    // mobile-chrome project uses. Opening it first keeps one page object valid
    // for every project instead of forcing a mobile-only variant.
    const toggle = this.page.getByTestId("sidenav-toggle");
    if (await toggle.isVisible()) {
      await toggle.click();
    }
    await this.signOut.click();
  }
}
