import { SEL } from "../support/selectors";

export interface NewAccount {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

/** Page object for /signup. */
export class SignUpPage {
  visit(): this {
    cy.visit("/signup");
    cy.get(SEL.signUp.title).should("be.visible");
    return this;
  }

  fill(account: NewAccount): this {
    cy.get(SEL.signUp.firstName).clear().type(account.firstName);
    cy.get(SEL.signUp.lastName).clear().type(account.lastName);
    cy.get(SEL.signUp.username).clear().type(account.username);
    cy.get(SEL.signUp.password).clear().type(account.password, { log: false });
    cy.get(SEL.signUp.confirmPassword).clear().type(account.password, { log: false });
    return this;
  }

  submit(): this {
    cy.get(SEL.signUp.submit).click();
    return this;
  }

  register(account: NewAccount): this {
    return this.fill(account).submit();
  }

  shouldHaveDisabledSubmit(): this {
    cy.get(SEL.signUp.submit).should("be.disabled");
    return this;
  }

  shouldHaveEnabledSubmit(): this {
    cy.get(SEL.signUp.submit).should("be.enabled");
    return this;
  }

  /**
   * Touch a required field and leave it empty.
   *
   * Formik starts with `isValid === true`, so the pristine form has an ENABLED
   * submit button. The guard only engages once a field has been touched and
   * failed validation — see SignInPage for the same behaviour.
   */
  touchAndClearFirstName(): this {
    cy.get(SEL.signUp.firstName).type("x").clear().blur();
    return this;
  }
}

export const signUpPage = new SignUpPage();
