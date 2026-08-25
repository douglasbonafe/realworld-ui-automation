package dev.dsbon.realworld.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** Page object for /signup. */
public class SignUpPage extends BasePage {

  private static final By TITLE = testId("signup-title");
  private static final By FIRST_NAME = testIdInput("signup-first-name");
  private static final By LAST_NAME = testIdInput("signup-last-name");
  private static final By USERNAME = testIdInput("signup-username");
  private static final By PASSWORD = testIdInput("signup-password");
  private static final By CONFIRM_PASSWORD = testIdInput("signup-confirmPassword");
  private static final By SUBMIT = testId("signup-submit");

  public SignUpPage(WebDriver driver) {
    super(driver);
  }

  public SignUpPage open() {
    navigateTo("/signup");
    visible(TITLE);
    return this;
  }

  public SignUpPage register(NewAccount account) {
    fill(FIRST_NAME, account.firstName());
    fill(LAST_NAME, account.lastName());
    fill(USERNAME, account.username());
    fill(PASSWORD, account.password());
    fill(CONFIRM_PASSWORD, account.password());
    click(SUBMIT);
    return this;
  }

  public boolean isSubmitEnabled() {
    return isEnabled(SUBMIT);
  }

  /** Waits, because the button state changes through a React re-render. */
  public SignUpPage awaitSubmitDisabled() {
    awaitDisabled(SUBMIT);
    return this;
  }

  /**
   * Touch a required field and leave it empty.
   *
   * <p>Formik starts with {@code isValid === true}, so a pristine form has an
   * ENABLED submit button — the guard only engages once a field has been touched
   * and failed validation. Same behaviour as the sign-in form.
   */
  public SignUpPage touchAndClearFirstName() {
    fill(FIRST_NAME, "x");
    fill(FIRST_NAME, "");
    visible(LAST_NAME).click();
    return this;
  }

  /** The data a registration needs, kept as a record so tests read as data, not setters. */
  public record NewAccount(String firstName, String lastName, String username, String password) {}
}
