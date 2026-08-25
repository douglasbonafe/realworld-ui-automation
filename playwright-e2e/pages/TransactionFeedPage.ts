import { expect, type Locator, type Page } from "@playwright/test";

export type FeedName = "everyone" | "friends" | "mine";

const FEED_TEST_IDS: Record<FeedName, string> = {
  everyone: "nav-public-tab",
  friends: "nav-contacts-tab",
  mine: "nav-personal-tab",
};

/** The three transaction feeds behind the tabs on the home screen. */
export class TransactionFeedPage {
  readonly list: Locator;
  readonly skeleton: Locator;
  readonly tabs: Locator;
  readonly newTransaction: Locator;

  constructor(private readonly page: Page) {
    this.list = page.getByTestId("transaction-list");
    this.skeleton = page.getByTestId("list-skeleton");
    this.tabs = page.getByTestId("nav-transaction-tabs");
    this.newTransaction = page.getByTestId("nav-top-new-transaction");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
    await expect(this.tabs).toBeVisible();
  }

  async openFeed(feed: FeedName): Promise<void> {
    await this.page.getByTestId(FEED_TEST_IDS[feed]).click();
    await this.waitForList();
  }

  /**
   * The list renders a skeleton placeholder while data is in flight, so its
   * disappearance is a deterministic "rendering finished" signal. This is the
   * whole reason the suite contains no `waitForTimeout`.
   */
  async waitForList(): Promise<void> {
    await expect(this.skeleton).toHaveCount(0);
    await expect(this.list).toBeVisible();
  }

  items(): Locator {
    return this.list.locator("li");
  }

  async expectNonEmpty(): Promise<void> {
    await expect(this.items().first()).toBeVisible();
  }

  /**
   * Find the row for a specific transaction and assert its formatted amount.
   *
   * `filter({ hasText })` narrows the list to the matching row and keeps the
   * assertion scoped to it — so a coincidental match elsewhere on the page
   * cannot make this pass by accident.
   */
  async expectTransaction(description: string, formattedAmount: string): Promise<void> {
    const row = this.items().filter({ hasText: description }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(formattedAmount);
  }

  async openFirstTransaction(): Promise<void> {
    await this.items().first().click();
    await expect(this.page.getByTestId("transaction-detail-header")).toBeVisible();
  }

  async startNewTransaction(): Promise<void> {
    await this.newTransaction.click();
  }
}
