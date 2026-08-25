import { newTransactionPage } from "../pages/NewTransactionPage";
import { transactionFeedPage } from "../pages/TransactionFeedPage";
import { contactUser, primaryUser } from "../support/types";

/**
 * Sending money — the core business flow of the application.
 *
 * Every test here logs in through the API, because the subject under test is the
 * payment wizard, not the login form.
 */
describe("New transaction", () => {
  beforeEach(() => {
    cy.login(primaryUser().username);
  });

  it("pays a contact and shows the payment in the sender's personal feed", () => {
    const payee = contactUser();
    // A unique description is what lets the assertion find *this* payment in a
    // feed that already contains hundreds of seeded ones.
    const description = `Cypress payment ${Date.now()}`;

    newTransactionPage
      .visit()
      .selectContact(payee.id, payee.firstName)
      .enterPaymentDetails("25.50", description)
      .pay()
      .shouldShowConfirmation()
      .returnToTransactions();

    // A payment leaves the sender's balance, so it renders as a negative amount.
    transactionFeedPage.openFeed("mine").shouldContainTransaction(description, "-$25.50");
  });

  it("requests money from a contact and shows it as a pending request", () => {
    const payee = contactUser();
    const description = `Cypress request ${Date.now()}`;

    newTransactionPage
      .visit()
      .selectContact(payee.id, payee.firstName)
      .enterPaymentDetails("12.00", description)
      .request()
      .shouldShowConfirmation()
      .returnToTransactions();

    // A request moves money *towards* the sender, so the sign flips.
    transactionFeedPage.openFeed("mine").shouldContainTransaction(description, "+$12.00");
  });

  it("disables both submit buttons once the amount is touched and left empty", () => {
    const payee = contactUser();

    // Pristine means ENABLED here — Formik starts with `isValid === true` and
    // the buttons are bound to `disabled={!isValid || isSubmitting}`. The guard
    // only engages after a field has been touched and failed validation.
    newTransactionPage
      .visit()
      .selectContact(payee.id, payee.firstName)
      .shouldHaveEnabledSubmit()
      .touchAndClearAmount()
      .shouldHaveDisabledSubmit();
  });

  it("finds a contact by first name through the search box", () => {
    const payee = contactUser();

    newTransactionPage.visit().selectContact(payee.id, payee.firstName);
  });
});
