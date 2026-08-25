import { SEL } from "../support/selectors";

/**
 * Page object for /signin.
 *
 * The rule this suite follows: a page object exposes *intent* ("sign in as this
 * person"), never raw locators. Tests read as product behaviour; when the markup
 * changes, only this file changes. Assertions that describe the page itself
 * (`shouldShowError`) live here too — assertions about business outcomes stay in
 * the spec.
 */
export class SignInPage {
  visit(): this {
    cy.visit("/signin");
    return this.shouldBeVisible();
  }

  shouldBeVisible(): this {
    cy.get(SEL.signIn.username).should("be.visible");
    cy.get(SEL.signIn.submit).should("be.visible");
    return this;
  }

  fillUsername(username: string): this {
    cy.get(SEL.signIn.username).clear().type(username);
    return this;
  }

  fillPassword(password: string): this {
    // `log: false` keeps the password out of the Cypress command log, the
    // screenshots and the CI output.
    cy.get(SEL.signIn.password).clear().type(password, { log: false });
    return this;
  }

  rememberMe(): this {
    // `.check()` rather than `.click()`: it asserts the element really is a
    // checkbox and is idempotent, so calling it twice cannot silently toggle
    // the box back off.
    cy.get(SEL.signIn.rememberMe).check();
    return this;
  }

  submit(): this {
    cy.get(SEL.signIn.submit).click();
    return this;
  }

  signInAs(username: string, password: string): this {
    return this.fillUsername(username).fillPassword(password).submit();
  }

  shouldShowError(message: string): this {
    cy.get(SEL.signIn.error).should("be.visible").and("contain.text", message);
    return this;
  }

  shouldHaveDisabledSubmit(): this {
    cy.get(SEL.signIn.submit).should("be.disabled");
    return this;
  }

  shouldHaveEnabledSubmit(): this {
    cy.get(SEL.signIn.submit).should("be.enabled");
    return this;
  }

  /**
   * Touch a field and leave it invalid, so Formik marks the form as invalid.
   *
   * The button is bound to `disabled={!isValid || isSubmitting}`, and Formik
   * starts with `isValid === true` — so a pristine form has an ENABLED button.
   * It only becomes disabled once a field has been touched and failed
   * validation. Typing then clearing then blurring is the shortest way to get
   * there, and is what the application's own suite does.
   */
  touchAndClearUsername(): this {
    cy.get(SEL.signIn.username).type("x").clear().blur();
    return this;
  }

  shouldShowUsernameRequired(): this {
    cy.get("#username-helper-text").should("be.visible").and("contain.text", "Username is required");
    return this;
  }

  shouldShowPasswordTooShort(): this {
    cy.get("#password-helper-text")
      .should("be.visible")
      .and("contain.text", "Password must contain at least 4 characters");
    return this;
  }

  typeShortPasswordAndBlur(): this {
    cy.get(SEL.signIn.password).type("abc").blur();
    return this;
  }

  goToSignUp(): this {
    cy.get(SEL.signUp.link).click();
    return this;
  }
}

export const signInPage = new SignInPage();
