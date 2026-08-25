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
    // Check the TARGET, not the hamburger.
    //
    // The first version of this asked "is the toggle visible?" and clicked it if
    // so. On a desktop viewport the toggle is visible AND the drawer is already
    // open, so that click CLOSED the drawer and the sign-out item became
    // unclickable — a self-inflicted timeout that only appeared in CI.
    //
    // Asking whether sign-out itself is reachable is correct at every viewport.
    if (!(await this.signOut.isVisible())) {
      await this.page.getByTestId("sidenav-toggle").click();
    }
    await this.signOut.click();
  }
}
