package dev.dsbon.realworld.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** Page object for /user/settings. */
public class UserSettingsPage extends BasePage {

  private static final By FORM = testId("user-settings-form");
  private static final By FIRST_NAME = testIdInput("user-settings-firstName-input");
  private static final By LAST_NAME = testIdInput("user-settings-lastName-input");
  private static final By EMAIL = testIdInput("user-settings-email-input");
  private static final By PHONE = testIdInput("user-settings-phoneNumber-input");
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
   * Submit and wait for the save to land.
   *
   * <p>Selenium cannot subscribe to the network the way Cypress's {@code
   * cy.intercept} or Playwright's {@code waitForResponse} can, so the wait has to
   * be expressed against the DOM. Re-enabling of the submit button is the app's
   * own signal that the in-flight request finished — still deterministic, just
   * one level less direct.
   */
  public UserSettingsPage save() {
    click(SUBMIT);
    wait.until(d -> d.findElement(SUBMIT).isEnabled());
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

  public void reload() {
    driver.navigate().refresh();
    visible(FORM);
  }

  public record Profile(String firstName, String lastName, String email, String phoneNumber) {}
}
