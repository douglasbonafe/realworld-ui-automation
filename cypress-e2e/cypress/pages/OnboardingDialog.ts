import { SEL } from "../support/selectors";

/**
 * The first-run wizard shown to a user who has no bank account yet.
 *
 * It is modal, so it blocks every other interaction until it is completed or the
 * user signs out. Any test that registers a fresh account has to account for it.
 */
export class OnboardingDialog {
  shouldBeVisible(): this {
    cy.get(SEL.onboarding.dialog).should("be.visible");
    cy.get(SEL.onboarding.title).should("contain.text", "Get Started");
    return this;
  }

  next(): this {
    cy.get(SEL.onboarding.next).click();
    return this;
  }

  shouldNotExist(): this {
    cy.get(SEL.onboarding.dialog).should("not.exist");
    return this;
  }
}

export const onboarding = new OnboardingDialog();
