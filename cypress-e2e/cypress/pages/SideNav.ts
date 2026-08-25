import { SEL } from "../support/selectors";

/**
 * The left navigation drawer, present on every authenticated screen.
 *
 * Its presence is the cheapest reliable proof that a session exists, which is
 * why `shouldBeVisible()` doubles as the "I am logged in" assertion across the
 * suite.
 */
export class SideNav {
  shouldBeVisible(): this {
    cy.get(SEL.sideNav.root).should("be.visible");
    return this;
  }

  shouldShowUsername(username: string): this {
    cy.get(SEL.sideNav.username).should("contain.text", `@${username}`);
    return this;
  }

  shouldShowFullName(firstName: string, lastName: string): this {
    // The drawer abbreviates the surname to a single letter ("Ted P"), so the
    // assertion checks the first name plus that initial rather than the full
    // last name — matching what a user actually sees.
    cy.get(SEL.sideNav.fullName).should("contain.text", firstName).and("contain.text", lastName[0]);
    return this;
  }

  /** Balances render as a localized USD string, e.g. "$1,509.53". */
  shouldShowFormattedBalance(): this {
    cy.get(SEL.sideNav.balance)
      .invoke("text")
      .should("match", /^\$[\d,]+\.\d{2}$/);
    return this;
  }

  signOut(): this {
    cy.get(SEL.sideNav.signOut).click();
    return this;
  }

  goToSettings(): this {
    cy.get(SEL.sideNav.settings).click();
    return this;
  }

  goToHome(): this {
    cy.get(SEL.sideNav.home).click();
    return this;
  }
}

export const sideNav = new SideNav();
