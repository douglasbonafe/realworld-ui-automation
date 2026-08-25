import { SEL } from "../support/selectors";

export interface ProfileFields {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

/** Page object for /user/settings. */
export class UserSettingsPage {
  visit(): this {
    cy.visit("/user/settings");
    cy.get(SEL.userSettings.form).should("be.visible");
    return this;
  }

  fill(fields: ProfileFields): this {
    cy.get(SEL.userSettings.firstName).clear().type(fields.firstName);
    cy.get(SEL.userSettings.lastName).clear().type(fields.lastName);
    cy.get(SEL.userSettings.email).clear().type(fields.email);
    cy.get(SEL.userSettings.phoneNumber).clear().type(fields.phoneNumber);
    return this;
  }

  save(): this {
    cy.get(SEL.userSettings.submit).click();
    return this;
  }

  shouldHaveValues(fields: ProfileFields): this {
    cy.get(SEL.userSettings.firstName).should("have.value", fields.firstName);
    cy.get(SEL.userSettings.lastName).should("have.value", fields.lastName);
    cy.get(SEL.userSettings.email).should("have.value", fields.email);
    cy.get(SEL.userSettings.phoneNumber).should("have.value", fields.phoneNumber);
    return this;
  }

  clearFirstName(): this {
    cy.get(SEL.userSettings.firstName).clear().blur();
    return this;
  }

  shouldHaveDisabledSubmit(): this {
    cy.get(SEL.userSettings.submit).should("be.disabled");
    return this;
  }
}

export const userSettingsPage = new UserSettingsPage();
