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

  /**
   * Step 1 — pick a contact.
   *
   * <p>The search is debounced, so the list re-renders after the last keystroke.
   * A single click dispatched into that window lands on a node React is about to
   * replace and is silently lost — no exception, no navigation, and then a
   * timeout on the form that follows. {@code clickUntil} verifies the real
   * outcome (the payment form appeared) and re-clicks until it does.
   */
  public NewTransactionPage selectContact(String userId, String searchTerm) {
    fill(SEARCH, searchTerm);
    By item = By.cssSelector("[data-test='user-list-item-%s']".formatted(userId));
    clickUntil(item, d -> isVisible(d, FORM));
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

  /**
   * Waiting variants, for any state reached through an interaction.
   *
   * <p>Selenium assertions do not retry, so reading {@link #isPaymentEnabled}
   * immediately after typing reads the DOM before React has re-rendered.
   */
  public NewTransactionPage awaitSubmitEnabled() {
    awaitEnabled(SUBMIT_PAYMENT);
    awaitEnabled(SUBMIT_REQUEST);
    return this;
  }

  public NewTransactionPage awaitSubmitDisabled() {
    awaitDisabled(SUBMIT_PAYMENT);
    awaitDisabled(SUBMIT_REQUEST);
    return this;
  }

  /**
   * Touch the amount field and leave it empty.
   *
   * <p>Like every other form in this app the buttons are bound to
   * {@code disabled={!isValid || isSubmitting}} and Formik starts with
   * {@code isValid === true} — so a pristine form has ENABLED buttons.
   */
  public NewTransactionPage touchAndClearAmount() {
    fill(AMOUNT, "1");
    fill(AMOUNT, "");
    visible(DESCRIPTION).click();
    return this;
  }
}
