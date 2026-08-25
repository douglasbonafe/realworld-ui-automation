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
}
