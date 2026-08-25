import { expect, type Locator, type Page } from "@playwright/test";

/** The three-step "new transaction" wizard at /transaction/new. */
export class NewTransactionPage {
  readonly search: Locator;
  readonly form: Locator;
  readonly amount: Locator;
  readonly description: Locator;
  readonly submitPayment: Locator;
  readonly submitRequest: Locator;
  readonly returnToTransactions: Locator;
  readonly createAnother: Locator;

  constructor(private readonly page: Page) {
    // Exception to the wrapper rule: the app passes this one through
    // `inputProps`, so the attribute is already on the <input>.
    this.search = page.getByTestId("user-list-search-input");
    this.form = page.getByTestId("transaction-create-form");
    this.amount = page.getByTestId("transaction-create-amount-input").locator("input");
    this.description = page.getByTestId("transaction-create-description-input").locator("input");
    this.submitPayment = page.getByTestId("transaction-create-submit-payment");
    this.submitRequest = page.getByTestId("transaction-create-submit-request");
    this.returnToTransactions = page.getByTestId("new-transaction-return-to-transactions");
    this.createAnother = page.getByTestId("new-transaction-create-another-transaction");
  }

  async goto(): Promise<void> {
    await this.page.goto("/transaction/new");
    await expect(this.search).toBeVisible();
  }

  /** Step 1 — the search is debounced, so wait for the specific row. */
  async selectContact(userId: string, searchTerm: string): Promise<void> {
    await this.search.fill(searchTerm);
    await this.page.getByTestId(`user-list-item-${userId}`).click();
    await expect(this.form).toBeVisible();
  }

  /** Step 2 — amount in dollars, e.g. "25.50". Empty strings leave a field blank. */
  async enterDetails(amount: string, description: string): Promise<void> {
    await this.amount.fill(amount);
    await this.description.fill(description);
  }

  async pay(): Promise<void> {
    await this.submitPayment.click();
  }

  async request(): Promise<void> {
    await this.submitRequest.click();
  }

  async expectConfirmation(): Promise<void> {
    await expect(this.returnToTransactions).toBeVisible();
    await expect(this.createAnother).toBeVisible();
  }

  async backToFeeds(): Promise<void> {
    await this.returnToTransactions.click();
  }

  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitPayment).toBeDisabled();
    await expect(this.submitRequest).toBeDisabled();
  }
}
