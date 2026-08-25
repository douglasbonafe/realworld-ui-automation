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

    // Whole dollars, deliberately. The amount field is a currency-masked input
    // and the backend multiplies by 100 before storing, so a typed decimal does
    // not survive the round trip predictably. The application's own suite uses
    // whole amounts throughout for the same reason.
    newTransactionPage
      .visit()
      .selectContact(payee.id, payee.firstName)
      .enterPaymentDetails("25", description)
      .pay()
      .shouldShowConfirmation()
      .returnToTransactions();

    // A payment leaves the sender's balance, so it renders as a negative amount.
    transactionFeedPage.openFeed("mine").shouldContainTransaction(description, "-$25.00");
  });

  it("requests money from a contact and shows it as a pending request", () => {
    const payee = contactUser();
    const description = `Cypress request ${Date.now()}`;

    newTransactionPage
      .visit()
      .selectContact(payee.id, payee.firstName)
      .enterPaymentDetails("12", description)
      .request()
      .shouldShowConfirmation()
      .returnToTransactions();

    // A request moves money *towards* the sender, so the sign flips.
    transactionFeedPage.openFeed("mine").shouldContainTransaction(description, "+$12.00");
  });

  it("enables the submit buttons only while amount and description are valid", () => {
    const payee = contactUser();

    // This form behaves the OPPOSITE way to the sign-in and sign-up forms, and
    // the reason is one prop: TransactionCreateStepTwo passes
    // `validateOnMount={true}` to Formik, so validation runs before any
    // interaction and `isValid` starts false. The auth forms do not, so they
    // start valid — and enabled. Same `disabled={!isValid || isSubmitting}`
    // binding, opposite initial state.
    newTransactionPage
      .visit()
      .selectContact(payee.id, payee.firstName)
      .shouldHaveDisabledSubmit()
      .enterPaymentDetails("10", "Valid for now")
      .shouldHaveEnabledSubmit()
      .touchAndClearAmount()
      .shouldHaveDisabledSubmit();
  });

  it("finds a contact by first name through the search box", () => {
    const payee = contactUser();

    newTransactionPage.visit().selectContact(payee.id, payee.firstName);
  });
});
