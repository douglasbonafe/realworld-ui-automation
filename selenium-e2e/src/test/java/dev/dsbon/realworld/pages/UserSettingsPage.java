package dev.dsbon.realworld.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** Page object for /user/settings. */
public class UserSettingsPage extends BasePage {

  private static final By FORM = testId("user-settings-form");
  // testId, not testIdInput: all four settings fields pass the attribute through
  // `inputProps`, so it already sits on the <input>. Six fields in this app do
  // that — see the list in the Cypress selectors file.
  private static final By FIRST_NAME = testId("user-settings-firstName-input");
  private static final By LAST_NAME = testId("user-settings-lastName-input");
  private static final By EMAIL = testId("user-settings-email-input");
  private static final By PHONE = testId("user-settings-phoneNumber-input");
  private static final By SUBMIT = testId("user-settings-submit");

  public UserSettingsPage(WebDriver driver) {
    super(driver);
  }

  public UserSettingsPage open() {
    navigateTo("/user/settings");
    visible(FORM);
    return this;
  }

  public UserSettingsPage fill(Profile profile) {
    fill(FIRST_NAME, profile.firstName());
    fill(LAST_NAME, profile.lastName());
    fill(EMAIL, profile.email());
    fill(PHONE, profile.phoneNumber());
    return this;
  }

  /**
   * Submit, and do not return until the save has demonstrably landed.
   *
   * <p>Selenium cannot subscribe to the network the way Cypress's {@code
   * cy.intercept} or Playwright's {@code waitForResponse} can, so the wait has to
   * be expressed against the DOM. The first attempt here waited for the submit
   * button to re-enable — which is not a signal at all, because the button is
   * never disabled during the request. The wait returned instantly, the reload
   * beat the PATCH, and the test asserted the old values back.
   *
   * <p>The navigation drawer renders the current user's name, so it updating to
   * the new first name is a real, observable consequence of a <i>persisted</i>
   * save. One level less direct than asserting a 204, but genuinely
   * deterministic.
   */
  public UserSettingsPage save(String expectedFirstName) {
    click(SUBMIT);
    awaitTextContains(By.cssSelector("[data-test='sidenav-user-full-name']"), expectedFirstName);
    return this;
  }

  public Profile currentValues() {
    return new Profile(valueOf(FIRST_NAME), valueOf(LAST_NAME), valueOf(EMAIL), valueOf(PHONE));
  }

  public UserSettingsPage clearFirstName() {
    fill(FIRST_NAME, "");
    // Validation fires on blur, so move focus before asserting on the button.
    visible(LAST_NAME).click();
    return this;
  }

  public boolean isSubmitEnabled() {
    return isEnabled(SUBMIT);
  }

  /** Waits, because the button state changes through a React re-render. */
  public UserSettingsPage awaitSubmitDisabled() {
    awaitDisabled(SUBMIT);
    return this;
  }

  public void reload() {
    driver.navigate().refresh();
    visible(FORM);
  }

  public record Profile(String firstName, String lastName, String email, String phoneNumber) {}
}
