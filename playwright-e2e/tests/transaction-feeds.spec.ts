import { test, expect } from "../fixtures/test";
import { PRIMARY_USER } from "../fixtures/seed-users";
import type { FeedName } from "../pages/TransactionFeedPage";

/** The three transaction feeds. Read-only, so they can run in any order. */
test.describe("Transaction feeds", () => {
  const feeds: FeedName[] = ["everyone", "friends", "mine"];

  for (const feed of feeds) {
    test(`renders the "${feed}" feed with at least one transaction`, async ({ feedPage }) => {
      await feedPage.goto();
      await feedPage.openFeed(feed);
      await feedPage.expectNonEmpty();
    });
  }

  test("opens a transaction from the public feed and shows its detail page", async ({
    page,
    feedPage,
  }) => {
    await feedPage.goto();
    await feedPage.openFeed("everyone");
    await feedPage.openFirstTransaction();

    await expect(page).toHaveURL(/\/transaction\/.+/);
  });

  test("shows the signed-in user's identity and balance in the drawer", async ({
    feedPage,
    sideNav,
  }) => {
    await feedPage.goto();

    await sideNav.expectSignedInAs(PRIMARY_USER.username);
    await sideNav.expectFullName(PRIMARY_USER.firstName, PRIMARY_USER.lastName);
    await sideNav.expectFormattedBalance();
  });
});
