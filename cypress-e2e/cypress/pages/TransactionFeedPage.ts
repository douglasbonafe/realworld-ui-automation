import { SEL } from "../support/selectors";

export type FeedName = "everyone" | "friends" | "mine";

/**
 * The three transaction feeds behind the tabs on the home screen.
 *
 * "Everyone" is public, "Friends" is the contacts feed and "Mine" is the
 * personal feed. They share one component, so one page object covers all three.
 */
export class TransactionFeedPage {
  visit(): this {
    cy.visit("/");
    cy.get(SEL.nav.tabs).should("be.visible");
    return this;
  }

  openFeed(feed: FeedName): this {
    cy.get(SEL.nav[feed]).click();
    cy.waitForTransactionList();
    return this;
  }

  shouldHaveAtLeastOneTransaction(): this {
    cy.get(SEL.transactions.list).find("li").should("have.length.at.least", 1);
    return this;
  }

  /**
   * Assert that a transaction with the given description is present and shows
   * the expected formatted amount.
   *
   * The amount lives in a sibling element keyed by transaction id, so the lookup
   * walks up to the list item and back down — which is why the selector file
   * exposes `item`/`amount` as builders.
   */
  shouldContainTransaction(description: string, formattedAmount: string): this {
    cy.contains(SEL.transactions.list + " li", description)
      .should("be.visible")
      .within(() => {
        cy.contains(formattedAmount).should("be.visible");
      });
    return this;
  }

  openTransaction(description: string): this {
    cy.contains(SEL.transactions.list + " li", description).click();
    cy.get(SEL.transactions.detailHeader).should("be.visible");
    return this;
  }

  startNewTransaction(): this {
    cy.get(SEL.nav.newTransaction).click();
    return this;
  }
}

export const transactionFeedPage = new TransactionFeedPage();
