import { SEL } from "../support/selectors";

/**
 * The three-step "new transaction" wizard at /transaction/new:
 *   1. pick a contact  2. enter amount + description  3. confirmation
 */
export class NewTransactionPage {
  visit(): this {
    cy.visit("/transaction/new");
    cy.get(SEL.newTransaction.userSearch).should("be.visible");
    return this;
  }

  /**
   * Step 1 — search for a contact and select them.
   *
   * The search is debounced and filters server-side, so the assertion waits for
   * the specific user's row to appear rather than for "the list to change".
   */
  selectContact(userId: string, searchTerm: string): this {
    cy.get(SEL.newTransaction.userSearch).clear().type(searchTerm);
    cy.get(SEL.newTransaction.userItem(userId)).should("be.visible").click();
    cy.get(SEL.newTransaction.form).should("be.visible");
    return this;
  }

  /**
   * Step 2 — amount is entered in dollars, e.g. "25.50".
   *
   * Empty strings are allowed and mean "leave this field blank": `cy.type("")`
   * throws, so the guard is what makes the negative validation tests possible.
   */
  enterPaymentDetails(amount: string, description: string): this {
    cy.get(SEL.newTransaction.amount).clear();
    if (amount) {
      cy.get(SEL.newTransaction.amount).type(amount);
    }
    cy.get(SEL.newTransaction.description).clear();
    if (description) {
      cy.get(SEL.newTransaction.description).type(description);
    }
    return this;
  }

  pay(): this {
    cy.get(SEL.newTransaction.submitPayment).click();
    return this;
  }

  request(): this {
    cy.get(SEL.newTransaction.submitRequest).click();
    return this;
  }

  /** Step 3 — the confirmation screen offers a link back to the feeds. */
  returnToTransactions(): this {
    cy.get(SEL.newTransaction.returnToTransactions).should("be.visible").click();
    return this;
  }

  shouldShowConfirmation(): this {
    cy.get(SEL.newTransaction.returnToTransactions).should("be.visible");
    cy.get(SEL.newTransaction.createAnother).should("be.visible");
    return this;
  }

  shouldHaveDisabledSubmit(): this {
    cy.get(SEL.newTransaction.submitPayment).should("be.disabled");
    cy.get(SEL.newTransaction.submitRequest).should("be.disabled");
    return this;
  }

  shouldHaveEnabledSubmit(): this {
    cy.get(SEL.newTransaction.submitPayment).should("be.enabled");
    cy.get(SEL.newTransaction.submitRequest).should("be.enabled");
    return this;
  }

  /**
   * Touch the amount field and leave it empty.
   *
   * Like every other form in this app, the buttons are bound to
   * `disabled={!isValid || isSubmitting}` and Formik starts with
   * `isValid === true` — so a pristine form has ENABLED buttons.
   */
  touchAndClearAmount(): this {
    cy.get(SEL.newTransaction.amount).type("1").clear().blur();
    return this;
  }
}

export const newTransactionPage = new NewTransactionPage();
