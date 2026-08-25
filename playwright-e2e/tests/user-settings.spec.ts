import { test } from "../fixtures/test";

/**
 * Profile settings.
 *
 * The interesting assertion is not "the form accepted my input" — it is "the
 * value survived a reload", the only thing that proves the change was persisted
 * rather than held in component state.
 */
test.describe("User settings", () => {
  // Serial, because both tests mutate the same shared account. Running them in
  // parallel would let one clear a field while the other is asserting on it.
  test.describe.configure({ mode: "serial" });

  test("persists an updated profile across a reload", async ({ page, userSettingsPage }) => {
    const stamp = Date.now().toString().slice(-6);
    const updated = {
      firstName: `New${stamp}`,
      lastName: `Name${stamp}`,
      email: `qa.${stamp}@example.com`,
      phoneNumber: "6155551212",
    };

    await userSettingsPage.goto();
    await userSettingsPage.fill(updated);
    await userSettingsPage.save(updated.firstName);

    await page.reload();
    await userSettingsPage.expectValues(updated);
  });

  test("blocks submission when a required field is cleared", async ({ userSettingsPage }) => {
    await userSettingsPage.goto();
    await userSettingsPage.clearFirstName();
    await userSettingsPage.expectSubmitDisabled();
  });
});
