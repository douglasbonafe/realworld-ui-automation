import { userSettingsPage } from "../pages/UserSettingsPage";
import { primaryUser } from "../support/types";

/**
 * Profile settings.
 *
 * The interesting assertion is not "the form accepted my input" — it is "the
 * value survived a page reload", which is the only way to prove the change was
 * persisted rather than held in component state.
 */
describe("User settings", () => {
  beforeEach(() => {
    cy.loginByApi(primaryUser().username);
  });

  it("persists an updated profile across a reload", () => {
    const stamp = Date.now().toString().slice(-6);
    const updated = {
      firstName: `New${stamp}`,
      lastName: `Name${stamp}`,
      email: `qa.${stamp}@example.com`,
      phoneNumber: "6155551212",
    };

    // Wait on the actual network call rather than reloading blindly. Without
    // this the reload can win the race against the PATCH and the test fails for
    // a reason that has nothing to do with the feature.
    cy.intercept("PATCH", "**/users/*").as("updateUser");

    userSettingsPage.visit().fill(updated).save();
    cy.wait("@updateUser").its("response.statusCode").should("eq", 204);

    cy.reload();
    userSettingsPage.shouldHaveValues(updated);
  });

  it("blocks submission when a required field is cleared", () => {
    userSettingsPage.visit().clearFirstName().shouldHaveDisabledSubmit();
  });
});
