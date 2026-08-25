import { test } from "../fixtures/test";
import { CONTACT_USER } from "../fixtures/seed-users";

/**
 * Sending money — the core business flow.
 *
 * Uses the authenticated `test` object, so the session comes free from the
 * setup project. These tests are about the payment wizard, not about login.
 */
test.describe("New transaction", () => {
  test("pays a contact and shows the payment in the sender's personal feed", async ({
    newTransactionPage,
    feedPage,
  }) => {
    // A unique description is what lets the assertion find *this* payment in a
    // feed that already holds hundreds of seeded ones.
    const description = `Playwright payment ${Date.now()}`;

    await newTransactionPage.goto();
    await newTransactionPage.selectContact(CONTACT_USER.id, CONTACT_USER.firstName);
    await newTransactionPage.enterDetails("25.50", description);
    await newTransactionPage.pay();
    await newTransactionPage.expectConfirmation();
    await newTransactionPage.backToFeeds();

    // A payment leaves the sender's balance, so it renders negative.
    await feedPage.openFeed("mine");
    await feedPage.expectTransaction(description, "-$25.50");
  });

  test("requests money from a contact and shows it as an incoming amount", async ({
    newTransactionPage,
    feedPage,
  }) => {
    const description = `Playwright request ${Date.now()}`;

    await newTransactionPage.goto();
    await newTransactionPage.selectContact(CONTACT_USER.id, CONTACT_USER.firstName);
    await newTransactionPage.enterDetails("12.00", description);
    await newTransactionPage.request();
    await newTransactionPage.expectConfirmation();
    await newTransactionPage.backToFeeds();

    // A request moves money towards the sender, so the sign flips.
    await feedPage.openFeed("mine");
    await feedPage.expectTransaction(description, "+$12.00");
  });

  test("keeps both submit buttons disabled until amount and description are filled", async ({
    newTransactionPage,
  }) => {
    await newTransactionPage.goto();
    await newTransactionPage.selectContact(CONTACT_USER.id, CONTACT_USER.firstName);
    await newTransactionPage.expectSubmitDisabled();

    await newTransactionPage.enterDetails("10.00", "");
    await newTransactionPage.expectSubmitDisabled();
  });
});
