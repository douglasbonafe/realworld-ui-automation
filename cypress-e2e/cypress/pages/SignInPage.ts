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

  goToSignUp(): this {
    cy.get(SEL.signUp.link).click();
    return this;
  }
}

export const signInPage = new SignInPage();
