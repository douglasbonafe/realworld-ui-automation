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

    // Whole dollars, deliberately. The amount field is a currency-masked input
    // and the backend multiplies by 100 before storing, so a typed decimal does
    // not survive the round trip predictably. The application's own suite uses
    // whole amounts throughout for the same reason.
    await newTransactionPage.goto();
    await newTransactionPage.selectContact(CONTACT_USER.id, CONTACT_USER.firstName);
    await newTransactionPage.enterDetails("25", description);
    await newTransactionPage.pay();
    await newTransactionPage.expectConfirmation();
    await newTransactionPage.backToFeeds();

    // A payment leaves the sender's balance, so it renders negative.
    await feedPage.openFeed("mine");
    await feedPage.expectTransaction(description, "-$25.00");
  });

  test("requests money from a contact and shows it as an incoming amount", async ({
    newTransactionPage,
    feedPage,
  }) => {
    const description = `Playwright request ${Date.now()}`;

    await newTransactionPage.goto();
    await newTransactionPage.selectContact(CONTACT_USER.id, CONTACT_USER.firstName);
    await newTransactionPage.enterDetails("12", description);
    await newTransactionPage.request();
    await newTransactionPage.expectConfirmation();
    await newTransactionPage.backToFeeds();

    // A request moves money towards the sender, so the sign flips.
    await feedPage.openFeed("mine");
    await feedPage.expectTransaction(description, "+$12.00");
  });

  test("enables the submit buttons only while amount and description are valid", async ({
    newTransactionPage,
  }) => {
    await newTransactionPage.goto();
    await newTransactionPage.selectContact(CONTACT_USER.id, CONTACT_USER.firstName);

    // This form behaves the OPPOSITE way to the sign-in and sign-up forms, and
    // the reason is one prop: TransactionCreateStepTwo passes
    // `validateOnMount={true}` to Formik, so validation runs before any
    // interaction and `isValid` starts false. The auth forms do not, so they
    // start valid — and enabled. Same binding, opposite initial state.
    await newTransactionPage.expectSubmitDisabled();

    await newTransactionPage.enterDetails("10", "Valid for now");
    await newTransactionPage.expectSubmitEnabled();

    await newTransactionPage.touchAndClearAmount();
    await newTransactionPage.expectSubmitDisabled();
  });
});
