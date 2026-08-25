package dev.dsbon.realworld.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** The three-step "new transaction" wizard at /transaction/new. */
public class NewTransactionPage extends BasePage {

  // Exception to the wrapper rule: the app passes this one through `inputProps`,
  // so the attribute already sits on the <input>.
  private static final By SEARCH = testId("user-list-search-input");
  private static final By FORM = testId("transaction-create-form");
  private static final By AMOUNT = testIdInput("transaction-create-amount-input");
  private static final By DESCRIPTION = testIdInput("transaction-create-description-input");
  private static final By SUBMIT_PAYMENT = testId("transaction-create-submit-payment");
  private static final By SUBMIT_REQUEST = testId("transaction-create-submit-request");
  private static final By RETURN_TO_TRANSACTIONS = testId("new-transaction-return-to-transactions");
  private static final By CREATE_ANOTHER = testId("new-transaction-create-another-transaction");

  public NewTransactionPage(WebDriver driver) {
    super(driver);
  }

  public NewTransactionPage open() {
    navigateTo("/transaction/new");
    visible(SEARCH);
    return this;
  }

  /** Step 1 — the search is debounced, so wait for the specific row to appear. */
  public NewTransactionPage selectContact(String userId, String searchTerm) {
    fill(SEARCH, searchTerm);
    click(By.cssSelector("[data-test='user-list-item-%s']".formatted(userId)));
    visible(FORM);
    return this;
  }

  /** Step 2 — amount in dollars, e.g. "25.50". An empty string leaves a field blank. */
  public NewTransactionPage enterDetails(String amount, String description) {
    fill(AMOUNT, amount);
    fill(DESCRIPTION, description);
    return this;
  }

  public NewTransactionPage pay() {
    click(SUBMIT_PAYMENT);
    return this;
  }

  public NewTransactionPage request() {
    click(SUBMIT_REQUEST);
    return this;
  }

  public NewTransactionPage awaitConfirmation() {
    visible(RETURN_TO_TRANSACTIONS);
    visible(CREATE_ANOTHER);
    return this;
  }

  public void backToFeeds() {
    click(RETURN_TO_TRANSACTIONS);
  }

  public boolean isPaymentEnabled() {
    return isEnabled(SUBMIT_PAYMENT);
  }

  public boolean isRequestEnabled() {
    return isEnabled(SUBMIT_REQUEST);
  }
}
