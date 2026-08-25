package dev.dsbon.realworld.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** Page object for /signin. */
public class SignInPage extends BasePage {

  private static final By USERNAME = testIdInput("signin-username");
  private static final By PASSWORD = testIdInput("signin-password");
  private static final By REMEMBER_ME = testIdInput("signin-remember-me");
  private static final By SUBMIT = testId("signin-submit");
  private static final By ERROR = testId("signin-error");
  private static final By SIGN_UP_LINK = testId("signup");

  public SignInPage(WebDriver driver) {
    super(driver);
  }

  public SignInPage open() {
    navigateTo("/signin");
    visible(USERNAME);
    return this;
  }

  public SignInPage awaitVisible() {
    visible(USERNAME);
    visible(SUBMIT);
    return this;
  }

  public SignInPage signInAs(String username, String password) {
    fill(USERNAME, username);
    fill(PASSWORD, password);
    click(SUBMIT);
    return this;
  }

  public SignInPage fillUsername(String username) {
    fill(USERNAME, username);
    return this;
  }

  public SignInPage rememberMe() {
    click(REMEMBER_ME);
    return this;
  }

  public SignInPage goToSignUp() {
    click(SIGN_UP_LINK);
    return this;
  }

  public String errorMessage() {
    return textOf(ERROR);
  }

  public boolean isSubmitEnabled() {
    return isEnabled(SUBMIT);
  }

  /**
   * Touch the username field and leave it empty, so Formik marks the form invalid.
   *
   * <p>The button is bound to {@code disabled={!isValid || isSubmitting}} and
   * Formik starts with {@code isValid === true} — a pristine form has an ENABLED
   * button. It only becomes disabled once a field has been touched and failed
   * validation.
   */
  public SignInPage touchAndClearUsername() {
    // Type first, then clear. Clearing an already-empty field fires no change
    // event, so Formik would never mark the field dirty and the assertion would
    // depend on blur alone. Typing guarantees the state transition.
    fill(USERNAME, "x");
    fill(USERNAME, "");
    // Blur by moving focus to the next field; validation fires on blur.
    visible(PASSWORD).click();
    return this;
  }

  public SignInPage typeShortPassword() {
    fill(PASSWORD, "abc");
    visible(USERNAME).click();
    return this;
  }

  public String usernameHelperText() {
    return textOf(By.id("username-helper-text"));
  }

  public String passwordHelperText() {
    return textOf(By.id("password-helper-text"));
  }
}
