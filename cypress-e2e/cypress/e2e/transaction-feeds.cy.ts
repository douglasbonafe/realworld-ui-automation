import { transactionFeedPage } from "../pages/TransactionFeedPage";
import { sideNav } from "../pages/SideNav";
import { primaryUser } from "../support/types";

/**
 * The three transaction feeds.
 *
 * These are read-only tests, so they can share one session and run in any order.
 */
describe("Transaction feeds", () => {
  beforeEach(() => {
    cy.login(primaryUser().username);
    transactionFeedPage.visit();
  });

  const feeds = ["everyone", "friends", "mine"] as const;

  feeds.forEach((feed) => {
    it(`renders the "${feed}" feed with at least one transaction`, () => {
      transactionFeedPage.openFeed(feed).shouldHaveAtLeastOneTransaction();
    });
  });

  it("opens a transaction from the public feed and shows its detail page", () => {
    transactionFeedPage.openFeed("everyone");

    cy.get('[data-test="transaction-list"] li')
      .first()
      .click();

    cy.location("pathname").should("match", /^\/transaction\/.+/);
    cy.get('[data-test="transaction-detail-header"]').should("be.visible");
  });

  it("shows the signed-in user's identity and balance in the drawer", () => {
    const user = primaryUser();

    // Username, NOT the seeded first and last name.
    //
    // user-settings.cy.ts renames this shared account. Cypress runs specs
    // sequentially so this suite never lost the race, but the assertion was
    // still depending on data another spec owns — and the Selenium
    // implementation, whose classes run concurrently, lost it outright.
    //
    // The username is immutable in this app, so it identifies the session
    // without that dependency.
    sideNav.shouldShowUsername(user.username).shouldShowFormattedBalance();
  });
});
